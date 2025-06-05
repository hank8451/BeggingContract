// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

// Author: @hank8451
contract Begging is Ownable {
    mapping(address donator => uint256 amount) private donations;
    mapping(address donator => string[] message) private donationMsgs;

    address[3] public topThreeDonator;

    uint256 constant DAYTIME_START = 0; // UTC+8
    uint256 constant DAYTIME_END = 9; // UTC+8

    modifier onlyAtDayTime() {
        require(isDayTime(), "Function can only be called during daytime");
        _;
    }

    event Donation(address indexed donator, uint256 indexed amount);

    constructor() Ownable(msg.sender) {}

    function donate(string calldata _msg) public payable onlyAtDayTime {
        require(msg.value > 0, "no donation");
        address donator = msg.sender;
        donations[donator] += msg.value;
        donationMsgs[donator].push(_msg);
        calculateTopThreeDonator(donator);
        emit Donation(donator, msg.value);
    }

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No money to withdraw");
        payable(msg.sender).transfer(balance);
    }

    function getDonation(address donator) public view returns (uint256) {
        require(donator != address(0), "donator address cannot be zero");
        return donations[donator];
    }

    function getTopThreeDonator() public view returns (address[3] memory) {
        return topThreeDonator;
    }

    function isDayTime() internal view returns (bool) {
        uint256 currentHour = (block.timestamp / 3600) % 24;
        return currentHour >= DAYTIME_START && currentHour < DAYTIME_END;
    }

    function calculateTopThreeDonator(address _donator) internal {
        address pre;
        for (uint i = 0; i < 3; i++) {
            if (topThreeDonator[i] != address(0)) {
                if (pre == address(0)) {
                    if (donations[_donator] > donations[topThreeDonator[i]]) {
                        pre = topThreeDonator[i];
                        topThreeDonator[i] = _donator;
                    }
                } else {
                    address temp;
                    temp = topThreeDonator[i];
                    topThreeDonator[i] = pre;
                    pre = temp;
                }
            } else {
                if (pre == address(0)) {
                    topThreeDonator[i] = _donator;
                } else if (donations[topThreeDonator[i - 1]] > donations[pre]) {
                    topThreeDonator[i] = pre;
                }
                break;
            }
        }
    }

    receive() external payable {}
}
