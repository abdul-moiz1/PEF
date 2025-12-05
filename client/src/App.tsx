import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Leadership from "@/pages/Leadership";
import Gallery from "@/pages/Gallery";
import Membership from "@/pages/Membership";
import Opportunities from "@/pages/Opportunities";
import Media from "@/pages/Media";
import Contact from "@/pages/Contact";
import Register from "@/pages/Register";
import Signup from "@/pages/Signup";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import EditProfile from "@/pages/EditProfile";
import RoleSelection from "@/pages/RoleSelection";
import Dashboard from "@/pages/Dashboard";
import ProfessionalDashboard from "@/pages/dashboards/ProfessionalDashboard";
import JobSeekerDashboard from "@/pages/dashboards/JobSeekerDashboard";
import EmployerDashboard from "@/pages/dashboards/EmployerDashboard";
import BusinessOwnerDashboard from "@/pages/dashboards/BusinessOwnerDashboard";
import InvestorDashboard from "@/pages/dashboards/InvestorDashboard";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminLeadership from "@/pages/admin/AdminLeadership";
import AdminGallery from "@/pages/admin/AdminGallery";
import AdminOpportunities from "@/pages/admin/AdminOpportunities";
import AdminMembership from "@/pages/admin/AdminMembership";
import AdminLocations from "@/pages/admin/AdminLocations";
import AdminMedia from "@/pages/admin/AdminMedia";
import ProfileComplete from "@/pages/ProfileComplete";
import ProfileEdit from "@/pages/ProfileEdit";
import JobCreate from "@/pages/job/JobCreate";
import JobView from "@/pages/job/JobView";
import JobApplicants from "@/pages/job/JobApplicants";
import BusinessCreate from "@/pages/business/BusinessCreate";
import BusinessView from "@/pages/business/BusinessView";
import BrowseJobs from "@/pages/browse/BrowseJobs";
import BrowseOpportunities from "@/pages/browse/BrowseOpportunities";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/leadership" component={Leadership} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/membership" component={Membership} />
      <Route path="/opportunities" component={Opportunities} />
      <Route path="/media" component={Media} />
      <Route path="/contact" component={Contact} />
      <Route path="/register" component={Register} />
      <Route path="/signup" component={Signup} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/role-selection" component={RoleSelection} />
      <Route path="/edit-profile" component={EditProfile} />
      <Route path="/profile/complete" component={ProfileComplete} />
      <Route path="/profile/edit" component={ProfileEdit} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/professional" component={ProfessionalDashboard} />
      <Route path="/dashboard/job-seeker" component={JobSeekerDashboard} />
      <Route path="/dashboard/employer" component={EmployerDashboard} />
      <Route path="/dashboard/business-owner" component={BusinessOwnerDashboard} />
      <Route path="/dashboard/investor" component={InvestorDashboard} />
      <Route path="/job/create" component={JobCreate} />
      <Route path="/job/:id/applicants" component={JobApplicants} />
      <Route path="/job/:id" component={JobView} />
      <Route path="/business/create" component={BusinessCreate} />
      <Route path="/business/:id" component={BusinessView} />
      <Route path="/browse/jobs" component={BrowseJobs} />
      <Route path="/browse/opportunities" component={BrowseOpportunities} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/leadership" component={AdminLeadership} />
      <Route path="/admin/gallery" component={AdminGallery} />
      <Route path="/admin/opportunities" component={AdminOpportunities} />
      <Route path="/admin/membership" component={AdminMembership} />
      <Route path="/admin/locations" component={AdminLocations} />
      <Route path="/admin/media" component={AdminMedia} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
