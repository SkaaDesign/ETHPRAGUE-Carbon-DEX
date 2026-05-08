// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {EURS} from "../src/EURS.sol";
import {ComplianceRegistry} from "../src/ComplianceRegistry.sol";
import {CarbonCredit} from "../src/CarbonCredit.sol";
import {Retirement} from "../src/Retirement.sol";
import {CarbonDEX} from "../src/CarbonDEX.sol";
import {Regulator} from "../src/Regulator.sol";

contract DeployCarbonSystem is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Deploying from:", deployer);
        
        // 1. Deploy EURS
        EURS eurs = new EURS();
        console.log("EURS deployed at:", address(eurs));
        
        // 2. Deploy ComplianceRegistry
        ComplianceRegistry complianceRegistry = new ComplianceRegistry();
        console.log("ComplianceRegistry deployed at:", address(complianceRegistry));
        
        // 3. Deploy CarbonCredit
        CarbonCredit carbonCredit = new CarbonCredit(address(complianceRegistry));
        console.log("CarbonCredit deployed at:", address(carbonCredit));
        
        // 4. Deploy Retirement
        Retirement retirement = new Retirement(address(carbonCredit), address(complianceRegistry));
        console.log("Retirement deployed at:", address(retirement));
        
        // 5. Deploy CarbonDEX
        CarbonDEX carbonDEX = new CarbonDEX(
            address(carbonCredit),
            address(eurs),
            address(complianceRegistry)
        );
        console.log("CarbonDEX deployed at:", address(carbonDEX));
        
        // 6. Deploy Regulator
        Regulator regulator = new Regulator(
            address(carbonCredit),
            address(complianceRegistry),
            address(carbonDEX),
            address(eurs)
        );
        console.log("Regulator deployed at:", address(regulator));
        
        // Set up permissions
        carbonCredit.setRegulator(address(regulator));
        carbonDEX.unpause(); // Ensure DEX starts unpaused
        
        console.log("\n=== Deployment Complete ===");
        console.log("Regulator Address (save this):", address(regulator));
        
        vm.stopBroadcast();
    }
}