# Petting Roulette - Smart Contracts

Foundry를 사용한 Sepolia 테스트넷 NFT 컨트랙트

## 빠른 시작

### 1. Foundry 설치

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### 2. 의존성 설치

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

### 3. 환경 변수 설정

```bash
cp .env.example .env
# .env 파일 수정하여 실제 값 입력
```

필요한 값:
- `SEPOLIA_RPC_URL`: Alchemy 또는 Infura에서 발급
- `PRIVATE_KEY`: MetaMask 개인키 (0x 포함)
- `ETHERSCAN_API_KEY`: Etherscan API 키

### 4. 테스트

```bash
# 모든 테스트 실행
forge test

# 자세한 로그
forge test -vvv

# 가스 리포트
forge test --gas-report
```

### 5. Sepolia 배포

```bash
# 먼저 Sepolia Testnet ETH 받기
# https://sepoliafaucet.com/

# 배포 (dry-run)
forge script script/Deploy.s.sol:DeployScript --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY

# 실제 배포 및 검증
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

### 6. 배포 후 설정

배포 완료 후 출력되는 컨트랙트 주소를:
1. `contracts/.env` 파일의 `CODEX_NFT_CONTRACT`에 입력
2. `../.env` (백엔드 루트)의 `CODEX_NFT_CONTRACT`에도 입력

```bash
# Example
CODEX_NFT_CONTRACT=0x1234567890abcdef1234567890abcdef12345678
```

## 컨트랙트 구조

```
contracts/
├── src/
│   └── CodexNFT.sol           # 메인 NFT 컨트랙트
├── test/
│   └── CodexNFT.t.sol         # 테스트
├── script/
│   ├── Deploy.s.sol           # 배포 스크립트
│   └── Interact.s.sol         # 상호작용 스크립트
└── foundry.toml               # Foundry 설정
```

## 주요 기능

### CodexNFT Contract

- `mintCodex(address to, uint256 characterId, string tokenURI)` - NFT 발급
- `hasCharacter(address owner, uint256 characterId)` - 소유 여부 확인
- `batchMintCodex(...)` - 배치 발급

## 로컬 테스트 (Anvil)

```bash
# 터미널 1: Anvil 시작
anvil

# 터미널 2: 로컬 배포
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

## 유용한 명령어

```bash
# 컴파일
forge build

# 특정 테스트 실행
forge test --match-test testMintCodex

# 커버리지
forge coverage

# 포맷팅
forge fmt

# 컨트랙트 크기 확인
forge build --sizes
```

## Etherscan 검증 (수동)

배포 시 자동 검증이 실패한 경우:

```bash
forge verify-contract \
  --chain-id 11155111 \
  --num-of-optimizations 200 \
  --compiler-version v0.8.20 \
  <CONTRACT_ADDRESS> \
  src/CodexNFT.sol:CodexNFT \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

## 문제 해결

### 1. "insufficient funds" 에러
- Sepolia Faucet에서 테스트 ETH 받기
- https://sepoliafaucet.com/

### 2. RPC 에러
- Alchemy 또는 Infura 대시보드에서 RPC URL 확인
- Rate limit 확인

### 3. 검증 실패
- Etherscan API 키 확인
- 컴파일러 버전 일치 확인 (0.8.20)
- 최적화 설정 확인 (200 runs)

## 참고 자료

- [Foundry Book](https://book.getfoundry.sh/)
- [OpenZeppelin Docs](https://docs.openzeppelin.com/)
- [Sepolia Testnet](https://sepolia.dev/)
- [전체 가이드](../BLOCKCHAIN_SETUP.md)
