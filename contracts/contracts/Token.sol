// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface ApproveAndCallFallBack {
    function receiveApproval(
        address from,
        uint256 _amount,
        address _token,
        bytes memory _data
    ) external;
}

/**
 * @title STACH — Stakechain token with built-in flexible and locked staking pools
 *
 * @notice Total supply is fixed at 42,000,000 STACH. 3,000,000 of it is held by
 *         the contract itself as the reward reserve (1M for the flexible pool,
 *         2M for the locked pool, distributed linearly over 360 days).
 *         The remaining 39,000,000 goes to the initial holder.
 *
 * @dev Hardened revision of the 2022 contract. Fixes applied:
 *      - transferFrom credited the recipient with a subtraction (balance burn /
 *        guaranteed revert); now adds, and emits the correct event.
 *      - Reward payouts were unbacked (sum of balances could exceed totalSupply);
 *        rewards are now paid out of a real 3M reserve held by the contract and
 *        emit Transfer events so indexers see them.
 *      - approveAndCall makes an external call and is now nonReentrant.
 *      - unstakeLocked / unstakeFlexible / withdrawRewards are nonReentrant and
 *        follow checks-effects-interactions.
 *      - Zero-address guards on transfer/transferFrom recipients (transfer to
 *        address(0) is NOT a supported burn path anymore).
 *      - hardhat/console.sol removed from production code.
 */
