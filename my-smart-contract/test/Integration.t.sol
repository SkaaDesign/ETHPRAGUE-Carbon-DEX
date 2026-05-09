// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console} from "forge-std/Test.sol";
import {EURS} from "../src/EURS.sol";
import {ComplianceRegistry} from "../src/ComplianceRegistry.sol";
import {CarbonCredit} from "../src/CarbonCredit.sol";
import {Retirement} from "../src/Retirement.sol";
import {CarbonDEX} from "../src/CarbonDEX.sol";
import {Regulator} from "../src/Regulator.sol";

contract CarbonSystemIntegrationTest is Test {
    EURS eurs;
    ComplianceRegistry complianceRegistry;
    CarbonCredit carbonCredit;
    Retirement retirement;
    CarbonDEX carbonDEX;
    Regulator regulator;

    address deployer = address(1);
    address companyA = address(2);
    address companyB = address(3);

    function setUp() public {
        vm.startPrank(deployer);

        // 1. Deploy Core Contracts
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

        // 2. Set up Permissions
        carbonCredit.setRegulator(address(regulator));
        complianceRegistry.setRegulator(address(regulator));
        carbonDEX.unpause();

        // 3. Register Entities
        regulator.registerCompany(deployer, "Deployer Registry", "Germany", 0);
        regulator.registerCompany(companyA, "Company A GmbH", "Germany", 0);
        regulator.registerCompany(companyB, "Company B Corp", "USA", 0);
        regulator.registerCompany(address(carbonDEX), "Carbon DEX Pool", "Germany", 0);

        // 4. Fund Company B with EURS (1,000,000 EURS)
        eurs.mint(companyB, 1_000_000 * 10**18);

        // 5. Mint Carbon Credits directly to Company A (2,500 CARBON Credits)
        regulator.mintCarbonCredits(companyA, 2500 * 10**18);

        // 6. Transfer credits to deployer to seed the DEX
        vm.stopPrank();
        vm.prank(companyA);
        carbonCredit.transfer(deployer, 2500 * 10**18);

        // 7. Seed the DEX Pool with 50,000 EURS and 2,500 CARBON
        vm.startPrank(deployer);
        eurs.mint(deployer, 50_000 * 10**18);
        eurs.approve(address(carbonDEX), 50_000 * 10**18);
        carbonCredit.approve(address(carbonDEX), 2500 * 10**18);
        
        carbonDEX.addLiquidity(50_000 * 10**18, 2500 * 10**18);
        vm.stopPrank();
    }

    function test_CompanyB_BuyAndRetireFlow() public {
        // We want to buy 20 CARBON Credits
        uint256 carbonToBuy = 20 * 10**18;

        (uint256 reserveEURS, uint256 reserveCarbon) = carbonDEX.getReserves();

        // AMM Constant Product swap formula (including 0.3% fee):
        // input = (reserveEURS * output * 1000) / ((reserveCarbon - output) * 997)
        uint256 numerator = reserveEURS * carbonToBuy * 1000;
        uint256 denominator = (reserveCarbon - carbonToBuy) * 997;
        uint256 eursInput = (numerator / denominator) + 1;

        console.log("Spot Price (EURS per Carbon):", carbonDEX.getPrice());
        console.log("Exact EURS needed to buy 20 Credits (with slippage):", eursInput);

        // Company B performs the purchase swap
        vm.startPrank(companyB);
        eurs.approve(address(carbonDEX), eursInput);
        
        uint256 balanceBefore = carbonCredit.balanceOf(companyB);
        carbonDEX.swapEURSForCarbon(eursInput, carbonToBuy);
        uint256 balanceAfter = carbonCredit.balanceOf(companyB);
        
        assertEq(balanceAfter - balanceBefore, carbonToBuy, "Did not receive exactly 20 credits");
        console.log("Successfully bought Carbon Credits!");

        // Company B approves the carbon credits and retires them
        carbonCredit.approve(address(retirement), carbonToBuy);
        retirement.retire(carbonToBuy, "Offsetting corporate travel");

        uint256 balancePostRetire = carbonCredit.balanceOf(companyB);
        assertEq(balancePostRetire, 0, "Credits were not burned upon retirement");
        console.log("Successfully retired Carbon Credits!");
        
        vm.stopPrank();
    }
}