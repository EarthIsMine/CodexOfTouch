# Petting Roulette Game - API 명세서

## 공통 사항

### Base URL
```
http://localhost:8090/api
```

### 인증
대부분의 엔드포인트는 JWT 토큰이 필요합니다.

**Header:**
```
Authorization: Bearer <JWT_TOKEN>
```

### 공통 응답 포맷

**성공 응답:**
```json
{
  "success": true,
  "data": { ... }
}
```

**에러 응답:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { ... }
  }
}
```

### HTTP 상태 코드
- `200 OK`: 성공
- `201 Created`: 생성 성공
- `400 Bad Request`: 잘못된 요청
- `401 Unauthorized`: 인증 실패
- `403 Forbidden`: 권한 없음
- `404 Not Found`: 리소스 없음
- `429 Too Many Requests`: Rate Limit 초과
- `500 Internal Server Error`: 서버 오류

---

## 1. Authentication (인증)

### 1.1 World ID 인증

**Endpoint:** `POST /auth/worldid`

**설명:** World ID Proof를 검증하고 JWT 토큰을 발급합니다.

**요청 Body:**
```json
{
  "proof": {
    "merkle_root": "0x...",
    "nullifier_hash": "0x...",
    "proof": "0x...",
    "verification_level": "orb"
  },
  "walletAddress": "0x..." // Optional
}
```

**응답 (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "nullifierHash": "0x...",
      "walletAddress": "0x...",
      "internalBalance": 10,
      "lastCheckIn": "2024-01-01T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

**에러:**
- `AUTH_001`: Invalid World ID proof
- `AUTH_002`: Duplicate user (nullifierHash already exists)

---

## 2. User (사용자)

### 2.1 내 정보 조회

**Endpoint:** `GET /users/me`

**인증:** Required

**응답 (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "nullifierHash": "0x...",
      "walletAddress": "0x...",
      "internalBalance": 100,
      "lastCheckIn": "2024-01-01T00:00:00Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

---

### 2.2 출석 체크

**Endpoint:** `POST /users/checkin`

**인증:** Required

**설명:**
- 하루 1회 가능 (UTC 기준)
- 기본 보상: 10 재화
- 연속 출석 보너스 적용

**응답 (200):**
```json
{
  "success": true,
  "data": {
    "reward": 10,
    "streak": 5,
    "totalBalance": 110
  }
}
```

**에러:**
- `USER_001`: Already checked in today
- `USER_002`: Invalid check-in time

---

## 3. Character (캐릭터)

### 3.1 활성 캐릭터 조회

**Endpoint:** `GET /characters/active`

**인증:** Optional (인증 시 더 많은 정보 제공)

**응답 (200):**
```json
{
  "success": true,
  "data": {
    "character": {
      "id": 1,
      "name": "Fluffy Cat",
      "imageUrl": "https://...",
      "isActive": true
    },
    "jackpot": {
      "currentPool": 1500,
      "lastPetAt": "2024-01-01T12:00:00Z",
      "timeRemaining": 180
    },
    "myStats": {
      "hasInCodex": true,
      "totalPets": 25,
      "successCount": 3
    }
  }
}
```

**에러:**
- `CHAR_001`: No active character

---

### 3.2 전체 캐릭터 목록 조회

**Endpoint:** `GET /characters`

**인증:** Optional

**Query Parameters:**
- `includeInactive`: boolean (default: false)

**응답 (200):**
```json
{
  "success": true,
  "data": {
    "characters": [
      {
        "id": 1,
        "name": "Fluffy Cat",
        "imageUrl": "https://...",
        "isActive": true,
        "stats": {
          "totalPets": 1000,
          "totalSuccess": 150,
          "successRate": 0.15
        }
      }
    ]
  }
}
```

---

## 4. Pet (쓰다듬기)

### 4.1 쓰다듬기 시도

**Endpoint:** `POST /pet`

**인증:** Required

**설명:**
- 내부 재화 1개 소모
- 확률 기반 성공/실패 판정
- 실패 시 30초 쿨타임 (스킬로 감소 가능)
- 성공 시 도감 등록 및 잭팟 타이머 리셋

**요청 Body:**
```json
{
  "characterId": 1,
  "skillId": 1 // Optional: 사용할 스킬 ID
}
```

**응답 - 성공 (200):**
```json
{
  "success": true,
  "data": {
    "result": "SUCCESS",
    "codexUnlocked": true,
    "jackpot": {
      "currentPool": 1501,
      "timeRemaining": 300
    },
    "rewards": {
      "balanceChange": -1
    }
  }
}
```

**응답 - 실패 (200):**
```json
{
  "success": true,
  "data": {
    "result": "FAIL",
    "cooldownUntil": "2024-01-01T12:00:30Z",
    "jackpot": {
      "currentPool": 1501
    },
    "rewards": {
      "balanceChange": -1
    }
  }
}
```

**에러:**
- `PET_001`: Insufficient balance
- `PET_002`: Cooldown active
- `PET_003`: No active character
- `PET_004`: Character locked (by another user's skill)

---

### 4.2 내 쓰다듬기 기록

**Endpoint:** `GET /pet/history`

**인증:** Required

**Query Parameters:**
- `limit`: number (default: 20, max: 100)
- `offset`: number (default: 0)
- `characterId`: number (optional, filter by character)

**응답 (200):**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": 1,
        "characterId": 1,
        "characterName": "Fluffy Cat",
        "result": "SUCCESS",
        "balanceUsed": 1,
        "createdAt": "2024-01-01T12:00:00Z"
      }
    ],
    "pagination": {
      "total": 100,
      "limit": 20,
      "offset": 0
    }
  }
}
```

