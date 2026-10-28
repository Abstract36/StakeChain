import { useCallback, useEffect, useState } from "react";

export const BASE_SEPOLIA_ID = "0x14a34"; // 84532

const BASE_SEPOLIA_PARAMS = {
  chainId: BASE_SEPOLIA_ID,
  chainName: "Base Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://sepolia.base.org"],
  blockExplorerUrls: ["https://sepolia.basescan.org"],
};

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

  const ensureBaseSepolia = useCallback(async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BASE_SEPOLIA_ID }],
      });
    } catch (e) {
      if (e.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [BASE_SEPOLIA_PARAMS],
        });
      } else {
        throw e;
      }
    }
    setChainId(BASE_SEPOLIA_ID);
  }, []);

  const connect = useCallback(
    async ({ ensureChain = false } = {}) => {
      if (ensureChain) await ensureBaseSepolia();
      const [addr] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(addr || null);
      setChainId(await window.ethereum.request({ method: "eth_chainId" }));
      return addr;
    },
    [ensureBaseSepolia]
  );

  return { account, chainId, connect, ensureBaseSepolia };
}
