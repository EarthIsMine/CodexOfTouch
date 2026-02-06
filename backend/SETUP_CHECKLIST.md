# 🚀 프로젝트 실행 체크리스트

이 문서는 Petting Roulette Game을 처음부터 실행하기 위한 단계별 가이드입니다.

---

## ✅ 1단계: 로컬 개발 환경 설정

### 1.1 PostgreSQL 설정

```bash
# PostgreSQL이 실행 중인지 확인
pg_isready

# 개발용 데이터베이스 생성
createdb petting_game

# 테스트용 데이터베이스 생성
createdb petting_game_test
```

### 1.2 Redis 설정

```bash
# Redis 실행
brew services start redis

# 확인
redis-cli ping
# 출력: PONG
```

### 1.3 환경 변수 설정

루트 디렉토리에 `.env` 파일 생성:

```bash
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/petting_game

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# World ID
WORLDCOIN_APP_ID=app_staging_xxxxx
WORLDCOIN_ACTION=pet-game-auth

# Blockchain (일단 더미값, 나중에 배포 후 업데이트)
BLOCKCHAIN_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000
CODEX_NFT_CONTRACT=0x0000000000000000000000000000000000000000
CHAIN_ID=11155111

# Firebase (선택사항)
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# Game Configuration
DEFAULT_CHECKIN_REWARD=10
CHECKIN_STREAK_BONUS=2
PET_COST=1
COOLDOWN_DURATION=30
JACKPOT_TIMEOUT=300

# Rate Limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=100
PET_RATE_LIMIT=20
SKILL_RATE_LIMIT=10
```

### 1.4 의존성 설치

```bash
npm install
```

---

## ✅ 2단계: 데이터베이스 마이그레이션

### 2.1 Prisma 클라이언트 생성

```bash
npm run prisma:generate
```

### 2.2 마이그레이션 실행

```bash
npm run prisma:migrate
# 마이그레이션 이름 입력: "init_schema"
```

### 2.3 시드 데이터 생성

```bash
npm run prisma:seed
```

이제 데이터베이스에 5개의 캐릭터와 4개의 스킬이 생성됩니다.

### 2.4 Prisma Studio로 확인 (선택)

```bash
npm run prisma:studio
# 브라우저에서 http://localhost:5555 열림
```

---

## ✅ 3단계: 백엔드 서버 실행

### 3.1 개발 모드 실행

```bash
npm run dev
```

출력:
```
[INFO] Server started on port 3000
[INFO] Connected to PostgreSQL
[INFO] Connected to Redis
```

### 3.2 Health Check

```bash
curl http://localhost:8090/api/health
```

응답:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-02-06T...",
    "uptime": 1.234
  }
}
```

---

## ✅ 4단계: API 테스트 (테스트 없이 진행)

이 단계는 스킵 가능합니다. 프론트엔드에서 직접 테스트하면 됩니다.

### 4.1 캐릭터 목록 조회

```bash
curl http://localhost:8090/api/characters
```

### 4.2 World ID 인증 (실제 World ID 필요)

```bash
curl -X POST http://localhost:8090/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "proof": "...",
    "merkle_root": "...",
    "nullifier_hash": "...",
    "verification_level": "orb",
    "walletAddress": "0x..."
  }'
```

---

## ✅ 5단계: 스마트 컨트랙트 배포 (Sepolia Testnet)

### 5.1 Foundry 설치 확인

```bash
forge --version
```

### 5.2 컨트랙트 의존성 설치

의존성은 이미 설치되어 있습니다:
- ✅ forge-std
- ✅ openzeppelin-contracts

### 5.3 로컬 테스트

```bash
cd contracts
forge test -vvv
```

모든 테스트가 통과해야 합니다.

### 5.4 Sepolia 준비

#### A. Alchemy/Infura RPC URL 발급
1. [Alchemy](https://www.alchemy.com/) 가입
2. "Create App" → Sepolia 네트워크 선택
3. RPC URL 복사

#### B. Sepolia Testnet ETH 받기
- [Alchemy Faucet](https://sepoliafaucet.com/)
- [Chainlink Faucet](https://faucets.chain.link/sepolia)
- 최소 0.1 ETH 필요

#### C. Etherscan API Key 발급
1. [Etherscan](https://etherscan.io/) 가입
2. My API Keys → Add 클릭
3. API Key 복사

#### D. MetaMask Private Key Export
1. MetaMask 열기
2. 계정 선택 → ⋯ → Account Details
3. Export Private Key
4. **⚠️ 절대 공유하지 마세요!**

### 5.5 contracts/.env 설정

```bash
cd contracts
cp .env.example .env
# .env 파일 편집
```

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=0xyour_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 5.6 Sepolia 배포

```bash
cd contracts

