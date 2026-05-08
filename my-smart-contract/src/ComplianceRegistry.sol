// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ComplianceRegistry {
    address public regulator;

    struct CompanyRecord {
        bool isKYC;
        string country;
        string allowanceType;
        bool isFrozen;
    }

    mapping(address => CompanyRecord) public registry;

    event CompanyRegistered(address indexed company, string country, string allowanceType);
    event CompanyFrozen(address indexed company);
    event CompanyUnfrozen(address indexed company);

    error NotRegulator();
    error ZeroAddress();

    modifier onlyRegulator() {
        if (msg.sender != regulator) revert NotRegulator();
        _;
    }

    constructor(address _regulator) {
        if (_regulator == address(0)) revert ZeroAddress();
        regulator = _regulator;
    }

    function register(address company, CompanyRecord calldata record) external onlyRegulator {
        registry[company] = record;
        emit CompanyRegistered(company, record.country, record.allowanceType);
    }

    function freeze(address company) external onlyRegulator {
        registry[company].isFrozen = true;
        emit CompanyFrozen(company);
    }

    function unfreeze(address company) external onlyRegulator {
        registry[company].isFrozen = false;
        emit CompanyUnfrozen(company);
    }

    function isVerified(address account) external view returns (bool) {
        CompanyRecord memory record = registry[account];
        return (record.isKYC && !record.isFrozen);
    }
}