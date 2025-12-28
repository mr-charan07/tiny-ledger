import { useState } from 'react';
import { Search, CheckCircle, XCircle, FileText, Shield, Hash, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBlockchain } from '@/hooks/useBlockchain';
import { validateToken } from '@/lib/validation';
import { formatTokenForDisplay } from '@/lib/tokenGeneration';
import { toast } from 'sonner';
import { getEtherscanLink } from '@/config/blockchain';

interface VerificationResult {
  verified: boolean;
  recordId?: string;
  deviceName?: string;
  dataType?: string;
  value?: number;
  timestamp?: Date;
  signature?: string;
  blockHash?: string;
}

export function VerificationView() {
  const { transactions, isContractDeployed } = useBlockchain();
  const [searchToken, setSearchToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const handleVerify = async () => {
    // Validate input
    const validation = validateToken(searchToken);
    if (!validation.success) {
      toast.error('Invalid token format', { 
        description: validation.error.errors[0]?.message 
      });
      return;
    }

    setIsVerifying(true);
    
    try {
      // Simulate verification delay for UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Search in transactions by matching signature
      const matchedTx = transactions.find(tx => 
        tx.signature.toLowerCase().includes(searchToken.toLowerCase().slice(2, 10)) ||
        tx.id.toLowerCase().includes(searchToken.toLowerCase())
      );

      if (matchedTx) {
        setVerificationResult({
          verified: true,
          recordId: matchedTx.id,
          deviceName: matchedTx.deviceName,
          dataType: Object.keys(matchedTx.data)[0],
          value: Object.values(matchedTx.data)[0] as number,
          timestamp: matchedTx.timestamp,
          signature: matchedTx.signature,
        });
        toast.success('Token verified successfully');
      } else {
        setVerificationResult({ verified: false });
        toast.error('Token verification failed', {
          description: 'No matching record found on blockchain'
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationResult({ verified: false });
      toast.error('Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClear = () => {
    setSearchToken('');
    setVerificationResult(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Token Verification
          </h1>
          <p className="text-muted-foreground mt-1">
            Verify IoT data transactions using blockchain tokens
          </p>
        </div>
      </div>

      {!isContractDeployed && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4">
            <p className="text-destructive text-sm font-medium">
              Smart contract not deployed. Please deploy the contract to enable verification.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Verification Input */}
      <Card className="border-primary/30 bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            Enter Transaction Token
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="0x... or transaction ID"
              value={searchToken}
              onChange={(e) => setSearchToken(e.target.value)}
              className="font-mono text-sm"
              disabled={!isContractDeployed}
            />
            <Button 
              onClick={handleVerify} 
              disabled={!searchToken || isVerifying || !isContractDeployed}
              className="min-w-[120px]"
            >
              {isVerifying ? 'Verifying...' : 'Verify Token'}
            </Button>
            {verificationResult && (
              <Button variant="outline" onClick={handleClear}>
                Clear
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Enter the full transaction token hash or transaction ID to verify data integrity
          </p>
        </CardContent>
      </Card>

      {/* Verification Result */}
      {verificationResult && (
        <Card className={verificationResult.verified 
          ? 'border-accent/50 bg-accent/5' 
          : 'border-destructive/50 bg-destructive/5'
        }>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {verificationResult.verified ? (
                <>
                  <CheckCircle className="h-5 w-5 text-accent" />
                  <span className="text-accent">Verification Successful</span>
                  <Badge variant="outline" className="ml-2 border-accent text-accent">
                    VALID
                  </Badge>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  <span className="text-destructive">Verification Failed</span>
                  <Badge variant="destructive" className="ml-2">
                    INVALID
                  </Badge>
                </>
              )}
            </CardTitle>
          </CardHeader>
          {verificationResult.verified && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Record ID:</span>
                    <span className="font-mono text-sm text-foreground">
                      {verificationResult.recordId}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Device:</span>
                    <span className="font-mono text-sm text-foreground">
                      {verificationResult.deviceName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Timestamp:</span>
                    <span className="font-mono text-sm text-foreground">
                      {verificationResult.timestamp?.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Data Type:</span>
                    <Badge variant="secondary" className="ml-2">
                      {verificationResult.dataType}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Value:</span>
                    <span className="ml-2 font-mono text-primary font-bold">
                      {verificationResult.value}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Signature:</span>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      {formatTokenForDisplay(verificationResult.signature || '')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border">
                <a 
                  href={getEtherscanLink('tx', verificationResult.signature || '')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View on Etherscan →
                </a>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Recent Verified Transactions */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Recent Transactions (Available for Verification)</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No transactions recorded yet
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 5).map((tx) => (
                <div 
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSearchToken(tx.id);
                    setVerificationResult(null);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    <span className="font-mono text-sm">{tx.deviceName}</span>
                    <Badge variant="outline" className="text-xs">
                      {Object.keys(tx.data)[0]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm text-primary">
                      {Object.values(tx.data)[0]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {tx.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Info */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">How Token Verification Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-3">
            <span className="text-primary font-bold">1.</span>
            <p>Each IoT data transaction generates a unique cryptographic token using Keccak-256 hashing.</p>
          </div>
          <div className="flex gap-3">
            <span className="text-primary font-bold">2.</span>
            <p>The token is permanently stored on the Sepolia blockchain along with the data record.</p>
          </div>
          <div className="flex gap-3">
            <span className="text-primary font-bold">3.</span>
            <p>Users can verify data integrity by entering the token and checking against the blockchain.</p>
          </div>
          <div className="flex gap-3">
            <span className="text-primary font-bold">4.</span>
            <p>Successful verification proves the data hasn't been tampered with since recording.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