---

## 5. Codex (도감)

### 5.1 내 도감 조회

**Endpoint:** `GET /codex/me`

**인증:** Required

**응답 (200):**
```json
{
  "success": true,
  "data": {
    "codex": [
      {
        "characterId": 1,
        "characterName": "Fluffy Cat",
        "characterImage": "https://...",
        "contractAddress": "0x...",
        "tokenId": "123",
        "chainId": 1,
        "mintedAt": "2024-01-01T12:00:00Z"
      }
    ],
    "stats": {
      "total": 5,
      "collected": 3,
      "percentage": 60
    }
  }
}
```

---

### 5.2 특정 캐릭터 도감 통계

**Endpoint:** `GET /codex/character/:characterId`

**인증:** Optional

**응답 (200):**
```json
{
  "success": true,
  "data": {
    "characterId": 1,
    "characterName": "Fluffy Cat",
    "stats": {
      "totalPlayers": 1000,
      "unlockedBy": 150,
      "unlockRate": 0.15
    },
    "recentUnlocks": [
      {
        "userId": "uuid",
        "walletAddress": "0x...1234",
        "mintedAt": "2024-01-01T12:00:00Z"
      }
    ]
  }
}
```

---

## 6. Jackpot (잭팟)

### 6.1 현재 잭팟 상태

**Endpoint:** `GET /jackpot/current`

**인증:** Optional

**응답 (200):**
```json
{
  "success": true,
  "data": {
    "characterId": 1,
    "characterName": "Fluffy Cat",
    "currentPool": 1500,
    "lastUserId": "uuid",
    "lastUserWallet": "0x...1234",
    "lastPetAt": "2024-01-01T12:00:00Z",
    "timeRemaining": 180,
    "status": "ACTIVE"
  }
}
```

---

### 6.2 잭팟 히스토리

**Endpoint:** `GET /jackpot/history`

**인증:** Optional

**Query Parameters:**
- `limit`: number (default: 10, max: 50)
- `offset`: number (default: 0)
- `characterId`: number (optional)

