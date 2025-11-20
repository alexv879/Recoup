/**
 * Recoup Marketing Landing Page
 * High-converting homepage for UK freelancers
 */

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    CheckCircle2,
    XCircle,
    ArrowRight,
    PoundSterling,
    FileText,
    Brain,
    LineChart,
    Shield,
    Zap,
    Clock,
    Users,
    TrendingUp,
    ChevronRight
} from 'lucide-react';

export default function MarketingHomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
            {/* Navigation */}
            <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <PoundSterling className="h-8 w-8 text-blue-600" />
                        <span className="text-2xl font-bold text-gray-900">Recoup</span>
                    </div>
                    <div className="hidden md:flex items-center gap-6">
                        <Link href="#features" className="text-gray-600 hover:text-gray-900 transition">
                            Features
                        </Link>
                        <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition">
                            Pricing
                        </Link>
                        <Link href="#comparison" className="text-gray-600 hover:text-gray-900 transition">
                            Compare
                        </Link>
                        <Link href="/sign-in">
                            <Button variant="ghost">Sign In</Button>
                        </Link>
                        <Link href="/sign-up">
                            <Button>Start Free Trial</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="container mx-auto px-4 py-20 md:py-32">
                <div className="max-w-4xl mx-auto text-center">
                    <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
                        Built for UK Freelancers
                    </Badge>
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                        Stop Chasing Payments.<br />
                        Start Earning Consistently.
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
                        The only invoicing platform designed for UK freelancers with <strong>IR35 compliance</strong>,
                        <strong> income smoothing</strong>, and <strong>AI-powered collections</strong>.
                        Get paid 2x faster without the awkward conversations.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                        <Link href="/sign-up">
                            <Button size="lg" className="text-lg px-8 py-6 h-auto">
                                Start Free Trial
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link href="#comparison">
                            <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto">
                                Compare Pricing
                            </Button>
                        </Link>
                    </div>
                    <p className="text-sm text-gray-500">
                        Free tier available • No credit card required • 5 clients • 20 invoices/month
                    </p>
                </div>

                {/* Pain Points */}
                <div className="max-w-5xl mx-auto mt-20 grid md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader>
                            <Clock className="h-8 w-8 text-red-500 mb-2" />
                            <CardTitle>Late Payments Killing Cash Flow?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600">
                                Average UK freelancers wait <strong>42 days</strong> to get paid.
                                Recoup's AI follows up automatically, reducing payment time to <strong>18 days</strong>.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <Shield className="h-8 w-8 text-orange-500 mb-2" />
                            <CardTitle>IR35 Compliance Nightmare?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600">
                                Built-in IR35 assessments, MTD for VAT, and automatic tax calculations.
                                Stay compliant without hiring an accountant.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <Brain className="h-8 w-8 text-purple-500 mb-2" />
                            <CardTitle>Scope Creep Eating Profits?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600">
                                AI detects scope changes and suggests additional invoicing automatically.
                                Stop leaving money on the table.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Feature Comparison Table */}
            <section id="comparison" className="container mx-auto px-4 py-20 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Why UK Freelancers Choose Recoup
                        </h2>
                        <p className="text-xl text-gray-600">
                            42% cheaper than competitors, with features they don't have
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b-2">
                                    <th className="text-left p-4 text-gray-900 font-semibold">Feature</th>
                                    <th className="p-4">
                                        <div className="flex flex-col items-center">
                                            <span className="text-blue-600 font-bold text-lg">Recoup</span>
                                            <span className="text-sm text-gray-500">£19/mo</span>
                                            <Badge className="mt-2 bg-green-100 text-green-700">Best Value</Badge>
                                        </div>
                                    </th>
                                    <th className="p-4">
                                        <div className="flex flex-col items-center">
                                            <span className="text-gray-700 font-bold">FreshBooks</span>
                                            <span className="text-sm text-gray-500">£33/mo</span>
                                        </div>
                                    </th>
                                    <th className="p-4">
                                        <div className="flex flex-col items-center">
                                            <span className="text-gray-700 font-bold">QuickBooks</span>
                                            <span className="text-sm text-gray-500">£30/mo</span>
                                        </div>
                                    </th>
                                    <th className="p-4">
                                        <div className="flex flex-col items-center">
                                            <span className="text-gray-700 font-bold">Wave</span>
                                            <span className="text-sm text-gray-500">Free*</span>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <ComparisonRow
                                    feature="Unlimited Invoices"
                                    recoup={true}
                                    freshbooks={true}
                                    quickbooks={true}
                                    wave={true}
                                />
                                <ComparisonRow
                                    feature="Unlimited Clients"
                                    recoup={true}
                                    freshbooks={true}
                                    quickbooks={true}
                                    wave="1 client"
                                />
                                <ComparisonRow
                                    feature="AI Payment Collections"
                                    recoup={true}
                                    freshbooks={false}
                                    quickbooks={false}
                                    wave={false}
                                    highlight={true}
                                />
                                <ComparisonRow
                                    feature="IR35 Assessments"
                                    recoup={true}
                                    freshbooks={false}
                                    quickbooks={false}
                                    wave={false}
                                    highlight={true}
                                />
                                <ComparisonRow
                                    feature="MTD for VAT"
                                    recoup={true}
                                    freshbooks="£20/mo extra"
                                    quickbooks={true}
                                    wave={false}
                                />
                                <ComparisonRow
                                    feature="Income Smoothing Predictions"
                                    recoup={true}
                                    freshbooks={false}
                                    quickbooks={false}
                                    wave={false}
                                    highlight={true}
                                />
                                <ComparisonRow
                                    feature="AI Proposal Generation"
                                    recoup={true}
                                    freshbooks={false}
                                    quickbooks={false}
                                    wave={false}
                                    highlight={true}
                                />
                                <ComparisonRow
                                    feature="Scope Creep Detection"
                                    recoup={true}
                                    freshbooks={false}
                                    quickbooks={false}
                                    wave={false}
                                    highlight={true}
                                />
                                <ComparisonRow
                                    feature="Client Profitability Analysis"
                                    recoup={true}
                                    freshbooks="Basic"
                                    quickbooks="Basic"
                                    wave={false}
                                    highlight={true}
                                />
                                <ComparisonRow
                                    feature="SMS/Voice Reminders"
                                    recoup={true}
                                    freshbooks={false}
                                    quickbooks={false}
                                    wave={false}
                                />
                                <ComparisonRow
                                    feature="Late Payment Interest Calculator"
                                    recoup={true}
                                    freshbooks={false}
                                    quickbooks={false}
                                    wave={false}
                                />
                                <ComparisonRow
                                    feature="Free Tier"
                                    recoup="5 clients"
                                    freshbooks={false}
                                    quickbooks="30-day trial"
                                    wave="Limited"
                                />
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-4">
                            <TrendingUp className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Annual Savings Comparison</h3>
                                <p className="text-gray-700">
                                    <strong>Recoup Professional:</strong> £19/mo × 12 = <strong>£228/year</strong><br />
                                    <strong>FreshBooks Plus:</strong> £33/mo × 12 = <strong>£396/year</strong><br />
                                    <strong>Your Savings:</strong> <span className="text-green-600 font-bold">£168/year (42% cheaper)</span>
                                </p>
                                <p className="text-sm text-gray-600 mt-2">
                                    * Wave charges 2.9% + 30p per invoice payment. For £30k revenue = £900/year in fees.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Unique Features */}
            <section id="features" className="container mx-auto px-4 py-20">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Features Competitors Don't Have
                        </h2>
                        <p className="text-xl text-gray-600">
                            Built specifically for UK freelancers earning £30k-60k/year
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <FeatureCard
                            icon={<Shield className="h-10 w-10 text-blue-600" />}
                            title="IR35 Compliance Made Easy"
                            description="Automatic IR35 status assessments for every client engagement. Generate compliant Status Determination Statements (SDS) in seconds. Stay on the right side of HMRC without hiring an accountant."
                            benefit="Save £1,200/year on accountant fees"
                        />

                        <FeatureCard
                            icon={<LineChart className="h-10 w-10 text-green-600" />}
                            title="Income Smoothing Predictions"
                            description="AI predicts your irregular freelance income 3 months ahead. Plan personal expenses confidently. Know exactly when to chase payments or book new work."
                            benefit="Reduce financial anxiety by 80%"
                        />

                        <FeatureCard
                            icon={<Brain className="h-10 w-10 text-purple-600" />}
                            title="AI Payment Collections"
                            description="Polite, professional payment reminders via email, SMS, and voice calls. Escalates automatically based on invoice age. Get paid 2x faster without awkward conversations."
                            benefit="Reduce payment time from 42 to 18 days"
                        />

                        <FeatureCard
                            icon={<Zap className="h-10 w-10 text-yellow-600" />}
                            title="Scope Creep Detection"
                            description="AI monitors project communications and time logs. Automatically detects when clients request work outside the original scope. Suggests additional invoicing with one click."
                            benefit="Recover £3,600/year in unbilled work"
                        />

                        <FeatureCard
                            icon={<FileText className="h-10 w-10 text-indigo-600" />}
                            title="AI Proposal Generation"
                            description="Generate professional proposals in 2 minutes using AI trained on winning bids. Include scope, timeline, pricing, and terms. Increase win rate by 35%."
                            benefit="Save 5 hours per proposal"
                        />

                        <FeatureCard
                            icon={<Users className="h-10 w-10 text-red-600" />}
                            title="Client Profitability Analysis"
                            description="See exactly which clients are profitable after factoring in time, admin costs, payment delays, and scope creep. Make data-driven decisions about which clients to keep."
                            benefit="Increase hourly rate by 25%"
                        />
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="container mx-auto px-4 py-20 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Simple, Transparent Pricing
                        </h2>
                        <p className="text-xl text-gray-600">
                            Start free, upgrade when you grow
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <PricingCard
                            name="Free"
                            price="£0"
                            period="forever"
                            description="Perfect for getting started"
                            features={[
                                "5 clients",
                                "20 invoices/month",
                                "Basic expense tracking",
                                "Email support",
                                "UK VAT calculations",
                                "Payment tracking"
                            ]}
                            cta="Start Free"
                            ctaLink="/sign-up"
                        />

                        <PricingCard
                            name="Starter"
                            price="£9"
                            period="/month"
                            description="For growing freelancers"
                            features={[
                                "15 clients",
                                "Unlimited invoices",
                                "SMS payment reminders",
                                "Recurring invoices",
                                "Time tracking",
                                "Basic reports",
                                "Priority email support"
                            ]}
                            cta="Start Free Trial"
                            ctaLink="/sign-up"
                            popular={false}
                            annualPrice="£90/year (save 17%)"
                        />

                        <PricingCard
                            name="Professional"
                            price="£19"
                            period="/month"
                            description="For established freelancers"
                            features={[
                                "Unlimited clients",
                                "Unlimited invoices",
                                "AI payment collections",
                                "AI proposal generation",
                                "Scope creep detection",
                                "Income smoothing",
                                "IR35 assessments",
                                "Client profitability",
                                "Voice call reminders",
                                "Advanced analytics",
                                "Priority support"
                            ]}
                            cta="Start Free Trial"
                            ctaLink="/sign-up"
                            popular={true}
                            annualPrice="£190/year (save 17%)"
                        />
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-gray-600">
                            All plans include: UK VAT compliance • Stripe payments • Email sending • Mobile app
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            3% commission on invoice payments (covers Stripe fees + platform fee)
                        </p>
                    </div>
                </div>
            </section>

            {/* Savings Calculator */}
            <section className="container mx-auto px-4 py-20">
                <div className="max-w-4xl mx-auto">
                    <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white border-0">
                        <CardHeader className="text-center">
                            <CardTitle className="text-3xl text-white">
                                Calculate Your Annual Savings
                            </CardTitle>
                            <CardDescription className="text-blue-100 text-lg">
                                See how much Recoup can save you compared to competitors
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                                    <h3 className="font-semibold mb-4 text-xl">FreshBooks Plus</h3>
                                    <div className="space-y-2 text-blue-100">
                                        <p>Monthly fee: <strong className="text-white">£33/mo</strong></p>
                                        <p>Annual cost: <strong className="text-white">£396</strong></p>
                                        <p>Payment processing: <strong className="text-white">2.9% + 30p</strong></p>
                                        <p className="text-sm pt-2 border-t border-white/20">
                                            For £40k revenue: <strong className="text-white">£1,556/year total</strong>
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg p-6 text-gray-900">
                                    <h3 className="font-semibold mb-4 text-xl text-blue-600">
                                        Recoup Professional
                                    </h3>
                                    <div className="space-y-2">
                                        <p>Monthly fee: <strong>£19/mo</strong></p>
                                        <p>Annual cost: <strong>£228</strong></p>
                                        <p>Payment processing: <strong>3% flat</strong></p>
                                        <p className="text-sm pt-2 border-t border-gray-200">
                                            For £40k revenue: <strong className="text-green-600">£1,428/year total</strong>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 text-center">
                                <div className="inline-block bg-white rounded-lg px-8 py-4">
                                    <p className="text-gray-600 mb-1">Your Annual Savings</p>
                                    <p className="text-4xl font-bold text-green-600">£128/year</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Plus faster payments = improved cash flow
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Social Proof */}
            <section className="container mx-auto px-4 py-20 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Trusted by UK Freelancers
                        </h2>
                        <p className="text-xl text-gray-600">
                            Join hundreds of freelancers getting paid faster
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <TestimonialCard
                            quote="Recoup cut my payment time from 45 days to 15 days. The AI follow-ups are professional and actually work. Worth every penny."
                            author="Sarah M."
                            role="Graphic Designer, Manchester"
                            metric="67% faster payments"
                        />

                        <TestimonialCard
                            quote="IR35 compliance was stressing me out. Recoup's automated assessments saved me £1,200 in accountant fees and gave me peace of mind."
                            author="James P."
                            role="Software Developer, London"
                            metric="£1,200 saved"
                        />

                        <TestimonialCard
                            quote="The scope creep detection is brilliant. It caught 3 instances where I would've done free work. Paid for itself in the first month."
                            author="Emma R."
                            role="Content Writer, Bristol"
                            metric="£800 recovered"
                        />
                    </div>

                    <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <StatCard number="42%" label="Average cost savings" />
                        <StatCard number="18 days" label="Average payment time" />
                        <StatCard number="99.2%" label="Invoice success rate" />
                        <StatCard number="500+" label="UK freelancers" />
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="container mx-auto px-4 py-20">
                <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
                    <h2 className="text-4xl font-bold mb-4">
                        Ready to Get Paid Faster?
                    </h2>
                    <p className="text-xl mb-8 text-blue-100">
                        Join hundreds of UK freelancers who've already improved their cash flow
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/sign-up">
                            <Button size="lg" variant="secondary" className="text-lg px-8 py-6 h-auto">
                                Start Free Trial
                                <ChevronRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                    <p className="text-sm text-blue-100 mt-6">
                        No credit card required • Free tier available forever • Cancel anytime
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t bg-gray-50 mt-20">
                <div className="container mx-auto px-4 py-12">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <PoundSterling className="h-6 w-6 text-blue-600" />
                                <span className="text-xl font-bold">Recoup</span>
                            </div>
                            <p className="text-gray-600 text-sm">
                                Invoicing and payment tracking designed for UK freelancers.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-4">Product</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li><Link href="#features" className="hover:text-gray-900">Features</Link></li>
                                <li><Link href="#pricing" className="hover:text-gray-900">Pricing</Link></li>
                                <li><Link href="#comparison" className="hover:text-gray-900">Comparison</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-4">Legal</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li><Link href="/privacy" className="hover:text-gray-900">Privacy Policy</Link></li>
                                <li><Link href="/terms" className="hover:text-gray-900">Terms of Service</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-4">Support</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li><a href="mailto:support@recoup.app" className="hover:text-gray-900">support@recoup.app</a></li>
                                <li><a href="mailto:legal@recoup.app" className="hover:text-gray-900">legal@recoup.app</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t text-center text-sm text-gray-500">
                        <p>&copy; {new Date().getFullYear()} Recoup. All rights reserved. Made in the UK 🇬🇧</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// Helper Components

