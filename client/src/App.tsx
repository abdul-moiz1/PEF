import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
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
import AdminFieldsManagement from "@/pages/admin/AdminFieldsManagement";
import AdminRoleUpgradeRequests from "@/pages/admin/AdminRoleUpgradeRequests";
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
import { ProtectedRoute } from "@/components/ProtectedRoute";

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
      <Route path="/dashboard">
        {() => <ProtectedRoute><Dashboard /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/professional">
        {() => <ProtectedRoute><ProfessionalDashboard /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/job-seeker">
        {() => <ProtectedRoute><JobSeekerDashboard /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/employer">
        {() => <ProtectedRoute><EmployerDashboard /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/business-owner">
        {() => <ProtectedRoute><BusinessOwnerDashboard /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/investor">
        {() => <ProtectedRoute><InvestorDashboard /></ProtectedRoute>}
      </Route>
      <Route path="/job/create">
        {() => <ProtectedRoute><JobCreate /></ProtectedRoute>}
      </Route>
      <Route path="/job/:id/applicants">
        {(params) => <ProtectedRoute><JobApplicants /></ProtectedRoute>}
      </Route>
      <Route path="/job/:id">
        {(params) => <ProtectedRoute><JobView /></ProtectedRoute>}
      </Route>
      <Route path="/business/create">
        {() => <ProtectedRoute><BusinessCreate /></ProtectedRoute>}
      </Route>
      <Route path="/business/:id">
        {(params) => <ProtectedRoute><BusinessView /></ProtectedRoute>}
      </Route>
      <Route path="/browse/jobs">
        {() => <ProtectedRoute><BrowseJobs /></ProtectedRoute>}
      </Route>
      <Route path="/browse/opportunities">
        {() => <ProtectedRoute><BrowseOpportunities /></ProtectedRoute>}
      </Route>
      <Route path="/admin">
        {() => <ProtectedRoute><AdminDashboard /></ProtectedRoute>}
      </Route>
      <Route path="/admin/leadership">
        {() => <ProtectedRoute><AdminLeadership /></ProtectedRoute>}
      </Route>
      <Route path="/admin/gallery">
        {() => <ProtectedRoute><AdminGallery /></ProtectedRoute>}
      </Route>
      <Route path="/admin/opportunities">
        {() => <ProtectedRoute><AdminOpportunities /></ProtectedRoute>}
      </Route>
      <Route path="/admin/membership">
        {() => <ProtectedRoute><AdminMembership /></ProtectedRoute>}
      </Route>
      <Route path="/admin/locations">
        {() => <ProtectedRoute><AdminLocations /></ProtectedRoute>}
      </Route>
      <Route path="/admin/media">
        {() => <ProtectedRoute><AdminMedia /></ProtectedRoute>}
      </Route>
      <Route path="/admin/fields">
        {() => <ProtectedRoute><AdminFieldsManagement /></ProtectedRoute>}
      </Route>
      <Route path="/admin/role-upgrade-requests">
        {() => <ProtectedRoute><AdminRoleUpgradeRequests /></ProtectedRoute>}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <ScrollToTop />
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
