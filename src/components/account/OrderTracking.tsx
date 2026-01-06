import { useShipmentTracking, TrackingEvent } from '@/hooks/useShipmentTracking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Truck, CheckCircle2, Circle, ExternalLink, AlertCircle, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface OrderTrackingProps {
  awbCode: string;
  courierName?: string | null;
  trackingUrl?: string | null;
}

const statusColors: Record<string, string> = {
  'delivered': 'bg-green-100 text-green-800',
  'out for delivery': 'bg-orange-100 text-orange-800',
  'in transit': 'bg-blue-100 text-blue-800',
  'shipped': 'bg-blue-100 text-blue-800',
  'picked up': 'bg-indigo-100 text-indigo-800',
  'rto': 'bg-red-100 text-red-800',
  'returned': 'bg-red-100 text-red-800',
  'pending': 'bg-yellow-100 text-yellow-800',
};

const getStatusColor = (status: string): string => {
  const normalizedStatus = status.toLowerCase();
  for (const [key, value] of Object.entries(statusColors)) {
    if (normalizedStatus.includes(key)) return value;
  }
  return 'bg-gray-100 text-gray-800';
};

const formatEventDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return format(date, 'MMM dd, yyyy h:mm a');
  } catch {
    return dateStr;
  }
};

const OrderTracking = ({ awbCode, courierName, trackingUrl }: OrderTrackingProps) => {
  const { data: tracking, isLoading, error } = useShipmentTracking(awbCode);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Truck className="h-5 w-5" />
            Shipment Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading tracking info...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Truck className="h-5 w-5" />
            Shipment Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-6 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-4">
              Unable to load tracking information
            </p>
            {trackingUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
                  Track on Courier Website
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Truck className="h-5 w-5" />
            Shipment Tracking
          </CardTitle>
          {tracking?.current_status && (
            <Badge className={getStatusColor(tracking.current_status)} variant="secondary">
              {tracking.current_status}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Shipment Info */}
        <div className="flex flex-wrap gap-4 text-sm">
          {courierName && (
            <div>
              <span className="text-muted-foreground">Courier:</span>{' '}
              <span className="font-medium">{courierName}</span>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">AWB:</span>{' '}
            <span className="font-mono font-medium">{awbCode}</span>
          </div>
          {tracking?.estimated_delivery && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Est. Delivery:</span>{' '}
              <span className="font-medium">{tracking.estimated_delivery}</span>
            </div>
          )}
        </div>

        {/* Tracking Timeline */}
        {tracking?.tracking_events && tracking.tracking_events.length > 0 ? (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-3">Tracking History</h4>
            <div className="relative space-y-0">
              {tracking.tracking_events.map((event: TrackingEvent, index: number) => (
                <div key={index} className="relative flex gap-3 pb-4 last:pb-0">
                  {/* Timeline line */}
                  {index < tracking.tracking_events.length - 1 && (
                    <div className="absolute left-[11px] top-6 h-full w-0.5 bg-border" />
                  )}
                  
                  {/* Icon */}
                  <div className="relative z-10 flex-shrink-0">
                    {index === 0 ? (
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground fill-background" />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${index === 0 ? 'font-medium' : ''}`}>
                      {event.activity}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                      {event.date && <span>{formatEventDate(event.date)}</span>}
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4">
            No tracking events available yet
          </p>
        )}

        {/* External Track Button */}
        {trackingUrl && (
          <div className="pt-2">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
                Track on Courier Website
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderTracking;
