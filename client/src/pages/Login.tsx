import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingOverlay from "@/components/LoadingOverlay";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Loader2, XCircle, Mail, LogOut } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { useMemberStatus } from "@/hooks/useMemberStatus";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, signInWithGoogle, currentUser, userData, loading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const { status: memberStatus, data: memberData } = useMemberStatus();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    // Don't redirect if user is rejected
    if (memberStatus === "rejected") {
      return;
    }
    
    // Wait for member status to be determined before redirecting
    if (memberStatus === "loading") {
      return;
    }
    
    if (!authLoading && currentUser && userData) {
      // Set redirecting state to show loading UI
      setRedirecting(true);
      
      // Check if user is admin first - admins always go to dashboard
      const isAdmin = userData.roles?.admin || false;
      
      if (isAdmin) {
        setLocation("/dashboard");
      } else if (userData.needsRoleSelection) {
        setLocation("/role-selection");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [currentUser, userData, authLoading, setLocation, memberStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(credentials.email, credentials.password);
      // Don't redirect immediately - let useEffect handle based on member status
    } catch (error: any) {
      let errorMessage = "Invalid email or password";
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed login attempts. Please try again later.";
      }

      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      // If this is a new user (first time signing in with Google), redirect to role selection immediately
      if (result.isNewUser) {
        setLocation("/role-selection");
        return;
      }
      // For existing users, redirect will be handled by useEffect based on userData
    } catch (error: any) {
      let errorMessage = "Failed to sign in with Google";
      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Sign-in cancelled";
      } else if (error.code === "auth/cancelled-popup-request") {
        errorMessage = "Sign-in cancelled";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Google Sign-In Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  // Show loading overlay when redirecting
  if (redirecting) {
    return <LoadingOverlay message="Redirecting to your dashboard..." />;
  }

  // Show suspended account message for rejected users
  if (memberStatus === "rejected" && currentUser) {
    const handleLogout = async () => {
      await logout();
      setLocation("/");
    };

    return (
      <div className="min-h-screen">
        <Header />
        <main className="py-16 md:py-24 bg-background">
          <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="border-2">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
                  <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle className="text-2xl">Account Suspended</CardTitle>
                <CardDescription className="text-base mt-2">
                  Your account has been suspended by the administration. Access to the platform has been restricted.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <h3 className="font-medium text-sm">What this means:</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>Your profile has been reviewed and suspended by the administration</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>You cannot access your dashboard or other member features</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-primary/5 rounded-lg p-4 space-y-3">
                  <h3 className="font-medium text-sm">What you can do:</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Contact our support team to learn more about the suspension</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Request a review if you believe this was made in error</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => window.location.href = "mailto:support@pef.com"}
                    data-testid="button-contact-support"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={handleLogout}
                    data-testid="button-logout-suspended"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  If you have questions about this suspension, please reach out to our support team. 
                  We're here to help.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-16 md:py-24 bg-background">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-3xl text-center">Welcome Back</CardTitle>
              <p className="text-muted-foreground text-center">
                Login to access your PEF account
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={credentials.email}
                    onChange={(e) =>
                      setCredentials((prev) => ({ ...prev, email: e.target.value }))
                    }
                    data-testid="input-login-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={credentials.password}
                    onChange={(e) =>
                      setCredentials((prev) => ({ ...prev, password: e.target.value }))
                    }
                    data-testid="input-login-password"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={loading || googleLoading}
                  data-testid="button-login-submit"
                >
                  {loading ? "Logging in..." : "Login"}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={loading || googleLoading}
                  data-testid="button-google-signin"
                >
                  <SiGoogle className="mr-2 w-5 h-5" />
                  {googleLoading ? "Signing in..." : "Sign in with Google"}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  <Link href="/forgot-password" className="text-primary hover:underline" data-testid="link-forgot-password">
                    Forgot your password?
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <p className="text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary hover:underline font-semibold" data-testid="link-signup">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