contract STACH is IERC20, ReentrancyGuard {
    string public symbol;
    string public name;
    uint8 public decimals;
    uint256 public _totalSupply;

    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) allowed;

    // staking storage
    uint256 public periodFinish;
    uint256 public rewardsDuration;
    PoolData public flexiblePool;
    PoolData public lockedPool;
    // remaining undistributed reward reserve (accounting cap, backed by real balance)
    uint256 public rewardTokens;

    /**
     * @dev Stake weight is proportional to deposit amount and time locked, precisely
     *      "deposit amount wei multiplied by (fraction of the year locked)"
     * @dev To avoid significant precision loss due to multiplication by "fraction of the year" [0, 1],
     *      weight is stored multiplied by 1e6 constant, as an integer
     */
    uint256 internal constant WEIGHT_MULTIPLIER = 1e6;
    /**
     * @dev Rewards per weight are stored multiplied by 1e12, as integers.
     */
    uint256 internal constant REWARD_PER_WEIGHT_MULTIPLIER = 1e12;

    // keeps track of stakers staked in locked staking pool
    mapping(address => User) public lockedStakingUsers;
    // keeps track of stakers staked in flexible staking pool
    mapping(address => User) public flexibleStakingUsers;
    // keeps track of all the rewards of users
    mapping(address => uint256) public rewards;

    struct PoolData {
        uint256 totalLockedWeight;
        uint256 yieldRewardsPerWeight;
        uint256 lastUpdatedTime;
        uint256 rewardsRate;
    }

    struct Deposit {
        uint256 tokenAmount;
        uint256 weight;
        uint256 lockedFrom;
        uint256 lockedUntil;
    }

    struct User {
        // @dev Total staked amount
        uint256 tokenAmount;
        // @dev Total weight
        uint256 totalWeight;
        // @dev Auxiliary variable for yield calculation
        uint256 subYieldRewards;
        // @dev An array of holder's deposits
        Deposit[] deposits;
    }

    event RewardsWithdrawn(address indexed user, uint256 amount);
    event Staked(address indexed user, bool indexed locked, uint256 amount, uint256 weight);
    event Unstaked(address indexed user, bool indexed locked, uint256 amount);

    constructor(address _stachHolder) {
        require(_stachHolder != address(0), "holder is zero address");

        symbol = "STACH";
        name = "Stakechain";
        decimals = 18;
        _totalSupply = 42000000 * 10 ** 18; // 42 M

        // reward reserve: 1M (flexible) + 2M (locked) held by the contract itself
        uint256 rewardReserve = 3000000 * 10 ** 18;
        rewardTokens = rewardReserve;
        balances[address(this)] = rewardReserve;
        emit Transfer(address(0), address(this), rewardReserve);

        // initial holder receives the rest of the supply
        balances[_stachHolder] = _totalSupply - rewardReserve;
        emit Transfer(address(0), _stachHolder, _totalSupply - rewardReserve);

        // setting rewards duration to 1 year in seconds
        rewardsDuration = 30 days * 12;

        flexiblePool.lastUpdatedTime = block.timestamp;
        lockedPool.lastUpdatedTime = block.timestamp;

        periodFinish = block.timestamp + rewardsDuration;

        // flexible pool rewards will be 1 M
        flexiblePool.rewardsRate = (1000000 * 10 ** 18) / rewardsDuration;
        // locked pool rewards will be 2 M
        lockedPool.rewardsRate = (2000000 * 10 ** 18) / rewardsDuration;
    }

    function totalSupply() external view override returns (uint256) {
        return _totalSupply - balances[address(0)];
    }

    function balanceOf(address tokenOwner)
        public
        view
        override
        returns (uint256 balance)
    {
        return balances[tokenOwner];
    }

    function transfer(address to, uint256 tokens)
        public
        override
        returns (bool success)
    {
        _transfer(msg.sender, to, tokens);
        return true;
    }

    function approve(address spender, uint256 tokens)
        external
        override
        returns (bool success)
    {
        allowed[msg.sender][spender] = tokens;
        emit Approval(msg.sender, spender, tokens);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokens
    ) public override returns (bool success) {
        uint256 currentAllowance = allowed[from][msg.sender];
        require(currentAllowance >= tokens, "insufficient allowance");
        // infinite approval: skip the allowance write to save gas
        if (currentAllowance != type(uint256).max) {
            allowed[from][msg.sender] = currentAllowance - tokens;
        }
        _transfer(from, to, tokens);
        return true;
    }

    function _transfer(address from, address to, uint256 tokens) internal {
        require(to != address(0), "transfer to zero address");
        require(balances[from] >= tokens, "insufficient balance");
        balances[from] -= tokens;
        balances[to] += tokens;
        emit Transfer(from, to, tokens);
    }

    function allowance(address tokenOwner, address spender)
        public
        view
        override
        returns (uint256 remaining)
    {
        return allowed[tokenOwner][spender];
    }

    function approveAndCall(
        address spender,
        uint256 tokens,
        bytes memory data
    ) public nonReentrant returns (bool success) {
        allowed[msg.sender][spender] = tokens;
        emit Approval(msg.sender, spender, tokens);
        ApproveAndCallFallBack(spender).receiveApproval(
            msg.sender,
            tokens,
            address(this),
            data
        );
        return true;
    }

    /* ========== STAKING FUNCTIONS ========== */

    /**
     * @dev Similar to public pendingYieldRewards, but performs calculations based on
     *      current smart contract state only, not taking into account any additional
     *      time which might have passed
     *
     * @return pending calculated yield reward value for the user
     */
    function _pendingYieldRewards()
        internal
        view
        returns (
            uint256 pending,
            bool,
            bool
        )
    {
        // read user data structure into memory
        User memory flexibleStake = flexibleStakingUsers[msg.sender];
        User memory lockedStake = lockedStakingUsers[msg.sender];

        if (flexibleStake.tokenAmount > 0) {
            pending +=
                weightToReward(
                    flexibleStake.totalWeight,
                    flexiblePool.yieldRewardsPerWeight
                ) -
                flexibleStake.subYieldRewards;
        }
        if (lockedStake.tokenAmount > 0) {
            pending +=
                weightToReward(
                    lockedStake.totalWeight,
                    lockedPool.yieldRewardsPerWeight
                ) -
                lockedStake.subYieldRewards;
        }

        // return pending rewards and also booleans representing user's stakes in both pools
        return (
            pending,
            flexibleStake.tokenAmount > 0,
            lockedStake.tokenAmount > 0
        );
    }

    /**
     * @notice Service function to calculate and pay pending yield rewards to the sender
     *
     * @dev Can be executed by anyone at any time, but has an effect only when
     *      executed by deposit holder and when at least one second passes from the
     *      previous reward processing
     * @dev Executed internally when staking and unstaking, executes sync() under the hood
     *      before making further calculations and payouts
     * @dev When timing conditions are not met (executed too frequently, or after
     *      end block), function doesn't throw and exits silently
     */
    function processRewards() external {
        _sync();
        // delegate call to an internal function
        _processRewards();
    }

    /**
     * @dev Used internally, mostly by children implementations, see processRewards()
     *
     * @return pendingYield the rewards calculated and added to user's rewards
     */
    function _processRewards() internal virtual returns (uint256 pendingYield) {
        bool hasFlexibleStakes;
        bool hasLockedStakes;
        // calculate pending yield rewards, this value will be returned
        (
            pendingYield,
            hasFlexibleStakes,
            hasLockedStakes
        ) = _pendingYieldRewards();
        // if pending yield is zero - just return silently
        if (pendingYield == 0) return 0;
        // add up user's rewards
        rewards[msg.sender] += pendingYield;
        // update user's subYieldRewards variable
        if (hasLockedStakes) {
            lockedStakingUsers[msg.sender].subYieldRewards = weightToReward(
                lockedStakingUsers[msg.sender].totalWeight,
                lockedPool.yieldRewardsPerWeight
            );
        }
        if (hasFlexibleStakes) {
            flexibleStakingUsers[msg.sender].subYieldRewards = weightToReward(
                flexibleStakingUsers[msg.sender].totalWeight,
                flexiblePool.yieldRewardsPerWeight
            );
        }
    }

    /**
     * @dev Pays out processed rewards of a user from the contract's reward reserve
     *
     * @return rewards withdrawn
     */
    function withdrawRewards() external nonReentrant returns (uint256) {
        uint256 rewardsProcessed = rewards[msg.sender];
        require(rewardsProcessed > 0, "no rewards to withdraw");
        // the reserve is the cap: distributed rewards can never exceed it
        require(rewardTokens >= rewardsProcessed, "reward reserve depleted");

        rewardTokens -= rewardsProcessed;
        rewards[msg.sender] = 0;
        // pay out of the real reserve held by the contract
        balances[address(this)] -= rewardsProcessed;
        balances[msg.sender] += rewardsProcessed;
        emit Transfer(address(this), msg.sender, rewardsProcessed);
        emit RewardsWithdrawn(msg.sender, rewardsProcessed);

        return rewardsProcessed;
    }

    function stakeInLocked(uint256 _amount, uint256 _numOfMonths)
        external
        nonReentrant
    {
        require(_amount >= 10 ** 18, "Cannot stake less than 1 STACH");
        require(
            _numOfMonths > 0 && _numOfMonths <= 6,
            "incorrect number of months"
        );

        // update current yield rewards per weight
        _sync();

        // get a link to user data struct, we will write to it later
        User storage user = lockedStakingUsers[msg.sender];
        // process current pending rewards if any
        if (user.tokenAmount > 0) {
            _processRewards();
        }

        // pull the stake into the contract
        _transfer(msg.sender, address(this), _amount);
        uint256 addedAmount = _amount;

        // set the `lockFrom` and `lockUntil` taking into account that
        // locked staking means that staking period can be 30/60/90/120/150/180 days
        uint256 lockFrom = block.timestamp;
        // considering 1 month = 30 days
        uint256 lockUntil = lockFrom + (_numOfMonths * 30 days);
        require(lockUntil <= periodFinish, "lockUntil exceeding finish period");

        uint256 stakeWeight = (((lockUntil - lockFrom) * WEIGHT_MULTIPLIER) /
            180 days) * addedAmount;

        // makes sure stakeWeight is valid
        assert(stakeWeight > 0);

        // create and save the deposit (append it to deposits array)
        Deposit memory deposit = Deposit({
            tokenAmount: addedAmount,
            weight: stakeWeight,
            lockedFrom: lockFrom,
            lockedUntil: lockUntil
        });

        // deposit ID is an index of the deposit in `deposits` array
        user.deposits.push(deposit);
        // update user record
        user.tokenAmount += addedAmount;
        user.totalWeight += stakeWeight;
        user.subYieldRewards = weightToReward(
            user.totalWeight,
            lockedPool.yieldRewardsPerWeight
        );

        // update global variable
        lockedPool.totalLockedWeight += stakeWeight;

        emit Staked(msg.sender, true, addedAmount, stakeWeight);
    }

    function getFlexibleStakeWeight() public view returns (uint256) {
        uint256 flexibleStakeWeight = flexibleStakingUsers[msg.sender]
            .totalWeight;
        return flexibleStakeWeight;
    }

    function getLockedStakeWeight() public view returns (uint256) {
        uint256 lockedStakeWeight = lockedStakingUsers[msg.sender].totalWeight;
        return lockedStakeWeight;
    }

    function stakeInFlexible(uint256 _amount) external nonReentrant {
        require(_amount >= 10 ** 18, "Cannot stake less than 1 STACH");

        // update current yield rewards per weight
        _sync();

        // get a link to user data struct, we will write to it later
        User storage user = flexibleStakingUsers[msg.sender];

        // process current pending rewards if any
        if (user.tokenAmount > 0) {
            _processRewards();
        }

        // pull the stake into the contract
        _transfer(msg.sender, address(this), _amount);
        uint256 addedAmount = _amount;

        // stake weight is only proportional to the staked amount, not the time staked
        uint256 stakeWeight = (WEIGHT_MULTIPLIER) * addedAmount;

        // makes sure stakeWeight is valid
        assert(stakeWeight > 0);
        // create and save the deposit (append it to deposits array)
        Deposit memory deposit = Deposit({
            tokenAmount: addedAmount,
            weight: stakeWeight,
            lockedFrom: 0,
            lockedUntil: 0
        });

        // deposit ID is an index of the deposit in `deposits` array
        user.deposits.push(deposit);
        // update user record
        user.tokenAmount += addedAmount;
        user.totalWeight += stakeWeight;
        user.subYieldRewards = weightToReward(
            user.totalWeight,
            flexiblePool.yieldRewardsPerWeight
        );

        // update global variable
        flexiblePool.totalLockedWeight += stakeWeight;

        emit Staked(msg.sender, false, addedAmount, stakeWeight);
    }

    /**
     * @dev Unstakes a locked pool deposit after its lock period has ended
     *
     * @param _depositId deposit ID to unstake from, zero-indexed
     */
    function unstakeLocked(uint256 _depositId) external nonReentrant {
        // get a link to user data struct, we will write to it later
        User storage user = lockedStakingUsers[msg.sender];
        // get a link to the corresponding deposit, we may write to it later
        Deposit memory stakeDeposit = user.deposits[_depositId];

        // if staker deposit doesn't exist this check will fail
        require(stakeDeposit.tokenAmount > 0, "empty deposit");
        require(
            stakeDeposit.lockedUntil <= block.timestamp,
            "stake is still locked"
        );

        // update smart contract state
        _sync();
        // and process current pending rewards if any
        _processRewards();

        delete user.deposits[_depositId];

        // update user record
        user.tokenAmount -= stakeDeposit.tokenAmount;
        user.totalWeight = user.totalWeight - stakeDeposit.weight;
        user.subYieldRewards = weightToReward(
            user.totalWeight,
            lockedPool.yieldRewardsPerWeight
        );

        // update global variable
        lockedPool.totalLockedWeight =
            lockedPool.totalLockedWeight -
            stakeDeposit.weight;

        balances[address(this)] -= stakeDeposit.tokenAmount;
        balances[msg.sender] += stakeDeposit.tokenAmount;
        emit Transfer(address(this), msg.sender, stakeDeposit.tokenAmount);
        emit Unstaked(msg.sender, true, stakeDeposit.tokenAmount);
    }

    /**
     * @dev Unstakes (part of) a flexible pool deposit at any time
     *
     * @param _depositId deposit ID to unstake from, zero-indexed
     * @param _amount amount of tokens to unstake
     */
    function unstakeFlexible(uint256 _depositId, uint256 _amount)
        external
        nonReentrant
    {
        // get a link to user data struct, we will write to it later
        User storage user = flexibleStakingUsers[msg.sender];
        // get a link to the corresponding deposit, we may write to it later
        Deposit storage stakeDeposit = user.deposits[_depositId];

        // verify an amount is set
        require(_amount > 0, "zero amount");
        // verify available balance
        require(stakeDeposit.tokenAmount >= _amount, "amount exceeds stake");

        // update smart contract state
        _sync();
        // and process current pending rewards if any
        _processRewards();

        // recalculate deposit weight
        uint256 previousWeight = stakeDeposit.weight;
        uint256 newWeight = (WEIGHT_MULTIPLIER) *
            (stakeDeposit.tokenAmount - _amount);

        // update the deposit, or delete it if its depleted
        if (stakeDeposit.tokenAmount - _amount == 0) {
            delete user.deposits[_depositId];
        } else {
            stakeDeposit.tokenAmount -= _amount;
            stakeDeposit.weight = newWeight;
        }

        // update user record
        user.tokenAmount -= _amount;
        user.totalWeight = user.totalWeight - previousWeight + newWeight;
        user.subYieldRewards = weightToReward(
            user.totalWeight,
            flexiblePool.yieldRewardsPerWeight
        );

        // update global variable
        flexiblePool.totalLockedWeight =
            flexiblePool.totalLockedWeight -
            previousWeight +
            newWeight;

        balances[address(this)] -= _amount;
        balances[msg.sender] += _amount;
        emit Transfer(address(this), msg.sender, _amount);
        emit Unstaked(msg.sender, false, _amount);
    }

    /**
     * @dev Converts stake weight to
     *      STACH reward value, applying the 10^12 division on weight
     *
     * @param _weight stake weight
     * @param rewardPerWeight STACH reward per weight
     * @return reward value normalized to 10^12
     */
    function weightToReward(uint256 _weight, uint256 rewardPerWeight)
        public
        pure
        returns (uint256)
    {
        // apply the formula and return
        return (_weight * rewardPerWeight) / REWARD_PER_WEIGHT_MULTIPLIER;
    }

    /**
     * @dev Converts reward STACH value to stake weight,
     *      applying the 10^12 multiplication on the reward
     *      - OR -
     * @dev Converts reward STACH value to reward/weight if stake weight is supplied as second
     *      function parameter instead of reward/weight
     *
     * @param reward yield reward
     * @param rewardPerWeight reward/weight (or stake weight)
     * @return stake weight (or reward/weight)
     */
    function rewardToWeight(uint256 reward, uint256 rewardPerWeight)
        public
        pure
        returns (uint256)
    {
        // apply the reverse formula and return
        return (reward * REWARD_PER_WEIGHT_MULTIPLIER) / rewardPerWeight;
    }

    /**
     * @dev Used internally, mostly by children implementations
     *
     * @dev Updates smart contract state (`yieldRewardsPerWeight`, `lastYieldDistribution`),
     */
    function _sync() internal {
        // sync both pools
        _syncPool(true);
        _syncPool(false);
    }

    function _syncPool(bool isFlexible) internal {
        PoolData memory pool = isFlexible ? flexiblePool : lockedPool;
        uint256 totalStakingWeight = isFlexible
            ? flexiblePool.totalLockedWeight
            : lockedPool.totalLockedWeight;

        // if staking period has finished, return
        if (pool.lastUpdatedTime >= periodFinish) {
            return;
        }

        // to calculate the reward we need to know how many seconds have passed, and reward per second (reward rate)
        uint256 secondsPassed = block.timestamp > periodFinish
            ? periodFinish - pool.lastUpdatedTime
            : block.timestamp - pool.lastUpdatedTime;
        // update lastUpdatedTime
        pool.lastUpdatedTime = block.timestamp > periodFinish
            ? periodFinish
            : block.timestamp;

        // if locking weight is zero - just exit
        if (totalStakingWeight > 0) {
            // calculate the reward
            uint256 stachReward = secondsPassed * pool.rewardsRate;

            // update rewards per weight and `lastUpdatedTime`
            pool.yieldRewardsPerWeight += rewardToWeight(
                stachReward,
                totalStakingWeight
            );

            if (isFlexible) {
                flexiblePool.lastUpdatedTime = pool.lastUpdatedTime;
                flexiblePool.yieldRewardsPerWeight = pool.yieldRewardsPerWeight;
            } else {
                lockedPool.lastUpdatedTime = pool.lastUpdatedTime;
                lockedPool.yieldRewardsPerWeight = pool.yieldRewardsPerWeight;
            }
        }
        // if staking weight is 0, just update last updated time
        /**
         * @dev corner case: if staking weight is 0 for any amount of time t after contract is deployed,
         * those rewards will be missed
         */
        else {
            if (isFlexible) {
                flexiblePool.lastUpdatedTime = pool.lastUpdatedTime;
            } else {
                lockedPool.lastUpdatedTime = pool.lastUpdatedTime;
            }
        }
    }
}
