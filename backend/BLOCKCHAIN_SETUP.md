# Blockchain Setup Guide - Foundry & Sepolia

이 가이드는 Foundry를 사용하여 Sepolia 테스트넷에 NFT 컨트랙트를 배포하고 백엔드와 통합하는 방법을 설명합니다.

## 목차

1. [Foundry 설치](#1-foundry-설치)
2. [프로젝트 구조](#2-프로젝트-구조)
3. [스마트 컨트랙트 작성](#3-스마트-컨트랙트-작성)
4. [로컬 테스트](#4-로컬-테스트)
5. [Sepolia 배포](#5-sepolia-배포)
6. [백엔드 통합](#6-백엔드-통합)

---

## 1. Foundry 설치

### 1.1 Foundry 설치

```bash
# Foundry 설치
curl -L https://foundry.paradigm.xyz | bash

# 터미널 재시작 또는 source
source ~/.zshrc  # or ~/.bashrc

# Foundry 업데이트
foundryup
```

### 1.2 설치 확인

```bash
forge --version
cast --version
anvil --version
```

---

## 2. 프로젝트 구조

### 2.1 Foundry 프로젝트 초기화

```bash
# 프로젝트 루트에서 contracts 디렉토리 생성
mkdir contracts
cd contracts

# Foundry 초기화
forge init --no-git .
```

생성되는 구조:
```
contracts/
├── src/
│   └── CodexNFT.sol          # NFT 컨트랙트
├── test/
│   └── CodexNFT.t.sol        # 테스트
├── script/
│   ├── Deploy.s.sol          # 배포 스크립트
│   └── Interact.s.sol        # 상호작용 스크립트
├── lib/                      # 의존성
├── foundry.toml              # Foundry 설정
└── .env                      # 환경 변수
```

---

## 3. 스마트 컨트랙트 작성

### 3.1 CodexNFT 컨트랙트 (`src/CodexNFT.sol`)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CodexNFT
 * @dev Petting Roulette Game의 캐릭터 도감 NFT
 */
contract CodexNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    // 캐릭터 ID별 토큰 추적
    mapping(uint256 => uint256) public characterToTokenId;

    // 사용자별 캐릭터별 NFT 발급 여부
    mapping(address => mapping(uint256 => bool)) public hasMinted;

    // 이벤트
    event CodexMinted(address indexed to, uint256 indexed tokenId, uint256 indexed characterId, string tokenURI);

    constructor() ERC721("Petting Codex", "CODEX") Ownable(msg.sender) {
        _tokenIdCounter = 1; // 1부터 시작
    }

    /**
     * @dev 캐릭터 도감 NFT 발급
     * @param to NFT를 받을 주소
     * @param characterId 캐릭터 ID
     * @param tokenURI 메타데이터 URI
     */
    function mintCodex(
        address to,
        uint256 characterId,
        string memory tokenURI
    ) public onlyOwner returns (uint256) {
        require(!hasMinted[to][characterId], "Already minted this character");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        characterToTokenId[characterId] = tokenId;
        hasMinted[to][characterId] = true;

        emit CodexMinted(to, tokenId, characterId, tokenURI);

        return tokenId;
    }

    /**
     * @dev 배치 민팅 (여러 캐릭터를 한 번에)
     */
    function batchMintCodex(
        address to,
        uint256[] memory characterIds,
        string[] memory tokenURIs
    ) public onlyOwner returns (uint256[] memory) {
        require(characterIds.length == tokenURIs.length, "Length mismatch");

        uint256[] memory tokenIds = new uint256[](characterIds.length);

        for (uint256 i = 0; i < characterIds.length; i++) {
            tokenIds[i] = mintCodex(to, characterIds[i], tokenURIs[i]);
        }

        return tokenIds;
    }

    /**
     * @dev 사용자가 특정 캐릭터 NFT를 보유하고 있는지 확인
     */
    function hasCharacter(address owner, uint256 characterId) public view returns (bool) {
        return hasMinted[owner][characterId];
    }

    /**
     * @dev 현재 토큰 카운터 조회
     */
    function getCurrentTokenId() public view returns (uint256) {
        return _tokenIdCounter;
    }

    // Override required functions
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
```

### 3.2 OpenZeppelin 의존성 설치

```bash
forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

### 3.3 Foundry 설정 (`foundry.toml`)

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.20"
optimizer = true
optimizer_runs = 200

remappings = [
    "@openzeppelin/=lib/openzeppelin-contracts/"
]

[rpc_endpoints]
sepolia = "${SEPOLIA_RPC_URL}"

[etherscan]
sepolia = { key = "${ETHERSCAN_API_KEY}" }
```

---

## 4. 로컬 테스트

### 4.1 테스트 작성 (`test/CodexNFT.t.sol`)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CodexNFT.sol";

contract CodexNFTTest is Test {
    CodexNFT public codexNFT;
    address public owner;
    address public user1;
    address public user2;

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);

        codexNFT = new CodexNFT();
    }

    function testMintCodex() public {
        uint256 characterId = 1;
        string memory tokenURI = "ipfs://QmTest123";

        uint256 tokenId = codexNFT.mintCodex(user1, characterId, tokenURI);

        assertEq(tokenId, 1);
        assertEq(codexNFT.ownerOf(tokenId), user1);
        assertEq(codexNFT.tokenURI(tokenId), tokenURI);
        assertTrue(codexNFT.hasCharacter(user1, characterId));
    }

    function testCannotMintDuplicate() public {
        uint256 characterId = 1;
        string memory tokenURI = "ipfs://QmTest123";

        codexNFT.mintCodex(user1, characterId, tokenURI);

        vm.expectRevert("Already minted this character");
        codexNFT.mintCodex(user1, characterId, tokenURI);
    }

    function testBatchMint() public {
        uint256[] memory characterIds = new uint256[](3);
        characterIds[0] = 1;
        characterIds[1] = 2;
        characterIds[2] = 3;

        string[] memory tokenURIs = new string[](3);
        tokenURIs[0] = "ipfs://QmTest1";
        tokenURIs[1] = "ipfs://QmTest2";
        tokenURIs[2] = "ipfs://QmTest3";

        uint256[] memory tokenIds = codexNFT.batchMintCodex(user1, characterIds, tokenURIs);

        assertEq(tokenIds.length, 3);
        assertEq(codexNFT.ownerOf(tokenIds[0]), user1);
        assertEq(codexNFT.ownerOf(tokenIds[1]), user1);
        assertEq(codexNFT.ownerOf(tokenIds[2]), user1);
    }

    function testOnlyOwnerCanMint() public {
        vm.prank(user1);
        vm.expectRevert();
        codexNFT.mintCodex(user2, 1, "ipfs://test");
    }
}
```

### 4.2 테스트 실행

```bash
# 모든 테스트 실행
forge test

# 자세한 로그와 함께 실행
forge test -vvv

# 가스 리포트
forge test --gas-report

# 특정 테스트만 실행
forge test --match-test testMintCodex
```

---

## 5. Sepolia 배포

### 5.1 환경 변수 설정 (`.env`)

```bash
# Sepolia RPC URL (Alchemy 또는 Infura)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# 배포자 Private Key (MetaMask에서 export)
PRIVATE_KEY=0xyour_private_key_here

# Etherscan API Key (컨트랙트 검증용)
ETHERSCAN_API_KEY=your_etherscan_api_key

# 배포된 컨트랙트 주소 (배포 후 업데이트)
CODEX_NFT_CONTRACT=
```

### 5.2 Sepolia Testnet ETH 받기

1. [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
2. [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)
3. [Chainlink Sepolia Faucet](https://faucets.chain.link/sepolia)

### 5.3 배포 스크립트 (`script/Deploy.s.sol`)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CodexNFT.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        CodexNFT codexNFT = new CodexNFT();

        console.log("CodexNFT deployed to:", address(codexNFT));

        vm.stopBroadcast();
    }
}
```

### 5.4 Sepolia에 배포

```bash
# 환경 변수 로드
source .env

# Dry run (시뮬레이션)
forge script script/Deploy.s.sol:DeployScript --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY

# 실제 배포
forge script script/Deploy.s.sol:DeployScript --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY

# 배포 후 출력된 주소를 .env 파일에 저장
# CODEX_NFT_CONTRACT=0x...
```

### 5.5 컨트랙트 검증 (배포 시 자동으로 안 된 경우)

```bash
forge verify-contract \
  --chain-id 11155111 \
  --num-of-optimizations 200 \
  --compiler-version v0.8.20 \
  <CONTRACT_ADDRESS> \
  src/CodexNFT.sol:CodexNFT \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

---

## 6. 백엔드 통합

### 6.1 블록체인 서비스 구현 (`src/services/blockchain.service.ts`)

```typescript
import { ethers } from 'ethers';
import config from '@/config/env';
import logger from '@/config/logger';

// CodexNFT ABI (필요한 함수만)
const CODEX_NFT_ABI = [
  'function mintCodex(address to, uint256 characterId, string memory tokenURI) public returns (uint256)',
  'function hasCharacter(address owner, uint256 characterId) public view returns (bool)',
  'function ownerOf(uint256 tokenId) public view returns (address)',
  'function tokenURI(uint256 tokenId) public view returns (string)',
  'event CodexMinted(address indexed to, uint256 indexed tokenId, uint256 indexed characterId, string tokenURI)',
];

class BlockchainService {
  private provider: ethers.Provider;
  private wallet: ethers.Wallet;
  private codexNFTContract: ethers.Contract;

  constructor() {
    // Provider 설정
    this.provider = new ethers.JsonRpcProvider(config.blockchainRpcUrl);

    // Wallet 설정
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);

    // Contract 인스턴스
    this.codexNFTContract = new ethers.Contract(
      config.codexNftContract,
      CODEX_NFT_ABI,
      this.wallet
    );

    logger.info('Blockchain service initialized', {
      network: config.blockchainRpcUrl,
      contract: config.codexNftContract,
    });
  }

  /**
   * NFT 발급
   */
  async mintCodexNFT(
    userWallet: string,
    characterId: number,
    metadataUri: string
  ): Promise<{ tokenId: string; txHash: string }> {
    try {
      logger.info('Minting Codex NFT', { userWallet, characterId });

      // 이미 발급되었는지 확인
      const hasMinted = await this.codexNFTContract.hasCharacter(userWallet, characterId);
      if (hasMinted) {
        throw new Error('Already minted this character');
      }

      // NFT 발급 트랜잭션
      const tx = await this.codexNFTContract.mintCodex(userWallet, characterId, metadataUri);

      logger.info('Mint transaction sent', { txHash: tx.hash });

      // 트랜잭션 확인 대기
      const receipt = await tx.wait();

      // 이벤트에서 tokenId 추출
      const event = receipt.logs.find((log: any) => {
        try {
          return this.codexNFTContract.interface.parseLog(log)?.name === 'CodexMinted';
        } catch {
          return false;
        }
      });

      const parsedEvent = this.codexNFTContract.interface.parseLog(event);
      const tokenId = parsedEvent?.args.tokenId.toString();

      logger.info('Codex NFT minted successfully', {
        tokenId,
        txHash: receipt.hash,
      });

      return {
        tokenId,
        txHash: receipt.hash,
      };
    } catch (error) {
      logger.error('Failed to mint Codex NFT', { error, userWallet, characterId });
      throw error;
    }
  }

  /**
   * 사용자가 특정 캐릭터 NFT를 보유하고 있는지 확인
   */
  async hasCharacterNFT(userWallet: string, characterId: number): Promise<boolean> {
    try {
      return await this.codexNFTContract.hasCharacter(userWallet, characterId);
    } catch (error) {
      logger.error('Failed to check character NFT', { error, userWallet, characterId });
      return false;
    }
  }

  /**
   * NFT 메타데이터 URI 조회
   */
  async getTokenURI(tokenId: string): Promise<string> {
    try {
      return await this.codexNFTContract.tokenURI(tokenId);
    } catch (error) {
      logger.error('Failed to get token URI', { error, tokenId });
      throw error;
    }
  }

  /**
   * NFT 소유자 조회
   */
  async getTokenOwner(tokenId: string): Promise<string> {
    try {
      return await this.codexNFTContract.ownerOf(tokenId);
    } catch (error) {
      logger.error('Failed to get token owner', { error, tokenId });
      throw error;
    }
  }
}

export default new BlockchainService();
```

### 6.2 환경 변수 추가 (`.env`)

```bash
# Blockchain (Sepolia Testnet)
BLOCKCHAIN_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=0xyour_private_key_here
CODEX_NFT_CONTRACT=0xYourDeployedContractAddress
CHAIN_ID=11155111
```

### 6.3 Codex Service 업데이트 (`src/services/codex.service.ts`)

```typescript
import prisma from '@/config/database';
import blockchainService from './blockchain.service';
import logger from '@/config/logger';

class CodexService {
  /**
   * 캐릭터 첫 성공 시 도감 등록 및 NFT 발급
   */
  async unlockCharacter(userId: string, characterId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true },
    });

    if (!user?.walletAddress) {
      logger.warn('User has no wallet address, skipping NFT mint', { userId });
      return null;
    }

    // 도감 등록
    const codex = await prisma.codex.create({
      data: {
        userId,
        characterId,
      },
      include: {
        character: true,
      },
    });

    // NFT 발급 (비동기 - 백그라운드에서 처리)
    this.mintNFTAsync(user.walletAddress, characterId, codex.character.imageUrl)
      .catch((error) => {
        logger.error('Background NFT minting failed', { error, userId, characterId });
      });

    return codex;
  }

  /**
   * NFT 발급 (비동기)
   */
  private async mintNFTAsync(walletAddress: string, characterId: number, imageUrl: string) {
    try {
      // 메타데이터 URI 생성 (IPFS 또는 centralized storage)
      const metadataUri = await this.createMetadataUri(characterId, imageUrl);

      // NFT 발급
      const { tokenId, txHash } = await blockchainService.mintCodexNFT(
        walletAddress,
        characterId,
        metadataUri
      );

      logger.info('NFT minted successfully', {
        walletAddress,
        characterId,
        tokenId,
        txHash,
      });

      // TODO: DB에 NFT 정보 저장 (tokenId, txHash 등)
    } catch (error) {
      logger.error('Failed to mint NFT', { error, walletAddress, characterId });
      throw error;
    }
  }

  /**
   * 메타데이터 URI 생성
   * TODO: IPFS 또는 AWS S3에 메타데이터 업로드
   */
  private async createMetadataUri(characterId: number, imageUrl: string): Promise<string> {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new Error('Character not found');
    }

    // 임시: 온체인 메타데이터 URI (실제로는 IPFS 사용 권장)
    const metadata = {
      name: `${character.name} Codex`,
      description: `Petting Roulette Game - ${character.name} Character Codex`,
      image: imageUrl,
      attributes: [
        {
          trait_type: 'Character ID',
          value: characterId,
        },
        {
          trait_type: 'Success Rate',
          value: character.successRate,
        },
      ],
    };

    // TODO: IPFS에 업로드하고 URI 반환
    // 예: ipfs://QmXXXXXXXXXXXXXXXXXXXXXXXXXXXX

    return `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString('base64')}`;
  }
}

export default new CodexService();
```

---

## 7. 테스트 및 검증

### 7.1 로컬 Anvil 테스트

```bash
# Anvil 시작 (로컬 블록체인)
anvil

# 새 터미널에서 로컬 배포
forge script script/Deploy.s.sol:DeployScript --rpc-url http://127.0.0.1:8545 --broadcast
```

### 7.2 Sepolia 테스트

```bash
# 백엔드에서 NFT 발급 테스트
curl -X POST http://localhost:8090/api/pet \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"characterId": 1}'
```

### 7.3 Etherscan에서 확인

배포 후 Sepolia Etherscan에서 확인:
- 컨트랙트: `https://sepolia.etherscan.io/address/<CONTRACT_ADDRESS>`
- 트랜잭션: `https://sepolia.etherscan.io/tx/<TX_HASH>`

---

## 8. IPFS 메타데이터 호스팅 (선택)

### 8.1 Pinata 사용

```bash
npm install pinata-sdk
```

```typescript
import pinataSDK from '@pinata/sdk';

const pinata = new pinataSDK({
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataSecretApiKey: process.env.PINATA_SECRET_KEY,
});

async function uploadToIPFS(metadata: any): Promise<string> {
  const result = await pinata.pinJSONToIPFS(metadata);
  return `ipfs://${result.IpfsHash}`;
}
```

---

## 9. 다음 단계

1. ✅ Foundry 설치
2. ✅ 컨트랙트 작성
3. ✅ 로컬 테스트
4. ✅ Sepolia 배포
5. ✅ 백엔드 통합
6. 🔲 IPFS 메타데이터 호스팅
7. 🔲 프론트엔드에서 NFT 표시
8. 🔲 Mainnet 배포

---

## 참고 자료

- [Foundry Book](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Sepolia Testnet](https://sepolia.dev/)
