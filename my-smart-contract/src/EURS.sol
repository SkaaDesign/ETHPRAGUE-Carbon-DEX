// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "solady/tokens/ERC20.sol";

contract EURS is ERC20 {
    uint256 public constant FAUCET_CAP = 10_000 * 10**18;

    error InsufficientLiquidity();

    function name() public pure override returns (string memory) { return "Euro Stablecoin Mock"; }
    function symbol() public pure override returns (string memory) { return "EURS"; }

    function mintFaucet(uint256 amount) external {
        if (amount > FAUCET_CAP) revert InsufficientLiquidity();
        _mint(msg.sender, amount);
    }
}