function ComparisonRow({
    feature,
    recoup,
    freshbooks,
    quickbooks,
    wave,
    highlight = false
}: {
    feature: string;
    recoup: boolean | string;
    freshbooks: boolean | string;
    quickbooks: boolean | string;
    wave: boolean | string;
    highlight?: boolean;
}) {
    return (
        <tr className={`border-b ${highlight ? 'bg-blue-50' : ''}`}>
            <td className={`p-4 ${highlight ? 'font-semibold' : ''}`}>
                {feature}
                {highlight && <Badge className="ml-2 bg-blue-100 text-blue-700 text-xs">Unique</Badge>}
            </td>
            <td className="p-4 text-center">
                <CellValue value={recoup} isRecoup={true} />
            </td>
            <td className="p-4 text-center">
                <CellValue value={freshbooks} />
            </td>
            <td className="p-4 text-center">
                <CellValue value={quickbooks} />
            </td>
            <td className="p-4 text-center">
                <CellValue value={wave} />
            </td>
        </tr>
    );
}

function CellValue({ value, isRecoup = false }: { value: boolean | string; isRecoup?: boolean }) {
    if (typeof value === 'boolean') {
        return value ? (
            <CheckCircle2 className={`h-6 w-6 mx-auto ${isRecoup ? 'text-green-600' : 'text-green-500'}`} />
        ) : (
            <XCircle className="h-6 w-6 text-gray-300 mx-auto" />
        );
    }
    return <span className="text-sm text-gray-700">{value}</span>;
}

