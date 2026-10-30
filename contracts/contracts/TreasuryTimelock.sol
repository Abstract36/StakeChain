// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title TreasuryTimelock — verifiable lock on a slice of the STACH treasury
 *
 * @notice Holds STACH and releases it to a fixed beneficiary on a public
 *         schedule: nothing before the cliff, then linearly until the end.
 *         There is no owner, no pause, no upgrade path and no recovery
 *         function — once tokens are in, the schedule is the only way out,
 *         and anyone (not just the beneficiary) can trigger a release.
 *
 * @dev Deliberately minimal. The contract holds whatever balance it is sent
 *      and vests against the running total ever received (`released` +
 *      current balance), so later top-ups extend the locked amount under
 *      the same schedule instead of needing a second contract.
 *
 *      Scanners flag treasury concentration because a treasury *can* sell.
 *      This contract removes that ability for the amount it holds, and the
 *      proof is on-chain rather than a promise in a document.
 */
contract TreasuryTimelock {
    using SafeERC20 for IERC20;

    /// @notice The locked token (STACH).
    IERC20 public immutable token;
    /// @notice The only address that can ever receive the tokens.
    address public immutable beneficiary;
    /// @notice No tokens are releasable before this timestamp.
    uint64 public immutable cliff;
    /// @notice Vesting starts here (linear from `start` to `start + duration`).
    uint64 public immutable start;
    /// @notice Total vesting length in seconds, measured from `start`.
    uint64 public immutable duration;

    /// @notice Total amount already released to the beneficiary.
    uint256 public released;

    event Released(uint256 amount);

    /**
     * @param _token       token to lock (STACH)
     * @param _beneficiary address tokens are released to, forever fixed
     * @param _start       unix timestamp vesting is measured from
     * @param _cliff       unix timestamp before which nothing is releasable
     * @param _duration    seconds from `_start` until everything has vested
     */
    constructor(
        IERC20 _token,
        address _beneficiary,
        uint64 _start,
        uint64 _cliff,
        uint64 _duration
    ) {
        require(address(_token) != address(0), "token is zero address");
        require(_beneficiary != address(0), "beneficiary is zero address");
        require(_duration > 0, "duration is zero");
        require(_cliff >= _start, "cliff before start");
        require(_cliff <= _start + _duration, "cliff after end");

        token = _token;
        beneficiary = _beneficiary;
        start = _start;
        cliff = _cliff;
        duration = _duration;
    }

    /// @notice Everything this lock has ever held: released plus still held.
    function totalLocked() public view returns (uint256) {
        return token.balanceOf(address(this)) + released;
    }

    /**
     * @notice Amount vested at `timestamp` out of the running total.
     * @dev Zero before the cliff, linear afterwards, full at `start + duration`.
     */
    function vestedAmount(uint64 timestamp) public view returns (uint256) {
        if (timestamp < cliff) return 0;
        if (timestamp >= start + duration) return totalLocked();
        return (totalLocked() * (timestamp - start)) / duration;
    }

    /// @notice Vested but not yet released — what `release()` would send now.
    function releasable() public view returns (uint256) {
        return vestedAmount(uint64(block.timestamp)) - released;
    }

    /**
     * @notice Sends everything vested so far to the beneficiary.
     * @dev Callable by anyone: the destination is fixed at construction, so
     *      an outside caller can only move tokens to where they were always
     *      going. Keeps the schedule enforceable without the beneficiary.
     */
    function release() external {
        uint256 amount = releasable();
        require(amount > 0, "nothing to release");
        released += amount;
        token.safeTransfer(beneficiary, amount);
        emit Released(amount);
    }
}
