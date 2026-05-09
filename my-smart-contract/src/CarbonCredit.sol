// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./ComplianceRegistry.sol";

contract CarbonCredit is ERC20 {
    address public regulator;
    ComplianceRegistry public complianceRegistry;
    
    error OnlyRegulator();
    error NotVerified();
    
    modifier onlyRegulator() {
        if (msg.sender != regulator) revert OnlyRegulator();
        _;
    }
    
    modifier onlyVerified(address account) {
        if (!complianceRegistry.isVerified(account)) revert NotVerified();
        _;
    }
    
    constructor(address _complianceRegistry) ERC20("Carbon Credit Token", "CARBON") {
        regulator = msg.sender;
        complianceRegistry = ComplianceRegistry(_complianceRegistry);
    }
    
    function setRegulator(address newRegulator) external {
        if (regulator == address(0)) {
            regulator = newRegulator;
        } else {
            if (msg.sender != regulator) revert OnlyRegulator();
            regulator = newRegulator;
        }
    }
    
    function updateComplianceRegistry(address newRegistry) external onlyRegulator {
        complianceRegistry = ComplianceRegistry(newRegistry);
    }
    
    function mint(address to, uint256 amount) external onlyRegulator onlyVerified(to) {
        _mint(to, amount);
    }
    
    function burn(address from, uint256 amount) external onlyVerified(from) {
        if (msg.sender != from && allowance(from, msg.sender) != type(uint256).max) {
            _approve(from, msg.sender, allowance(from, msg.sender) - amount);
        }
        _burn(from, amount);
    }
    
    // Enforce compliance checks on standard transfers
    function transfer(address to, uint256 amount) public override onlyVerified(msg.sender) onlyVerified(to) returns (bool) {
        return super.transfer(to, amount);
    }
    
    function transferFrom(address from, address to, uint256 amount) public override onlyVerified(from) onlyVerified(to) returns (bool) {
        return super.transferFrom(from, to, amount);
    }
}