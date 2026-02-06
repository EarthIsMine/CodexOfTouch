# 프로젝트 구조

```
WorldHackerton/
├── prisma/
│   ├── migrations/          # 데이터베이스 마이그레이션
│   ├── schema.prisma        # Prisma 스키마 정의
│   └── seed.ts              # 시드 데이터
│
├── src/
│   ├── config/              # 설정 파일
│   │   ├── database.ts      # Prisma 클라이언트
│   │   ├── redis.ts         # Redis 클라이언트
│   │   ├── env.ts           # 환경 변수
│   │   └── logger.ts        # Winston 로거
│   │
│   ├── controllers/         # 컨트롤러 (요청 처리)
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── character.controller.ts
│   │   ├── pet.controller.ts
│   │   ├── codex.controller.ts
│   │   ├── jackpot.controller.ts
│   │   ├── skill.controller.ts
│   │   └── health.controller.ts
│   │
│   ├── services/            # 서비스 레이어 (비즈니스 로직)
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── character.service.ts
│   │   ├── pet.service.ts
│   │   ├── codex.service.ts
│   │   ├── jackpot.service.ts
│   │   ├── skill.service.ts
│   │   └── worldid.service.ts
│   │
│   ├── middlewares/         # Express 미들웨어
│   │   ├── auth.ts          # JWT 인증
│   │   ├── error-handler.ts # 에러 처리
│   │   ├── rate-limit.ts    # Rate Limiting
│   │   └── validate.ts      # 요청 검증
│   │
│   ├── routes/              # API 라우트
│   │   ├── index.ts         # 라우트 통합
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── character.routes.ts
│   │   ├── pet.routes.ts
│   │   ├── codex.routes.ts
│   │   ├── jackpot.routes.ts
│   │   ├── skill.routes.ts
│   │   └── health.routes.ts
│   │
│   ├── jobs/                # 백그라운드 작업
│   │   ├── index.ts         # 작업 시작점
│   │   └── jackpot-timer.ts # 잭팟 타이머 (10초마다)
│   │
│   ├── types/               # TypeScript 타입 정의
│   │   └── index.ts
│   │
│   ├── utils/               # 유틸리티 함수
│   │   ├── errors.ts        # 커스텀 에러
│   │   ├── response.ts      # API 응답 헬퍼
│   │   ├── jwt.ts           # JWT 헬퍼
│   │   ├── redis-keys.ts    # Redis 키 관리
│   │   └── date.ts          # 날짜 유틸리티
│   │
│   ├── app.ts               # Express 앱 설정
│   └── index.ts             # 서버 진입점
│
├── logs/                    # 로그 파일 (production)
├── .env.example             # 환경 변수 예시
├── .gitignore
├── package.json
├── tsconfig.json            # TypeScript 설정
├── README.md                # 프로젝트 개요
├── SETUP.md                 # 설정 가이드
├── PROJECT_STRUCTURE.md     # 이 파일
├── backend-design.md        # 백엔드 설계 문서
└── api-spec.md              # API 명세서
```

## 주요 디렉토리 설명

### `/src/config/`
애플리케이션 설정 파일들. 데이터베이스, Redis, 환경 변수, 로거 등을 초기화합니다.

### `/src/controllers/`
HTTP 요청을 받아 적절한 서비스를 호출하고 응답을 반환합니다. 비즈니스 로직은 포함하지 않습니다.

### `/src/services/`
핵심 비즈니스 로직을 처리합니다. 데이터베이스 작업, 외부 API 호출 등을 수행합니다.

### `/src/middlewares/`
요청 전처리 (인증, 검증, 에러 처리, Rate Limiting 등)를 담당합니다.

### `/src/routes/`
API 엔드포인트를 정의하고 컨트롤러와 연결합니다.

### `/src/jobs/`
백그라운드에서 주기적으로 실행되는 작업들 (잭팟 타이머, 캐릭터 로테이션 등).

### `/src/types/`
TypeScript 타입 정의. API 응답, 요청, 에러 코드 등.

### `/src/utils/`
재사용 가능한 유틸리티 함수들.

## 데이터 흐름

```
1. Client Request
   ↓
2. Express Middleware (auth, validation, rate-limit)
   ↓
3. Route Handler
   ↓
4. Controller (요청 파싱, 응답 포맷팅)
   ↓
5. Service (비즈니스 로직)
   ↓
6. Database / Redis / External API
   ↓
7. Response to Client
```

## 주요 파일 설명

### `src/index.ts`
- 서버 진입점
- 데이터베이스/Redis 연결
- 백그라운드 작업 시작
- Graceful Shutdown 처리

### `src/app.ts`
- Express 앱 설정
- 미들웨어 등록
- 라우트 등록
- 에러 핸들러

### `prisma/schema.prisma`
- 데이터베이스 스키마 정의
- 9개 테이블 (User, Character, PetEvent, JackpotState, Codex, etc.)

### `src/services/pet.service.ts`
- 핵심 게임 로직
- 쓰다듬기 처리, 확률 판정, 잭팟 업데이트, 도감 등록

### `src/jobs/jackpot-timer.ts`
- 10초마다 잭팟 상태 체크
- 5분간 인터랙션 없으면 자동 지급

## 환경 변수

모든 환경 변수는 `.env` 파일에서 관리됩니다. `.env.example`을 참고하여 설정하세요.

## 스크립트

```bash
# 개발 서버 실행
npm run dev

# 백그라운드 작업 실행
npm run jobs:dev

# 빌드
npm run build

# 프로덕션 실행
npm start

# 데이터베이스
npm run prisma:generate  # Prisma 클라이언트 생성
npm run prisma:migrate   # 마이그레이션
npm run prisma:seed      # 시드 데이터
npm run prisma:studio    # Prisma Studio GUI
```

## 개발 가이드

### 새 기능 추가 시
1. `prisma/schema.prisma`에 필요한 모델 추가
2. `src/types/index.ts`에 타입 정의
3. `src/services/`에 서비스 로직 작성
4. `src/controllers/`에 컨트롤러 작성
5. `src/routes/`에 라우트 추가
6. 테스트 작성

### 코드 스타일
- TypeScript strict mode 사용
- Path alias (@/) 사용
- async/await 사용 (Promise 체이닝 지양)
- 에러는 AppError 클래스 사용
- 로그는 winston logger 사용
