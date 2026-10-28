// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title RevenueDistributor — real-yield payouts to STACH stakers
 *
 * @notice x402 API revenue (USDC) is distributed in epochs. For each epoch
 *         an off-chain snapshot of staking weights (scripts/revenue-snapshot.js,
 *         fully reproducible from chain state at a stated block) is committed
 *         as a Merkle root together with the USDC it covers. Stakers claim
 *         their share with a proof; whatever stays unclaimed for 180 days can
 *         be swept back by the owner into the next epoch.
 *
 * @dev Leaf = keccak256(bytes.concat(keccak256(abi.encode(account, amount))))
 *      (OpenZeppelin StandardMerkleTree compatible).
 */
contract RevenueDistributor {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    address public owner;

    struct Epoch {
        bytes32 root;
        uint128 total;
        uint128 claimedTotal;
        uint64 createdAt;
        uint64 snapshotBlock;
    }

    Epoch[] public epochs;
    mapping(uint256 => mapping(address => bool)) public claimed;

    uint256 public constant SWEEP_DELAY = 180 days;

    event EpochAdded(uint256 indexed id, bytes32 root, uint256 amount, uint64 snapshotBlock);
    event Claimed(uint256 indexed id, address indexed account, uint256 amount);
    event Swept(uint256 indexed id, uint256 amount);
    event OwnerChanged(address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor(IERC20 _usdc, address _owner) {
        require(_owner != address(0), "owner zero");
        usdc = _usdc;
        owner = _owner;
    }

    function epochCount() external view returns (uint256) {
        return epochs.length;
    }

    /// @notice Funds and opens a new distribution epoch.
    function addEpoch(bytes32 root, uint256 amount, uint64 snapshotBlock)
        external
        onlyOwner
        returns (uint256 id)
    {
        require(root != bytes32(0), "empty root");
        require(amount > 0, "zero amount");
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        epochs.push(
            Epoch({
                root: root,
                total: uint128(amount),
                claimedTotal: 0,
                createdAt: uint64(block.timestamp),
                snapshotBlock: snapshotBlock
            })
        );
        id = epochs.length - 1;
        emit EpochAdded(id, root, amount, snapshotBlock);
    }

    /// @notice Claims the caller's share of an epoch.
    function claim(uint256 id, uint256 amount, bytes32[] calldata proof) external {
        Epoch storage e = epochs[id];
        require(!claimed[id][msg.sender], "already claimed");
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender, amount))));
        require(MerkleProof.verifyCalldata(proof, e.root, leaf), "bad proof");

        claimed[id][msg.sender] = true;
        e.claimedTotal += uint128(amount);
        require(e.claimedTotal <= e.total, "epoch overdrawn");

        usdc.safeTransfer(msg.sender, amount);
        emit Claimed(id, msg.sender, amount);
    }

    /// @notice Returns unclaimed funds of an old epoch to the owner.
    function sweep(uint256 id) external onlyOwner {
        Epoch storage e = epochs[id];
        require(block.timestamp >= e.createdAt + SWEEP_DELAY, "too early");
        uint256 left = e.total - e.claimedTotal;
        require(left > 0, "nothing left");
        e.claimedTotal = e.total;
        usdc.safeTransfer(owner, left);
        emit Swept(id, left);
    }

    function setOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "owner zero");
        owner = newOwner;
        emit OwnerChanged(newOwner);
    }
}
