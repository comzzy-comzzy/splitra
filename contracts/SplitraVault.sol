// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
}

contract SplitraVault {
    uint16 public constant TOTAL_BPS = 10000;

    address public owner;
    bool private locked;
    address[] private recipients;
    mapping(address => uint16) public sharesBps;
    mapping(address => string) public labels;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event SplitsConfigured(bytes32 indexed configHash, uint256 recipientCount);
    event RevenueReceived(address indexed from, address indexed token, uint256 amount, bytes32 indexed revenueId);
    event RevenueRouted(
        bytes32 indexed routeId,
        address indexed token,
        uint256 grossAmount,
        uint256 remainder,
        bytes32 indexed configHash
    );
    event Payout(bytes32 indexed routeId, address indexed token, address indexed recipient, uint256 amount, uint16 bps);

    modifier onlyOwner() {
        require(msg.sender == owner, "Splitra: not owner");
        _;
    }

    modifier nonReentrant() {
        require(!locked, "Splitra: reentrant call");
        locked = true;
        _;
        locked = false;
    }

    constructor(address initialOwner) {
        require(initialOwner != address(0), "Splitra: zero owner");
        owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    receive() external payable {
        emit RevenueReceived(msg.sender, address(0), msg.value, bytes32(0));
    }

    function recordRevenue(address token, uint256 amount, bytes32 revenueId) external {
        require(amount > 0, "Splitra: zero amount");
        emit RevenueReceived(msg.sender, token, amount, revenueId);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Splitra: zero owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function configureSplits(
        address[] calldata newRecipients,
        uint16[] calldata newSharesBps,
        string[] calldata newLabels
    ) external onlyOwner {
        require(newRecipients.length > 0, "Splitra: empty recipients");
        require(newRecipients.length == newSharesBps.length, "Splitra: length mismatch");
        require(newRecipients.length == newLabels.length, "Splitra: label mismatch");

        for (uint256 i = 0; i < recipients.length; i++) {
            delete sharesBps[recipients[i]];
            delete labels[recipients[i]];
        }
        delete recipients;

        uint256 total;
        for (uint256 i = 0; i < newRecipients.length; i++) {
            address recipient = newRecipients[i];
            uint16 share = newSharesBps[i];
            require(recipient != address(0), "Splitra: zero recipient");
            require(share > 0, "Splitra: zero share");
            require(sharesBps[recipient] == 0, "Splitra: duplicate recipient");
            recipients.push(recipient);
            sharesBps[recipient] = share;
            labels[recipient] = newLabels[i];
            total += share;
        }
        require(total == TOTAL_BPS, "Splitra: shares must equal 10000");

        emit SplitsConfigured(currentConfigHash(), newRecipients.length);
    }

    function route(address token, uint256 amount, bytes32 routeId) external onlyOwner nonReentrant {
        require(amount > 0, "Splitra: zero amount");
        require(recipients.length > 0, "Splitra: splits not configured");

        if (token == address(0)) {
            require(address(this).balance >= amount, "Splitra: insufficient native balance");
        } else {
            require(IERC20(token).balanceOf(address(this)) >= amount, "Splitra: insufficient token balance");
        }

        uint256 paid;
        for (uint256 i = 0; i < recipients.length; i++) {
            address recipient = recipients[i];
            uint256 payout = (amount * sharesBps[recipient]) / TOTAL_BPS;
            paid += payout;
            if (payout > 0) {
                _pay(token, recipient, payout);
            }
            emit Payout(routeId, token, recipient, payout, sharesBps[recipient]);
        }

        uint256 remainder = amount - paid;
        if (remainder > 0) {
            _pay(token, owner, remainder);
        }

        emit RevenueRouted(routeId, token, amount, remainder, currentConfigHash());
    }

    function getRecipients() external view returns (address[] memory) {
        return recipients;
    }

    function getSplitConfig()
        external
        view
        returns (address[] memory configRecipients, uint16[] memory configShares, string[] memory configLabels)
    {
        configRecipients = recipients;
        configShares = new uint16[](recipients.length);
        configLabels = new string[](recipients.length);

        for (uint256 i = 0; i < recipients.length; i++) {
            configShares[i] = sharesBps[recipients[i]];
            configLabels[i] = labels[recipients[i]];
        }
    }

    function currentConfigHash() public view returns (bytes32) {
        return keccak256(abi.encode(recipients, _sharesArray(), _labelsArray()));
    }

    function _pay(address token, address recipient, uint256 amount) internal {
        if (token == address(0)) {
            (bool ok,) = recipient.call{value: amount}("");
            require(ok, "Splitra: native payout failed");
        } else {
            require(IERC20(token).transfer(recipient, amount), "Splitra: token payout failed");
        }
    }

    function _sharesArray() internal view returns (uint16[] memory values) {
        values = new uint16[](recipients.length);
        for (uint256 i = 0; i < recipients.length; i++) {
            values[i] = sharesBps[recipients[i]];
        }
    }

    function _labelsArray() internal view returns (string[] memory values) {
        values = new string[](recipients.length);
        for (uint256 i = 0; i < recipients.length; i++) {
            values[i] = labels[recipients[i]];
        }
    }
}