**응답 (200):**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "roundId": 1,
        "characterId": 1,
        "characterName": "Fluffy Cat",
        "winnerWallet": "0x...",
        "amount": 1500,
        "txHash": "0x...",
        "chainId": 1,
        "committedAt": "2024-01-01T12:05:00Z"
      }
    ],
    "pagination": {
      "total": 50,
      "limit": 10,
      "offset": 0
    }
  }
}
```

---

## 7. Skills (스킬)

### 7.1 전체 스킬 목록

**Endpoint:** `GET /skills`

**인증:** Optional

**응답 (200):**
```json
{
  "success": true,
  "data": {
    "skills": [
      {
        "id": 1,
        "name": "Quick Hands",
        "description": "쿨타임을 15초 감소시킵니다",
        "effectType": "COOLDOWN_REDUCE",
        "value": 15,
        "durationSec": 3600,
        "priceWld": 5,
        "isActive": true
      }
    ]
  }
}
```

---

### 7.2 내 보유 스킬

**Endpoint:** `GET /skills/my`

**인증:** Required

**응답 (200):**
```json
{
  "success": true,
  "data": {
    "skills": [
      {
        "skillId": 1,
        "name": "Quick Hands",
        "description": "쿨타임을 15초 감소시킵니다",
        "effectType": "COOLDOWN_REDUCE",
        "value": 15,
        "acquiredAt": "2024-01-01T10:00:00Z",
        "expiresAt": "2024-01-01T11:00:00Z",
        "isOwned": true,
        "ownershipRemainingTime": 1800,
        "isActivated": true,
        "activatedAt": "2024-01-01T10:30:00Z",
        "activatedUntil": "2024-01-01T11:30:00Z",
        "activationRemainingTime": 600
      }
    ]
  }
}
```

**필드 설명:**
- `isOwned`: 스킬 소유 여부 (expiresAt 기준)
- `ownershipRemainingTime`: 스킬 소유권 남은 시간 (초)
- `isActivated`: 스킬이 현재 활성화되어 효과 적용 중인지
- `activatedAt`: 스킬 활성화 시작 시간
- `activatedUntil`: 스킬 활성화 종료 시간
- `activationRemainingTime`: 활성화 효과 남은 시간 (초)

---

### 7.3 스킬 구매

**Endpoint:** `POST /skills/:skillId/purchase`

**인증:** Required

**설명:**
- World Mini Apps의 Pay command로 WLD 결제
- 백엔드에서 World Developer Portal API로 결제 검증
- 검증 성공 시 스킬 지급
- 특정 스킬(`COOLDOWN_REDUCE`, `PET_REWARD_BONUS`, `SUCCESS_RATE_BOOST`)은 **구매 즉시 자동 활성화**

**요청 Body:**
```json
{
  "transactionId": "minikit_transaction_id",
  "paymentReference": "unique_uuid_reference"
}
```

**응답 (201):**
```json
{
  "success": true,
  "data": {
    "userSkill": {
      "skillId": 1,
      "userId": "uuid",
      "acquiredAt": "2024-01-01T12:00:00Z",
      "expiresAt": "2024-01-01T13:00:00Z"
    },
    "autoActivated": true,
    "activation": {
      "activated": true,
      "expiresAt": "2024-01-01T13:00:00Z",
      "effect": {
        "type": "COOLDOWN_REDUCE",
        "value": 15
      }
    }
  }
}
```

**필드 설명:**
- `autoActivated`: 자동 활성화 여부
- `activation`: 활성화 정보 (자동 활성화된 경우에만)
  - `activated`: 활성화 성공 여부
  - `expiresAt`: 활성화 효과 종료 시간
  - `effect`: 스킬 효과 정보

**에러:**
- `SKILL_003`: Invalid transaction hash
- `SKILL_004`: Transaction not found
- `SKILL_005`: Insufficient payment
- `AUTH_003`: Unauthorized (invalid/missing JWT)
- `SERVER_ERROR`: Payment verification failed

---

### 7.4 스킬 사용

**Endpoint:** `POST /skills/:skillId/use`

**인증:** Required

**설명:**
- 보유한 스킬을 활성화
- 즉시 효과 적용

**응답 (200):**
```json
{
  "success": true,
  "data": {
    "activated": true,
    "expiresAt": "2024-01-01T13:00:00Z",
    "effect": {
      "type": "COOLDOWN_REDUCE",
      "value": 15
    }
  }
}
```

**에러:**
- `SKILL_001`: Skill not owned
- `SKILL_002`: Skill expired
- `SKILL_006`: Skill already active

---

## 8. Stats (통계)

### 8.1 리더보드

**Endpoint:** `GET /stats/leaderboard`

**인증:** Optional

**Query Parameters:**
- `type`: enum (`codex` | `jackpot`) - 리더보드 타입
- `limit`: number (default: 100, max: 100)
- `period`: enum (`all` | `week` | `month`) - 기간 (jackpot만 해당)

**응답 - Codex 리더보드 (200):**
```json
{
  "success": true,
  "data": {
    "type": "codex",
    "leaderboard": [
      {
        "rank": 1,
        "userId": "uuid",
        "walletAddress": "0x...1234",
        "codexCount": 5,
        "percentage": 100
      }
    ],
    "myRank": {
      "rank": 42,
      "codexCount": 3,
      "percentage": 60
    }
  }
}
```

**응답 - Jackpot 리더보드 (200):**
```json
{
  "success": true,
  "data": {
    "type": "jackpot",
    "period": "all",
    "leaderboard": [
      {
        "rank": 1,
        "walletAddress": "0x...1234",
        "totalWins": 10,
        "totalAmount": 15000
      }
    ]
  }
}
```

---

### 8.2 전체 게임 통계

**Endpoint:** `GET /stats/game`

**인증:** Optional

**응답 (200):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1000,
    "totalPets": 50000,
    "totalSuccessfulPets": 7500,
    "successRate": 0.15,
    "totalJackpotsAwarded": 50,
    "totalRewardsDistributed": 75000,
    "activeCharacter": {
      "id": 1,
      "name": "Fluffy Cat",
      "currentPool": 1500
    }
  }
}
```

