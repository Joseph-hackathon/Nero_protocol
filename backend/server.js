// backend/server.js
// Nero Protocol Backend Server
// Handles AI requests, Privy authentication, and x402 micropayments

const express = require('express');
const cors = require('cors');
const { Anthropic } = require('@anthropic-ai/sdk');
const { PrivyClient } = require('@privy-io/server-auth');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Anthropic Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Initialize Privy
const privy = new PrivyClient(
  process.env.PRIVY_APP_ID,
  process.env.PRIVY_APP_SECRET
);

// Movement Network Configuration
const MOVEMENT_CONFIG = {
  chainId: 177, // Movement M2 Testnet
  rpcUrl: 'https://mevm.devnet.imola.movementlabs.xyz',
  contractAddress: process.env.NERO_NFT_CONTRACT,
  treasuryAddress: process.env.TREASURY_ADDRESS,
};

// Database (use proper DB in production)
const sessionStore = new Map();
const nftStore = new Map();

// ============================================
// Authentication Middleware
// ============================================
async function authenticateUser(req, res, next) {
  try {
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!authToken) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const claims = await privy.verifyAuthToken(authToken);
    req.user = {
      id: claims.userId,
      walletAddress: claims.wallet?.address,
    };
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid authentication token' });
  }
}

// ============================================
// API Routes
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    network: 'Movement M2',
    version: '1.0.4-beta'
  });
});

