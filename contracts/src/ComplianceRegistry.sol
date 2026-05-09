// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title  ComplianceRegistry — KYC whitelist + freeze flag for Carbon DEX participants
/// @notice Only addresses registered here can hold or trade CarbonCredit. The regulator
///         maintains the registry and can freeze accounts. Mirrors the on-chain analogue of
///         EU Reg. 2019/1122 Art. 30 (national administrator suspension power) — see
///         docs/research/eu-ets-reality-check.md §1.
/// @dev    Read by CarbonCredit (gates transfers) and CarbonDEX (gates swaps + liquidity).
contract ComplianceRegistry is AccessControl {
    /// @notice Role allowed to register, freeze, unfreeze. Held by the Regulator contract.
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");

    /// @notice Account categories — mirrors Union Registry account types (Reg. 2019/1122).
    enum AccountType {
        Operator,    // installation operator (cement, steel, power, etc.)
        Aviation,    // aircraft operator
        Maritime,    // maritime operator (added 2024 for shipping inclusion)
        Trader       // trading account (formerly "person holding account")
    }

    struct CompanyRecord {
        bool registered;
        bool frozen;
        AccountType account;
        bytes2 country;   // ISO 3166-1 alpha-2: "DE", "SK", "CZ", ...
        string name;      // human-readable label (e.g. "Cement Mainz GmbH")
    }

    mapping(address => CompanyRecord) private _records;

    event CompanyRegistered(address indexed who, AccountType account, bytes2 country, string name);
    event CompanyFrozen(address indexed who, string reason);
    event CompanyUnfrozen(address indexed who);

    error CR_AlreadyRegistered(address who);
    error CR_NotRegistered(address who);
    error CR_AlreadyFrozen(address who);
    error CR_NotFrozen(address who);

    /// @param regulator Address that gets REGULATOR_ROLE + DEFAULT_ADMIN_ROLE on deploy.
    constructor(address regulator) {
        _grantRole(DEFAULT_ADMIN_ROLE, regulator);
        _grantRole(REGULATOR_ROLE, regulator);
    }

    /// @notice Register a company. Regulator-only.
    function register(
        address who,
        AccountType account,
        bytes2 country,
        string calldata name
    ) external onlyRole(REGULATOR_ROLE) {
        if (_records[who].registered) revert CR_AlreadyRegistered(who);
        _records[who] = CompanyRecord({
            registered: true,
            frozen: false,
            account: account,
            country: country,
            name: name
        });
        emit CompanyRegistered(who, account, country, name);
    }

    /// @notice Freeze an account. Regulator-only.
    /// @param  reason Free-text justification (logged in event for audit trail).
    function freeze(address who, string calldata reason) external onlyRole(REGULATOR_ROLE) {
        CompanyRecord storage rec = _records[who];
        if (!rec.registered) revert CR_NotRegistered(who);
        if (rec.frozen) revert CR_AlreadyFrozen(who);
        rec.frozen = true;
        emit CompanyFrozen(who, reason);
    }

    /// @notice Unfreeze an account. Regulator-only.
    function unfreeze(address who) external onlyRole(REGULATOR_ROLE) {
        CompanyRecord storage rec = _records[who];
        if (!rec.registered) revert CR_NotRegistered(who);
        if (!rec.frozen) revert CR_NotFrozen(who);
        rec.frozen = false;
        emit CompanyUnfrozen(who);
    }

    /// @notice True if `who` is registered AND not frozen. Read by CarbonCredit + CarbonDEX gates.
    function isVerified(address who) external view returns (bool) {
        CompanyRecord storage rec = _records[who];
        return rec.registered && !rec.frozen;
    }

    /// @notice Read the full record for an address. Returns zero values for unregistered addresses.
    function recordOf(address who) external view returns (CompanyRecord memory) {
        return _records[who];
    }
}
