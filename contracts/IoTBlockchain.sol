// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IoTBlockchain - Ultra Minimal Proof-Only Contract
 * @notice Records data hashes on-chain for verification. All metadata stored off-chain.
 * @dev ~1KB compiled. Deploy with optimizer ON (runs=200).
 */
contract IoTBlockchain {
    address public owner;
    uint256 public recordCount;

    event DataRecorded(uint256 indexed id, address indexed sender, bytes32 dataHash);

    modifier onlyOwner() {
        require(msg.sender == owner, "!owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Record a single data hash on-chain
    /// @param _hash The keccak256 hash of the data
    /// @return id The record ID
    function record(bytes32 _hash) external returns (uint256 id) {
        unchecked { recordCount++; }
        id = recordCount;
        emit DataRecorded(id, msg.sender, _hash);
    }

    /// @notice Record multiple data hashes in a single transaction
    /// @param _hashes Array of keccak256 hashes
    /// @return startId The first record ID assigned
    function recordBatch(bytes32[] calldata _hashes) external returns (uint256 startId) {
        startId = recordCount + 1;
        for (uint256 i = 0; i < _hashes.length; i++) {
            unchecked { recordCount++; }
            emit DataRecorded(recordCount, msg.sender, _hashes[i]);
        }
    }

    /// @notice Transfer ownership
    function transferOwnership(address _newOwner) external onlyOwner {
        owner = _newOwner;
    }
}
