// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title StachFaucet — testnet-only STACH dispenser
 * @notice Drips a fixed amount of STACH per address per cooldown so visitors
 *         can try staking on Base Sepolia without asking anyone. Fund it by
 *         simply transferring STACH to this contract's address.
 */
contract StachFaucet {
    IERC20 public immutable stach;
    uint256 public constant DRIP_AMOUNT = 100 * 1e18;
    uint256 public constant COOLDOWN = 1 days;

    mapping(address => uint256) public lastDrip;

    event Dripped(address indexed to, uint256 amount);

    constructor(IERC20 _stach) {
        stach = _stach;
    }

    function drip() external {
        require(
            block.timestamp - lastDrip[msg.sender] >= COOLDOWN,
            "already dripped today"
        );
        lastDrip[msg.sender] = block.timestamp;
        require(stach.transfer(msg.sender, DRIP_AMOUNT), "faucet empty");
        emit Dripped(msg.sender, DRIP_AMOUNT);
    }

    function faucetBalance() external view returns (uint256) {
        return stach.balanceOf(address(this));
    }
}
