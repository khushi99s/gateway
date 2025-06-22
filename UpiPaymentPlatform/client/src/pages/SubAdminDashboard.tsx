import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TransactionTable } from "@/components/TransactionTable";
import { StatsCard } from "@/components/StatsCard";
import { 
  UserCheck, 
  Activity, 
  Clock, 
  CheckCircle,
  BarChart3,
  List,
  AlertCircle,
  Check,
  X
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function SubAdminDashboard() {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      setAdminToken(token);
    } else {
      setIsLoginDialogOpen(true);
    }
  }, []);

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: !!adminToken,
    queryFn: async () => {
      const response = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  const { data: transactions } = useQuery({
    queryKey: ["/api/admin/transactions"],
    enabled: !!adminToken,
    queryFn: async () => {
      const response = await fetch("/api/admin/transactions", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
  });

  const { data: pendingTransactions } = useQuery({
    queryKey: ["/api/admin/transactions/pending"],
    enabled: !!adminToken,
    queryFn: async () => {
      const response = await fetch("/api/admin/transactions/pending", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch pending transactions");
      return response.json();
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/admin/login", credentials);
      return response.json();
    },
    onSuccess: (data) => {
      setAdminToken(data.token);
      localStorage.setItem("adminToken", data.token);
      setIsLoginDialogOpen(false);
      toast({
        title: "Login Successful",
        description: "Welcome to Sub Admin Dashboard",
      });
    },
    onError: (error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async (txnId: string) => {
      const response = await fetch(`/api/payment/confirm/${txnId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to confirm payment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Payment Confirmed",
        description: "Payment has been confirmed successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectPaymentMutation = useMutation({
    mutationFn: async (txnId: string) => {
      const response = await fetch(`/api/payment/reject/${txnId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to reject payment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Payment Rejected",
        description: "Payment has been rejected",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginForm);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setAdminToken(null);
    setIsLoginDialogOpen(true);
  };

  const confirmedToday = transactions?.filter((t: any) => 
    t.status === "success" && 
    new Date(t.updatedAt).toDateString() === new Date().toDateString()
  ).length || 0;

  if (!adminToken) {
    return (
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-600" />
              Sub Admin Login
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={loginForm.username}
                onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
            <p className="text-xs text-center text-gray-500">
              Demo: subadmin / 123456
            </p>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <UserCheck className="h-4 w-4 text-white" />
            </div>
            <span className="ml-2 text-lg font-semibold text-gray-900">Sub Admin</span>
          </div>
        </div>

        <nav className="mt-6 px-6">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Sub Admin Dashboard</h1>
            <p className="text-gray-600">Monitor transactions and confirm payments</p>
          </div>

          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                  title="Today's Transactions"
                  value={stats?.todayTransactions || 0}
                  icon={Activity}
                  color="primary"
                />
                <StatsCard
                  title="Pending Confirmations"
                  value={stats?.pendingTransactions || 0}
                  icon={Clock}
                  color="warning"
                />
                <StatsCard
                  title="Confirmed Today"
                  value={confirmedToday}
                  icon={CheckCircle}
                  color="success"
                />
              </div>

              {/* Urgent Pending Confirmations */}
              {pendingTransactions && pendingTransactions.length > 0 && (
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">Urgent: Pending Confirmations</CardTitle>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        {pendingTransactions.length} Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {pendingTransactions.slice(0, 5).map((transaction: any) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{transaction.txnId}</p>
                            <p className="text-sm text-gray-600">
                              Amount: <span className="font-semibold">₹{transaction.amount}</span>
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(transaction.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => confirmPaymentMutation.mutate(transaction.txnId)}
                            disabled={confirmPaymentMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectPaymentMutation.mutate(transaction.txnId)}
                            disabled={rejectPaymentMutation.isPending}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions && (
                    <TransactionTable 
                      transactions={transactions.slice(0, 10)} 
                      showActions={false}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>All Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions && (
                    <TransactionTable 
                      transactions={transactions} 
                      showActions={true}
                      adminToken={adminToken}
                      onConfirm={(txnId) => confirmPaymentMutation.mutate(txnId)}
                      onReject={(txnId) => rejectPaymentMutation.mutate(txnId)}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pending" className="space-y-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Pending Confirmations</h2>
                <p className="text-gray-600">Manually confirm payments that require verification</p>
              </div>

              {pendingTransactions && pendingTransactions.length > 0 ? (
                <div className="space-y-4">
                  {pendingTransactions.map((transaction: any) => (
                    <Card key={transaction.id} className="border-yellow-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                              <AlertCircle className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{transaction.txnId}</h3>
                              <p className="text-gray-600">
                                Amount: <span className="font-semibold text-lg">₹{transaction.amount}</span>
                              </p>
                              <p className="text-sm text-gray-500">
                                Initiated {new Date(transaction.createdAt).toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-500">
                                UPI ID: <span className="font-mono">{transaction.upiId}</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <Button
                              onClick={() => confirmPaymentMutation.mutate(transaction.txnId)}
                              disabled={confirmPaymentMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Confirm Payment
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => rejectPaymentMutation.mutate(transaction.txnId)}
                              disabled={rejectPaymentMutation.isPending}
                              className="border-red-300 text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Reject Payment
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    No pending transactions at the moment. All payments are up to date!
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
