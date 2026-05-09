// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./CarbonCredit.sol";
import "./EURS.sol";
import "./ComplianceRegistry.sol";

contract CarbonDEX {
    struct Pool {
        uint256 reserveEURS;
        uint256 reserveCarbon;
        uint256 totalLiquidityTokens;
        mapping(address => uint256) liquidity;
    }
    
    Pool public pool;
    
    CarbonCredit public carbonCredit;
    EURS public eurs;
    ComplianceRegistry public complianceRegistry;
    address public regulator;
    
    bool public paused;
    uint256 public constant FEE = 30; // 0.3% fee (30 bps)
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    event LiquidityAdded(address indexed provider, uint256 eursAmount, uint256 carbonAmount, uint256 liquidityTokens);
    event LiquidityRemoved(address indexed provider, uint256 eursAmount, uint256 carbonAmount, uint256 liquidityTokens);
    event Swap(address indexed from, address indexed to, uint256 inputAmount, uint256 outputAmount, bool isEURSInput);
    event Paused(address indexed by);
    event Unpaused(address indexed by);
    
    modifier onlyRegulator() {
        require(msg.sender == regulator, "CarbonDEX: only regulator");
        _;
    }
    
    modifier notPaused() {
        require(!paused, "CarbonDEX: contract paused");
        _;
    }
    
    modifier onlyVerified(address account) {
        require(complianceRegistry.isVerified(account), "CarbonDEX: account not verified");
        _;
    }
    
    constructor(
        address _carbonCredit,
        address _eurs,
        address _complianceRegistry
    ) {
        carbonCredit = CarbonCredit(_carbonCredit);
        eurs = EURS(_eurs);
        complianceRegistry = ComplianceRegistry(_complianceRegistry);
        regulator = msg.sender;
        paused = false;
    }
    
    function emergencyPause() external onlyRegulator {
        paused = true;
        emit Paused(msg.sender);
    }
    
    function unpause() external onlyRegulator {
        paused = false;
        emit Unpaused(msg.sender);
    }
    
    function addLiquidity(uint256 eursAmount, uint256 carbonAmount) 
        external 
        onlyVerified(msg.sender) 
        notPaused 
        returns (uint256 liquidityTokens) 
    {
        require(eursAmount > 0 && carbonAmount > 0, "amounts must be > 0");
        
        // Transfer tokens to DEX (using ERC-20 transfers)
        eurs.transferFrom(msg.sender, address(this), eursAmount);
        carbonCredit.transferFrom(msg.sender, address(this), carbonAmount);
        
        if (pool.totalLiquidityTokens == 0) {
            // Initial liquidity: geometric mean
            liquidityTokens = sqrt(eursAmount * carbonAmount);
        } else {
            // Proportional to existing reserves
            uint256 eursLiquidity = (eursAmount * pool.totalLiquidityTokens) / pool.reserveEURS;
            uint256 carbonLiquidity = (carbonAmount * pool.totalLiquidityTokens) / pool.reserveCarbon;
            liquidityTokens = (eursLiquidity + carbonLiquidity) / 2;
        }
        
        require(liquidityTokens > 0, "insufficient liquidity tokens");
        
        // Update pool
        pool.reserveEURS += eursAmount;
        pool.reserveCarbon += carbonAmount;
        pool.liquidity[msg.sender] += liquidityTokens;
        pool.totalLiquidityTokens += liquidityTokens;
        
        emit LiquidityAdded(msg.sender, eursAmount, carbonAmount, liquidityTokens);
    }
    
    function removeLiquidity(uint256 liquidityTokens) 
        external 
        onlyVerified(msg.sender) 
        returns (uint256 eursAmount, uint256 carbonAmount) 
    {
        require(liquidityTokens > 0, "must remove > 0");
        require(pool.liquidity[msg.sender] >= liquidityTokens, "insufficient liquidity");
        
        // Calculate proportional amounts
        eursAmount = (liquidityTokens * pool.reserveEURS) / pool.totalLiquidityTokens;
        carbonAmount = (liquidityTokens * pool.reserveCarbon) / pool.totalLiquidityTokens;
        
        // Update pool
        pool.reserveEURS -= eursAmount;
        pool.reserveCarbon -= carbonAmount;
        pool.liquidity[msg.sender] -= liquidityTokens;
        pool.totalLiquidityTokens -= liquidityTokens;
        
        // Transfer back
        eurs.transfer(msg.sender, eursAmount);
        carbonCredit.transfer(msg.sender, carbonAmount);
        
        emit LiquidityRemoved(msg.sender, eursAmount, carbonAmount, liquidityTokens);
    }
    
    function swapEURSForCarbon(uint256 eursInput, uint256 minCarbonOutput) 
        external 
        onlyVerified(msg.sender) 
        notPaused 
        returns (uint256 carbonOutput) 
    {
        require(eursInput > 0, "input must be > 0");
        
        carbonOutput = getOutputAmount(eursInput, pool.reserveEURS, pool.reserveCarbon);
        require(carbonOutput >= minCarbonOutput, "slippage too high");
        
        pool.reserveEURS += eursInput;
        pool.reserveCarbon -= carbonOutput;
        
        // Transfer
        eurs.transferFrom(msg.sender, address(this), eursInput);
        carbonCredit.transfer(msg.sender, carbonOutput);
        
        emit Swap(msg.sender, address(this), eursInput, carbonOutput, true);
    }
    
    function swapCarbonForEURS(uint256 carbonInput, uint256 minEURSOutput) 
        external 
        onlyVerified(msg.sender) 
        notPaused 
        returns (uint256 eursOutput) 
    {
        require(carbonInput > 0, "input must be > 0");
        
        eursOutput = getOutputAmount(carbonInput, pool.reserveCarbon, pool.reserveEURS);
        require(eursOutput >= minEURSOutput, "slippage too high");
        
        pool.reserveCarbon += carbonInput;
        pool.reserveEURS -= eursOutput;
        
        // Transfer
        carbonCredit.transferFrom(msg.sender, address(this), carbonInput);
        eurs.transfer(msg.sender, eursOutput);
        
        emit Swap(msg.sender, address(this), carbonInput, eursOutput, false);
    }
    
    function getOutputAmount(uint256 inputAmount, uint256 inputReserve, uint256 outputReserve) 
        public 
        pure 
        returns (uint256) 
    {
        require(inputReserve > 0 && outputReserve > 0, "insufficient liquidity");
        uint256 inputAmountWithFee = inputAmount * (FEE_DENOMINATOR - FEE);
        uint256 numerator = inputAmountWithFee * outputReserve;
        uint256 denominator = (inputReserve * FEE_DENOMINATOR) + inputAmountWithFee;
        return numerator / denominator;
    }
    
    function getReserves() external view returns (uint256 eursReserve, uint256 carbonReserve) {
        return (pool.reserveEURS, pool.reserveCarbon);
    }
    
    function getLiquidity(address provider) external view returns (uint256) {
        return pool.liquidity[provider];
    }
    
    function getPrice() external view returns (uint256 eursPerCarbon) {
        if (pool.reserveCarbon == 0) return 0;
        return (pool.reserveEURS * 10**18) / pool.reserveCarbon;
    }
    
    function sqrt(uint256 y) private pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}