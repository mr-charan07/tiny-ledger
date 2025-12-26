import { useBlockchain } from '@/hooks/useBlockchain';
import { useWeb3 } from '@/contexts/Web3Context';
import { BlockCard } from './BlockCard';
import { BlockchainVisualizer } from './BlockchainVisualizer';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, Filter, Wallet, AlertCircle } from 'lucide-react';

export function BlocksView() {
  const { isConnected, isCorrectNetwork, connectWallet, switchToSepolia } = useWeb3();
  const { blocks, isContractDeployed, isLoading } = useBlockchain();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4 animate-slide-in">
        <Wallet className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Connect wallet to view blocks</p>
        <Button variant="cyber" onClick={connectWallet}>Connect Wallet</Button>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4 animate-slide-in">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">Switch to Sepolia network</p>
        <Button variant="cyber" onClick={switchToSepolia}>Switch Network</Button>
      </div>
    );
  }

  if (!isContractDeployed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4 animate-slide-in">
        <AlertCircle className="h-12 w-12 text-warning" />
        <p className="text-muted-foreground">Deploy the smart contract first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Block Explorer</h2>
          <p className="text-sm text-muted-foreground">Browse and inspect all blocks in the chain</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by hash or index..."
              className="pl-10 w-full sm:w-64 bg-secondary border-border font-mono text-sm"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {blocks.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Chain Overview
          </h3>
          <BlockchainVisualizer blocks={blocks} />
        </div>
      )}

      {blocks.length > 0 ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {blocks.map((block, index) => (
            <BlockCard key={block.id} block={block} isLatest={index === 0} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No blocks recorded yet</p>
          <p className="text-sm text-muted-foreground mt-1">Record IoT data to create blocks</p>
        </div>
      )}
    </div>
  );
}
