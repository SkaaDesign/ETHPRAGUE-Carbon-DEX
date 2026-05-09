// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ComplianceRegistry} from "./ComplianceRegistry.sol";

/// @title  CarbonDEX — constant-product AMM for EURS ↔ CarbonCredit (EUA)
/// @notice Custom CPMM with x*y=k math (same as Uniswap V2; rationale in BRIEF §3 row 1).
///         Two non-V2 features: (1) whitelist gate via ComplianceRegistry.isVerified() on
///         every action; (2) pause hook gated to PAUSER_ROLE (held by Regulator) that
///         suspends swaps + liquidity ops. 0.3% swap fee mirrors V2.
/// @dev    The pool itself is an ERC-20 representing LP shares (V2 pattern). MIN_LIQUIDITY
///         locked at address(0xdead) on first add to block first-LP price-manipulation.
///         IMPORTANT: this contract address must be registered in ComplianceRegistry so it
///         can hold CarbonCredit (which gates transfers by isVerified).
contract CarbonDEX is ERC20, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Held by the Regulator — can pause/unpause swaps and liquidity ops.
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @notice LP supply locked forever at address(0xdead) to block first-LP attacks.
    uint256 public constant MIN_LIQUIDITY = 1000;

    /// @notice 0.3% swap fee (FEE_NUM / FEE_DEN of input goes through; rest is fee).
    uint256 public constant FEE_NUM = 997;
    uint256 public constant FEE_DEN = 1000;

    IERC20 public immutable EURS;
    IERC20 public immutable CREDIT;
    ComplianceRegistry public immutable REGISTRY;

    uint256 public reserveEURS;
    uint256 public reserveCredit;
    bool public paused;

    event Swap(address indexed sender, uint256 amountIn, uint256 amountOut, bool isEURSIn);
    event LiquidityAdded(address indexed provider, uint256 amountEURS, uint256 amountCredit, uint256 lpMinted);
    event LiquidityRemoved(address indexed provider, uint256 amountEURS, uint256 amountCredit, uint256 lpBurned);
    event Paused(address indexed by, string reason);
    event Unpaused(address indexed by);

    error DEX_NotVerified(address who);
    error DEX_Paused();
    error DEX_AmountZero();
    error DEX_InsufficientLiquidity();
    error DEX_InsufficientOutput(uint256 minExpected, uint256 actual);
    error DEX_InsufficientLPMinted();

    modifier onlyVerified() {
        if (!REGISTRY.isVerified(msg.sender)) revert DEX_NotVerified(msg.sender);
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert DEX_Paused();
        _;
    }

    /// @param admin    DEFAULT_ADMIN_ROLE holder (regulator deployer).
    /// @param eurs     EURS settlement token.
    /// @param credit   CarbonCredit token (EUA).
    /// @param registry ComplianceRegistry consulted by onlyVerified.
    constructor(
        address admin,
        IERC20 eurs,
        IERC20 credit,
        ComplianceRegistry registry
    ) ERC20("Carbon DEX LP", "cdLP") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        EURS = eurs;
        CREDIT = credit;
        REGISTRY = registry;
    }

    // ─── Liquidity ──────────────────────────────────────────────────────

    /// @notice Add liquidity. First add seeds the price; subsequent adds must respect ratio.
    /// @return lpMinted LP shares minted to msg.sender.
    function addLiquidity(uint256 amountEURS, uint256 amountCredit)
        external
        nonReentrant
        onlyVerified
        whenNotPaused
        returns (uint256 lpMinted)
    {
        if (amountEURS == 0 || amountCredit == 0) revert DEX_AmountZero();

        EURS.safeTransferFrom(msg.sender, address(this), amountEURS);
        CREDIT.safeTransferFrom(msg.sender, address(this), amountCredit);

        uint256 totalLP = totalSupply();
        if (totalLP == 0) {
            lpMinted = _sqrt(amountEURS * amountCredit);
            if (lpMinted <= MIN_LIQUIDITY) revert DEX_InsufficientLPMinted();
            lpMinted -= MIN_LIQUIDITY;
            _mint(address(0xdead), MIN_LIQUIDITY);
        } else {
            uint256 lpFromEURS = (amountEURS * totalLP) / reserveEURS;
            uint256 lpFromCredit = (amountCredit * totalLP) / reserveCredit;
            lpMinted = lpFromEURS < lpFromCredit ? lpFromEURS : lpFromCredit;
            if (lpMinted == 0) revert DEX_InsufficientLPMinted();
        }

        _mint(msg.sender, lpMinted);
        reserveEURS += amountEURS;
        reserveCredit += amountCredit;

        emit LiquidityAdded(msg.sender, amountEURS, amountCredit, lpMinted);
    }

    /// @notice Remove liquidity proportionally.
    function removeLiquidity(uint256 lpAmount)
        external
        nonReentrant
        onlyVerified
        whenNotPaused
        returns (uint256 amountEURS, uint256 amountCredit)
    {
        if (lpAmount == 0) revert DEX_AmountZero();

        uint256 totalLP = totalSupply();
        amountEURS = (lpAmount * reserveEURS) / totalLP;
        amountCredit = (lpAmount * reserveCredit) / totalLP;
        if (amountEURS == 0 || amountCredit == 0) revert DEX_InsufficientLiquidity();

        _burn(msg.sender, lpAmount);
        reserveEURS -= amountEURS;
        reserveCredit -= amountCredit;

        EURS.safeTransfer(msg.sender, amountEURS);
        CREDIT.safeTransfer(msg.sender, amountCredit);

        emit LiquidityRemoved(msg.sender, amountEURS, amountCredit, lpAmount);
    }

    // ─── Swap ───────────────────────────────────────────────────────────

    function swapEURSForCredit(uint256 amountIn, uint256 minAmountOut)
        external
        nonReentrant
        onlyVerified
        whenNotPaused
        returns (uint256 amountOut)
    {
        if (amountIn == 0) revert DEX_AmountZero();

        amountOut = _getAmountOut(amountIn, reserveEURS, reserveCredit);
        if (amountOut < minAmountOut) revert DEX_InsufficientOutput(minAmountOut, amountOut);

        EURS.safeTransferFrom(msg.sender, address(this), amountIn);
        reserveEURS += amountIn;
        reserveCredit -= amountOut;
        CREDIT.safeTransfer(msg.sender, amountOut);

        emit Swap(msg.sender, amountIn, amountOut, true);
    }

    function swapCreditForEURS(uint256 amountIn, uint256 minAmountOut)
        external
        nonReentrant
        onlyVerified
        whenNotPaused
        returns (uint256 amountOut)
    {
        if (amountIn == 0) revert DEX_AmountZero();

        amountOut = _getAmountOut(amountIn, reserveCredit, reserveEURS);
        if (amountOut < minAmountOut) revert DEX_InsufficientOutput(minAmountOut, amountOut);

        CREDIT.safeTransferFrom(msg.sender, address(this), amountIn);
        reserveCredit += amountIn;
        reserveEURS -= amountOut;
        EURS.safeTransfer(msg.sender, amountOut);

        emit Swap(msg.sender, amountIn, amountOut, false);
    }

    /// @notice Quote helper. Same math as the swap functions; pure (no state read).
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut)
        external
        pure
        returns (uint256)
    {
        return _getAmountOut(amountIn, reserveIn, reserveOut);
    }

    function _getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut)
        internal
        pure
        returns (uint256)
    {
        if (amountIn == 0) revert DEX_AmountZero();
        if (reserveIn == 0 || reserveOut == 0) revert DEX_InsufficientLiquidity();
        uint256 amountInWithFee = amountIn * FEE_NUM;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * FEE_DEN + amountInWithFee;
        return numerator / denominator;
    }

    // ─── Regulator pause ────────────────────────────────────────────────

    function pause(string calldata reason) external onlyRole(PAUSER_ROLE) {
        paused = true;
        emit Paused(msg.sender, reason);
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        paused = false;
        emit Unpaused(msg.sender);
    }

    // ─── Internal: Babylonian integer sqrt ──────────────────────────────

    function _sqrt(uint256 x) internal pure returns (uint256 y) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }
}
