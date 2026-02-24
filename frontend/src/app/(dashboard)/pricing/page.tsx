'use client';

import { useEffect, useState } from 'react';

export default function PricingPage() {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPricingScenarios = async () => {
      try {
        const response = await fetch('/api/pricing/scenarios/');
        if (response.ok) {
          const data = await response.json();
          setScenarios(data.results || data);
        }
      } catch (error) {
        console.error('Failed to fetch pricing scenarios:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPricingScenarios();
  }, []);

  if (loading) {
    return <div>Loading pricing...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Pricing</h1>
      <div className="grid gap-4">
        {scenarios.length > 0 ? (
          scenarios.map((scenario: any) => (
            <div key={scenario.id} className="p-4 border rounded-lg">
              <h2 className="text-xl font-semibold">{scenario.name}</h2>
              <p className="text-gray-600">Strategy: {scenario.strategy}</p>
              <p className="text-sm text-gray-500">Total Cost: ${scenario.total_cost}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No pricing scenarios found</p>
        )}
      </div>
    </div>
  );
}
