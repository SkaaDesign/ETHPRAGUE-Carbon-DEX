// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {CarbonCredit} from "./CarbonCredit.sol";
import {ComplianceRegistry} from "./ComplianceRegistry.sol";

contract Regulator {
    CarbonCredit public immutable carbonCredit;
    ComplianceRegistry public immutable registry;

    address public admin;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    constructor(address _carbon, address _registry, address, address) {
        carbonCredit = CarbonCredit(_carbon);
        registry = ComplianceRegistry(_registry);
        admin = msg.sender;
    }

    function registerCompany(address company, string calldata name, string calldata country, uint256 companyType) external onlyAdmin {
        registry.register(company, name, country, companyType);
    }

    function mintCarbonCredits(address to, uint256 amount) external onlyAdmin {
        carbonCredit.mint(to, amount);
    }
}