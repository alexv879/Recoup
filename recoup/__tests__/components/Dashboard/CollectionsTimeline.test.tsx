import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CollectionsTimeline } from '@/components/Dashboard/CollectionsTimeline';

expect.extend(toHaveNoViolations);

describe('Dashboard CollectionsTimeline', () => {
    it('renders and has no obvious accessibility violations (axe)', async () => {
        const events = [
            {
                eventId: 'e1',
                eventType: 'reminder_sent',
                timestamp: new Date().toISOString(),
                message: 'Friendly reminder sent',
                channel: 'email',
            },
            {
                eventId: 'e2',
                eventType: 'escalated',
                timestamp: new Date().toISOString(),
                message: 'Escalated to firm',
                channel: 'email',
            },
        ];

        const { container } = render(<CollectionsTimeline events={events} />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('matches snapshot', () => {
        const events = [
            {
                eventId: 'e1',
                eventType: 'reminder_sent',
                timestamp: new Date().toISOString(),
                message: 'Friendly reminder sent',
                channel: 'email',
            },
        ];

        const { container } = render(<CollectionsTimeline events={events} />);
        expect(container).toMatchSnapshot();
    });
});
