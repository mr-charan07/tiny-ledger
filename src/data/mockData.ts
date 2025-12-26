import { Block, Node, IoTDevice, BlockchainStats, IoTTransaction } from '@/types/blockchain';

const generateHash = () => {
  return '0x' + Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
};

const generateShortHash = () => {
  return Array.from({ length: 8 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
};

export const mockTransactions: IoTTransaction[] = [
  {
    id: 'tx-001',
    deviceId: 'dev-001',
    deviceName: 'Temp Sensor A1',
    data: { temperature: 23.5, humidity: 45 },
    timestamp: new Date(Date.now() - 120000),
    signature: generateShortHash(),
  },
  {
    id: 'tx-002',
    deviceId: 'dev-002',
    deviceName: 'Motion Sensor B2',
    data: { motion: 1, zone: 'A' },
    timestamp: new Date(Date.now() - 180000),
    signature: generateShortHash(),
  },
  {
    id: 'tx-003',
    deviceId: 'dev-003',
    deviceName: 'Power Meter C3',
    data: { power: 1250, voltage: 220 },
    timestamp: new Date(Date.now() - 240000),
    signature: generateShortHash(),
  },
];

export const mockBlocks: Block[] = [
  {
    id: 'block-001',
    index: 1247,
    timestamp: new Date(Date.now() - 60000),
    hash: generateHash(),
    previousHash: generateHash(),
    data: mockTransactions.slice(0, 2),
    nonce: 42156,
    validator: 'node-001',
  },
  {
    id: 'block-002',
    index: 1246,
    timestamp: new Date(Date.now() - 120000),
    hash: generateHash(),
    previousHash: generateHash(),
    data: [mockTransactions[2]],
    nonce: 38291,
    validator: 'node-002',
  },
  {
    id: 'block-003',
    index: 1245,
    timestamp: new Date(Date.now() - 180000),
    hash: generateHash(),
    previousHash: generateHash(),
    data: mockTransactions,
    nonce: 55123,
    validator: 'node-001',
  },
  {
    id: 'block-004',
    index: 1244,
    timestamp: new Date(Date.now() - 240000),
    hash: generateHash(),
    previousHash: generateHash(),
    data: mockTransactions.slice(0, 1),
    nonce: 29847,
    validator: 'node-003',
  },
  {
    id: 'block-005',
    index: 1243,
    timestamp: new Date(Date.now() - 300000),
    hash: generateHash(),
    previousHash: generateHash(),
    data: mockTransactions.slice(1, 3),
    nonce: 61234,
    validator: 'node-002',
  },
];

export const mockNodes: Node[] = [
  {
    id: 'node-001',
    name: 'Primary Validator',
    address: '192.168.1.100:8545',
    status: 'active',
    role: 'validator',
    lastSeen: new Date(),
    blocksValidated: 523,
  },
  {
    id: 'node-002',
    name: 'Secondary Validator',
    address: '192.168.1.101:8545',
    status: 'active',
    role: 'validator',
    lastSeen: new Date(Date.now() - 30000),
    blocksValidated: 412,
  },
  {
    id: 'node-003',
    name: 'Edge Node Alpha',
    address: '192.168.1.102:8545',
    status: 'syncing',
    role: 'validator',
    lastSeen: new Date(Date.now() - 60000),
    blocksValidated: 289,
  },
  {
    id: 'node-004',
    name: 'Observer Node',
    address: '192.168.1.103:8545',
    status: 'active',
    role: 'observer',
    lastSeen: new Date(Date.now() - 15000),
    blocksValidated: 0,
  },
  {
    id: 'node-005',
    name: 'Backup Validator',
    address: '192.168.1.104:8545',
    status: 'inactive',
    role: 'validator',
    lastSeen: new Date(Date.now() - 3600000),
    blocksValidated: 156,
  },
];

export const mockDevices: IoTDevice[] = [
  {
    id: 'dev-001',
    name: 'Temp Sensor A1',
    type: 'sensor',
    status: 'online',
    lastReading: new Date(Date.now() - 30000),
    transactionCount: 1523,
    permission: 'write',
  },
  {
    id: 'dev-002',
    name: 'Motion Sensor B2',
    type: 'sensor',
    status: 'online',
    lastReading: new Date(Date.now() - 45000),
    transactionCount: 892,
    permission: 'write',
  },
  {
    id: 'dev-003',
    name: 'Power Meter C3',
    type: 'sensor',
    status: 'online',
    lastReading: new Date(Date.now() - 60000),
    transactionCount: 2341,
    permission: 'write',
  },
  {
    id: 'dev-004',
    name: 'Smart Switch D4',
    type: 'actuator',
    status: 'warning',
    lastReading: new Date(Date.now() - 300000),
    transactionCount: 156,
    permission: 'admin',
  },
  {
    id: 'dev-005',
    name: 'Gateway Hub E5',
    type: 'gateway',
    status: 'online',
    lastReading: new Date(),
    transactionCount: 5621,
    permission: 'admin',
  },
  {
    id: 'dev-006',
    name: 'Pressure Sensor F6',
    type: 'sensor',
    status: 'offline',
    lastReading: new Date(Date.now() - 7200000),
    transactionCount: 423,
    permission: 'read',
  },
];

export const mockStats: BlockchainStats = {
  totalBlocks: 1247,
  totalTransactions: 15823,
  activeNodes: 4,
  activeDevices: 5,
  avgBlockTime: 2.3,
  storageUsed: 12.4,
};
