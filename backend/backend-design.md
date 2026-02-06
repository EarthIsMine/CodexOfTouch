# Petting Roulette Game - 백엔드 설계 문서

## 1. 기술 스택

### 1.1 Core
- **Runtime**: Node.js (v20+)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15+
- **Cache/Session**: Redis 7+
- **ORM**: Prisma

### 1.2 External Services
- **World ID**: Worldcoin SDK (@worldcoin/idkit)
- **Blockchain**: ethers.js (WLD 결제, NFT 민팅)
- **Push Notification**: Firebase Cloud Messaging (FCM)

### 1.3 Development
- **Package Manager**: npm or pnpm
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest + Supertest
- **Linting**: ESLint + Prettier

---

## 2. 시스템 아키텍처

```
┌─────────────┐
│   Client    │
│ (Web/Mobile)│
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────────────────────────┐
│      Express.js API Server          │
│  ┌───────────────────────────────┐  │
│  │  Auth Middleware (World ID)   │  │
│  ├───────────────────────────────┤  │
│  │  Rate Limiting Middleware     │  │
│  ├───────────────────────────────┤  │
│  │  Controllers                  │  │
│  │  - User Controller            │  │
│  │  - Pet Controller             │  │
│  │  - Skill Controller           │  │
│  │  - Character Controller       │  │
│  ├───────────────────────────────┤  │
│  │  Services                     │  │
│  │  - Pet Service                │  │
│  │  - Jackpot Service            │  │
│  │  - Codex Service              │  │
│  │  - World ID Service           │  │
│  ├───────────────────────────────┤  │
│  │  Background Jobs              │  │
│  │  - Jackpot Timer              │  │
│  │  - Character Rotation         │  │
│  │  - Push Notification          │  │
│  └───────────────────────────────┘  │
└──────┬────────────────────┬─────────┘
       │                    │
       ▼                    ▼
┌─────────────┐      ┌─────────────┐
│ PostgreSQL  │      │    Redis    │
│   (Prisma)  │      │  (Cache +   │
│             │      │  Cooldown)  │
└─────────────┘      └─────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│     Blockchain (World Chain)        │
│  - WLD Payment                      │
│  - NFT Minting (Codex)              │
│  - Jackpot Distribution             │
└─────────────────────────────────────┘
```

---

## 3. 데이터베이스 설계

### 3.1 주요 엔티티

#### USER
```sql
- id: STRING (Primary Key, UUID)
- nullifierHash: STRING (Unique, World ID)
- walletAddress: STRING (Unique, Nullable)
- internalBalance: INTEGER (Default: 0)
- lastCheckIn: TIMESTAMP (Nullable)
- createdAt: TIMESTAMP (Default: NOW())
```

#### CHARACTER
```sql
- id: INTEGER (Primary Key, Auto)
- name: STRING
- imageUrl: STRING
- isActive: BOOLEAN (Default: false)
- successRate: FLOAT (0.0 ~ 1.0, 확률)
- createdAt: TIMESTAMP
```

#### PET_EVENT
```sql
- id: INTEGER (Primary Key, Auto)
- userId: STRING (FK -> USER.id)
- characterId: INTEGER (FK -> CHARACTER.id)
- result: ENUM('SUCCESS', 'FAIL')
- balanceUsed: INTEGER (사용한 재화)
- createdAt: TIMESTAMP
```

#### JACKPOT_STATE
```sql
- characterId: INTEGER (PK, FK -> CHARACTER.id)
- currentPool: INTEGER (누적 재화)
- lastUserId: STRING (FK -> USER.id, Nullable)
- lastPetAt: TIMESTAMP (Nullable)
```

#### CODEX (NFT 수집 기록)
```sql
- userId: STRING (PK, FK -> USER.id)
- characterId: INTEGER (PK, FK -> CHARACTER.id)
- contractAddress: STRING
- tokenId: STRING
- chainId: INTEGER
- mintedAt: TIMESTAMP
```

#### JACKPOT_HISTORY
```sql
- roundId: INTEGER (Primary Key, Auto)
- characterId: INTEGER (FK -> CHARACTER.id)
- winnerWallet: STRING
- amount: INTEGER
- contractAddress: STRING (Nullable)
- txHash: STRING (Nullable)
- chainId: INTEGER (Nullable)
- committedAt: TIMESTAMP
```

