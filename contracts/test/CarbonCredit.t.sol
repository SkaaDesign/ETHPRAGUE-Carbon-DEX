// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ComplianceRegistry} from "../src/ComplianceRegistry.sol";
import {CarbonCredit} from "../src/CarbonCredit.sol";

contract CarbonCreditTest is Test {
    ComplianceRegistry internal registry;
    CarbonCredit internal credit;

    address internal admin = makeAddr("admin");
    address internal minter = makeAddr("minter");
    address internal burner = makeAddr("burner");
    address internal companyA = makeAddr("companyA");
    address internal companyB = makeAddr("companyB");
    address internal stranger = makeAddr("stranger");

    uint16 internal constant VINTAGE = 2026;
    bytes2 internal constant SECTOR_INDUSTRY = bytes2("IN");
    bytes2 internal constant ORIGIN_DE = bytes2("DE");
    bytes32 internal constant ISSUANCE_REF = keccak256("2026-FA-DE-001");

    function setUp() public {
        registry = new ComplianceRegistry(admin);
        credit = new CarbonCredit(admin, registry);

        vm.startPrank(admin);
        registry.register(companyA, ComplianceRegistry.AccountType.Operator, ORIGIN_DE, "Cement Mainz");
        registry.register(companyB, ComplianceRegistry.AccountType.Operator, bytes2("SK"), "Aluminium Bratislava");
        credit.grantRole(credit.MINTER_ROLE(), minter);
        credit.grantRole(credit.BURNER_ROLE(), burner);
        vm.stopPrank();
    }

    function _mint(address to, uint256 amount) internal {
        vm.prank(minter);
        credit.mint(to, amount, VINTAGE, SECTOR_INDUSTRY, ORIGIN_DE, ISSUANCE_REF);
    }

    // ─── Mint ───────────────────────────────────────────────────────────

    function test_Mint_Succeeds() public {
        _mint(companyA, 1_000 * 10 ** 18);

        assertEq(credit.balanceOf(companyA), 1_000 * 10 ** 18);
        assertEq(credit.totalSupply(), 1_000 * 10 ** 18);
    }

    function test_Mint_RevertsForNonMinter() public {
        vm.prank(stranger);
        vm.expectRevert();
        credit.mint(companyA, 1_000 * 10 ** 18, VINTAGE, SECTOR_INDUSTRY, ORIGIN_DE, ISSUANCE_REF);
    }

    function test_Mint_RevertsForUnverifiedRecipient() public {
        vm.prank(minter);
        vm.expectRevert(abi.encodeWithSelector(CarbonCredit.CC_RecipientNotVerified.selector, stranger));
        credit.mint(stranger, 1_000 * 10 ** 18, VINTAGE, SECTOR_INDUSTRY, ORIGIN_DE, ISSUANCE_REF);
    }

    function test_Mint_RevertsIfRecipientFrozen() public {
        vm.prank(admin);
        registry.freeze(companyA, "test");

        vm.prank(minter);
        vm.expectRevert(abi.encodeWithSelector(CarbonCredit.CC_RecipientNotVerified.selector, companyA));
        credit.mint(companyA, 1_000 * 10 ** 18, VINTAGE, SECTOR_INDUSTRY, ORIGIN_DE, ISSUANCE_REF);
    }

    // ─── Transfer ───────────────────────────────────────────────────────

    function test_Transfer_BetweenVerified_Succeeds() public {
        _mint(companyA, 1_000 * 10 ** 18);

        vm.prank(companyA);
        assertTrue(credit.transfer(companyB, 200 * 10 ** 18));

        assertEq(credit.balanceOf(companyA), 800 * 10 ** 18);
        assertEq(credit.balanceOf(companyB), 200 * 10 ** 18);
    }

    function test_Transfer_RevertsToUnverified() public {
        _mint(companyA, 1_000 * 10 ** 18);

        vm.prank(companyA);
        vm.expectRevert(abi.encodeWithSelector(CarbonCredit.CC_RecipientNotVerified.selector, stranger));
        credit.transfer(stranger, 200 * 10 ** 18);
    }

    function test_Transfer_RevertsFromFrozen() public {
        _mint(companyA, 1_000 * 10 ** 18);

        vm.prank(admin);
        registry.freeze(companyA, "sanctions");

        vm.prank(companyA);
        vm.expectRevert(abi.encodeWithSelector(CarbonCredit.CC_SenderNotVerified.selector, companyA));
        credit.transfer(companyB, 200 * 10 ** 18);
    }

    function test_Transfer_RevertsToFrozen() public {
        _mint(companyA, 1_000 * 10 ** 18);

        vm.prank(admin);
        registry.freeze(companyB, "investigation");

        vm.prank(companyA);
        vm.expectRevert(abi.encodeWithSelector(CarbonCredit.CC_RecipientNotVerified.selector, companyB));
        credit.transfer(companyB, 200 * 10 ** 18);
    }

    // ─── Burn ───────────────────────────────────────────────────────────

    function test_BurnFrom_Succeeds() public {
        _mint(companyA, 1_000 * 10 ** 18);

        vm.prank(burner);
        credit.burnFrom(companyA, 300 * 10 ** 18);

        assertEq(credit.balanceOf(companyA), 700 * 10 ** 18);
        assertEq(credit.totalSupply(), 700 * 10 ** 18);
    }

    function test_BurnFrom_RevertsForNonBurner() public {
        _mint(companyA, 1_000 * 10 ** 18);

        vm.prank(stranger);
        vm.expectRevert();
        credit.burnFrom(companyA, 300 * 10 ** 18);
    }

    function test_BurnFrom_RevertsIfFromFrozen() public {
        _mint(companyA, 1_000 * 10 ** 18);

        vm.prank(admin);
        registry.freeze(companyA, "test");

        vm.prank(burner);
        vm.expectRevert(abi.encodeWithSelector(CarbonCredit.CC_SenderNotVerified.selector, companyA));
        credit.burnFrom(companyA, 300 * 10 ** 18);
    }

    // ─── Metadata ───────────────────────────────────────────────────────

    function test_NameSymbolDecimals() public view {
        assertEq(credit.name(), "Carbon Allowance");
        assertEq(credit.symbol(), "EUA");
        assertEq(credit.decimals(), 18);
    }
}
