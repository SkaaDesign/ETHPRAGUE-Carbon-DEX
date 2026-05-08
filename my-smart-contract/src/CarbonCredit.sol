// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ComplianceRegistry.sol";

contract CarbonCredit is ERC1155 {
    struct CreditBatch {
        uint256 vintage;      // Year of issuance
        string sector;        // energy, industry, transport
        string originCountry; // EU member state
        uint256 methodologyId; // Reference to methodology document
        uint256 totalIssued;
        uint256 totalRetired;
        bool active;
    }
    
    mapping(uint256 => CreditBatch) public batches;
    mapping(uint256 => string) public batchMetadataURI;
    
    address public regulator;
    ComplianceRegistry public complianceRegistry;
    
    uint256 public nextBatchId;
    
    event CreditMinted(uint256 indexed batchId, address indexed to, uint256 amount, uint256 vintage, string sector);
    event CreditTransferred(address indexed from, address indexed to, uint256 indexed batchId, uint256 amount);
    event CreditRetired(uint256 indexed batchId, address indexed by, uint256 amount, string reasonURI);
    event BatchMetadataUpdated(uint256 indexed batchId, string metadataURI);
    
    modifier onlyRegulator() {
        require(msg.sender == regulator, "CarbonCredit: only regulator");
        _;
    }
    
    modifier onlyVerified(address account) {
        require(complianceRegistry.isVerified(account), "CarbonCredit: account not verified");
        _;
    }
    
    constructor(address _complianceRegistry) 
        ERC1155("ipfs://") 
    {
        regulator = msg.sender;
        complianceRegistry = ComplianceRegistry(_complianceRegistry);
        nextBatchId = 1;
    }
    
    function setRegulator(address newRegulator) external onlyRegulator {
        regulator = newRegulator;
    }
    
    function updateComplianceRegistry(address newRegistry) external onlyRegulator {
        complianceRegistry = ComplianceRegistry(newRegistry);
    }
    
    function mint(
        address to,
        uint256 amount,
        uint256 vintage,
        string memory sector,
        string memory originCountry,
        uint256 methodologyId,
        string memory metadataURI
    ) external onlyRegulator onlyVerified(to) returns (uint256 batchId) {
        batchId = nextBatchId++;
        
        batches[batchId] = CreditBatch({
            vintage: vintage,
            sector: sector,
            originCountry: originCountry,
            methodologyId: methodologyId,
            totalIssued: amount,
            totalRetired: 0,
            active: true
        });
        
        if (bytes(metadataURI).length > 0) {
            batchMetadataURI[batchId] = metadataURI;
        }
        
        _mint(to, batchId, amount, "");
        
        emit CreditMinted(batchId, to, amount, vintage, sector);
    }
    
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public override onlyVerified(from) onlyVerified(to) {
        require(batches[id].active, "batch not active");
        super.safeTransferFrom(from, to, id, amount, data);
        emit CreditTransferred(from, to, id, amount);
    }
    
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public override onlyVerified(from) onlyVerified(to) {
        for (uint256 i = 0; i < ids.length; i++) {
            require(batches[ids[i]].active, "batch not active");
        }
        super.safeBatchTransferFrom(from, to, ids, amounts, data);
        for (uint256 i = 0; i < ids.length; i++) {
            emit CreditTransferred(from, to, ids[i], amounts[i]);
        }
    }
    
    // Called by Retirement contract
    function retireFrom(address account, uint256 batchId, uint256 amount, string memory reasonURI) 
        external 
        onlyVerified(account) 
    {
        require(msg.sender == address(this) || isApprovedForAll(account, msg.sender), "not approved");
        require(batches[batchId].active, "batch not active");
        
        _burn(account, batchId, amount);
        batches[batchId].totalRetired += amount;
        
        emit CreditRetired(batchId, account, amount, reasonURI);
    }
    
    function deactivateBatch(uint256 batchId) external onlyRegulator {
        batches[batchId].active = false;
    }
    
    function getBatchInfo(uint256 batchId) external view returns (
        uint256 vintage,
        string memory sector,
        string memory originCountry,
        uint256 totalIssued,
        uint256 totalRetired,
        uint256 available,
        bool active
    ) {
        CreditBatch memory batch = batches[batchId];
        return (
            batch.vintage,
            batch.sector,
            batch.originCountry,
            batch.totalIssued,
            batch.totalRetired,
            batch.totalIssued - batch.totalRetired,
            batch.active
        );
    }
    
    function uri(uint256 tokenId) public view override returns (string memory) {
        return batchMetadataURI[tokenId];
    }
}