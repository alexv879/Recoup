/**
 * FCA Compliance Monitoring Dashboard
 * Real-time compliance tracking for UK debt collection
 *
 * Features:
 * - Call monitoring (hours, frequency, recording)
 * - Vulnerability detection
 * - Communication audit log
 * - TCF (Treating Customers Fairly) compliance
 * - Violation alerts
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Shield, Phone, Mail, MessageSquare, Users } from 'lucide-react';

export default function ComplianceDashboard() {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');

  // Mock data - replace with real API calls
  const complianceScore: number = 94;
  const todayCalls: number = 12;
  const todayEmails: number = 45;
  const todaySMS: number = 8;
  const vulnerableCustomers: number = 3;
  const violations: number = 1;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FCA Compliance</h1>
          <p className="text-muted-foreground">
            Debt collection compliance monitoring & audit trail
          </p>
        </div>
        <Badge variant={complianceScore >= 90 ? 'default' : 'destructive'} className="text-lg px-4 py-2">
          <Shield className="mr-2 h-5 w-5" />
          {complianceScore}% Compliant
        </Badge>
      </div>

      {/* Compliance Score Card */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Compliance Score</CardTitle>
          <CardDescription>Based on FCA CONC rules and TCF principles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Compliance Rating</span>
                <span className="text-2xl font-bold">{complianceScore}%</span>
              </div>
              <Progress value={complianceScore} className="h-3" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Call Timing</p>
                <p className="text-2xl font-bold text-green-600">100%</p>
                <p className="text-xs text-muted-foreground">8am-9pm, Mon-Sat only</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Recording Rate</p>
                <p className="text-2xl font-bold text-green-600">100%</p>
                <p className="text-xs text-muted-foreground">All calls recorded</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Vulnerability Detection</p>
                <p className="text-2xl font-bold text-green-600">98%</p>
                <p className="text-xs text-muted-foreground">AI-powered identification</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Opt-Out Respect</p>
                <p className="text-2xl font-bold text-green-600">100%</p>
                <p className="text-xs text-muted-foreground">All requests honored</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Violations Alert */}
      {violations > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{violations} compliance violation{violations !== 1 ? 's' : ''} detected</strong> - Requires immediate attention
            <Button variant="destructive" size="sm" className="ml-4">
              Review Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Communication Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calls Today</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCalls}</div>
            <p className="text-xs text-muted-foreground">
              Max 50/day per FCA guidelines
            </p>
            <Progress value={(todayCalls / 50) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Today</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayEmails}</div>
            <p className="text-xs text-muted-foreground">
              Within frequency limits
            </p>
            <Progress value={(todayEmails / 100) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMS Today</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySMS}</div>
            <p className="text-xs text-muted-foreground">
              Max 20/day recommended
            </p>
            <Progress value={(todaySMS / 20) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vulnerable Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{vulnerableCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Requiring special treatment
            </p>
            <Button variant="outline" size="sm" className="mt-2 w-full">
              View Cases
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="vulnerable">Vulnerable Customers</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="recordings">Recordings</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Communication Audit Trail</CardTitle>
              <CardDescription>Complete history of all customer communications</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">14:32</TableCell>
                    <TableCell>John Doe</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <Phone className="mr-1 h-3 w-3" />
                        Voice Call
                      </Badge>
                    </TableCell>
                    <TableCell>INV-1234</TableCell>
                    <TableCell>3m 45s</TableCell>
                    <TableCell>Promise to Pay</TableCell>
                    <TableCell>
                      <Badge variant="default">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Compliant
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">13:15</TableCell>
                    <TableCell>Jane Smith</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <Mail className="mr-1 h-3 w-3" />
                        Email
                      </Badge>
                    </TableCell>
                    <TableCell>INV-1235</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>Delivered</TableCell>
                    <TableCell>
                      <Badge variant="default">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Compliant
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">11:48</TableCell>
                    <TableCell>Bob Wilson</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <MessageSquare className="mr-1 h-3 w-3" />
                        SMS
                      </Badge>
                    </TableCell>
                    <TableCell>INV-1236</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>Delivered</TableCell>
                    <TableCell>
                      <Badge variant="default">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Compliant
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vulnerable" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vulnerable Customer Cases</CardTitle>
              <CardDescription>Customers requiring special treatment per TCF principles</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vulnerability Type</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead>Collections Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Sarah Johnson</TableCell>
                    <TableCell>
                      <Badge variant="destructive">Mental Health</Badge>
                    </TableCell>
                    <TableCell>2 days ago</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Paused</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">View Case</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Michael Brown</TableCell>
                    <TableCell>
                      <Badge variant="destructive">Recent Bereavement</Badge>
                    </TableCell>
                    <TableCell>5 days ago</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Paused</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">View Case</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Emma Davis</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Financial Difficulty</Badge>
                    </TableCell>
                    <TableCell>1 week ago</TableCell>
                    <TableCell>
                      <Badge variant="outline">Payment Plan</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">View Case</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Violations</CardTitle>
              <CardDescription>Issues requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              {violations === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Violations Detected</h3>
                  <p className="text-muted-foreground">
                    All communications are FCA compliant
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Issue</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">10:45</TableCell>
                      <TableCell>Call Timing</TableCell>
                      <TableCell>Test Customer</TableCell>
                      <TableCell>Call attempted at 7:55am (before allowed hours)</TableCell>
                      <TableCell>
                        <Badge variant="destructive">High</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Investigating</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recordings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Call Recordings</CardTitle>
              <CardDescription>All calls recorded for compliance and training</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    All recordings retained for 6 years per FCA requirements. Recordings are encrypted and access is logged.
                  </AlertDescription>
                </Alert>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Transcript</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">2025-11-18 14:32</TableCell>
                      <TableCell>John Doe</TableCell>
                      <TableCell>3m 45s</TableCell>
                      <TableCell>
                        <Badge variant="outline">Available</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">Play</Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
