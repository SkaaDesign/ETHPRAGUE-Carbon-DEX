// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/CarbonCredit.sol";
import "../src/EURS.sol";
import "../src/ComplianceRegistry.sol";
import "../src/CarbonDEX.sol";
import "../src/Regulator.sol";

contract Seed is Script {
    function run() external {
        // --- PRIVATE KEYS ---
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        uint256 companyAPrivateKey = vm.envUint("COMPANY_A_PRIVATE_KEY");

        // --- READ ADDRESSES DYNAMICALLY FROM .ENV ---
        address eursAddr = vm.envAddress("EURS_ADDRESS");
        address complianceAddr = vm.envAddress("COMPLIANCE_REGISTRY_ADDRESS");
        address carbonCreditAddr = vm.envAddress("CARBON_CREDIT_ADDRESS");
        address dexAddr = vm.envAddress("CARBON_DEX_ADDRESS");
        address regulatorAddr = vm.envAddress("REGULATOR_ADDRESS");

        // --- INSTANTIATE CONTRACTS ---
        EURS eurs = EURS(eursAddr);
        ComplianceRegistry compliance = ComplianceRegistry(complianceAddr);
        CarbonCredit carbonCredit = CarbonCredit(carbonCreditAddr);
        CarbonDEX dex = CarbonDEX(dexAddr);
        Regulator regulator = Regulator(regulatorAddr);

        // Derive address from private key for seeding transfers
        address deployerAddr = vm.addr(deployerPrivateKey);
        address companyAAddr = vm.addr(companyAPrivateKey);
        address companyBAddr = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC; // Company B from your logs

        // ==========================================
        // STEP 1-4: DEPLOYER / REGULATOR TRANSACTIONS
        // ==========================================
        vm.startBroadcast(deployerPrivateKey);

        console.log("--- STARTING DEMO SEEDING ---");
        console.log("1. Assigning control... [SKIPPED - Already Set]");

        console.log("2. Registering companies via Regulator...");
        regulator.registerCompany(companyAAddr, "Company A GmbH", "Germany", 0);
        regulator.registerCompany(companyBAddr, "Company B Air", "France", 1);
        regulator.registerCompany(address(dex), "CarbonDEX AMM Pool", "EU", 0);
        regulator.registerCompany(deployerAddr, "Deployer Account", "EU", 0);

        console.log("3. Funding Company B with mock EURS...");
        eurs.mint(companyBAddr, 1000000 ether);

        console.log("4. Minting Carbon Credits to Company A...");
        regulator.mintCarbonCredits(
            companyAAddr, 
            7500 ether, 
            2026, 
            "Industrial", 
            "Germany", 
            1, 
            "ipfs://vintage2026-metadata"
        );

        vm.stopBroadcast();

        // ==========================================
        // STEP 5: COMPANY A TRANSACTIONS
        // ==========================================
        vm.startBroadcast(companyAPrivateKey);

        console.log("5. Transferring 2500 credits from Company A to Deployer for seeding...");
        carbonCredit.safeTransferFrom(companyAAddr, deployerAddr, 1, 2500 ether, "");

        vm.stopBroadcast();

        // ==========================================
        // STEP 6: DEPLOYER SEEDING DEX LIQUIDITY
        // ==========================================
        vm.startBroadcast(deployerPrivateKey);

        console.log("6. Minting EURS to Deployer and seeding liquidity...");
        eurs.mint(deployerAddr, 500000 ether);
        eurs.approve(address(dex), 500000 ether);
        carbonCredit.setApprovalForAll(address(dex), true);

        // Add 500,000 EURS and 2,500 Carbon Credits to the pool
        dex.addLiquidity(500000 ether, 2500 ether);

        console.log("=== DEMO SEEDING COMPLETE ===");
        vm.stopBroadcast();
    }
}