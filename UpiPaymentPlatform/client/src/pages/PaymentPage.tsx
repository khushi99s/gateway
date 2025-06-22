import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { ArrowLeft, CreditCard, Smartphone, Info } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PaymentData {
  txnId: string;
  amount: string;
  upiId: string;
  qrCode: string;
  status: string;
}

export default function PaymentPage() {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const { toast } = useToast();

  const generateQR = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await apiRequest("POST", "/api/payment/generate", {
        amount: parseFloat(amount),
        description: description || undefined,
      });

      const data = await response.json();
      setPaymentData(data);
      setIsPolling(true);
      
      toast({
        title: "QR Code Generated",
        description: "Scan the QR code to complete payment",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const pollPaymentStatus = async () => {
    if (!paymentData) return;

    try {
      const response = await apiRequest("GET", `/api/payment/status/${paymentData.txnId}`);
      const data = await response.json();
      
      if (data.status !== paymentData.status) {
        setPaymentData(prev => prev ? { ...prev, status: data.status } : null);
        
        if (data.status === "success") {
          setIsPolling(false);
          toast({
            title: "Payment Successful!",
            description: "Your payment has been confirmed.",
          });
        } else if (data.status === "failed") {
          setIsPolling(false);
          toast({
            title: "Payment Failed",
            description: "Payment was not successful. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Failed to check payment status:", error);
    }
  };

  const simulatePayment = async () => {
    if (!paymentData) return;

    try {
      // For demo purposes, simulate a successful payment
      setPaymentData(prev => prev ? { ...prev, status: "success" } : null);
      setIsPolling(false);
      
      toast({
        title: "Payment Simulated!",
        description: "Demo payment has been marked as successful.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to simulate payment.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPolling && paymentData?.status === "pending") {
      interval = setInterval(pollPaymentStatus, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPolling, paymentData]);

  const resetPayment = () => {
    setPaymentData(null);
    setIsPolling(false);
    setAmount("");
    setDescription("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="text-center">
            <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Make Payment</h1>
            <p className="mt-2 text-gray-600">Scan QR code to pay via UPI</p>
          </div>
        </div>

        {!paymentData ? (
          /* Payment Form */
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <div className="mt-1 relative">
                  <span className="absolute left-3 top-2 text-gray-500">₹</span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="Payment for..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Button 
                onClick={generateQR} 
                disabled={isGenerating || !amount}
                className="w-full"
                size="lg"
              >
                {isGenerating ? "Generating..." : "Generate QR Code"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* QR Code Display */
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Scan to Pay</CardTitle>
              <p className="text-center text-sm text-gray-600">
                Transaction ID: <span className="font-mono text-primary">{paymentData.txnId}</span>
              </p>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <QRCodeDisplay 
                qrCode={paymentData.qrCode}
                amount={paymentData.amount}
                upiId={paymentData.upiId}
              />

              {/* Status Display */}
              <div className="space-y-4">
                {paymentData.status === "pending" && (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm text-gray-600">Waiting for payment...</span>
                  </div>
                )}

                {paymentData.status === "success" && (
                  <Alert className="border-green-200 bg-green-50">
                    <AlertDescription className="text-green-800">
                      ✅ Payment successful! Your transaction has been completed.
                    </AlertDescription>
                  </Alert>
                )}

                {paymentData.status === "failed" && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">
                      ❌ Payment failed. Please try again or contact support.
                    </AlertDescription>
                  </Alert>
                )}

                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-blue-800">
                    Open any UPI app and scan this QR code to complete payment
                  </AlertDescription>
                </Alert>

                {/* Demo Actions */}
                <div className="space-y-2">
                  {paymentData.status === "pending" && (
                    <Button 
                      onClick={simulatePayment}
                      variant="outline"
                      className="w-full border-green-300 text-green-700 hover:bg-green-50"
                    >
                      🎭 Simulate Payment Success (Demo)
                    </Button>
                  )}
                  
                  <Button 
                    onClick={resetPayment}
                    variant="outline"
                    className="w-full"
                  >
                    Make Another Payment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
