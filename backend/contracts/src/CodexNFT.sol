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
        // 1) 동일 유저-캐릭터 조합은 중복 민팅 불가
        require(!hasMinted[to][characterId], "Already minted this character");

        // 2) 토큰 ID를 발급하고 카운터 증가
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        // 3) NFT 민팅 + 메타데이터 URI 저장
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        // 4) 인덱싱용 상태 업데이트
        characterToTokenId[characterId] = tokenId;
        hasMinted[to][characterId] = true;

        // 5) 오프체인 인덱싱을 위한 이벤트 발행
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
        // 1) 입력 배열 길이 일치 필요
        require(characterIds.length == tokenURIs.length, "Length mismatch");

        uint256[] memory tokenIds = new uint256[](characterIds.length);

        // 2) 각 캐릭터별로 단건 민팅 로직 재사용
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
