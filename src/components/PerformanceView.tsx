import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePerformanceMetrics, MetricType } from '@/hooks/usePerformanceMetrics';
import { useAdmin } from '@/hooks/useAdmin';
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
  TrendingDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  LineChart,
  Line,
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
  Scatter,
} from 'recharts';

interface PerformanceViewProps {
  onShowAuth?: () => void;
}

export function PerformanceView({ onShowAuth }: PerformanceViewProps) {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
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
      page_load: 'hsl(var(--primary))',
      api_call: 'hsl(var(--accent))',
      render: 'hsl(142, 76%, 36%)',
      interaction: 'hsl(45, 93%, 47%)',
    };

    return Object.entries(types).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value,
      color: colors[name] || 'hsl(var(--muted))',
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

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Access Denied
          </CardTitle>
          <CardDescription>
            Performance metrics are only available to administrators.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onShowAuth} variant="outline">
            Sign in as Admin
          </Button>
        </CardContent>
      </Card>
    );
  }

  const pageLoadData = getMetricsByTime('page_load');
  const apiData = getMetricsByTime('api_call');

  const pieData = [
    { name: 'Success', value: stats?.successRate || 0, color: 'hsl(142, 76%, 36%)' },
    { name: 'Failed', value: 100 - (stats?.successRate || 0), color: 'hsl(var(--destructive))' },
  ].filter(d => d.value > 0);

  const getWebVitalStatus = (metric: string, value: number | null) => {
    if (value === null) return 'unknown';
    switch (metric) {
      case 'lcp':
        return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
      case 'fid':
        return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
      case 'cls':
        return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
      default:
        return 'unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-500 text-white';
      case 'needs-improvement': return 'bg-yellow-500 text-white';
      case 'poor': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTrend = (current: number, target: number) => {
    if (current <= target) return { icon: ArrowDown, color: 'text-green-500', label: 'Good' };
    return { icon: ArrowUp, color: 'text-destructive', label: 'Above target' };
  };

  const pageLoadTrend = getTrend(stats?.avgPageLoad || 0, 3000);
  const apiTrend = getTrend(stats?.avgApiResponse || 0, 200);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Performance Metrics
          </h1>
          <p className="text-muted-foreground">
            {metrics.length.toLocaleString()} events tracked • Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
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
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => cleanupMetrics(30)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Cleanup
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Avg Page Load
              </span>
              <pageLoadTrend.icon className={`h-4 w-4 ${pageLoadTrend.color}`} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {stats?.avgPageLoad.toFixed(0) || 0}
              <span className="text-lg font-normal ml-1">ms</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">Target: &lt; 3000ms</p>
              <Badge variant="outline" className={pageLoadTrend.color}>
                {pageLoadTrend.label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent" />
                Avg API Response
              </span>
              <apiTrend.icon className={`h-4 w-4 ${apiTrend.color}`} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">
              {stats?.avgApiResponse.toFixed(0) || 0}
              <span className="text-lg font-normal ml-1">ms</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">P95: {stats?.p95ApiResponse.toFixed(0) || 0}ms</p>
              <Badge variant="outline" className={apiTrend.color}>
                {apiTrend.label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Gauge className="h-4 w-4 text-green-500" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {stats?.successRate.toFixed(1) || 100}
              <span className="text-lg font-normal ml-1">%</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">{stats?.totalEvents || 0} total events</p>
              <Badge variant="outline" className={stats?.successRate && stats.successRate >= 95 ? 'text-green-500' : 'text-destructive'}>
                {stats?.successRate && stats.successRate >= 95 ? 'Healthy' : 'Attention'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Timer className="h-4 w-4 text-yellow-500" />
              Avg Render Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500">
              {stats?.avgRenderTime.toFixed(0) || 0}
              <span className="text-lg font-normal ml-1">ms</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">Component renders</p>
              <Badge variant="outline" className={stats?.avgRenderTime && stats.avgRenderTime <= 16 ? 'text-green-500' : 'text-yellow-500'}>
                {stats?.avgRenderTime && stats.avgRenderTime <= 16 ? '60fps' : 'Optimize'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Core Web Vitals
          </CardTitle>
          <CardDescription>Real-time browser performance metrics (Google ranking factors)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">LCP</span>
                <Badge className={getStatusColor(getWebVitalStatus('lcp', webVitals.lcp))}>
                  {getWebVitalStatus('lcp', webVitals.lcp)}
                </Badge>
              </div>
              <div className="text-2xl font-bold">
                {webVitals.lcp ? `${webVitals.lcp.toFixed(0)} ms` : 'Measuring...'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Largest Contentful Paint • Good: ≤2500ms</p>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">FID</span>
                <Badge className={getStatusColor(getWebVitalStatus('fid', webVitals.fid))}>
                  {getWebVitalStatus('fid', webVitals.fid)}
                </Badge>
              </div>
              <div className="text-2xl font-bold">
                {webVitals.fid ? `${webVitals.fid.toFixed(0)} ms` : 'Awaiting input...'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">First Input Delay • Good: ≤100ms</p>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">CLS</span>
                <Badge className={getStatusColor(getWebVitalStatus('cls', webVitals.cls))}>
                  {getWebVitalStatus('cls', webVitals.cls)}
                </Badge>
              </div>
              <div className="text-2xl font-bold">
                {webVitals.cls !== null ? webVitals.cls.toFixed(3) : 'Measuring...'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Cumulative Layout Shift • Good: ≤0.1</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="api">API Analysis</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Combined Timeline */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Timeline
                </CardTitle>
                <CardDescription>All metric types over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {timelineData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timelineData}>
                        <defs>
                          <linearGradient id="pageLoadGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="apiGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="renderGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="time" className="text-xs" tick={{ fontSize: 11 }} />
                        <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }} 
                          formatter={(value: number) => [`${value.toFixed(0)} ms`]}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="pageLoad" 
                          name="Page Load"
                          stroke="hsl(var(--primary))" 
                          fill="url(#pageLoadGradient)"
                          strokeWidth={2}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="api" 
                          name="API Call"
                          stroke="hsl(var(--accent))" 
                          fill="url(#apiGradient)"
                          strokeWidth={2}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="render" 
                          name="Render"
                          stroke="hsl(142, 76%, 36%)" 
                          fill="url(#renderGradient)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No timeline data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Metric Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Metric Distribution
                </CardTitle>
                <CardDescription>Events by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {typeDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={typeDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {typeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [value.toLocaleString(), 'Events']}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No distribution data
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Success Rate Over Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Success Rate Trend
                </CardTitle>
                <CardDescription>API success rate over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {successRateData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={successRateData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="time" className="text-xs" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="left" className="text-xs" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} className="text-xs" tick={{ fontSize: 11 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="success" name="Success" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="failed" name="Failed" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="rate" name="Success %" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No success rate data
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Page Load Times</CardTitle>
                <CardDescription>Average page load time trend</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {pageLoadData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={pageLoadData}>
                        <defs>
                          <linearGradient id="pageLoadFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="time" className="text-xs" tick={{ fontSize: 11 }} />
                        <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }} 
                          formatter={(value: number) => [`${value.toFixed(0)} ms`, 'Avg Load Time']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="avg" 
                          stroke="hsl(var(--primary))" 
                          fill="url(#pageLoadFill)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No page load data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Response Times</CardTitle>
                <CardDescription>Average API response time trend</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {apiData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={apiData}>
                        <defs>
                          <linearGradient id="apiFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.05}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="time" className="text-xs" tick={{ fontSize: 11 }} />
                        <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }} 
                          formatter={(value: number) => [`${value.toFixed(0)} ms`, 'Avg Response']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="avg" 
                          stroke="hsl(var(--accent))" 
                          fill="url(#apiFill)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No API data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* API Analysis Tab */}
        <TabsContent value="api" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Endpoint Performance
                </CardTitle>
                <CardDescription>Average and P95 response times by endpoint</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {endpointData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={endpointData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" className="text-xs" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" width={100} className="text-xs" tick={{ fontSize: 11 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [`${value.toFixed(0)} ms`]}
                        />
                        <Legend />
                        <Bar dataKey="avg" name="Average" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="p95" name="P95" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No endpoint data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Rate</CardTitle>
                <CardDescription>API call success vs failure ratio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  {pieData.length > 0 && stats?.totalEvents ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [`${value.toFixed(1)}%`]}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-foreground">
                          {stats.successRate.toFixed(0)}%
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No success rate data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Distribution</CardTitle>
                <CardDescription>Histogram of API response times</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {distributionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={distributionData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="range" className="text-xs" tick={{ fontSize: 11 }} />
                        <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [value.toLocaleString(), 'Requests']}
                        />
                        <Bar 
                          dataKey="count" 
                          fill="hsl(var(--primary))" 
                          radius={[4, 4, 0, 0]}
                        >
                          {distributionData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={
                                entry.max <= 100 ? 'hsl(142, 76%, 36%)' :
                                entry.max <= 500 ? 'hsl(45, 93%, 47%)' :
                                'hsl(var(--destructive))'
                              } 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No distribution data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Call Volume by Endpoint</CardTitle>
                <CardDescription>Number of calls per endpoint</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {endpointData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={endpointData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                        <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [value.toLocaleString(), 'Calls']}
                        />
                        <Bar 
                          dataKey="count" 
                          fill="hsl(var(--accent))" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No call volume data
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Metric Details</CardTitle>
                  <CardDescription>Recent performance events (showing latest 50)</CardDescription>
                </div>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-40">
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
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.slice(0, 50).map((metric) => (
                      <TableRow key={metric.id}>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={
                              metric.metric_type === 'page_load' ? 'border-primary text-primary' :
                              metric.metric_type === 'api_call' ? 'border-accent text-accent' :
                              metric.metric_type === 'render' ? 'border-green-500 text-green-500' :
                              'border-yellow-500 text-yellow-500'
                            }
                          >
                            {metric.metric_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{metric.metric_name}</TableCell>
                        <TableCell className="text-right font-mono">
                          <span className={
                            metric.value_ms <= 100 ? 'text-green-500' :
                            metric.value_ms <= 500 ? 'text-yellow-500' :
                            'text-destructive'
                          }>
                            {metric.value_ms.toFixed(0)} ms
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {metric.metadata?.success === true || metric.metadata?.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                          ) : metric.metadata?.success === false ? (
                            <AlertCircle className="h-4 w-4 text-destructive mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(metric.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {metrics.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No metrics recorded yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