# Dry-run (시뮬레이션)
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY

# 실제 배포 + 검증
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

배포 완료 후 출력:
```
CodexNFT deployed to: 0x1234567890abcdef...
```

### 5.7 백엔드 .env 업데이트

루트 `.env` 파일에서 업데이트:

```env
BLOCKCHAIN_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=0xyour_private_key_here
CODEX_NFT_CONTRACT=0x1234567890abcdef...  # 방금 배포한 주소
CHAIN_ID=11155111
```

### 5.8 서버 재시작

```bash
# Ctrl+C로 중지 후
npm run dev
```

---

## ✅ 6단계: 전체 흐름 테스트

### 6.1 사용자 인증 (World ID)

프론트엔드에서 World ID 인증 후 JWT 토큰 받기

### 6.2 캐릭터 쓰다듬기

```bash
TOKEN="your_jwt_token"

curl -X POST http://localhost:8090/api/pet \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"characterId": 1}'
```

### 6.3 성공 시 자동으로:
1. ✅ 잔액 차감
2. ✅ 잭팟 풀 증가
3. ✅ 도감 등록
4. ✅ NFT 발급 (백그라운드)

### 6.4 NFT 확인

- Etherscan: `https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS`
- OpenSea Testnet: `https://testnets.opensea.io/`

---

## ✅ 7단계: 프론트엔드 연동

### API 엔드포인트

**Base URL**: `http://localhost:8090/api`

#### 인증
- `POST /auth` - World ID 인증

#### 사용자
- `GET /user` - 사용자 정보 조회
- `POST /user/checkin` - 출석 체크

#### 캐릭터
- `GET /characters` - 전체 캐릭터 조회
- `GET /characters/active` - 활성 캐릭터 조회
- `GET /characters/:id` - 특정 캐릭터 조회

#### 쓰다듬기
- `POST /pet` - 쓰다듬기 시도
- `GET /pet/history` - 쓰다듬기 히스토리

#### 잭팟
- `GET /jackpot/:characterId` - 잭팟 상태 조회
- `GET /jackpot/history` - 잭팟 히스토리

#### 도감
- `GET /codex` - 내 도감 조회
- `GET /codex/character/:characterId` - 캐릭터 도감 통계

#### 스킬
- `GET /skills` - 스킬 목록
- `POST /skills/:id/purchase` - 스킬 구매
- `POST /skills/:id/activate` - 스킬 활성화

---

## 🔧 문제 해결

### PostgreSQL 연결 오류
```bash
# PostgreSQL 실행 확인
brew services list

# 재시작
brew services restart postgresql@15
```

### Redis 연결 오류
```bash
# Redis 실행 확인
redis-cli ping

# 재시작
brew services restart redis
```

### Prisma 마이그레이션 오류
```bash
# 마이그레이션 리셋 (⚠️ 데이터 삭제됨)
npx prisma migrate reset

# 다시 마이그레이션
npm run prisma:migrate

# 시드 데이터
npm run prisma:seed
```

### 포트 이미 사용 중
```bash
# 3000번 포트 사용 중인 프로세스 찾기
lsof -i :3000

# 프로세스 종료
kill -9 <PID>
```

---

## 📊 현재 상태 확인

```bash
# PostgreSQL
pg_isready

# Redis
redis-cli ping

# 서버
curl http://localhost:8090/api/health

# 데이터베이스 데이터 확인
npm run prisma:studio
```

---

## 🎯 다음 단계

1. ✅ 로컬 환경 완성
2. ⬜ 프론트엔드 개발
3. ⬜ World ID 통합 테스트
4. ⬜ Mainnet 배포 준비
5. ⬜ 프로덕션 환경 설정

---

## 📚 참고 문서

- [README.md](README.md) - 프로젝트 개요
- [SETUP.md](SETUP.md) - 상세 설정 가이드
- [TESTING.md](TESTING.md) - 테스트 가이드
- [BLOCKCHAIN_SETUP.md](BLOCKCHAIN_SETUP.md) - 블록체인 가이드
- [API_SPEC.md](api-spec.md) - API 명세
