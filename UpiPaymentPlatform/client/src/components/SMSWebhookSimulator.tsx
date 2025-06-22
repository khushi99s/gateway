import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Smartphone, Send, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function SMSWebhookSimulator() {
  const [formData, setFormData] = useState({
    txnId: "",
    status: "",
    bankReference: "",
  });
  const { toast } = useToast();

  const webhookMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/webhook/sms", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "SMS Webhook Sent",
        description: data.message,
      });
      setFormData({ txnId: "", status: "", bankReference: "" });
    },
    onError: (error) => {
      toast({
        title: "Webhook Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.txnId || !formData.status) {
      toast({
        title: "Missing Fields",
        description: "Transaction ID and status are required",
        variant: "destructive",
      });
      return;
    }
    webhookMutation.mutate(formData);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Smartphone className="h-5 w-5" />
          <span>SMS Webhook Simulator</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertDescription>
            Simulate SMS-based payment confirmations for testing the webhook system.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="txnId">Transaction ID</Label>
            <Input
              id="txnId"
              placeholder="TXN1234567890"
              value={formData.txnId}
              onChange={(e) => setFormData(prev => ({ ...prev, txnId: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="status">Payment Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="success">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Success</span>
                  </div>
                </SelectItem>
                <SelectItem value="failed">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span>Failed</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="bankReference">Bank Reference (Optional)</Label>
            <Input
              id="bankReference"
              placeholder="REF123456789"
              value={formData.bankReference}
              onChange={(e) => setFormData(prev => ({ ...prev, bankReference: e.target.value }))}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={webhookMutation.isPending}
          >
            {webhookMutation.isPending ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sending...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Send className="h-4 w-4" />
                <span>Send SMS Webhook</span>
              </div>
            )}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">How it works:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Enter a valid transaction ID from recent payments</li>
            <li>• Select success to confirm payment</li>
            <li>• Select failed to reject payment</li>
            <li>• Bank reference is auto-generated if not provided</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}