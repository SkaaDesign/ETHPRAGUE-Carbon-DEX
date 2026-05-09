// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {CarbonCredit} from "./CarbonCredit.sol";
import {ComplianceRegistry} from "./ComplianceRegistry.sol";

contract Retirement {
    CarbonCredit public immutable carbonCredit;
    ComplianceRegistry public immutable registry;

    event CreditsRetired(address indexed user, uint256 amount, string comment);

    constructor(address _carbon, address _registry) {
        carbonCredit = CarbonCredit(_carbon);
        registry = ComplianceRegistry(_registry);
    }

    function retire(uint256 amount, string calldata comment) external {
        require(registry.isVerified(msg.sender), "Not verified");
        
        // Burn the ERC-20 tokens directly from the user's balance
        carbonCredit.burn(msg.sender, amount);

        emit CreditsRetired(msg.sender, amount, comment);
    }
}