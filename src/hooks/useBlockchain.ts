import { useState, useEffect, useCallback } from 'react';
import { Contract, keccak256, toUtf8Bytes } from 'ethers';
import { useWeb3 } from '@/contexts/Web3Context';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config/blockchain';
import { toast } from 'sonner';

export function useBlockchain() {
  const { provider, signer, isCorrectNetwork } = useWeb3();
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isContractDeployed, setIsContractDeployed] = useState(false);
  const [recordCount, setRecordCount] = useState(0);

  // Initialize contract
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!provider || !isCorrectNetwork) {
        setContract(null);
        setIsContractDeployed(false);
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
          return;
        }

        const contractInstance = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer || provider);
        setContract(contractInstance);
        setIsContractDeployed(true);

        // Fetch record count
        const count = await contractInstance.recordCount();
        setRecordCount(Number(count));
      } catch (e) {
        console.error('Error initializing contract:', e);
        setContract(null);
        setIsContractDeployed(false);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [provider, signer, isCorrectNetwork]);

  // Record a single data hash on-chain
  const recordProof = useCallback(
    async (
      deviceName: string,
      dataType: string,
      value: number
    ): Promise<{ recordId: number; txHash: string; dataHash: string } | null> => {
      if (!contract || !signer) {
        toast.error('Wallet not connected');
        return null;
      }

      try {
        setIsLoading(true);
        const dataHash = keccak256(toUtf8Bytes(`${deviceName}|${dataType}|${value}|${Date.now()}`));
        const tx = await contract.record(dataHash);
        toast.info('Transaction submitted', { description: 'Waiting for confirmation...' });
        const receipt = await tx.wait();

        const event = receipt.logs.find((log: { topics: string[] }) =>
          log.topics[0] === contract.interface.getEvent('DataRecorded')?.topicHash
        );

        let recordId = recordCount + 1;
        if (event) {
          const parsed = contract.interface.parseLog({
            topics: event.topics as string[],
            data: event.data,
          });
          if (parsed) {
            recordId = Number(parsed.args[0]);
          }
        }

        setRecordCount(recordId);
        toast.success('Proof recorded on blockchain');

        return { recordId, txHash: receipt.hash, dataHash };
      } catch (error: unknown) {
        console.error('Error recording proof:', error);
        const err = error as { reason?: string };
        toast.error('Failed to record proof', { description: err.reason || 'Transaction failed' });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [contract, signer, recordCount]
  );

  // Record multiple data hashes in a single transaction (single MetaMask confirmation)
  const recordBatchProof = useCallback(
    async (
      hashes: string[]
    ): Promise<{ results: { recordId: number; txHash: string; dataHash: string }[] } | null> => {
      if (!contract || !signer) {
        toast.error('Wallet not connected');
        return null;
      }

      if (hashes.length === 0) return null;

      try {
        setIsLoading(true);
        toast.info(`Submitting ${hashes.length} proofs in one transaction...`);

        const tx = await contract.recordBatch(hashes);
        toast.info('Transaction submitted', { description: 'Waiting for confirmation...' });
        const receipt = await tx.wait();

        const topicHash = contract.interface.getEvent('DataRecorded')?.topicHash;
        const results: { recordId: number; txHash: string; dataHash: string }[] = [];

        for (const log of receipt.logs) {
          if (log.topics[0] === topicHash) {
            const parsed = contract.interface.parseLog({
              topics: log.topics as string[],
              data: log.data,
            });
            if (parsed) {
              results.push({
                recordId: Number(parsed.args[0]),
                txHash: receipt.hash,
                dataHash: parsed.args[2],
              });
            }
          }
        }

        if (results.length > 0) {
          setRecordCount(results[results.length - 1].recordId);
        }

        toast.success(`${results.length} proofs recorded on blockchain`);
        return { results };
      } catch (error: unknown) {
        console.error('Error recording batch proof:', error);
        const err = error as { reason?: string };
        toast.error('Failed to record batch proof', { description: err.reason || 'Transaction failed' });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [contract, signer]
  );

  return {
    isLoading,
    isContractDeployed,
    recordCount,
    recordProof,
    recordBatchProof,
  };
}
