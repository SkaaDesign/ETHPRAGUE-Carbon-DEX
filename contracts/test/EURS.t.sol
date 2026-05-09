// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {EURS} from "../src/EURS.sol";

contract EURSTest is Test {
    EURS internal eurs;
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    function setUp() public {
        eurs = new EURS();
    }

    function test_NameSymbolDecimals() public view {
        assertEq(eurs.name(), "Mock Euro Stablecoin");
        assertEq(eurs.symbol(), "EURS");
        assertEq(eurs.decimals(), 18);
    }

    function test_Faucet_MintsToCaller() public {
        vm.prank(alice);
        eurs.faucet(1_000 * 10 ** 18);

        assertEq(eurs.balanceOf(alice), 1_000 * 10 ** 18);
        assertEq(eurs.totalSupply(), 1_000 * 10 ** 18);
    }

    function test_Faucet_AllowsExactCap() public {
        uint256 cap = eurs.FAUCET_MAX();
        vm.prank(alice);
        eurs.faucet(cap);

        assertEq(eurs.balanceOf(alice), cap);
    }

    function test_Faucet_RevertsAboveCap() public {
        uint256 cap = eurs.FAUCET_MAX();
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(EURS.EURS_AmountExceedsFaucetCap.selector, cap + 1, cap)
        );
        eurs.faucet(cap + 1);
    }

    function test_Transfer_Standard() public {
        vm.prank(alice);
        eurs.faucet(1_000 * 10 ** 18);

        vm.prank(alice);
        assertTrue(eurs.transfer(bob, 250 * 10 ** 18));

        assertEq(eurs.balanceOf(alice), 750 * 10 ** 18);
        assertEq(eurs.balanceOf(bob), 250 * 10 ** 18);
    }
}