#### SKILL
```sql
- id: INTEGER (Primary Key, Auto)
- name: STRING
- description: TEXT
- effectType: ENUM('COOLDOWN_REDUCE', 'CHECKIN_BONUS', 'USER_BLOCK')
- value: INTEGER (효과값)
- durationSec: INTEGER (지속시간, 초)
- priceWld: INTEGER (WLD 가격)
- isActive: BOOLEAN (Default: true)
```

#### USER_SKILL
```sql
- userId: STRING (PK, FK -> USER.id)
- skillId: INTEGER (PK, FK -> SKILL.id)
- acquiredAt: TIMESTAMP
- expiresAt: TIMESTAMP (Nullable)
```

#### SKILL_USAGE
```sql
- id: INTEGER (Primary Key, Auto)
- userId: STRING (FK -> USER.id)
- skillId: INTEGER (FK -> SKILL.id)
- usedAt: TIMESTAMP
```

#### SKILL_PURCHASE
```sql
- id: INTEGER (Primary Key, Auto)
- userId: STRING (FK -> USER.id)
- skillId: INTEGER (FK -> SKILL.id)
- paidWld: INTEGER
- txHash: STRING
- purchasedAt: TIMESTAMP
```

### 3.2 인덱스 전략
```sql
CREATE INDEX idx_pet_event_user_created ON PET_EVENT(userId, createdAt DESC);
CREATE INDEX idx_pet_event_character_result ON PET_EVENT(characterId, result);
CREATE INDEX idx_codex_user ON CODEX(userId);
CREATE INDEX idx_skill_usage_user_used ON SKILL_USAGE(userId, usedAt DESC);
CREATE INDEX idx_jackpot_history_character ON JACKPOT_HISTORY(characterId, committedAt DESC);
```

---

## 4. 핵심 비즈니스 로직

### 4.1 World ID 인증 플로우
```typescript
1. Client -> Server: World ID Proof 전송
2. Server: World ID SDK로 검증
   - nullifierHash 추출
   - 중복 사용자 확인
3. Server: JWT 토큰 발급
4. Client: 이후 모든 요청에 JWT 포함
```

### 4.2 출석 체크 로직
```typescript
- 조건: World ID 인증 완료
- 제약: 하루 1회 (UTC 기준)
- 보상: 기본 10 재화 + 연속 출석 보너스
- DB: lastCheckIn 업데이트, internalBalance 증가
```

### 4.3 쓰다듬기(Pet) 로직
```typescript
1. 검증:
   - 사용자 인증 확인
   - 활성 캐릭터 존재 확인
   - 내부 재화 >= 1 확인
   - Redis 쿨타임 확인 (실패 시 30초)

2. 실행:
   - internalBalance -= 1
   - JACKPOT_STATE.currentPool += 1
   - 확률 판정 (CHARACTER.successRate)

3. 결과 - 실패:
   - PET_EVENT 기록 (result: FAIL)
   - Redis 쿨타임 설정 (30초)
   - Response: { success: false, cooldownUntil }

4. 결과 - 성공:
   - PET_EVENT 기록 (result: SUCCESS)
   - CODEX 등록 (이미 등록된 경우 Skip)
   - JACKPOT_STATE 업데이트 (lastUserId, lastPetAt)
   - 푸시 알림 전송 (해당 캐릭터 성공자 전원)
   - Response: { success: true, codexUnlocked: boolean }
```

### 4.4 잭팟 타이머 로직 (Background Job)
```typescript
- 매 10초마다 실행
- JACKPOT_STATE 테이블 스캔
- 조건: lastPetAt + 5분 < NOW()
- 동작:
  1. 트랜잭션 시작
  2. lastUserId에게 currentPool 지급
  3. JACKPOT_HISTORY 기록
  4. JACKPOT_STATE 초기화
  5. 승리 푸시 알림 전송
  6. 트랜잭션 커밋
```

### 4.5 캐릭터 로테이션 로직
```typescript
- 방식 1: 시간 기반 (예: 매 6시간)
- 방식 2: 잭팟 발생 시 교체
- 동작:
  1. 현재 CHARACTER.isActive = true 찾기
  2. isActive = false 설정
  3. 다음 캐릭터 선택 (순환 or 랜덤)
  4. 새 캐릭터 isActive = true
  5. JACKPOT_STATE 초기화
  6. 전체 푸시 알림 (새 캐릭터 등장)
```

