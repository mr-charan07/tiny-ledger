export interface Block {
  id: string;
  index: number;
  timestamp: Date;
  hash: string;
  previousHash: string;
  data: IoTTransaction[];
  nonce: number;
  validator: string;
}

export interface IoTTransaction {
  id: string;
  deviceId: string;
  deviceName: string;
  data: Record<string, number | string | null | undefined>;
  timestamp: Date;
  signature: string;
  txHash?: string | null;
}

export interface Node {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'inactive' | 'syncing';
  role: 'validator' | 'observer';
  lastSeen: Date;
  blocksValidated: number;
}

export interface IoTDevice {
  id: string;
  name: string;
  type: 'sensor' | 'actuator' | 'gateway';
  status: 'online' | 'offline' | 'warning';
  lastReading: Date;
  transactionCount: number;
  permission: 'read' | 'write' | 'admin';
  address?: string;
}

export interface BlockchainStats {
  totalBlocks: number;
  totalTransactions: number;
  verifiedTransactions: number;
  activeNodes: number;
  activeDevices: number;
  avgBlockTime: number;
  storageUsed: number;
}
