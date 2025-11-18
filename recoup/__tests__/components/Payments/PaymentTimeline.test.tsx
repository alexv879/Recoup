import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { PaymentTimeline } from '@/components/Payments/PaymentTimeline';

expect.extend(toHaveNoViolations);

describe('PaymentTimeline', () => {
    it('renders and has no accessibility violations', async () => {
        const events = [
            { type: 'sent', timestamp: new Date().toISOString(), description: 'Sent to client' },
            { type: 'payment_verified', timestamp: new Date().toISOString(), description: 'Payment verified' },
        ];

        const { container } = render(<PaymentTimeline events={events} />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('matches snapshot', () => {
        const events = [
            { type: 'sent', timestamp: new Date().toISOString(), description: 'Sent to client' },
        ];
        const { container } = render(<PaymentTimeline events={events} />);
        expect(container).toMatchSnapshot();
    });
});
