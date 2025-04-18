# 멀티 스테이지 빌드를 위한 설정

# 클라이언트 빌드 스테이지
FROM node:18-alpine as client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# 서버 스테이지
FROM node:18-alpine
WORKDIR /app

# 서버 의존성 설치
COPY server/package*.json ./
RUN npm install --production

# 서버 소스 복사
COPY server/ ./

# 클라이언트 빌드 결과물 복사
COPY --from=client-build /app/client/dist ./public

# 서버 실행 포트 설정
EXPOSE 5000

# 서버 실행
CMD ["npm", "start"]
