// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console} from "forge-std/Test.sol";
import {EURS} from "../src/EURS.sol";
import {ComplianceRegistry} from "../src/ComplianceRegistry.sol";
import {CarbonCredit} from "../src/CarbonCredit.sol";
import {Retirement} from "../src/Retirement.sol";
import {CarbonDEX} from "../src/CarbonDEX.sol";
import {Regulator} from "../src/Regulator.sol";

contract CarbonSystemUnitTest is Test {
    EURS eurs;
    ComplianceRegistry complianceRegistry;
    CarbonCredit carbonCredit;
    Retirement retirement;
    CarbonDEX carbonDEX;
    Regulator regulator;

    address deployer = address(1);
    address companyA = address(2);
    address companyB = address(3);
    address hacker = address(1337);

    function setUp() public {
        vm.startPrank(deployer);

        eurs = new EURS();
        complianceRegistry = new ComplianceRegistry();
        carbonCredit = new CarbonCredit(address(complianceRegistry));
        retirement = new Retirement(address(carbonCredit), address(complianceRegistry));
        
        carbonDEX = new CarbonDEX(
            address(carbonCredit),
            address(eurs),
            address(complianceRegistry)
        );
        
        regulator = new Regulator(
            address(carbonCredit),
            address(complianceRegistry),
            address(carbonDEX),
            address(eurs)
        );

        carbonCredit.setRegulator(address(regulator));
        complianceRegistry.setRegulator(address(regulator));
        carbonDEX.unpause();

        // Register valid entities
        regulator.registerCompany(deployer, "Deployer Registry", "Germany", 0);
        regulator.registerCompany(companyA, "Company A GmbH", "Germany", 0);
        regulator.registerCompany(companyB, "Company B Corp", "USA", 0);
        regulator.registerCompany(address(carbonDEX), "Carbon DEX Pool", "Germany", 0);

        // Seed liquidity
        eurs.mint(deployer, 50_000 * 10**18);
        regulator.mintCarbonCredits(deployer, 2500 * 10**18);

        eurs.approve(address(carbonDEX), 50_000 * 10**18);
        carbonCredit.approve(address(carbonDEX), 2500 * 10**18);
        carbonDEX.addLiquidity(50_000 * 10**18, 2500 * 10**18);

        vm.stopPrank();
    }

    // ==========================================
    // 1. SECURITY & ACCESS CONTROL TESTS
    // ==========================================

    function test_Revert_MintFromNonRegulator() public {
        // Hacker attempts to bypass regulator and mint directly to themselves
        vm.startPrank(hacker);
        
        vm.expectRevert(CarbonCredit.OnlyRegulator.selector);
        carbonCredit.mint(hacker, 100 * 10**18);
        
        vm.stopPrank();
    }

    function test_Revert_TransferToOrFromUnverifiedAddress() public {
        // Give companyA some carbon credits
        vm.prank(deployer);
        regulator.mintCarbonCredits(companyA, 100 * 10**18);

        // Company A attempts to transfer to unverified Hacker address
        vm.startPrank(companyA);
        
        vm.expectRevert(CarbonCredit.NotVerified.selector);
        carbonCredit.transfer(hacker, 10 * 10**18);
        
        vm.stopPrank();
    }

    function test_Revert_DEXInteractionByUnverifiedAddress() public {
        // Give hacker some EURS
        vm.prank(deployer);
        eurs.mint(hacker, 1000 * 10**18);

        vm.startPrank(hacker);
        eurs.approve(address(carbonDEX), 1000 * 10**18);

        // Unverified hacker attempts to swap on the DEX
        vm.expectRevert("CarbonDEX: account not verified");
        carbonDEX.swapEURSForCarbon(100 * 10**18, 1);

        vm.stopPrank();
    }

    // ==========================================
    // 2. DEX EDGE CASE TESTS
    // ==========================================

    function test_Revert_SlippageProtectionTripped() public {
        // Fund Company B
        vm.prank(deployer);
        eurs.mint(companyB, 1000 * 10**18);

        vm.startPrank(companyB);
        eurs.approve(address(carbonDEX), 500 * 10**18);

        // Attempt to swap 400 EURS, but demanding 100 CARBON (impossible rate)
        vm.expectRevert("slippage too high");
        carbonDEX.swapEURSForCarbon(400 * 10**18, 100 * 10**18);

        vm.stopPrank();
    }

    // ==========================================
    // 3. RETIREMENT & BURN TESTS
    // ==========================================

    function test_Revert_RetireWithoutApproval() public {
        // Give Company B some Carbon Credits directly
        vm.prank(deployer);
        regulator.mintCarbonCredits(companyB, 50 * 10**18);

        vm.startPrank(companyB);
        // Deliberately DO NOT approve the retirement contract to spend Company B's credits

        // This must revert due to insufficient allowance inside ERC-20 burn logic
        vm.expectRevert();
        retirement.retire(10 * 10**18, "Offsetting personal carbon footprint");

        vm.stopPrank();
    }

    function test_Success_PartialBurnDecreasesAllowanceCorrectly() public {
        // Give Company B some Carbon Credits directly
        vm.prank(deployer);
        regulator.mintCarbonCredits(companyB, 50 * 10**18);

        vm.startPrank(companyB);
        // Approve retirement contract to spend 20 CARBON
        carbonCredit.approve(address(retirement), 20 * 10**18);
        
        // Retire only 15 CARBON
        retirement.retire(15 * 10**18, "Partial offset");

        // Remaining allowance should be exactly 5 CARBON
        uint256 remainingAllowance = carbonCredit.allowance(companyB, address(retirement));
        assertEq(remainingAllowance, 5 * 10**18, "Allowance was not decremented correctly");
        
        vm.stopPrank();
    }
}