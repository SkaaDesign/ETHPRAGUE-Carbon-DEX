// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ComplianceRegistry} from "../src/ComplianceRegistry.sol";
import {CarbonCredit} from "../src/CarbonCredit.sol";
import {EURS} from "../src/EURS.sol";
import {CarbonDEX} from "../src/CarbonDEX.sol";

contract CarbonDEXTest is Test {
    ComplianceRegistry internal registry;
    CarbonCredit internal credit;
    EURS internal eurs;
    CarbonDEX internal dex;

    address internal admin = makeAddr("admin");
    address internal regulator = makeAddr("regulator");
    address internal lp = makeAddr("lp");           // liquidity provider
    address internal trader = makeAddr("trader");   // Company B
    address internal stranger = makeAddr("stranger");

    uint256 internal constant INITIAL_EURS = 70_000 * 10 ** 18;     // 70k EURS
    uint256 internal constant INITIAL_CREDIT = 1_000 * 10 ** 18;    // 1k EUA → ~€70/EUA

    function setUp() public {
        registry = new ComplianceRegistry(admin);
        credit = new CarbonCredit(admin, registry);
        eurs = new EURS();
        dex = new CarbonDEX(admin, eurs, credit, registry);

        // Register all participants AND the DEX itself (so DEX can hold CarbonCredit).
        vm.startPrank(admin);
        registry.register(lp, ComplianceRegistry.AccountType.Trader, bytes2("XX"), "LP");
        registry.register(trader, ComplianceRegistry.AccountType.Operator, bytes2("SK"), "Aluminium Bratislava");
        registry.register(address(dex), ComplianceRegistry.AccountType.Trader, bytes2("XX"), "Carbon DEX Pool");
        credit.grantRole(credit.MINTER_ROLE(), admin);
        dex.grantRole(dex.PAUSER_ROLE(), regulator);
        // Mint initial liquidity to LP, plus EURS via faucet
        credit.mint(lp, INITIAL_CREDIT, 2026, bytes2("IN"), bytes2("DE"), keccak256("seed"));
        vm.stopPrank();

        vm.prank(lp);
        eurs.faucet(INITIAL_EURS);

        // LP seeds the pool
        vm.startPrank(lp);
        eurs.approve(address(dex), INITIAL_EURS);
        credit.approve(address(dex), INITIAL_CREDIT);
        dex.addLiquidity(INITIAL_EURS, INITIAL_CREDIT);
        vm.stopPrank();
    }

    // ─── Setup sanity ───────────────────────────────────────────────────

    function test_Setup_ReservesSeededCorrectly() public view {
        assertEq(dex.reserveEURS(), INITIAL_EURS);
        assertEq(dex.reserveCredit(), INITIAL_CREDIT);
        // LP got sqrt(x*y) - MIN_LIQUIDITY shares; MIN_LIQUIDITY locked at 0xdead
        assertEq(dex.balanceOf(address(0xdead)), dex.MIN_LIQUIDITY());
        assertGt(dex.balanceOf(lp), 0);
    }

    // ─── View helpers ───────────────────────────────────────────────────

    function test_GetReserves_ReturnsCurrentState() public view {
        (uint256 r0, uint256 r1) = dex.getReserves();
        assertEq(r0, INITIAL_EURS);
        assertEq(r1, INITIAL_CREDIT);
    }

    function test_GetSpotPrice_ReturnsEURSPerCreditScaled1e18() public view {
        // 70k EURS / 1k Credit = 70 EURS per Credit → 70 * 1e18
        uint256 expected = (INITIAL_EURS * 1e18) / INITIAL_CREDIT;
        assertEq(dex.getSpotPrice(), expected);
        assertEq(expected, 70 * 1e18);
    }

    function test_GetLpBalance_MatchesBalanceOf() public view {
        assertEq(dex.getLpBalance(lp), dex.balanceOf(lp));
    }

    // ─── addLiquidity ───────────────────────────────────────────────────

    function test_AddLiquidity_RevertsForUnverified() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(CarbonDEX.DEX_NotVerified.selector, stranger));
        dex.addLiquidity(100, 100);
    }

    function test_AddLiquidity_RevertsForZeroAmount() public {
        vm.prank(lp);
        vm.expectRevert(CarbonDEX.DEX_AmountZero.selector);
        dex.addLiquidity(0, 100);
    }

    // ─── swapEURSForCredit ──────────────────────────────────────────────

    function test_SwapEURSForCredit_Succeeds() public {
        uint256 amountIn = 14_000 * 10 ** 18; // ~€14k → ~200 EUA at €70 minus fee/slippage

        // Fund trader and approve
        vm.prank(trader);
        eurs.faucet(amountIn);
        vm.prank(trader);
        eurs.approve(address(dex), amountIn);

        uint256 expectedOut = dex.getAmountOut(amountIn, INITIAL_EURS, INITIAL_CREDIT);

        vm.prank(trader);
        uint256 actualOut = dex.swapEURSForCredit(amountIn, expectedOut);

        assertEq(actualOut, expectedOut);
        assertEq(credit.balanceOf(trader), expectedOut);
        assertEq(dex.reserveEURS(), INITIAL_EURS + amountIn);
        assertEq(dex.reserveCredit(), INITIAL_CREDIT - expectedOut);
    }

    function test_SwapEURSForCredit_RevertsOnSlippage() public {
        uint256 amountIn = 14_000 * 10 ** 18;
        vm.prank(trader);
        eurs.faucet(amountIn);
        vm.prank(trader);
        eurs.approve(address(dex), amountIn);

        // Demand more output than possible
        vm.prank(trader);
        vm.expectRevert();
        dex.swapEURSForCredit(amountIn, 1_000 * 10 ** 18);
    }

    function test_SwapEURSForCredit_RevertsForUnverified() public {
        vm.prank(stranger);
        eurs.faucet(100 * 10 ** 18);
        vm.prank(stranger);
        eurs.approve(address(dex), 100 * 10 ** 18);

        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(CarbonDEX.DEX_NotVerified.selector, stranger));
        dex.swapEURSForCredit(100 * 10 ** 18, 0);
    }

    function test_SwapEURSForCredit_RevertsWhenPaused() public {
        vm.prank(regulator);
        dex.pause("emergency");

        uint256 amountIn = 100 * 10 ** 18;
        vm.prank(trader);
        eurs.faucet(amountIn);
        vm.prank(trader);
        eurs.approve(address(dex), amountIn);

        vm.prank(trader);
        vm.expectRevert(CarbonDEX.DEX_Paused.selector);
        dex.swapEURSForCredit(amountIn, 0);
    }

    // ─── swapCreditForEURS ──────────────────────────────────────────────

    function test_SwapCreditForEURS_Succeeds() public {
        // Give trader some credits to sell
        vm.prank(admin);
        credit.mint(trader, 100 * 10 ** 18, 2026, bytes2("IN"), bytes2("DE"), keccak256("test"));

        vm.prank(trader);
        credit.approve(address(dex), 100 * 10 ** 18);

        uint256 expectedOut = dex.getAmountOut(100 * 10 ** 18, INITIAL_CREDIT, INITIAL_EURS);

        vm.prank(trader);
        dex.swapCreditForEURS(100 * 10 ** 18, expectedOut);

        assertEq(eurs.balanceOf(trader), expectedOut);
    }

    // ─── Pause ──────────────────────────────────────────────────────────

    function test_Pause_RevertsForNonPauser() public {
        vm.prank(stranger);
        vm.expectRevert();
        dex.pause("test");
    }

    function test_Unpause_AllowsTradingAgain() public {
        vm.prank(regulator);
        dex.pause("emergency");

        vm.prank(regulator);
        dex.unpause();

        uint256 amountIn = 100 * 10 ** 18;
        vm.prank(trader);
        eurs.faucet(amountIn);
        vm.prank(trader);
        eurs.approve(address(dex), amountIn);

        vm.prank(trader);
        dex.swapEURSForCredit(amountIn, 0); // should succeed
    }

    // ─── removeLiquidity ────────────────────────────────────────────────

    function test_RemoveLiquidity_ProportionalPayout() public {
        uint256 lpBalance = dex.balanceOf(lp);
        uint256 halfLP = lpBalance / 2;

        uint256 expectedEURS = (halfLP * dex.reserveEURS()) / dex.totalSupply();
        uint256 expectedCredit = (halfLP * dex.reserveCredit()) / dex.totalSupply();

        vm.prank(lp);
        dex.removeLiquidity(halfLP);

        assertEq(eurs.balanceOf(lp), expectedEURS);
        assertEq(credit.balanceOf(lp), expectedCredit);
    }

    // ─── x*y=k invariant (within 0.3% fee tolerance) ────────────────────

    function test_Swap_PreservesKInvariantUpToFee() public {
        uint256 kBefore = dex.reserveEURS() * dex.reserveCredit();

        uint256 amountIn = 14_000 * 10 ** 18;
        vm.prank(trader);
        eurs.faucet(amountIn);
        vm.prank(trader);
        eurs.approve(address(dex), amountIn);

        vm.prank(trader);
        dex.swapEURSForCredit(amountIn, 0);

        uint256 kAfter = dex.reserveEURS() * dex.reserveCredit();
        // k can only grow (fee accrues to LPs); never shrink
        assertGe(kAfter, kBefore);
    }
}
