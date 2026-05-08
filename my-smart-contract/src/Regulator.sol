// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Regulator {
    address public admin;
    
    event RegulatoryAction(string actionType, address indexed target, string reason, uint256 timestamp);

    error NotRegulator();

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotRegulator();
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function emitAuditLog(string calldata actionType, address target, string calldata reason) external onlyAdmin {
        emit RegulatoryAction(actionType, target, reason, block.timestamp);
    }
}