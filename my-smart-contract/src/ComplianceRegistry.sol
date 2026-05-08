// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

contract ComplianceRegistry {
    struct CompanyRecord {
        bool isVerified;
        bool isFrozen;
        string country;
        string legalName;
        uint256 allowanceType; // 0=industrial, 1=aviation, 2=maritime
        uint256 registeredAt;
        uint256 lastAudit;
    }
    
    mapping(address => CompanyRecord) public companies;
    address public regulator;
    
    event CompanyRegistered(address indexed company, string legalName, string country);
    event CompanyFrozen(address indexed company, string reason);
    event CompanyUnfrozen(address indexed company);
    event AuditPerformed(address indexed company, uint256 timestamp);
    event RegulatorChanged(address indexed oldRegulator, address indexed newRegulator);
    
    modifier onlyRegulator() {
        require(msg.sender == regulator, "ComplianceRegistry: only regulator");
        _;
    }
    
    constructor() {
        regulator = msg.sender;
    }
    
    function setRegulator(address newRegulator) external onlyRegulator {
        emit RegulatorChanged(regulator, newRegulator);
        regulator = newRegulator;
    }
    
    function register(
        address company,
        string memory legalName,
        string memory country,
        uint256 allowanceType
    ) external onlyRegulator {
        require(!companies[company].isVerified, "already registered");
        require(allowanceType <= 2, "invalid allowance type");
        
        companies[company] = CompanyRecord({
            isVerified: true,
            isFrozen: false,
            country: country,
            legalName: legalName,
            allowanceType: allowanceType,
            registeredAt: block.timestamp,
            lastAudit: block.timestamp
        });
        
        emit CompanyRegistered(company, legalName, country);
    }
    
    function freeze(address company, string memory reason) external onlyRegulator {
        require(companies[company].isVerified, "company not registered");
        companies[company].isFrozen = true;
        emit CompanyFrozen(company, reason);
    }
    
    function unfreeze(address company) external onlyRegulator {
        require(companies[company].isVerified, "company not registered");
        companies[company].isFrozen = false;
        emit CompanyUnfrozen(company);
    }
    
    function audit(address company) external onlyRegulator {
        require(companies[company].isVerified, "company not registered");
        companies[company].lastAudit = block.timestamp;
        emit AuditPerformed(company, block.timestamp);
    }
    
    function isVerified(address company) public view returns (bool) {
        return companies[company].isVerified && !companies[company].isFrozen;
    }
    
    function getCompanyInfo(address company) external view returns (
        bool verified,
        bool frozen,
        string memory country,
        uint256 allowanceType,
        uint256 registeredAt
    ) {
        CompanyRecord memory record = companies[company];
        return (
            record.isVerified,
            record.isFrozen,
            record.country,
            record.allowanceType,
            record.registeredAt
        );
    }
}