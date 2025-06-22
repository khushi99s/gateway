import { Card, CardContent } from "@/components/ui/card";
import { Smartphone } from "lucide-react";

interface QRCodeDisplayProps {
  qrCode: string;
  amount: string;
  upiId: string;
}

export function QRCodeDisplay({ qrCode, amount, upiId }: QRCodeDisplayProps) {
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
        <img 
          src={qrCode} 
          alt="UPI Payment QR Code" 
          className="w-48 h-48 object-contain"
        />
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-gray-900">₹{amount}</p>
        <p className="text-sm text-gray-600 font-mono">{upiId}</p>
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <Smartphone className="h-4 w-4" />
          <span>Scan with any UPI app</span>
        </div>
      </div>
    </div>
  );
}
