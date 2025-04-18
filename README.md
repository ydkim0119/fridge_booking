# 냉동기 예약 시스템

학교 내 냉동기 장비 예약을 위한 웹 서비스입니다.

## 주요 기능

- 캘린더 형식의 예약 인터페이스 (월/주 단위 조회)
- 일 단위 예약 생성/수정/취소
- 사용자/장비별 예약 필터링
- 반응형 디자인 (모바일 호환)

## 기술 스택

### 프론트엔드
- React.js
- Tailwind CSS
- FullCalendar

### 백엔드
- Node.js + Express.js
- MongoDB
- JWT 인증

### 배포
- Render

## 로컬 개발 환경 설정

### 필수 요구사항
- Node.js 18 이상
- MongoDB

### 설치 및 실행 방법

1. 저장소 클론
```bash
git clone https://github.com/ydkim0119/fridge_booking.git
cd fridge_booking
```

2. 환경 변수 설정
```bash
cd server
cp .env.example .env
# .env 파일을 편집하여 필요한 정보 설정
```

3. 백엔드 실행
```bash
cd server
npm install
npm run dev
```

4. 프론트엔드 실행
```bash
cd client
npm install
npm run dev
```

## Docker로 실행

```bash
docker-compose up -d
```

## Render로 배포하기

1. Render 계정에 로그인
2. 저장소 연결
3. Blueprint를 사용하여 render.yaml 파일 적용
4. 환경 변수 설정

## 개발자

- 김영도
