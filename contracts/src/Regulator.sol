// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {CarbonCredit} from "./CarbonCredit.sol";
import {ComplianceRegistry} from "./ComplianceRegistry.sol";
import {CarbonDEX} from "./CarbonDEX.sol";

/// @title  Regulator — unified authority contract for the EU ETS Authority persona
/// @notice Thin orchestrator. Holds the privileged roles on the other three contracts
///         (MINTER_ROLE on CarbonCredit, REGULATOR_ROLE on ComplianceRegistry, PAUSER_ROLE
///         on CarbonDEX) so that all regulator-side actions flow through a single audit
///         surface (the RegulatoryAction event stream).
/// @dev    Cannot trade on the DEX, take fees, front-run, redirect transfers — by
///         construction (no swap/transfer functions). Mirrors real EU ETS national
///         administrator authority (Reg. 2019/1122) with the explicit limitation of
///         forward-only powers; see docs/research/eu-ets-reality-check.md §1.
contract Regulator is AccessControl {
    /// @notice Operators of the Regulator persona — typically the EU ETS Authority's
    ///         multisig or institutional wallet. In production this would be split across
    ///         multiple roles (issuance, enforcement, audit); collapsed here for the demo.
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    enum ActionType { Issue, Register, Freeze, Unfreeze, Pause, Unpause }

    CarbonCredit public immutable CARBON_CREDIT;
    ComplianceRegistry public immutable REGISTRY;
    CarbonDEX public immutable DEX;

    /// @notice Single audit-log stream for every supervised action. The /regulator and
    ///         /public dashboards index this event for the live audit log.
    event RegulatoryAction(
        ActionType indexed actionType,
        address indexed target,
        address indexed by,
        string reason,
        uint256 timestamp
    );

    /// @param admin Granted DEFAULT_ADMIN_ROLE + OPERATOR_ROLE (typically the regulator wallet).
    constructor(
        address admin,
        CarbonCredit credit,
        ComplianceRegistry registry,
        CarbonDEX dex
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
        CARBON_CREDIT = credit;
        REGISTRY = registry;
        DEX = dex;
    }

    // ─── Issuance ───────────────────────────────────────────────────────

    /// @notice Execute an allocation event. Mints credits to a verified recipient.
    ///         The Regulator contract must hold MINTER_ROLE on CarbonCredit (granted at deploy).
    /// @dev    Represents a scheduled allocation event executing — not a discretionary mint.
    ///         The "scheduled events panel" in the /regulator UI is off-chain state; this is
    ///         the on-chain primitive the Execute button calls.
    function issueAllowance(
        address to,
        uint256 amount,
        uint16 vintage,
        bytes2 sector,
        bytes2 originCountry,
        bytes32 issuanceRef
    ) external onlyRole(OPERATOR_ROLE) {
        CARBON_CREDIT.mint(to, amount, vintage, sector, originCountry, issuanceRef);
        emit RegulatoryAction(ActionType.Issue, to, msg.sender, _refToString(issuanceRef), block.timestamp);
    }

    // ─── Compliance registry actions ────────────────────────────────────

    function registerCompany(
        address who,
        ComplianceRegistry.AccountType account,
        bytes2 country,
        string calldata name
    ) external onlyRole(OPERATOR_ROLE) {
        REGISTRY.register(who, account, country, name);
        emit RegulatoryAction(ActionType.Register, who, msg.sender, name, block.timestamp);
    }

    function freezeCompany(address who, string calldata reason) external onlyRole(OPERATOR_ROLE) {
        REGISTRY.freeze(who, reason);
        emit RegulatoryAction(ActionType.Freeze, who, msg.sender, reason, block.timestamp);
    }

    function unfreezeCompany(address who) external onlyRole(OPERATOR_ROLE) {
        REGISTRY.unfreeze(who);
        emit RegulatoryAction(ActionType.Unfreeze, who, msg.sender, "", block.timestamp);
    }

    // ─── DEX pause control ──────────────────────────────────────────────

    function pauseDEX(string calldata reason) external onlyRole(OPERATOR_ROLE) {
        DEX.pause(reason);
        emit RegulatoryAction(ActionType.Pause, address(DEX), msg.sender, reason, block.timestamp);
    }

    function unpauseDEX() external onlyRole(OPERATOR_ROLE) {
        DEX.unpause();
        emit RegulatoryAction(ActionType.Unpause, address(DEX), msg.sender, "", block.timestamp);
    }

    // ─── Internal ──────────────────────────────────────────────────────

    /// @dev Tiny helper to surface the issuanceRef in the audit-log reason field as hex.
    function _refToString(bytes32 ref) internal pure returns (string memory) {
        bytes memory s = new bytes(66);
        s[0] = "0";
        s[1] = "x";
        for (uint256 i = 0; i < 32; ++i) {
            uint8 b = uint8(ref[i]);
            s[2 + i * 2] = _hexChar(b >> 4);
            s[3 + i * 2] = _hexChar(b & 0x0f);
        }
        return string(s);
    }

    function _hexChar(uint8 nibble) internal pure returns (bytes1) {
        return nibble < 10 ? bytes1(uint8(0x30 + nibble)) : bytes1(uint8(0x57 + nibble));
    }
}
