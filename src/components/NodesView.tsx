import { mockNodes } from '@/data/mockData';
import { NodeCard } from './NodeCard';
import { Button } from './ui/button';
import { Plus, RefreshCw } from 'lucide-react';

export function NodesView() {
  const activeNodes = mockNodes.filter(n => n.status === 'active').length;
  const validators = mockNodes.filter(n => n.role === 'validator').length;

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Network Nodes</h2>
          <p className="text-sm text-muted-foreground">
            {activeNodes} active • {validators} validators
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync All
          </Button>
          <Button variant="default" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Node
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {mockNodes.map((node) => (
          <NodeCard key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
}
