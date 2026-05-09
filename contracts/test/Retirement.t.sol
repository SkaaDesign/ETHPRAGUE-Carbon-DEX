// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ComplianceRegistry} from "../src/ComplianceRegistry.sol";
import {CarbonCredit} from "../src/CarbonCredit.sol";
import {Retirement} from "../src/Retirement.sol";

contract RetirementTest is Test {
    ComplianceRegistry internal registry;
    CarbonCredit internal credit;
    Retirement internal retirement;

    address internal admin = makeAddr("admin");
    address internal minter = makeAddr("minter");
    address internal companyA = makeAddr("companyA");

    uint16 internal constant VINTAGE = 2026;
    bytes2 internal constant SECTOR = bytes2("IN");
    bytes2 internal constant ORIGIN = bytes2("DE");
    bytes32 internal constant ISSUANCE_REF = keccak256("2026-FA-DE-001");

    function setUp() public {
        registry = new ComplianceRegistry(admin);
        credit = new CarbonCredit(admin, registry);
        retirement = new Retirement(credit);

        vm.startPrank(admin);
        registry.register(companyA, ComplianceRegistry.AccountType.Operator, ORIGIN, "Cement Mainz");
        credit.grantRole(credit.MINTER_ROLE(), minter);
        credit.grantRole(credit.BURNER_ROLE(), address(retirement));
        vm.stopPrank();

        vm.prank(minter);
        credit.mint(companyA, 1_000 * 10 ** 18, VINTAGE, SECTOR, ORIGIN, ISSUANCE_REF);
    }

    // ─── Retire ─────────────────────────────────────────────────────────

    /// @dev Helper: companyA approves Retirement to burn `amount` and calls retire().
    function _approveAndRetire(uint256 amount, address beneficiary, string memory reasonURI) internal {
        vm.prank(companyA);
        credit.approve(address(retirement), amount);
        vm.prank(companyA);
        retirement.retire(amount, beneficiary, reasonURI);
    }

    function test_Retire_Succeeds() public {
        _approveAndRetire(200 * 10 ** 18, companyA, "ipfs://report-2026.pdf");

        assertEq(credit.balanceOf(companyA), 800 * 10 ** 18);
        assertEq(credit.totalSupply(), 800 * 10 ** 18);
    }

    function test_Retire_EmitsEvent() public {
        vm.prank(companyA);
        credit.approve(address(retirement), 200 * 10 ** 18);

        vm.expectEmit(true, true, false, true, address(retirement));
        emit Retirement.Retired(companyA, 200 * 10 ** 18, companyA, "ipfs://report-2026.pdf", block.timestamp);

        vm.prank(companyA);
        retirement.retire(200 * 10 ** 18, companyA, "ipfs://report-2026.pdf");
    }

    function test_Retire_RevertsForZeroAmount() public {
        vm.prank(companyA);
        vm.expectRevert(Retirement.RT_AmountZero.selector);
        retirement.retire(0, companyA, "ipfs://report.pdf");
    }

    function test_Retire_RevertsIfNotEnoughBalance() public {
        vm.prank(companyA);
        credit.approve(address(retirement), 2_000 * 10 ** 18);

        vm.prank(companyA);
        vm.expectRevert(); // OZ ERC20InsufficientBalance
        retirement.retire(2_000 * 10 ** 18, companyA, "ipfs://report.pdf");
    }

    function test_Retire_RevertsWithoutApproval() public {
        // Deliberately skip approve() — burnFrom should revert on insufficient allowance
        vm.prank(companyA);
        vm.expectRevert(); // OZ ERC20InsufficientAllowance
        retirement.retire(200 * 10 ** 18, companyA, "ipfs://report.pdf");
    }

    function test_Retire_RevertsIfFromFrozen() public {
        vm.prank(companyA);
        credit.approve(address(retirement), 200 * 10 ** 18);

        vm.prank(admin);
        registry.freeze(companyA, "investigation");

        vm.prank(companyA);
        vm.expectRevert(abi.encodeWithSelector(CarbonCredit.CC_SenderNotVerified.selector, companyA));
        retirement.retire(200 * 10 ** 18, companyA, "ipfs://report.pdf");
    }

    function test_Retire_AllowsThirdPartyBeneficiary() public {
        address beneficiary = makeAddr("beneficiary");
        _approveAndRetire(50 * 10 ** 18, beneficiary, "ipfs://third-party-report.pdf");

        // Burn happens from companyA regardless; beneficiary is just metadata for the event
        assertEq(credit.balanceOf(companyA), 950 * 10 ** 18);
    }

    function test_Retire_RevertsWithoutBurnerRole() public {
        // Deploy a fresh Retirement that hasn't been granted BURNER_ROLE
        Retirement orphan = new Retirement(credit);

        vm.prank(companyA);
        credit.approve(address(orphan), 100 * 10 ** 18);

        vm.prank(companyA);
        vm.expectRevert(); // OZ AccessControlUnauthorizedAccount
        orphan.retire(100 * 10 ** 18, companyA, "ipfs://report.pdf");
    }
}
