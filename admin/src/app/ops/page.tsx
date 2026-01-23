'use client';

import { useState } from 'react';
import { useSettingsStore, API_BASE_URL } from '../../store/settings';
import { apiFetch } from '../../lib/api';
import { useRequireAuth } from '../../lib/useRequireAuth';

type JobResult = {
    name: string;
    status: 'idle' | 'running' | 'success' | 'error';
    message?: string;
    lastRun?: string;
};

const jobs = [
    {
        id: 'timeout',
        name: 'Therapist Timeout',
        description: 'Cancel bookings dimana terapis tidak merespon dalam batas waktu',
        endpoint: '/bookings/timeout/run',
        icon: '⏱️',
    },
    {
        id: 'expire',
        name: 'Package Expiry',
        description: 'Set sesi PENDING_SCHEDULING → EXPIRED jika booking > 30 hari',
        endpoint: '/bookings/expire/run',
        icon: '📅',
    },
    {
        id: 'chatlock',
        name: 'Chat Lock',
        description: 'Kunci chat jika melewati chat_locked_at',
        endpoint: '/bookings/chat-lock/run',
        icon: '🔒',
    },
];

export default function OpsPage() {
    const { adminToken } = useSettingsStore();
    const [jobResults, setJobResults] = useState<Record<string, JobResult>>({});
    const { ready } = useRequireAuth();

    const runJob = async (jobId: string, endpoint: string, name: string) => {
        if (!API_BASE_URL || !adminToken) {
            setJobResults((prev) => ({
                ...prev,
                [jobId]: { name, status: 'error', message: 'API not configured' },
            }));
            return;
        }

        setJobResults((prev) => ({
            ...prev,
            [jobId]: { name, status: 'running' },
        }));

        try {
            const res = await apiFetch<{ message?: string; affected?: number }>(
                API_BASE_URL,
                endpoint,
                { method: 'POST', tokenOverride: adminToken }
            );

            setJobResults((prev) => ({
                ...prev,
                [jobId]: {
                    name,
                    status: 'success',
                    message: res.message || `Affected: ${res.affected ?? 0}`,
                    lastRun: new Date().toLocaleString('id-ID'),
                },
            }));
        } catch (err) {
            setJobResults((prev) => ({
                ...prev,
                [jobId]: {
                    name,
                    status: 'error',
                    message: (err as Error).message,
                    lastRun: new Date().toLocaleString('id-ID'),
                },
            }));
        }
    };

    if (!ready) return null;

    return (
        <>
            <header className="page-header">
                <h1>Operations</h1>
                <p>Manual trigger untuk background jobs dan maintenance tasks</p>
            </header>

            <div className="card-grid">
                {jobs.map((job) => {
                    const result = jobResults[job.id];
                    const isRunning = result?.status === 'running';

                    return (
                        <div key={job.id} className="card">
                            <div className="flex items-center gap-md mb-md">
                                <span style={{ fontSize: '2rem' }}>{job.icon}</span>
                                <div>
                                    <h3 className="card-title">{job.name}</h3>
                                    <p className="text-sm text-muted">{job.description}</p>
                                </div>
                            </div>

                            <button
                                className="btn btn-primary w-full"
                                onClick={() => runJob(job.id, job.endpoint, job.name)}
                                disabled={isRunning}
                            >
                                {isRunning ? 'Running...' : `▶ Run ${job.name}`}
                            </button>

                            {result && result.status !== 'idle' && (
                                <div className={`alert mt-md ${result.status === 'success' ? 'alert-success' : result.status === 'error' ? 'alert-error' : 'alert-info'}`}>
                                    <div className="flex justify-between items-center">
                                        <span>{result.message}</span>
                                        {result.lastRun && (
                                            <span className="text-xs">{result.lastRun}</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="card mt-lg">
                <div className="card-header">
                    <h3 className="card-title">ℹ️ Job Info</h3>
                </div>
                <div className="text-sm text-muted">
                    <p className="mb-sm">
                        Jobs ini otomatis berjalan via scheduler (BullMQ):
                    </p>
                    <ul style={{ marginLeft: '1.5rem' }}>
                        <li><strong>Timeout:</strong> setiap 5 menit</li>
                        <li><strong>Expire:</strong> harian jam 00:00</li>
                        <li><strong>Chat Lock:</strong> setiap 15 menit</li>
                    </ul>
                    <p className="mt-md">
                        Manual trigger di atas hanya untuk keperluan darurat atau testing.
                    </p>
                </div>
            </div>
        </>
    );
}