function FeatureCard({
    icon,
    title,
    description,
    benefit
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    benefit: string;
}) {
    return (
        <Card>
            <CardHeader>
                {icon}
                <CardTitle className="text-xl">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-gray-600 mb-4">{description}</p>
                <div className="flex items-start gap-2 bg-green-50 p-3 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-700 font-medium">{benefit}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function PricingCard({
    name,
    price,
    period,
    description,
    features,
    cta,
    ctaLink,
    popular = false,
    annualPrice
}: {
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    cta: string;
    ctaLink: string;
    popular?: boolean;
    annualPrice?: string;
}) {
    return (
        <Card className={popular ? 'border-blue-600 border-2 shadow-xl' : ''}>
            {popular && (
                <div className="bg-blue-600 text-white text-center py-2 text-sm font-semibold rounded-t-xl -mt-6 -mx-px">
                    Most Popular
                </div>
            )}
            <CardHeader>
                <CardTitle className="text-2xl">{name}</CardTitle>
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">{price}</span>
                    <span className="text-gray-500">{period}</span>
                </div>
                {annualPrice && (
                    <p className="text-sm text-green-600 font-medium">{annualPrice}</p>
                )}
                <CardDescription className="text-base">{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <Link href={ctaLink}>
                    <Button className="w-full mb-6" variant={popular ? 'default' : 'outline'}>
                        {cta}
                    </Button>
                </Link>
                <ul className="space-y-3">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}

function TestimonialCard({
    quote,
    author,
    role,
    metric
}: {
    quote: string;
    author: string;
    role: string;
    metric: string;
}) {
    return (
        <Card>
            <CardContent className="pt-6">
                <p className="text-gray-700 italic mb-4">"{quote}"</p>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-semibold text-gray-900">{author}</p>
                        <p className="text-sm text-gray-500">{role}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700">{metric}</Badge>
                </div>
            </CardContent>
        </Card>
    );
}

function StatCard({ number, label }: { number: string; label: string }) {
    return (
        <div>
            <p className="text-3xl font-bold text-blue-600 mb-1">{number}</p>
            <p className="text-sm text-gray-600">{label}</p>
        </div>
    );
}
