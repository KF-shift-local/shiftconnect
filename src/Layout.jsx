import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
        Menu, 
        X, 
        ChefHat,
        User,
        Building2,
        Briefcase,
        LogOut,
        Settings,
        FileText,
        Users,
        Star,
        MessageCircle,
        Calendar as CalendarIcon
      } from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';
import HelpWidget from '@/components/help/HelpWidget';

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: workerProfile } = useQuery({
    queryKey: ['workerProfile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.WorkerProfile.filter({ created_by: user.email });
      return profiles[0];
    },
    enabled: !!user?.email
  });

  const { data: restaurant } = useQuery({
    queryKey: ['restaurant', user?.email],
    queryFn: async () => {
      const restaurants = await base44.entities.Restaurant.filter({ created_by: user.email });
      return restaurants[0];
    },
    enabled: !!user?.email
  });

  const handleLogout = () => {
    base44.auth.logout();
  };

  // Hide layout on certain pages
  const hideLayout = ['WorkerOnboarding', 'RestaurantOnboarding'].includes(currentPageName);

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900">ShiftLocal</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                to={createPageUrl('Jobs')}
                className={`text-sm font-medium transition-colors ${
                  currentPageName === 'Jobs' 
                    ? 'text-emerald-600' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Find Jobs
              </Link>
              {restaurant && (
                <Link 
                  to={createPageUrl('BrowseWorkers')}
                  className={`text-sm font-medium transition-colors ${
                    currentPageName === 'BrowseWorkers' 
                      ? 'text-emerald-600' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Find Workers
                </Link>
              )}
              {(workerProfile || restaurant) && (
                <>
                  <Link 
                    to={createPageUrl('Messages')}
                    className={`text-sm font-medium transition-colors ${
                      currentPageName === 'Messages' 
                        ? 'text-emerald-600' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Messages
                  </Link>
                  <Link 
                    to={createPageUrl('Calendar')}
                    className={`text-sm font-medium transition-colors ${
                      currentPageName === 'Calendar' 
                        ? 'text-emerald-600' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Calendar
                  </Link>
                </>
              )}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              {user && <NotificationBell userEmail={user.email} />}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="font-medium text-emerald-600 text-sm">
                          {user.full_name?.charAt(0) || user.email?.charAt(0)}
                        </span>
                      </div>
                      <span className="hidden md:inline text-sm font-medium text-slate-700">
                        {user.full_name?.split(' ')[0] || 'Account'}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {workerProfile && (
                      <>
                        <DropdownMenuItem onClick={() => navigate(createPageUrl('WorkerDashboard'))}>
                          <User className="w-4 h-4 mr-2" />
                          Worker Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(createPageUrl('MyApplications'))}>
                          <FileText className="w-4 h-4 mr-2" />
                          My Applications
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {(workerProfile || restaurant) && (
                      <>
                        <DropdownMenuItem onClick={() => navigate(createPageUrl('Messages'))}>
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Messages
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(createPageUrl('Calendar'))}>
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          Calendar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {restaurant && (
                      <>
                        <DropdownMenuItem onClick={() => navigate(createPageUrl('RestaurantDashboard'))}>
                          <Building2 className="w-4 h-4 mr-2" />
                          Restaurant Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(createPageUrl('ManageApplications'))}>
                          <Users className="w-4 h-4 mr-2" />
                          Manage Applications
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(createPageUrl('PostJob'))}>
                          <Briefcase className="w-4 h-4 mr-2" />
                          Post a Job
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(createPageUrl('ApplicationQuestions'))}>
                          <FileText className="w-4 h-4 mr-2" />
                          Application Questions
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(createPageUrl('ShiftTemplates'))}>
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          Shift Templates
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(createPageUrl('WorkerPerformance'))}>
                          <Star className="w-4 h-4 mr-2" />
                          Worker Performance
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {!workerProfile && !restaurant && (
                      <>
                        <DropdownMenuItem onClick={() => navigate(createPageUrl('WorkerOnboarding'))}>
                          <User className="w-4 h-4 mr-2" />
                          Create Worker Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(createPageUrl('RestaurantOnboarding'))}>
                          <Building2 className="w-4 h-4 mr-2" />
                          Register Restaurant
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={() => navigate(createPageUrl('Settings'))}>
                     <Settings className="w-4 h-4 mr-2" />
                     Account Settings
                    </DropdownMenuItem>
                    {user?.role === 'admin' && (
                     <>
                       <DropdownMenuSeparator />
                       <DropdownMenuItem onClick={() => navigate(createPageUrl('AdminDashboard'))} className="text-emerald-700 font-semibold">
                         <Star className="w-4 h-4 mr-2" />
                         Admin Panel
                       </DropdownMenuItem>
                     </>
                    )}
                    {workerProfile && !restaurant && user?.role !== 'admin' && (
                      <>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {restaurant && !workerProfile && user?.role !== 'admin' && (
                      <>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => base44.auth.redirectToLogin()}
                    className="text-slate-600"
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={() => base44.auth.redirectToLogin()}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Get Started
                  </Button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="px-4 py-4 space-y-2">
              <Link
                to={createPageUrl('Jobs')}
                className="block px-4 py-2 text-slate-700 hover:bg-slate-50 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Find Jobs
              </Link>
              {restaurant && (
                <Link
                  to={createPageUrl('BrowseWorkers')}
                  className="block px-4 py-2 text-slate-700 hover:bg-slate-50 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Find Workers
                </Link>
              )}
              {(workerProfile || restaurant) && (
                <>
                  <Link
                    to={createPageUrl('Messages')}
                    className="block px-4 py-2 text-slate-700 hover:bg-slate-50 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Messages
                  </Link>
                  <Link
                    to={createPageUrl('Calendar')}
                    className="block px-4 py-2 text-slate-700 hover:bg-slate-50 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Calendar
                  </Link>
                </>
              )}
              {workerProfile && (
                <Link
                  to={createPageUrl('WorkerDashboard')}
                  className="block px-4 py-2 text-slate-700 hover:bg-slate-50 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Worker Dashboard
                </Link>
              )}
              {restaurant && (
                <Link
                  to={createPageUrl('RestaurantDashboard')}
                  className="block px-4 py-2 text-slate-700 hover:bg-slate-50 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Restaurant Dashboard
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link
                  to={createPageUrl('AdminDashboard')}
                  className="block px-4 py-2 text-emerald-700 font-semibold hover:bg-emerald-50 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin Panel
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Help Widget */}
      <HelpWidget />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <ChefHat className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-slate-900">ShiftLocal</span>
              </div>
              <p className="text-sm text-slate-600">
                Connecting local restaurants with hospitality professionals.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">For Workers</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link to={createPageUrl('Jobs')} className="hover:text-emerald-600">Browse Jobs</Link></li>
                <li><Link to={createPageUrl('WorkerOnboarding')} className="hover:text-emerald-600">Create Profile</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">For Restaurants</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link to={createPageUrl('RestaurantOnboarding')} className="hover:text-emerald-600">Register</Link></li>
                <li><Link to={createPageUrl('PostJob')} className="hover:text-emerald-600">Post a Job</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="hover:text-emerald-600">Help Center</a></li>
                <li><a href="#" className="hover:text-emerald-600">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 mt-8 pt-8 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} ShiftLocal. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}