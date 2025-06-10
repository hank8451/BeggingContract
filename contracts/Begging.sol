// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Begging is Initializable, OwnableUpgradeable {
    struct BeggingInfo {
        string title;
        string description;
        uint256 createdAt;
        uint256 endAt;
        bool isActive;
    }

    struct TokenDonation {
        address token;
        uint256 amount;
        string message;
    }

    BeggingInfo public beggingInfo;

    mapping(address donor => TokenDonation[] donations) public donorHistory;
    TokenDonation[] public allDonations;
    mapping(address => uint256) public tokenBalances;
    mapping(address => AggregatorV3Interface) private priceOracles;

    address constant ETH = address(0);
    address constant USDC = address(0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238);

    event DonationReceived(
        address indexed donor,
        address indexed token,
        uint256 amount
    );

    function initialize(
        string calldata _title,
        string calldata _description,
        uint256 _duration,
        address _creator
    ) public initializer {
        __Ownable_init(_creator);
        require(_duration > 0, "Duration must be greater than 0");

        beggingInfo = BeggingInfo({
            title: _title,
            description: _description,
            createdAt: block.timestamp,
            endAt: block.timestamp + _duration,
            isActive: true
        });

        setPriceOracle(
            ETH,
            address(0x694AA1769357215DE4FAC081bf1f309aDC325306)
        ); // sepolia ETH/USD
        setPriceOracle(
            USDC,
            address(0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E)
        ); // sepolia USDC/USD
    }

    function donate(
        string calldata _donorMsg,
        uint256 _amount,
        address _token
    ) public payable {
        require(beggingInfo.isActive, "thie begging is no longer active!");
        require(
            beggingInfo.endAt > block.timestamp,
            "this begging had already ended!"
        );

        address donor = msg.sender;
        if (_token == address(0)) {
            // ETH
            require(msg.value > 0, "no donation amount detected");
            TokenDonation memory _donation = TokenDonation({
                token: _token,
                amount: msg.value,
                message: _donorMsg
            });
            donorHistory[msg.sender].push(_donation);
            emit DonationReceived(donor, _token, msg.value);
            allDonations.push(_donation);
            tokenBalances[ETH] += msg.value;
        } else {
            // USDC
            require(_amount > 0, "no donation amount detected");
            TokenDonation memory _donation = TokenDonation({
                token: _token,
                amount: _amount,
                message: _donorMsg
            });
            donorHistory[msg.sender].push(_donation);
            IERC20(_token).transferFrom(msg.sender, address(this), _amount);
            emit DonationReceived(donor, _token, _amount);
            allDonations.push(_donation);
            tokenBalances[USDC] += _amount;
        }
    }

    function withdraw() public onlyOwner {
        if (tokenBalances[ETH] > 0) {
            uint256 ethAmount = tokenBalances[ETH];
            tokenBalances[ETH] = 0;
            payable(owner()).transfer(ethAmount);
        }

        if (tokenBalances[USDC] > 0) {
            uint256 usdcAmount = tokenBalances[USDC];
            tokenBalances[USDC] = 0;
            IERC20(USDC).transfer(owner(), usdcAmount);
        }
    }

    function getDonation(address _donor) public returns (uint256) {
        require(_donor != address(0), "donator address cannot be zero");
        uint256 total;

        for (uint i = 0; i < donorHistory[_donor].length; i++) {
            TokenDonation memory donation = donorHistory[_donor][i];
            if (donation.token == ETH) {
                total += (donation.amount * uint(getLatestPrice(ETH)));
            } else if (donation.token == USDC) {
                total += (donation.amount * uint(getLatestPrice(USDC)));
            }
        }
        return total;
    }

    function setPriceOracle(address _token, address _feed) internal {
        priceOracles[_token] = AggregatorV3Interface(_feed);
    }

    function getLatestPrice(address _token) internal view returns (int) {
        AggregatorV3Interface priceOracle = priceOracles[_token];
        // prettier-ignore
        (
            /* uint80 roundId */,
            int256 answer,
            /*uint256 startedAt*/,
            /*uint256 updatedAt*/,
            /*uint80 answeredInRound*/
        ) = priceOracle.latestRoundData();
        return answer;
    }

    function version() public pure virtual returns (string memory) {
        return "1.0.0";
    }

    receive() external payable {}
}
