import { memo, useState } from 'react';
import { IoTTransaction } from '@/types/blockchain';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, Copy, Check } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from '@/hooks/use-toast';

interface TransactionRowProps {
  transaction: IoTTransaction;
}

export const TransactionRow = memo(function TransactionRow({ transaction }: TransactionRowProps) {
  const [copied, setCopied] = useState(false);

  const hashToCopy = String(transaction.data?.hash || transaction.txHash || transaction.id);

  const copyHash = async () => {
    try {
      await navigator.clipboard.writeText(hashToCopy);
      setCopied(true);
      toast({ title: 'Hash copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50 hover:border-primary/30 transition-colors">
      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
        <ArrowRight className="h-4 w-4 text-primary" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-mono text-sm text-foreground truncate">
          {transaction.deviceName}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {hashToCopy.slice(0, 16)}...{hashToCopy.slice(-8)}
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(transaction.timestamp, { addSuffix: true })}
        </p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 flex-shrink-0"
        onClick={copyHash}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
});
