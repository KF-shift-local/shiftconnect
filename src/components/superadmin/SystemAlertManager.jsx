import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Bell,
  Plus,
  Trash2,
  Edit,
  AlertTriangle,
  Info,
  AlertCircle,
  Megaphone,
  Loader2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';

export default function SystemAlertManager() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    alert_type: 'announcement',
    severity: 'medium',
    target_audience: 'all',
    is_active: true,
    start_date: new Date().toISOString().slice(0, 16),
    end_date: ''
  });

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['systemAlerts'],
    queryFn: () => base44.entities.SystemAlert.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SystemAlert.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemAlerts'] });
      handleCloseDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SystemAlert.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemAlerts'] });
      handleCloseDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SystemAlert.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemAlerts'] });
    }
  });

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingAlert(null);
    setFormData({
      title: '',
      message: '',
      alert_type: 'announcement',
      severity: 'medium',
      target_audience: 'all',
      is_active: true,
      start_date: new Date().toISOString().slice(0, 16),
      end_date: ''
    });
  };

  const handleEdit = (alert) => {
    setEditingAlert(alert);
    setFormData({
      title: alert.title,
      message: alert.message,
      alert_type: alert.alert_type,
      severity: alert.severity,
      target_audience: alert.target_audience,
      is_active: alert.is_active,
      start_date: alert.start_date ? new Date(alert.start_date).toISOString().slice(0, 16) : '',
      end_date: alert.end_date ? new Date(alert.end_date).toISOString().slice(0, 16) : ''
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    const data = {
      ...formData,
      start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null
    };

    if (editingAlert) {
      updateMutation.mutate({ id: editingAlert.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'outage': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'maintenance': return <Info className="w-5 h-5 text-blue-600" />;
      default: return <Megaphone className="w-5 h-5 text-purple-600" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const activeAlerts = alerts.filter(a => a.is_active);
  const inactiveAlerts = alerts.filter(a => !a.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">System Alerts</h2>
          <p className="text-slate-600">Manage platform-wide notifications and announcements</p>
        </div>
        <Button
          onClick={() => setShowDialog(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Alert
        </Button>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Active Alerts ({activeAlerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeAlerts.length === 0 ? (
            <p className="text-center text-slate-600 py-8">No active alerts</p>
          ) : (
            <div className="space-y-3">
              {activeAlerts.map(alert => (
                <div
                  key={alert.id}
                  className="p-4 rounded-lg border border-slate-200 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getAlertIcon(alert.alert_type)}
                        <h3 className="font-semibold text-slate-900">{alert.title}</h3>
                      </div>
                      <p className="text-sm text-slate-700 mb-2">{alert.message}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {alert.alert_type}
                        </Badge>
                        <Badge variant="outline">
                          Target: {alert.target_audience}
                        </Badge>
                        {alert.start_date && (
                          <Badge variant="outline">
                            Starts: {format(new Date(alert.start_date), 'MMM d, h:mm a')}
                          </Badge>
                        )}
                        {alert.end_date && (
                          <Badge variant="outline">
                            Ends: {format(new Date(alert.end_date), 'MMM d, h:mm a')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(alert)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(alert.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inactive/Past Alerts */}
      {inactiveAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inactive Alerts ({inactiveAlerts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inactiveAlerts.slice(0, 5).map(alert => (
                <div
                  key={alert.id}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50 opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{alert.title}</p>
                      <p className="text-xs text-slate-600">{alert.message}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(alert.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert Dialog */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAlert ? 'Edit Alert' : 'Create New Alert'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Alert Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Scheduled Maintenance"
              />
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Detailed message for users..."
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Alert Type</Label>
                <Select
                  value={formData.alert_type}
                  onValueChange={(value) => setFormData({ ...formData, alert_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="outage">Outage</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Severity</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) => setFormData({ ...formData, severity: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select
                value={formData.target_audience}
                onValueChange={(value) => setFormData({ ...formData, target_audience: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="workers">Workers Only</SelectItem>
                  <SelectItem value="restaurants">Restaurants Only</SelectItem>
                  <SelectItem value="admins">Admins Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date/Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date/Time (Optional)</Label>
                <Input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300"
              />
              <Label>Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.title || !formData.message || createMutation.isPending || updateMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                editingAlert ? 'Update Alert' : 'Create Alert'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}