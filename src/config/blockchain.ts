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

// Contract ABI - matches minimal IoTBlockchain.sol
export const CONTRACT_ABI = [
  // Events
  "event DataRecorded(uint256 indexed id, address indexed device, bytes32 dataHash)",
  "event DeviceAdded(address indexed device, bytes32 name)",
  "event NodeAdded(address indexed node, bytes32 name)",

  // View functions
  "function owner() view returns (address)",
  "function dataCount() view returns (uint256)",
  "function deviceCount() view returns (uint256)",
  "function nodeCount() view returns (uint256)",
  "function records(uint256) view returns (address device, bytes32 dataHash, uint256 timestamp)",
  "function devices(address) view returns (bytes32 name, bool active, uint8 perm)",
  "function nodes(address) view returns (bytes32 name, bool active, bool validator)",
  "function getRecord(uint256 _id) view returns (address, bytes32, uint256)",
  "function getDevice(address _addr) view returns (bytes32, bool, uint8)",
  "function getNode(address _addr) view returns (bytes32, bool, bool)",
  "function getDeviceAt(uint256 _index) view returns (address)",
  "function getNodeAt(uint256 _index) view returns (address)",

  // Write functions
  "function addDevice(address _addr, bytes32 _name, uint8 _perm)",
  "function addNode(address _addr, bytes32 _name, bool _validator)",
  "function record(bytes32 _hash)",
  "function setDeviceActive(address _addr, bool _active)",
  "function setNodeActive(address _addr, bool _active)",
] as const;

export const ETHERSCAN_URL = 'https://sepolia.etherscan.io';

export const getEtherscanLink = (type: 'tx' | 'address' | 'block', value: string) => {
  return `${ETHERSCAN_URL}/${type}/${value}`;
};
