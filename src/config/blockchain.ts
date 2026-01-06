// Sepolia Testnet Configuration
export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7';

export const SEPOLIA_NETWORK = {
  chainId: SEPOLIA_CHAIN_ID_HEX,
  chainName: 'Sepolia Testnet',
  nativeCurrency: {
    name: 'Sepolia ETH',
    symbol: 'SEP',
    decimals: 18,
  },
  rpcUrls: ['https://sepolia.infura.io/v3/'],
  blockExplorerUrls: ['https://sepolia.etherscan.io/'],
};

// ============================================
// DEPLOY THE CONTRACT AND PASTE ADDRESS HERE
// ============================================
export const CONTRACT_ADDRESS = '';

// Contract ABI - Ultra minimal proof-only contract
export const CONTRACT_ABI = [
  // Events
  "event DataRecorded(uint256 indexed id, address indexed sender, bytes32 dataHash)",

  // View functions
  "function owner() view returns (address)",
  "function recordCount() view returns (uint256)",

  // Write functions
  "function record(bytes32 _hash) returns (uint256)",
  "function transferOwnership(address _newOwner)",
] as const;

export const ETHERSCAN_URL = 'https://sepolia.etherscan.io';

export const getEtherscanLink = (type: 'tx' | 'address' | 'block', value: string) => {
  return `${ETHERSCAN_URL}/${type}/${value}`;
};
