// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {EURS} from "../src/EURS.sol";
import {ComplianceRegistry} from "../src/ComplianceRegistry.sol";
import {CarbonCredit} from "../src/CarbonCredit.sol";
import {Retirement} from "../src/Retirement.sol";
import {CarbonDEX} from "../src/CarbonDEX.sol";
import {Regulator} from "../src/Regulator.sol";

/// @title Deploy — single-tx deploy + role-wiring of the Carbon DEX stack
/// @notice Run with:
///         forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --broadcast \
///             --verify --verifier sourcify
///
///         Required env: PRIVATE_KEY (deployer; receives DEFAULT_ADMIN_ROLE on each contract).
///         Optional env: REGULATOR_ADMIN (address granted Regulator's OPERATOR_ROLE; defaults
///         to the deployer if unset — handy for local anvil where deployer == operator).
///
/// @dev    Deploy order respects constructor dependencies:
///           1. EURS                 — no deps
///           2. ComplianceRegistry   — admin (deployer)
///           3. CarbonCredit         — admin (deployer) + registry
///           4. Retirement           — credit
///           5. CarbonDEX            — admin (deployer) + eurs + credit + registry
///           6. Regulator            — admin (regulatorAdmin) + credit + registry + dex
///
///         Then wires every privileged role:
///           - CarbonCredit.MINTER_ROLE      → Regulator
///           - CarbonCredit.BURNER_ROLE      → Retirement
///           - ComplianceRegistry.REGULATOR  → Regulator
///           - CarbonDEX.PAUSER_ROLE         → Regulator
///
///         Finally registers the DEX address in the registry as a Trader so it can hold
///         CarbonCredit (transfers are whitelist-gated).
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

        console.log("Deployer:        ", deployer);
        console.log("Regulator admin: ", regulatorAdmin);

        vm.startBroadcast(deployerPk);

        // 1-6 deploy
        d.eurs = new EURS();
        d.registry = new ComplianceRegistry(deployer);
        d.credit = new CarbonCredit(deployer, d.registry);
        d.retirement = new Retirement(d.credit);
        d.dex = new CarbonDEX(deployer, d.eurs, d.credit, d.registry);
        d.regulator = new Regulator(regulatorAdmin, d.credit, d.registry, d.dex);

        // Role wiring — done by deployer (current admin on each contract)
        d.credit.grantRole(d.credit.MINTER_ROLE(), address(d.regulator));
        d.credit.grantRole(d.credit.BURNER_ROLE(), address(d.retirement));
        d.registry.grantRole(d.registry.REGULATOR_ROLE(), address(d.regulator));
        d.dex.grantRole(d.dex.PAUSER_ROLE(), address(d.regulator));

        // DEX must be registered to hold CarbonCredit (transfers gated by isVerified)
        d.registry.register(
            address(d.dex),
            ComplianceRegistry.AccountType.Trader,
            bytes2("XX"),
            "Carbon DEX Pool"
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
        console.log("Next: run Demo.s.sol or pre-seed companies via Regulator.registerCompany().");
    }
}
