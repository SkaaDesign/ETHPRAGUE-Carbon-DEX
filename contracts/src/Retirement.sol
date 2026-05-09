// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {CarbonCredit} from "./CarbonCredit.sol";

/// @title  Retirement — surrender carbon credits against verified emissions
/// @notice Public surrender interface. Calls CarbonCredit.burnFrom() (Retirement holds
///         BURNER_ROLE) to permanently destroy credits and emit a Retired event — the
///         artefact corporate sustainability officers cite in disclosures.
/// @dev    Real EU ETS analogue: transfer to Union deletion account = on-chain burn.
///         "Retire" = our user-facing verb; "surrender" is the EU ETS term — same op.
///         See docs/research/eu-ets-reality-check.md §1 + §6.
contract Retirement {
    /// @notice The CarbonCredit token contract this Retirement burns from.
    CarbonCredit public immutable CREDIT;

    /// @notice Permanent on-chain proof of allowance surrender.
    /// @param  from        Surrendering account (msg.sender of retire()).
    /// @param  amount      Amount surrendered.
    /// @param  beneficiary Whose emissions this surrender covers (often == from; allows
    ///                     third-party retirement on behalf of a beneficiary).
    /// @param  reasonURI   Off-chain reference, e.g. ipfs://...sustainability-report.pdf.
    /// @param  timestamp   Block timestamp at surrender.
    event Retired(
        address indexed from,
        uint256 amount,
        address indexed beneficiary,
        string reasonURI,
        uint256 timestamp
    );

    error RT_AmountZero();

    constructor(CarbonCredit credit) {
        CREDIT = credit;
    }

    /// @notice Surrender allowances against verified emissions. Permanent — credits are burned.
    /// @param  amount      Amount to retire (18 decimals).
    /// @param  beneficiary Whose emissions this covers (use msg.sender for self-retirement).
    /// @param  reasonURI   Off-chain reference for the surrender.
    function retire(uint256 amount, address beneficiary, string calldata reasonURI) external {
        if (amount == 0) revert RT_AmountZero();
        CREDIT.burnFrom(msg.sender, amount);
        emit Retired(msg.sender, amount, beneficiary, reasonURI, block.timestamp);
    }
}
