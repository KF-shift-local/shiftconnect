import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Info } from 'lucide-react';

export default function NotificationSettings() {
  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-emerald-600" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>SMS & WhatsApp notifications</strong> require backend functions to be enabled. 
            Currently, you'll receive in-app notifications only. Enable backend functions in settings to activate SMS/WhatsApp alerts.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-slate-700">In-App Notifications</Label>
              <p className="text-sm text-slate-500">Get notified about applications and updates</p>
            </div>
            <Switch checked={true} disabled />
          </div>

          <div className="flex items-center justify-between opacity-50">
            <div>
              <Label className="text-slate-700">SMS Notifications</Label>
              <p className="text-sm text-slate-500">Requires backend functions</p>
            </div>
            <Switch disabled />
          </div>

          <div className="flex items-center justify-between opacity-50">
            <div>
              <Label className="text-slate-700">WhatsApp Notifications</Label>
              <p className="text-sm text-slate-500">Requires backend functions</p>
            </div>
            <Switch disabled />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}