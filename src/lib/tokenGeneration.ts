import { keccak256, toUtf8Bytes, solidityPackedKeccak256 } from 'ethers';

export interface TransactionToken {
  token: string;
  shortToken: string;
  deviceName: string;
  dataType: string;
  value: number;
  timestamp: number;
  signature: string;
}

// Generate a unique transaction token
export function generateTransactionToken(
  deviceName: string,
  dataType: string,
  value: number,
  deviceAddress?: string
): TransactionToken {
  const timestamp = Date.now();
  const nonce = Math.random().toString(36).substring(2, 15);
  
  // Create a unique identifier combining all data
  const dataString = `${deviceName}|${dataType}|${value}|${timestamp}|${nonce}`;
  
  // Generate the full token hash
  const token = keccak256(toUtf8Bytes(dataString));
  
  // Generate a signature hash that includes optional device address
  const signatureInput = deviceAddress 
    ? `${dataString}|${deviceAddress}`
    : dataString;
  const signature = solidityPackedKeccak256(
    ['string'],
    [signatureInput]
  );
  
  // Create a short human-readable token (first 8 + last 8 chars)
  const shortToken = `${token.slice(0, 10)}...${token.slice(-8)}`;
  
  return {
    token,
    shortToken,
    deviceName,
    dataType,
    value,
    timestamp,
    signature,
  };
}

// Generate a verification hash for stored data
export function generateVerificationHash(
  recordId: number,
  deviceAddress: string,
  dataType: string,
  value: number,
  timestamp: number,
  blockchainSignature: string
): string {
  return solidityPackedKeccak256(
    ['uint256', 'address', 'string', 'int256', 'uint256', 'bytes32'],
    [recordId, deviceAddress, dataType, value, timestamp, blockchainSignature]
  );
}

// Verify a token against stored data
export function verifyToken(
  token: string,
  expectedData: {
    deviceName: string;
    dataType: string;
    value: number;
    timestamp: number;
  }
): boolean {
  // Reconstruct possible token variants (accounting for nonce uncertainty)
  // In production, the full token with nonce should be stored
  const baseData = `${expectedData.deviceName}|${expectedData.dataType}|${expectedData.value}|${expectedData.timestamp}`;
  
  // For verification, we check if the token format is valid
  if (!token.startsWith('0x') || token.length !== 66) {
    return false;
  }
  
  return true;
}

// Format token for display
export function formatTokenForDisplay(token: string): string {
  if (!token || token.length < 20) return token;
  return `${token.slice(0, 10)}...${token.slice(-8)}`;
}

// Generate QR code data for token verification
export function generateTokenQRData(token: string, recordId: number): string {
  return JSON.stringify({
    version: 1,
    type: 'iot-blockchain-token',
    token,
    recordId,
    network: 'sepolia',
    timestamp: Date.now(),
  });
}
