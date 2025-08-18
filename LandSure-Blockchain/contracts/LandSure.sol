// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title LandSure - Minimal certificate + token registry with hash anchoring
/// @notice Store only what must be on-chain. Everything else lives off-chain and is verified by hash.
contract LandSure {
    struct Certificate {
        string certificateId;         // e.g., "SHAIK2109C-119-11"
        address mainOwner;            // initial owner (EOA)
        string totalArea;             // keep units, e.g., "3.00 acres"
        uint256 numberOfTokens;       // how many token parts minted
        bytes32 certificateHash;      // keccak256 of canonical JSON metadata
        uint256[] tokenIds;           // tokens minted for this certificate
        bool exists;
    }

    struct TokenInfo {
        uint256 tokenId;
        string certificateId;         // back-reference
        address currentOwner;
        bool isBurned;
    }

    mapping(string => Certificate) private certificates; // certId => Certificate
    mapping(uint256 => TokenInfo) private tokens;        // tokenId => TokenInfo
    uint256 public nextTokenId = 1;

    event CertificateRegistered(
        string indexed certificateId,
        address indexed mainOwner,
        string totalArea,
        uint256 numberOfTokens,
        bytes32 certificateHash
    );

    event TokenMinted(
        string indexed certificateId,
        uint256 indexed tokenId,
        address indexed owner
    );

    event TokenTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint256 timestamp
    );

    event TokenBurned(
        uint256 indexed tokenId,
        address indexed owner,
        uint256 timestamp
    );

    /// @notice Register a new certificate and mint N simple tokens (not ERC721—MVP refs only)
    function registerCertificate(
        string calldata certificateId,
        address mainOwner,
        string calldata totalArea,
        uint256 numberOfTokens,
        bytes32 certificateHash
    ) external returns (uint256[] memory mintedTokenIds) {
        require(!certificates[certificateId].exists, "Certificate exists");
        require(mainOwner != address(0), "Bad owner");
        require(numberOfTokens > 0 && numberOfTokens <= 10000, "Bad token count"); // be sane

        Certificate storage cert = certificates[certificateId];
        cert.certificateId = certificateId;
        cert.mainOwner = mainOwner;
        cert.totalArea = totalArea;
        cert.numberOfTokens = numberOfTokens;
        cert.certificateHash = certificateHash;
        cert.exists = true;

        mintedTokenIds = new uint256[](numberOfTokens);

        for (uint256 i = 0; i < numberOfTokens; i++) {
            uint256 tid = nextTokenId++;
            tokens[tid] = TokenInfo({
                tokenId: tid,
                certificateId: certificateId,
                currentOwner: mainOwner,
                isBurned: false
            });
            cert.tokenIds.push(tid);
            mintedTokenIds[i] = tid;

            emit TokenMinted(certificateId, tid, mainOwner);
        }

        emit CertificateRegistered(certificateId, mainOwner, totalArea, numberOfTokens, certificateHash);
        return mintedTokenIds;
    }

    /// @notice Verify the off-chain JSON by comparing its keccak256 hash
    function verifyCertificateHash(string calldata certificateId, bytes32 expectedHash) external view returns (bool) {
        Certificate storage cert = certificates[certificateId];
        require(cert.exists, "Not found");
        return cert.certificateHash == expectedHash;
    }

    /// @notice Lightweight transfer to update current owner for a token. History is event-based.
    function transferToken(uint256 tokenId, address to) external {
        TokenInfo storage t = tokens[tokenId];
        require(!t.isBurned, "Burned");
        require(t.currentOwner == msg.sender, "Not owner");
        require(to != address(0), "Bad to");

        address from = t.currentOwner;
        t.currentOwner = to;
        emit TokenTransferred(tokenId, from, to, block.timestamp);
    }

    function burnToken(uint256 tokenId) external {
        TokenInfo storage t = tokens[tokenId];
        require(!t.isBurned, "Already burned");
        require(t.currentOwner == msg.sender, "Not owner");
        t.isBurned = true;
        emit TokenBurned(tokenId, msg.sender, block.timestamp);
    }

    // ----- Reads -----
    function getCertificate(string calldata certificateId)
        external
        view
        returns (
            string memory id,
            address mainOwner,
            string memory totalArea,
            uint256 numberOfTokens,
            bytes32 certificateHash,
            uint256[] memory tokenIds
        )
    {
        Certificate storage c = certificates[certificateId];
        require(c.exists, "Not found");
        return (c.certificateId, c.mainOwner, c.totalArea, c.numberOfTokens, c.certificateHash, c.tokenIds);
    }

    function getToken(uint256 tokenId)
        external
        view
        returns (uint256 id, string memory certificateId, address currentOwner, bool isBurned)
    {
        TokenInfo storage t = tokens[tokenId];
        require(t.currentOwner != address(0), "Not found");
        return (t.tokenId, t.certificateId, t.currentOwner, t.isBurned);
    }
}
