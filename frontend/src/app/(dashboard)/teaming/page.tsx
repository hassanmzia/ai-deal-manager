'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function TeamingPage() {
  const [partnerships, setPartnerships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartnerships = async () => {
      try {
        const { data } = await api.get('/teaming/partnerships/');
        setPartnerships(data.results || data);
      } catch (error) {
        console.error('Failed to fetch partnerships:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartnerships();
  }, []);

  if (loading) {
    return <div>Loading partnerships...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Teaming</h1>
      <div className="grid gap-4">
        {partnerships.length > 0 ? (
          partnerships.map((partnership: any) => (
            <div key={partnership.id} className="p-4 border rounded-lg">
              <h2 className="text-xl font-semibold">{partnership.partner_name}</h2>
              <p className="text-gray-600">{partnership.role}</p>
              <p className="text-sm text-gray-500">{partnership.description}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No partnerships found</p>
        )}
      </div>
    </div>
  );
}
