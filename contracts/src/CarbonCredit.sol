// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ComplianceRegistry} from "./ComplianceRegistry.sol";

/// @title  CarbonCredit — fungible EUA-equivalent allowance token
/// @notice ERC-20 representing tradeable carbon allowances. Within-Phase fungibility matches
///         real EU ETS (a 2024 EUA satisfies a 2026 surrender obligation; banking unrestricted
///         intra-Phase 4). Vintage / sector / origin metadata travels on CreditMinted events,
///         not on the token — provenance recoverable from event logs.
/// @dev    Transfer/mint/burn paths gated by ComplianceRegistry.isVerified() on the non-zero
///         party. MINTER_ROLE held by Regulator; BURNER_ROLE held by Retirement contract.
contract CarbonCredit is ERC20, AccessControl {
    /// @notice Allowed to mint new credits. Granted to Regulator on deploy via admin.
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @notice Allowed to burn credits. Granted to Retirement on deploy via admin.
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    /// @notice Compliance whitelist consulted on every transfer / mint / burn.
    ComplianceRegistry public immutable REGISTRY;

    event CreditMinted(
        address indexed to,
        uint256 amount,
        uint16 vintage,
        bytes2 sector,
        bytes2 originCountry,
        bytes32 issuanceRef
    );

    error CC_SenderNotVerified(address from);
    error CC_RecipientNotVerified(address to);

    /// @param admin    Granted DEFAULT_ADMIN_ROLE (typically the Regulator deployer).
    /// @param registry Address of the deployed ComplianceRegistry.
    constructor(address admin, ComplianceRegistry registry)
        ERC20("Carbon Allowance", "EUA")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        REGISTRY = registry;
    }

    /// @notice Mint allowances. MINTER_ROLE only (Regulator).
    /// @param  to             Verified recipient (must pass isVerified).
    /// @param  amount         Token amount (18 decimals).
    /// @param  vintage        Compliance year, e.g. 2026.
    /// @param  sector         ISO-style sector code, e.g. "IN" (industry), "EN" (energy).
    /// @param  originCountry  ISO 3166-1 alpha-2.
    /// @param  issuanceRef    External reference (e.g. allocation event id hashed to bytes32).
    function mint(
        address to,
        uint256 amount,
        uint16 vintage,
        bytes2 sector,
        bytes2 originCountry,
        bytes32 issuanceRef
    ) external onlyRole(MINTER_ROLE) {
        _mint(to, amount); // _update enforces recipient verification
        emit CreditMinted(to, amount, vintage, sector, originCountry, issuanceRef);
    }

    /// @notice Burn credits from `from`. BURNER_ROLE-gated AND requires the burner to hold
    ///         an ERC-20 allowance from `from` (matches OZ ERC20Burnable convention). Defends
    ///         against a future BURNER_ROLE mis-grant: the holder must explicitly approve the
    ///         burner before any burn can happen. Retirement.retire() pulls the allowance from
    ///         msg.sender as part of its flow.
    function burnFrom(address from, uint256 amount) external onlyRole(BURNER_ROLE) {
        _spendAllowance(from, msg.sender, amount);
        _burn(from, amount); // _update enforces from-verification
    }

    /// @dev OZ v5 unified transfer/mint/burn hook. Whitelist-gates non-zero parties.
    ///      Mint: from = address(0), only `to` checked. Burn: to = address(0), only `from` checked.
    function _update(address from, address to, uint256 value) internal override {
        if (from != address(0) && !REGISTRY.isVerified(from)) revert CC_SenderNotVerified(from);
        if (to != address(0) && !REGISTRY.isVerified(to)) revert CC_RecipientNotVerified(to);
        super._update(from, to, value);
    }
}
