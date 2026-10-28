// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Recovery — one-shot rescue of tokens stranded at a CREATE address
 * @notice Tokens were sent to this contract's address before it existed
 *         (same deployer+nonce on another chain). Deploying this at that
 *         address forwards the full token balance to the rescue target in
 *         the constructor. No state, no functions, nothing left to attack.
 */
contract Recovery {
    constructor(IERC20 token, address to) {
        token.transfer(to, token.balanceOf(address(this)));
    }
}
