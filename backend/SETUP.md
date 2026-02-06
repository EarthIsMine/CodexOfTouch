# Petting Roulette Game - 설정 가이드

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열고 다음 값들을 설정하세요:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/petting_game

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# World ID (개발 단계에서는 Staging 사용)
WORLDCOIN_APP_ID=app_staging_xxxxx
WORLDCOIN_ACTION=pet-game-auth

# 나머지는 필요에 따라 설정
```

### 3. 데이터베이스 설정

#### PostgreSQL 실행 확인
```bash
# PostgreSQL이 실행 중인지 확인
brew services list

# 실행 중이 아니면 시작
brew services start postgresql@15
```

#### 데이터베이스 생성
```bash
createdb petting_game
```

#### Prisma 설정
```bash
# Prisma 클라이언트 생성
npm run prisma:generate

# 마이그레이션 실행
npm run prisma:migrate

# 시드 데이터 추가
npm run prisma:seed
```

### 4. Redis 설정

```bash
# Redis가 실행 중인지 확인
redis-cli ping
# 응답: PONG

# 실행 중이 아니면 시작
brew services start redis
```

### 5. 개발 서버 실행

#### API 서버 실행
```bash
npm run dev
```

서버가 `http://localhost:8090`에서 실행됩니다.

#### 백그라운드 작업 실행 (다른 터미널)
```bash
npm run jobs:dev
```

잭팟 타이머가 10초마다 실행됩니다.

### 6. 테스트

#### Health Check
```bash
curl http://localhost:8090/health
```

#### Prisma Studio (GUI)
```bash
npm run prisma:studio
```

브라우저에서 `http://localhost:5555`로 접속하여 데이터베이스를 확인할 수 있습니다.

## 주요 엔드포인트

### 인증
```bash
POST http://localhost:8090/api/auth/worldid
```

### 사용자
```bash
GET  http://localhost:8090/api/users/me
POST http://localhost:8090/api/users/checkin
```

### 캐릭터
```bash
GET http://localhost:8090/api/characters/active
GET http://localhost:8090/api/characters
```

### 쓰다듬기
```bash
POST http://localhost:8090/api/pet
GET  http://localhost:8090/api/pet/history
```

### 도감
```bash
GET http://localhost:8090/api/codex/me
GET http://localhost:8090/api/codex/character/:characterId
```

### 잭팟
```bash
GET http://localhost:8090/api/jackpot/current
GET http://localhost:8090/api/jackpot/history
```

### 스킬
```bash
GET  http://localhost:8090/api/skills
GET  http://localhost:8090/api/skills/my
POST http://localhost:8090/api/skills/:skillId/purchase
POST http://localhost:8090/api/skills/:skillId/use
```

## 트러블슈팅

### PostgreSQL 연결 오류
```bash
# 서비스 상태 확인
brew services list

# 재시작
brew services restart postgresql@15

# 로그 확인
tail -f /opt/homebrew/var/log/postgresql@15.log
```

### Redis 연결 오류
```bash
# Redis 상태 확인
redis-cli ping

# 재시작
brew services restart redis
```

### Prisma 마이그레이션 오류
```bash
# 전체 리셋 (개발 환경에서만!)
npx prisma migrate reset

# 다시 마이그레이션
npm run prisma:migrate

# 시드 데이터
npm run prisma:seed
```

### Port 3000 이미 사용 중
```bash
# 포트 사용 중인 프로세스 찾기
lsof -i :3000

# 프로세스 종료
kill -9 <PID>

# 또는 .env에서 다른 포트 사용
PORT=3001
```

## 개발 팁

### 로그 확인
서버 로그는 콘솔에 출력됩니다. 프로덕션에서는 `logs/` 디렉토리에 파일로 저장됩니다.

### 데이터베이스 스키마 변경
1. `prisma/schema.prisma` 수정
2. `npm run prisma:migrate` 실행
3. 마이그레이션 이름 입력

### 새 엔드포인트 추가
1. `src/controllers/` - 컨트롤러 작성
2. `src/services/` - 비즈니스 로직 작성
3. `src/routes/` - 라우트 정의
4. `src/routes/index.ts` - 라우트 등록

### 환경별 실행
```bash
# 개발
NODE_ENV=development npm run dev

# 프로덕션 (빌드 후)
npm run build
NODE_ENV=production npm start
```

## 다음 단계

1. World ID 앱 설정 (https://developer.worldcoin.org/)
2. Blockchain 연동 (WLD 결제, NFT 민팅)
3. Firebase FCM 설정 (푸시 알림)
4. 프론트엔드 연동
5. 배포

## 참고 문서

- [API 명세서](./api-spec.md)
- [백엔드 설계](./backend-design.md)
- [Prisma 문서](https://www.prisma.io/docs)
- [World ID 문서](https://docs.worldcoin.org/)
