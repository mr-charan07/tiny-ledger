import { useState, useEffect, useCallback } from 'react';
import {
  Contract,
  keccak256,
  toUtf8Bytes,
  encodeBytes32String,
  decodeBytes32String,
} from 'ethers';
import { useWeb3 } from '@/contexts/Web3Context';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config/blockchain';
import { toast } from 'sonner';
import type { Block, IoTDevice, Node, IoTTransaction, BlockchainStats } from '@/types/blockchain';

interface ContractDevice {
  deviceAddress: string;
  name: string; // bytes32
  deviceType: string; // bytes32
  isActive: boolean;
  registeredAt: bigint;
  transactionCount: bigint;
  permission: number;
}

interface ContractNode {
  nodeAddress: string;
  name: string; // bytes32
  isValidator: boolean;
  isActive: boolean;
  blocksValidated: bigint;
  lastSeen: bigint;
}

interface ContractDataRecord {
  id: bigint;
  deviceAddress: string;
  deviceName: string; // bytes32
  dataType: string; // bytes32
  value: bigint;
  timestamp: bigint;
  signature: string;
}

const permissionMap: Record<number, 'read' | 'write' | 'admin'> = {
  0: 'read',
  1: 'write',
  2: 'admin',
};

const safeDecodeBytes32 = (value: string) => {
  try {
    return decodeBytes32String(value);
  } catch {
    return value;
  }
};

const safeEncodeBytes32 = (label: string, value: string) => {
  try {
    return encodeBytes32String(value);
  } catch {
    toast.error(`${label} is too long`, {
      description: 'Must be 31 characters or fewer (required for compact on-chain storage).',
    });
    return null;
  }
};

