import React from 'react';
import { Store, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import StoreIdBadge from '@/components/ui/StoreIdBadge';

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
            <div className="flex items-center gap-4">
              {partner?.store_id && (
                <StoreIdBadge storeId={partner.store_id} size="sm" variant="outline" />
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
