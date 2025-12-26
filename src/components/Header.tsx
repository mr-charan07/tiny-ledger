import { Box, Settings, Bell, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20 glow-primary">
            <Box className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-mono text-primary text-glow-primary">
              IoT-CHAIN
            </h1>
            <p className="text-xs text-muted-foreground">
              Permissioned Blockchain Framework
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search blocks, transactions, devices..."
              className="pl-10 bg-secondary border-border focus:border-primary font-mono text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent animate-pulse" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="cyber" size="sm">
            Connect Wallet
          </Button>
        </div>
      </div>
    </header>
  );
}