// Get user profile and NFT status
app.get('/api/user/profile', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const walletAddress = req.user.walletAddress;

    // Get NFT data from blockchain
    const nftData = await getUserNFTData(walletAddress);

    res.json({
      userId,
      walletAddress,
      nft: nftData,
      freeQueriesRemaining: getFreeQueries(userId),
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Chat endpoint - Send message to Nero AI
app.post('/api/chat', authenticateUser, async (req, res) => {
  try {
    const { message, platformId, conversationHistory } = req.body;
    const userId = req.user.id;

    // Check query limits
    const canQuery = await checkQueryLimit(userId);
    if (!canQuery.allowed) {
      return res.status(402).json({ 
        error: 'Query limit reached',
        requiresPayment: true,
        cost: 0.001, // MOVE tokens
      });
    }

    // Get platform-specific context
    const platformContext = getPlatformContext(platformId);

    // Build conversation with context
    const messages = [
      {
        role: 'user',
        content: `You are Nero, an AI assistant specialized in helping users learn about ${platformContext.name}. 
        
Platform Info:
${platformContext.description}

User Question: ${message}`
      }
    ];

    // Add conversation history if exists
    if (conversationHistory && conversationHistory.length > 0) {
      messages.unshift(...conversationHistory);
    }

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: messages,
    });

    const aiResponse = response.content[0].text;

    // Update XP for paid queries
    if (canQuery.paid) {
      await incrementNFTXP(userId, 10); // 10 XP per paid query
    }

    // Decrement free queries or process payment
    await processQuery(userId, canQuery.paid);

    res.json({
      response: aiResponse,
      xpEarned: canQuery.paid ? 10 : 0,
      queryType: canQuery.paid ? 'paid' : 'free',
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Mint or get Nero NFT
app.post('/api/nft/mint', authenticateUser, async (req, res) => {
  try {
    const { platformId } = req.body;
    const userId = req.user.id;
    const walletAddress = req.user.walletAddress;

    // Check if user already has NFT for this platform
    const existingNFT = await checkExistingNFT(walletAddress, platformId);
    
    if (existingNFT) {
      return res.json({ 
        success: true, 
        nft: existingNFT,
        message: 'NFT already exists'
      });
    }

    // Mint new NFT
    const nft = await mintNeroNFT(walletAddress, platformId);

    res.json({
      success: true,
      nft: nft,
      transactionHash: nft.txHash,
    });

  } catch (error) {
    console.error('Mint error:', error);
    res.status(500).json({ error: 'Failed to mint NFT' });
  }
});

// Get NFT metadata
app.get('/api/nft/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    const metadata = await getNFTMetadata(tokenId);
    res.json(metadata);
  } catch (error) {
    console.error('NFT metadata error:', error);
    res.status(500).json({ error: 'Failed to fetch NFT metadata' });
  }
});

// Process x402 payment
app.post('/api/payment/process', authenticateUser, async (req, res) => {
  try {
    const { amount, queryCount } = req.body;
    const userId = req.user.id;
    const walletAddress = req.user.walletAddress;

    // Verify payment through x402 protocol
    const paymentResult = await processX402Payment(walletAddress, amount);

    if (paymentResult.success) {
      // Credit queries to user
      await creditQueries(userId, queryCount);

      res.json({
        success: true,
        transactionHash: paymentResult.txHash,
        queriesAdded: queryCount,
      });
    } else {
      res.status(400).json({ error: 'Payment failed' });
    }

  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// ============================================
// Helper Functions
// ============================================

function getPlatformContext(platformId) {
  const platforms = {
    uniswap: {
      name: 'Uniswap',
      description: 'Decentralized exchange protocol for swapping tokens. Focuses on automated market making (AMM) and liquidity pools.',
    },
    aave: {
      name: 'Aave',
      description: 'Decentralized lending and borrowing protocol. Users can earn interest on deposits or borrow assets.',
    },
    movement: {
      name: 'Movement Network',
      description: 'M2 blockchain using MoveVM. High-performance Layer 2 with Move language smart contracts.',
    },
  };

  return platforms[platformId] || platforms.movement;
}

async function checkQueryLimit(userId) {
  const freeQueries = getFreeQueries(userId);
  
  if (freeQueries > 0) {
    return { allowed: true, paid: false };
  }

  // Check if user has paid query credits
  const paidQueries = getPaidQueries(userId);
  if (paidQueries > 0) {
    return { allowed: true, paid: true };
  }

  return { allowed: false, paid: false };
}

function getFreeQueries(userId) {
  const today = new Date().toDateString();
  const userSession = sessionStore.get(userId) || {};
  
  if (userSession.date !== today) {
    userSession.date = today;
    userSession.freeQueries = 10; // Reset daily
    sessionStore.set(userId, userSession);
  }

  return userSession.freeQueries || 0;
}

function getPaidQueries(userId) {
  const userSession = sessionStore.get(userId) || {};
  return userSession.paidQueries || 0;
}

async function processQuery(userId, isPaid) {
  const userSession = sessionStore.get(userId) || {};
  
  if (isPaid) {
    userSession.paidQueries = (userSession.paidQueries || 0) - 1;
  } else {
    userSession.freeQueries = (userSession.freeQueries || 10) - 1;
  }

  sessionStore.set(userId, userSession);
}

async function creditQueries(userId, count) {
  const userSession = sessionStore.get(userId) || {};
  userSession.paidQueries = (userSession.paidQueries || 0) + count;
  sessionStore.set(userId, userSession);
}

// Blockchain interaction functions (implement with Movement SDK)
async function getUserNFTData(walletAddress) {
  // TODO: Implement Movement blockchain interaction
  return {
    tokenId: '1',
    level: 1,
    xp: 0,
    maxXP: 500,
    platformId: 'uniswap',
  };
}

async function checkExistingNFT(walletAddress, platformId) {
  // TODO: Query Movement blockchain
  return null;
}

async function mintNeroNFT(walletAddress, platformId) {
  // TODO: Implement NFT minting on Movement
  return {
    tokenId: Date.now().toString(),
    txHash: '0x' + Math.random().toString(16).substr(2, 64),
  };
}

async function getNFTMetadata(tokenId) {
  // TODO: Fetch from blockchain
  return {
    tokenId,
    name: 'Nero Agent #' + tokenId,
    image: 'ipfs://...',
    attributes: [
      { trait_type: 'Level', value: '1' },
      { trait_type: 'XP', value: '0' },
    ],
  };
}

async function incrementNFTXP(userId, xpAmount) {
  // TODO: Update NFT XP on blockchain
  console.log(`Adding ${xpAmount} XP to user ${userId}`);
}

async function processX402Payment(walletAddress, amount) {
  // TODO: Implement x402 micropayment streaming
  return {
    success: true,
    txHash: '0x' + Math.random().toString(16).substr(2, 64),
  };
}

// ============================================
// Start Server
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Nero Protocol Backend running on port ${PORT}`);
  console.log(`🔗 Network: Movement M2 (Chain ID: ${MOVEMENT_CONFIG.chainId})`);
  console.log(`📡 RPC: ${MOVEMENT_CONFIG.rpcUrl}`);
});

module.exports = app;
