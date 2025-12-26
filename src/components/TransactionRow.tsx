import { IoTTransaction } from '@/types/blockchain';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight } from 'lucide-react';

interface TransactionRowProps {
  transaction: IoTTransaction;
}

export function TransactionRow({ transaction }: TransactionRowProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50 hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-4">
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
          <ArrowRight className="h-4 w-4 text-primary" />
        </div>
        
        <div>
          <p className="font-mono text-sm text-foreground">
            {transaction.deviceName}
          </p>
          <p className="text-xs text-muted-foreground">
            {transaction.id}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p className="font-mono text-xs text-primary">
          {Object.entries(transaction.data).map(([key, value]) => (
            <span key={key} className="mr-2">
              {key}: {value}
            </span>
          ))}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(transaction.timestamp, { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
