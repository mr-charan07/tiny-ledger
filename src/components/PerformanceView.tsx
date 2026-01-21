import { useEffect, useState } from 'react';
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
  Timer
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
    { name: 'Success', value: stats?.successRate || 0, color: 'hsl(var(--accent))' },
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
      case 'good': return 'bg-accent text-accent-foreground';
      case 'needs-improvement': return 'bg-yellow-500 text-white';
      case 'poor': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Performance Metrics
          </h1>
          <p className="text-muted-foreground">Monitor application performance and optimize user experience</p>
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
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Avg Page Load
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats?.avgPageLoad.toFixed(0) || 0} ms
            </div>
            <p className="text-xs text-muted-foreground">Target: &lt; 3000ms</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent" />
              Avg API Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {stats?.avgApiResponse.toFixed(0) || 0} ms
            </div>
            <p className="text-xs text-muted-foreground">P95: {stats?.p95ApiResponse.toFixed(0) || 0}ms</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.successRate.toFixed(1) || 100}%
            </div>
            <p className="text-xs text-muted-foreground">{stats?.totalEvents || 0} total events</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-muted/50 to-muted/30 border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Avg Render Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.avgRenderTime.toFixed(0) || 0} ms
            </div>
            <p className="text-xs text-muted-foreground">Component renders</p>
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
          <CardDescription>Real-time browser performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">LCP (Largest Contentful Paint)</span>
                <Badge className={getStatusColor(getWebVitalStatus('lcp', webVitals.lcp))}>
                  {getWebVitalStatus('lcp', webVitals.lcp)}
                </Badge>
              </div>
              <div className="text-2xl font-bold">
                {webVitals.lcp ? `${webVitals.lcp.toFixed(0)} ms` : 'Measuring...'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Good: ≤2500ms</p>
            </div>

            <div className="p-4 rounded-lg bg-muted/30 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">FID (First Input Delay)</span>
                <Badge className={getStatusColor(getWebVitalStatus('fid', webVitals.fid))}>
                  {getWebVitalStatus('fid', webVitals.fid)}
                </Badge>
              </div>
              <div className="text-2xl font-bold">
                {webVitals.fid ? `${webVitals.fid.toFixed(0)} ms` : 'Awaiting input...'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Good: ≤100ms</p>
            </div>

            <div className="p-4 rounded-lg bg-muted/30 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">CLS (Cumulative Layout Shift)</span>
                <Badge className={getStatusColor(getWebVitalStatus('cls', webVitals.cls))}>
                  {getWebVitalStatus('cls', webVitals.cls)}
                </Badge>
              </div>
              <div className="text-2xl font-bold">
                {webVitals.cls !== null ? webVitals.cls.toFixed(3) : 'Measuring...'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Good: ≤0.1</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="api">API Performance</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Page Load Times</CardTitle>
              <CardDescription>Average page load time over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {pageLoadData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pageLoadData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="time" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))' 
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avg" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No page load data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>API Response Times</CardTitle>
                <CardDescription>Average response time per day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {apiData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={apiData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="time" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))' 
                          }} 
                        />
                        <Bar 
                          dataKey="avg" 
                          fill="hsl(var(--accent))" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No API data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Rate</CardTitle>
                <CardDescription>API call success vs failure</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {pieData.length > 0 && stats?.totalEvents ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
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

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Metric Details</CardTitle>
                  <CardDescription>All recorded performance events</CardDescription>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.slice(0, 50).map((metric) => (
                    <TableRow key={metric.id}>
                      <TableCell>
                        <Badge variant="outline">{metric.metric_type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{metric.metric_name}</TableCell>
                      <TableCell>{metric.value_ms.toFixed(0)} ms</TableCell>
                      <TableCell>
                        {metric.metadata?.success === true || metric.metadata?.status === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-accent" />
                        ) : metric.metadata?.success === false ? (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(metric.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {metrics.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No metrics recorded yet. Performance data will appear as users interact with the app.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
