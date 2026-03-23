import { createContext, useContext, ReactNode } from 'react';
import { usePerformanceMetrics, MetricType } from '@/hooks/usePerformanceMetrics';

interface PerformanceContextType {
  startTimer: (name: string) => void;
  endTimer: (name: string, type: MetricType, metadata?: Record<string, unknown>) => Promise<number | null>;
  recordMetric: (type: MetricType, name: string, valueMs: number, metadata?: Record<string, unknown>) => Promise<void>;
}

const PerformanceContext = createContext<PerformanceContextType | null>(null);

export function PerformanceProvider({ children }: { children: ReactNode }) {
  const { startTimer, endTimer, recordMetric } = usePerformanceMetrics();

  return (
    <PerformanceContext.Provider value={{ startTimer, endTimer, recordMetric }}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const ctx = useContext(PerformanceContext);
  if (!ctx) {
    // Return no-ops if used outside provider (graceful degradation)
    return {
      startTimer: () => {},
      endTimer: async () => null,
      recordMetric: async () => {},
    } as PerformanceContextType;
  }
  return ctx;
}
