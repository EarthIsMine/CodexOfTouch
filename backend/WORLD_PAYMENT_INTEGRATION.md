# World Mini Apps Payment Integration Guide

이 가이드는 Petting Roulette Game의 스킬 구매 시스템을 World Mini Apps의 결제 시스템과 연동하는 방법을 설명합니다.

## 📋 목차

1. [사전 준비](#사전-준비)
2. [백엔드 설정](#백엔드-설정)
3. [프론트엔드 구현](#프론트엔드-구현)
4. [결제 흐름](#결제-흐름)
5. [테스트](#테스트)
6. [문제 해결](#문제-해결)

---

## 🔧 사전 준비

### 1. World Developer Portal 설정

1. [World Developer Portal](https://developer.worldcoin.org)에 접속하여 로그인
2. Mini App 생성 또는 기존 앱 선택
3. **API Key 발급**:
   - Developer Portal의 Settings에서 API Key 생성
   - `.env` 파일에 추가 (아래 참조)

4. **결제 수신 지갑 주소 화이트리스트 등록**:
   - Settings > Payment Whitelist에서 서버 지갑 주소 등록
   - 보안을 위해 반드시 등록 필요 (개발 중에는 비활성화 가능)

### 2. 필요한 패키지 설치

```bash
# 백엔드 (이미 설치됨)
npm install axios

# 프론트엔드 (MiniKit SDK)
npm install @worldcoin/minikit-js
```

---

## ⚙️ 백엔드 설정

### 1. 환경 변수 설정

`.env` 파일에 다음을 추가:

```env
# World Developer Portal API (for payment verification)
WORLD_API_KEY=your_actual_world_api_key_here
SERVER_WALLET_ADDRESS=0xYourServerWalletAddressHere
```

**중요**:
- `WORLD_API_KEY`가 설정되지 않으면 payment verification이 자동으로 통과됩니다 (개발/테스트용)
- 프로덕션에서는 반드시 설정해야 합니다

### 2. 백엔드 구현 확인

다음 파일들이 이미 구현되어 있습니다:

- `src/services/world-payment.service.ts` - World Developer Portal API 통신
- `src/services/skill.service.ts` - 스킬 구매 및 payment verification
- `src/controllers/skill.controller.ts` - API 엔드포인트

### 3. API 엔드포인트

#### 스킬 구매
```
POST /api/skills/:skillId/purchase
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "transactionId": "minikit_transaction_id",
  "paymentReference": "unique_uuid_reference"
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "userSkill": {
      "userId": "uuid",
      "skillId": 1,
      "expiresAt": "2025-02-13T12:00:00.000Z"
    }
  }
}
```

---

## 💻 프론트엔드 구현

### 1. MiniKit 초기화

```typescript
import { MiniKit } from '@worldcoin/minikit-js';

// World App에서 실행 중인지 확인
if (!MiniKit.isInstalled()) {
  console.error('MiniKit is not installed');
  // World App으로 리다이렉트 또는 에러 메시지 표시
}

// MiniKit 초기화
MiniKit.install({
  appId: 'app_staging_xxxxx', // Developer Portal에서 발급받은 App ID
  // 기타 설정...
});
```

### 2. 스킬 구매 흐름 구현

```typescript
import { MiniKit, PayCommandInput, ResponseEvent } from '@worldcoin/minikit-js';
import { v4 as uuidv4 } from 'uuid';

async function purchaseSkill(skillId: number, priceWld: number) {
  try {
    // 1. 백엔드에서 payment reference 생성
    const paymentReference = uuidv4().replace(/-/g, ''); // UUID (하이픈 제거)

    // 백엔드에 reference 저장 (선택사항 - 추가 검증용)
    await fetch('/api/skills/prepare-purchase', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        skillId,
        paymentReference,
      }),
    });

    // 2. MiniKit Pay command 실행
    const paymentPayload: PayCommandInput = {
      reference: paymentReference,
      to: '0xYourServerWalletAddress', // 서버 지갑 주소
      tokens: [
        {
          symbol: 'WLD',
          token_amount: priceWld.toString(),
        },
      ],
      description: `Purchase Skill #${skillId}`,
      // network: 'worldchain', // 선택사항
    };

    // Async 방식 (권장)
    const { finalPayload } = await MiniKit.commandsAsync.pay(paymentPayload);

    if (finalPayload.status === 'success') {
      // 3. 백엔드에 결제 검증 요청
      const response = await fetch(`/api/skills/${skillId}/purchase`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: finalPayload.transaction_id,
          paymentReference: paymentReference,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Skill purchased successfully!', result.data);
        return result.data;
      } else {
        throw new Error(result.error.message);
      }
    } else {
      throw new Error('Payment failed or was cancelled');
    }
  } catch (error) {
    console.error('❌ Failed to purchase skill:', error);
    throw error;
  }
}
```

### 3. Event Listener 방식 (대안)

```typescript
// Payment response 리스너 등록
MiniKit.subscribe(ResponseEvent.MiniAppPayment, async (payload) => {
  if (payload.status === 'success') {
    console.log('Payment success:', payload);

    // 백엔드에 검증 요청
    const response = await fetch(`/api/skills/${skillId}/purchase`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionId: payload.transaction_id,
        paymentReference: yourStoredReference,
      }),
    });

    // ... 결과 처리
  }
});

// Pay command 실행
MiniKit.commands.pay(paymentPayload);
```

### 4. React 컴포넌트 예시

```typescript
import React, { useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';

interface Skill {
  id: number;
  name: string;
  priceWld: number;
  description: string;
}

export function SkillPurchaseButton({ skill }: { skill: Skill }) {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      await purchaseSkill(skill.id, skill.priceWld);
      alert(`✅ ${skill.name} 구매 완료!`);
    } catch (error) {
      alert(`❌ 구매 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePurchase}
      disabled={loading}
      className="purchase-button"
    >
      {loading ? '구매 중...' : `${skill.priceWld} WLD로 구매`}
    </button>
  );
}
```

---

## 🔄 결제 흐름

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Frontend   │         │  MiniKit    │         │   Backend    │         │  World API  │
└──────┬──────┘         └──────┬──────┘         └──────┬───────┘         └──────┬──────┘
       │                       │                        │                        │
       │ 1. Generate UUID      │                        │                        │
       │  (paymentReference)   │                        │                        │
       │───────────────────────>                        │                        │
       │                       │                        │                        │
       │ 2. MiniKit.pay()      │                        │                        │
       │───────────────────────>                        │                        │
       │                       │                        │                        │
       │                       │ 3. Show payment drawer │                        │
       │                       │   (user confirms)      │                        │
       │                       │                        │                        │
       │ 4. Payment response   │                        │                        │
       │<───────────────────────                        │                        │
       │  (transaction_id)     │                        │                        │
       │                       │                        │                        │
       │ 5. POST /purchase     │                        │                        │
       │  (transactionId,      │                        │                        │
       │   paymentReference)   │                        │                        │
       │───────────────────────────────────────────────>│                        │
       │                       │                        │                        │
       │                       │                        │ 6. Verify payment      │
       │                       │                        │───────────────────────>│
       │                       │                        │                        │
       │                       │                        │ 7. Transaction status  │
       │                       │                        │<───────────────────────│
       │                       │                        │                        │
       │                       │                        │ 8. Save to DB          │
       │                       │                        │                        │
       │ 9. Success response   │                        │                        │
       │<───────────────────────────────────────────────│                        │
       │                       │                        │                        │
```

### 단계별 설명:

1. **프론트엔드**: UUID 생성 (`paymentReference`)
2. **프론트엔드**: MiniKit의 `pay()` command 호출
3. **MiniKit**: World App이 결제 확인 drawer 표시
4. **MiniKit**: 사용자 확인 후 `transaction_id` 반환 (⚠️ 아직 on-chain에 반영 안 됨)
5. **프론트엔드**: 백엔드에 `transactionId`와 `paymentReference` 전송
6. **백엔드**: World Developer Portal API로 transaction 검증 요청
7. **World API**: Transaction 상태 및 세부정보 반환
8. **백엔드**: 검증 성공 시 DB에 구매 기록 저장
9. **백엔드**: 프론트엔드에 성공 응답

---

## 🧪 테스트

### 1. 개발 환경 테스트 (World API Key 없이)

`.env`에서 `WORLD_API_KEY`를 비워두면 payment verification이 자동으로 통과됩니다:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "test-tx-123",
    "paymentReference": "test-ref-456"
  }' \
  http://localhost:8090/api/skills/1/purchase
```

### 2. World App Simulator 사용

World에서 제공하는 Mini App Simulator를 사용하여 실제 결제 플로우 테스트:
- [World Developer Portal](https://developer.worldcoin.org) > Your App > Simulator

### 3. Staging 환경 테스트

1. `WORLDCOIN_APP_ID`를 `app_staging_xxxxx`로 설정
2. World App (Testnet Mode)에서 Mini App 실행
3. Testnet WLD로 실제 결제 테스트

### 4. Production 테스트

1. Production App ID 사용
2. 실제 WLD 토큰으로 소액 테스트
3. 모든 검증 로직이 작동하는지 확인

---

## 🐛 문제 해결

### 1. "MiniKit is not installed" 에러

**원인**: World App 외부에서 실행 중

**해결**:
```typescript
if (!MiniKit.isInstalled()) {
  // World App으로 리다이렉트
  window.location.href = 'https://worldcoin.org/download';
}
```

### 2. "Invalid World API key" (401 에러)

**원인**: `.env`의 `WORLD_API_KEY`가 잘못되었거나 만료됨

**해결**:
1. Developer Portal에서 새 API key 발급
2. `.env` 업데이트 후 서버 재시작

### 3. "Payment recipient address mismatch" 에러

**원인**: 프론트엔드에서 보낸 `to` 주소가 서버의 `SERVER_WALLET_ADDRESS`와 다름

**해결**:
1. 프론트엔드 코드의 `to` 주소 확인
2. `.env`의 `SERVER_WALLET_ADDRESS` 확인
3. Developer Portal의 Whitelist 확인

### 4. "Transaction not found" (404 에러)

**원인**: Transaction이 아직 World API에 등록되지 않음 (네트워크 지연)

**해결**:
```typescript
// Retry logic 추가
async function verifyPaymentWithRetry(transactionId, reference, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`/api/skills/${skillId}/purchase`, { ... });
      if (response.ok) return response.json();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
    }
  }
}
```

### 5. "Payment amount insufficient" 에러

**원인**:
- 프론트엔드에서 보낸 WLD 금액이 스킬 가격보다 적음
- 가격 계산 오류

**해결**:
1. 스킬 가격 확인: `GET /api/skills`
2. `token_amount`가 정확한지 확인 (string 타입)
3. Decimal 처리 확인 (WLD는 18 decimals)

### 6. Payment drawer가 표시되지 않음

**원인**: World App의 권한 문제 또는 네트워크 문제

**해결**:
1. World App 버전 확인 (최신 버전으로 업데이트)
2. 네트워크 연결 확인
3. Developer Portal에서 App이 활성화되어 있는지 확인

---

## 📚 추가 리소스

- [World Mini Apps 공식 문서](https://docs.world.org/mini-apps)
- [MiniKit JS SDK](https://github.com/worldcoin/minikit-js)
- [World Developer Portal](https://developer.worldcoin.org)
- [Payment Command 문서](https://docs.world.org/mini-apps/commands/pay)
- [World Discord Community](https://discord.gg/worldcoin)

---

## 🔒 보안 고려사항

1. **절대 프론트엔드를 신뢰하지 마세요**
   - 모든 결제는 반드시 백엔드에서 검증
   - 프론트엔드 데이터는 조작 가능

2. **API Key 보호**
   - `.env` 파일을 `.gitignore`에 추가
   - API key를 절대 프론트엔드에 노출하지 말 것

3. **지갑 주소 화이트리스트**
   - Developer Portal에서 수신 지갑 주소 화이트리스트 설정
   - 프로덕션에서는 반드시 활성화

4. **Rate Limiting**
   - 스킬 구매 API에 rate limiting 적용 (이미 구현됨)
   - 중복 결제 방지 로직 추가 고려

5. **트랜잭션 로깅**
   - 모든 결제 시도를 로깅
   - 실패한 검증도 기록하여 보안 모니터링

---

## ✅ 체크리스트

프로덕션 배포 전:

- [ ] World Developer Portal에서 Production App 생성
- [ ] Production API Key 발급 및 `.env` 설정
- [ ] 서버 지갑 주소 생성 및 `.env` 설정
- [ ] 서버 지갑 주소를 Developer Portal에 화이트리스트 등록
- [ ] 프론트엔드 `appId`를 Production App ID로 변경
- [ ] 결제 플로우 end-to-end 테스트
- [ ] 에러 핸들링 확인
- [ ] 로깅 및 모니터링 설정
- [ ] Rate limiting 확인
- [ ] 보안 검토 완료
