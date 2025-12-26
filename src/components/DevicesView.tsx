import { useState } from 'react';
import { useBlockchain } from '@/hooks/useBlockchain';
import { useWeb3 } from '@/contexts/Web3Context';
import { DeviceCard } from './DeviceCard';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, Search, Filter, Wallet, AlertCircle, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';

export function DevicesView() {
  const { isConnected, isCorrectNetwork, connectWallet, switchToSepolia } = useWeb3();
  const { devices, registerDevice, fetchData, isLoading, isContractDeployed } = useBlockchain();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({
    address: '',
    name: '',
    type: 'sensor',
    permission: 1, // write
  });

  const onlineDevices = devices.filter(d => d.status === 'online').length;

  const handleRegisterDevice = async () => {
    if (!newDevice.address || !newDevice.name) return;
    
    const success = await registerDevice(
      newDevice.address,
      newDevice.name,
      newDevice.type,
      newDevice.permission
    );
    if (success) {
      setIsDialogOpen(false);
      setNewDevice({ address: '', name: '', type: 'sensor', permission: 1 });
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4 animate-slide-in">
        <Wallet className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Connect wallet to view devices</p>
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
          <h2 className="text-xl font-bold text-foreground">IoT Device Registry</h2>
          <p className="text-sm text-muted-foreground">
            {onlineDevices} of {devices.length} devices online
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search devices..."
              className="pl-10 w-full sm:w-64 bg-secondary border-border font-mono text-sm"
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Register Device
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register IoT Device</DialogTitle>
                <DialogDescription>
                  Add a new IoT device to the blockchain network
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="deviceAddress">Device Address</Label>
                  <Input
                    id="deviceAddress"
                    placeholder="0x..."
                    value={newDevice.address}
                    onChange={(e) => setNewDevice({ ...newDevice, address: e.target.value })}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deviceName">Device Name</Label>
                  <Input
                    id="deviceName"
                    placeholder="e.g., Temperature Sensor A1"
                    value={newDevice.name}
                    onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Device Type</Label>
                  <Select
                    value={newDevice.type}
                    onValueChange={(value) => setNewDevice({ ...newDevice, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sensor">Sensor</SelectItem>
                      <SelectItem value="actuator">Actuator</SelectItem>
                      <SelectItem value="gateway">Gateway</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Permission Level</Label>
                  <Select
                    value={newDevice.permission.toString()}
                    onValueChange={(value) => setNewDevice({ ...newDevice, permission: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Read Only</SelectItem>
                      <SelectItem value="1">Write</SelectItem>
                      <SelectItem value="2">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleRegisterDevice}
                  disabled={isLoading || !newDevice.address || !newDevice.name}
                >
                  {isLoading ? 'Registering...' : 'Register Device'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {devices.length > 0 ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {devices.map((device) => (
            <DeviceCard key={device.id} device={device} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No devices registered yet</p>
          <p className="text-sm text-muted-foreground mt-1">Register your first IoT device</p>
        </div>
      )}
    </div>
  );
}
