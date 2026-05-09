// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {EURS} from "../src/EURS.sol";
import {ComplianceRegistry} from "../src/ComplianceRegistry.sol";
import {CarbonCredit} from "../src/CarbonCredit.sol";
import {Retirement} from "../src/Retirement.sol";
import {CarbonDEX} from "../src/CarbonDEX.sol";
import {Regulator} from "../src/Regulator.sol";

/// @title Deploy — single-tx deploy + wiring + demo-ready seed
/// @notice Run with:
///         forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --broadcast \
///             --verify --verifier sourcify
///
///         Required env:
///           PRIVATE_KEY      — deployer; receives DEFAULT_ADMIN_ROLE on each contract,
///                              becomes Regulator OPERATOR, also seeds the LP pool.
///           COMPANY_A_PK     — Company A signer (registered as Operator, DE)
///           COMPANY_B_PK     — Company B signer (registered as Operator, SK,
///                              pre-seeded with 500 EUA so the b-side bot can mirror buys)
///
/// @dev    Phase 1 — deploy + wire roles + register DEX
///         Phase 2 — register companies (deployer + A + B as verified entities)
///         Phase 3 — seed pool (350k EURS / 5k EUA → €70 spot) + pre-seed B with 500 EUA
///
///         After this script, the chain is "demo ready": frontend can connect, regulator
///         can issue, A can trade, B-side bot can mirror in either direction. Single
///         command produces a fully populated state.
contract Deploy is Script {
    struct Deployed {
        EURS eurs;
        ComplianceRegistry registry;
        CarbonCredit credit;
        Retirement retirement;
        CarbonDEX dex;
        Regulator regulator;
    }

    function run() external returns (Deployed memory d) {
        uint256 deployerPk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPk);
        address regulatorAdmin = vm.envOr("REGULATOR_ADMIN", deployer);
        address companyA = vm.addr(vm.envUint("COMPANY_A_PK"));
        address companyB = vm.addr(vm.envUint("COMPANY_B_PK"));

        console.log("Deployer:        ", deployer);
        console.log("Regulator admin: ", regulatorAdmin);
        console.log("Company A:       ", companyA);
        console.log("Company B:       ", companyB);

        // ─── Phase 1: deploy + wire roles ──────────────────────────────────
        vm.startBroadcast(deployerPk);

        d.eurs = new EURS();
        d.registry = new ComplianceRegistry(deployer);
        d.credit = new CarbonCredit(deployer, d.registry);
        d.retirement = new Retirement(d.credit);
        d.dex = new CarbonDEX(deployer, d.eurs, d.credit, d.registry);
        d.regulator = new Regulator(regulatorAdmin, d.credit, d.registry, d.dex);

        d.credit.grantRole(d.credit.MINTER_ROLE(), address(d.regulator));
        d.credit.grantRole(d.credit.BURNER_ROLE(), address(d.retirement));
        d.registry.grantRole(d.registry.REGULATOR_ROLE(), address(d.regulator));
        d.dex.grantRole(d.dex.PAUSER_ROLE(), address(d.regulator));

        // ─── Phase 2: register entities ────────────────────────────────────
        // DEX must be registered to hold CarbonCredit (transfers gated by isVerified).
        d.registry.register(
            address(d.dex),
            ComplianceRegistry.AccountType.Trader,
            bytes2("XX"),
            "Carbon DEX Pool"
        );
        // Deployer = LP, registered as Trader so it can deposit into the pool.
        d.regulator.registerCompany(
            deployer, ComplianceRegistry.AccountType.Trader, bytes2("XX"), "Liquidity Provider"
        );
        // Company A = cement-mainz (DE), the on-screen protagonist.
        d.regulator.registerCompany(
            companyA, ComplianceRegistry.AccountType.Operator, bytes2("DE"), "Cement Mainz"
        );
        // Company B = aluminium-bratislava (SK), off-stage counterparty for the bot.
        d.regulator.registerCompany(
            companyB, ComplianceRegistry.AccountType.Operator, bytes2("SK"), "Aluminium Bratislava"
        );

        // ─── Phase 3: seed pool + pre-seed B inventory ─────────────────────
        // Faucet 400k EURS to deployer (4 calls × 100k cap), seed pool with 350k.
        for (uint256 i = 0; i < 4; ++i) d.eurs.faucet(d.eurs.FAUCET_MAX());
        d.regulator.issueAllowance(
            deployer, 5_000 * 10 ** 18, 2026, bytes2("IN"), bytes2("DE"), keccak256("LP-SEED")
        );
        d.eurs.approve(address(d.dex), 350_000 * 10 ** 18);
        d.credit.approve(address(d.dex), 5_000 * 10 ** 18);
        d.dex.addLiquidity(350_000 * 10 ** 18, 5_000 * 10 ** 18);

        // Pre-seed Company B with 500 EUA inventory so the b-side bot can mirror
        // both directions (B can sell when A buys; B can buy when A sells).
        d.regulator.issueAllowance(
            companyB, 500 * 10 ** 18, 2026, bytes2("IN"), bytes2("SK"), keccak256("B-INVENTORY")
        );

        vm.stopBroadcast();

        console.log("");
        console.log("=== Deployed addresses ===");
        console.log("EURS:               ", address(d.eurs));
        console.log("ComplianceRegistry: ", address(d.registry));
        console.log("CarbonCredit:       ", address(d.credit));
        console.log("Retirement:         ", address(d.retirement));
        console.log("CarbonDEX:          ", address(d.dex));
        console.log("Regulator:          ", address(d.regulator));
        console.log("");
        console.log("=== Demo-ready state ===");
        console.log("Pool:                350,000 EURS / 5,000 EUA  (spot:", d.dex.getSpotPrice() / 1e18, "EURS/EUA)");
        console.log("Deployer LP shares:  ", d.dex.balanceOf(deployer) / 1e18, "cdLP");
        console.log("Company B inventory:  500 EUA (pre-seed for bot to mirror buy direction)");
        console.log("");
        console.log("Next: start scripts/run-b-bot.sh; open the frontend; click stuff.");
    }
}
