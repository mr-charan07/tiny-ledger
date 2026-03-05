import { z } from 'zod';
import { keccak256, toUtf8Bytes } from 'ethers';
import { validateDataIntegrity } from './validation';

// Schema for a single dataset record
export const datasetRecordSchema = z.object({
  device_name: z.string().min(1, 'Device name is required').max(64),
  data_type: z.string().min(1, 'Data type is required').max(32),
  value: z.number({ invalid_type_error: 'Value must be a number' }),
  timestamp: z.string().optional(),
});

export type DatasetRecord = z.infer<typeof datasetRecordSchema>;

export interface ParsedRecord {
  index: number;
  raw: Record<string, unknown>;
  parsed: DatasetRecord | null;
  errors: string[];
  hash: string | null;
  status: 'pending' | 'valid' | 'invalid' | 'processed' | 'failed';
}

export interface DatasetParseResult {
  records: ParsedRecord[];
  totalCount: number;
  validCount: number;
  invalidCount: number;
  fileName: string;
  format: 'csv' | 'json';
}

/**
 * Parse CSV text into records
 */
function parseCSV(text: string): Record<string, unknown>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const records: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim());
    const record: Record<string, unknown> = {};

    headers.forEach((header, idx) => {
      const val = values[idx] ?? '';
      // Try to parse numbers
      const num = Number(val);
      record[header] = !isNaN(num) && val !== '' ? num : val;
    });

    records.push(record);
  }

  return records;
}

/**
 * Parse JSON text into records
 */
function parseJSON(text: string): Record<string, unknown>[] {
  const data = JSON.parse(text);
  if (Array.isArray(data)) return data;
  if (data.records && Array.isArray(data.records)) return data.records;
  if (data.data && Array.isArray(data.data)) return data.data;
  throw new Error('JSON must be an array or contain a "records" or "data" array');
}

/**
 * Generate a canonical Keccak-256 hash for a record
 */
export function generateRecordHash(record: DatasetRecord): { hash: string; resolvedTimestamp: string } {
  // Canonical JSON: sorted keys, deterministic
  const resolvedTimestamp = record.timestamp || new Date().toISOString();
  const canonical = JSON.stringify({
    data_type: record.data_type,
    device_name: record.device_name,
    timestamp: resolvedTimestamp,
    value: record.value,
  });
  return { hash: keccak256(toUtf8Bytes(canonical)), resolvedTimestamp };
}

/**
 * Regenerate hash for verification (tampering detection)
 */
export function regenerateHashForVerification(
  deviceName: string,
  dataType: string,
  value: number,
  timestamp: string
): string {
  const canonical = JSON.stringify({
    data_type: dataType,
    device_name: deviceName,
    timestamp,
    value,
  });
  return keccak256(toUtf8Bytes(canonical));
}

/**
 * Parse a dataset file (CSV or JSON) and validate each record
 */
export function parseDatasetFile(
  content: string,
  fileName: string
): DatasetParseResult {
  const format = fileName.toLowerCase().endsWith('.json') ? 'json' : 'csv';

  let rawRecords: Record<string, unknown>[];
  try {
    rawRecords = format === 'csv' ? parseCSV(content) : parseJSON(content);
  } catch (e) {
    throw new Error(`Failed to parse ${format.toUpperCase()} file: ${(e as Error).message}`);
  }

  const records: ParsedRecord[] = rawRecords.map((raw, index) => {
    const errors: string[] = [];

    // Schema validation
    const result = datasetRecordSchema.safeParse(raw);

    if (!result.success) {
      errors.push(...result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
      return {
        index,
        raw,
        parsed: null,
        errors,
        hash: null,
        status: 'invalid' as const,
      };
    }

    // Domain validation (range checks)
    const integrity = validateDataIntegrity(result.data.value, result.data.data_type);
    if (!integrity.valid && integrity.error) {
      errors.push(integrity.error);
    }

    if (errors.length > 0) {
      return {
        index,
        raw,
        parsed: result.data,
        errors,
        hash: null,
        status: 'invalid' as const,
      };
    }

    // Generate hash
    const { hash, resolvedTimestamp } = generateRecordHash(result.data);
    // Store the resolved timestamp back so it can be persisted
    result.data.timestamp = resolvedTimestamp;

    return {
      index,
      raw,
      parsed: result.data,
      errors: [],
      hash,
      status: 'valid' as const,
    };
  });

  const validCount = records.filter(r => r.status === 'valid').length;

  return {
    records,
    totalCount: records.length,
    validCount,
    invalidCount: records.length - validCount,
    fileName,
    format,
  };
}
