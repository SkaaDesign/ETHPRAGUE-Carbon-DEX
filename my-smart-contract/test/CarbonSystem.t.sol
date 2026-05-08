// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ComplianceRegistry} from "../src/ComplianceRegistry.sol";
import {CarbonCredit} from "../src/CarbonCredit.sol";
import {Retirement} from "../src/Retirement.sol";
import {EURS} from "../src/EURS.sol";
import {CarbonDEX} from "../src/CarbonDEX.sol";

contract CarbonSystemTest is Test {
    ComplianceRegistry registry;
    CarbonCredit credit;
    Retirement retirement;
    EURS eurs;
    CarbonDEX dex;

    address regulator = address(0x1);
    address alice = address(0x2);
    address bob = address(0x3);
    uint256 tokenId = 101;

    // This setup runs before every single test
    function setUp() public {
        vm.startPrank(regulator);
        
        // 1. Deploy system contracts
        registry = new ComplianceRegistry(regulator);
        credit = new CarbonCredit(regulator, address(registry));
        retirement = new Retirement(address(credit));
        credit.setRetirementContract(address(retirement));

        // 2. Deploy stablecoin & DEX
        eurs = new EURS();
        dex = new CarbonDEX(address(eurs), address(credit), address(registry), tokenId, regulator);

        // 3. Register players in the registry
        registry.register(alice, ComplianceRegistry.CompanyRecord(true, "Germany", "ETS", false));
        registry.register(bob, ComplianceRegistry.CompanyRecord(true, "Czechia", "ETS", false));
        registry.register(address(dex), ComplianceRegistry.CompanyRecord(true, "EU", "DEX", false));

        // 4. Mint initial carbon credits to Alice (liquidity provider)
        CarbonCredit.CreditBatch memory metadata = CarbonCredit.CreditBatch({
            vintage: 2026,
            sector: "Energy",
            originCountry: "Germany",
            methodologyId: 12,
            totalIssued: 0,
            totalRetired: 0
        });
        credit.createAndMint(alice, tokenId, 500, metadata);

        vm.stopPrank();

        // 5. Mint test EURS to Bob (trader)
        vm.prank(bob);
        eurs.mintFaucet(10_000 * 10**18);
    }

    // Test 1: Verify non-whitelisted actors get blocked
    function test_FailUnregisteredTrading() public {
        address nonWhitelisted = address(0x9);
        
        vm.startPrank(nonWhitelisted);
        eurs.mintFaucet(1000 * 10**18);
        eurs.approve(address(dex), 1000 * 10**18);
        
        // Attempting to swap should revert with compliance check error
        vm.expectRevert(abi.encodeWithSignature("AccountFrozenOrNotKYC()"));
        dex.swapEURSForCredits(100 * 10**18);
        vm.stopPrank();
    }

    // Test 2: Verify Liquidity addition and swap mechanics
    function test_LiquidityAndSwapping() public {
        // Alice provides structural liquidity
        vm.startPrank(alice);
        eurs.mintFaucet(5000 * 10**18);
        eurs.approve(address(dex), 5000 * 10**18);
        credit.setApprovalForAll(address(dex), true);
        
        dex.addLiquidity(5000 * 10**18, 500);
        vm.stopPrank();

        // Verify state
        assertEq(dex.reserveEURS(), 5000 * 10**18);
        assertEq(dex.reserveCredits(), 500);

        // Bob swaps EURS to buy Carbon Credits
        vm.startPrank(bob);
        eurs.approve(address(dex), 1000 * 10**18);
        dex.swapEURSForCredits(1000 * 10**18);
        
        uint256 bobCreditBalance = credit.balanceOf(bob, tokenId);
        assertGt(bobCreditBalance, 0); // Bob successfully received credits
        vm.stopPrank();
    }

    // Test 3: Verify the Regulator can freeze the pool
    function test_RegulatoryPause() public {
        vm.prank(regulator);
        dex.emergencyPause();

        vm.startPrank(bob);
        eurs.approve(address(dex), 500 * 10**18);
        vm.expectRevert(abi.encodeWithSignature("PoolPaused()"));
        dex.swapEURSForCredits(500 * 10**18);
        vm.stopPrank();
    }

    // Test 4: Verify credit retirement/burning mechanics
    function test_Retirement() public {
        vm.startPrank(alice);
        credit.setApprovalForAll(address(retirement), true);
        
        // Alice retires 50 credits
        retirement.retire(tokenId, 50, alice, "ipfs://proof-of-offset");
        
        assertEq(credit.balanceOf(alice, tokenId), 450);
        
        // Query the credit batch info to ensure retirement was tracked
        (, , , , , uint256 totalRetired) = credit.batches(tokenId);
        assertEq(totalRetired, 50);
        vm.stopPrank();
    }
}