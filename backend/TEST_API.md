# API 테스트 가이드

## 🧪 World ID 없이 테스트하기

### 1. 테스트 사용자 생성 (DB에 직접)

```bash
# Prisma Studio 열기
npm run prisma:studio

# User 테이블에서 수동으로 추가:
# - nullifierHash: "test-user-1"
# - walletAddress: "0x1234567890123456789012345678901234567890"
# - internalBalance: 1000
```

또는 psql로:
```sql
INSERT INTO users (id, nullifier_hash, wallet_address, internal_balance, created_at)
VALUES (
  gen_random_uuid(),
  'test-user-1',
  '0x1234567890123456789012345678901234567890',
  1000,
  NOW()
);
```

### 2. JWT 토큰 생성

Node.js REPL에서:
```bash
node
```

```javascript
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  {
    userId: 'USER_ID_FROM_DB',  // 위에서 생성한 UUID
    nullifierHash: 'test-user-1'
  },
  'petting-roulette-super-secret-key-2024',  // .env의 JWT_SECRET
  { expiresIn: '7d' }
);

console.log(token);
```

### 3. API 테스트

#### 사용자 정보 조회
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8090/api/user
```

#### 스킬 구매 (테스트용 - World API key 없으면 자동 통과)
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "test-tx-123",
    "paymentReference": "test-ref-456"
  }' \
  http://localhost:8090/api/skills/1/purchase
```

**참고**: `WORLD_API_KEY`가 설정되지 않으면 payment verification을 건너뜁니다 (개발/테스트용).

#### 스킬 활성화
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8090/api/skills/1/activate
```

#### 쓰다듬기 (스킬 효과 테스트)
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"characterId": 1}' \
  http://localhost:8090/api/pet
```

---

## 🔐 프로덕션용 World ID 연동

### World ID 인증 흐름

1. **프론트엔드에서 World ID 인증**
```typescript
import { IDKitWidget } from '@worldcoin/idkit';

<IDKitWidget
  app_id="app_staging_xxxxx"
  action="pet-game-auth"
  onSuccess={(proof) => {
    // 2. 백엔드에 proof 전송
    fetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify({
        proof: proof.proof,
        merkle_root: proof.merkle_root,
        nullifier_hash: proof.nullifier_hash,
        verification_level: proof.verification_level,
        walletAddress: userWallet
      })
    });
  }}
/>
```

2. **백엔드에서 검증 및 JWT 발급**
```typescript
// 이미 구현되어 있음 (auth.service.ts)
const { token, user } = await authService.authenticateWithWorldID(proof);
```

---

## 💰 WLD 토큰 결제 연동 (TODO)

### 필요한 작업

1. **WLD 토큰 컨트랙트 ABI 추가**
2. **트랜잭션 검증 함수 구현**
3. **프론트엔드에서 WLD 전송**

### 구현 예시

```typescript
// src/services/skill.service.ts
private async verifyWLDTransaction(
  txHash: string,
  from: string,
  expectedAmount: number
): Promise<boolean> {
  const provider = new ethers.JsonRpcProvider(config.blockchainRpcUrl);
  const tx = await provider.getTransaction(txHash);

  if (!tx) return false;

  // 트랜잭션 수신자 확인
  if (tx.to?.toLowerCase() !== config.serverWalletAddress.toLowerCase()) {
    return false;
  }

  // 보낸 사람 확인
  if (tx.from.toLowerCase() !== from.toLowerCase()) {
    return false;
  }

  // 금액 확인 (WLD는 18 decimals)
  const expectedWei = ethers.parseUnits(expectedAmount.toString(), 18);
  if (tx.value < expectedWei) {
    return false;
  }

  // 트랜잭션 확인 대기
  const receipt = await tx.wait();
  return receipt.status === 1;
}
```
