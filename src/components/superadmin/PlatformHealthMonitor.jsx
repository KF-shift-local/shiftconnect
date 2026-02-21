import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Activity,
  Database,
  Zap,
  Clock,
  TrendingUp
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export default function PlatformHealthMonitor({ systemLogs = [], applications = [], jobs = [] }) {
  const [performanceData, setPerformanceData] = useState([]);
  const [systemStatus, setSystemStatus] = useState({
    database: 'operational',
    api: 'operational',
    auth: 'operational',
    notifications: 'operational'
  });

  useEffect(() => {
    // Generate mock performance data based on system logs
    const last24Hours = Array.from({ length: 24 }, (_, i) => {
      const hour = 23 - i;
      const errorCount = systemLogs.filter(log => {
        const logDate = new Date(log.created_date);
        const hoursAgo = (Date.now() - logDate.getTime()) / (1000 * 60 * 60);
        return hoursAgo >= hour && hoursAgo < hour + 1 && log.log_type === 'error';
      }).length;

      return {
        time: `${hour}h ago`,
        errors: errorCount,
        responseTime: Math.floor(Math.random() * 100) + 50, // Mock API response time
        requests: Math.floor(Math.random() * 500) + 100
      };
    }).reverse();

    setPerformanceData(last24Hours);

    // Update system status based on recent errors
    const recentErrors = systemLogs.filter(log => {
      const hourAgo = Date.now() - 60 * 60 * 1000;
      return new Date(log.created_date).getTime() > hourAgo && !log.resolved;
    });

    const newStatus = { ...systemStatus };
    recentErrors.forEach(error => {
      if (error.log_type === 'critical') {
        newStatus[error.component] = 'critical';
      } else if (error.log_type === 'error' && newStatus[error.component] === 'operational') {
        newStatus[error.component] = 'degraded';
      }
    });
    setSystemStatus(newStatus);
  }, [systemLogs]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational': return 'bg-green-100 text-green-800';
      case 'degraded': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'degraded': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critical': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Activity className="w-5 h-5 text-slate-600" />;
    }
  };

  const recentErrors = systemLogs
    .filter(log => log.log_type === 'error' || log.log_type === 'critical')
    .slice(0, 10);

  const unresolvedErrors = systemLogs.filter(log => !log.resolved && (log.log_type === 'error' || log.log_type === 'critical'));

  return (
    <div className="space-y-6">
      {/* System Components Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(systemStatus).map(([component, status]) => (
          <Card key={component}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(status)}
                  <span className="font-medium text-slate-900 capitalize">{component}</span>
                </div>
              </div>
              <Badge className={getStatusColor(status)}>
                {status === 'operational' ? 'Operational' : status === 'degraded' ? 'Degraded' : 'Critical'}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">API Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-blue-600" />
              <div>
                <span className="text-3xl font-bold text-slate-900">
                  {performanceData.length > 0 ? performanceData[performanceData.length - 1].responseTime : 0}
                </span>
                <span className="text-lg text-slate-600 ml-1">ms</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Average response time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Error Rate (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
              <div>
                <span className="text-3xl font-bold text-slate-900">{unresolvedErrors.length}</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Unresolved errors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-green-600" />
              <div>
                <span className="text-3xl font-bold text-slate-900">99.9</span>
                <span className="text-lg text-slate-600 ml-1">%</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Historical Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            API Response Time (Last 24 Hours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Line type="monotone" dataKey="responseTime" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Error Rate Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Error Rate (Last 24 Hours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Errors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Recent System Errors
          </CardTitle>
          <CardDescription>Last 10 error logs</CardDescription>
        </CardHeader>
        <CardContent>
          {recentErrors.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <p className="text-slate-600">No recent errors</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recentErrors.map(log => (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg border ${
                    log.resolved ? 'border-slate-200 bg-slate-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={log.log_type === 'critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}>
                          {log.log_type}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {log.component}
                        </Badge>
                        {log.resolved && (
                          <Badge className="bg-green-100 text-green-800">Resolved</Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-900">{log.message}</p>
                      {log.details && (
                        <p className="text-xs text-slate-600 mt-1 font-mono">{log.details}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-2">
                        {format(new Date(log.created_date), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}