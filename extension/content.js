// extension/content.js
// Nero Chrome Extension - Content Script
// Injects Nero AI assistant into Web3 dApps

(function() {
  'use strict';

  // Configuration
  const API_ENDPOINT = 'http://localhost:3001/api';
  const SUPPORTED_PLATFORMS = {
    'uniswap.org': 'uniswap',
    'aave.com': 'aave',
    'movementnetwork.xyz': 'movement',
  };

  // Detect current platform
  function detectPlatform() {
    const hostname = window.location.hostname;
    for (const [domain, platformId] of Object.entries(SUPPORTED_PLATFORMS)) {
      if (hostname.includes(domain)) {
        return platformId;
      }
    }
    return 'unknown';
  }

  // Create Nero widget container
  function createNeroWidget() {
    const platformId = detectPlatform();
    
    if (platformId === 'unknown') {
      console.log('Nero: Platform not supported');
      return;
    }

    // Check if widget already exists
    if (document.getElementById('nero-widget-container')) {
      return;
    }

    console.log(`Nero: Initializing for ${platformId}`);

    // Create container
    const container = document.createElement('div');
    container.id = 'nero-widget-container';
    container.dataset.platform = platformId;
    
    // Create shadow DOM for style isolation
    const shadow = container.attachShadow({ mode: 'open' });

    // Load styles
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = chrome.runtime.getURL('nero-widget.css');
    shadow.appendChild(style);

    // Create widget HTML
    const widgetHTML = `
      <div class="nero-fab" id="nero-fab">
        <div class="nero-icon">🤖</div>
        <div class="nero-badge" id="nero-badge"></div>
      </div>

      <div class="nero-panel" id="nero-panel">
        <div class="nero-header">
          <div class="nero-header-content">
            <div class="nero-logo">🤖</div>
            <div class="nero-title-group">
              <div class="nero-title">Nero Sentinel</div>
              <div class="nero-subtitle" id="nero-platform"></div>
            </div>
          </div>
          <button class="nero-close" id="nero-close">✕</button>
        </div>

        <div class="nero-auth" id="nero-auth">
          <div class="nero-auth-content">
            <div class="nero-auth-icon">🔐</div>
            <h3>Connect to Nero</h3>
            <p>Sign in to access your AI companion and track your learning progress.</p>
            <button class="nero-auth-button" id="nero-connect">Connect Wallet</button>
          </div>
        </div>

        <div class="nero-chat" id="nero-chat" style="display: none;">
          <div class="nero-nft-info" id="nero-nft-info"></div>
          <div class="nero-messages" id="nero-messages"></div>
          <div class="nero-input-area">
            <input 
              type="text" 
              class="nero-input" 
              id="nero-input" 
              placeholder="Ask Nero anything..."
            />
            <button class="nero-send" id="nero-send">→</button>
          </div>
        </div>
      </div>
    `;

    const widgetWrapper = document.createElement('div');
    widgetWrapper.innerHTML = widgetHTML;
    shadow.appendChild(widgetWrapper);

    // Append to body
    document.body.appendChild(container);

    // Initialize widget
    initializeWidget(shadow, platformId);
  }

  // Initialize widget functionality
  function initializeWidget(shadow, platformId) {
    const fab = shadow.getElementById('nero-fab');
    const panel = shadow.getElementById('nero-panel');
    const closeBtn = shadow.getElementById('nero-close');
    const connectBtn = shadow.getElementById('nero-connect');
    const sendBtn = shadow.getElementById('nero-send');
    const input = shadow.getElementById('nero-input');
    const platformLabel = shadow.getElementById('nero-platform');

    // Set platform label
    platformLabel.textContent = platformId.toUpperCase() + ' Guide';

    // Toggle panel
    fab.addEventListener('click', () => {
      panel.classList.toggle('open');
    });

    closeBtn.addEventListener('click', () => {
      panel.classList.remove('open');
    });

    // Connect wallet
    connectBtn.addEventListener('click', async () => {
      await connectWallet(shadow, platformId);
    });

    // Send message
    const sendMessage = async () => {
      const message = input.value.trim();
      if (!message) return;

      await handleSendMessage(shadow, message, platformId);
      input.value = '';
    };

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });

    // Check if already authenticated
    checkAuthentication(shadow, platformId);
  }

  // Check authentication status
  async function checkAuthentication(shadow, platformId) {
    try {
      const { authToken } = await chrome.storage.local.get('authToken');
      
      if (authToken) {
        await loadUserSession(shadow, platformId, authToken);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
  }

  // Connect wallet using Privy
  async function connectWallet(shadow, platformId) {
    try {
      // Open Privy login in new window
      const loginUrl = `${API_ENDPOINT.replace('/api', '')}/login`;
      const loginWindow = window.open(loginUrl, 'nero-login', 'width=500,height=600');

      // Listen for authentication message
      window.addEventListener('message', async (event) => {
        if (event.data.type === 'nero-auth-success') {
          const { token, user } = event.data;
          
          // Store auth token
          await chrome.storage.local.set({ 
            authToken: token,
            user: user,
          });

          loginWindow.close();
          await loadUserSession(shadow, platformId, token);
        }
      });
    } catch (error) {
      console.error('Connect wallet error:', error);
    }
  }

  // Load user session and NFT data
  async function loadUserSession(shadow, platformId, authToken) {
    try {
      const response = await fetch(`${API_ENDPOINT}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        
        // Update UI to show chat
        shadow.getElementById('nero-auth').style.display = 'none';
        shadow.getElementById('nero-chat').style.display = 'flex';

        // Update NFT info
        updateNFTInfo(shadow, userData.nft);

        // Add welcome message
        addMessage(shadow, 'assistant', `Hello! I'm Nero, your ${platformId} guide. How can I help you today?`);
      }
    } catch (error) {
      console.error('Load session error:', error);
    }
  }

  // Update NFT information display
  function updateNFTInfo(shadow, nft) {
    const nftInfo = shadow.getElementById('nero-nft-info');
    if (!nft) return;

    const xpPercent = (nft.xp / nft.maxXP) * 100;

    nftInfo.innerHTML = `
      <div class="nft-level">Lvl ${nft.level}</div>
      <div class="nft-xp">
        <div class="nft-xp-bar">
          <div class="nft-xp-fill" style="width: ${xpPercent}%"></div>
        </div>
        <div class="nft-xp-text">${nft.xp} / ${nft.maxXP} XP</div>
      </div>
    `;
  }

  // Handle sending messages
  async function handleSendMessage(shadow, message, platformId) {
    const messagesContainer = shadow.getElementById('nero-messages');

    // Add user message
    addMessage(shadow, 'user', message);

    // Add typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'nero-message assistant typing';
    typingIndicator.innerHTML = `
      <div class="nero-typing">
        <span></span><span></span><span></span>
      </div>
    `;
    messagesContainer.appendChild(typingIndicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
      const { authToken } = await chrome.storage.local.get('authToken');
      
      const response = await fetch(`${API_ENDPOINT}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          message,
          platformId,
        }),
      });

      // Remove typing indicator
      typingIndicator.remove();

      if (response.ok) {
        const data = await response.json();
        addMessage(shadow, 'assistant', data.response);

        // Update XP if earned
        if (data.xpEarned > 0) {
          const badge = shadow.getElementById('nero-badge');
          badge.textContent = `+${data.xpEarned} XP`;
          badge.classList.add('show');
          setTimeout(() => badge.classList.remove('show'), 2000);
        }
      } else {
        addMessage(shadow, 'assistant', 'Sorry, I encountered an error. Please try again.');
      }
    } catch (error) {
      typingIndicator.remove();
      console.error('Send message error:', error);
      addMessage(shadow, 'assistant', 'Connection error. Please check your network.');
    }
  }

  // Add message to chat
  function addMessage(shadow, role, content) {
    const messagesContainer = shadow.getElementById('nero-messages');
    
    const messageEl = document.createElement('div');
    messageEl.className = `nero-message ${role}`;
    messageEl.innerHTML = `
      <div class="nero-message-content">${content}</div>
      <div class="nero-message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
    `;

    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createNeroWidget);
  } else {
    createNeroWidget();
  }

  console.log('🤖 Nero AI Companion loaded');
})();
