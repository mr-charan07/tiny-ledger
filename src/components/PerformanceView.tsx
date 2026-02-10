import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePerformanceMetrics, MetricType } from '@/hooks/usePerformanceMetrics';
import { PerformanceStatCard } from './performance/PerformanceStatCard';
import { WebVitalCard } from './performance/WebVitalCard';
import { EmptyChartState } from './performance/EmptyChartState';
import { 
  Activity, 
  Clock, 
  Gauge, 
  TrendingUp, 
  Zap, 
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle,
  Timer,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Signal,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
  ComposedChart,
  Line,
} from 'recharts';

const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'hsl(220, 18%, 10%)',
  border: '1px solid hsl(220, 15%, 20%)',
  borderRadius: '10px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  fontSize: '12px',
  fontFamily: 'JetBrains Mono, monospace',
};

interface PerformanceViewProps {
  onShowAuth?: () => void;
}

export function PerformanceView({ onShowAuth }: PerformanceViewProps) {
  const { 
    metrics, 
    stats, 
    webVitals, 
    isLoading, 
    fetchMetrics, 
    cleanupMetrics,
    getMetricsByTime 
  } = usePerformanceMetrics();
  
  const [timeRange, setTimeRange] = useState<string>('7');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    fetchMetrics(parseInt(timeRange), selectedType === 'all' ? undefined : selectedType as MetricType);
  }, [fetchMetrics, timeRange, selectedType]);

  // Calculate distribution data for histogram
  const distributionData = useMemo(() => {
    const apiMetrics = metrics.filter(m => m.metric_type === 'api_call');
    if (apiMetrics.length === 0) return [];

    const buckets = [
      { range: '0-50ms', min: 0, max: 50, count: 0 },
      { range: '50-100ms', min: 50, max: 100, count: 0 },
      { range: '100-200ms', min: 100, max: 200, count: 0 },
      { range: '200-500ms', min: 200, max: 500, count: 0 },
      { range: '500ms-1s', min: 500, max: 1000, count: 0 },
      { range: '>1s', min: 1000, max: Infinity, count: 0 },
    ];

    apiMetrics.forEach(m => {
      const bucket = buckets.find(b => m.value_ms >= b.min && m.value_ms < b.max);
      if (bucket) bucket.count++;
    });

    return buckets;
  }, [metrics]);

  // Calculate metrics by endpoint
  const endpointData = useMemo(() => {
    const apiMetrics = metrics.filter(m => m.metric_type === 'api_call');
    const grouped: Record<string, { name: string; avg: number; count: number; p95: number; values: number[] }> = {};

    apiMetrics.forEach(m => {
      if (!grouped[m.metric_name]) {
        grouped[m.metric_name] = { name: m.metric_name, avg: 0, count: 0, p95: 0, values: [] };
      }
      grouped[m.metric_name].values.push(m.value_ms);
      grouped[m.metric_name].count++;
    });

    Object.values(grouped).forEach(g => {
      g.avg = g.values.reduce((a, b) => a + b, 0) / g.values.length;
      g.values.sort((a, b) => a - b);
      g.p95 = g.values[Math.floor(g.values.length * 0.95)] || 0;
    });

    return Object.values(grouped).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [metrics]);

  // Calculate type distribution
  const typeDistribution = useMemo(() => {
    const types: Record<string, number> = {};
    metrics.forEach(m => {
      types[m.metric_type] = (types[m.metric_type] || 0) + 1;
    });
    
    const colors: Record<string, string> = {
      page_load: 'hsl(185, 80%, 50%)',
      api_call: 'hsl(160, 70%, 45%)',
      render: 'hsl(142, 76%, 36%)',
      interaction: 'hsl(38, 90%, 55%)',
    };

    return Object.entries(types).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value,
      color: colors[name] || 'hsl(215, 15%, 55%)',
    }));
  }, [metrics]);

  // Combined timeline data
  const timelineData = useMemo(() => {
    const pageLoadData = getMetricsByTime('page_load');
    const apiData = getMetricsByTime('api_call');
    const renderData = getMetricsByTime('render');
    
    const combined: Record<string, { time: string; pageLoad: number; api: number; render: number }> = {};
    
    pageLoadData.forEach(d => {
      if (!combined[d.time]) combined[d.time] = { time: d.time, pageLoad: 0, api: 0, render: 0 };
      combined[d.time].pageLoad = d.avg;
    });
    
    apiData.forEach(d => {
      if (!combined[d.time]) combined[d.time] = { time: d.time, pageLoad: 0, api: 0, render: 0 };
      combined[d.time].api = d.avg;
    });

    renderData.forEach(d => {
      if (!combined[d.time]) combined[d.time] = { time: d.time, pageLoad: 0, api: 0, render: 0 };
      combined[d.time].render = d.avg;
    });
    
    return Object.values(combined).sort((a, b) => 
      new Date(a.time).getTime() - new Date(b.time).getTime()
    );
  }, [getMetricsByTime]);

  // Success rate over time
  const successRateData = useMemo(() => {
    const grouped: Record<string, { time: string; success: number; failed: number; rate: number }> = {};
    
    metrics.filter(m => m.metric_type === 'api_call').forEach(m => {
      const date = new Date(m.created_at).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = { time: date, success: 0, failed: 0, rate: 0 };
      }
      if (m.metadata?.success === true) {
        grouped[date].success++;
      } else if (m.metadata?.success === false) {
        grouped[date].failed++;
      }
    });

    Object.values(grouped).forEach(g => {
      const total = g.success + g.failed;
      g.rate = total > 0 ? (g.success / total) * 100 : 100;
    });

    return Object.values(grouped).sort((a, b) => 
      new Date(a.time).getTime() - new Date(b.time).getTime()
    );
  }, [metrics]);

  const pageLoadData = getMetricsByTime('page_load');
  const apiData = getMetricsByTime('api_call');

  const pieData = [
    { name: 'Success', value: stats?.successRate || 0, color: 'hsl(160, 70%, 45%)' },
    { name: 'Failed', value: 100 - (stats?.successRate || 0), color: 'hsl(0, 70%, 55%)' },
  ].filter(d => d.value > 0);

  const getTrend = (current: number, target: number) => {
    if (current <= target) return { icon: ArrowDown, color: 'text-accent', label: 'Good' };
    return { icon: ArrowUp, color: 'text-destructive', label: 'Above target' };
  };

  const pageLoadTrend = getTrend(stats?.avgPageLoad || 0, 3000);
  const apiTrend = getTrend(stats?.avgApiResponse || 0, 200);

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 glow-primary">
            <Activity className="h-6 w-6 text-primary text-glow-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              Performance Metrics
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5">
                <Signal className="h-3 w-3 text-accent" />
                <span className="text-xs font-mono text-muted-foreground">
                  {metrics.length.toLocaleString()} events
                </span>
              </div>
              <span className="text-muted-foreground/30">•</span>
              <span className="text-xs font-mono text-muted-foreground">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 font-mono text-xs bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24h</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => fetchMetrics(parseInt(timeRange))}
            disabled={isLoading}
            className="border-border hover:border-primary/50 hover:glow-primary transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => cleanupMetrics(30)}
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Cleanup
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PerformanceStatCard
          title="Avg Page Load"
          value={stats?.avgPageLoad.toFixed(0) || '0'}
          unit="ms"
          subtitle="Target: < 3000ms"
          icon={Clock}
          trendIcon={pageLoadTrend.icon}
          trendColor={pageLoadTrend.color}
          trendLabel={pageLoadTrend.label}
          accentClass="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20"
          glowClass="hover:glow-primary"
        />
        <PerformanceStatCard
          title="Avg API Response"
          value={stats?.avgApiResponse.toFixed(0) || '0'}
          unit="ms"
          subtitle={`P95: ${stats?.p95ApiResponse.toFixed(0) || '0'}ms`}
          icon={Zap}
          trendIcon={apiTrend.icon}
          trendColor={apiTrend.color}
          trendLabel={apiTrend.label}
          accentClass="bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border-accent/20"
          glowClass="hover:glow-accent"
        />
        <PerformanceStatCard
          title="Success Rate"
          value={stats?.successRate.toFixed(1) || '100'}
          unit="%"
          subtitle={`${stats?.totalEvents || 0} total events`}
          icon={Gauge}
          trendIcon={stats?.successRate && stats.successRate >= 95 ? CheckCircle : AlertCircle}
          trendColor={stats?.successRate && stats.successRate >= 95 ? 'text-accent' : 'text-destructive'}
          trendLabel={stats?.successRate && stats.successRate >= 95 ? 'Healthy' : 'Attention'}
          accentClass="bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border-accent/20"
          glowClass="hover:glow-accent"
        />
        <PerformanceStatCard
          title="Avg Render Time"
          value={stats?.avgRenderTime.toFixed(0) || '0'}
          unit="ms"
          subtitle="Component renders"
          icon={Timer}
          trendIcon={stats?.avgRenderTime && stats.avgRenderTime <= 16 ? ArrowDown : ArrowUp}
          trendColor={stats?.avgRenderTime && stats.avgRenderTime <= 16 ? 'text-accent' : 'text-warning'}
          trendLabel={stats?.avgRenderTime && stats.avgRenderTime <= 16 ? '60fps' : 'Optimize'}
          accentClass="bg-gradient-to-br from-warning/10 via-warning/5 to-transparent border-warning/20"
          glowClass="hover:glow-warning"
        />
      </div>

      {/* Web Vitals */}
      <Card className="border-primary/10 bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Core Web Vitals
              </CardTitle>
              <CardDescription className="font-mono text-xs mt-1">
                Real-time browser performance • Google ranking factors
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-[10px] tracking-wider border-primary/30 text-primary">
              LIVE
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <WebVitalCard
              name="LCP"
              fullName="Largest Contentful Paint"
              value={webVitals.lcp}
              unit="ms"
              thresholds={{ good: 2500, needsImprovement: 4000 }}
              placeholder="Measuring..."
            />
            <WebVitalCard
              name="FID"
              fullName="First Input Delay"
              value={webVitals.fid}
              unit="ms"
              thresholds={{ good: 100, needsImprovement: 300 }}
              placeholder="Awaiting input..."
            />
            <WebVitalCard
              name="CLS"
              fullName="Cumulative Layout Shift"
              value={webVitals.cls}
              unit=""
              thresholds={{ good: 0.1, needsImprovement: 0.25 }}
              placeholder="Measuring..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 bg-secondary/50 border border-border">
          <TabsTrigger value="overview" className="font-mono text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Overview</TabsTrigger>
          <TabsTrigger value="trends" className="font-mono text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Trends</TabsTrigger>
          <TabsTrigger value="api" className="font-mono text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">API Analysis</TabsTrigger>
          <TabsTrigger value="distribution" className="font-mono text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Distribution</TabsTrigger>
          <TabsTrigger value="details" className="font-mono text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Details</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Combined Timeline */}
            <Card className="lg:col-span-2 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Performance Timeline
                </CardTitle>
                <CardDescription className="font-mono text-xs">All metric types over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {timelineData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timelineData}>
                        <defs>
                          <linearGradient id="pageLoadGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(185, 80%, 50%)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(185, 80%, 50%)" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="apiGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(160, 70%, 45%)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(160, 70%, 45%)" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="renderGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" strokeOpacity={0.5} />
                        <XAxis dataKey="time" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'hsl(215, 15%, 55%)' }} />
                        <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'hsl(215, 15%, 55%)' }} />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number) => [`${value.toFixed(0)} ms`]} />
                        <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '11px' }} />
                        <Area type="monotone" dataKey="pageLoad" name="Page Load" stroke="hsl(185, 80%, 50%)" fill="url(#pageLoadGradient)" strokeWidth={2} />
                        <Area type="monotone" dataKey="api" name="API Call" stroke="hsl(160, 70%, 45%)" fill="url(#apiGradient)" strokeWidth={2} />
                        <Area type="monotone" dataKey="render" name="Render" stroke="hsl(142, 76%, 36%)" fill="url(#renderGradient)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChartState message="No timeline data available" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Metric Type Distribution */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <PieChartIcon className="h-4 w-4 text-primary" />
                  Metric Distribution
                </CardTitle>
                <CardDescription className="font-mono text-xs">Events by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {typeDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}
                        >
                          {typeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Events']} contentStyle={CHART_TOOLTIP_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChartState message="No distribution data" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Success Rate Over Time */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  Success Rate Trend
                </CardTitle>
                <CardDescription className="font-mono text-xs">API success rate over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {successRateData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={successRateData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" strokeOpacity={0.5} />
                        <XAxis dataKey="time" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'hsl(215, 15%, 55%)' }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'hsl(215, 15%, 55%)' }} />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'hsl(215, 15%, 55%)' }} />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '11px' }} />
                        <Bar yAxisId="left" dataKey="success" name="Success" fill="hsl(160, 70%, 45%)" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="failed" name="Failed" fill="hsl(0, 70%, 55%)" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="rate" name="Success %" stroke="hsl(185, 80%, 50%)" strokeWidth={2} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChartState message="No success rate data" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-sm">Page Load Times</CardTitle>
                <CardDescription className="font-mono text-xs">Average page load time trend</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {pageLoadData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={pageLoadData}>
                        <defs>
                          <linearGradient id="pageLoadFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(185, 80%, 50%)" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="hsl(185, 80%, 50%)" stopOpacity={0.05}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" strokeOpacity={0.5} />
                        <XAxis dataKey="time" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'hsl(215, 15%, 55%)' }} />
                        <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'hsl(215, 15%, 55%)' }} />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number) => [`${value.toFixed(0)} ms`, 'Avg Load Time']} />
                        <Area type="monotone" dataKey="avg" stroke="hsl(185, 80%, 50%)" fill="url(#pageLoadFill)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChartState message="No page load data available" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-sm">API Response Times</CardTitle>
                <CardDescription className="font-mono text-xs">Average API response time trend</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {apiData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={apiData}>
                        <defs>
                          <linearGradient id="apiFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(160, 70%, 45%)" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="hsl(160, 70%, 45%)" stopOpacity={0.05}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" strokeOpacity={0.5} />
                        <XAxis dataKey="time" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'hsl(215, 15%, 55%)' }} />
                        <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'hsl(215, 15%, 55%)' }} />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number) => [`${value.toFixed(0)} ms`, 'Avg Response']} />
                        <Area type="monotone" dataKey="avg" stroke="hsl(160, 70%, 45%)" fill="url(#apiFill)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChartState message="No API data available" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* API Analysis Tab */}
        <TabsContent value="api" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Endpoint Performance
                </CardTitle>
                <CardDescription className="font-mono text-xs">Average and P95 response times by endpoint</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {endpointData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={endpointData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" strokeOpacity={0.5} />
                        <XAxis type="number" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'hsl(215, 15%, 55%)' }} />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'hsl(215, 15%, 55%)' }} />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number) => [`${value.toFixed(0)} ms`]} />
                        <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '11px' }} />
                        <Bar dataKey="avg" name="Average" fill="hsl(160, 70%, 45%)" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="p95" name="P95" fill="hsl(185, 80%, 50%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChartState message="No endpoint data available" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-sm">Success Rate</CardTitle>
                <CardDescription className="font-mono text-xs">API call success vs failure ratio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  {pieData.length > 0 && stats?.totalEvents ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`]} contentStyle={CHART_TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '11px' }} />
                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'JetBrains Mono', fill: 'hsl(210, 20%, 95%)' }}>
                          {stats.successRate.toFixed(0)}%
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChartState message="No success rate data available" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-sm">Response Time Distribution</CardTitle>
                <CardDescription className="font-mono text-xs">Histogram of API response times</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {distributionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={distributionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" strokeOpacity={0.5} />
                        <XAxis dataKey="range" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'hsl(215, 15%, 55%)' }} />
                        <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'hsl(215, 15%, 55%)' }} />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number) => [value.toLocaleString(), 'Requests']} />
                        <Bar dataKey="count" fill="hsl(185, 80%, 50%)" radius={[4, 4, 0, 0]}>
                          {distributionData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={
                                entry.max <= 100 ? 'hsl(160, 70%, 45%)' :
                                entry.max <= 500 ? 'hsl(38, 90%, 55%)' :
                                'hsl(0, 70%, 55%)'
                              } 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChartState message="No distribution data available" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-sm">Call Volume by Endpoint</CardTitle>
                <CardDescription className="font-mono text-xs">Number of calls per endpoint</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {endpointData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={endpointData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" strokeOpacity={0.5} />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: 'hsl(215, 15%, 55%)' }} angle={-45} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'hsl(215, 15%, 55%)' }} />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value: number) => [value.toLocaleString(), 'Calls']} />
                        <Bar dataKey="count" fill="hsl(160, 70%, 45%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChartState message="No call volume data" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details">
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-sm">Metric Details</CardTitle>
                  <CardDescription className="font-mono text-xs">Recent performance events (showing latest 50)</CardDescription>
                </div>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-40 font-mono text-xs bg-secondary border-border">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="page_load">Page Load</SelectItem>
                    <SelectItem value="api_call">API Call</SelectItem>
                    <SelectItem value="render">Render</SelectItem>
                    <SelectItem value="interaction">Interaction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Type</TableHead>
                      <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Name</TableHead>
                      <TableHead className="text-right font-mono text-xs uppercase tracking-wider text-muted-foreground">Duration</TableHead>
                      <TableHead className="text-center font-mono text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                      <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.slice(0, 50).map((metric) => (
                      <TableRow key={metric.id} className="border-border/30 hover:bg-primary/5 transition-colors">
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={`font-mono text-[10px] uppercase tracking-wider ${
                              metric.metric_type === 'page_load' ? 'border-primary/40 text-primary bg-primary/5' :
                              metric.metric_type === 'api_call' ? 'border-accent/40 text-accent bg-accent/5' :
                              metric.metric_type === 'render' ? 'border-accent/40 text-accent bg-accent/5' :
                              'border-warning/40 text-warning bg-warning/5'
                            }`}
                          >
                            {metric.metric_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-medium">{metric.metric_name}</TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          <span className={
                            metric.value_ms <= 100 ? 'text-accent' :
                            metric.value_ms <= 500 ? 'text-warning' :
                            'text-destructive'
                          }>
                            {metric.value_ms.toFixed(0)} ms
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {metric.metadata?.success === true || metric.metadata?.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-accent mx-auto" />
                          ) : metric.metadata?.success === false ? (
                            <AlertCircle className="h-4 w-4 text-destructive mx-auto" />
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs font-mono">
                          {new Date(metric.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {metrics.length === 0 && (
                <div className="text-center py-12">
                  <div className="p-4 rounded-xl bg-muted/20 border border-border inline-block mb-3">
                    <Activity className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">No metrics recorded yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Metrics will appear as you use the application</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}