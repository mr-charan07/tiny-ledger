import { useBlockchain } from '@/hooks/useBlockchain';
import { useWeb3 } from '@/contexts/Web3Context';
import { StatCard } from './StatCard';
import { BlockCard } from './BlockCard';
import { NodeCard } from './NodeCard';
import { DeviceCard } from './DeviceCard';
import { TransactionRow } from './TransactionRow';
import { BlockchainVisualizer } from './BlockchainVisualizer';
import { Box, Server, Cpu, Clock, Database, ArrowUpDown, Wallet, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { CONTRACT_ADDRESS } from '@/config/blockchain';

export function Dashboard() {
  const { isConnected, isCorrectNetwork, connectWallet, switchToSepolia } = useWeb3();
  const { stats, blocks, nodes, devices, transactions, isLoading, isContractDeployed } = useBlockchain();

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

  // Contract not deployed state
  if (!isContractDeployed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-slide-in">
        <div className="p-6 rounded-full bg-warning/20">
          <AlertCircle className="h-16 w-16 text-warning" />
        </div>
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Smart Contract Not Deployed</h2>
          <p className="text-muted-foreground max-w-lg">
            Deploy the IoT Blockchain smart contract to Sepolia and update the contract address in the configuration.
          </p>
          <div className="bg-secondary rounded-lg p-4 max-w-2xl">
            <p className="text-sm text-muted-foreground mb-2">1. Deploy <code className="text-primary">contracts/IoTBlockchain.sol</code> to Sepolia</p>
            <p className="text-sm text-muted-foreground mb-2">2. Copy the deployed contract address</p>
            <p className="text-sm text-muted-foreground">3. Update <code className="text-primary">src/config/blockchain.ts</code>:</p>
            <pre className="mt-2 p-2 bg-background rounded text-xs font-mono text-primary overflow-x-auto">
              export const CONTRACT_ADDRESS = 'YOUR_CONTRACT_ADDRESS_HERE';
            </pre>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse space-y-4 text-center">
          <div className="h-8 w-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading blockchain data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
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
        <StatCard
          title="Active Nodes"
          value={stats?.activeNodes || 0}
          subtitle={`of ${nodes.length} total`}
          icon={Server}
          trend="neutral"
        />
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
          value={`${stats?.storageUsed?.toFixed(2) || '0'} MB`}
          subtitle="Low overhead"
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
