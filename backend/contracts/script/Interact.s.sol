// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CodexNFT.sol";

contract InteractScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address codexNFTAddress = vm.envAddress("CODEX_NFT_CONTRACT");

        CodexNFT codexNFT = CodexNFT(codexNFTAddress);

        vm.startBroadcast(deployerPrivateKey);

        // 예: NFT 발급
        address recipient = vm.envAddress("RECIPIENT_ADDRESS");
        uint256 characterId = vm.envUint("CHARACTER_ID");
        string memory tokenURI = vm.envString("TOKEN_URI");

        uint256 tokenId = codexNFT.mintCodex(recipient, characterId, tokenURI);

        console.log("Minted token ID:", tokenId);
        console.log("To:", recipient);
        console.log("Character ID:", characterId);

        vm.stopBroadcast();
    }
}
