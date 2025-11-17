'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';

interface Notification {
    notificationId: string;
    type: 'invoice_drought' | 'payment_delay' | 'opportunity' | 'system';
    title: string;
    message: string;
    actionText?: string;
    actionUrl?: string;
    isRead: boolean;
    createdAt: { _seconds: number };
}

/**
 * Notifications Page
 * Shows all user notifications with read/unread status
 */
export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/notifications');
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'POST',
            });

            if (response.ok) {
                setNotifications(prev =>
                    prev.map(n =>
                        n.notificationId === notificationId ? { ...n, isRead: true } : n
                    )
                );
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const response = await fetch('/api/notifications', {
                method: 'PUT',
            });

            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getNotificationIcon = (type: string) => {
        const icons: Record<string, string> = {
            invoice_drought: '📄',
            payment_delay: '⏰',
            opportunity: '💡',
            system: '🔔',
        };
        return icons[type] || '🔔';
    };

    const getNotificationColor = (type: string) => {
        const colors: Record<string, string> = {
            invoice_drought: 'bg-blue-50',
            payment_delay: 'bg-orange-50',
            opportunity: 'bg-green-50',
            system: 'bg-gray-50',
        };
        return colors[type] || 'bg-gray-50';
    };

    const formatDate = (timestamp: { _seconds: number }) => {
        const date = new Date(timestamp._seconds * 1000);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-GB');
    };

    const filteredNotifications = notifications.filter(
        n => filter === 'all' || !n.isRead
    );

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                                {unreadCount > 0 && (
                                    <Badge variant="destructive">{unreadCount} unread</Badge>
                                )}
                            </div>
                            <p className="text-gray-600 mt-1">Stay updated with your business activities</p>
                        </div>
                        {unreadCount > 0 && (
                            <Button variant="outline" onClick={markAllAsRead}>
                                Mark All as Read
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    {/* Filters */}
                    <Card className="p-4 mb-6">
                        <div className="flex gap-2">
                            <Button
                                variant={filter === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('all')}
                            >
                                All
                            </Button>
                            <Button
                                variant={filter === 'unread' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('unread')}
                            >
                                Unread ({unreadCount})
                            </Button>
                        </div>
                    </Card>

                    {/* Notifications List */}
                    {loading ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Loading notifications...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <Card className="p-12 text-center">
                            <div className="text-6xl mb-4">🔔</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No notifications</h3>
                            <p className="text-gray-600">
                                {filter === 'unread'
                                    ? 'All caught up! No unread notifications'
                                    : 'You don't have any notifications yet'}
                            </p>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {filteredNotifications.map((notification) => (
                                <Card
                                    key={notification.notificationId}
                                    className={`p-6 cursor-pointer transition-all ${!notification.isRead ? 'border-l-4 border-l-blue-500' : ''
                                        } ${getNotificationColor(notification.type)}`}
                                    onClick={() => !notification.isRead && markAsRead(notification.notificationId)}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="text-3xl">{getNotificationIcon(notification.type)}</div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900 mb-1">
                                                        {notification.title}
                                                    </h3>
                                                    <p className="text-gray-700">{notification.message}</p>
                                                </div>
                                                {!notification.isRead && (
                                                    <Badge variant="default" className="ml-2">New</Badge>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between mt-4">
                                                <p className="text-sm text-gray-500">
                                                    {formatDate(notification.createdAt)}
                                                </p>
                                                {notification.actionUrl && notification.actionText && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.location.href = notification.actionUrl!;
                                                        }}
                                                    >
                                                        {notification.actionText}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
