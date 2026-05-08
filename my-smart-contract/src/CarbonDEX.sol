// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {EURS} from "./EURS.sol";
import {CarbonCredit} from "./CarbonCredit.sol";
import {ComplianceRegistry} from "./ComplianceRegistry.sol";

contract CarbonDEX {
    EURS public immutable eurs;
    CarbonCredit public immutable carbonCredit;
    ComplianceRegistry public immutable complianceRegistry;
    
    address public regulator;
    uint256 public immutable tokenId;
    bool public isPaused;

    uint256 public reserveEURS;
    uint256 public reserveCredits;

    event Swap(address indexed user, uint256 amountEURSIn, uint256 amountCreditsIn, uint256 amountEURSOut, uint256 amountCreditsOut);
    event LiquidityAdded(address indexed user, uint256 amountEURS, uint256 amountCredits);
    event LiquidityRemoved(address indexed user, uint256 amountEURS, uint256 amountCredits);
    event Paused();
    event Unpaused();

    error NotRegulator();
    error AccountFrozenOrNotKYC();
    error PoolPaused();
    error InsufficientBalance();
    error InsufficientLiquidity();
    error ZeroAddress();

    modifier onlyRegulator() {
        if (msg.sender != regulator) revert NotRegulator();
        _;
    }

    modifier onlyCompliant() {
        if (!complianceRegistry.isVerified(msg.sender)) revert AccountFrozenOrNotKYC();
        _;
    }

    modifier whenNotPaused() {
        if (isPaused) revert PoolPaused();
        _;
    }

    constructor(
        address _eurs,
        address _carbonCredit,
        address _complianceRegistry,
        uint256 _tokenId,
        address _regulator
    ) {
        if (_eurs == address(0) || _carbonCredit == address(0) || _complianceRegistry == address(0)) revert ZeroAddress();
        eurs = EURS(_eurs);
        carbonCredit = CarbonCredit(_carbonCredit);
        complianceRegistry = ComplianceRegistry(_complianceRegistry);
        tokenId = _tokenId;
        regulator = _regulator;
    }

    function emergencyPause() external onlyRegulator {
        isPaused = true;
        emit Paused();
    }

    function unpause() external onlyRegulator {
        isPaused = false;
        emit Unpaused();
    }

    function addLiquidity(uint256 amountEURS, uint256 amountCredits) external onlyCompliant whenNotPaused {
        eurs.transferFrom(msg.sender, address(this), amountEURS);
        
        carbonCredit.safeTransferFrom(
            msg.sender,
            address(this),
            tokenId,
            amountCredits,
            ""
        );

        reserveEURS += amountEURS;
        reserveCredits += amountCredits;

        emit LiquidityAdded(msg.sender, amountEURS, amountCredits);
    }

    function removeLiquidity(uint256 amountEURS, uint256 amountCredits) external onlyCompliant {
        if (amountEURS > reserveEURS || amountCredits > reserveCredits) revert InsufficientLiquidity();

        reserveEURS -= amountEURS;
        reserveCredits -= amountCredits;

        eurs.transfer(msg.sender, amountEURS);
        carbonCredit.safeTransferFrom(
            address(this),
            msg.sender,
            tokenId,
            amountCredits,
            ""
        );

        emit LiquidityRemoved(msg.sender, amountEURS, amountCredits);
    }

    function swapEURSForCredits(uint256 amountEURSIn) external onlyCompliant whenNotPaused {
        if (amountEURSIn == 0) revert InsufficientBalance();
        
        uint256 amountInWithFee = amountEURSIn * 997;
        uint256 numerator = amountInWithFee * reserveCredits;
        uint256 denominator = (reserveEURS * 1000) + amountInWithFee;
        uint256 amountOut = numerator / denominator;

        if (amountOut > reserveCredits) revert InsufficientLiquidity();

        eurs.transferFrom(msg.sender, address(this), amountEURSIn);
        
        reserveEURS += amountEURSIn;
        reserveCredits -= amountOut;

        carbonCredit.safeTransferFrom(
            address(this),
            msg.sender,
            tokenId,
            amountOut,
            ""
        );

        emit Swap(msg.sender, amountEURSIn, 0, 0, amountOut);
    }

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }
}