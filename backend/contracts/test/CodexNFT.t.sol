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

    function testGetCurrentTokenId() public {
        assertEq(codexNFT.getCurrentTokenId(), 1);

        codexNFT.mintCodex(user1, 1, "ipfs://test1");
        assertEq(codexNFT.getCurrentTokenId(), 2);

        codexNFT.mintCodex(user1, 2, "ipfs://test2");
        assertEq(codexNFT.getCurrentTokenId(), 3);
    }

    function testHasCharacter() public {
        assertFalse(codexNFT.hasCharacter(user1, 1));

        codexNFT.mintCodex(user1, 1, "ipfs://test");

        assertTrue(codexNFT.hasCharacter(user1, 1));
        assertFalse(codexNFT.hasCharacter(user1, 2));
        assertFalse(codexNFT.hasCharacter(user2, 1));
    }
}
