import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Users, Activity, Settings } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">UPI Gateway Admin</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName || user?.email || "Admin User"}
                  </p>
                  <p className="text-xs text-gray-500">{user?.role || "Administrator"}</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your UPI payment gateway and monitor transactions</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/admin/super">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Super Admin Dashboard</CardTitle>
                  <Settings className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Manage sub admins, UPI IDs, and view all transactions
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/sub">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Sub Admin Dashboard</CardTitle>
                  <Activity className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  View transactions and confirm payments manually
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/pay">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Payment Demo</CardTitle>
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Test the payment flow with QR code generation
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Features Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Dynamic UPI QR code generation</li>
                <li>• Real-time transaction monitoring</li>
                <li>• Role-based access control</li>
                <li>• Manual payment confirmation</li>
                <li>• Transaction analytics and reporting</li>
                <li>• Multi-UPI ID management</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <p>1. Use the <strong>Super Admin Dashboard</strong> to manage UPI IDs and sub admins</p>
                <p>2. Visit the <strong>Payment Demo</strong> to test QR code generation</p>
                <p>3. Use the <strong>Sub Admin Dashboard</strong> to confirm payments manually</p>
                <p>4. Monitor all transactions and analytics from the admin panels</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
