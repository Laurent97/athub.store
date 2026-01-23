import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, MapPin, Package, Truck, Edit, Plus, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { adminTrackingAPI } from '@/services/tracking-api';
import { TRACKING_STATUSES } from '@/lib/types/tracking';
import { toast } from 'sonner';

interface TrackingRecord {
  id: string;
  order_id: string;
  tracking_number: string;
  shipping_method: string;
  carrier: string;
  status: string;
  estimated_delivery: string;
  actual_delivery?: string;
  created_at: string;
  tracking_updates: Array<{
    id: string;
    status: string;
    location?: string;
    description?: string;
    timestamp: string;
  }>;
}

export default function TrackingManager() {
  const [trackingRecords, setTrackingRecords] = useState<TrackingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedTracking, setSelectedTracking] = useState<TrackingRecord | null>(null);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    location: '',
    description: ''
  });

  useEffect(() => {
    fetchTrackingRecords();
  }, []);

  const fetchTrackingRecords = async () => {
    try {
      const result = await adminTrackingAPI.getAllTracking();
      if (result.success) {
        setTrackingRecords(result.data);
      } else {
        toast.error('Failed to fetch tracking records');
      }
    } catch (error) {
      toast.error('Error loading tracking records');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTracking = async () => {
    if (!selectedTracking || !updateForm.status) {
      toast.error('Please select a status');
      return;
    }

    try {
      const adminId = (await import('@/lib/supabase/client')).supabase.auth.getUser().then(res => res.data.user?.id);
      
      const result = await adminTrackingAPI.updateTracking(
        {
          trackingId: selectedTracking.id,
          status: updateForm.status as any,
          location: updateForm.location,
          description: updateForm.description
        },
        await adminId
      );

      if (result.success) {
        toast.success('Tracking updated successfully!');
        setUpdateModalOpen(false);
        setUpdateForm({ status: '', location: '', description: '' });
        fetchTrackingRecords();
      } else {
        toast.error(result.error || 'Failed to update tracking');
      }
    } catch (error) {
      toast.error('Error updating tracking');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = TRACKING_STATUSES[status as keyof typeof TRACKING_STATUSES];
    if (!statusConfig) {
      return <Badge variant="secondary">{status}</Badge>;
    }

    const colorMap = {
      blue: 'bg-blue-100 text-blue-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      orange: 'bg-orange-100 text-orange-800',
      green: 'bg-green-100 text-green-800'
    };

    return (
      <Badge className={colorMap[statusConfig.color as keyof typeof colorMap]}>
        {statusConfig.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Package className="w-8 h-8 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Tracking Management</h2>
        <Button onClick={fetchTrackingRecords}>
          <Package className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Shipments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Tracking Number</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Est. Delivery</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trackingRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-mono">{record.order_id}</TableCell>
                  <TableCell className="font-mono">{record.tracking_number}</TableCell>
                  <TableCell>{record.carrier}</TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                  <TableCell>
                    {record.estimated_delivery ? (
                      format(new Date(record.estimated_delivery), 'MMM dd, yyyy')
                    ) : (
                      'Not set'
                    )}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTracking(record)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Update
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Update Tracking - {record.tracking_number}</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select 
                              value={updateForm.status} 
                              onValueChange={(value) => setUpdateForm(prev => ({ ...prev, status: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select new status" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(TRACKING_STATUSES).map(([key, status]) => (
                                  <SelectItem key={key} value={key}>
                                    {status.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="location">Location (Optional)</Label>
                            <Input
                              id="location"
                              placeholder="e.g., Distribution Center, CA"
                              value={updateForm.location}
                              onChange={(e) => setUpdateForm(prev => ({ ...prev, location: e.target.value }))}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                              id="description"
                              placeholder="Add any additional notes about this update"
                              value={updateForm.description}
                              onChange={(e) => setUpdateForm(prev => ({ ...prev, description: e.target.value }))}
                            />
                          </div>

                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              onClick={() => setUpdateModalOpen(false)}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleUpdateTracking} className="flex-1">
                              <Truck className="w-4 h-4 mr-2" />
                              Update Tracking
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tracking History */}
      {selectedTracking && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Tracking History - {selectedTracking.tracking_number}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedTracking.tracking_updates.map((update, index) => (
                <div key={update.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {update.status === 'delivered' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Truck className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    {index < selectedTracking.tracking_updates.length - 1 && (
                      <div className="w-0.5 h-16 bg-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{update.status}</h4>
                      {update.location && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {update.location}
                        </span>
                      )}
                    </div>
                    {update.description && (
                      <p className="text-sm text-muted-foreground mb-1">{update.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(update.timestamp), 'MMM dd, yyyy at h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
