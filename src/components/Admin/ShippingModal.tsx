import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Package, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { adminTrackingAPI } from '@/services/tracking-api';
import { SHIPPING_METHODS, CARRIERS } from '@/lib/types/tracking';
import { toast } from 'sonner';

interface ShippingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  partnerId: string;
  onSuccess: () => void;
}

export default function ShippingModal({ isOpen, onClose, orderId, partnerId, onSuccess }: ShippingModalProps) {
  const [formData, setFormData] = useState({
    trackingNumber: '',
    shippingMethod: '' as 'standard' | 'express' | 'overnight' | '',
    carrier: '',
    estimatedDelivery: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState<Date>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.trackingNumber || !formData.shippingMethod || !formData.carrier || !deliveryDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const adminId = (await import('@/lib/supabase/client')).supabase.auth.getUser().then(res => res.data.user?.id);
      
      const result = await adminTrackingAPI.shipOrder(
        orderId,
        {
          trackingNumber: formData.trackingNumber,
          shippingMethod: formData.shippingMethod as 'standard' | 'express' | 'overnight',
          carrier: formData.carrier,
          partnerId,
          estimatedDelivery: deliveryDate.toISOString()
        },
        await adminId
      );

      if (result.success) {
        toast.success('Order shipped successfully!');
        onSuccess();
        onClose();
        setFormData({
          trackingNumber: '',
          shippingMethod: '',
          carrier: '',
          estimatedDelivery: ''
        });
        setDeliveryDate(undefined);
      } else {
        toast.error(result.error || 'Failed to ship order');
      }
    } catch (error) {
      toast.error('An error occurred while shipping the order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Mark Order as Shipped
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="orderId">Order ID</Label>
            <Input
              id="orderId"
              value={orderId}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trackingNumber">Tracking Number *</Label>
            <Input
              id="trackingNumber"
              placeholder="e.g., TRK-123456789"
              value={formData.trackingNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, trackingNumber: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="carrier">Carrier *</Label>
            <Select value={formData.carrier} onValueChange={(value) => setFormData(prev => ({ ...prev, carrier: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select carrier" />
              </SelectTrigger>
              <SelectContent>
                {CARRIERS.map((carrier) => (
                  <SelectItem key={carrier} value={carrier}>
                    {carrier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shippingMethod">Shipping Method *</Label>
            <Select 
              value={formData.shippingMethod || ''} 
              onValueChange={(value: 'standard' | 'express' | 'overnight') => setFormData(prev => ({ ...prev, shippingMethod: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select shipping method" />
              </SelectTrigger>
              <SelectContent>
                {SHIPPING_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Estimated Delivery Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deliveryDate ? format(deliveryDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={deliveryDate}
                  onSelect={setDeliveryDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Truck className="w-4 h-4 mr-2 animate-pulse" />
                  Processing...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4 mr-2" />
                  Ship Order
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
