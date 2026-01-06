import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TrackingEvent {
  date: string;
  activity: string;
  location: string;
}

export interface TrackingData {
  current_status: string;
  tracking_events: TrackingEvent[];
  estimated_delivery: string | null;
}

export function useShipmentTracking(awbCode: string | null) {
  return useQuery({
    queryKey: ['shipment-tracking', awbCode],
    queryFn: async (): Promise<TrackingData> => {
      if (!awbCode) throw new Error('No AWB code provided');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shiprocket-track?awb_code=${awbCode}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to fetch tracking data');
      }

      // Normalize tracking events from Shiprocket response
      const events: TrackingEvent[] = (data.tracking_events || []).map((event: any) => ({
        date: event.date || event.activity_time || event.timestamp || '',
        activity: event.activity || event.status || event.sr_status_label || '',
        location: event.location || event.city || '',
      }));

      return {
        current_status: data.current_status || 'Unknown',
        tracking_events: events,
        estimated_delivery: data.estimated_delivery,
      };
    },
    enabled: !!awbCode,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
