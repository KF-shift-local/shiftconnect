import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const TIMES = [
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM',
  '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM', '12:00 AM'
];

export default function AvailabilitySelector({ availability, onChange }) {
  const handleDayToggle = (day, available) => {
    onChange({
      ...availability,
      [day]: { ...availability?.[day], available }
    });
  };

  const handleTimeChange = (day, field, value) => {
    onChange({
      ...availability,
      [day]: { ...availability?.[day], [field]: value }
    });
  };

  return (
    <div className="space-y-3">
      {DAYS.map((day) => (
        <div
          key={day}
          className={cn(
            "flex items-center gap-4 p-3 rounded-xl border transition-all",
            availability?.[day]?.available
              ? "bg-emerald-50/50 border-emerald-200"
              : "bg-slate-50 border-slate-200"
          )}
        >
          <Switch
            checked={availability?.[day]?.available || false}
            onCheckedChange={(checked) => handleDayToggle(day, checked)}
          />
          <span className="w-24 font-medium capitalize text-slate-700">{day}</span>
          
          {availability?.[day]?.available && (
            <div className="flex items-center gap-2 flex-1">
              <Select
                value={availability?.[day]?.start || '9:00 AM'}
                onValueChange={(value) => handleTimeChange(day, 'start', value)}
              >
                <SelectTrigger className="w-28 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMES.map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-slate-400">to</span>
              <Select
                value={availability?.[day]?.end || '5:00 PM'}
                onValueChange={(value) => handleTimeChange(day, 'end', value)}
              >
                <SelectTrigger className="w-28 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMES.map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}