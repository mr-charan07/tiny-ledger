

## Batch Blockchain Proofs with Single MetaMask Confirmation

**Problem**: Currently, each record triggers a separate `contract.record(hash)` call, requiring a MetaMask confirmation per record. For 50 records, that's 50 confirmations.

**Solution**: Add a `recordBatch(bytes32[])` function to the smart contract and a corresponding frontend method, so all hashes are submitted in one transaction with one MetaMask confirmation.

### Changes

**1. Update Smart Contract (`contracts/IoTBlockchain.sol`)**
Add a `recordBatch` function that accepts an array of hashes and emits events for each:
```solidity
function recordBatch(bytes32[] calldata _hashes) external returns (uint256 startId) {
    startId = recordCount + 1;
    for (uint256 i = 0; i < _hashes.length; i++) {
        unchecked { recordCount++; }
        emit DataRecorded(recordCount, msg.sender, _hashes[i]);
    }
}
```
> **Note**: This requires redeploying the contract to Sepolia and updating the contract address.

**2. Update Contract ABI (`src/config/blockchain.ts`)**
Add the new `recordBatch` function signature to `CONTRACT_ABI`.

**3. Add `recordBatchProof` to `src/hooks/useBlockchain.ts`**
New function that collects all hashes into an array, calls `contract.recordBatch(hashes)` once, parses all `DataRecorded` events from the single receipt, and returns an array of `{ recordId, txHash, dataHash }`.

**4. Update `src/components/DatasetUpload.tsx`**
Refactor `handleBatchProcess`:
- First pass: collect all valid record hashes into an array.
- If blockchain is available, call `recordBatchProof(hashes)` once (single MetaMask confirm).
- Second pass: save each record to the database with its corresponding `recordId` and the shared `txHash`.

### Important
The smart contract must be redeployed with the new `recordBatch` function. After deploying, you'll need to update `CONTRACT_ADDRESS` in `src/config/blockchain.ts`.

