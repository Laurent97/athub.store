import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  CreditCard, 
  Download,
  Filter,
  Search,
  Calendar,
  User,
  DollarSign,
  Shield,
  Clock,
  Mail
} from 'lucide-react';

interface StripeAttempt {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order_id: string;
  order_amount: number;
  stripe_payment_method_id: string;
  stripe_payment_intent_id: string;
  card_last4: string;
  card_brand: string;
  card_exp_month: number;
  card_exp_year: number;
  card_funding: string;
  card_country: string;
  billing_name: string;
  billing_email: string;
  billing_phone: string;
  billing_address_line1: string;
  billing_address_city: string;
  billing_address_state: string;
  billing_address_country: string;
  billing_address_zip: string;
  status: string;
  rejection_reason: string;
  reviewed_by: string;
  reviewed_at: string;
  admin_notes: string;
  manual_override: boolean;
  ip_address: string;
  user_agent: string;
  device_fingerprint: string;
  created_at: string;
  updated_at: string;
}

interface AttemptDetailModalProps {
  attempt: StripeAttempt | null;
  onClose: () => void;
  onApprove: (attemptId: string) => void;
  onReject: (attemptId: string, reason: string) => void;
  onUpdateNotes: (attemptId: string, notes: string) => void;
}

const AttemptDetailModal: React.FC<AttemptDetailModalProps> = ({
  attempt,
  onClose,
  onApprove,
  onReject,
  onUpdateNotes
}) => {
  const [notes, setNotes] = useState(attempt?.admin_notes || '');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!attempt) return null;

  const handleSaveNotes = () => {
    onUpdateNotes(attempt.id, notes);
  };

  const handleApprove = () => {
    if (confirm('Manually approve this Stripe attempt? This will charge the customer.')) {
      onApprove(attempt.id);
      onClose();
    }
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    onReject(attempt.id, rejectionReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Stripe Attempt Details</h2>
            <Button variant="outline" onClick={onClose}>
              <XCircle className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <p className="font-medium">{attempt.customer_name}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="font-medium">{attempt.customer_email}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="font-medium">{attempt.customer_phone || 'N/A'}</p>
                </div>
                <div>
                  <Label>Customer ID</Label>
                  <p className="font-mono text-sm">{attempt.customer_id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Card Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Brand</Label>
                  <p className="font-medium">{attempt.card_brand}</p>
                </div>
                <div>
                  <Label>Last 4</Label>
                  <p className="font-medium">**** {attempt.card_last4}</p>
                </div>
                <div>
                  <Label>Expiry</Label>
                  <p className="font-medium">{attempt.card_exp_month}/{attempt.card_exp_year}</p>
                </div>
                <div>
                  <Label>Funding</Label>
                  <p className="font-medium">{attempt.card_funding}</p>
                </div>
                <div>
                  <Label>Country</Label>
                  <p className="font-medium">{attempt.card_country}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Address */}
          <Card>
            <CardHeader>
              <CardTitle>🏠 Billing Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <p className="font-medium">{attempt.billing_name}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="font-medium">{attempt.billing_email}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="font-medium">{attempt.billing_phone || 'N/A'}</p>
                </div>
                <div>
                  <Label>Address</Label>
                  <p className="font-medium">{attempt.billing_address_line1}</p>
                </div>
                <div>
                  <Label>City</Label>
                  <p className="font-medium">{attempt.billing_address_city}</p>
                </div>
                <div>
                  <Label>State/ZIP</Label>
                  <p className="font-medium">{attempt.billing_address_state} {attempt.billing_address_zip}</p>
                </div>
                <div>
                  <Label>Country</Label>
                  <p className="font-medium">{attempt.billing_address_country}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Order ID</Label>
                  <p className="font-medium">#{attempt.order_id}</p>
                </div>
                <div>
                  <Label>Amount</Label>
                  <p className="font-medium text-lg">${attempt.order_amount}</p>
                </div>
                <div>
                  <Label>Stripe Intent</Label>
                  <p className="font-mono text-sm">{attempt.stripe_payment_intent_id}</p>
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <p className="font-mono text-sm">{attempt.stripe_payment_method_id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status & Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Status & Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label>Status:</Label>
                  <Badge variant={attempt.status.includes('pending') ? 'secondary' : 'default'}>
                    {attempt.status.replace(/_/g, ' ')}
                  </Badge>
                  {attempt.manual_override && (
                    <Badge variant="outline">MANUAL</Badge>
                  )}
                </div>
                
                <div>
                  <Label>Rejection Reason</Label>
                  <p className="font-medium">{attempt.rejection_reason}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>IP Address</Label>
                    <p className="font-mono text-sm">{attempt.ip_address}</p>
                  </div>
                  <div>
                    <Label>Device Fingerprint</Label>
                    <p className="font-mono text-xs">{attempt.device_fingerprint?.slice(0, 20)}...</p>
                  </div>
                </div>
                
                <div>
                  <Label>User Agent</Label>
                  <div className="bg-gray-100 p-2 rounded text-xs font-mono max-h-20 overflow-y-auto">
                    {attempt.user_agent}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Notes */}
          <Card>
            <CardHeader>
              <CardTitle>📝 Admin Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Add notes about this attempt..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
                <Button onClick={handleSaveNotes} variant="outline">
                  Save Notes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {attempt.status === 'data_collected_pending_rejection' && (
                  <>
                    <Button onClick={handleApprove} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Manually Approve Payment
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => setShowRejectForm(true)}
                      className="flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Payment
                    </Button>
                  </>
                )}
                
                {showRejectForm && (
                  <div className="w-full space-y-2">
                    <Label>Rejection Reason</Label>
                    <Input
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter rejection reason..."
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleReject} variant="destructive">
                        Confirm Rejection
                      </Button>
                      <Button variant="outline" onClick={() => setShowRejectForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <div className="text-sm text-gray-500 text-center">
            Created: {new Date(attempt.created_at).toLocaleString()} | 
            Updated: {new Date(attempt.updated_at).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export const StripeAttemptsDashboard: React.FC = () => {
  const [attempts, setAttempts] = useState<StripeAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState<StripeAttempt | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    rejected: 0,
    approved: 0
  });

  useEffect(() => {
    loadStripeAttempts();
  }, [filter, searchTerm]);

  const loadStripeAttempts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/stripe-attempts?filter=${filter}&search=${searchTerm}`);
      const data = await response.json();
      
      if (data.success) {
        setAttempts(data.attempts);
        setStats(data.stats);
      } else {
        console.error('Failed to load attempts:', data.error);
      }
    } catch (error) {
      console.error('Error loading attempts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (attemptId: string) => {
    try {
      const response = await fetch(`/api/admin/stripe-attempts/${attemptId}/approve`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        loadStripeAttempts();
        alert('Payment manually approved successfully!');
      } else {
        alert('Failed to approve payment: ' + data.error);
      }
    } catch (error) {
      console.error('Error approving attempt:', error);
      alert('Failed to approve payment');
    }
  };

  const handleReject = async (attemptId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/stripe-attempts/${attemptId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      
      const data = await response.json();
      
      if (data.success) {
        loadStripeAttempts();
        alert('Payment rejected successfully!');
      } else {
        alert('Failed to reject payment: ' + data.error);
      }
    } catch (error) {
      console.error('Error rejecting attempt:', error);
      alert('Failed to reject payment');
    }
  };

  const handleUpdateNotes = async (attemptId: string, notes: string) => {
    try {
      const response = await fetch(`/api/admin/stripe-attempts/${attemptId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
      });
      
      const data = await response.json();
      
      if (data.success) {
        loadStripeAttempts();
      } else {
        console.error('Failed to update notes:', data.error);
      }
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  const exportAttemptsCSV = async () => {
    try {
      const response = await fetch('/api/admin/stripe-attempts/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stripe_attempts_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting attempts:', error);
      alert('Failed to export attempts');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'data_collected_pending_rejection':
        return <Badge variant="secondary">Pending Review</Badge>;
      case 'auto_rejected_security_policy':
        return <Badge variant="destructive">Auto-Rejected</Badge>;
      case 'manually_approved':
        return <Badge variant="default">Manually Approved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading Stripe attempts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="w-8 h-8 text-blue-600" />
            Customer Stripe Attempts
          </h1>
          <p className="text-gray-600">Monitor and manage customer Stripe payment attempts</p>
        </div>
        <Button onClick={exportAttemptsCSV} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Auto-Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Manually Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <Label>Filter:</Label>
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('pending')}
                >
                  Pending
                </Button>
                <Button
                  variant={filter === 'rejected' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('rejected')}
                >
                  Rejected
                </Button>
                <Button
                  variant={filter === 'approved' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('approved')}
                >
                  Approved
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <Label>Search:</Label>
              <Input
                placeholder="Search by name, email, or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attempts Table */}
      <Card>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Customer</th>
                  <th className="text-left p-2">Order</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Card</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => (
                  <tr key={attempt.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <code className="text-xs">{attempt.id.slice(0, 8)}...</code>
                    </td>
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{attempt.customer_name}</div>
                        <div className="text-sm text-gray-600">{attempt.customer_email}</div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div>
                        <div className="font-medium">#{attempt.order_id}</div>
                        <div className="text-sm text-gray-600">${attempt.order_amount}</div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="font-medium">${attempt.order_amount}</div>
                    </td>
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{attempt.card_brand}</div>
                        <div className="text-sm text-gray-600">**** {attempt.card_last4}</div>
                        <div className="text-xs text-gray-500">
                          {attempt.card_exp_month}/{attempt.card_exp_year}
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      {getStatusBadge(attempt.status)}
                      {attempt.manual_override && (
                        <Badge variant="outline" className="ml-1">MANUAL</Badge>
                      )}
                    </td>
                    <td className="p-2">
                      <div>
                        <div className="text-sm">
                          {new Date(attempt.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(attempt.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAttempt(attempt)}
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {attempt.status === 'data_collected_pending_rejection' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApprove(attempt.id)}
                            title="Manually approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {attempts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No Stripe attempts found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <AttemptDetailModal
        attempt={selectedAttempt}
        onClose={() => setSelectedAttempt(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onUpdateNotes={handleUpdateNotes}
      />
    </div>
  );
};

export default StripeAttemptsDashboard;
