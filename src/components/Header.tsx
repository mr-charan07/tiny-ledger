import { Box, Settings, Bell, Search, Wallet, AlertTriangle, ExternalLink, LogIn, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useWeb3 } from '@/contexts/Web3Context';
import { getEtherscanLink } from '@/config/blockchain';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HeaderProps {
  isAuthenticated?: boolean;
  onShowAuth?: () => void;
}

export function Header({ isAuthenticated, onShowAuth }: HeaderProps) {
  const { 
    account, 
    isConnecting, 
    isConnected, 
    isCorrectNetwork,
    connectWallet, 
    disconnectWallet,
    switchToSepolia 
  } = useWeb3();

  const formatAddress = (addr: string) => 
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out');
  };

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
          {isConnected && !isCorrectNetwork && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={switchToSepolia}
              className="gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Wrong Network
            </Button>
          )}

          {/* <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent animate-pulse" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button> */}

          {/* Auth buttons */}
          {isAuthenticated ? (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onShowAuth}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          )}

          {/* Wallet connection */}
          {isConnected ? (
            <div className="flex items-center gap-2">
              <a 
                href={getEtherscanLink('address', account!)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-secondary border border-border font-mono text-sm hover:bg-secondary/80 transition-colors"
              >
                <Wallet className="h-4 w-4 text-primary" />
                {formatAddress(account!)}
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
              <Button 
                variant="outline" 
                size="sm"
                onClick={disconnectWallet}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button 
              variant="cyber" 
              size="sm"
              onClick={connectWallet}
              disabled={isConnecting}
            >
              <Wallet className="h-4 w-4 mr-2" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </div>
      </div>

      {/* Network indicator */}
      {isConnected && isCorrectNetwork && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
      )}
    </header>
  );
}
