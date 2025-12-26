import { mockBlocks } from '@/data/mockData';
import { BlockCard } from './BlockCard';
import { BlockchainVisualizer } from './BlockchainVisualizer';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, Filter } from 'lucide-react';

export function BlocksView() {
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

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-2">
          Chain Overview
        </h3>
        <BlockchainVisualizer blocks={mockBlocks} />
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {mockBlocks.map((block, index) => (
          <BlockCard key={block.id} block={block} isLatest={index === 0} />
        ))}
      </div>
    </div>
  );
}
