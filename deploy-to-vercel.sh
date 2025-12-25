#!/bin/bash
# Nero Protocol - Vercel 배포 자동화 스크립트

echo "🚀 Nero Protocol Vercel 배포 스크립트"
echo "====================================="
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# frontend 폴더 확인
if [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Error: frontend 폴더를 찾을 수 없습니다.${NC}"
    echo "nero-protocol 루트 디렉토리에서 실행해주세요."
    exit 1
fi

echo -e "${GREEN}✅ frontend 폴더 발견${NC}"
echo ""

# frontend로 이동
cd frontend

# 필수 파일 확인
echo "📋 필수 파일 확인 중..."
files=("index.html" "sdk.html" "developers.html" "pricing.html" "vercel.json")
all_files_exist=true

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}  ✅ $file${NC}"
    else
        echo -e "${RED}  ❌ $file (없음)${NC}"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = false ]; then
    echo -e "${RED}❌ 필수 파일이 누락되었습니다.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ 모든 필수 파일이 준비되었습니다!${NC}"
echo ""

# Vercel CLI 확인
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI가 설치되지 않았습니다.${NC}"
    echo "설치하시겠습니까? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "Vercel CLI 설치 중..."
        npm install -g vercel
    else
        echo -e "${RED}❌ Vercel CLI가 필요합니다.${NC}"
        echo "수동 설치: npm install -g vercel"
        exit 1
    fi
fi

echo ""
echo "🎯 배포 옵션을 선택하세요:"
echo "1) Production 배포 (권장)"
echo "2) Preview 배포 (테스트용)"
echo "3) 로컬 테스트만"
echo ""
read -p "선택 (1-3): " choice

case $choice in
    1)
        echo ""
        echo -e "${GREEN}🚀 Production 배포를 시작합니다...${NC}"
        echo ""
        vercel --prod
        
        if [ $? -eq 0 ]; then
            echo ""
            echo -e "${GREEN}✅ 배포 성공!${NC}"
            echo ""
            echo "다음 URL에서 확인하세요:"
            echo "- https://your-site.vercel.app/"
            echo "- https://your-site.vercel.app/sdk"
            echo "- https://your-site.vercel.app/developers"
            echo "- https://your-site.vercel.app/pricing"
        else
            echo -e "${RED}❌ 배포 실패${NC}"
            echo ""
            echo "해결 방법:"
            echo "1. Vercel Dashboard → Settings → Root Directory = 'frontend'"
            echo "2. Framework Preset = 'Other'"
            echo "3. Build Command = (비워두기)"
        fi
        ;;
        
    2)
        echo ""
        echo -e "${YELLOW}🔍 Preview 배포를 시작합니다...${NC}"
        echo ""
        vercel
        
        if [ $? -eq 0 ]; then
            echo ""
            echo -e "${GREEN}✅ Preview 배포 성공!${NC}"
            echo "미리보기 URL에서 테스트하세요."
        fi
        ;;
        
    3)
        echo ""
        echo -e "${YELLOW}🖥️  로컬 테스트 서버를 시작합니다...${NC}"
        echo ""
        echo "http://localhost:8000 에서 확인하세요"
        echo "종료: Ctrl+C"
        echo ""
        python3 -m http.server 8000
        ;;
        
    *)
        echo -e "${RED}잘못된 선택입니다.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}완료!${NC}"
