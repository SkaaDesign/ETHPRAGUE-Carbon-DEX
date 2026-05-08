// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./CarbonCredit.sol";
import "./ComplianceRegistry.sol";
import "./CarbonDEX.sol";
import "./EURS.sol";

contract Regulator {
    struct RegulatoryAction {
        string actionType;
        address target;
        string reason;
        uint256 timestamp;
        bytes32 txHash;
    }
    
    CarbonCredit public carbonCredit;
    ComplianceRegistry public complianceRegistry;
    CarbonDEX public carbonDEX;
    EURS public eurs;
    
    address public owner;
    RegulatoryAction[] public auditLog;
    
    event RegulatoryActionTaken(
        uint256 indexed actionId,
        string actionType,
        address indexed target,
        string reason,
        uint256 timestamp
    );
    event AuditLogEmitted(string action, address target, string details);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Regulator: only owner");
        _;
    }
    
    constructor(
        address _carbonCredit,
        address _complianceRegistry,
        address _carbonDEX,
        address _eurs
    ) {
        owner = msg.sender;
        carbonCredit = CarbonCredit(_carbonCredit);
        complianceRegistry = ComplianceRegistry(_complianceRegistry);
        carbonDEX = CarbonDEX(_carbonDEX);
        eurs = EURS(_eurs);
        
        _logAction("REGULATOR_INITIALIZED", address(this), "Regulator contract deployed");
    }
    
    function setOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "invalid owner");
        owner = newOwner;
    }
    
    function _logAction(string memory actionType, address target, string memory reason) private {
        uint256 actionId = auditLog.length;
        auditLog.push(RegulatoryAction({
            actionType: actionType,
            target: target,
            reason: reason,
            timestamp: block.timestamp,
            txHash: keccak256(abi.encodePacked(block.timestamp, msg.sender, actionType, target))
        }));
        
        emit RegulatoryActionTaken(actionId, actionType, target, reason, block.timestamp);
        emit AuditLogEmitted(actionType, target, reason);
    }
    
    // Mint carbon credits
    function mintCarbonCredits(
        address to,
        uint256 amount,
        uint256 vintage,
        string memory sector,
        string memory originCountry,
        uint256 methodologyId,
        string memory metadataURI
    ) external onlyOwner {
        require(complianceRegistry.isVerified(to), "recipient not verified");
        
        uint256 batchId = carbonCredit.mint(to, amount, vintage, sector, originCountry, methodologyId, metadataURI);
        
        _logAction("MINT_CREDITS", to, string(abi.encodePacked("Minted ", uint2str(amount), " credits in batch ", uint2str(batchId))));
    }
    
    // Register a company
    function registerCompany(
        address company,
        string memory legalName,
        string memory country,
        uint256 allowanceType
    ) external onlyOwner {
        complianceRegistry.register(company, legalName, country, allowanceType);
        _logAction("REGISTER_COMPANY", company, string(abi.encodePacked("Registered as ", country, " company")));
    }
    
    // Freeze a company (compliance action)
    function freezeCompany(address company, string memory reason) external onlyOwner {
        complianceRegistry.freeze(company, reason);
        _logAction("FREEZE_COMPANY", company, reason);
    }
    
    // Unfreeze a company
    function unfreezeCompany(address company, string memory reason) external onlyOwner {
        complianceRegistry.unfreeze(company);
        _logAction("UNFREEZE_COMPANY", company, reason);
    }
    
    // Audit a company
    function auditCompany(address company, string memory notes) external onlyOwner {
        complianceRegistry.audit(company);
        _logAction("AUDIT_COMPANY", company, notes);
    }
    
    // Emergency pause DEX
    function pauseDEX(string memory reason) external onlyOwner {
        carbonDEX.emergencyPause();
        _logAction("PAUSE_DEX", address(carbonDEX), reason);
    }
    
    // Unpause DEX
    function unpauseDEX(string memory reason) external onlyOwner {
        carbonDEX.unpause();
        _logAction("UNPAUSE_DEX", address(carbonDEX), reason);
    }
    
    // Deactivate a credit batch (e.g., expired or recalled)
    function deactivateCreditBatch(uint256 batchId, string memory reason) external onlyOwner {
        carbonCredit.deactivateBatch(batchId);
        _logAction("DEACTIVATE_BATCH", address(carbonCredit), string(abi.encodePacked("Batch ", uint2str(batchId), ": ", reason)));
    }
    
    // Add liquidity to DEX (regulator can seed the pool)
    function seedLiquidity(uint256 eursAmount, uint256 carbonBatchId, uint256 carbonAmount) external onlyOwner {
        require(eurs.balanceOf(address(this)) >= eursAmount, "insufficient EURS balance");
        require(carbonCredit.balanceOf(address(this), carbonBatchId) >= carbonAmount, "insufficient carbon balance");
        
        eurs.approve(address(carbonDEX), eursAmount);
        carbonCredit.setApprovalForAll(address(carbonDEX), true);
        
        carbonDEX.addLiquidity(eursAmount, carbonAmount);
        
        _logAction("SEED_LIQUIDITY", address(carbonDEX), string(abi.encodePacked("Added ", uint2str(eursAmount), " EURS and ", uint2str(carbonAmount), " credits")));
    }
    
    // Request EURS faucet for regulator (for demo)
    function requestRegulatorEURS() external onlyOwner {
        eurs.requestFaucet();
        _logAction("REQUEST_EURS", address(this), "Regulator requested faucet EURS");
    }
    
    // Get full audit log
    function getAuditLog(uint256 fromIndex, uint256 toIndex) external view returns (RegulatoryAction[] memory) {
        require(toIndex < auditLog.length, "index out of bounds");
        uint256 length = toIndex - fromIndex + 1;
        RegulatoryAction[] memory result = new RegulatoryAction[](length);
        
        for (uint256 i = 0; i < length; i++) {
            result[i] = auditLog[fromIndex + i];
        }
        return result;
    }
    
    function getAuditLogCount() external view returns (uint256) {
        return auditLog.length;
    }
    
    // Helper function for string conversion (simplified)
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}