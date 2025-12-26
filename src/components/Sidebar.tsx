import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Box, 
  Server, 
  Cpu, 
  Shield, 
  Activity,
  FileText
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'blocks', label: 'Blocks', icon: Box },
  { id: 'nodes', label: 'Nodes', icon: Server },
  { id: 'devices', label: 'IoT Devices', icon: Cpu },
  { id: 'permissions', label: 'Permissions', icon: Shield },
  { id: 'analytics', label: 'Analytics', icon: Activity },
  { id: 'logs', label: 'Logs', icon: FileText },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col w-56 border-r border-border bg-sidebar h-[calc(100vh-4rem)]">
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary/20 text-primary glow-primary" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className={cn(
                "h-4 w-4",
                isActive && "text-glow-primary"
              )} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="p-3 rounded-lg bg-sidebar-accent">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-medium text-sidebar-foreground">Network Status</span>
          </div>
          <p className="text-xs text-muted-foreground">
            4 nodes active • 12.4 MB used
          </p>
        </div>
      </div>
    </aside>
  );
}
