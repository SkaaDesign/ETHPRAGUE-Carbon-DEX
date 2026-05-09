// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {EURS} from "../src/EURS.sol";
import {ComplianceRegistry} from "../src/ComplianceRegistry.sol";
import {CarbonCredit} from "../src/CarbonCredit.sol";
import {Retirement} from "../src/Retirement.sol";
import {CarbonDEX} from "../src/CarbonDEX.sol";
import {Regulator} from "../src/Regulator.sol";

/// @title Demo — runs the BRIEF §5 happy flow against an already-deployed stack
/// @notice Three beats from BRIEF §5:
///           1. Issuance event executes — Company A receives 1,000 EUAs
///           2. Trade               — Company B swaps EURS for ~200 EUAs on the DEX
///           3. Surrender           — Company B retires the 200 EUAs (burned forever)
///         Closing visual: total supply 1,000 → 800.
///
/// @dev    Run with:
///         forge script script/Demo.s.sol:Demo --rpc-url $RPC_URL --broadcast \
///             --sig "run(address,address,address,address,address,address)" \
///             $EURS $REGISTRY $CREDIT $RETIREMENT $DEX $REGULATOR
///
///         Required env: PRIVATE_KEY (must be the regulator OPERATOR + companyA + companyB
///         signer for the demo — for local anvil we use anvil's default funded keys; for
///         Sepolia we use three separate keys, see Demo.s.sol:DemoMultiKey alt).
///
///         For a one-shot run on local anvil, use script/DemoLocal.s.sol which deploys +
///         seeds + runs the flow in a single invocation.
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

        // For single-key demo runs (anvil), one signer plays all roles
        uint256 signerPk = vm.envUint("PRIVATE_KEY");
        address signer = vm.addr(signerPk);
        address companyA = vm.envOr("COMPANY_A", signer);
        address companyB = vm.envOr("COMPANY_B", signer);

        console.log("=== Demo signer:", signer);
        console.log("=== Company A: ", companyA);
        console.log("=== Company B: ", companyB);
        console.log("");

        vm.startBroadcast(signerPk);

        // ─── Pre-seed: register companies, seed liquidity ──────────────
        // (In production these would be separate prior steps; for demo we batch.)

        if (!registry.isVerified(companyA)) {
            regulator.registerCompany(companyA, ComplianceRegistry.AccountType.Operator, bytes2("DE"), "Cement Mainz");
            console.log("Registered Company A (Cement Mainz, DE)");
        }
        if (!registry.isVerified(companyB) && companyB != companyA) {
            regulator.registerCompany(companyB, ComplianceRegistry.AccountType.Operator, bytes2("SK"), "Aluminium Bratislava");
            console.log("Registered Company B (Aluminium Bratislava, SK)");
        }

        // Seed pool with 70k EURS / 1k EUA → ~€70/EUA, only if pool empty
        if (dex.reserveEURS() == 0) {
            uint256 seedEURS = 70_000 * 10 ** 18;
            uint256 seedCredit = 1_000 * 10 ** 18;

            // Mint seeding inventory to signer (signer is also LP for the demo)
            eurs.faucet(seedEURS);
            regulator.issueAllowance(signer, seedCredit, 2026, bytes2("IN"), bytes2("DE"), keccak256("LP-SEED"));

            eurs.approve(address(dex), seedEURS);
            credit.approve(address(dex), seedCredit);
            dex.addLiquidity(seedEURS, seedCredit);
            console.log("Seeded pool:        70,000 EURS / 1,000 EUA");
        }

        // ─── BEAT 1: Issuance event executes ───────────────────────────
        console.log("");
        console.log("=== BEAT 1 — Issuance event executes ===");
        regulator.issueAllowance(
            companyA,
            1_000 * 10 ** 18,
            2026,
            bytes2("IN"),
            bytes2("DE"),
            keccak256("2026-FA-DE-001")
        );
        console.log("Company A balance:      ", credit.balanceOf(companyA) / 1e18, "EUA");
        console.log("Total supply:           ", credit.totalSupply() / 1e18, "EUA");

        // ─── BEAT 2: Secondary-market trade ────────────────────────────
        console.log("");
        console.log("=== BEAT 2 — Trade ===");

        // Fund Company B with EURS (in production they'd already have it)
        if (eurs.balanceOf(companyB) < 14_500 * 10 ** 18) {
            eurs.faucet(14_500 * 10 ** 18);
            if (companyB != signer) eurs.transfer(companyB, 14_500 * 10 ** 18);
        }

        uint256 amountIn = 14_028 * 10 ** 18; // ~14k EURS for ~200 EUA at €70 + fee
        uint256 expectedOut = dex.getAmountOut(amountIn, dex.reserveEURS(), dex.reserveCredit());

        // Company B approves + swaps
        if (companyB == signer) {
            eurs.approve(address(dex), amountIn);
            uint256 actualOut = dex.swapEURSForCredit(amountIn, (expectedOut * 99) / 100);
            console.log("Company B swapped       ", amountIn / 1e18, "EURS for ~", actualOut / 1e18, "EUA");
        } else {
            console.log("Company B swap deferred (multi-key flow); see DemoLocal for single-key path");
        }

        console.log("Pool reserves:           EURS=", dex.reserveEURS() / 1e18, " Credit=", dex.reserveCredit() / 1e18);
        console.log("Spot price (EURS/EUA):   ", dex.getSpotPrice() / 1e18);

        // ─── BEAT 3: Surrender ─────────────────────────────────────────
        console.log("");
        console.log("=== BEAT 3 — Surrender ===");
        if (companyB == signer && credit.balanceOf(companyB) >= 200 * 10 ** 18) {
            credit.approve(address(retirement), type(uint256).max);
            retirement.retire(200 * 10 ** 18, companyB, "ipfs://sustainability-report-2026-Q4.pdf");
            console.log("Company B retired:       200 EUA");
        }

        console.log("");
        console.log("=== CLOSING VISUAL ===");
        uint256 issued = credit.totalSupply() + 200 * 10 ** 18; // includes the burned 200
        console.log("Issued:                 ", issued / 1e18, "EUA (this run)");
        console.log("Retired:                 200 EUA");
        console.log("Total supply (post-burn):", credit.totalSupply() / 1e18, "EUA");

        vm.stopBroadcast();
    }
}
