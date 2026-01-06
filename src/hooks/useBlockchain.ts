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

  // Record data hash on-chain and return the record ID + tx hash
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
        // Create a hash from the data
        const dataHash = keccak256(toUtf8Bytes(`${deviceName}|${dataType}|${value}|${Date.now()}`));
        const tx = await contract.record(dataHash);
        toast.info('Transaction submitted', { description: 'Waiting for confirmation...' });
        const receipt = await tx.wait();

        // Parse the DataRecorded event to get the record ID
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

        return {
          recordId,
          txHash: receipt.hash,
          dataHash,
        };
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

  return {
    isLoading,
    isContractDeployed,
    recordCount,
    recordProof,
  };
}
