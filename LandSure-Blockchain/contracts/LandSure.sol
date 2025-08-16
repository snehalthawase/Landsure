// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract LandSure {
    // Certificate structure
    struct Certificate {
        uint256 certificateId;
        string ownerName;
        string landLocation;
        uint256 landArea;
    }

    // Mapping from certificate ID → Certificate details
    mapping(uint256 => Certificate) public certificates;

    // Mapping to track ownership (address → certificateId)
    mapping(address => uint256) public ownerToCertificate;

    // Function to register a new certificate
    function registerCertificate(
        uint256 _certificateId,
        string memory _ownerName,
        string memory _landLocation,
        uint256 _landArea
    ) public {
        // Require that this certificate is not already registered
        require(certificates[_certificateId].certificateId == 0, "Certificate already exists");

        // Save certificate
        certificates[_certificateId] = Certificate(
            _certificateId,
            _ownerName,
            _landLocation,
            _landArea
        );

        // Map caller address to certificate
        ownerToCertificate[msg.sender] = _certificateId;
    }
}
