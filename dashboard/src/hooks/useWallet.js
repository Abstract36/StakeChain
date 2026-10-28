import { useCallback, useEffect, useState } from "react";

const CHAINS = {
  base: {
    chainId: "0x2105", // 8453
    chainName: "Base",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://mainnet.base.org"],
    blockExplorerUrls: ["https://base.blockscout.com"],
  },
  baseSepolia: {
    chainId: "0x14a34", // 84532
    chainName: "Base Sepolia",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://sepolia.base.org"],
    blockExplorerUrls: ["https://sepolia.basescan.org"],
  },
};

// Which network the app targets; REACT_APP_CHAIN=base | baseSepolia
export const TARGET_CHAIN = CHAINS[process.env.REACT_APP_CHAIN] || CHAINS.baseSepolia;
export const TARGET_CHAIN_ID = TARGET_CHAIN.chainId;

// Shared injected-wallet state: restores an already-authorized session
// silently (eth_accounts never prompts) and tracks account/chain changes.
export default function useWallet() {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);

  useEffect(() => {
    const eth = window.ethereum;
    if (!eth) return;

    eth.request({ method: "eth_accounts" })
      .then((a) => setAccount(a[0] || null))
      .catch(() => {});
    eth.request({ method: "eth_chainId" }).then(setChainId).catch(() => {});

    const onAccounts = (a) => setAccount(a[0] || null);
    const onChain = (c) => setChainId(c);
    eth.on?.("accountsChanged", onAccounts);
    eth.on?.("chainChanged", onChain);
    return () => {
      eth.removeListener?.("accountsChanged", onAccounts);
      eth.removeListener?.("chainChanged", onChain);
    };
  }, []);

  const ensureTargetChain = useCallback(async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: TARGET_CHAIN_ID }],
      });
    } catch (e) {
      if (e.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [TARGET_CHAIN],
        });
      } else {
        throw e;
      }
    }
    setChainId(TARGET_CHAIN_ID);
  }, []);

  const connect = useCallback(
    async ({ ensureChain = false } = {}) => {
      if (ensureChain) await ensureTargetChain();
      const [addr] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(addr || null);
      setChainId(await window.ethereum.request({ method: "eth_chainId" }));
      return addr;
    },
    [ensureTargetChain]
  );

  return { account, chainId, connect, ensureTargetChain };
}
