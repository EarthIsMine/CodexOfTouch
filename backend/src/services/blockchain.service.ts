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
  private provider?: ethers.Provider;
  private wallet?: ethers.Wallet;
  private codexNFTContract?: ethers.Contract;
  private initialized = false;

  constructor() {
    // Lazy initialization - only when needed
  }

  private ensureInitialized() {
    if (this.initialized) return;

    // Check if blockchain config is available
    if (!config.blockchainRpcUrl || !config.privateKey || !config.codexNftContract) {
      throw new Error('Blockchain configuration is not complete. Please set BLOCKCHAIN_RPC_URL, PRIVATE_KEY, and CODEX_NFT_CONTRACT in .env');
    }

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

    this.initialized = true;

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
    this.ensureInitialized();

    try {
      logger.info('Minting Codex NFT', { userWallet, characterId });

      // 이미 발급되었는지 확인
      const hasMinted = await this.codexNFTContract!.hasCharacter(userWallet, characterId);
      if (hasMinted) {
        throw new Error('Already minted this character');
      }

      // NFT 발급 트랜잭션
      const tx = await this.codexNFTContract!.mintCodex(userWallet, characterId, metadataUri);

      logger.info('Mint transaction sent', { txHash: tx.hash });

      // 트랜잭션 확인 대기
      const receipt = await tx.wait();

      // 이벤트에서 tokenId 추출
      const event = receipt.logs.find((log: any) => {
        try {
          return this.codexNFTContract!.interface.parseLog(log)?.name === 'CodexMinted';
        } catch {
          return false;
        }
      });

      const parsedEvent = this.codexNFTContract!.interface.parseLog(event);
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
    this.ensureInitialized();
    try {
      return await this.codexNFTContract!.hasCharacter(userWallet, characterId);
    } catch (error) {
      logger.error('Failed to check character NFT', { error, userWallet, characterId });
      return false;
    }
  }

  /**
   * NFT 메타데이터 URI 조회
   */
  async getTokenURI(tokenId: string): Promise<string> {
    this.ensureInitialized();
    try {
      return await this.codexNFTContract!.tokenURI(tokenId);
    } catch (error) {
      logger.error('Failed to get token URI', { error, tokenId });
      throw error;
    }
  }

  /**
   * NFT 소유자 조회
   */
  async getTokenOwner(tokenId: string): Promise<string> {
    this.ensureInitialized();
    try {
      return await this.codexNFTContract!.ownerOf(tokenId);
    } catch (error) {
      logger.error('Failed to get token owner', { error, tokenId });
      throw error;
    }
  }
}

export default new BlockchainService();
