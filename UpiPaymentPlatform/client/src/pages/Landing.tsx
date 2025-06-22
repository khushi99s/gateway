import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Shield, Users, Activity } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">UPI Gateway Demo</span>
            </div>
            <div className="flex space-x-4">
              <Link href="/pay">
                <Button variant="outline">Make Payment</Button>
              </Link>
              <Button onClick={() => window.location.href = "/api/login"}>
                Admin Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Educational UPI Payment Gateway
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A comprehensive demo showcasing UPI payment processing with dynamic QR generation, 
            admin dashboards, and transaction management.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/pay">
              <Button size="lg" className="px-8">
                Try Demo Payment
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => window.location.href = "/api/login"}
              className="px-8"
            >
              Admin Dashboard
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Dynamic QR Generation</h3>
              <p className="text-gray-600">
                Generate unique UPI QR codes with rotating UPI IDs for payment processing.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Role-Based Admin</h3>
              <p className="text-gray-600">
                Super Admin and Sub Admin dashboards with different access levels and permissions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Transaction Management</h3>
              <p className="text-gray-600">
                Real-time transaction tracking with manual confirmation and status updates.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Demo Credentials */}
        <div className="mt-16 bg-blue-50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Demo Credentials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Super Admin</h3>
              <p className="text-sm text-gray-600">Username: <code className="bg-gray-100 px-2 py-1 rounded">superadmin</code></p>
              <p className="text-sm text-gray-600">Password: <code className="bg-gray-100 px-2 py-1 rounded">123456</code></p>
            </div>
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Sub Admin</h3>
              <p className="text-sm text-gray-600">Username: <code className="bg-gray-100 px-2 py-1 rounded">subadmin</code></p>
              <p className="text-sm text-gray-600">Password: <code className="bg-gray-100 px-2 py-1 rounded">123456</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
