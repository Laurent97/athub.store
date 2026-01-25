import { useState } from 'react';
import { Bell, MessageSquare, Gift, Package, CreditCard, Settings, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';

interface Partner {
  id: string;
  user_id: string;
  store_name: string;
  store_id?: string;
  users: {
    email: string;
    full_name: string;
  };
}

interface PartnerNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: Partner | null;
  onSuccess?: () => void;
}

const notificationTypes = [
  { value: 'admin', label: 'Admin Message', icon: MessageSquare, color: 'bg-purple-100 text-purple-800' },
  { value: 'payment', label: 'Payment', icon: CreditCard, color: 'bg-green-100 text-green-800' },
  { value: 'order', label: 'Order Update', icon: Package, color: 'bg-blue-100 text-blue-800' },
  { value: 'promotion', label: 'Promotion', icon: Gift, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'system', label: 'System', icon: Settings, color: 'bg-gray-100 text-gray-800' },
  { value: 'urgent', label: 'Urgent', icon: AlertTriangle, color: 'bg-red-100 text-red-800' }
];

const priorityLevels = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
];

export default function PartnerNotificationModal({ isOpen, onClose, partner, onSuccess }: PartnerNotificationModalProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('admin');
  const [priority, setPriority] = useState('medium');
  const [link, setLink] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !partner) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate inputs
      if (!title.trim()) {
        setError('Title is required');
        return;
      }
      if (!message.trim()) {
        setError('Message is required');
        return;
      }

      // Create notification
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: partner.user_id,
          title: title.trim(),
          message: message.trim(),
          type: type,
          priority: priority,
          link: link.trim() || null,
          metadata: {
            partner_id: partner.id,
            store_id: partner.store_id,
            store_name: partner.store_name,
            sent_by: 'admin'
          }
        });

      if (notificationError) {
        throw notificationError;
      }

      // Create admin log
      await supabase
        .from('admin_logs')
        .insert({
          action: 'notification_sent',
          target_user_id: partner.user_id,
          target_partner_id: partner.id,
          details: {
            title: title.trim(),
            type: type,
            priority: priority
          }
        });

      // Reset form
      setTitle('');
      setMessage('');
      setType('admin');
      setPriority('medium');
      setLink('');
      
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error sending notification:', error);
      setError(error.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = notificationTypes.find(t => t.value === type);
  const selectedPriority = priorityLevels.find(p => p.value === priority);
  const TypeIcon = selectedType?.icon || MessageSquare;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Send Notification</h2>
              <p className="text-sm text-muted-foreground">
                to {partner.store_name}
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Partner Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-foreground">{partner.store_name}</h3>
                  <p className="text-sm text-muted-foreground">{partner.users.email}</p>
                  {partner.store_id && (
                    <p className="text-xs text-muted-foreground">Store ID: {partner.store_id}</p>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">
                  Partner
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-foreground">
              Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notification title"
              maxLength={100}
              className="w-full"
              required
            />
            <p className="text-xs text-muted-foreground">
              {title.length}/100 characters
            </p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium text-foreground">
              Message *
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter notification message"
              rows={4}
              maxLength={500}
              className="w-full resize-none"
              required
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/500 characters
            </p>
          </div>

          {/* Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium text-foreground">
                Type
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <TypeIcon className="w-4 h-4" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {notificationTypes.map((notifType) => {
                    const Icon = notifType.icon;
                    return (
                      <SelectItem key={notifType.value} value={notifType.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span>{notifType.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium text-foreground">
                Priority
              </Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <span>{level.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Link */}
          <div className="space-y-2">
            <Label htmlFor="link" className="text-sm font-medium text-foreground">
              Link (Optional)
            </Label>
            <Input
              id="link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://example.com or /relative-path"
              type="url"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Users can click this link to view more details
            </p>
          </div>

          {/* Preview */}
          {(title || message) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${selectedType?.color}`}>
                      <TypeIcon className="w-3 h-3" />
                    </div>
                    <span className="font-medium text-foreground">{title || 'Title'}</span>
                    <Badge className={`text-xs ${selectedPriority?.color}`}>
                      {selectedPriority?.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {message || 'Message content...'}
                  </p>
                  {link && (
                    <p className="text-xs text-primary hover:underline cursor-pointer">
                      {link}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Send Notification
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
