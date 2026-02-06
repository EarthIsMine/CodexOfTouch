# Petting Roulette Game

World ID 기반 확률형 인터랙션 + 수집 게임 백엔드

## 개요

**Petting Roulette Game**은 World ID로 인증된 실제 인간만 참여 가능한 확률 기반 캐릭터 수집 게임입니다.

### 핵심 기능
- World ID 인증 (1인 1계정)
- 출석 체크를 통한 게임 내부 재화 획득
- 확률 기반 쓰다듬기 시스템
- 실패 시 30초 쿨타임
- 성공 시 NFT 도감 등록
- 잭팟 시스템 (5분간 인터랙션 없으면 마지막 플레이어가 획득)
- WLD 기반 스킬 시스템

## 기술 스택

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **Blockchain**: ethers.js, World Chain
- **Auth**: World ID (@worldcoin/idkit)
- **Push Notification**: Firebase Cloud Messaging

## 로컬 개발 환경 설정

### 1. 필수 설치

```bash
# Node.js v20+
brew install node@20

# PostgreSQL 15+
brew install postgresql@15
brew services start postgresql@15

# Redis 7+
brew install redis
brew services start redis
```

### 2. 프로젝트 설정

```bash
# 저장소 클론
git clone <repository-url>
cd WorldHackerton

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 필요한 값들을 설정하세요

# 데이터베이스 생성
createdb petting_game

# Prisma 클라이언트 생성
npm run prisma:generate

# 데이터베이스 마이그레이션
npm run prisma:migrate

# 시드 데이터 추가
npm run prisma:seed
```

### 3. 개발 서버 실행

```bash
# API 서버 실행
npm run dev

# 백그라운드 작업 실행 (잭팟 타이머 등)
npm run jobs:dev
```

서버는 `http://localhost:8090`에서 실행됩니다.

## 프로젝트 구조

```
WorldHackerton/
├── src/
│   ├── config/          # 설정 파일
│   ├── controllers/     # API 컨트롤러
│   ├── services/        # 비즈니스 로직
│   ├── middlewares/     # Express 미들웨어
│   ├── routes/          # 라우트 정의
│   ├── types/           # TypeScript 타입
│   ├── utils/           # 유틸리티 함수
│   ├── jobs/            # 백그라운드 작업
│   ├── app.ts           # Express 앱 설정
│   └── index.ts         # 진입점
├── prisma/
│   ├── schema.prisma    # 데이터베이스 스키마
│   └── seed.ts          # 시드 데이터
├── tests/               # 테스트 파일
├── .env.example         # 환경 변수 예시
├── package.json
├── tsconfig.json
└── README.md
```

## API 문서

API 상세 명세는 [api-spec.md](./api-spec.md)를 참조하세요.

### 주요 엔드포인트

- `POST /api/auth/worldid` - World ID 인증
- `POST /api/users/checkin` - 출석 체크
- `GET /api/characters/active` - 활성 캐릭터 조회
- `POST /api/pet` - 쓰다듬기 시도
- `GET /api/codex/me` - 내 도감 조회
- `GET /api/jackpot/current` - 현재 잭팟 상태

## 데이터베이스

### 스키마 관리

```bash
# Prisma Studio 실행 (GUI)
npm run prisma:studio

# 새 마이그레이션 생성
npm run prisma:migrate

# 스키마 리셋 (개발용)
npx prisma migrate reset
```

### 주요 테이블

- `users` - 사용자 정보 (World ID 인증)
- `characters` - 캐릭터 목록
- `pet_events` - 쓰다듬기 이벤트 기록
- `jackpot_states` - 잭팟 상태
- `codex` - NFT 수집 기록
- `skills` - 스킬 정보
- `user_skills` - 사용자 보유 스킬

## 테스트

```bash
# 전체 테스트 실행
npm test

# Watch 모드
npm run test:watch

# 커버리지
npm run test:coverage
```

## 환경 변수

주요 환경 변수는 `.env.example`을 참조하세요.

### World ID 설정

1. [Worldcoin Developer Portal](https://developer.worldcoin.org/)에서 앱 생성
2. App ID와 Action을 `.env`에 설정

```env
WORLDCOIN_APP_ID=app_staging_xxxxx
WORLDCOIN_ACTION=pet-game-auth
```

### Firebase 설정 (푸시 알림)

1. Firebase Console에서 프로젝트 생성
2. Service Account Key 다운로드
3. 키 정보를 `.env`에 설정

## 배포

MVP 단계에서는 로컬 개발 환경에서 실행합니다.

프로덕션 배포 시:
- PostgreSQL: AWS RDS, Neon, Supabase 등
- Redis: AWS ElastiCache, Upstash 등
- Server: AWS EC2, GCP Cloud Run, Railway 등

## 백그라운드 작업

### Jackpot Timer
- 10초마다 실행
- 5분간 인터랙션 없으면 잭팟 지급

### Character Rotation
- 시간 기반 또는 잭팟 발생 시 캐릭터 교체

```bash
# 백그라운드 작업 실행
npm run jobs:dev
```

## 보안 고려사항

- World ID Proof 검증
- JWT 토큰 기반 인증
- Rate Limiting (IP, User 단위)
- 트랜잭션 무결성 (DB Transactions)
- 블록체인 결제 검증

## 트러블슈팅

### PostgreSQL 연결 오류
```bash
# PostgreSQL 서비스 확인
brew services list

# 재시작
brew services restart postgresql@15
```

### Redis 연결 오류
```bash
# Redis 서비스 확인
redis-cli ping

# 재시작
brew services restart redis
```

### Prisma 마이그레이션 오류
```bash
# 마이그레이션 리셋
npx prisma migrate reset

# 다시 마이그레이션
npm run prisma:migrate
```

## 기여

MVP 개발 중입니다. 이슈나 PR은 환영합니다!

## 라이선스

MIT

## 참고 자료

- [설계 문서](./backend-design.md)
- [API 명세](./api-spec.md)
- [World ID Docs](https://docs.worldcoin.org/)
- [Prisma Docs](https://www.prisma.io/docs)
