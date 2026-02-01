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
import Home from './pages/Home';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import WorkerOnboarding from './pages/WorkerOnboarding';
import RestaurantOnboarding from './pages/RestaurantOnboarding';
import WorkerDashboard from './pages/WorkerDashboard';
import RestaurantDashboard from './pages/RestaurantDashboard';
import PostJob from './pages/PostJob';
import ManageApplications from './pages/ManageApplications';
import WriteReview from './pages/WriteReview';
import WorkerProfile from './pages/WorkerProfile';
import BrowseWorkers from './pages/BrowseWorkers';
import MyApplications from './pages/MyApplications';
import EditWorkerProfile from './pages/EditWorkerProfile';
import RestaurantProfile from './pages/RestaurantProfile';
import JobMap from './pages/JobMap';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Jobs": Jobs,
    "JobDetails": JobDetails,
    "WorkerOnboarding": WorkerOnboarding,
    "RestaurantOnboarding": RestaurantOnboarding,
    "WorkerDashboard": WorkerDashboard,
    "RestaurantDashboard": RestaurantDashboard,
    "PostJob": PostJob,
    "ManageApplications": ManageApplications,
    "WriteReview": WriteReview,
    "WorkerProfile": WorkerProfile,
    "BrowseWorkers": BrowseWorkers,
    "MyApplications": MyApplications,
    "EditWorkerProfile": EditWorkerProfile,
    "RestaurantProfile": RestaurantProfile,
    "JobMap": JobMap,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};