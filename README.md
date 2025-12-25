# Nero Protocol - AI-Powered Web3 Companion

<div align="center">
  
  ![Nero Protocol](https://img.shields.io/badge/Nero-v1.0.4-blue)
  ![Movement M2](https://img.shields.io/badge/Movement-M2-purple)
  ![License](https://img.shields.io/badge/license-MIT-green)

  **The AI companion for Movement Native Apps**

  [Demo](https://nero-protocol.vercel.app) • [Docs](#documentation) • [SDK](#sdk-integration) • [Discord](https://discord.gg/nero)

</div>

## 🌟 Overview

Nero Protocol is an AI-powered onboarding companion built for the Movement Network ecosystem. It helps users navigate complex Web3 dApps through real-time AI guidance powered by Claude, while earning XP through an innovative NFT evolution system.

### Key Features

- 🤖 **AI Sentinel**: Claude-powered intelligent assistant specialized in Movement, MoveVM, and individual dApps
- 🎮 **Dynamic NFTs**: Learning companions that evolve as you interact and learn
- 💰 **x402 Micropayments**: Pay-per-query model with real-time MOVE token streaming
- 🔧 **Developer SDK**: Simple integration for any dApp with customizable branding
- 🌐 **Chrome Extension**: Browser extension for seamless Web3 navigation

## 📁 Project Structure

```
nero-protocol/
├── frontend/              # Landing pages and user interface
│   ├── index.html        # Main landing page
│   ├── sdk.html          # Live SDK simulator
│   ├── developers.html   # Developer documentation
│   ├── pricing.html      # Pricing information
│   └── sdk/              # React SDK components
│       ├── NeroWidget.tsx
│       └── NeroWidget.css
├── backend/              # Node.js API server
│   ├── server.js         # Express server with Privy & Claude integration
│   ├── package.json
│   └── .env.example
├── contracts/            # Move smart contracts
│   ├── sources/
│   │   └── nero_nft.move # NFT evolution contract
│   └── Move.toml
└── extension/            # Chrome extension
    ├── manifest.json
    ├── content.js
    └── background.js
```

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- Movement CLI (for smart contract deployment)
- Privy account
- Anthropic API key

### 1. Clone Repository

```bash
git clone https://github.com/your-org/nero-protocol.git
cd nero-protocol
```

### 2. Backend Setup

```bash
cd backend
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your API keys:
# - ANTHROPIC_API_KEY
# - PRIVY_APP_ID
# - PRIVY_APP_SECRET

# Start server
npm run dev
```

### 3. Deploy Smart Contracts

```bash
cd contracts

# Initialize Movement account
movement account create --account nero_deployer

# Fund account (testnet)
movement account fund-with-faucet --account nero_deployer

# Compile contracts
movement move compile

# Deploy
movement move publish --named-addresses nero_protocol=nero_deployer
```

### 4. Frontend Development

```bash
cd frontend

# Serve locally
python3 -m http.server 3000
# or use any static server

# Open http://localhost:3000
```

### 5. Chrome Extension (Optional)

```bash
cd extension

# Load unpacked extension in Chrome:
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the extension/ folder
```

## 📚 Documentation

### Architecture

```
User Browser
    ↓
Nero Widget (React SDK)
    ↓
Backend API Server
    ├→ Claude API (AI responses)
    ├→ Privy (Authentication)
    └→ Movement Network
        ├→ Nero NFT Contract
        └→ x402 Payment Protocol
```

### Data Flow

1. **User Authentication**: Privy embedded wallet with social login
2. **NFT Minting**: User mints platform-specific learning companion NFT
3. **Query Processing**:
   - Free tier: 10 queries/day
   - Paid tier: Micropayments via x402 protocol
4. **XP System**: Queries earn XP → NFT levels up → Unlock advanced features

## 🔧 SDK Integration

Add Nero to your dApp with just a few lines:

### HTML Integration

```html
<!-- Add Nero widget script -->
<script
  src="https://cdn.nero.ai/widget/v1.js"
  data-platform-id="your_platform_id"
  data-theme="light"
  data-primary-color="#6366f1"
  async
></script>
```

### React Integration

```tsx
import { NeroWidget } from '@nero-protocol/react-sdk';

function App() {
  return (
    <div>
      {/* Your dApp */}
      
      <NeroWidget
        platformId="uniswap"
        theme="light"
        primaryColor="#6366f1"
        position="bottom-right"
      />
    </div>
  );
}
```

### Customization Options

| Option | Type | Description |
|--------|------|-------------|
| `platformId` | string | Unique identifier for your dApp |
| `theme` | 'light' \| 'dark' | UI theme |
| `primaryColor` | string | Brand color (hex) |
| `position` | string | Widget position on screen |
| `apiEndpoint` | string | Custom API endpoint |

## 💎 NFT Evolution System

### Level Tiers

| Level | XP Required | Features Unlocked |
|-------|-------------|-------------------|
| 1 - Newbie | 0 | Basic Q&A, limited queries |
| 2 - Learner | 500 | Enhanced responses |
| 3 - Explorer | 1,250 | Priority support |
| 4 - Advanced | 2,875 | Custom training data |
| 5 - Expert | 6,312 | API access |
| 6+ - Master | Varies | DAO governance, revenue share |

### XP Mechanics

- **Free Queries**: No XP earned
- **Paid Queries**: 10 XP per query
- **Complex Queries**: Up to 50 XP
- **Tutorial Completion**: 100 XP
- **Referrals**: 200 XP per user

## 💰 Pricing

### User Tiers

- **Free Daily**: 10 questions/day
- **Pay-as-you-go**: $0.001-0.01 per query
- **NFT Evolution**: $1-10 per level unlock

### Revenue Model

- 70% to treasury (protocol development)
- 20% to dApp partner
- 10% to NFT holder rewards

## 🔐 Security

- **Authentication**: Privy embedded wallets with MFA
- **API Security**: JWT tokens, rate limiting
- **Smart Contracts**: Audited Move code
- **Data Privacy**: No conversation history stored

## 🛠️ Technology Stack

### Frontend
- HTML5, CSS3, Vanilla JS
- React + TypeScript (SDK)
- Tailwind CSS equivalent styling

### Backend
- Node.js + Express
- Anthropic Claude API
- Privy Server SDK
- Ethers.js (Movement integration)

### Blockchain
- Movement M2 (MoveVM)
- Move language smart contracts
- x402 micropayment protocol

### Infrastructure
- Vercel (frontend hosting)
- Railway/Render (backend)
- IPFS (NFT metadata)

## 📊 Metrics & Analytics

Track your integration performance:

- Total queries processed
- User retention rates
- Average XP per user
- Revenue generated
- Most asked questions

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md).

### Development Workflow

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

## 🙏 Acknowledgments

- Movement Labs for the M2 testnet
- Anthropic for Claude API
- Privy for authentication infrastructure
- Movement x Privy Hackathon organizers

## 📞 Contact

- Website: [nero-protocol.xyz](https://nero-protocol.xyz)
- Twitter: [@NeroProtocol](https://twitter.com/NeroProtocol)
- Discord: [Join our community](https://discord.gg/nero)
- Email: team@nero-protocol.xyz

## 🗺️ Roadmap

### Q1 2025
- [x] MVP Launch
- [x] Movement M2 Integration
- [ ] Mainnet Deployment
- [ ] 5 dApp Integrations

### Q2 2025
- [ ] Advanced NFT Features
- [ ] DAO Governance
- [ ] Mobile App
- [ ] Multi-chain Support

### Q3 2025
- [ ] AI Personalization
- [ ] Voice Interface
- [ ] Enterprise Solutions
- [ ] 50+ dApp Integrations

---

<div align="center">
  
  **Built with ❤️ for the Movement ecosystem**
  
  [Website](https://nero-protocol.xyz) • [Twitter](https://twitter.com/NeroProtocol) • [Discord](https://discord.gg/nero)

</div>
