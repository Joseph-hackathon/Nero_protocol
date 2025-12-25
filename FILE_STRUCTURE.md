# Nero Protocol - Complete File Structure

## 📁 전체 파일 목록

```
nero-protocol/
│
├── 📄 README.md                          # 프로젝트 메인 문서
├── 📄 PROJECT_OVERVIEW.md                # 프로젝트 개요 (한국어)
├── 📄 DEPLOYMENT.md                      # 배포 가이드
├── 📄 QUICK_START.md                     # Vercel 빠른 시작
├── 📄 VERCEL_TROUBLESHOOTING.md         # Vercel 오류 해결
├── 🔧 deploy-fix.sh                      # 자동 배포 스크립트
│
├── 🎨 frontend/                          # 프론트엔드 (HTML/CSS/JS)
│   ├── index.html                        # 메인 랜딩 페이지
│   ├── sdk.html                          # 시뮬레이터 페이지
│   ├── developers.html                   # 개발자 문서
│   ├── pricing.html                      # 가격 정책
│   ├── package.json                      # NPM 설정
│   ├── vercel.json                       # Vercel 배포 설정
│   └── sdk/                              # React SDK
│       ├── NeroWidget.tsx                # 위젯 컴포넌트
│       └── NeroWidget.css                # 위젯 스타일
│
├── 🔌 backend/                           # 백엔드 API (Node.js)
│   ├── server.js                         # Express 서버
│   ├── package.json                      # 의존성
│   ├── .env.example                      # 환경 변수 템플릿
│   └── vercel.json                       # Vercel 설정
│
├── ⛓️ contracts/                         # 스마트 컨트랙트 (Move)
│   ├── Move.toml                         # Move 프로젝트 설정
│   └── sources/
│       └── nero_nft.move                 # NFT 컨트랙트
│
└── 🔌 extension/                         # Chrome 확장 프로그램
    ├── manifest.json                     # 확장 프로그램 설정
    ├── content.js                        # 컨텐츠 스크립트
    └── background.js                     # (생성 필요)
```

## 📊 파일별 설명

### Frontend Files

| 파일 | 라인 수 | 용도 |
|------|--------|------|
| `index.html` | ~200 | 메인 랜딩 페이지, 히어로 섹션 |
| `sdk.html` | ~350 | 시뮬레이터 (User/Admin View) |
| `developers.html` | ~250 | 개발자 통합 가이드 |
| `pricing.html` | ~150 | 가격 정책 및 티어 |
| `NeroWidget.tsx` | ~250 | React SDK 컴포넌트 |
| `NeroWidget.css` | ~400 | 위젯 전체 스타일 |

### Backend Files

| 파일 | 라인 수 | 용도 |
|------|--------|------|
| `server.js` | ~350 | API 서버, Claude/Privy 통합 |
| `package.json` | ~25 | NPM 의존성 정의 |

### Smart Contract Files

| 파일 | 라인 수 | 용도 |
|------|--------|------|
| `nero_nft.move` | ~350 | NFT 진화 시스템 |

### Extension Files

| 파일 | 라인 수 | 용도 |
|------|--------|------|
| `manifest.json` | ~50 | Chrome 확장 설정 |
| `content.js` | ~250 | dApp 주입 스크립트 |

## 📝 핵심 기능별 파일 매핑

### 1️⃣ 사용자 인터페이스
- `frontend/index.html` - 랜딩
- `frontend/sdk.html` - 시뮬레이터
- `frontend/sdk/NeroWidget.tsx` - 위젯

### 2️⃣ AI 채팅
- `backend/server.js` - Claude API 통합
- `frontend/sdk/NeroWidget.tsx` - UI

### 3️⃣ NFT 시스템
- `contracts/sources/nero_nft.move` - 스마트 컨트랙트
- `backend/server.js` - 민팅 로직

### 4️⃣ 인증
- `backend/server.js` - Privy 통합
- `frontend/sdk/NeroWidget.tsx` - 로그인 UI

### 5️⃣ Chrome 확장
- `extension/manifest.json` - 설정
- `extension/content.js` - 주입 로직

## 🚀 빌드 결과물

### Production Build
```
dist/
├── frontend/
│   ├── index.html
│   ├── sdk.html
│   ├── developers.html
│   └── pricing.html
├── backend/
│   └── server.js (+ node_modules)
└── extension/
    └── nero-extension-v1.0.4.zip
```

## 📦 배포 대상

| 컴포넌트 | 플랫폼 | URL |
|---------|--------|-----|
| Frontend | Vercel | https://nero-protocol.vercel.app |
| Backend | Railway | https://nero-api.railway.app |
| Contracts | Movement M2 | 0x... |
| Extension | Chrome Store | chrome.google.com/webstore |

## 💾 총 프로젝트 크기

- 전체: ~2.5 MB
- Frontend: ~500 KB
- Backend: ~1.5 MB (node_modules 제외)
- Contracts: ~50 KB
- Extension: ~200 KB
- Docs: ~200 KB

