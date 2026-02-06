# Testing Guide

## 개요

이 프로젝트는 Jest와 Supertest를 사용하여 통합 테스트와 단위 테스트를 제공합니다.

## 테스트 구조

```
tests/
├── setup.ts                      # 테스트 환경 설정
├── helpers/
│   └── test-utils.ts            # 테스트 유틸리티 함수
├── integration/                  # 통합 테스트 (API)
│   ├── auth.test.ts
│   ├── user.test.ts
│   └── pet.test.ts
└── unit/                        # 단위 테스트 (Service)
    ├── pet.service.test.ts
    └── jackpot.service.test.ts
```

## 테스트 환경 설정

### 1. 테스트 데이터베이스 생성

```bash
createdb petting_game_test
```

### 2. 환경 변수 설정

`.env.test` 파일이 이미 준비되어 있습니다. 필요시 수정하세요.

### 3. 테스트 데이터베이스 마이그레이션

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/petting_game_test" npx prisma migrate deploy
```

## 테스트 실행

### 전체 테스트 실행
```bash
npm test
```

### Watch 모드 (개발 중)
```bash
npm run test:watch
```

### 커버리지 리포트
```bash
npm run test:coverage
```

### 특정 테스트 파일 실행
```bash
npm test -- auth.test
npm test -- pet.service.test
```

### 특정 테스트 케이스 실행
```bash
npm test -- -t "should authenticate with valid World ID"
```

## 테스트 카테고리

### 통합 테스트 (Integration Tests)

API 엔드포인트를 실제 HTTP 요청으로 테스트합니다.

**Auth API** (`tests/integration/auth.test.ts`)
- ✅ World ID 인증 성공
- ✅ World ID 인증 실패
- ✅ 기존 사용자 로그인
- ✅ 잘못된 요청 처리

**User API** (`tests/integration/user.test.ts`)
- ✅ 사용자 정보 조회
- ✅ 출석 체크
- ✅ 연속 출석 보너스
- ✅ 중복 출석 방지
- ✅ 인증 검증

**Pet API** (`tests/integration/pet.test.ts`)
- ✅ 쓰다듬기 성공
- ✅ 쓰다듬기 실패 및 쿨타임
- ✅ 잔액 부족 처리
- ✅ 비활성 캐릭터 처리
- ✅ 도감 등록
- ✅ 쓰다듬기 히스토리 조회
- ✅ 페이지네이션

### 단위 테스트 (Unit Tests)

개별 서비스 로직을 독립적으로 테스트합니다.

**PetService** (`tests/unit/pet.service.test.ts`)
- ✅ 쓰다듬기 로직
- ✅ 확률 판정
- ✅ 잔액 차감
- ✅ 잭팟 풀 업데이트
- ✅ 쿨타임 설정
- ✅ 히스토리 조회

**JackpotService** (`tests/unit/jackpot.service.test.ts`)
- ✅ 잭팟 상태 조회
- ✅ 잭팟 상태 (ACTIVE/READY/NO_ACTIVITY)
- ✅ 잭팟 지급 로직
- ✅ 자동 잭팟 체크
- ✅ 잭팟 히스토리

## 테스트 데이터 관리

### 테스트 유틸리티 함수

`tests/helpers/test-utils.ts`에서 제공하는 헬퍼 함수들:

```typescript
// 데이터베이스 정리
await cleanDatabase();

// Redis 정리
await cleanRedis();

// 테스트 사용자 생성
const user = await createTestUser({
  internalBalance: 100,
});

// 테스트 캐릭터 생성
const character = await createTestCharacter({
  isActive: true,
  successRate: 0.5,
});

// 테스트 스킬 생성
const skill = await createTestSkill({
  effectType: 'COOLDOWN_REDUCE',
});

// JWT 토큰 생성
const token = generateTestToken(user.id, user.nullifierHash);

// 초기 데이터 셋업
const { user, character, skill } = await setupTestData();
```

## Mock 설정

### World ID Service Mock

World ID 검증은 외부 API 호출이므로 Mock으로 처리합니다:

```typescript
import worldIdService from '@/services/worldid.service';

jest.mock('@/services/worldid.service');

// 성공 케이스
(worldIdService.verifyProof as jest.Mock).mockResolvedValue(true);

// 실패 케이스
(worldIdService.verifyProof as jest.Mock).mockResolvedValue(false);
```

### Logger Mock

테스트 중 로그 출력을 줄이기 위해 Logger는 자동으로 Mock됩니다 (`tests/setup.ts`).

## 테스트 격리

각 테스트는 독립적으로 실행됩니다:

- `beforeEach`: 각 테스트 전에 데이터베이스와 Redis 정리
- `afterAll`: 모든 테스트 후 연결 종료

## 테스트 작성 가이드

### 새 통합 테스트 추가

```typescript
import request from 'supertest';
import app from '@/app';
import { cleanDatabase, cleanRedis, createTestUser, generateTestToken } from '../helpers/test-utils';

describe('Your API', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await cleanRedis();
  });

  it('should do something', async () => {
    const user = await createTestUser();
    const token = generateTestToken(user.id, user.nullifierHash);

    const response = await request(app)
      .get('/api/your-endpoint')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

### 새 단위 테스트 추가

```typescript
import yourService from '@/services/your.service';
import { cleanDatabase, createTestUser } from '../helpers/test-utils';

describe('YourService', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('should do something', async () => {
    const user = await createTestUser();
    const result = await yourService.doSomething(user.id);
    expect(result).toBe(expected);
  });
});
```

## 커버리지 목표

- **라인 커버리지**: 80% 이상
- **브랜치 커버리지**: 70% 이상
- **함수 커버리지**: 80% 이상

커버리지 리포트는 `coverage/` 디렉토리에 생성됩니다.

## CI/CD 통합

GitHub Actions 등에서 실행 시:

```yaml
- name: Run tests
  run: |
    npm install
    npm run prisma:generate
    DATABASE_URL=$TEST_DATABASE_URL npm run prisma:migrate deploy
    npm test
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
    JWT_SECRET: ${{ secrets.TEST_JWT_SECRET }}
```

## 트러블슈팅

### 테스트 데이터베이스 연결 오류

```bash
# PostgreSQL 실행 확인
brew services list

# 테스트 데이터베이스 재생성
dropdb petting_game_test
createdb petting_game_test
```

### Redis 연결 오류

```bash
# Redis 실행 확인
redis-cli ping

# Redis 재시작
brew services restart redis
```

### Jest 타임아웃 에러

`jest.config.js`에서 `testTimeout`을 조정하거나 개별 테스트에서:

```typescript
jest.setTimeout(60000); // 60초
```

### 테스트 간 간섭 문제

각 테스트에서 `cleanDatabase()`와 `cleanRedis()`를 호출하여 격리를 보장하세요.

## 베스트 프랙티스

1. **테스트 독립성**: 각 테스트는 다른 테스트에 의존하지 않아야 합니다
2. **명확한 이름**: 테스트 이름은 무엇을 테스트하는지 명확히 표현해야 합니다
3. **AAA 패턴**: Arrange, Act, Assert 순서로 작성
4. **Mock 최소화**: 꼭 필요한 경우만 Mock 사용
5. **실제 데이터**: 가능한 한 실제 데이터베이스 사용

## 참고 자료

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
