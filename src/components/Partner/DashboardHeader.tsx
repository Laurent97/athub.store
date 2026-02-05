import React, { useState, useEffect } from 'react';
import { Store, RefreshCw, Copy, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import StoreIdBadge from '@/components/ui/StoreIdBadge';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface DashboardHeaderProps {
  partner: any;
  userProfile: any;
  storeName: string;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export default function DashboardHeader({ 
  partner, 
  userProfile, 
  storeName, 
  refreshing = false,
  onRefresh 
}: DashboardHeaderProps) {
  const [invitationCode, setInvitationCode] = useState<string>('');
  const [invitationUsage, setInvitationUsage] = useState<number>(0);
  const [loadingInvitation, setLoadingInvitation] = useState(false);

  // Load invitation code data
  useEffect(() => {
    if (partner?.id) {
      loadInvitationData();
    }
  }, [partner?.id]);

  const loadInvitationData = async () => {
    if (!partner?.id) return;
    
    setLoadingInvitation(true);
    try {
      // Get invitation code from partner_profiles
      const { data: partnerData, error: partnerError } = await supabase
        .from('partner_profiles')
        .select('invitation_code')
        .eq('id', partner.id)
        .single();

      if (partnerError) {
        console.error('Error fetching partner invitation code:', partnerError);
        return;
      }

      if (partnerData?.invitation_code) {
        setInvitationCode(partnerData.invitation_code);
        
        // Try to get usage count from public_invitation_codes first
        try {
          const { data: publicData } = await supabase
            .from('public_invitation_codes')
            .select('current_uses')
            .eq('code', partnerData.invitation_code)
            .single();

          if (publicData) {
            setInvitationUsage(publicData.current_uses || 0);
          }
        } catch (publicError) {
          // If public_invitation_codes doesn't exist, calculate usage manually
          console.log('public_invitation_codes table not found, calculating usage manually');
          
          try {
            const { data: referredCount } = await supabase
              .from('partner_profiles')
              .select('id', { count: 'exact' })
              .eq('referred_by', partner.id);
              
            setInvitationUsage(referredCount?.length || 0);
          } catch (countError) {
            console.error('Error calculating usage count:', countError);
            setInvitationUsage(0);
          }
        }
      }
    } catch (error) {
      console.error('Error loading invitation data:', error);
    } finally {
      setLoadingInvitation(false);
    }
  };

  const copyInvitationCode = async () => {
    if (!invitationCode) return;
    
    try {
      await navigator.clipboard.writeText(invitationCode);
      toast.success('Invitation code copied to clipboard!');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = invitationCode;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('Invitation code copied to clipboard!');
      } catch (fallbackError) {
        toast.error('Failed to copy invitation code');
      }
      document.body.removeChild(textArea);
    }
  };
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Store className="w-8 h-8" />
              <h1 className="text-3xl font-bold">Partner Dashboard</h1>
            </div>
            <p className="text-blue-100 text-lg mb-4">
              Welcome back, {storeName}!
            </p>
            <div className="flex flex-wrap items-center gap-4">
              {partner?.store_id && (
                <StoreIdBadge storeId={partner.store_id} size="sm" variant="outline" />
              )}
              {invitationCode && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                  <Users className="w-4 h-4 text-white" />
                  <div className="flex flex-col">
                    <span className="text-xs text-white/70">Invitation Code</span>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-white">
                        {invitationCode}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyInvitationCode}
                        className="h-6 w-6 p-0 text-white hover:bg-white/20"
                        title="Copy invitation code"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    {!loadingInvitation && (
                      <span className="text-xs text-white/60">
                        {invitationUsage} uses
                      </span>
                    )}
                  </div>
                </div>
              )}
              <Badge variant={userProfile?.partner_status === 'approved' ? 'default' : 'secondary'}>
                {userProfile?.partner_status === 'approved' ? '✅ Verified Partner' : '⏳ Under Review'}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {onRefresh && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRefresh}
                disabled={refreshing}
                className="border-white/20 hover:bg-white/10 text-white hover:text-white"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
