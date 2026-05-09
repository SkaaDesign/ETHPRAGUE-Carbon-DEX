// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {EURS} from "../src/EURS.sol";
import {ComplianceRegistry} from "../src/ComplianceRegistry.sol";
import {CarbonCredit} from "../src/CarbonCredit.sol";
import {Retirement} from "../src/Retirement.sol";
import {CarbonDEX} from "../src/CarbonDEX.sol";
import {Regulator} from "../src/Regulator.sol";

/// @title Demo - runs BRIEF §5 happy flow against an already-deployed stack (multi-key)
/// @notice Single-actor narrative (Company A as protagonist):
///           Beat 1: Regulator issues 1,000 EUA to Company A
///           Beat 2: Company A sells 200 surplus EUA on the DEX
///                   Company B (off-stage) buys those 200 from the pool
///           Beat 3: Company A retires the remaining 800 EUA
///         Closing: 1,000 issued, 800 retired, 200 in B's wallet (off-stage).
///
/// @dev    Required env (multi-key — realistic Sepolia setup):
///           OPERATOR_PK    — regulator OPERATOR_ROLE holder + initial LP
///           COMPANY_A_PK   — Company A signer (cement-mainz.eth)
///           COMPANY_B_PK   — Company B signer (aluminium-bratislava.eth) — off-stage actor
///
///         Run with:
///           forge script script/Demo.s.sol:Demo --rpc-url $RPC_URL --broadcast \
///             --sig "run(address,address,address,address,address,address)" \
///             $EURS $REGISTRY $CREDIT $RETIREMENT $DEX $REGULATOR
///
///         For a one-shot deploy + seed + demo on local anvil, use script/DemoLocal.s.sol.
contract Demo is Script {
    function run(
        address payable eursAddr,
        address registryAddr,
        address creditAddr,
        address retirementAddr,
        address payable dexAddr,
        address regulatorAddr
    ) external {
        EURS eurs = EURS(eursAddr);
        ComplianceRegistry registry = ComplianceRegistry(registryAddr);
        CarbonCredit credit = CarbonCredit(creditAddr);
        Retirement retirement = Retirement(retirementAddr);
        CarbonDEX dex = CarbonDEX(dexAddr);
        Regulator regulator = Regulator(regulatorAddr);

        uint256 operatorPk = vm.envUint("OPERATOR_PK");
        uint256 companyAPk = vm.envUint("COMPANY_A_PK");
        uint256 companyBPk = vm.envUint("COMPANY_B_PK");

        address operator = vm.addr(operatorPk);
        address companyA = vm.addr(companyAPk);
        address companyB = vm.addr(companyBPk);

        console.log("Operator:  ", operator);
        console.log("Company A: ", companyA);
        console.log("Company B: ", companyB);
        console.log("");

        // ─── Pre-seed (idempotent) ──────────────────────────────────────
        vm.startBroadcast(operatorPk);

        if (!registry.isVerified(companyA)) {
            regulator.registerCompany(companyA, ComplianceRegistry.AccountType.Operator, bytes2("DE"), "Cement Mainz");
            console.log("Registered Company A");
        }
        if (!registry.isVerified(companyB)) {
            regulator.registerCompany(companyB, ComplianceRegistry.AccountType.Operator, bytes2("SK"), "Aluminium Bratislava");
            console.log("Registered Company B");
        }
        if (!registry.isVerified(operator)) {
            regulator.registerCompany(operator, ComplianceRegistry.AccountType.Trader, bytes2("XX"), "Liquidity Provider");
        }

        if (dex.reserveEURS() == 0) {
            for (uint256 i = 0; i < 4; ++i) eurs.faucet(eurs.FAUCET_MAX());
            regulator.issueAllowance(operator, 5_000 * 10 ** 18, 2026, bytes2("IN"), bytes2("DE"), keccak256("LP-SEED"));
            eurs.approve(address(dex), 350_000 * 10 ** 18);
            credit.approve(address(dex), 5_000 * 10 ** 18);
            dex.addLiquidity(350_000 * 10 ** 18, 5_000 * 10 ** 18);
            console.log("Seeded pool: 350,000 EURS / 5,000 EUA");
        }

        // ─── BEAT 1: Issuance event executes ────────────────────────────
        console.log("");
        console.log("=== BEAT 1 - Issuance event executes ===");
        regulator.issueAllowance(
            companyA, 1_000 * 10 ** 18, 2026, bytes2("IN"), bytes2("DE"), keccak256("2026-FA-DE-001")
        );
        vm.stopBroadcast();
        console.log("Company A balance:      ", credit.balanceOf(companyA) / 1e18, "EUA");

        // ─── BEAT 2a: Company A sells 200 surplus ───────────────────────
        console.log("");
        console.log("=== BEAT 2 - Trade (Company A sells 200 surplus EUA) ===");
        uint256 sellAmount = 200 * 10 ** 18;

        vm.startBroadcast(companyAPk);
        credit.approve(address(dex), sellAmount);
        uint256 quotedReceive = dex.getAmountOut(sellAmount, dex.reserveCredit(), dex.reserveEURS());
        uint256 received = dex.swapCreditForEURS(sellAmount, (quotedReceive * 99) / 100);
        vm.stopBroadcast();

        console.log("Company A sold 200 EUA, received", received / 1e18, "EURS");
        console.log("Spot after A's sale:    ", dex.getSpotPrice() / 1e18, "EURS/EUA");

        // ─── BEAT 2b: Company B (off-stage) buys those 200 ──────────────
        uint256 maxBSpend = 20_000 * 10 ** 18;
        vm.startBroadcast(companyBPk);
        if (eurs.balanceOf(companyB) < maxBSpend) eurs.faucet(maxBSpend);
        eurs.approve(address(dex), maxBSpend);
        uint256 bSpent = dex.swapEURSForCreditExactOut(sellAmount, maxBSpend);
        vm.stopBroadcast();

        console.log("Company B (off-stage) bought 200 EUA, paid", bSpent / 1e18, "EURS");
        console.log("Spot after B's buy:     ", dex.getSpotPrice() / 1e18, "EURS/EUA");

        // ─── BEAT 3: Surrender (Company A retires remaining 800) ───────
        console.log("");
        console.log("=== BEAT 3 - Surrender (Company A retires 800 EUA) ===");
        uint256 retireAmount = credit.balanceOf(companyA);

        vm.startBroadcast(companyAPk);
        credit.approve(address(retirement), retireAmount);
        retirement.retire(retireAmount, companyA, "ipfs://sustainability-report-2026-Q4.pdf");
        vm.stopBroadcast();

        console.log("Company A retired:      ", retireAmount / 1e18, "EUA (burned forever)");

        // ─── CLOSING VISUAL ────────────────────────────────────────────
        console.log("");
        console.log("=== CLOSING VISUAL ===");
        console.log("Issued to Company A:     1,000 EUA");
        console.log("A sold to market:        200 EUA");
        console.log("A retired:               800 EUA (destroyed)");
        console.log("Still in circulation:    200 EUA (in B's wallet)");
        console.log("Company A balance:      ", credit.balanceOf(companyA) / 1e18, "EUA");
    }
}
