// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ComplianceRegistry} from "../src/ComplianceRegistry.sol";
import {CarbonCredit} from "../src/CarbonCredit.sol";
import {EURS} from "../src/EURS.sol";
import {CarbonDEX} from "../src/CarbonDEX.sol";
import {Regulator} from "../src/Regulator.sol";

contract RegulatorTest is Test {
    ComplianceRegistry internal registry;
    CarbonCredit internal credit;
    EURS internal eurs;
    CarbonDEX internal dex;
    Regulator internal regulator;

    address internal admin = makeAddr("admin");           // deployer + system admin on each contract
    address internal operator = makeAddr("operator");     // EU ETS Authority operator (Regulator's OPERATOR_ROLE)
    address internal companyA = makeAddr("companyA");
    address internal stranger = makeAddr("stranger");

    function setUp() public {
        // Deploy stack
        registry = new ComplianceRegistry(admin);
        credit = new CarbonCredit(admin, registry);
        eurs = new EURS();
        dex = new CarbonDEX(admin, eurs, credit, registry);
        regulator = new Regulator(operator, credit, registry, dex);

        // Wire privileges: Regulator contract holds the privileged roles on the other contracts
        vm.startPrank(admin);
        credit.grantRole(credit.MINTER_ROLE(), address(regulator));
        registry.grantRole(registry.REGULATOR_ROLE(), address(regulator));
        dex.grantRole(dex.PAUSER_ROLE(), address(regulator));
        vm.stopPrank();
    }

    // ─── issueAllowance ─────────────────────────────────────────────────

    function test_IssueAllowance_RegistersCompanyFirstThenMints() public {
        vm.prank(operator);
        regulator.registerCompany(companyA, ComplianceRegistry.AccountType.Operator, bytes2("DE"), "Cement Mainz");

        vm.prank(operator);
        regulator.issueAllowance(companyA, 1_000 * 10 ** 18, 2026, bytes2("IN"), bytes2("DE"), keccak256("2026-FA-DE-001"));

        assertEq(credit.balanceOf(companyA), 1_000 * 10 ** 18);
    }

    function test_IssueAllowance_RevertsForNonOperator() public {
        vm.prank(operator);
        regulator.registerCompany(companyA, ComplianceRegistry.AccountType.Operator, bytes2("DE"), "Cement Mainz");

        vm.prank(stranger);
        vm.expectRevert();
        regulator.issueAllowance(companyA, 1_000 * 10 ** 18, 2026, bytes2("IN"), bytes2("DE"), keccak256("ref"));
    }

    function test_IssueAllowance_EmitsRegulatoryAction() public {
        vm.prank(operator);
        regulator.registerCompany(companyA, ComplianceRegistry.AccountType.Operator, bytes2("DE"), "Cement Mainz");

        vm.expectEmit(true, true, true, false, address(regulator));
        emit Regulator.RegulatoryAction(Regulator.ActionType.Issue, companyA, operator, "", block.timestamp);

        vm.prank(operator);
        regulator.issueAllowance(companyA, 1_000 * 10 ** 18, 2026, bytes2("IN"), bytes2("DE"), keccak256("ref"));
    }

    // ─── registerCompany / freezeCompany / unfreezeCompany ──────────────

    function test_RegisterCompany_Succeeds() public {
        vm.prank(operator);
        regulator.registerCompany(companyA, ComplianceRegistry.AccountType.Operator, bytes2("DE"), "Cement Mainz");

        assertTrue(registry.isVerified(companyA));
    }

    function test_FreezeCompany_Succeeds() public {
        vm.prank(operator);
        regulator.registerCompany(companyA, ComplianceRegistry.AccountType.Operator, bytes2("DE"), "Cement Mainz");

        vm.prank(operator);
        regulator.freezeCompany(companyA, "sanctions exposure");

        assertFalse(registry.isVerified(companyA));
    }

    function test_UnfreezeCompany_Succeeds() public {
        vm.prank(operator);
        regulator.registerCompany(companyA, ComplianceRegistry.AccountType.Operator, bytes2("DE"), "Cement Mainz");
        vm.prank(operator);
        regulator.freezeCompany(companyA, "investigation");

        vm.prank(operator);
        regulator.unfreezeCompany(companyA);

        assertTrue(registry.isVerified(companyA));
    }

    // ─── pauseDEX / unpauseDEX ──────────────────────────────────────────

    function test_PauseDEX_Succeeds() public {
        vm.prank(operator);
        regulator.pauseDEX("market emergency");

        assertTrue(dex.paused());
    }

    function test_UnpauseDEX_Succeeds() public {
        vm.prank(operator);
        regulator.pauseDEX("emergency");

        vm.prank(operator);
        regulator.unpauseDEX();

        assertFalse(dex.paused());
    }

    function test_PauseDEX_RevertsForNonOperator() public {
        vm.prank(stranger);
        vm.expectRevert();
        regulator.pauseDEX("attempted");
    }

    // ─── End-to-end happy flow (mirrors BRIEF §5) ───────────────────────

    function test_HappyFlow_IssueTransferRetire() public {
        // Beat 1 — issuance event
        vm.prank(operator);
        regulator.registerCompany(companyA, ComplianceRegistry.AccountType.Operator, bytes2("DE"), "Cement Mainz");

        vm.prank(operator);
        regulator.issueAllowance(companyA, 1_000 * 10 ** 18, 2026, bytes2("IN"), bytes2("DE"), keccak256("2026-FA-DE-001"));

        assertEq(credit.balanceOf(companyA), 1_000 * 10 ** 18);
        assertEq(credit.totalSupply(), 1_000 * 10 ** 18);
    }
}
