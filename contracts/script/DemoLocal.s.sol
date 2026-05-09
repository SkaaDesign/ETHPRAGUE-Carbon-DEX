// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {EURS} from "../src/EURS.sol";
import {ComplianceRegistry} from "../src/ComplianceRegistry.sol";
import {CarbonCredit} from "../src/CarbonCredit.sol";
import {Retirement} from "../src/Retirement.sol";
import {CarbonDEX} from "../src/CarbonDEX.sol";
import {Regulator} from "../src/Regulator.sol";

/// @title DemoLocal — one-shot deploy + seed + happy-flow on local anvil
/// @notice The script we'd run during a rehearsal or to confirm the system works end-to-end.
///         No env vars required for the basic anvil run (uses anvil's default funded keys).
///         Run with:  forge script script/DemoLocal.s.sol:DemoLocal -vv
///         Or against a live anvil: forge script ... --rpc-url http://127.0.0.1:8545 --broadcast
contract DemoLocal is Script {
    // Anvil default funded keys (account 0, 1, 2)
    uint256 constant DEPLOYER_PK = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    uint256 constant COMPANY_A_PK = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;
    uint256 constant COMPANY_B_PK = 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a;

    function run() external {
        address deployer = vm.addr(DEPLOYER_PK);
        address companyA = vm.addr(COMPANY_A_PK);
        address companyB = vm.addr(COMPANY_B_PK);

        console.log("Deployer:  ", deployer);
        console.log("Company A: ", companyA);
        console.log("Company B: ", companyB);

        // ─── DEPLOY ────────────────────────────────────────────────────
        vm.startBroadcast(DEPLOYER_PK);
        EURS eurs = new EURS();
        ComplianceRegistry registry = new ComplianceRegistry(deployer);
        CarbonCredit credit = new CarbonCredit(deployer, registry);
        Retirement retirement = new Retirement(credit);
        CarbonDEX dex = new CarbonDEX(deployer, eurs, credit, registry);
        Regulator regulator = new Regulator(deployer, credit, registry, dex);

        credit.grantRole(credit.MINTER_ROLE(), address(regulator));
        credit.grantRole(credit.BURNER_ROLE(), address(retirement));
        registry.grantRole(registry.REGULATOR_ROLE(), address(regulator));
        dex.grantRole(dex.PAUSER_ROLE(), address(regulator));

        registry.register(address(dex), ComplianceRegistry.AccountType.Trader, bytes2("XX"), "Carbon DEX Pool");
        regulator.registerCompany(deployer, ComplianceRegistry.AccountType.Trader, bytes2("XX"), "Liquidity Provider");
        regulator.registerCompany(companyA, ComplianceRegistry.AccountType.Operator, bytes2("DE"), "Cement Mainz");
        regulator.registerCompany(companyB, ComplianceRegistry.AccountType.Operator, bytes2("SK"), "Aluminium Bratislava");

        // Seed pool: 350k EURS / 5k EUA → €70/EUA spot, deep enough that a 200-EUA buy
        // moves price < 5%. Real EU ETS secondary market is far deeper still (~€100B/yr
        // volume, MSR-managed surplus 400-833M EUAs); this is "small but realistic" demo
        // depth. Faucet caps at 100k/call so we batch-mint EURS via 4 faucet calls.
        for (uint256 i = 0; i < 4; ++i) eurs.faucet(eurs.FAUCET_MAX());
        // After 4 calls: 400k EURS — we'll seed 350k and keep 50k as deployer buffer.
        regulator.issueAllowance(deployer, 5_000 * 10 ** 18, 2026, bytes2("IN"), bytes2("DE"), keccak256("LP-SEED"));
        eurs.approve(address(dex), 350_000 * 10 ** 18);
        credit.approve(address(dex), 5_000 * 10 ** 18);
        dex.addLiquidity(350_000 * 10 ** 18, 5_000 * 10 ** 18);
        vm.stopBroadcast();

        console.log("");
        console.log("=== Stack deployed + pool seeded ===");
        console.log("EURS:      ", address(eurs));
        console.log("Registry:  ", address(registry));
        console.log("Credit:    ", address(credit));
        console.log("Retirement:", address(retirement));
        console.log("DEX:       ", address(dex));
        console.log("Regulator: ", address(regulator));
        console.log("Pool:       350,000 EURS / 5,000 EUA  (spot:", dex.getSpotPrice() / 1e18, "EURS/EUA)");

        // ─── BEAT 1: Issuance event executes ───────────────────────────
        console.log("");
        console.log("=== BEAT 1 - Issuance event executes ===");
        vm.startBroadcast(DEPLOYER_PK); // operator (deployer holds OPERATOR_ROLE)
        regulator.issueAllowance(companyA, 1_000 * 10 ** 18, 2026, bytes2("IN"), bytes2("DE"), keccak256("2026-FA-DE-001"));
        vm.stopBroadcast();
        console.log("Company A balance:      ", credit.balanceOf(companyA) / 1e18, "EUA");
        console.log("Total supply (incl pool):", credit.totalSupply() / 1e18, "EUA");

        // ─── BEAT 2: Secondary-market trade ────────────────────────────
        console.log("");
        console.log("=== BEAT 2 - Trade ===");
        // 14,627 EURS yields ~200 EUA against the 350k/5k pool (0.3% fee, V2 math).
        // We send a small buffer (14,650) so any tiny rounding lands ≥ 200.
        uint256 amountIn = 14_650 * 10 ** 18;

        vm.startBroadcast(COMPANY_B_PK);
        eurs.faucet(amountIn);
        eurs.approve(address(dex), amountIn);
        uint256 quoted = dex.getAmountOut(amountIn, dex.reserveEURS(), dex.reserveCredit());
        uint256 received = dex.swapEURSForCredit(amountIn, (quoted * 99) / 100);
        vm.stopBroadcast();

        console.log("Company B paid:         ", amountIn / 1e18, "EURS");
        console.log("Company B received:     ", received / 1e18, "EUA");
        console.log("Spot post-trade:         ", dex.getSpotPrice() / 1e18, "EURS/EUA");

        // ─── BEAT 3: Surrender ─────────────────────────────────────────
        console.log("");
        console.log("=== BEAT 3 - Surrender ===");
        vm.startBroadcast(COMPANY_B_PK);
        credit.approve(address(retirement), received);
        retirement.retire(received, companyB, "ipfs://sustainability-report-2026-Q4.pdf");
        vm.stopBroadcast();

        console.log("Company B retired:      ", received / 1e18, "EUA");
        console.log("Company B balance:      ", credit.balanceOf(companyB) / 1e18, "EUA");

        // ─── CLOSING VISUAL ────────────────────────────────────────────
        console.log("");
        console.log("=== CLOSING VISUAL (the cap-and-trade proof) ===");
        // Allocations to companyA only (pool seed is operator-side, not allocation)
        console.log("Issued to Company A:     1,000 EUA");
        console.log("Retired by Company B:   ", received / 1e18, "EUA  (burned forever)");
        console.log("Company A still holds:  ", credit.balanceOf(companyA) / 1e18, "EUA");
        console.log("On-chain supply:        ", credit.totalSupply() / 1e18, "EUA total");
    }
}
