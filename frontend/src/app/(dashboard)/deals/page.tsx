'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function DealsPage() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const { data } = await api.get('/deals/deals/');
        setDeals(data.results || data);
      } catch (error) {
        console.error('Failed to fetch deals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  if (loading) {
    return <div>Loading deals...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Deals</h1>
      <div className="grid gap-4">
        {deals.length > 0 ? (
          deals.map((deal: any) => (
            <div key={deal.id} className="p-4 border rounded-lg">
              <h2 className="text-xl font-semibold">{deal.title}</h2>
              <p className="text-gray-600">{deal.description}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No deals found</p>
        )}
      </div>
    </div>
  );
}
