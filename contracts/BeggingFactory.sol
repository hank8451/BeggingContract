// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "./Begging.sol";

contract BeggingFactory is Ownable {
    UpgradeableBeacon public immutable beacon;

    address[] public allBeggings;
    mapping(address => address[]) public creatorBeggings;
    event BeggingCreated(
        address indexed creator,
        address indexed begging,
        string title,
        uint256 duration
    );

    constructor(address _implementation) Ownable(msg.sender) {
        require(_implementation != address(0), "Invalid implementation");

        beacon = new UpgradeableBeacon(_implementation, address(this));
    }

    function createBegging(
        string memory _title,
        string memory _description,
        uint256 _duration
    ) external returns (address) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_duration > 60, "Duration must be at least 1 minute");

        BeaconProxy proxy = new BeaconProxy(
            address(beacon),
            abi.encodeWithSelector(
                Begging.initialize.selector,
                _title,
                _description,
                _duration,
                msg.sender
            )
        );

        address begging = address(proxy);

        allBeggings.push(begging);
        emit BeggingCreated(msg.sender, begging, _title, _duration);
        return begging;
    }

    function upgradeBeacon(address _newImplementation) external onlyOwner {
        require(_newImplementation != address(0), "Invalid implementation");
        beacon.upgradeTo(_newImplementation);
    }

    function getImplementation() external view returns (address) {
        return beacon.implementation();
    }
}
