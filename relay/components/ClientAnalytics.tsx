// Client Management Analytics Tracker
import React, { useEffect } from 'react';

interface ClientAnalyticsProps {
    event: 'add' | 'update' | 'archive' | 'unarchive' | 'select';
    clientId: string;
    userId?: string;
}

const trackClientEvent = (event: string, clientId: string, userId?: string) => {
    // Replace with actual analytics integration (e.g., Segment, Mixpanel, custom)
    window?.relayAnalytics?.track?.('client_event', {
        event,
        clientId,
        userId,
        timestamp: Date.now(),
    });
};

const ClientAnalytics: React.FC<ClientAnalyticsProps> = ({ event, clientId, userId }) => {
    useEffect(() => {
        trackClientEvent(event, clientId, userId);
    }, [event, clientId, userId]);
    return null;
};

export default ClientAnalytics;
