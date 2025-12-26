import { useState, useEffect, useCallback } from 'react';
import { Contract, keccak256, toUtf8Bytes } from 'ethers';
import { useWeb3 } from '@/contexts/Web3Context';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config/blockchain';
import { toast } from 'sonner';
import type { Block, IoTDevice, Node, IoTTransaction, BlockchainStats } from '@/types/blockchain';

interface ContractDevice {
  deviceAddress: string;
  name: string;
  deviceType: string;
  isActive: boolean;
  registeredAt: bigint;
  transactionCount: bigint;
  permission: number;
}

interface ContractNode {
  nodeAddress: string;
  name: string;
  isValidator: boolean;
  isActive: boolean;
  blocksValidated: bigint;
  lastSeen: bigint;
}

interface ContractDataRecord {
  id: bigint;
  deviceAddress: string;
  deviceName: string;
  dataType: string;
  value: bigint;
  timestamp: bigint;
  signature: string;
}

const permissionMap: Record<number, 'read' | 'write' | 'admin'> = {
  0: 'read',
  1: 'write',
  2: 'admin',
};

export function useBlockchain() {
  const { provider, signer, isConnected, isCorrectNetwork } = useWeb3();
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

    if (CONTRACT_ADDRESS === 'YOUR_CONTRACT_ADDRESS_HERE') {
      setIsContractDeployed(false);
      return;
    }

    const contractInstance = new Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer || provider
    );
    setContract(contractInstance);
    setIsContractDeployed(true);
  }, [provider, signer, isCorrectNetwork]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!contract || !isContractDeployed) return;

    setIsLoading(true);
    try {
      // Fetch stats
      const [totalData, totalDevices, totalNodes, activeDevices, activeNodes] = 
        await contract.getStats();
      
      setStats({
        totalBlocks: Number(totalData),
        totalTransactions: Number(totalData),
        activeNodes: Number(activeNodes),
        activeDevices: Number(activeDevices),
        avgBlockTime: 12, // Ethereum average block time
        storageUsed: Number(totalData) * 0.001, // Approximate
      });

      // Fetch devices
      const contractDevices: ContractDevice[] = await contract.getAllDevices();
      const mappedDevices: IoTDevice[] = contractDevices.map((d) => ({
        id: d.deviceAddress,
        name: d.name,
        type: d.deviceType as 'sensor' | 'actuator' | 'gateway',
        status: d.isActive ? 'online' : 'offline',
        lastReading: new Date(Number(d.registeredAt) * 1000),
        transactionCount: Number(d.transactionCount),
        permission: permissionMap[d.permission] || 'read',
      }));
      setDevices(mappedDevices);

      // Fetch nodes
      const contractNodes: ContractNode[] = await contract.getAllNodes();
      const mappedNodes: Node[] = contractNodes.map((n) => ({
        id: n.nodeAddress,
        name: n.name,
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
        const mappedTransactions: IoTTransaction[] = recentData.map((d) => ({
          id: `tx-${d.id.toString()}`,
          deviceId: d.deviceAddress,
          deviceName: d.deviceName,
          data: { [d.dataType]: Number(d.value) },
          timestamp: new Date(Number(d.timestamp) * 1000),
          signature: d.signature.slice(0, 18),
        }));
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
  const registerDevice = useCallback(async (
    deviceAddress: string,
    name: string,
    deviceType: string,
    permission: number
  ) => {
    if (!contract || !signer) {
      toast.error('Wallet not connected');
      return false;
    }

    try {
      setIsLoading(true);
      const tx = await contract.registerDevice(deviceAddress, name, deviceType, permission);
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
  }, [contract, signer, fetchData]);

  // Register a node
  const registerNode = useCallback(async (
    nodeAddress: string,
    name: string,
    isValidator: boolean
  ) => {
    if (!contract || !signer) {
      toast.error('Wallet not connected');
      return false;
    }

    try {
      setIsLoading(true);
      const tx = await contract.registerNode(nodeAddress, name, isValidator);
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
  }, [contract, signer, fetchData]);

  // Record IoT data
  const recordData = useCallback(async (
    deviceName: string,
    dataType: string,
    value: number
  ) => {
    if (!contract || !signer) {
      toast.error('Wallet not connected');
      return false;
    }

    try {
      setIsLoading(true);
      const signature = keccak256(toUtf8Bytes(`${deviceName}${dataType}${value}${Date.now()}`));
      const tx = await contract.recordData(deviceName, dataType, value, signature);
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
  }, [contract, signer, fetchData]);

  // Generate blocks from transactions (for visualization)
  const blocks: Block[] = transactions.reduce<Block[]>((acc, tx, index) => {
    const blockIndex = Math.floor(index / 3);
    if (!acc[blockIndex]) {
      acc[blockIndex] = {
        id: `block-${blockIndex}`,
        index: blockIndex + 1,
        timestamp: tx.timestamp,
        hash: keccak256(toUtf8Bytes(`block-${blockIndex}-${tx.timestamp.getTime()}`)),
        previousHash: blockIndex > 0 
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
