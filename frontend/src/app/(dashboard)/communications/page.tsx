'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function CommunicationsPage() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const { data } = await api.get('/communications/threads/');
        setThreads(data.results || data);
      } catch (error) {
        console.error('Failed to fetch communications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, []);

  if (loading) {
    return <div>Loading communications...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Communications</h1>
      <div className="grid gap-4">
        {threads.length > 0 ? (
          threads.map((thread: any) => (
            <div key={thread.id} className="p-4 border rounded-lg">
              <h2 className="text-xl font-semibold">{thread.subject || 'No subject'}</h2>
              <p className="text-gray-600">{thread.thread_type}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No communications found</p>
        )}
      </div>
    </div>
  );
}
