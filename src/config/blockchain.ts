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
export const CONTRACT_ADDRESS = 'YOUR_CONTRACT_ADDRESS_HERE';

// Contract ABI - matches IoTBlockchain.sol
export const CONTRACT_ABI = [
  // Events
  "event DataRecorded(uint256 indexed id, address indexed device, bytes32 deviceName, bytes32 dataType, int256 value, uint256 timestamp)",
  "event DeviceRegistered(address indexed deviceAddress, bytes32 name, bytes32 deviceType, uint8 permission)",
  "event DeviceStatusChanged(address indexed deviceAddress, bool isActive)",
  "event NodeRegistered(address indexed nodeAddress, bytes32 name, bool isValidator)",
  "event NodeStatusChanged(address indexed nodeAddress, bool isActive)",
  "event PermissionChanged(address indexed deviceAddress, uint8 newPermission)",

  // View functions
  "function owner() view returns (address)",
  "function dataCount() view returns (uint256)",
  "function deviceCount() view returns (uint256)",
  "function nodeCount() view returns (uint256)",
  "function getDataRecord(uint256 _id) view returns (tuple(uint256 id, address deviceAddress, bytes32 deviceName, bytes32 dataType, int256 value, uint256 timestamp, bytes32 signature))",
  "function getRecentData(uint256 _count) view returns (tuple(uint256 id, address deviceAddress, bytes32 deviceName, bytes32 dataType, int256 value, uint256 timestamp, bytes32 signature)[])",
  "function getAllDevices() view returns (tuple(address deviceAddress, bytes32 name, bytes32 deviceType, bool isActive, uint256 registeredAt, uint256 transactionCount, uint8 permission)[])",
  "function getAllNodes() view returns (tuple(address nodeAddress, bytes32 name, bool isValidator, bool isActive, uint256 blocksValidated, uint256 lastSeen)[])",
  "function getDevice(address _deviceAddress) view returns (tuple(address deviceAddress, bytes32 name, bytes32 deviceType, bool isActive, uint256 registeredAt, uint256 transactionCount, uint8 permission))",
  "function getNode(address _nodeAddress) view returns (tuple(address nodeAddress, bytes32 name, bool isValidator, bool isActive, uint256 blocksValidated, uint256 lastSeen))",
  "function getStats() view returns (uint256 totalData, uint256 totalDevices, uint256 totalNodes, uint256 activeDevices, uint256 activeNodes)",
  "function authorizedDevices(address) view returns (bool)",
  "function authorizedNodes(address) view returns (bool)",

  // Write functions
  "function registerDevice(address _deviceAddress, bytes32 _name, bytes32 _deviceType, uint8 _permission)",
  "function setDeviceStatus(address _deviceAddress, bool _isActive)",
  "function setDevicePermission(address _deviceAddress, uint8 _permission)",
  "function registerNode(address _nodeAddress, bytes32 _name, bool _isValidator)",
  "function setNodeStatus(address _nodeAddress, bool _isActive)",
  "function updateNodeLastSeen(address _nodeAddress)",
  "function recordData(bytes32 _deviceName, bytes32 _dataType, int256 _value, bytes32 _signature) returns (uint256)",
  "function transferOwnership(address _newOwner)",
] as const;

export const ETHERSCAN_URL = 'https://sepolia.etherscan.io';

export const getEtherscanLink = (type: 'tx' | 'address' | 'block', value: string) => {
  return `${ETHERSCAN_URL}/${type}/${value}`;
};
