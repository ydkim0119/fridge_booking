# 냉장고 예약 시스템 (Fridge Booking System)

냉장고 및 장비 예약 관리를 위한 웹 애플리케이션입니다. React와 Node.js를 사용하여 개발되었으며, MongoDB를 데이터베이스로 사용합니다.

## 기능

- 캘린더 형식의 예약 시스템 (월, 주 단위로 확인 가능)
- 사용자 및 장비별 예약 필터링
- 사용자 인증 및 권한 관리
- 장비 관리 기능
- 통계 및 대시보드
- 모바일 지원 (반응형 디자인)

## 프로젝트 구조

```
fridge_booking/
├── client/               # React 프론트엔드
│   ├── src/              # 소스 코드
│   ├── public/           # 정적 파일
│   └── package.json      # 의존성 및 스크립트
├── server/               # Node.js 백엔드
│   ├── src/              # 소스 코드
│   │   ├── models/       # MongoDB 모델
│   │   ├── routes/       # API 라우트
│   │   ├── utils/        # 유틸리티 함수
│   │   └── index.js      # 서버 진입점
│   └── package.json      # 의존성 및 스크립트
└── README.md             # 프로젝트 설명
```

## 개발 환경 설정

### 사전 요구사항

- Node.js (v14 이상)
- MongoDB (로컬 개발용)

### 클라이언트 설정

```bash
cd client
npm install
npm run dev
```

클라이언트는 기본적으로 http://localhost:3000 에서 실행됩니다.

### 서버 설정

```bash
cd server
npm install
```

#### 환경 변수 설정

`.env` 파일을 `server` 디렉토리에 생성하고 다음 내용을 추가하세요:

```
# 서버 설정
PORT=5000
NODE_ENV=development

# 데이터베이스 설정
MONGODB_URI=mongodb://localhost:27017/fridge_booking

# JWT 설정
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRE=30d

# CORS 설정
CLIENT_URL=http://localhost:3000

# 환경 설정
USE_DUMMY_DATA=false
```

서버 실행:

```bash
npm run dev
```

서버는 기본적으로 http://localhost:5000 에서 실행됩니다.

## Render에 배포하기

### 1. MongoDB 데이터베이스 설정

MongoDB Atlas 또는 다른 MongoDB 호스팅 서비스를 사용하여 데이터베이스를 설정하세요:

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 계정 생성
2. 새 클러스터 생성
3. 데이터베이스 사용자 생성 (읽기/쓰기 권한 필요)
4. IP 주소 접근 허용 목록에 `0.0.0.0/0` 추가 (모든 IP 허용)
5. 연결 문자열 복사 (예: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority`)

### 2. Render 웹 서비스 설정

1. [Render](https://render.com) 계정 생성
2. 대시보드에서 "New Web Service" 선택
3. GitHub 레포지토리 연결 (`https://github.com/ydkim0119/fridge_booking`)
4. 다음 설정 입력:
   - Name: `fridge-booking-app` (또는 원하는 이름)
   - Environment: `Node`
   - Build Command: `cd client && npm install --include=dev && npm run build && cd ../server && npm install`
   - Start Command: `cd server && node src/index.js`
   - 플랜 선택: `Free`

5. "Advanced" 버튼을 클릭하고 다음 환경 변수 추가:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=<MongoDB 연결 문자열>
JWT_SECRET=<안전한 랜덤 문자열>
JWT_EXPIRE=30d
CLIENT_URL=https://<your-app-name>.onrender.com
USE_DUMMY_DATA=false
```

6. "Create Web Service" 버튼 클릭

### 3. 배포 상태 확인

배포가 완료되면 제공된 URL로 애플리케이션에 접속할 수 있습니다. 배포 로그를 확인하여 문제가 있는지 확인하세요.

### 4. 문제 해결

배포 중 문제가 발생하면 다음 사항을 확인하세요:

1. **MongoDB 연결 실패**: 환경 변수 `MONGODB_URI`가 올바르게 설정되었는지 확인하세요. 연결 문자열에 사용자 이름과 비밀번호가 정확한지 검증하세요.

2. **정적 파일 경로 오류**: 빌드 명령이 성공적으로 실행되었는지 확인하세요. 서버의 정적 파일 경로가 올바르게 설정되었는지 로그를 확인하세요.

3. **포트 바인딩 문제**: 서버가 0.0.0.0 호스트에 바인딩되어 있는지 확인하세요.

#### 더미 데이터 모드 활성화

데이터베이스 연결에 문제가 있는 경우, 환경 변수 `USE_DUMMY_DATA=true`로 설정하여 더미 데이터 모드를 활성화할 수 있습니다. 이 모드에서는 데이터베이스 없이도 애플리케이션이 작동합니다.

## 모바일 지원

이 애플리케이션은 반응형 디자인을 사용하여 모바일 기기를 지원합니다. 모든 기능은 데스크톱과 모바일에서 모두 사용할 수 있습니다.

## 기술 스택

- **프론트엔드**: React, FullCalendar, TailwindCSS
- **백엔드**: Node.js, Express, MongoDB, Mongoose
- **인증**: JWT 인증
- **배포**: Render

## 라이센스

MIT
