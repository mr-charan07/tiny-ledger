import { useState } from 'react';
import { Copy, Check, Terminal, Key } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface ApiInfoSectionProps {
  deviceAddress?: string;
  deviceName?: string;
}

export function ApiInfoSection({ deviceAddress, deviceName }: ApiInfoSectionProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'your-project-id';
  const endpoint = `https://${projectId}.supabase.co/functions/v1/iot-ingest`;

  const sampleCurl = `curl -X POST ${endpoint} \\
  -H "x-device-key: ${deviceAddress || '0xYourDeviceAddress'}" \\
  -H "Content-Type: application/json" \\
  -d '{"device_name":"${deviceName || 'sensor_001'}","data_type":"temperature","value":23.5}'`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Terminal className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          IoT Ingestion API
        </h3>
      </div>

      {/* Endpoint */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Endpoint</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs font-mono bg-secondary rounded px-2 py-1.5 text-foreground truncate">
            POST {endpoint}
          </code>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => copyToClipboard(endpoint, 'Endpoint')}
          >
            {copied === 'Endpoint' ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Device Key */}
      {deviceAddress && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Key className="h-3 w-3" /> Device API Key
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-secondary rounded px-2 py-1.5 text-foreground truncate">
              {deviceAddress}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => copyToClipboard(deviceAddress, 'API Key')}
            >
              {copied === 'API Key' ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      )}

      {/* cURL example */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Sample cURL</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => copyToClipboard(sampleCurl, 'cURL')}
          >
            {copied === 'cURL' ? <Check className="h-3 w-3 text-primary mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
            Copy
          </Button>
        </div>
        <pre className="text-xs font-mono bg-secondary rounded p-3 text-foreground overflow-x-auto whitespace-pre-wrap break-all">
          {sampleCurl}
        </pre>
      </div>
    </div>
  );
}
