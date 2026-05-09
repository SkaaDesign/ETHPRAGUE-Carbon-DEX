// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {ComplianceRegistry} from "../src/ComplianceRegistry.sol";

contract ComplianceRegistryTest is Test {
    ComplianceRegistry internal registry;
    address internal regulator = makeAddr("regulator");
    address internal companyA = makeAddr("companyA");
    address internal companyB = makeAddr("companyB");
    address internal stranger = makeAddr("stranger");

    function setUp() public {
        registry = new ComplianceRegistry(regulator);
    }

    function _register(address who, ComplianceRegistry.AccountType acc, bytes2 country, string memory name) internal {
        vm.prank(regulator);
        registry.register(who, acc, country, name);
    }

    // ─── Register ───────────────────────────────────────────────────────

    function test_Register_Succeeds() public {
        _register(companyA, ComplianceRegistry.AccountType.Operator, bytes2("DE"), "Cement Mainz");

        ComplianceRegistry.CompanyRecord memory rec = registry.recordOf(companyA);
        assertTrue(rec.registered);
        assertFalse(rec.frozen);
        assertEq(uint8(rec.account), uint8(ComplianceRegistry.AccountType.Operator));
        assertEq(rec.country, bytes2("DE"));
        assertEq(rec.name, "Cement Mainz");
    }

    function test_Register_RevertsForNonRegulator() public {
        vm.prank(stranger);
        vm.expectRevert();
        registry.register(companyA, ComplianceRegistry.AccountType.Operator, bytes2("DE"), "Cement Mainz");
    }

    function test_Register_RevertsIfAlreadyRegistered() public {
        _register(companyA, ComplianceRegistry.AccountType.Operator, bytes2("DE"), "Cement Mainz");

        vm.prank(regulator);
        vm.expectRevert(abi.encodeWithSelector(ComplianceRegistry.CR_AlreadyRegistered.selector, companyA));
        registry.register(companyA, ComplianceRegistry.AccountType.Trader, bytes2("XX"), "Other");
    }

    // ─── Freeze / unfreeze ─────────────────────────────────────────────

    function test_Freeze_Succeeds() public {
        _register(companyA, ComplianceRegistry.AccountType.Operator, bytes2("DE"), "Cement Mainz");

        vm.prank(regulator);
        registry.freeze(companyA, "Sanctions exposure");

        assertTrue(registry.recordOf(companyA).frozen);
    }

    function test_Freeze_RevertsForUnregistered() public {
        vm.prank(regulator);
        vm.expectRevert(abi.encodeWithSelector(ComplianceRegistry.CR_NotRegistered.selector, companyA));
        registry.freeze(companyA, "test");
    }

    function test_Freeze_RevertsIfAlreadyFrozen() public {
        _register(companyA, ComplianceRegistry.AccountType.Operator, bytes2("DE"), "Cement Mainz");
        vm.prank(regulator);
        registry.freeze(companyA, "first");

        vm.prank(regulator);
        vm.expectRevert(abi.encodeWithSelector(ComplianceRegistry.CR_AlreadyFrozen.selector, companyA));
        registry.freeze(companyA, "second");
    }

    function test_Unfreeze_Succeeds() public {
        _register(companyA, ComplianceRegistry.AccountType.Operator, bytes2("DE"), "Cement Mainz");
        vm.prank(regulator);
        registry.freeze(companyA, "investigation");

        vm.prank(regulator);
        registry.unfreeze(companyA);

        assertFalse(registry.recordOf(companyA).frozen);
    }

    function test_Unfreeze_RevertsIfNotFrozen() public {
        _register(companyA, ComplianceRegistry.AccountType.Operator, bytes2("DE"), "Cement Mainz");
        vm.prank(regulator);
        vm.expectRevert(abi.encodeWithSelector(ComplianceRegistry.CR_NotFrozen.selector, companyA));
        registry.unfreeze(companyA);
    }

    // ─── Audit ─────────────────────────────────────────────────────────

    function test_Audit_UpdatesLastAuditAtAndEmits() public {
        _register(companyA, ComplianceRegistry.AccountType.Operator, bytes2("DE"), "Cement Mainz");
        uint64 registeredAt = registry.recordOf(companyA).lastAuditAt;

        vm.warp(block.timestamp + 30 days);

        vm.expectEmit(true, false, false, true, address(registry));
        emit ComplianceRegistry.CompanyAudited(companyA, "Q1 2026 routine review");

        vm.prank(regulator);
        registry.audit(companyA, "Q1 2026 routine review");

        ComplianceRegistry.CompanyRecord memory rec = registry.recordOf(companyA);
        assertGt(rec.lastAuditAt, registeredAt);
        assertEq(rec.lastAuditAt, uint64(block.timestamp));
    }

    function test_Audit_RevertsForUnregistered() public {
        vm.prank(regulator);
        vm.expectRevert(abi.encodeWithSelector(ComplianceRegistry.CR_NotRegistered.selector, companyA));
        registry.audit(companyA, "ad-hoc");
    }

    function test_Audit_RevertsForNonRegulator() public {
        _register(companyA, ComplianceRegistry.AccountType.Operator, bytes2("DE"), "Cement Mainz");
        vm.prank(stranger);
        vm.expectRevert();
        registry.audit(companyA, "attempted");
    }

    // ─── Timestamps initialised at register ─────────────────────────────

    function test_Register_SetsTimestampsToNow() public {
        vm.warp(1_700_000_000);
        _register(companyA, ComplianceRegistry.AccountType.Operator, bytes2("DE"), "Cement Mainz");
        ComplianceRegistry.CompanyRecord memory rec = registry.recordOf(companyA);
        assertEq(rec.registeredAt, 1_700_000_000);
        assertEq(rec.lastAuditAt, 1_700_000_000);
    }

    // ─── isVerified ────────────────────────────────────────────────────

    function test_IsVerified_TrueForRegisteredNotFrozen() public {
        _register(companyA, ComplianceRegistry.AccountType.Operator, bytes2("DE"), "Cement Mainz");
        assertTrue(registry.isVerified(companyA));
    }

    function test_IsVerified_FalseForUnregistered() public view {
        assertFalse(registry.isVerified(stranger));
    }

    function test_IsVerified_FalseForFrozen() public {
        _register(companyA, ComplianceRegistry.AccountType.Operator, bytes2("DE"), "Cement Mainz");
        vm.prank(regulator);
        registry.freeze(companyA, "test");
        assertFalse(registry.isVerified(companyA));
    }

    function test_IsVerified_TrueAfterUnfreeze() public {
        _register(companyA, ComplianceRegistry.AccountType.Operator, bytes2("DE"), "Cement Mainz");
        vm.prank(regulator);
        registry.freeze(companyA, "test");
        vm.prank(regulator);
        registry.unfreeze(companyA);
        assertTrue(registry.isVerified(companyA));
    }
}
