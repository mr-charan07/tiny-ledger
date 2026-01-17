import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { BrowserProvider, JsonRpcSigner, Eip1193Provider } from 'ethers';
import { SEPOLIA_CHAIN_ID, SEPOLIA_NETWORK, SEPOLIA_CHAIN_ID_HEX } from '@/config/blockchain';
import { toast } from 'sonner';

interface EthereumProvider extends Eip1193Provider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

interface Web3ContextType {
  account: string | null;
  chainId: number | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  isConnecting: boolean;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToSepolia: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | null>(null);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isManuallyDisconnected, setIsManuallyDisconnected] = useState(() => {
    return localStorage.getItem('wallet_disconnected') === 'true';
  });

  const isConnected = !!account && !isManuallyDisconnected;
  const isCorrectNetwork = chainId === SEPOLIA_CHAIN_ID;

  const updateChainId = useCallback(async (newProvider: BrowserProvider) => {
    try {
      const network = await newProvider.getNetwork();
      setChainId(Number(network.chainId));
    } catch (error) {
      console.error('Error getting chain ID:', error);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      toast.error('MetaMask not detected', {
        description: 'Please install MetaMask to use this application',
      });
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);

    try {
      const browserProvider = new BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);

      if (accounts.length > 0) {
        const userSigner = await browserProvider.getSigner();
        setAccount(accounts[0]);
        setProvider(browserProvider);
        setSigner(userSigner);
        setIsManuallyDisconnected(false);
        localStorage.removeItem('wallet_disconnected');
        await updateChainId(browserProvider);

        toast.success('Wallet connected', {
          description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        });
      }
    } catch (error: unknown) {
      console.error('Error connecting wallet:', error);
      const err = error as { code?: number };
      if (err.code === 4001) {
        toast.error('Connection rejected', {
          description: 'You rejected the connection request',
        });
      } else {
        toast.error('Connection failed', {
          description: 'Failed to connect to MetaMask',
        });
      }
    } finally {
      setIsConnecting(false);
    }
  }, [updateChainId]);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    setIsManuallyDisconnected(true);
    localStorage.setItem('wallet_disconnected', 'true');
    toast.info('Wallet disconnected');
  }, []);

  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
      });
    } catch (error: unknown) {
      const err = error as { code?: number };
      // Chain not added, try to add it
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SEPOLIA_NETWORK],
          });
        } catch (addError) {
          console.error('Error adding Sepolia network:', addError);
          toast.error('Failed to add Sepolia network');
        }
      } else {
        console.error('Error switching network:', error);
        toast.error('Failed to switch network');
      }
    }
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        if (provider) {
          provider.getSigner().then(setSigner);
        }
      }
    };

    const handleChainChanged = (newChainId: string) => {
      setChainId(parseInt(newChainId, 16));
      // Reload provider on chain change
      if (account) {
        const browserProvider = new BrowserProvider(window.ethereum);
        setProvider(browserProvider);
        browserProvider.getSigner().then(setSigner);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Check if already connected (only if not manually disconnected)
    if (!isManuallyDisconnected) {
      window.ethereum
        .request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            const browserProvider = new BrowserProvider(window.ethereum);
            setAccount(accounts[0]);
            setProvider(browserProvider);
            browserProvider.getSigner().then(setSigner);
            updateChainId(browserProvider);
          }
        })
        .catch(console.error);
    }

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [account, provider, disconnectWallet, updateChainId, isManuallyDisconnected]);

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        provider,
        signer,
        isConnecting,
        isConnected,
        isCorrectNetwork,
        connectWallet,
        disconnectWallet,
        switchToSepolia,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}
