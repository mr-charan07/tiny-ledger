import { useState, useCallback, useRef } from 'react';
import {
  Upload, FileText, CheckCircle, XCircle, AlertCircle,
  Play, Loader2, Download, LogIn, Shield, Eye, EyeOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useBlockchain } from '@/hooks/useBlockchain';
import { useData } from '@/hooks/useData';
import { useWeb3 } from '@/contexts/Web3Context';
import { usePerformance } from '@/contexts/PerformanceContext';
import { parseDatasetFile, type DatasetParseResult, type ParsedRecord } from '@/lib/datasetParser';
import { toast } from 'sonner';

interface DatasetUploadProps {
  onShowAuth?: () => void;
}

export function DatasetUpload({ onShowAuth }: DatasetUploadProps) {
  const { recordBatchProof, isContractDeployed } = useBlockchain();
  const { devices, saveBatchRecords, isAuthenticated } = useData();
  const { isConnected, account } = useWeb3();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parseResult, setParseResult] = useState<DatasetParseResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [showPreview, setShowPreview] = useState(true);
  const [batchResults, setBatchResults] = useState<{
    success: number;
    failed: number;
    skipped: number;
  } | null>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.toLowerCase();
    if (!ext.endsWith('.csv') && !ext.endsWith('.json')) {
      toast.error('Unsupported file format', { description: 'Please upload a CSV or JSON file' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', { description: 'Maximum file size is 5MB' });
      return;
    }

    try {
      const content = await file.text();
      const result = parseDatasetFile(content, file.name);
      setParseResult(result);
      setBatchResults(null);
      setProcessedCount(0);
      toast.success(`Parsed ${result.totalCount} records`, {
        description: `${result.validCount} valid, ${result.invalidCount} invalid`,
      });
    } catch (err) {
      toast.error('Failed to parse file', { description: (err as Error).message });
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleBatchProcess = useCallback(async () => {
    if (!parseResult) return;

    const validRecords = parseResult.records.filter(r => r.status === 'valid');
    if (validRecords.length === 0) {
      toast.error('No valid records to process');
      return;
    }

    setIsProcessing(true);
    setProcessedCount(0);
    let success = 0;
    let failed = 0;
    const skipped = parseResult.invalidCount;

    // Collect hashes and do a single blockchain transaction
    let batchBlockchainResults: { recordId: number; txHash: string; dataHash: string }[] = [];

    if (isContractDeployed && isConnected) {
      const hashes = validRecords
        .filter(r => r.hash)
        .map(r => r.hash!);

      if (hashes.length > 0) {
        const result = await recordBatchProof(hashes);
        if (result) {
          batchBlockchainResults = result.results;
        }
      }
    }

    // Build all records for batch insert
    const recordsToSave: {
      recordId: number;
      deviceAddress: string;
      dataHash: string;
      txHash: string | null;
      temperature?: number;
      humidity?: number;
      raw?: Record<string, unknown>;
    }[] = [];

    for (let i = 0; i < validRecords.length; i++) {
      const record = validRecords[i];
      if (!record.parsed || !record.hash) {
        record.status = 'failed';
        continue;
      }

      const device = devices.find(d => d.name === record.parsed!.device_name);
      const deviceAddress = device?.address || account || '0x0';

      let recordId = Date.now() * 1000 + i;
      let txHash: string | null = null;

      if (batchBlockchainResults.length > i) {
        recordId = batchBlockchainResults[i].recordId;
        txHash = batchBlockchainResults[i].txHash;
      }

      recordsToSave.push({
        recordId,
        deviceAddress,
        dataHash: record.hash,
        txHash,
        temperature: record.parsed.data_type === 'temperature' ? record.parsed.value : undefined,
        humidity: record.parsed.data_type === 'humidity' ? record.parsed.value : undefined,
        raw: {
          deviceName: record.parsed.device_name,
          dataType: record.parsed.data_type,
          value: record.parsed.value,
          timestamp: record.parsed.timestamp,
          batchUpload: true,
        },
      });
    }

    // Single batch insert
    const result = await saveBatchRecords(recordsToSave);
    success = result.success;
    failed = result.failed;

    // Update record statuses
    validRecords.forEach(r => {
      if (r.parsed && r.hash) {
        r.status = success > 0 ? 'processed' : 'failed';
      }
    });
    setProcessedCount(validRecords.length);

    setBatchResults({ success, failed, skipped });
    setIsProcessing(false);
    setParseResult({ ...parseResult });

    if (failed === 0) {
      toast.success(`All ${success} records processed successfully`);
    } else {
      toast.warning(`Processed ${success} records, ${failed} failed`);
    }
  }, [parseResult, devices, account, isContractDeployed, isConnected, recordBatchProof, saveBatchRecords]);

  const downloadSampleCSV = () => {
    const csv = `device_name,data_type,value,timestamp
sensor_001,temperature,23.5,2024-01-15T10:30:00Z
sensor_002,humidity,65.2,2024-01-15T10:30:00Z
sensor_001,pressure,1013.25,2024-01-15T10:31:00Z
gateway_01,voltage,3.3,2024-01-15T10:32:00Z`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_dataset.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSampleJSON = () => {
    const data = [
      { device_name: 'sensor_001', data_type: 'temperature', value: 23.5, timestamp: '2024-01-15T10:30:00Z' },
      { device_name: 'sensor_002', data_type: 'humidity', value: 65.2, timestamp: '2024-01-15T10:30:00Z' },
      { device_name: 'sensor_001', data_type: 'pressure', value: 1013.25, timestamp: '2024-01-15T10:31:00Z' },
    ];
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_dataset.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isAuthenticated) {
    return (
      <Card className="border-primary/30 bg-card">
        <CardContent className="p-8 text-center">
          <LogIn className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Sign in to upload datasets</p>
          <Button variant="cyber" onClick={onShowAuth}>Sign In</Button>
        </CardContent>
      </Card>
    );
  }

  const validRecords = parseResult?.records.filter(r => r.status === 'valid') ?? [];
  const totalValid = validRecords.length;
  const progress = parseResult ? (processedCount / totalValid) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Upload Card */}
      <Card className="border-primary/30 bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            Upload Dataset
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected && (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              <span className="text-sm text-warning">Connect wallet to record blockchain proofs</span>
            </div>
          )}

          {/* File Drop Zone */}
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-foreground font-medium">
              Click to upload CSV or JSON dataset
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Max 5MB • Required columns: device_name, data_type, value
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Sample Downloads */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadSampleCSV}>
              <Download className="h-3 w-3 mr-1" />
              Sample CSV
            </Button>
            <Button variant="outline" size="sm" onClick={downloadSampleJSON}>
              <Download className="h-3 w-3 mr-1" />
              Sample JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Parse Results & Preview */}
      {parseResult && (
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                {parseResult.fileName}
                <Badge variant="outline" className="ml-2 uppercase text-xs">
                  {parseResult.format}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{parseResult.totalCount} records</Badge>
                <Badge className="bg-accent/20 text-accent border-accent/30">
                  {parseResult.validCount} valid
                </Badge>
                {parseResult.invalidCount > 0 && (
                  <Badge variant="destructive">
                    {parseResult.invalidCount} invalid
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>

          {showPreview && (
            <CardContent className="space-y-3">
              {/* Preview Table */}
              <div className="max-h-64 overflow-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 text-muted-foreground font-medium">#</th>
                      <th className="text-left p-2 text-muted-foreground font-medium">Status</th>
                      <th className="text-left p-2 text-muted-foreground font-medium">Device</th>
                      <th className="text-left p-2 text-muted-foreground font-medium">Type</th>
                      <th className="text-left p-2 text-muted-foreground font-medium">Value</th>
                      <th className="text-left p-2 text-muted-foreground font-medium">Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parseResult.records.slice(0, 50).map((record) => (
                      <RecordRow key={record.index} record={record} />
                    ))}
                  </tbody>
                </table>
                {parseResult.totalCount > 50 && (
                  <div className="p-2 text-center text-xs text-muted-foreground bg-muted/30">
                    Showing 50 of {parseResult.totalCount} records
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Processing Controls */}
      {parseResult && !batchResults && (
        <Card className="border-primary/30 bg-card">
          <CardContent className="p-4 space-y-4">
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Processing records...</span>
                  <span className="font-mono text-primary">
                    {processedCount} / {totalValid}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <Button
              onClick={handleBatchProcess}
              disabled={isProcessing || totalValid === 0}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Process {totalValid} Valid Records
                  {isContractDeployed && isConnected && ' (with Blockchain Proofs)'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Batch Results */}
      {batchResults && (
        <Card className="border-accent/50 bg-accent/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-accent" />
              Batch Processing Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
                <div className="text-2xl font-bold text-accent">{batchResults.success}</div>
                <div className="text-xs text-muted-foreground">Processed</div>
              </div>
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                <div className="text-2xl font-bold text-destructive">{batchResults.failed}</div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                <div className="text-2xl font-bold text-warning">{batchResults.skipped}</div>
                <div className="text-xs text-muted-foreground">Skipped (Invalid)</div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-center gap-2 text-sm text-primary">
                <Shield className="h-4 w-4" />
                Each record's Keccak-256 hash has been stored for integrity verification
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => {
                setParseResult(null);
                setBatchResults(null);
                setProcessedCount(0);
              }}
            >
              Upload Another Dataset
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Row component for the preview table
function RecordRow({ record }: { record: ParsedRecord }) {
  const statusIcon = {
    pending: <AlertCircle className="h-3 w-3 text-muted-foreground" />,
    valid: <CheckCircle className="h-3 w-3 text-accent" />,
    invalid: <XCircle className="h-3 w-3 text-destructive" />,
    processed: <CheckCircle className="h-3 w-3 text-primary" />,
    failed: <XCircle className="h-3 w-3 text-destructive" />,
  };

  return (
    <tr className={`border-t border-border/50 ${record.status === 'invalid' ? 'bg-destructive/5' : ''}`}>
      <td className="p-2 font-mono text-xs text-muted-foreground">{record.index + 1}</td>
      <td className="p-2">
        <div className="flex items-center gap-1">
          {statusIcon[record.status]}
          {record.errors.length > 0 && (
            <span className="text-xs text-destructive" title={record.errors.join(', ')}>
              {record.errors[0]}
            </span>
          )}
        </div>
      </td>
      <td className="p-2 font-mono text-xs">{record.parsed?.device_name ?? String(record.raw.device_name ?? '-')}</td>
      <td className="p-2">
        <Badge variant="outline" className="text-xs">
          {record.parsed?.data_type ?? String(record.raw.data_type ?? '-')}
        </Badge>
      </td>
      <td className="p-2 font-mono text-xs text-primary">
        {record.parsed?.value ?? String(record.raw.value ?? '-')}
      </td>
      <td className="p-2 font-mono text-xs text-muted-foreground">
        {record.hash ? `${record.hash.slice(0, 10)}...` : '-'}
      </td>
    </tr>
  );
}
