import { mockDevices } from '@/data/mockData';
import { DeviceCard } from './DeviceCard';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, Search, Filter } from 'lucide-react';

export function DevicesView() {
  const onlineDevices = mockDevices.filter(d => d.status === 'online').length;

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">IoT Device Registry</h2>
          <p className="text-sm text-muted-foreground">
            {onlineDevices} of {mockDevices.length} devices online
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
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="default" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Register Device
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {mockDevices.map((device) => (
          <DeviceCard key={device.id} device={device} />
        ))}
      </div>
    </div>
  );
}