export function useBlockchain() {
  const { provider, signer, isCorrectNetwork } = useWeb3();
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [transactions, setTransactions] = useState<IoTTransaction[]>([]);
  const [stats, setStats] = useState<BlockchainStats | null>(null);
  const [isContractDeployed, setIsContractDeployed] = useState(false);

  // Initialize contract
  useEffect(() => {
    if (!provider || !isCorrectNetwork) {
      setContract(null);
      setIsContractDeployed(false);
      return;
    }

    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS.length < 42) {
      setIsContractDeployed(false);
      return;
    }

    const contractInstance = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer || provider);
    setContract(contractInstance);
    setIsContractDeployed(true);
  }, [provider, signer, isCorrectNetwork]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!contract || !isContractDeployed) return;

    setIsLoading(true);
    try {
      // Fetch stats
      const [totalData, totalDevices, totalNodes, activeDevices, activeNodes] = await contract.getStats();

      setStats({
        totalBlocks: Number(totalData),
        totalTransactions: Number(totalData),
        activeNodes: Number(activeNodes),
        activeDevices: Number(activeDevices),
        avgBlockTime: 12,
        storageUsed: Number(totalData) * 0.001,
      });

      // Fetch devices
      const contractDevices: ContractDevice[] = await contract.getAllDevices();
      const mappedDevices: IoTDevice[] = contractDevices.map((d) => {
        const decodedName = safeDecodeBytes32(d.name);
        const decodedType = safeDecodeBytes32(d.deviceType);
        const normalizedType = (['sensor', 'actuator', 'gateway'] as const).includes(decodedType as any)
          ? (decodedType as 'sensor' | 'actuator' | 'gateway')
          : 'sensor';

        return {
          id: d.deviceAddress,
          name: decodedName,
          type: normalizedType,
          status: d.isActive ? 'online' : 'offline',
          lastReading: new Date(Number(d.registeredAt) * 1000),
          transactionCount: Number(d.transactionCount),
          permission: permissionMap[d.permission] || 'read',
        };
      });
      setDevices(mappedDevices);

      // Fetch nodes
      const contractNodes: ContractNode[] = await contract.getAllNodes();
      const mappedNodes: Node[] = contractNodes.map((n) => ({
        id: n.nodeAddress,
        name: safeDecodeBytes32(n.name),
        address: n.nodeAddress,
        status: n.isActive ? 'active' : 'inactive',
        role: n.isValidator ? 'validator' : 'observer',
        lastSeen: new Date(Number(n.lastSeen) * 1000),
        blocksValidated: Number(n.blocksValidated),
      }));
      setNodes(mappedNodes);

      // Fetch recent data/transactions
      const dataCount = Number(totalData);
      if (dataCount > 0) {
        const recentData: ContractDataRecord[] = await contract.getRecentData(Math.min(dataCount, 10));
        const mappedTransactions: IoTTransaction[] = recentData.map((d) => {
          const deviceName = safeDecodeBytes32(d.deviceName);
          const dataType = safeDecodeBytes32(d.dataType);

          return {
            id: `tx-${d.id.toString()}`,
            deviceId: d.deviceAddress,
            deviceName,
            data: { [dataType]: Number(d.value) },
            timestamp: new Date(Number(d.timestamp) * 1000),
            signature: d.signature.slice(0, 18),
          };
        });
        setTransactions(mappedTransactions);
      }
    } catch (error) {
      console.error('Error fetching blockchain data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [contract, isContractDeployed]);

  // Auto-fetch on mount and contract change
  useEffect(() => {
    if (isContractDeployed) {
      fetchData();
    }
  }, [isContractDeployed, fetchData]);

  // Register a device
  const registerDevice = useCallback(
    async (deviceAddress: string, name: string, deviceType: string, permission: number) => {
      if (!contract || !signer) {
        toast.error('Wallet not connected');
        return false;
      }

      const encodedName = safeEncodeBytes32('Device name', name);
      const encodedType = safeEncodeBytes32('Device type', deviceType);
      if (!encodedName || !encodedType) return false;

      try {
        setIsLoading(true);
        const tx = await contract.registerDevice(deviceAddress, encodedName, encodedType, permission);
        toast.info('Transaction submitted', { description: 'Waiting for confirmation...' });
        await tx.wait();
        toast.success('Device registered successfully');
        await fetchData();
        return true;
      } catch (error: unknown) {
        console.error('Error registering device:', error);
        const err = error as { reason?: string };
        toast.error('Failed to register device', { description: err.reason || 'Transaction failed' });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [contract, signer, fetchData]
  );

  // Register a node
  const registerNode = useCallback(
    async (nodeAddress: string, name: string, isValidator: boolean) => {
      if (!contract || !signer) {
        toast.error('Wallet not connected');
        return false;
      }

      const encodedName = safeEncodeBytes32('Node name', name);
      if (!encodedName) return false;

      try {
        setIsLoading(true);
        const tx = await contract.registerNode(nodeAddress, encodedName, isValidator);
        toast.info('Transaction submitted', { description: 'Waiting for confirmation...' });
        await tx.wait();
        toast.success('Node registered successfully');
        await fetchData();
        return true;
      } catch (error: unknown) {
        console.error('Error registering node:', error);
        const err = error as { reason?: string };
        toast.error('Failed to register node', { description: err.reason || 'Transaction failed' });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [contract, signer, fetchData]
  );

  // Record IoT data
  const recordData = useCallback(
    async (deviceName: string, dataType: string, value: number) => {
      if (!contract || !signer) {
        toast.error('Wallet not connected');
        return false;
      }

      const encodedDeviceName = safeEncodeBytes32('Device name', deviceName);
      const encodedDataType = safeEncodeBytes32('Data type', dataType);
      if (!encodedDeviceName || !encodedDataType) return false;

      try {
        setIsLoading(true);
        const signature = keccak256(toUtf8Bytes(`${deviceName}${dataType}${value}${Date.now()}`));
        const tx = await contract.recordData(encodedDeviceName, encodedDataType, value, signature);
        toast.info('Transaction submitted', { description: 'Waiting for confirmation...' });
        await tx.wait();
        toast.success('Data recorded on blockchain');
        await fetchData();
        return true;
      } catch (error: unknown) {
        console.error('Error recording data:', error);
        const err = error as { reason?: string };
        toast.error('Failed to record data', { description: err.reason || 'Transaction failed' });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [contract, signer, fetchData]
  );

  // Generate blocks from transactions (for visualization)
  const blocks: Block[] = transactions.reduce<Block[]>((acc, tx, index) => {
    const blockIndex = Math.floor(index / 3);
    if (!acc[blockIndex]) {
      acc[blockIndex] = {
        id: `block-${blockIndex}`,
        index: blockIndex + 1,
        timestamp: tx.timestamp,
        hash: keccak256(toUtf8Bytes(`block-${blockIndex}-${tx.timestamp.getTime()}`)),
        previousHash:
          blockIndex > 0
            ? keccak256(toUtf8Bytes(`block-${blockIndex - 1}`))
            : '0x0000000000000000000000000000000000000000000000000000000000000000',
        data: [],
        nonce: Math.floor(Math.random() * 100000),
        validator: nodes[0]?.id || 'unknown',
      };
    }
    acc[blockIndex].data.push(tx);
    return acc;
  }, []);

  return {
    isLoading,
    isContractDeployed,
    devices,
    nodes,
    transactions,
    blocks,
    stats,
    registerDevice,
    registerNode,
    recordData,
    fetchData,
  };
}
