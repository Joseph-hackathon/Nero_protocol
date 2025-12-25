#!/bin/bash
# Nero Protocol - Quick Vercel Deployment Fix

echo "🔧 Nero Protocol Vercel 배포 수정 스크립트"
echo "=========================================="

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend 폴더를 찾을 수 없습니다."
    echo "nero-protocol 루트 디렉토리에서 실행해주세요."
    exit 1
fi

echo ""
echo "Option을 선택하세요:"
echo "1) 프론트엔드만 Vercel에 정적 사이트로 배포"
echo "2) 백엔드를 Railway에 배포"
echo "3) 로컬 테스트 서버 실행"
echo ""
read -p "선택 (1-3): " choice

case $choice in
    1)
        echo ""
        echo "📦 프론트엔드를 Vercel에 배포합니다..."
        cd frontend
        
        # Vercel이 설치되어 있는지 확인
        if ! command -v vercel &> /dev/null; then
            echo "Vercel CLI를 설치합니다..."
            npm install -g vercel
        fi
        
        echo "Vercel에 배포 중..."
        vercel --prod
        
        echo "✅ 배포 완료!"
        echo ""
        echo "다음을 확인하세요:"
        echo "1. Vercel Dashboard → Settings → General"
        echo "2. Framework Preset: Other"
        echo "3. Build Command: (비워두기)"
        echo "4. Output Directory: ."
        ;;
        
    2)
        echo ""
        echo "🚂 백엔드를 Railway에 배포합니다..."
        cd backend
        
        # Railway CLI 설치 확인
        if ! command -v railway &> /dev/null; then
            echo "Railway CLI를 설치합니다..."
            npm install -g @railway/cli
        fi
        
        echo "Railway 로그인이 필요합니다..."
        railway login
        
        echo "프로젝트 초기화..."
        railway init
        
        echo "배포 중..."
        railway up
        
        echo ""
        echo "⚠️  환경 변수를 설정해야 합니다:"
        echo "railway variables set ANTHROPIC_API_KEY=your_key"
        echo "railway variables set PRIVY_APP_ID=your_id"
        echo "railway variables set PRIVY_APP_SECRET=your_secret"
        ;;
        
    3)
        echo ""
        echo "🖥️  로컬 테스트 서버를 실행합니다..."
        cd frontend
        
        echo "http://localhost:8000 에서 서버를 시작합니다..."
        python3 -m http.server 8000
        ;;
        
    *)
        echo "잘못된 선택입니다."
        exit 1
        ;;
esac
