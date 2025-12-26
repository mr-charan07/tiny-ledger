import { mockStats, mockBlocks, mockNodes, mockDevices, mockTransactions } from '@/data/mockData';
import { StatCard } from './StatCard';
import { BlockCard } from './BlockCard';
import { NodeCard } from './NodeCard';
import { DeviceCard } from './DeviceCard';
import { TransactionRow } from './TransactionRow';
import { BlockchainVisualizer } from './BlockchainVisualizer';
import { Box, Server, Cpu, Clock, Database, ArrowUpDown } from 'lucide-react';

export function Dashboard() {
  return (
    <div className="space-y-6 animate-slide-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Blocks"
          value={mockStats.totalBlocks.toLocaleString()}
          icon={Box}
          trend="up"
        />
        <StatCard
          title="Transactions"
          value={mockStats.totalTransactions.toLocaleString()}
          icon={ArrowUpDown}
          trend="up"
        />
        <StatCard
          title="Active Nodes"
          value={mockStats.activeNodes}
          subtitle={`of ${mockNodes.length} total`}
          icon={Server}
          trend="neutral"
        />
        <StatCard
          title="IoT Devices"
          value={mockStats.activeDevices}
          subtitle={`${mockDevices.filter(d => d.status === 'online').length} online`}
          icon={Cpu}
          trend="up"
        />
        <StatCard
          title="Avg Block Time"
          value={`${mockStats.avgBlockTime}s`}
          icon={Clock}
          trend="neutral"
        />
        <StatCard
          title="Storage Used"
          value={`${mockStats.storageUsed} MB`}
          subtitle="Low overhead"
          icon={Database}
          trend="neutral"
        />
      </div>

      {/* Blockchain Visualizer */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-2">
          Chain Visualization
        </h2>
        <BlockchainVisualizer blocks={mockBlocks} />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Blocks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Recent Blocks
            </h2>
            <span className="text-xs text-primary font-mono">Live</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {mockBlocks.slice(0, 4).map((block, index) => (
              <BlockCard key={block.id} block={block} isLatest={index === 0} />
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Recent Transactions
          </h2>
          <div className="space-y-2">
            {mockTransactions.map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} />
            ))}
          </div>
        </div>
      </div>

      {/* Nodes & Devices */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Nodes */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Network Nodes
          </h2>
          <div className="grid gap-4">
            {mockNodes.slice(0, 3).map((node) => (
              <NodeCard key={node.id} node={node} />
            ))}
          </div>
        </div>

        {/* Devices */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            IoT Devices
          </h2>
          <div className="grid gap-4">
            {mockDevices.slice(0, 3).map((device) => (
              <DeviceCard key={device.id} device={device} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
