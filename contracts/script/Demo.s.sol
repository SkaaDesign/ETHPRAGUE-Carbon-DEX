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

        // Seed pool with 350k EURS / 5k EUA -> 70 EURS/EUA spot. Same depth as DemoLocal.
        // Faucet caps at 100k/call, so 4 calls accumulate 400k; we seed 350k and keep 50k buffer.
        if (dex.reserveEURS() == 0) {
            for (uint256 i = 0; i < 4; ++i) eurs.faucet(eurs.FAUCET_MAX());
            regulator.issueAllowance(signer, 5_000 * 10 ** 18, 2026, bytes2("IN"), bytes2("DE"), keccak256("LP-SEED"));
            eurs.approve(address(dex), 350_000 * 10 ** 18);
            credit.approve(address(dex), 5_000 * 10 ** 18);
            dex.addLiquidity(350_000 * 10 ** 18, 5_000 * 10 ** 18);
            console.log("Seeded pool: 350,000 EURS / 5,000 EUA");
        }

        // --- BEAT 1: Issuance event executes ---
        console.log("");
        console.log("=== BEAT 1 - Issuance event executes ===");
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

        // --- BEAT 2: Secondary-market trade (exact-output) ---
        console.log("");
        console.log("=== BEAT 2 - Trade (buy exactly 200 EUA) ===");

        uint256 desiredOut = 200 * 10 ** 18;
        uint256 maxIn = 20_000 * 10 ** 18; // generous cap; actual cost at 350k/5k is ~14,627

        // Fund Company B with enough EURS
        if (eurs.balanceOf(companyB) < maxIn) {
            eurs.faucet(maxIn);
            if (companyB != signer) eurs.transfer(companyB, maxIn);
        }

        if (companyB == signer) {
            eurs.approve(address(dex), maxIn);
            uint256 spent = dex.swapEURSForCreditExactOut(desiredOut, maxIn);
            console.log("Company B paid:         ", spent / 1e18, "EURS for exactly 200 EUA");
        } else {
            console.log("Company B swap deferred (multi-key flow); see DemoLocal for single-key path");
        }

        console.log("Pool reserves: EURS=", dex.reserveEURS() / 1e18, " Credit=", dex.reserveCredit() / 1e18);
        console.log("Spot price (EURS/EUA):   ", dex.getSpotPrice() / 1e18);

        // --- BEAT 3: Surrender ---
        console.log("");
        console.log("=== BEAT 3 - Surrender ===");
        if (companyB == signer && credit.balanceOf(companyB) >= desiredOut) {
            credit.approve(address(retirement), desiredOut);
            retirement.retire(desiredOut, companyB, "ipfs://sustainability-report-2026-Q4.pdf");
            console.log("Company B retired:       200 EUA (burned forever)");
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
