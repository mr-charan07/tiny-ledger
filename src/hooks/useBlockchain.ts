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
  const [hasFetched, setHasFetched] = useState(false);
  const [contractError, setContractError] = useState(false);

  // Initialize contract
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!provider || !isCorrectNetwork) {
        setContract(null);
        setIsContractDeployed(false);
        setHasFetched(false);
        setContractError(false);
        return;
      }

      if (!CONTRACT_ADDRESS || (CONTRACT_ADDRESS as string).length < 42) {
        setIsContractDeployed(false);
        return;
      }

      try {
        const code = await provider.getCode(CONTRACT_ADDRESS);
        if (cancelled) return;

        if (!code || code === '0x') {
          setContract(null);
          setIsContractDeployed(false);
          setHasFetched(false);
          setContractError(false);
          return;
        }

        const contractInstance = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer || provider);
        setContract(contractInstance);
        setIsContractDeployed(true);
        setContractError(false);
      } catch (e) {
        console.error('Error initializing contract:', e);
        setContract(null);
        setIsContractDeployed(false);
        setHasFetched(false);
        setContractError(true);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [provider, signer, isCorrectNetwork]);

  // Fetch all data using individual getters
  const fetchData = useCallback(async () => {
    if (!contract || !isContractDeployed || contractError) return;
    if (isLoading) return;

    setIsLoading(true);
    try {
      // Fetch counts
      const [dataCountBN, deviceCountBN, nodeCountBN] = await Promise.all([
        contract.dataCount(),
        contract.deviceCount(),
        contract.nodeCount(),
      ]);

      const totalData = Number(dataCountBN);
      const totalDevices = Number(deviceCountBN);
      const totalNodes = Number(nodeCountBN);

      // Fetch devices by iterating
      const devicePromises: Promise<{ addr: string; name: string; active: boolean; perm: number }>[] = [];
      for (let i = 0; i < totalDevices; i++) {
        devicePromises.push(
          (async () => {
            const addr = await contract.getDeviceAt(i);
            const [name, active, perm] = await contract.getDevice(addr);
            return { addr, name, active, perm };
          })()
        );
      }
      const deviceResults = await Promise.all(devicePromises);

      const mappedDevices: IoTDevice[] = deviceResults.map((d) => ({
        id: d.addr,
        name: safeDecodeBytes32(d.name),
        type: 'sensor' as const,
        status: d.active ? 'online' : 'offline',
        lastReading: new Date(),
        transactionCount: 0,
        permission: permissionMap[d.perm] || 'read',
      }));
      setDevices(mappedDevices);

      // Fetch nodes by iterating
      const nodePromises: Promise<{ addr: string; name: string; active: boolean; validator: boolean }>[] = [];
      for (let i = 0; i < totalNodes; i++) {
        nodePromises.push(
          (async () => {
            const addr = await contract.getNodeAt(i);
            const [name, active, validator] = await contract.getNode(addr);
            return { addr, name, active, validator };
          })()
        );
      }
      const nodeResults = await Promise.all(nodePromises);

      const mappedNodes: Node[] = nodeResults.map((n) => ({
        id: n.addr,
        name: safeDecodeBytes32(n.name),
        address: n.addr,
        status: n.active ? 'active' : 'inactive',
        role: n.validator ? 'validator' : 'observer',
        lastSeen: new Date(),
        blocksValidated: 0,
      }));
      setNodes(mappedNodes);

      // Fetch recent records (last 10)
      const recordCount = Math.min(totalData, 10);
      const recordPromises: Promise<IoTTransaction>[] = [];
      for (let i = totalData; i > totalData - recordCount && i > 0; i--) {
        const id = i;
        recordPromises.push(
          (async () => {
            const [device, dataHash, timestamp] = await contract.getRecord(id);
            return {
              id: `tx-${id}`,
              deviceId: device,
              deviceName: device.slice(0, 10),
              data: { hash: dataHash },
              timestamp: new Date(Number(timestamp) * 1000),
              signature: dataHash.slice(0, 18),
            };
          })()
        );
      }
      const recordResults = await Promise.all(recordPromises);
      setTransactions(recordResults);

      // Calculate active counts
      const activeDevices = mappedDevices.filter((d) => d.status === 'online').length;
      const activeNodes = mappedNodes.filter((n) => n.status === 'active').length;

      setStats({
        totalBlocks: totalData,
        totalTransactions: totalData,
        activeNodes,
        activeDevices,
        avgBlockTime: 12,
        storageUsed: totalData * 0.001,
      });

      setHasFetched(true);
    } catch (error) {
      console.error('Error fetching blockchain data:', error);
      setContract(null);
      setIsContractDeployed(false);
      setHasFetched(false);
      setContractError(true);
      toast.error('Contract not compatible', {
        description:
          'The contract at this address does not match the expected ABI. Redeploy contracts/IoTBlockchain.sol and update the address.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [contract, isContractDeployed, contractError, isLoading]);

  // Auto-fetch on mount
  useEffect(() => {
    if (isContractDeployed && !hasFetched && !contractError) {
      fetchData();
    }
  }, [isContractDeployed, hasFetched, contractError, fetchData]);

  // Register a device
  const registerDevice = useCallback(
    async (deviceAddress: string, name: string, _deviceType: string, permission: number) => {
      if (!contract || !signer) {
        toast.error('Wallet not connected');
        return false;
      }

      const encodedName = safeEncodeBytes32('Device name', name);
      if (!encodedName) return false;

      try {
        setIsLoading(true);
        const tx = await contract.addDevice(deviceAddress, encodedName, permission);
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
        const tx = await contract.addNode(nodeAddress, encodedName, isValidator);
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

  // Record IoT data (now just a hash)
  const recordData = useCallback(
    async (deviceName: string, dataType: string, value: number) => {
      if (!contract || !signer) {
        toast.error('Wallet not connected');
        return false;
      }

      try {
        setIsLoading(true);
        // Create a hash from the data
        const dataHash = keccak256(toUtf8Bytes(`${deviceName}|${dataType}|${value}|${Date.now()}`));
        const tx = await contract.record(dataHash);
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
