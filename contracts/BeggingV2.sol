// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./Begging.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BeggingV2 is Begging {
    function version() public pure override returns (string memory) {
        return "2.0.0";
    }
}
