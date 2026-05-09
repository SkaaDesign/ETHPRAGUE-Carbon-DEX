// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/EURS.sol";
import "../src/ComplianceRegistry.sol";
import "../src/CarbonCredit.sol";
import "../src/CarbonDEX.sol";
import "../src/Regulator.sol";

contract Seed is Script {
    // Standard Anvil test addresses (Deterministic)
    address public constant DEPLOYER = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266; // Account #0
    address public constant COMPANY_A = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8; // Account #1 (Seller)
    address public constant COMPANY_B = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC; // Account #2 (Buyer)

    // Token configuration
    uint256 public constant VINTAGE_2026_ID = 2026;
    uint256 public constant INITIAL_MINT_AMOUNT = 5000 * 10**18; // 5000 carbon credits
    uint256 public constant INITIAL_EURS_CAPITAL = 1000000 * 10**18; // 1,000,000 EURS

    // Change these to match your actual deployed addresses from broadcast logs
    address public constant EURS_ADDR = 0x...;               // TODO: Replace with deployed EURS address
    address public constant REGISTRY_ADDR = 0x...;           // TODO: Replace with deployed ComplianceRegistry address
    address public constant CARBON_CREDIT_ADDR = 0x...;      // TODO: Replace with deployed CarbonCredit address
    address public constant DEX_ADDR = 0x...;                // TODO: Replace with deployed CarbonDEX address
    address public constant REGULATOR_ADDR = 0x...;          // TODO: Replace with deployed Regulator address

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        EURS eurs = EURS(EURS_ADDR);
        ComplianceRegistry registry = ComplianceRegistry(REGISTRY_ADDR);
        CarbonCredit carbonCredit = CarbonCredit(CARBON_CREDIT_ADDR);
        CarbonDEX dex = CarbonDEX(DEX_ADDR);
        Regulator regulator = Regulator(REGULATOR_ADDR);

        vm.startBroadcast(deployerPrivateKey);

        console.log("--- STARTING DEMO SEEDING ---");

        // 1. Whitelist the participants in the Compliance Registry
        console.log("1. Registering companies in ComplianceRegistry...");
        
        // Register Company A
        registry.register(
            COMPANY_A,
            ComplianceRegistry.CompanyRecord({
                kycStatus: true,
                country: "Germany",
                allowanceType: "EUA",
                isFrozen: false
            })
        );
        
        // Register Company B
        registry.register(
            COMPANY_B,
            ComplianceRegistry.CompanyRecord({
                kycStatus: true,
                country: "France",
                allowanceType: "EUA",
                isFrozen: false
            })
        );
        
        // Register the DEX contract so it is permitted to custody and trade credits
        registry.register(
            address(dex),
            ComplianceRegistry.CompanyRecord({
                kycStatus: true,
                country: "EU",
                allowanceType: "DEX_POOL",
                isFrozen: false
            })
        );

        console.log("Registered: Company A, Company B, and CarbonDEX");

        // 2. Fund Company B with mock EURS
        console.log("2. Funding Company B with mock EURS...");
        // Since EURS allows faucet-style or deployer minting:
        eurs.mint(COMPANY_B, INITIAL_EURS_CAPITAL);
        console.log("Minted 1,000,000 EURS to Company B");

        // 3. Regulator mints carbon credits to Company A (The Seller)
        console.log("3. Regulator minting Carbon Credits to Company A...");
        regulator.mint(
            COMPANY_A,
            VINTAGE_2026_ID,
            INITIAL_MINT_AMOUNT,
            "Germany",
            "Industrial",
            "M001" // Methodology
        );
        console.log("Minted 5000 Carbon Credits (ID: 2026) to Company A");

        // 4. Seeding initial Liquidity in CarbonDEX (500,000 EURS <-> 2500 Credits)
        console.log("4. Seeding AMM Pool Liquidity...");
        
        // Mint setup assets directly to Deployer to add liquidity
        eurs.mint(DEPLOYER, 500000 * 10**18);
        regulator.mint(DEPLOYER, VINTAGE_2026_ID, 2500 * 10**18, "Germany", "Industrial", "M001");

        // Approve DEX to spend Deployer's tokens
        eurs.approve(address(dex), 500000 * 10**18);
        carbonCredit.setApprovalForAll(address(dex), true);

        // Add liquidity to pool
        dex.addLiquidity(
            VINTAGE_2026_ID,
            2500 * 10**18,   // Credit Amount
            500000 * 10**18  // EURS Amount (yielding a 200 EUR/tonne spot price)
        );
        console.log("Added Liquidity: 2500 credits @ 200 EURS per credit");

        console.log("--- SEEDING COMPLETE. READY TO DEMO ---");

        vm.stopBroadcast();
    }
}