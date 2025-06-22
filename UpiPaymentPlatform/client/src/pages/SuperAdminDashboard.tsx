import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TransactionTable } from "@/components/TransactionTable";
import { StatsCard } from "@/components/StatsCard";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { SMSWebhookSimulator } from "@/components/SMSWebhookSimulator";
import { 
  Shield, 
  TrendingUp, 
  Activity, 
  Clock, 
  Users, 
  Plus,
  CreditCard,
  BarChart3,
  List,
  UserCheck
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function SuperAdminDashboard() {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [subAdminForm, setSubAdminForm] = useState({ username: "", password: "" });
  const [upiIdForm, setUpiIdForm] = useState({ upiId: "" });
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isSubAdminDialogOpen, setIsSubAdminDialogOpen] = useState(false);
  const [isUpiIdDialogOpen, setIsUpiIdDialogOpen] = useState(false);
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

  const { data: upiIds } = useQuery({
    queryKey: ["/api/admin/upiids"],
    enabled: !!adminToken,
    queryFn: async () => {
      const response = await fetch("/api/admin/upiids", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch UPI IDs");
      return response.json();
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/admin/login", credentials);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.user.role !== "super_admin") {
        toast({
          title: "Access Denied",
          description: "Super admin access required",
          variant: "destructive",
        });
        return;
      }
      setAdminToken(data.token);
      localStorage.setItem("adminToken", data.token);
      setIsLoginDialogOpen(false);
      toast({
        title: "Login Successful",
        description: "Welcome to Super Admin Dashboard",
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

  const createSubAdminMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const response = await fetch("/api/admin/subadmins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create sub admin");
      return response.json();
    },
    onSuccess: () => {
      setIsSubAdminDialogOpen(false);
      setSubAdminForm({ username: "", password: "" });
      toast({
        title: "Sub Admin Created",
        description: "New sub admin account has been created successfully",
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

  const createUpiIdMutation = useMutation({
    mutationFn: async (data: { upiId: string }) => {
      const response = await fetch("/api/admin/upiids", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create UPI ID");
      return response.json();
    },
    onSuccess: () => {
      setIsUpiIdDialogOpen(false);
      setUpiIdForm({ upiId: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/upiids"] });
      toast({
        title: "UPI ID Added",
        description: "New UPI ID has been added successfully",
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

  const handleCreateSubAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    createSubAdminMutation.mutate(subAdminForm);
  };

  const handleCreateUpiId = (e: React.FormEvent) => {
    e.preventDefault();
    createUpiIdMutation.mutate(upiIdForm);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setAdminToken(null);
    setIsLoginDialogOpen(true);
  };

  if (!adminToken) {
    return (
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Super Admin Login
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
              Demo: superadmin / 123456
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
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="ml-2 text-lg font-semibold text-gray-900">Super Admin</span>
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
            <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="text-gray-600">Monitor your UPI payment gateway performance</p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="subadmins" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Sub Admins
              </TabsTrigger>
              <TabsTrigger value="upiids" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                UPI IDs
              </TabsTrigger>
              <TabsTrigger value="simulator" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                SMS Simulator
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                  title="Total Revenue"
                  value={`₹${stats?.totalRevenue || "0"}`}
                  icon={TrendingUp}
                  color="success"
                />
                <StatsCard
                  title="Total Transactions"
                  value={stats?.totalTransactions || 0}
                  icon={Activity}
                  color="primary"
                />
                <StatsCard
                  title="Pending"
                  value={stats?.pendingTransactions || 0}
                  icon={Clock}
                  color="warning"
                />
                <StatsCard
                  title="Today's Transactions"
                  value={stats?.todayTransactions || 0}
                  icon={BarChart3}
                  color="blue"
                />
              </div>

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

            <TabsContent value="analytics" className="space-y-6">
              {adminToken && <AnalyticsDashboard adminToken={adminToken} />}
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
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subadmins" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Sub Admin Management</h2>
                <Dialog open={isSubAdminDialogOpen} onOpenChange={setIsSubAdminDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Sub Admin
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Sub Admin</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateSubAdmin} className="space-y-4">
                      <div>
                        <Label htmlFor="sub-username">Username</Label>
                        <Input
                          id="sub-username"
                          value={subAdminForm.username}
                          onChange={(e) => setSubAdminForm(prev => ({ ...prev, username: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="sub-password">Password</Label>
                        <Input
                          id="sub-password"
                          type="password"
                          value={subAdminForm.password}
                          onChange={(e) => setSubAdminForm(prev => ({ ...prev, password: e.target.value }))}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={createSubAdminMutation.isPending}>
                        {createSubAdminMutation.isPending ? "Creating..." : "Create Sub Admin"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="border-dashed border-2 border-gray-300">
                  <CardContent className="p-6 text-center">
                    <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">Demo Sub Admin</h3>
                    <p className="text-sm text-gray-500 mb-4">Username: subadmin</p>
                    <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="upiids" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">UPI ID Management</h2>
                <Dialog open={isUpiIdDialogOpen} onOpenChange={setIsUpiIdDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add UPI ID
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New UPI ID</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateUpiId} className="space-y-4">
                      <div>
                        <Label htmlFor="upi-id">UPI ID</Label>
                        <Input
                          id="upi-id"
                          value={upiIdForm.upiId}
                          onChange={(e) => setUpiIdForm(prev => ({ ...prev, upiId: e.target.value }))}
                          placeholder="example@upi"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={createUpiIdMutation.isPending}>
                        {createUpiIdMutation.isPending ? "Adding..." : "Add UPI ID"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            UPI ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Used
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {upiIds?.map((upi: any) => (
                          <tr key={upi.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                              {upi.upiId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={upi.active ? "default" : "secondary"}>
                                {upi.active ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {upi.lastUsed ? new Date(upi.lastUsed).toLocaleString() : "Never"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(upi.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="simulator" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SMSWebhookSimulator />
                <Card>
                  <CardHeader>
                    <CardTitle>Bulk UPI ID Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="bulk-upi">UPI IDs (one per line)</Label>
                        <textarea
                          id="bulk-upi"
                          placeholder="merchant1@paytm&#10;shop2@phonepe&#10;store3@gpay"
                          className="w-full h-32 p-3 border rounded-md resize-none"
                          rows={5}
                        />
                      </div>
                      <Button className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Multiple UPI IDs
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
