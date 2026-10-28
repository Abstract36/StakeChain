// Builds the Merkle snapshot for a RevenueDistributor epoch.
//
//   BLOCK=<height> AMOUNT_USDC=<e.g. 12.5> npx hardhat run scripts/revenue-snapshot.js --network base
//
// Stakers are discovered from Staked events; each user's share is their
// combined staking weight (flex + locked) read via eth_call AT THE SNAPSHOT
// BLOCK, so the snapshot is reproducible by anyone from public state.
const hre = require("hardhat");
const fs = require("fs");

const STACH = "0x82c5f9901CD9AEE3177053482b79aEA235507166";
const DEPLOY_BLOCK = 53190000;

const { keccak256, defaultAbiCoder, concat } = hre.ethers.utils;
const leafOf = (account, amount) =>
  keccak256(keccak256(defaultAbiCoder.encode(["address", "uint256"], [account, amount])));
const hashPair = (a, b) =>
  keccak256(concat([a, b].sort((x, y) => (x.toLowerCase() < y.toLowerCase() ? -1 : 1))));

function buildTree(leaves) {
  let level = [...leaves].sort();
  const levels = [level];
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(i + 1 < level.length ? hashPair(level[i], level[i + 1]) : level[i]);
    }
    level = next;
    levels.push(level);
  }
  const proofFor = (leaf) => {
    const proof = [];
    let idx = levels[0].indexOf(leaf);
    for (let l = 0; l < levels.length - 1; l++) {
      const sib = idx ^ 1;
      if (sib < levels[l].length) proof.push(levels[l][sib]);
      idx = Math.floor(idx / 2);
    }
    return proof;
  };
  return { root: level[0], proofFor };
}

async function main() {
  const block = Number(process.env.BLOCK);
  const amountUsdc = process.env.AMOUNT_USDC;
  if (!block || !amountUsdc) throw new Error("set BLOCK and AMOUNT_USDC");
  const total = hre.ethers.utils.parseUnits(amountUsdc, 6);

  const c = await hre.ethers.getContractAt(
    [
      "event Staked(address indexed user, bool indexed locked, uint256 amount, uint256 weight)",
      "function flexibleStakingUsers(address) view returns (uint256 tokenAmount, uint256 totalWeight, uint256 subYieldRewards)",
      "function lockedStakingUsers(address) view returns (uint256 tokenAmount, uint256 totalWeight, uint256 subYieldRewards)",
    ],
    STACH
  );

  const events = await c.queryFilter(c.filters.Staked(), DEPLOY_BLOCK, block);
  const users = [...new Set(events.map((e) => e.args.user))];
  console.log(`stakers ever seen: ${users.length} · snapshot block ${block}`);

  const weights = [];
  let totalWeight = hre.ethers.BigNumber.from(0);
  for (const u of users) {
    const [f, l] = await Promise.all([
      c.flexibleStakingUsers(u, { blockTag: block }),
      c.lockedStakingUsers(u, { blockTag: block }),
    ]);
    const w = f.totalWeight.add(l.totalWeight);
    if (!w.isZero()) {
      weights.push([u, w]);
      totalWeight = totalWeight.add(w);
    }
  }
  if (totalWeight.isZero()) throw new Error("no active stakers at that block");

  const claims = weights.map(([u, w]) => [u, total.mul(w).div(totalWeight)]);
  const leaves = claims.map(([u, a]) => leafOf(u, a));
  const tree = buildTree(leaves);

  const out = {
    snapshotBlock: block,
    totalUsdc: total.toString(),
    root: tree.root,
    claims: Object.fromEntries(
      claims.map(([u, a]) => [
        u,
        { amount: a.toString(), proof: tree.proofFor(leafOf(u, a)) },
      ])
    ),
  };
  const file = `snapshots/epoch-${block}.json`;
  fs.mkdirSync("snapshots", { recursive: true });
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log(`root: ${tree.root}`);
  console.log(`claimants: ${claims.length} · written: ${file}`);
  console.log("next: distributor.addEpoch(root, totalUsdc, snapshotBlock) after approving USDC");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
