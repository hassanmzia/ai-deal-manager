'use client';

import { useEffect, useState } from 'react';

export default function StrategyPage() {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        const response = await fetch('/api/strategy/strategies/');
        if (response.ok) {
          const data = await response.json();
          setStrategies(data.results || data);
        }
      } catch (error) {
        console.error('Failed to fetch strategies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStrategies();
  }, []);

  if (loading) {
    return <div>Loading strategies...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Company Strategy</h1>
      <div className="grid gap-4">
        {strategies.length > 0 ? (
          strategies.map((strategy: any) => (
            <div key={strategy.id} className="p-4 border rounded-lg">
              <h2 className="text-xl font-semibold">Version {strategy.version}</h2>
              <p className="text-gray-600">Status: {strategy.is_active ? 'Active' : 'Inactive'}</p>
              <p className="text-sm text-gray-500">Target Win Rate: {strategy.target_win_rate}%</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No strategies found</p>
        )}
      </div>
    </div>
  );
}
