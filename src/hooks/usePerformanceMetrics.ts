import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type MetricType = 'page_load' | 'api_call' | 'render' | 'interaction';

export interface PerformanceMetric {
  id: string;
  user_id: string | null;
  metric_type: MetricType;
  metric_name: string;
  value_ms: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface PerformanceStats {
  avgPageLoad: number;
  avgApiResponse: number;
  avgRenderTime: number;
  totalEvents: number;
  successRate: number;
  p95ApiResponse: number;
}

export interface WebVitals {
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
}

export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [webVitals, setWebVitals] = useState<WebVitals>({ lcp: null, fid: null, cls: null });
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const timers = useRef<Map<string, number>>(new Map());

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Capture Web Vitals
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
      setWebVitals(prev => ({ ...prev, lcp: lastEntry.startTime }));
    });

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstEntry = entries[0] as PerformanceEntry & { processingStart: number; startTime: number };
      if (firstEntry) {
        setWebVitals(prev => ({ ...prev, fid: firstEntry.processingStart - firstEntry.startTime }));
      }
    });

    // Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value;
          setWebVitals(prev => ({ ...prev, cls: clsValue }));
        }
      }
    });

    try {
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      fidObserver.observe({ type: 'first-input', buffered: true });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.warn('Performance observers not supported:', e);
    }

    return () => {
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
    };
  }, []);

  // Start a performance timer
  const startTimer = useCallback((name: string) => {
    timers.current.set(name, performance.now());
  }, []);

  // End timer and record the metric
  const endTimer = useCallback(async (
    name: string, 
    type: MetricType, 
    metadata?: Record<string, unknown>
  ): Promise<number | null> => {
    const startTime = timers.current.get(name);
    if (!startTime) {
      console.warn(`No timer found for: ${name}`);
      return null;
    }

    const duration = performance.now() - startTime;
    timers.current.delete(name);

    // Record to database
    await recordMetric(type, name, duration, metadata);
    return duration;
  }, []);

  // Record a metric directly
  const recordMetric = useCallback(async (
    type: MetricType,
    name: string,
    valueMs: number,
    metadata?: Record<string, unknown>
  ) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const insertData: any = {
        user_id: userId,
        metric_type: type,
        metric_name: name,
        value_ms: valueMs,
        metadata: metadata || null,
      };
      
      const { error } = await supabase.from('performance_metrics').insert([insertData]);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to record metric:', error);
    }
  }, [userId]);

  // Fetch metrics from database
  const fetchMetrics = useCallback(async (
    days: number = 7,
    metricType?: MetricType
  ) => {
    setIsLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let query = supabase
        .from('performance_metrics')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);

      if (metricType) {
        query = query.eq('metric_type', metricType);
      }

      const { data, error } = await query;

      if (error) throw error;

      const typedMetrics: PerformanceMetric[] = (data || []).map(row => ({
        id: row.id,
        user_id: row.user_id,
        metric_type: row.metric_type as MetricType,
        metric_name: row.metric_name,
        value_ms: Number(row.value_ms),
        metadata: row.metadata as Record<string, unknown> | null,
        created_at: row.created_at,
      }));

      setMetrics(typedMetrics);

      // Calculate stats
      const pageLoadMetrics = typedMetrics.filter(m => m.metric_type === 'page_load');
      const apiMetrics = typedMetrics.filter(m => m.metric_type === 'api_call');
      const renderMetrics = typedMetrics.filter(m => m.metric_type === 'render');

      const avg = (arr: PerformanceMetric[]) => 
        arr.length ? arr.reduce((sum, m) => sum + m.value_ms, 0) / arr.length : 0;

      const p95 = (arr: PerformanceMetric[]) => {
        if (!arr.length) return 0;
        const sorted = [...arr].sort((a, b) => a.value_ms - b.value_ms);
        const idx = Math.floor(sorted.length * 0.95);
        return sorted[idx]?.value_ms || 0;
      };

      // Calculate success rate from metadata
      const successfulCalls = apiMetrics.filter(m => 
        m.metadata?.success === true || m.metadata?.status === 'success'
      ).length;
      const successRate = apiMetrics.length ? (successfulCalls / apiMetrics.length) * 100 : 100;

      setStats({
        avgPageLoad: avg(pageLoadMetrics),
        avgApiResponse: avg(apiMetrics),
        avgRenderTime: avg(renderMetrics),
        totalEvents: typedMetrics.length,
        successRate,
        p95ApiResponse: p95(apiMetrics),
      });

    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      toast.error('Failed to load performance metrics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete old metrics (admin cleanup)
  const cleanupMetrics = useCallback(async (olderThanDays: number = 30) => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { error } = await supabase
        .from('performance_metrics')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;
      toast.success(`Cleaned up metrics older than ${olderThanDays} days`);
      await fetchMetrics();
    } catch (error) {
      console.error('Failed to cleanup metrics:', error);
      toast.error('Failed to cleanup metrics');
    }
  }, [fetchMetrics]);

  // Get metrics grouped by time (for charts)
  const getMetricsByTime = useCallback((
    metricType: MetricType,
    intervalHours: number = 24
  ) => {
    const filtered = metrics.filter(m => m.metric_type === metricType);
    const grouped: Record<string, { time: string; avg: number; count: number }> = {};

    filtered.forEach(m => {
      const date = new Date(m.created_at);
      const key = metricType === 'page_load' || intervalHours >= 24
        ? date.toLocaleDateString()
        : `${date.toLocaleDateString()} ${date.getHours()}:00`;

      if (!grouped[key]) {
        grouped[key] = { time: key, avg: 0, count: 0 };
      }
      grouped[key].avg = (grouped[key].avg * grouped[key].count + m.value_ms) / (grouped[key].count + 1);
      grouped[key].count++;
    });

    return Object.values(grouped).sort((a, b) => 
      new Date(a.time).getTime() - new Date(b.time).getTime()
    );
  }, [metrics]);

  return {
    metrics,
    stats,
    webVitals,
    isLoading,
    startTimer,
    endTimer,
    recordMetric,
    fetchMetrics,
    cleanupMetrics,
    getMetricsByTime,
  };
}
