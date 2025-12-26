import { useState } from 'react';
import { useBlockchain } from '@/hooks/useBlockchain';
import { useWeb3 } from '@/contexts/Web3Context';
import { NodeCard } from './NodeCard';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, RefreshCw, Wallet, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Label } from './ui/label';
import { Switch } from './ui/switch';

export function NodesView() {
  const { isConnected, isCorrectNetwork, connectWallet, switchToSepolia, account } = useWeb3();
  const { nodes, registerNode, fetchData, isLoading, isContractDeployed } = useBlockchain();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newNode, setNewNode] = useState({
    address: '',
    name: '',
    isValidator: false,
  });

  const activeNodes = nodes.filter(n => n.status === 'active').length;
  const validators = nodes.filter(n => n.role === 'validator').length;

  const handleRegisterNode = async () => {
    if (!newNode.address || !newNode.name) return;
    
    const success = await registerNode(newNode.address, newNode.name, newNode.isValidator);
    if (success) {
      setIsDialogOpen(false);
      setNewNode({ address: '', name: '', isValidator: false });
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4 animate-slide-in">
        <Wallet className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Connect wallet to view nodes</p>
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
          <h2 className="text-xl font-bold text-foreground">Network Nodes</h2>
          <p className="text-sm text-muted-foreground">
            {activeNodes} active • {validators} validators
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Node
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register New Node</DialogTitle>
                <DialogDescription>
                  Add a new node to the permissioned blockchain network
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nodeAddress">Node Address</Label>
                  <Input
                    id="nodeAddress"
                    placeholder="0x..."
                    value={newNode.address}
                    onChange={(e) => setNewNode({ ...newNode, address: e.target.value })}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nodeName">Node Name</Label>
                  <Input
                    id="nodeName"
                    placeholder="e.g., Edge Node Alpha"
                    value={newNode.name}
                    onChange={(e) => setNewNode({ ...newNode, name: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Validator Node</Label>
                    <p className="text-sm text-muted-foreground">
                      Can validate and create blocks
                    </p>
                  </div>
                  <Switch
                    checked={newNode.isValidator}
                    onCheckedChange={(checked) => setNewNode({ ...newNode, isValidator: checked })}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleRegisterNode}
                  disabled={isLoading || !newNode.address || !newNode.name}
                >
                  {isLoading ? 'Registering...' : 'Register Node'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {nodes.length > 0 ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {nodes.map((node) => (
            <NodeCard key={node.id} node={node} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No nodes registered yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add your first node to get started</p>
        </div>
      )}
    </div>
  );
}
