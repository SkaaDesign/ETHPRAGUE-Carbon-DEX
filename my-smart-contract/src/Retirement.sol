// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./CarbonCredit.sol";
import "./ComplianceRegistry.sol";

contract Retirement {
    struct RetirementRecord {
        address beneficiary;
        uint256 tokenId;
        uint256 amount;
        uint256 timestamp;
        string reasonURI;
        string proofHash;
    }
    
    CarbonCredit public carbonCredit;
    ComplianceRegistry public complianceRegistry;
    address public regulator;
    
    RetirementRecord[] public retirementHistory;
    mapping(address => uint256[]) public retirementsByBeneficiary;
    mapping(uint256 => uint256) public totalRetiredPerBatch;
    
    event Retired(
        uint256 indexed retirementId,
        address indexed beneficiary,
        uint256 indexed tokenId,
        uint256 amount,
        string reasonURI,
        uint256 timestamp
    );
    event PermanentOffsetProof(uint256 indexed retirementId, string proofHash);
    
    modifier onlyVerified(address account) {
        require(complianceRegistry.isVerified(account), "Retirement: account not verified");
        _;
    }
    
    constructor(address _carbonCredit, address _complianceRegistry) {
        carbonCredit = CarbonCredit(_carbonCredit);
        complianceRegistry = ComplianceRegistry(_complianceRegistry);
        regulator = msg.sender;
    }
    
    function retire(
        uint256 tokenId,
        uint256 amount,
        address beneficiary,
        string memory reasonURI,
        string memory proofHash
    ) external onlyVerified(msg.sender) {
        require(amount > 0, "amount must be > 0");
        require(beneficiary != address(0), "invalid beneficiary");
        
        // Transfer credits from sender to this contract, then burn
        carbonCredit.safeTransferFrom(msg.sender, address(this), tokenId, amount, "");
        
        // Burn via CarbonCredit's retireFrom function
        carbonCredit.retireFrom(address(this), tokenId, amount, reasonURI);
        
        // Record retirement
        uint256 retirementId = retirementHistory.length;
        retirementHistory.push(RetirementRecord({
            beneficiary: beneficiary,
            tokenId: tokenId,
            amount: amount,
            timestamp: block.timestamp,
            reasonURI: reasonURI,
            proofHash: proofHash
        }));
        
        retirementsByBeneficiary[beneficiary].push(retirementId);
        totalRetiredPerBatch[tokenId] += amount;
        
        emit Retired(retirementId, beneficiary, tokenId, amount, reasonURI, block.timestamp);
        emit PermanentOffsetProof(retirementId, proofHash);
    }
    
    function retireBatch(
        uint256[] memory tokenIds,
        uint256[] memory amounts,
        address beneficiary,
        string memory reasonURI,
        string memory proofHash
    ) external onlyVerified(msg.sender) {
        require(tokenIds.length == amounts.length, "length mismatch");
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            retire(tokenIds[i], amounts[i], beneficiary, reasonURI, proofHash);
        }
    }
    
    function getRetirementCount() external view returns (uint256) {
        return retirementHistory.length;
    }
    
    function getRetirement(uint256 retirementId) external view returns (
        address beneficiary,
        uint256 tokenId,
        uint256 amount,
        uint256 timestamp,
        string memory reasonURI,
        string memory proofHash
    ) {
        RetirementRecord memory record = retirementHistory[retirementId];
        return (
            record.beneficiary,
            record.tokenId,
            record.amount,
            record.timestamp,
            record.reasonURI,
            record.proofHash
        );
    }
    
    function getRetirementsByBeneficiary(address beneficiary) external view returns (uint256[] memory) {
        return retirementsByBeneficiary[beneficiary];
    }
    
    function getTotalRetiredPerBatch(uint256 tokenId) external view returns (uint256) {
        return totalRetiredPerBatch[tokenId];
    }
}