### 4.6 스킬 시스템 로직
```typescript
// COOLDOWN_REDUCE: 쿨타임 감소
- Redis 쿨타임 조회 시 감소 적용
- durationSec 동안 유효

// CHECKIN_BONUS: 출석 보상 2배
- 일일 1회 제한 (USER_SKILL.expiresAt 체크)
- 출석 시 보상 * 2

// USER_BLOCK: 5초간 타 유저 차단
- Redis에 글로벌 락 설정
- characterId 단위로 락
- 5초 후 자동 해제
```

---

## 5. API 엔드포인트 설계

### 5.1 인증 (Authentication)
```
POST   /api/auth/worldid
       Body: { proof: WorldIDProof }
       Response: { token: string, user: User }
```

### 5.2 사용자 (User)
```
GET    /api/users/me
       Response: { user: User, balance: number }

POST   /api/users/checkin
       Response: { reward: number, streak: number }
```

### 5.3 캐릭터 (Character)
```
GET    /api/characters/active
       Response: { character: Character, jackpotPool: number }

GET    /api/characters
       Response: { characters: Character[] }
```

### 5.4 쓰다듬기 (Pet)
```
POST   /api/pet
       Body: { characterId: number, skillId?: number }
       Response: {
         success: boolean,
         codexUnlocked?: boolean,
         cooldownUntil?: timestamp,
         jackpotPool: number
       }
```

### 5.5 도감 (Codex)
```
GET    /api/codex/me
       Response: { codex: CodexEntry[] }

GET    /api/codex/:characterId
       Response: { unlockedBy: number, totalPlayers: number }
```

### 5.6 잭팟 (Jackpot)
```
GET    /api/jackpot/current
       Response: { characterId, pool, lastPetAt, timeRemaining }

GET    /api/jackpot/history
       Query: ?limit=10&offset=0
       Response: { history: JackpotHistory[] }
```

### 5.7 스킬 (Skill)
```
GET    /api/skills
       Response: { skills: Skill[] }

GET    /api/skills/my
       Response: { skills: UserSkill[] }

POST   /api/skills/:skillId/purchase
       Body: { txHash: string }
       Response: { userSkill: UserSkill }

POST   /api/skills/:skillId/use
       Response: { expiresAt: timestamp }
```

### 5.8 통계 (Stats)
```
GET    /api/stats/leaderboard
       Query: ?type=codex|jackpot&limit=100
       Response: { leaderboard: Entry[] }
```

---

## 6. Redis 키 구조

```
cooldown:user:{userId}                    -> TTL 30s
skill:active:{userId}:{skillId}           -> TTL durationSec
skill:daily:{userId}:{skillId}:{date}     -> TTL 24h
character:lock:{characterId}              -> TTL 5s (USER_BLOCK 스킬)
session:{token}                           -> User 정보 캐시
```

---

## 7. 푸시 알림 트리거

| 이벤트 | 수신자 | 메시지 |
|--------|--------|--------|
| 쓰다듬기 성공 | 해당 캐릭터 코덱스 보유자 | "누군가 {캐릭터}를 쓰다듬었어요! 💰" |
| 잭팟 발생 | 승자 | "🎉 잭팟 {amount} 획득!" |
| 잭팟 발생 | 전체 | "{사용자}님이 잭팟을 획득했습니다!" |
| 캐릭터 교체 | 전체 | "🆕 새 캐릭터 {name} 등장!" |

---

## 8. 보안 고려사항

### 8.1 World ID 검증
- 모든 중요 작업은 World ID 재검증 필요
- nullifierHash 중복 체크 필수
- Proof 재사용 방지 (nonce 체크)

### 8.2 Rate Limiting
```typescript
- 일반 API: 100 req/min per IP
- Pet API: 10 req/min per User
- Skill 사용: 5 req/min per User
```

### 8.3 트랜잭션 무결성
- 잭팟 지급: DB 트랜잭션 + 재시도 로직
- 재화 차감: Optimistic Locking
- 중복 방지: Unique Constraint + Redis Lock

### 8.4 블록체인 연동
- WLD 결제: On-chain 검증 필수
- NFT 민팅: txHash 저장, 실패 시 롤백
- Wallet 서명: 메시지 서명 검증

---

## 9. 성능 최적화

### 9.1 캐싱 전략
```
- 활성 캐릭터: Redis, TTL 60초
- 잭팟 상태: Redis, TTL 10초
- 사용자 스킬: Redis, TTL 300초
```

