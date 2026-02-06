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
        // 테스트 계정 구성
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);

        // 컨트랙트 배포 (owner = address(this))
        codexNFT = new CodexNFT();
    }

    function testMintCodex() public {
        uint256 characterId = 1;
        string memory tokenURI = "ipfs://QmTest123";

        // 민팅 플로우: mint -> owner/URI/보유여부 검증
        uint256 tokenId = codexNFT.mintCodex(user1, characterId, tokenURI);

        assertEq(tokenId, 1);
        assertEq(codexNFT.ownerOf(tokenId), user1);
        assertEq(codexNFT.tokenURI(tokenId), tokenURI);
        assertTrue(codexNFT.hasCharacter(user1, characterId));
    }

    function testCannotMintDuplicate() public {
        uint256 characterId = 1;
        string memory tokenURI = "ipfs://QmTest123";

        // 첫 민팅 성공
        codexNFT.mintCodex(user1, characterId, tokenURI);

        // 같은 유저-캐릭터 조합은 재민팅 불가
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

        // 배치 민팅: 각 항목이 단건 민팅 로직을 재사용
        uint256[] memory tokenIds = codexNFT.batchMintCodex(user1, characterIds, tokenURIs);

        assertEq(tokenIds.length, 3);
        assertEq(codexNFT.ownerOf(tokenIds[0]), user1);
        assertEq(codexNFT.ownerOf(tokenIds[1]), user1);
        assertEq(codexNFT.ownerOf(tokenIds[2]), user1);
    }

    function testOnlyOwnerCanMint() public {
        // owner가 아닌 계정으로 호출하면 revert
        vm.prank(user1);
        vm.expectRevert();
        codexNFT.mintCodex(user2, 1, "ipfs://test");
    }

    function testGetCurrentTokenId() public {
        // 초기 카운터는 1
        assertEq(codexNFT.getCurrentTokenId(), 1);

        // 민팅마다 카운터 증가
        codexNFT.mintCodex(user1, 1, "ipfs://test1");
        assertEq(codexNFT.getCurrentTokenId(), 2);

        codexNFT.mintCodex(user1, 2, "ipfs://test2");
        assertEq(codexNFT.getCurrentTokenId(), 3);
    }

    function testHasCharacter() public {
        // 민팅 전에는 보유하지 않음
        assertFalse(codexNFT.hasCharacter(user1, 1));

        // 민팅 후에는 보유, 다른 캐릭터/유저는 false
        codexNFT.mintCodex(user1, 1, "ipfs://test");

        assertTrue(codexNFT.hasCharacter(user1, 1));
        assertFalse(codexNFT.hasCharacter(user1, 2));
        assertFalse(codexNFT.hasCharacter(user2, 1));
    }
}
