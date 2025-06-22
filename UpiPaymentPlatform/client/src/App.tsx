import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import PaymentPage from "@/pages/PaymentPage";
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import SubAdminDashboard from "@/pages/SubAdminDashboard";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/pay" component={PaymentPage} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/pay" component={PaymentPage} />
          <Route path="/admin/super" component={SuperAdminDashboard} />
          <Route path="/admin/sub" component={SubAdminDashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
