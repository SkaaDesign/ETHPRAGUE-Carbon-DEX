// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script} from "forge-std/Script.sol";
import {EURS} from "../src/EURS.sol";
import {ComplianceRegistry} from "../src/ComplianceRegistry.sol";
import {CarbonCredit} from "../src/CarbonCredit.sol";
import {Retirement} from "../src/Retirement.sol";
import {CarbonDEX} from "../src/CarbonDEX.sol";
import {Regulator} from "../src/Regulator.sol";

contract SeedScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddr = vm.addr(deployerPrivateKey);

        // Define your addresses
        address companyAAddr = address(0x2); // Replace with your actual addresses or env variables
        address companyBAddr = address(0x3);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Core Contracts
        EURS eurs = new EURS();
        ComplianceRegistry complianceRegistry = new ComplianceRegistry();
        CarbonCredit carbonCredit = new CarbonCredit(address(complianceRegistry));
        Retirement retirement = new Retirement(address(carbonCredit), address(complianceRegistry));
        
        CarbonDEX carbonDEX = new CarbonDEX(
            address(carbonCredit),
            address(eurs),
            address(complianceRegistry)
        );
        
        Regulator regulator = new Regulator(
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
        regulator.registerCompany(deployerAddr, "Deployer Registry", "Germany", 0);
        regulator.registerCompany(companyAAddr, "Company A GmbH", "Germany", 0);
        regulator.registerCompany(companyBAddr, "Company B Corp", "USA", 0);
        regulator.registerCompany(address(carbonDEX), "Carbon DEX Pool", "Germany", 0);

        // 4. Fund Company B with EURS
        eurs.mint(companyBAddr, 1_000_000 * 10**18);

        // 5. Mint Carbon Credits directly to Company A (2500 CARBON Credits)
        // --- FIXED: Now passes 2 arguments instead of 7 ---
        regulator.mintCarbonCredits(companyAAddr, 2500 * 10**18);
        vm.stopBroadcast();

        // 6. Transfer credits to deployer to seed the DEX
        vm.startBroadcast(companyAAddr);
        // --- FIXED: Use transfer instead of safeTransferFrom ---
        carbonCredit.transfer(deployerAddr, 2500 * 10**18);
        vm.stopBroadcast();

        // 7. Seed the DEX Pool with liquidity
        vm.startBroadcast(deployerPrivateKey);
        eurs.mint(deployerAddr, 50_000 * 10**18);
        eurs.approve(address(carbonDEX), 50_000 * 10**18);
        carbonCredit.approve(address(carbonDEX), 2500 * 10**18);
        
        carbonDEX.addLiquidity(50_000 * 10**18, 2500 * 10**18);
        vm.stopBroadcast();
    }
}