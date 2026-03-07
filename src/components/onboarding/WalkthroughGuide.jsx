import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  X, ChefHat, Building2, User, Briefcase, MessageCircle,
  Star, CheckCircle, ArrowRight, ChevronLeft, ChevronRight
} from 'lucide-react';

const WORKER_STEPS = [
  {
    icon: User,
    color: 'emerald',
    title: 'Create Your Worker Profile',
    description: 'Set up your profile with your experience, skills, certifications, and a professional photo. A complete profile gets 3x more responses from restaurants.',
    action: { label: 'Create Profile', page: 'WorkerOnboarding' },
    tip: 'Add a photo — profiles with photos get noticed much faster.'
  },
  {
    icon: ChefHat,
    color: 'blue',
    title: 'Set Your Availability',
    description: 'Tell restaurants when you\'re free to work by updating your weekly availability calendar. You can change this anytime from your dashboard.',
    action: { label: 'Go to Dashboard', page: 'WorkerDashboard' },
    tip: 'Keep your availability up to date so restaurants know when they can reach you.'
  },
  {
    icon: Briefcase,
    color: 'amber',
    title: 'Browse & Apply to Jobs',
    description: 'Search for job postings that match your skills and location. Filter by job type, pay rate, shift hours, and more. Apply with a cover message.',
    action: { label: 'Browse Jobs', page: 'Jobs' },
    tip: 'Use filters to find jobs near you — you can search by city or zip code.'
  },
  {
    icon: MessageCircle,
    color: 'purple',
    title: 'Communicate with Restaurants',
    description: 'Once you apply, restaurants may reach out via the Messages section. Stay responsive to maximize your chances of getting hired.',
    action: { label: 'Open Messages', page: 'Messages' },
    tip: 'Fast replies show professionalism — restaurants love responsive workers.'
  },
  {
    icon: Star,
    color: 'teal',
    title: 'Build Your Reputation',
    description: 'After completing jobs, you and the restaurant review each other. Reviews are only published when both parties submit — keeping the system fair.',
    action: { label: 'View My Applications', page: 'MyApplications' },
    tip: 'A strong review history makes it much easier to get hired for future roles.'
  },
];

const RESTAURANT_STEPS = [
  {
    icon: Building2,
    color: 'emerald',
    title: 'Register Your Restaurant',
    description: 'Create your restaurant profile with your cuisine type, location, photos, and brand colors. A complete profile attracts better applicants.',
    action: { label: 'Register Restaurant', page: 'RestaurantOnboarding' },
    tip: 'Add a logo and cover photo to stand out to workers browsing your profile.'
  },
  {
    icon: Briefcase,
    color: 'blue',
    title: 'Post Your First Job',
    description: 'Create a job posting with the role, pay rate, schedule, and requirements. You can post multiple positions and manage them from your dashboard.',
    action: { label: 'Post a Job', page: 'PostJob' },
    tip: 'Be specific about hours and pay — it reduces back-and-forth with applicants.'
  },
  {
    icon: User,
    color: 'amber',
    title: 'Review Applications',
    description: 'Incoming applications appear in Manage Applications. Review workers\' profiles, their experience, availability, and cover message before responding.',
    action: { label: 'Manage Applications', page: 'ManageApplications' },
    tip: 'You can also browse workers proactively and start a conversation directly.'
  },
  {
    icon: MessageCircle,
    color: 'purple',
    title: 'Message & Schedule',
    description: 'Use the Messages section to communicate with applicants and coordinate interviews or shift dates via the built-in scheduling tools.',
    action: { label: 'Open Messages', page: 'Messages' },
    tip: 'Use Shift Proposals to formally schedule and confirm interviews or shifts.'
  },
  {
    icon: Star,
    color: 'teal',
    title: 'Get Verified & Build Trust',
    description: 'Submit your business documents for verification. Verified restaurants get a trust badge, attracting higher-quality applicants.',
    action: { label: 'Verification Center', page: 'RestaurantVerificationCenter' },
    tip: 'After jobs complete, leave reviews for workers — it keeps the community strong.'
  },
];

const colorMap = {
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', dot: 'bg-emerald-500', btn: 'bg-emerald-600 hover:bg-emerald-700', progress: 'bg-emerald-500' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', dot: 'bg-blue-500', btn: 'bg-blue-600 hover:bg-blue-700', progress: 'bg-blue-500' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600', dot: 'bg-amber-500', btn: 'bg-amber-600 hover:bg-amber-700', progress: 'bg-amber-500' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', dot: 'bg-purple-500', btn: 'bg-purple-600 hover:bg-purple-700', progress: 'bg-purple-500' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-600', dot: 'bg-teal-500', btn: 'bg-teal-600 hover:bg-teal-700', progress: 'bg-teal-500' },
};

export default function WalkthroughGuide({ type, userName, onDismiss }) {
  const [step, setStep] = useState(0);
  const steps = type === 'worker' ? WORKER_STEPS : RESTAURANT_STEPS;
  const current = steps[step];
  const colors = colorMap[current.color];
  const Icon = current.icon;
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl border-0 overflow-hidden">
        {/* Header */}
        <div className={`px-6 pt-6 pb-4 bg-gradient-to-br ${type === 'worker' ? 'from-emerald-600 to-teal-700' : 'from-slate-800 to-slate-900'} text-white`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm opacity-75 mb-1">
                {type === 'worker' ? '👋 Welcome, Worker!' : '🏪 Welcome, Restaurant Owner!'}
              </p>
              <h2 className="text-xl font-bold">
                {userName ? `Hey ${userName.split(' ')[0]}!` : 'Getting Started Guide'}
              </h2>
              <p className="text-sm opacity-80 mt-1">
                Step {step + 1} of {steps.length}
              </p>
            </div>
            <button
              onClick={onDismiss}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 pt-4 px-6">
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${i === step ? `${colorMap[s.color].dot} scale-125` : i < step ? 'bg-slate-300' : 'bg-slate-200'}`}
            />
          ))}
        </div>

        {/* Content */}
        <CardContent className="p-6">
          <div className={`w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center mb-5`}>
            <Icon className={`w-7 h-7 ${colors.text}`} />
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-3">{current.title}</h3>
          <p className="text-slate-600 leading-relaxed mb-5">{current.description}</p>

          {/* Tip */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6 flex gap-3">
            <span className="text-lg">💡</span>
            <p className="text-sm text-slate-600">{current.tip}</p>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-none">
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}

            <Link to={createPageUrl(current.action.page)} className="flex-1">
              <Button className={`w-full text-white ${colors.btn}`}>
                {current.action.label}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>

            {step < steps.length - 1 ? (
              <Button variant="outline" onClick={() => setStep(s => s + 1)} className="flex-none">
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button variant="outline" onClick={onDismiss} className="flex-none text-slate-500">
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}
          </div>

          <button
            onClick={onDismiss}
            className="w-full text-center text-xs text-slate-400 hover:text-slate-600 mt-4 transition-colors"
          >
            Skip guide — I'll figure it out myself
          </button>
        </CardContent>
      </Card>
    </div>
  );
}