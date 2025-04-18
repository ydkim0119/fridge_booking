# 냉장고 예약 시스템

학교 내 냉장고 장비를 예약하고 관리하기 위한 웹 애플리케이션입니다.

## 주요 기능

1. **캘린더 기반 예약 시스템**
   - 월간, 주간, 일간 뷰로 예약 확인 가능
   - 장비 및 사용자별 필터링 기능
   - 예약 생성, 수정, 삭제 기능

2. **사용자 관리**
   - 회원가입 및 로그인
   - 프로필 관리
   - 관리자/일반 사용자 권한 분리

3. **장비 관리**
   - 다양한 냉장고 장비 등록 및 관리
   - 장비별 색상 구분

4. **통계 및 대시보드**
   - 장비/사용자별 사용 통계
   - 시간대/요일별 사용 패턴 분석

## 개발 환경

- **프론트엔드**: React, Vite, TailwindCSS, FullCalendar
- **백엔드**: Node.js, Express
- **배포**: Render.com

## 설치 및 실행 방법

### 요구사항

- Node.js (v16 이상)
- npm 또는 yarn

### 로컬 개발 환경 설정

1. 저장소 클론:
   ```bash
   git clone https://github.com/ydkim0119/fridge_booking.git
   cd fridge_booking
   ```

2. 클라이언트 의존성 설치 및 실행:
   ```bash
   cd client
   npm install
   npm run dev
   ```

3. 서버 의존성 설치 및 실행 (새 터미널에서):
   ```bash
   cd server
   npm install
   npm run dev
   ```

4. 브라우저에서 애플리케이션 접속:
   - 클라이언트: http://localhost:3000
   - 서버: http://localhost:5000

## 모바일 접속 방법

현재 내부망에서 서비스를 제공하고 있으며, 다음과 같은 방법으로 모바일에서도 접속 가능합니다:

1. 내부망에 연결된 Wi-Fi에 접속
2. 브라우저를 통해 서비스 URL에 접속
3. 반응형 UI로 모바일에서도 편리하게 이용 가능

## 기여 방법

1. 이 저장소를 포크합니다.
2. 새 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다.

## 배포

이 프로젝트는 Render.com을 통해 배포되고 있습니다:

1. Render 대시보드에서 새 서비스 생성
2. GitHub 저장소 연결
3. 빌드 명령어 설정: `cd client && npm install && npm run build && cd ../server && npm install`
4. 시작 명령어 설정: `cd server && node src/index.js`
5. 환경 변수 설정: `NODE_ENV=production`
