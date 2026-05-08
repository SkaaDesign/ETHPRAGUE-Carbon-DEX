// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "solady/tokens/ERC1155.sol";
import {ComplianceRegistry} from "./ComplianceRegistry.sol";

contract CarbonCredit is ERC1155 {
    address public regulator;
    address public retirementContract;
    ComplianceRegistry public immutable complianceRegistry;

    struct CreditBatch {
        uint256 vintage;
        string sector;
        string originCountry;
        uint256 methodologyId;
        uint256 totalIssued;
        uint256 totalRetired;
    }

    mapping(uint256 => CreditBatch) public batches;

    event CreditMinted(uint256 indexed tokenId, address indexed to, uint256 amount);
    event CreditRetired(uint256 indexed tokenId, address indexed by, uint256 amount);

    error NotRegulator();
    error NotAuthorizedRetire();
    error AccountFrozenOrNotKYC();
    error ZeroAddress();

    modifier onlyRegulator() {
        if (msg.sender != regulator) revert NotRegulator();
        _;
    }

    constructor(address _regulator, address _complianceRegistry) {
        if (_regulator == address(0) || _complianceRegistry == address(0)) revert ZeroAddress();
        regulator = _regulator;
        complianceRegistry = ComplianceRegistry(_complianceRegistry);
    }

    function setRetirementContract(address _retirementContract) external onlyRegulator {
        retirementContract = _retirementContract;
    }

    function createAndMint(
        address to,
        uint256 tokenId,
        uint256 amount,
        CreditBatch calldata metadata
    ) external onlyRegulator {
        if (!complianceRegistry.isVerified(to)) revert AccountFrozenOrNotKYC();
        batches[tokenId] = metadata;
        batches[tokenId].totalIssued += amount;
        _mint(to, tokenId, amount, "");
        emit CreditMinted(tokenId, to, amount);
    }

    function mint(address to, uint256 tokenId, uint256 amount) external onlyRegulator {
        if (!complianceRegistry.isVerified(to)) revert AccountFrozenOrNotKYC();
        batches[tokenId].totalIssued += amount;
        _mint(to, tokenId, amount, "");
        emit CreditMinted(tokenId, to, amount);
    }

    function retire(address account, uint256 tokenId, uint256 amount) external {
        if (msg.sender != retirementContract) revert NotAuthorizedRetire();
        batches[tokenId].totalRetired += amount;
        _burn(account, tokenId, amount);
        emit CreditRetired(tokenId, account, amount);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) public override {
        if (!complianceRegistry.isVerified(from) || !complianceRegistry.isVerified(to)) {
            revert AccountFrozenOrNotKYC();
        }
        super.safeTransferFrom(from, to, id, amount, data);
    }

    function uri(uint256) public pure override returns (string memory) {
        return "";
    }
}