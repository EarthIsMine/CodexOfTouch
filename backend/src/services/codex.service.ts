import prisma from '@/config/database';
import logger from '@/config/logger';
import blockchainService from './blockchain.service';
import config from '@/config/env';

export class CodexService {
  async unlockCharacter(userId: string, characterId: number): Promise<boolean> {
    // Check if already unlocked
    const existing = await prisma.codex.findUnique({
      where: {
        userId_characterId: {
          userId,
          characterId,
        },
      },
    });

    if (existing) {
      return false; // Already unlocked
    }

    // Get user wallet address
    const user = await prisma.user.findUnique({
      where: {id: userId},
      select: {walletAddress: true},
    });

    // Create codex entry first (with placeholder values)
    const codex = await prisma.codex.create({
      data: {
        userId,
        characterId,
        contractAddress: config.codexNftContract,
        tokenId: `pending-${userId}-${characterId}`,
        chainId: config.chainId,
      },
      include: {
        character: true,
      },
    });

    logger.info(`Codex unlocked: User ${userId}, Character ${characterId}`);

    // NFT 발급 (비동기 - 백그라운드에서 처리)
    if (user?.walletAddress) {
      this.mintNFTAsync(
        codex.id,
        user.walletAddress,
        characterId,
        codex.character,
      ).catch((error) => {
        logger.error('Background NFT minting failed', {
          error,
          userId,
          characterId,
        });
      });
    } else {
      logger.warn('User has no wallet address, skipping NFT mint', {userId});
    }

    return true;
  }

  /**
   * NFT 발급 (비동기 백그라운드)
   */
  private async mintNFTAsync(
    codexId: string,
    walletAddress: string,
    characterId: number,
    character: any,
  ) {
    try {
      logger.info('Starting NFT minting', {
        codexId,
        walletAddress,
        characterId,
      });

      // 메타데이터 URI 생성
      const metadataUri = this.createMetadataUri(characterId, character);

      // NFT 발급
      const {tokenId, txHash} = await blockchainService.mintCodexNFT(
        walletAddress,
        characterId,
        metadataUri,
      );

      // DB 업데이트 (실제 tokenId 저장)
      await prisma.codex.update({
        where: {id: codexId},
        data: {
          tokenId: tokenId,
          transactionHash: txHash,
        },
      });

      logger.info('NFT minted successfully', {
        codexId,
        walletAddress,
        characterId,
        tokenId,
        txHash,
      });
    } catch (error) {
      logger.error('Failed to mint NFT', {
        error,
        codexId,
        walletAddress,
        characterId,
      });

      // 실패 시에도 codex entry는 유지 (나중에 재시도 가능)
      await prisma.codex.update({
        where: {id: codexId},
        data: {
          tokenId: `failed-${codexId}`,
        },
      });
    }
  }

  /**
   * 메타데이터 URI 생성
   * TODO: 프로덕션에서는 IPFS 또는 AWS S3 사용
   */
  private createMetadataUri(characterId: number, character: any): string {
    const metadata = {
      name: `${character.name} Codex`,
      description: `Petting Roulette Game - ${character.name} Character Codex NFT. This NFT represents your achievement in successfully petting this character.`,
      image: character.imageUrl,
      external_url: `https://petting-roulette.com/character/${characterId}`,
      attributes: [
        {
          trait_type: 'Character ID',
          value: characterId,
        },
        {
          trait_type: 'Character Name',
          value: character.name,
        },
        {
          trait_type: 'Success Rate',
          display_type: 'number',
          value: character.successRate * 100,
        },
        {
          trait_type: 'Rarity',
          value: this.getRarityBySuccessRate(character.successRate),
        },
      ],
    };

    // Base64 encoded data URI (임시 - 프로덕션에서는 IPFS 사용)
    return `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString('base64')}`;
  }

  /**
   * 성공률에 따른 희귀도 판정
   */
  private getRarityBySuccessRate(successRate: number): string {
    if (successRate >= 0.8) return 'Common';
    if (successRate >= 0.5) return 'Uncommon';
    if (successRate >= 0.3) return 'Rare';
    if (successRate >= 0.1) return 'Epic';
    return 'Legendary';
  }

  async getUserCodex(userId: string) {
    const codex = await prisma.codex.findMany({
      where: {userId},
      include: {
        character: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {mintedAt: 'desc'},
    });

    const totalCharacters = await prisma.character.count();

    return {
      codex: codex.map((c) => ({
        characterId: c.characterId,
        characterName: c.character.name,
        characterImage: c.character.imageUrl,
        contractAddress: c.contractAddress,
        tokenId: c.tokenId,
        chainId: c.chainId,
        mintedAt: c.mintedAt,
      })),
      stats: {
        total: totalCharacters,
        collected: codex.length,
        percentage:
          totalCharacters > 0 ? (codex.length / totalCharacters) * 100 : 0,
      },
    };
  }

  async getCharacterCodexStats(characterId: number) {
    const [totalPlayers, unlockedCount, recentUnlocks] = await Promise.all([
      prisma.user.count(),
      prisma.codex.count({
        where: {characterId},
      }),
      prisma.codex.findMany({
        where: {characterId},
        include: {
          user: {
            select: {
              id: true,
              walletAddress: true,
            },
          },
        },
        orderBy: {mintedAt: 'desc'},
        take: 10,
      }),
    ]);

    return {
      stats: {
        totalPlayers,
        unlockedBy: unlockedCount,
        unlockRate: totalPlayers > 0 ? unlockedCount / totalPlayers : 0,
      },
      recentUnlocks: recentUnlocks.map((u) => ({
        userId: u.userId,
        walletAddress:
          u.user.walletAddress?.substring(0, 6) +
          '...' +
          u.user.walletAddress?.substring(38),
        mintedAt: u.mintedAt,
      })),
    };
  }
}

export default new CodexService();
