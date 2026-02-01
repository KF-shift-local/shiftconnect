import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Briefcase } from 'lucide-react';

export default function ExperienceForm({ experience = [], onChange }) {
  const [entries, setEntries] = useState(experience);

  const addEntry = () => {
    const newEntries = [...entries, { title: '', employer: '', start_date: '', end_date: '', description: '' }];
    setEntries(newEntries);
    onChange(newEntries);
  };

  const updateEntry = (index, field, value) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntries(newEntries);
    onChange(newEntries);
  };

  const removeEntry = (index) => {
    const newEntries = entries.filter((_, i) => i !== index);
    setEntries(newEntries);
    onChange(newEntries);
  };

  return (
    <div className="space-y-4">
      {entries.map((entry, index) => (
        <Card key={index} className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="font-medium text-slate-700">Experience {index + 1}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeEntry(index)}
                className="text-slate-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-600">Job Title</Label>
                <Input
                  value={entry.title}
                  onChange={(e) => updateEntry(index, 'title', e.target.value)}
                  placeholder="e.g. Line Cook"
                  className="border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">Employer</Label>
                <Input
                  value={entry.employer}
                  onChange={(e) => updateEntry(index, 'employer', e.target.value)}
                  placeholder="e.g. The Local Bistro"
                  className="border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">Start Date</Label>
                <Input
                  type="month"
                  value={entry.start_date}
                  onChange={(e) => updateEntry(index, 'start_date', e.target.value)}
                  className="border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">End Date</Label>
                <Input
                  type="month"
                  value={entry.end_date}
                  onChange={(e) => updateEntry(index, 'end_date', e.target.value)}
                  placeholder="Leave empty if current"
                  className="border-slate-200"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-slate-600">Description</Label>
                <Textarea
                  value={entry.description}
                  onChange={(e) => updateEntry(index, 'description', e.target.value)}
                  placeholder="Describe your responsibilities and achievements..."
                  className="border-slate-200 min-h-[80px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addEntry}
        className="w-full border-dashed border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Experience
      </Button>
    </div>
  );
}