---

## 9. Admin (관리자) - MVP에서는 제외

### 9.1 캐릭터 로테이션

**Endpoint:** `POST /admin/characters/rotate`

**인증:** Required (Admin Role)

**응답 (200):**
```json
{
  "success": true,
  "data": {
    "previousCharacter": {
      "id": 1,
      "name": "Fluffy Cat"
    },
    "newCharacter": {
      "id": 2,
      "name": "Happy Dog"
    }
  }
}
```

---

## 10. Health Check

### 10.1 서버 상태 확인

**Endpoint:** `GET /health`

**인증:** Not Required

**응답 (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T12:00:00Z",
    "services": {
      "database": "connected",
      "redis": "connected",
      "blockchain": "connected"
    }
  }
}
```

---

## Rate Limiting

모든 엔드포인트는 Rate Limiting이 적용됩니다:

- **일반 API**: 100 req/min per IP
- **Pet API**: 10 req/min per User
- **Skill 사용**: 5 req/min per User

Rate Limit 초과 시:

**응답 (429):**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT",
    "message": "Too many requests",
    "details": {
      "retryAfter": 30
    }
  }
}
```

---

## WebSocket Events (푸시 알림 대안)

MVP에서는 Polling 방식을 사용하지만, 추후 WebSocket으로 전환 가능:

### Events
- `pet:success`: 누군가 쓰다듬기에 성공
- `jackpot:won`: 잭팟 당첨
- `character:rotated`: 캐릭터 교체
- `pool:updated`: 잭팟 풀 업데이트

---

## 에러 코드 전체 목록

| 코드 | 설명 |
|------|------|
| AUTH_001 | Invalid World ID proof |
| AUTH_002 | Duplicate user |
| USER_001 | Already checked in today |
| USER_002 | Invalid check-in time |
| PET_001 | Insufficient balance |
| PET_002 | Cooldown active |
| PET_003 | No active character |
| PET_004 | Character locked |
| CHAR_001 | No active character |
| SKILL_001 | Skill not owned |
| SKILL_002 | Skill expired |
| SKILL_003 | Invalid transaction hash |
| SKILL_004 | Transaction not found |
| SKILL_005 | Insufficient payment |
| SKILL_006 | Skill already active |
| JACKPOT_001 | Jackpot not ready |
| RATE_LIMIT | Too many requests |
| SERVER_ERROR | Internal server error |
