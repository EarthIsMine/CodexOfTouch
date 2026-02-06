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
        // 1) 테스트 계정 준비
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);

        // 2) 컨트랙트 배포 (소유자는 address(this))
        codexNFT = new CodexNFT();
    }

    function testMintCodex() public {
        // 시나리오: 소유자가 단일 민팅을 수행하면 정상 발급된다.
        uint256 characterId = 1;
        string memory tokenURI = "ipfs://QmTest123";

        // 1) 민팅 실행
        uint256 tokenId = codexNFT.mintCodex(user1, characterId, tokenURI);

        // 2) 민팅 결과 검증
        assertEq(tokenId, 1);
        assertEq(codexNFT.ownerOf(tokenId), user1);
        assertEq(codexNFT.tokenURI(tokenId), tokenURI);
        assertTrue(codexNFT.hasCharacter(user1, characterId));
    }

    function testCannotMintDuplicate() public {
        // 시나리오: 동일 캐릭터 재민팅은 revert 된다.
        uint256 characterId = 1;
        string memory tokenURI = "ipfs://QmTest123";

        // 1) 최초 민팅 성공
        codexNFT.mintCodex(user1, characterId, tokenURI);

        // 2) 동일 캐릭터 재민팅은 revert
        vm.expectRevert("Already minted this character");
        codexNFT.mintCodex(user1, characterId, tokenURI);
    }

    function testBatchMint() public {
        // 시나리오: 배치 민팅으로 여러 캐릭터가 한 번에 발급된다.
        uint256[] memory characterIds = new uint256[](3);
        characterIds[0] = 1;
        characterIds[1] = 2;
        characterIds[2] = 3;

        string[] memory tokenURIs = new string[](3);
        tokenURIs[0] = "ipfs://QmTest1";
        tokenURIs[1] = "ipfs://QmTest2";
        tokenURIs[2] = "ipfs://QmTest3";

        // 1) 배치 민팅 실행
        uint256[] memory tokenIds = codexNFT.batchMintCodex(user1, characterIds, tokenURIs);

        // 2) 발급 수 및 소유자 검증
        assertEq(tokenIds.length, 3);
        assertEq(codexNFT.ownerOf(tokenIds[0]), user1);
        assertEq(codexNFT.ownerOf(tokenIds[1]), user1);
        assertEq(codexNFT.ownerOf(tokenIds[2]), user1);
    }

    function testOnlyOwnerCanMint() public {
        // 시나리오: 소유자만 민팅 가능하며, 비소유자는 revert 된다.
        // 비소유자가 호출하면 revert
        vm.prank(user1);
        vm.expectRevert();
        codexNFT.mintCodex(user2, 1, "ipfs://test");
    }

    function testGetCurrentTokenId() public {
        // 시나리오: 카운터는 다음에 발급될 토큰 ID를 가리킨다.
        // 초기 카운터는 1
        assertEq(codexNFT.getCurrentTokenId(), 1);

        // 민팅 후 카운터 증가 확인
        codexNFT.mintCodex(user1, 1, "ipfs://test1");
        assertEq(codexNFT.getCurrentTokenId(), 2);

        codexNFT.mintCodex(user1, 2, "ipfs://test2");
        assertEq(codexNFT.getCurrentTokenId(), 3);
    }

    function testHasCharacter() public {
        // 시나리오: 보유 여부 플래그는 민팅 전후로 정확히 반영된다.
        // 민팅 전 상태
        assertFalse(codexNFT.hasCharacter(user1, 1));

        // 민팅 후 상태
        codexNFT.mintCodex(user1, 1, "ipfs://test");

        assertTrue(codexNFT.hasCharacter(user1, 1));
        assertFalse(codexNFT.hasCharacter(user1, 2));
        assertFalse(codexNFT.hasCharacter(user2, 1));
    }
}
