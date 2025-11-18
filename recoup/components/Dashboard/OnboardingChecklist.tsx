'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/UI/Button';

interface OnboardingTask {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    estimatedTime: string;
    actionUrl: string;
}

interface OnboardingChecklistProps {
    userId: string;
    onComplete?: () => void;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({ userId, onComplete }) => {
    const [tasks, setTasks] = useState<OnboardingTask[]>([
        {
            id: 'business',
            title: 'Add your business',
            description: 'Set up company name, logo, and address',
            completed: false,
            estimatedTime: '2 min',
            actionUrl: '/dashboard/settings'
        },
        {
            id: 'client',
            title: 'Invite your first client',
            description: 'Add a client so you can send them invoices',
            completed: false,
            estimatedTime: '3 min',
            actionUrl: '/dashboard/clients/new'
        },
        {
            id: 'invoice',
            title: 'Create your first invoice',
            description: 'Send your first invoice and get paid faster',
            completed: false,
            estimatedTime: '5 min',
            actionUrl: '/dashboard/invoices/new'
        }
    ]);

    const [collapsed, setCollapsed] = useState(false);
    const [hidden, setHidden] = useState(false);

    const completionRate = (tasks.filter(t => t.completed).length / tasks.length) * 100;

    // Load saved state from localStorage
    useEffect(() => {
        const savedState = localStorage.getItem(`onboarding_${userId}`);
        if (savedState) {
            const parsed = JSON.parse(savedState);
            setTasks(parsed.tasks || tasks);
            setCollapsed(parsed.collapsed || false);
        }

        // Check if should be hidden (completed or expired)
        const hiddenState = localStorage.getItem(`onboarding_${userId}_hidden`);
        const startTime = localStorage.getItem(`onboarding_${userId}_start`);

        if (hiddenState === 'true') {
            setHidden(true);
        } else if (!startTime) {
            // First time - set start time
            localStorage.setItem(`onboarding_${userId}_start`, Date.now().toString());
        } else {
            // Check if 7 days have passed
            const daysPassed = (Date.now() - parseInt(startTime)) / (1000 * 60 * 60 * 24);
            if (daysPassed > 7) {
                setHidden(true);
                localStorage.setItem(`onboarding_${userId}_hidden`, 'true');
            }
        }
    }, [userId]);

    // Save state to localStorage
    useEffect(() => {
        if (userId) {
            localStorage.setItem(`onboarding_${userId}`, JSON.stringify({ tasks, collapsed }));
        }
    }, [tasks, collapsed, userId]);

    // Auto-hide after 50% completion or when all complete
    useEffect(() => {
        if (completionRate >= 50 && completionRate < 100) {
            // Auto-hide after 50% - optional behavior
            // Commented out to keep visible until 100%
        }

        if (completionRate === 100) {
            // All complete - trigger celebration
            onComplete?.();

            // Hide after 2 seconds
            setTimeout(() => {
                setHidden(true);
                localStorage.setItem(`onboarding_${userId}_hidden`, 'true');
            }, 2000);
        }
    }, [completionRate, userId, onComplete]);

    const toggleTask = (taskId: string) => {
        const updatedTasks = tasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        setTasks(updatedTasks);

        // Track completion event
        if (updatedTasks.find(t => t.id === taskId)?.completed) {
            // Analytics tracking would go here
            console.log(`Onboarding task completed: ${taskId}`);
        }
    };

    if (hidden) {
        return null;
    }

    return (
        <div
            className={`fixed top-5 right-5 w-80 bg-white rounded-lg shadow-lg z-50 overflow-hidden transition-all duration-300 ${collapsed ? 'h-auto' : ''
                }`}
            style={{ maxWidth: 'calc(100vw - 40px)' }}
        >
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Get started in 3 steps</h3>
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="bg-white/20 hover:bg-white/30 transition-colors w-6 h-6 rounded flex items-center justify-center text-xs"
                        aria-label="Toggle checklist"
                    >
                        {collapsed ? '▼' : '▲'}
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-white/30 rounded-full overflow-hidden mb-2">
                    <div
                        className="h-full bg-white rounded-full transition-all duration-300"
                        style={{ width: `${completionRate}%` }}
                        role="progressbar"
                        aria-valuenow={completionRate}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    />
                </div>
                <p className="text-xs opacity-90">{Math.round(completionRate)}% complete</p>
            </div>

            {/* Tasks */}
            {!collapsed && (
                <div className="p-3 max-h-96 overflow-y-auto">
                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            className={`flex gap-3 p-3 mb-2 bg-gray-50 rounded-md border border-gray-200 transition-all ${task.completed ? 'opacity-60 bg-gray-100' : 'hover:shadow-sm'
                                }`}
                        >
                            {/* Checkbox */}
                            <input
                                type="checkbox"
                                id={`task-${task.id}`}
                                checked={task.completed}
                                onChange={() => toggleTask(task.id)}
                                className="w-5 h-5 mt-0.5 flex-shrink-0 cursor-pointer accent-blue-500"
                                aria-label={`Complete ${task.title}`}
                            />

                            {/* Task Content */}
                            <div className="flex-1 min-w-0">
                                <label
                                    htmlFor={`task-${task.id}`}
                                    className="block text-sm font-semibold text-gray-900 cursor-pointer mb-1"
                                >
                                    {task.title}
                                </label>
                                <p className="text-xs text-gray-600 leading-snug mb-2">{task.description}</p>

                                {/* Meta */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">{task.estimatedTime}</span>
                                    {!task.completed ? (
                                        <Link href={task.actionUrl}>
                                            <Button size="sm" className="text-xs py-1 px-2 h-auto">
                                                Start →
                                            </Button>
                                        </Link>
                                    ) : (
                                        <span className="text-green-600 font-semibold text-sm">✓</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
