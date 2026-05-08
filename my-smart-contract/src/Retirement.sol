// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {CarbonCredit} from "./CarbonCredit.sol";

contract Retirement {
    CarbonCredit public immutable carbonCredit;

    event Retired(
        uint256 indexed tokenId,
        uint256 amount,
        address indexed beneficiary,
        string reasonURI,
        uint256 timestamp
    );

    constructor(address _carbonCredit) {
        carbonCredit = CarbonCredit(_carbonCredit);
    }

    function retire(uint256 tokenId, uint256 amount, address beneficiary, string calldata reasonURI) external {
        carbonCredit.retire(msg.sender, tokenId, amount);
        emit Retired(tokenId, amount, beneficiary, reasonURI, block.timestamp);
    }
}