### 9.2 데이터베이스 최적화
```sql
- Connection Pooling (max: 20)
- Read Replica 사용 (통계 조회)
- Batch Insert (PET_EVENT)
```

### 9.3 Background Jobs
```typescript
// node-cron 사용
- Jackpot Timer: 10초 간격
- Push Notification: Queue 방식 (Bull or BullMQ)
- Character Rotation: Cron 스케줄
```

---

## 10. 에러 핸들링

### 10.1 에러 코드 체계
```typescript
enum ErrorCode {
  // Auth
  INVALID_WORLD_ID = 'AUTH_001',
  DUPLICATE_USER = 'AUTH_002',

  // Pet
  INSUFFICIENT_BALANCE = 'PET_001',
  COOLDOWN_ACTIVE = 'PET_002',
  NO_ACTIVE_CHARACTER = 'PET_003',
  CHARACTER_LOCKED = 'PET_004',

  // Skill
  SKILL_NOT_OWNED = 'SKILL_001',
  SKILL_EXPIRED = 'SKILL_002',
  INVALID_TX_HASH = 'SKILL_003',

  // Jackpot
  JACKPOT_NOT_READY = 'JACKPOT_001',
}
```

### 10.2 응답 포맷
```typescript
// Success
{
  success: true,
  data: { ... }
}

// Error
{
  success: false,
  error: {
    code: 'PET_002',
    message: 'Cooldown active',
    details: { cooldownUntil: '2024-01-01T00:00:00Z' }
  }
}
```

---

## 11. 환경 변수

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/petting_game

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# World ID
WORLDCOIN_APP_ID=app_xxx
WORLDCOIN_ACTION=pet_game_auth

# Blockchain
PRIVATE_KEY=0x...
RPC_URL=https://worldchain-mainnet.g.alchemy.com/v2/...
CODEX_NFT_CONTRACT=0x...
WLD_TOKEN_CONTRACT=0x...

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Firebase
FIREBASE_PROJECT_ID=xxx
FIREBASE_PRIVATE_KEY=xxx
FIREBASE_CLIENT_EMAIL=xxx

# Server
PORT=3000
NODE_ENV=development
```

---

## 12. 로컬 개발 환경 설정

### 12.1 필수 설치 항목
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

### 12.2 프로젝트 초기 설정
```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env

# 3. 데이터베이스 생성
createdb petting_game

# 4. Prisma 마이그레이션
npx prisma migrate dev

# 5. 시드 데이터 추가 (캐릭터 등)
npx prisma db seed

# 6. 개발 서버 실행
npm run dev
```

---

## 13. MVP 우선순위

### Phase 1 (핵심)
- World ID 인증
- 출석 체크
- 쓰다듬기 + 확률 시스템
- 재화 적립 + 잭팟 타이머
- 도감 등록

### Phase 2 (확장)
- 스킬 시스템
- 푸시 알림
- 캐릭터 로테이션

### Phase 3 (부가)
- 리더보드
- 통계 대시보드
- 관리자 패널

---

## 14. 테스트 전략

### 14.1 단위 테스트
```bash
npm run test:unit
```
- 확률 로직 (Pet Service)
- 잭팟 타이머 로직
- 재화 계산 로직

### 14.2 통합 테스트
```bash
npm run test:integration
```
- API 엔드포인트 전체
- World ID 검증 플로우
- 블록체인 연동

### 14.3 E2E 테스트
```bash
npm run test:e2e
```
- 사용자 플로우 전체
- 쓰다듬기 -> 잭팟 -> 캐릭터 교체

---

## 15. 모니터링

### 15.1 핵심 지표
- API 응답 시간 (p50, p95, p99)
- Pet 성공률 (실제 vs 기대)
- 잭팟 발생 빈도
- 재화 유통량 (발행 vs 소모)
- 활성 사용자 수 (DAU)

### 15.2 로깅 전략
```typescript
// Winston 사용
- error.log: 에러 레벨 이상
- combined.log: 모든 로그
- pet-events.log: 쓰다듬기 이벤트
- jackpot.log: 잭팟 관련 로그
```

---

## 참고 자료

- World ID Docs: https://docs.worldcoin.org/
- Worldcoin SDK: https://github.com/worldcoin/idkit-js
- Prisma ORM: https://www.prisma.io/docs
- Express.js: https://expressjs.com/
- Bull Queue: https://github.com/OptimalBits/bull
