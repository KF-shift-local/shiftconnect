import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Loader2,
  ArrowLeft,
  FileText,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const QUESTION_TYPES = [
  { value: 'text', label: 'Short Answer' },
  { value: 'textarea', label: 'Long Answer' },
  { value: 'yes_no', label: 'Yes/No' },
  { value: 'multiple_choice', label: 'Multiple Choice' }
];

export default function ApplicationQuestions() {
  const [open, setOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'text',
    options: [''],
    required: false
  });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: restaurant } = useQuery({
    queryKey: ['restaurant', user?.email],
    queryFn: async () => {
      const restaurants = await base44.entities.Restaurant.filter({ created_by: user.email });
      return restaurants[0];
    },
    enabled: !!user?.email
  });

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['applicationQuestions', restaurant?.id],
    queryFn: () => base44.entities.ApplicationQuestion.filter({ restaurant_id: restaurant.id }, 'order'),
    enabled: !!restaurant?.id
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ApplicationQuestion.create({
      ...data,
      restaurant_id: restaurant.id,
      order: questions.length
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['applicationQuestions']);
      resetForm();
      setOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ApplicationQuestion.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['applicationQuestions']);
      resetForm();
      setOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ApplicationQuestion.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['applicationQuestions'])
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.ApplicationQuestion.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries(['applicationQuestions'])
  });

  const resetForm = () => {
    setFormData({
      question_text: '',
      question_type: 'text',
      options: [''],
      required: false
    });
    setEditingQuestion(null);
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text,
      question_type: question.question_type,
      options: question.options || [''],
      required: question.required || false
    });
    setOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      options: formData.question_type === 'multiple_choice' ? formData.options.filter(o => o.trim()) : undefined
    };

    if (editingQuestion) {
      updateMutation.mutate({ id: editingQuestion.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const updateOption = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const removeOption = (index) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link 
          to={createPageUrl('RestaurantDashboard')}
          className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Application Questions</h1>
            <p className="text-slate-600 mt-1">Customize questions for job applicants</p>
          </div>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add Question'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Question</Label>
                  <Textarea
                    value={formData.question_text}
                    onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                    placeholder="e.g. What interests you about working at our restaurant?"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Answer Type</Label>
                  <select
                    value={formData.question_type}
                    onChange={(e) => setFormData({ ...formData, question_type: e.target.value })}
                    className="w-full h-9 px-3 py-1 rounded-md border border-slate-200 bg-white text-sm"
                  >
                    {QUESTION_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {formData.question_type === 'multiple_choice' && (
                  <div className="space-y-2">
                    <Label>Options</Label>
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                        />
                        {formData.options.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(index)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addOption}>
                      <Plus className="w-3 h-3 mr-1" />
                      Add Option
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.required}
                    onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <Label className="cursor-pointer">Required question</Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      resetForm();
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!formData.question_text || createMutation.isPending || updateMutation.isPending}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      editingQuestion ? 'Update' : 'Add'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : questions.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No custom questions yet</h3>
              <p className="text-slate-600 mb-4">Add questions to learn more about your applicants</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {questions.map((question, index) => (
              <Card key={question.id} className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <GripVertical className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <p className="font-medium text-slate-900">{question.question_text}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {QUESTION_TYPES.find(t => t.value === question.question_type)?.label}
                            </Badge>
                            {question.required && (
                              <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                                Required
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActiveMutation.mutate({ 
                              id: question.id, 
                              is_active: !question.is_active 
                            })}
                          >
                            {question.is_active ? (
                              <ToggleRight className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-slate-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(question)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(question.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      {question.question_type === 'multiple_choice' && question.options && (
                        <div className="mt-2 space-y-1">
                          {question.options.map((option, idx) => (
                            <p key={idx} className="text-sm text-slate-500">• {option}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}