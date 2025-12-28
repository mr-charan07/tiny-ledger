import { useState } from 'react';
import { Send, Database, AlertCircle, CheckCircle, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useBlockchain } from '@/hooks/useBlockchain';
import { useWeb3 } from '@/contexts/Web3Context';
import { validateIoTData, validateDataIntegrity } from '@/lib/validation';
import { generateTransactionToken, type TransactionToken } from '@/lib/tokenGeneration';
import { toast } from 'sonner';

const DATA_TYPES = [
  'temperature',
  'humidity',
  'pressure',
  'voltage',
  'current',
  'light',
  'motion',
  'co2',
  'ph',
  'custom',
];

export function RecordDataForm() {
  const { recordData, isLoading, isContractDeployed, devices } = useBlockchain();
  const { isConnected, account } = useWeb3();
  
  const [deviceName, setDeviceName] = useState('');
  const [dataType, setDataType] = useState('');
  const [customDataType, setCustomDataType] = useState('');
  const [value, setValue] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [generatedToken, setGeneratedToken] = useState<TransactionToken | null>(null);

  const effectiveDataType = dataType === 'custom' ? customDataType : dataType;

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    // Schema validation
    const schemaResult = validateIoTData({
      deviceName,
      dataType: effectiveDataType,
      value: parseFloat(value),
    });

    if (!schemaResult.success) {
      errors.push(...schemaResult.error.errors.map(e => e.message));
    }

    // Data integrity validation
    const integrityResult = validateDataIntegrity(parseFloat(value), effectiveDataType);
    if (!integrityResult.valid && integrityResult.error) {
      errors.push(integrityResult.error);
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Validation failed', { 
        description: 'Please fix the errors before submitting' 
      });
      return;
    }

    // Generate token before submission
    const token = generateTransactionToken(
      deviceName,
      effectiveDataType,
      parseFloat(value),
      account || undefined
    );

    const success = await recordData(deviceName, effectiveDataType, parseFloat(value));
    
    if (success) {
      setGeneratedToken(token);
      // Reset form
      setDeviceName('');
      setDataType('');
      setCustomDataType('');
      setValue('');
      setValidationErrors([]);
    }
  };

  const copyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken.token);
      toast.success('Token copied to clipboard');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            Record IoT Data to Blockchain
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isConnected && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">Connect wallet to record data</span>
            </div>
          )}

          {!isContractDeployed && isConnected && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">Deploy smart contract first</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deviceName">Device Name</Label>
                {devices.length > 0 ? (
                  <Select value={deviceName} onValueChange={setDeviceName}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select device" />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.map(device => (
                        <SelectItem key={device.id} value={device.name}>
                          {device.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="deviceName"
                    placeholder="e.g., sensor_001"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    className="font-mono"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataType">Data Type</Label>
                <Select value={dataType} onValueChange={setDataType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {dataType === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="customDataType">Custom Type Name</Label>
                  <Input
                    id="customDataType"
                    placeholder="e.g., soil_moisture"
                    value={customDataType}
                    onChange={(e) => setCustomDataType(e.target.value)}
                    className="font-mono"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                <Input
                  id="value"
                  type="number"
                  placeholder="Enter sensor value"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>

            {validationErrors.length > 0 && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 space-y-1">
                {validationErrors.map((error, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {error}
                  </div>
                ))}
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isLoading || !isConnected || !isContractDeployed}
              className="w-full"
            >
              {isLoading ? (
                'Recording...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Record Data & Generate Token
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Generated Token Display */}
      {generatedToken && (
        <Card className="border-accent/50 bg-accent/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-accent" />
              Transaction Token Generated
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-background border border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Full Token:</span>
                <Button variant="ghost" size="sm" onClick={copyToken}>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
              <code className="text-xs font-mono text-primary break-all block mt-1">
                {generatedToken.token}
              </code>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Device:</span>
                <Badge variant="secondary" className="ml-2">
                  {generatedToken.deviceName}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>
                <Badge variant="outline" className="ml-2">
                  {generatedToken.dataType}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Value:</span>
                <span className="ml-2 font-mono text-primary">{generatedToken.value}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Time:</span>
                <span className="ml-2 font-mono text-xs">
                  {new Date(generatedToken.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Save this token to verify your data later. You can use it in the Verification tab.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
