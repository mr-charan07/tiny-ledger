import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { IoTDevice, Node, IoTTransaction, BlockchainStats, Block } from '@/types/blockchain';
import type { TablesInsert } from '@/integrations/supabase/types';
import { keccak256, toUtf8Bytes } from 'ethers';

export interface DbDevice {
  id: string;
  address: string;
  name: string;
  device_type: string | null;
  location: string | null;
  active: boolean;
  permission_level: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface DbNode {
  id: string;
  address: string;
  name: string;
  active: boolean;
  is_validator: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface DbDataRecord {
  id: string;
  record_id: number;
  device_address: string;
  data_hash: string;
  tx_hash: string | null;
  temperature: number | null;
  humidity: number | null;
  raw_data: Record<string, unknown> | null;
  user_id: string;
  created_at: string;
}

const permissionMap: Record<number, 'read' | 'write' | 'admin'> = {
  0: 'read',
  1: 'write',
  2: 'admin',
};

export function useData() {
  const [isLoading, setIsLoading] = useState(false);
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [transactions, setTransactions] = useState<IoTTransaction[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [stats, setStats] = useState<BlockchainStats | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch all data from database
  const fetchData = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const [devicesRes, nodesRes, recordsRes] = await Promise.all([
        supabase.from('devices').select('*').order('created_at', { ascending: false }),
        supabase.from('nodes').select('*').order('created_at', { ascending: false }),
        supabase.from('data_records').select('*').order('created_at', { ascending: false }).limit(50),
      ]);

      if (devicesRes.error) throw devicesRes.error;
      if (nodesRes.error) throw nodesRes.error;
      if (recordsRes.error) throw recordsRes.error;

      const dbDevices = devicesRes.data as DbDevice[];
      const dbNodes = nodesRes.data as DbNode[];
      const dbRecords = recordsRes.data as DbDataRecord[];

      // Map to frontend types
      const mappedDevices: IoTDevice[] = dbDevices.map((d) => ({
        id: d.id,
        name: d.name,
        type: (d.device_type as 'sensor' | 'actuator' | 'gateway') || 'sensor',
        status: d.active ? 'online' : 'offline',
        lastReading: new Date(d.updated_at),
        transactionCount: dbRecords.filter((r) => r.device_address === d.address).length,
        permission: permissionMap[d.permission_level] || 'read',
        address: d.address,
      }));
      setDevices(mappedDevices);

      const mappedNodes: Node[] = dbNodes.map((n) => ({
        id: n.id,
        name: n.name,
        address: n.address,
        status: n.active ? 'active' : 'inactive',
        role: n.is_validator ? 'validator' : 'observer',
        lastSeen: new Date(n.updated_at),
        blocksValidated: 0,
      }));
      setNodes(mappedNodes);

      const mappedTransactions: IoTTransaction[] = dbRecords.map((r) => ({
        id: `tx-${r.record_id}`,
        deviceId: r.device_address,
        deviceName: mappedDevices.find((d) => d.address === r.device_address)?.name || r.device_address.slice(0, 10),
        data: {
          hash: r.data_hash,
          temperature: r.temperature,
          humidity: r.humidity,
          ...(r.raw_data || {}),
        },
        timestamp: new Date(r.created_at),
        signature: r.tx_hash || r.data_hash.slice(0, 18),
        txHash: r.tx_hash,
      }));
      setTransactions(mappedTransactions);

      // Generate blocks from transactions (for visualization)
      const generatedBlocks: Block[] = mappedTransactions.reduce<Block[]>((acc, tx, index) => {
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
            validator: mappedNodes[0]?.id || 'unknown',
          };
        }
        acc[blockIndex].data.push(tx);
        return acc;
      }, []);
      setBlocks(generatedBlocks);

      // Calculate stats
      const activeDevices = mappedDevices.filter((d) => d.status === 'online').length;
      const activeNodes = mappedNodes.filter((n) => n.status === 'active').length;

      // Calculate actual storage used based on data records
      const storageBytes = dbRecords.reduce((total, record) => {
        // Estimate size of each record in bytes
        const recordSize = 
          (record.data_hash?.length || 0) + 
          (record.tx_hash?.length || 0) + 
          (record.device_address?.length || 0) +
          (record.raw_data ? JSON.stringify(record.raw_data).length : 0) +
          8 + // temperature (numeric)
          8 + // humidity (numeric)
          36 + // uuid id
          8 + // record_id (bigint)
          36 + // user_id uuid
          24; // timestamp
        return total + recordSize;
      }, 0);
      
      // Convert bytes to KB (divide by 1024)
      const storageKB = storageBytes / 1024;

      setStats({
        totalBlocks: dbRecords.length,
        totalTransactions: dbRecords.length,
        activeNodes,
        activeDevices,
        avgBlockTime: 12,
        storageUsed: storageKB,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Auto-fetch on mount and user change
  useEffect(() => {
    if (userId) {
      fetchData();
    } else {
      setDevices([]);
      setNodes([]);
      setTransactions([]);
      setBlocks([]);
      setStats(null);
    }
  }, [userId, fetchData]);

  // Register a device in database
  const registerDevice = useCallback(
    async (address: string, name: string, deviceType: string, permission: number) => {
      if (!userId) {
        toast.error('Please sign in first');
        return false;
      }

      try {
        setIsLoading(true);
        const { error } = await supabase.from('devices').insert({
          address,
          name,
          device_type: deviceType,
          permission_level: permission,
          user_id: userId,
        });

        if (error) throw error;
        toast.success('Device registered');
        await fetchData();
        return true;
      } catch (error: unknown) {
        console.error('Error registering device:', error);
        const err = error as { message?: string };
        toast.error('Failed to register device', { description: err.message });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, fetchData]
  );

  // Register a node in database
  const registerNode = useCallback(
    async (address: string, name: string, isValidator: boolean) => {
      if (!userId) {
        toast.error('Please sign in first');
        return false;
      }

      try {
        setIsLoading(true);
        const { error } = await supabase.from('nodes').insert({
          address,
          name,
          is_validator: isValidator,
          user_id: userId,
        });

        if (error) throw error;
        toast.success('Node registered');
        await fetchData();
        return true;
      } catch (error: unknown) {
        console.error('Error registering node:', error);
        const err = error as { message?: string };
        toast.error('Failed to register node', { description: err.message });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, fetchData]
  );

  // Save data record to database (after blockchain proof is recorded)
  const saveDataRecord = useCallback(
    async (
      recordId: number,
      deviceAddress: string,
      dataHash: string,
      txHash: string | null,
      data?: { temperature?: number; humidity?: number; raw?: Record<string, unknown> }
    ) => {
      if (!userId) {
        toast.error('Please sign in first');
        return false;
      }

      try {
        const insertData: TablesInsert<'data_records'> = {
          record_id: recordId,
          device_address: deviceAddress,
          data_hash: dataHash,
          tx_hash: txHash,
          temperature: data?.temperature ?? null,
          humidity: data?.humidity ?? null,
          raw_data: data?.raw ? JSON.parse(JSON.stringify(data.raw)) : null,
          user_id: userId,
        };
        const { error } = await supabase.from('data_records').insert(insertData);

        if (error) throw error;
        await fetchData();
        return true;
      } catch (error: unknown) {
        console.error('Error saving record:', error);
        const err = error as { message?: string };
        toast.error('Failed to save record', { description: err.message });
        return false;
      }
    },
    [userId, fetchData]
  );

  return {
    isLoading,
    isAuthenticated: !!userId,
    userId,
    devices,
    nodes,
    transactions,
    blocks,
    stats,
    fetchData,
    registerDevice,
    registerNode,
    saveDataRecord,
  };
}
