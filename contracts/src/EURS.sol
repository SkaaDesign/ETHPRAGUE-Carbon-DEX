// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title  EURS — Mock EUR stablecoin
/// @notice Settlement currency for the Carbon DEX demo. Faucet-style: anyone can mint
///         up to FAUCET_MAX per call so demo wallets can self-fund. Production replacement
///         would be a real EUR stablecoin (e.g., Circle's EURC).
contract EURS is ERC20 {
    /// @notice Maximum tokens (18 decimals) any single faucet call can mint.
    /// @dev    100,000 EURS per call is plenty for any single demo flow (one call funds Company B's
    ///         200-EUA buy at €70 with headroom).
    uint256 public constant FAUCET_MAX = 100_000 * 10 ** 18;

    /// @notice Reverted when faucet() is called with amount > FAUCET_MAX.
    error EURS_AmountExceedsFaucetCap(uint256 requested, uint256 cap);

    constructor() ERC20("Mock Euro Stablecoin", "EURS") {}

    /// @notice Mint up to FAUCET_MAX EURS to the caller. No access control by design (demo only).
    /// @param amount Number of EURS (18 decimals) to mint to msg.sender.
    function faucet(uint256 amount) external {
        if (amount > FAUCET_MAX) revert EURS_AmountExceedsFaucetCap(amount, FAUCET_MAX);
        _mint(msg.sender, amount);
    }
}
