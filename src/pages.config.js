/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminAnalytics from './pages/AdminAnalytics';
import AdminApplications from './pages/AdminApplications';
import AdminDashboard from './pages/AdminDashboard';
import AdminDisputes from './pages/AdminDisputes';
import AdminRestaurants from './pages/AdminRestaurants';
import AdminReviews from './pages/AdminReviews';
import AdminUsers from './pages/AdminUsers';
import AdminWorkers from './pages/AdminWorkers';
import Analytics from './pages/Analytics';
import ApplicationQuestions from './pages/ApplicationQuestions';
import BrowseWorkers from './pages/BrowseWorkers';
import Calendar from './pages/Calendar';
import ContentModeration from './pages/ContentModeration';
import EditRestaurant from './pages/EditRestaurant';
import EditWorkerProfile from './pages/EditWorkerProfile';
import EmploymentVerification from './pages/EmploymentVerification';
import Home from './pages/Home';
import JobDetails from './pages/JobDetails';
import JobMap from './pages/JobMap';
import Jobs from './pages/Jobs';
import ManageApplications from './pages/ManageApplications';
import Messages from './pages/Messages';
import MyApplications from './pages/MyApplications';
import PostJob from './pages/PostJob';
import RestaurantDashboard from './pages/RestaurantDashboard';
import RestaurantOnboarding from './pages/RestaurantOnboarding';
import RestaurantProfile from './pages/RestaurantProfile';
import RestaurantVerifications from './pages/RestaurantVerifications';
import Settings from './pages/Settings';
import ShiftTemplates from './pages/ShiftTemplates';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import WorkerOnboarding from './pages/WorkerOnboarding';
import WorkerPerformance from './pages/WorkerPerformance';
import WorkerProfile from './pages/WorkerProfile';
import WriteReview from './pages/WriteReview';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminAnalytics": AdminAnalytics,
    "AdminApplications": AdminApplications,
    "AdminDashboard": AdminDashboard,
    "AdminDisputes": AdminDisputes,
    "AdminRestaurants": AdminRestaurants,
    "AdminReviews": AdminReviews,
    "AdminUsers": AdminUsers,
    "AdminWorkers": AdminWorkers,
    "Analytics": Analytics,
    "ApplicationQuestions": ApplicationQuestions,
    "BrowseWorkers": BrowseWorkers,
    "Calendar": Calendar,
    "ContentModeration": ContentModeration,
    "EditRestaurant": EditRestaurant,
    "EditWorkerProfile": EditWorkerProfile,
    "EmploymentVerification": EmploymentVerification,
    "Home": Home,
    "JobDetails": JobDetails,
    "JobMap": JobMap,
    "Jobs": Jobs,
    "ManageApplications": ManageApplications,
    "Messages": Messages,
    "MyApplications": MyApplications,
    "PostJob": PostJob,
    "RestaurantDashboard": RestaurantDashboard,
    "RestaurantOnboarding": RestaurantOnboarding,
    "RestaurantProfile": RestaurantProfile,
    "RestaurantVerifications": RestaurantVerifications,
    "Settings": Settings,
    "ShiftTemplates": ShiftTemplates,
    "SuperAdminDashboard": SuperAdminDashboard,
    "WorkerDashboard": WorkerDashboard,
    "WorkerOnboarding": WorkerOnboarding,
    "WorkerPerformance": WorkerPerformance,
    "WorkerProfile": WorkerProfile,
    "WriteReview": WriteReview,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};