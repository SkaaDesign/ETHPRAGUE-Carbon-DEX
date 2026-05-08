// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract EURS is ERC20 {
    uint256 public constant FAUCET_AMOUNT = 10000 * 10**18;
    address public regulator;
    
    event FaucetDispensed(address indexed to, uint256 amount);
    
    modifier onlyRegulator() {
        require(msg.sender == regulator, "only regulator");
        _;
    }
    
    constructor() ERC20("Mock EUR Stablecoin", "EURS") {
        regulator = msg.sender;
    }
    
    // Demo faucet - anyone can get test EURS
    function requestFaucet() external {
        require(balanceOf(msg.sender) == 0, "already received faucet");
        _mint(msg.sender, FAUCET_AMOUNT);
        emit FaucetDispensed(msg.sender, FAUCET_AMOUNT);
    }
    
    // Regulator can mint more (for demo liquidity)
    function mint(address to, uint256 amount) external onlyRegulator {
        _mint(to, amount);
    }
}