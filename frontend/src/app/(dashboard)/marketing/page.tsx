'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const { data } = await api.get('/marketing/campaigns/');
        setCampaigns(data.results || data);
      } catch (error) {
        console.error('Failed to fetch marketing campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  if (loading) {
    return <div>Loading marketing campaigns...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Marketing</h1>
      <div className="grid gap-4">
        {campaigns.length > 0 ? (
          campaigns.map((campaign: any) => (
            <div key={campaign.id} className="p-4 border rounded-lg">
              <h2 className="text-xl font-semibold">{campaign.name}</h2>
              <p className="text-gray-600">{campaign.description}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No marketing campaigns found</p>
        )}
      </div>
    </div>
  );
}
