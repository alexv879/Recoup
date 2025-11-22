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
                invoiceId: 'inv1',
                escalationLevel: 'gentle' as const,
                eventType: 'reminder_sent' as const,
                timestamp: new Date(),
                message: 'Friendly reminder sent',
                channel: 'email',
            },
            {
                eventId: 'e2',
                invoiceId: 'inv1',
                escalationLevel: 'firm' as const,
                eventType: 'escalated' as const,
                timestamp: new Date(),
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
                invoiceId: 'inv1',
                escalationLevel: 'gentle' as const,
                eventType: 'reminder_sent' as const,
                timestamp: new Date(),
                message: 'Friendly reminder sent',
                channel: 'email',
            },
        ];

        const { container } = render(<CollectionsTimeline events={events} />);
        expect(container).toMatchSnapshot();
    });
});
