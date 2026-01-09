import { useData } from '@/hooks/useData';
import { useBlockchain } from '@/hooks/useBlockchain';
import { useWeb3 } from '@/contexts/Web3Context';
import { StatCard } from './StatCard';
import { BlockCard } from './BlockCard';
import { NodeCard } from './NodeCard';
import { DeviceCard } from './DeviceCard';
import { TransactionRow } from './TransactionRow';
import { BlockchainVisualizer } from './BlockchainVisualizer';
import { Box, Server, Cpu, Clock, Database, ArrowUpDown, Wallet, AlertCircle, LogIn } from 'lucide-react';
import { Button } from './ui/button';
import { CONTRACT_ADDRESS } from '@/config/blockchain';

interface DashboardProps {
  onShowAuth?: () => void;
}

export function Dashboard({ onShowAuth }: DashboardProps) {
  const { isConnected, isCorrectNetwork, connectWallet, switchToSepolia } = useWeb3();
  const { isContractDeployed } = useBlockchain();
  const { stats, blocks, nodes, devices, transactions, isLoading, isAuthenticated } = useData();

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-slide-in">
        <div className="p-6 rounded-full bg-primary/20 glow-primary">
          <LogIn className="h-16 w-16 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Sign In Required</h2>
          <p className="text-muted-foreground max-w-md">
            Sign in to access the IoT blockchain dashboard and manage your devices
          </p>
        </div>
        <Button variant="cyber" size="lg" onClick={onShowAuth}>
          <LogIn className="h-5 w-5 mr-2" />
          Sign In
        </Button>
      </div>
    );
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-slide-in">
        <div className="p-6 rounded-full bg-primary/20 glow-primary">
          <Wallet className="h-16 w-16 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Connect Your Wallet</h2>
          <p className="text-muted-foreground max-w-md">
            Connect your MetaMask wallet to interact with the IoT blockchain on Sepolia testnet
          </p>
        </div>
        <Button variant="cyber" size="lg" onClick={connectWallet}>
          <Wallet className="h-5 w-5 mr-2" />
          Connect MetaMask
        </Button>
      </div>
    );
  }

  // Wrong network state
  if (!isCorrectNetwork) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-slide-in">
        <div className="p-6 rounded-full bg-destructive/20">
          <AlertCircle className="h-16 w-16 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Wrong Network</h2>
          <p className="text-muted-foreground max-w-md">
            Please switch to Sepolia testnet to use this application
          </p>
        </div>
        <Button variant="cyber" size="lg" onClick={switchToSepolia}>
          Switch to Sepolia
        </Button>
      </div>
    );
  }

  // Contract not deployed state (show warning but allow viewing DB data)
  const showContractWarning = !isContractDeployed;

  // Loading state
  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse space-y-4 text-center">
          <div className="h-8 w-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Contract Warning */}
      {showContractWarning && (
        <div className="rounded-lg border border-warning/50 bg-warning/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
            <div>
              <p className="text-sm font-medium text-warning">Smart Contract Not Deployed</p>
              <p className="text-xs text-muted-foreground mt-1">
                Deploy <code className="text-primary">contracts/IoTBlockchain.sol</code> to Sepolia and update the address in <code className="text-primary">src/config/blockchain.ts</code> to enable blockchain proofs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Records"
          value={stats?.totalBlocks?.toLocaleString() || '0'}
          icon={Box}
          trend="up"
        />
        <StatCard
          title="Transactions"
          value={stats?.totalTransactions?.toLocaleString() || '0'}
          icon={ArrowUpDown}
          trend="up"
        />
        {/* <StatCard
          title="Active Nodes"
          value={stats?.activeNodes || 0}
          subtitle={`of ${nodes.length} total`}
          icon={Server}
          trend="neutral"
        /> */}
        <StatCard
          title="IoT Devices"
          value={stats?.activeDevices || 0}
          subtitle={`${devices.filter(d => d.status === 'online').length} online`}
          icon={Cpu}
          trend="up"
        />
        <StatCard
          title="Avg Block Time"
          value={`${stats?.avgBlockTime || 12}s`}
          icon={Clock}
          trend="neutral"
        />
        <StatCard
          title="Storage Used"
          value={`${stats?.storageUsed?.toFixed(2) || '0'} KB`}
          subtitle={`${stats?.totalBlocks || 0} records`}
          icon={Database}
          trend="neutral"
        />
      </div>

      {/* Blockchain Visualizer */}
      {blocks.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Chain Visualization
          </h2>
          <BlockchainVisualizer blocks={blocks} />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Blocks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Recent Blocks
            </h2>
            <span className="text-xs text-primary font-mono">
              {isLoading ? 'Syncing...' : 'Live'}
            </span>
          </div>
          {blocks.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {blocks.slice(0, 4).map((block, index) => (
                <BlockCard key={block.id} block={block} isLatest={index === 0} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">No blocks recorded yet</p>
              <p className="text-sm text-muted-foreground mt-1">Record IoT data to create blocks</p>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Recent Transactions
          </h2>
          {transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.slice(0, 5).map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">No transactions yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Nodes & Devices */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Nodes */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Network Nodes
          </h2>
          {nodes.length > 0 ? (
            <div className="grid gap-4">
              {nodes.slice(0, 3).map((node) => (
                <NodeCard key={node.id} node={node} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">No nodes registered</p>
            </div>
          )}
        </div>

        {/* Devices */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            IoT Devices
          </h2>
          {devices.length > 0 ? (
            <div className="grid gap-4">
              {devices.slice(0, 3).map((device) => (
                <DeviceCard key={device.id} device={device} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground">No devices registered</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
