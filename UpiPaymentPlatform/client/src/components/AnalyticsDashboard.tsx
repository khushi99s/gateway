import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatsCard } from "@/components/StatsCard";
import { 
  TrendingUp, 
  Activity, 
  DollarSign, 
  Users, 
  BarChart3,
  Calendar,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

interface AnalyticsProps {
  adminToken: string;
}

interface AnalyticsData {
  totalRevenue: string;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  averageTransactionValue: string;
  dailyStats: Array<{
    date: string;
    transactions: number;
    revenue: string;
  }>;
}

export function AnalyticsDashboard({ adminToken }: AnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("7d");

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/admin/analytics", selectedPeriod],
    enabled: !!adminToken,
    queryFn: async () => {
      const response = await fetch(`/api/admin/analytics?period=${selectedPeriod}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json() as Promise<AnalyticsData>;
    },
  });

  const { data: recentTransactions } = useQuery({
    queryKey: ["/api/admin/transactions/history"],
    enabled: !!adminToken,
    queryFn: async () => {
      const response = await fetch("/api/admin/transactions/history?limit=10", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) throw new Error("Failed to fetch recent transactions");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const successRate = analytics 
    ? ((analytics.successfulTransactions / analytics.totalTransactions) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Revenue"
              value={`₹${analytics?.totalRevenue || "0"}`}
              icon={DollarSign}
              color="success"
            />
            <StatsCard
              title="Total Transactions"
              value={analytics?.totalTransactions || 0}
              icon={Activity}
              color="primary"
            />
            <StatsCard
              title="Success Rate"
              value={`${successRate}%`}
              icon={TrendingUp}
              color="success"
            />
            <StatsCard
              title="Average Value"
              value={`₹${analytics?.averageTransactionValue || "0"}`}
              icon={BarChart3}
              color="blue"
            />
          </div>

          {/* Transaction Status Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-green-100 text-green-600">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Successful</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics?.successfulTransactions || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics?.pendingTransactions || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-red-100 text-red-600">
                    <XCircle className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Failed</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics?.failedTransactions || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions?.slice(0, 5).map((transaction: any) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`h-3 w-3 rounded-full ${
                        transaction.status === "success" ? "bg-green-500" :
                        transaction.status === "pending" ? "bg-yellow-500" : "bg-red-500"
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">{transaction.txnId}</p>
                        <p className="text-sm text-gray-600">{new Date(transaction.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₹{transaction.amount}</p>
                      <p className="text-sm text-gray-600">{transaction.upiId}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Success Rate</span>
                    <span className="font-semibold text-green-600">{successRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average Transaction</span>
                    <span className="font-semibold">₹{analytics?.averageTransactionValue || "0"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Volume</span>
                    <span className="font-semibold">₹{analytics?.totalRevenue || "0"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Successful</span>
                    </div>
                    <span className="text-sm font-medium">{analytics?.successfulTransactions || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Pending</span>
                    </div>
                    <span className="text-sm font-medium">{analytics?.pendingTransactions || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Failed</span>
                    </div>
                    <span className="text-sm font-medium">{analytics?.failedTransactions || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Daily Transaction Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.dailyStats?.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{new Date(day.date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600">{day.transactions} transactions</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₹{day.revenue}</p>
                      <p className="text-sm text-gray-600">
                        avg ₹{day.transactions > 0 ? (parseFloat(day.revenue) / day.transactions).toFixed(2) : "0"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}