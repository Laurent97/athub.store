import { useEffect, useRef } from 'react';
import { TrackingService } from '../lib/supabase/tracking-service';

interface UseTrackingRealtimeOptions {
  trackingId?: string;
  enabled?: boolean;
  onTrackingUpdate?: (payload: any) => void;
  onTrackingInsert?: (payload: any) => void;
  onTrackingDelete?: (payload: any) => void;
  onUpdateInsert?: (payload: any) => void;
}

export function useTrackingRealtime({
  trackingId,
  enabled = true,
  onTrackingUpdate,
  onTrackingInsert,
  onTrackingDelete,
  onUpdateInsert
}: UseTrackingRealtimeOptions) {
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled || !trackingId) {
      // Cleanup existing subscription if disabled
      if (subscriptionRef.current) {
        TrackingService.unsubscribeFromTracking(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      return;
    }

    // Subscribe to tracking updates
    const subscription = TrackingService.subscribeToTracking(trackingId, (payload) => {
      console.log('Real-time tracking update:', payload);
      
      switch (payload.eventType) {
        case 'UPDATE':
          if (payload.table === 'order_tracking') {
            onTrackingUpdate?.(payload);
          } else if (payload.table === 'tracking_updates') {
            onUpdateInsert?.(payload);
          }
          break;
        case 'INSERT':
          if (payload.table === 'order_tracking') {
            onTrackingInsert?.(payload);
          } else if (payload.table === 'tracking_updates') {
            onUpdateInsert?.(payload);
          }
          break;
        case 'DELETE':
          if (payload.table === 'order_tracking') {
            onTrackingDelete?.(payload);
          }
          break;
      }
    });

    subscriptionRef.current = subscription;

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        TrackingService.unsubscribeFromTracking(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [trackingId, enabled, onTrackingUpdate, onTrackingInsert, onTrackingDelete, onUpdateInsert]);

  // Manual cleanup function
  const unsubscribe = () => {
    if (subscriptionRef.current) {
      TrackingService.unsubscribeFromTracking(subscriptionRef.current);
      subscriptionRef.current = null;
    }
  };

  return { unsubscribe };
}
