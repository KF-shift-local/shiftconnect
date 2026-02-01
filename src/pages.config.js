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
import BrowseWorkers from './pages/BrowseWorkers';
import EditWorkerProfile from './pages/EditWorkerProfile';
import Home from './pages/Home';
import JobDetails from './pages/JobDetails';
import JobMap from './pages/JobMap';
import Jobs from './pages/Jobs';
import ManageApplications from './pages/ManageApplications';
import MyApplications from './pages/MyApplications';
import PostJob from './pages/PostJob';
import RestaurantDashboard from './pages/RestaurantDashboard';
import RestaurantOnboarding from './pages/RestaurantOnboarding';
import RestaurantProfile from './pages/RestaurantProfile';
import WorkerDashboard from './pages/WorkerDashboard';
import WorkerOnboarding from './pages/WorkerOnboarding';
import WorkerProfile from './pages/WorkerProfile';
import WriteReview from './pages/WriteReview';
import __Layout from './Layout.jsx';


export const PAGES = {
    "BrowseWorkers": BrowseWorkers,
    "EditWorkerProfile": EditWorkerProfile,
    "Home": Home,
    "JobDetails": JobDetails,
    "JobMap": JobMap,
    "Jobs": Jobs,
    "ManageApplications": ManageApplications,
    "MyApplications": MyApplications,
    "PostJob": PostJob,
    "RestaurantDashboard": RestaurantDashboard,
    "RestaurantOnboarding": RestaurantOnboarding,
    "RestaurantProfile": RestaurantProfile,
    "WorkerDashboard": WorkerDashboard,
    "WorkerOnboarding": WorkerOnboarding,
    "WorkerProfile": WorkerProfile,
    "WriteReview": WriteReview,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};