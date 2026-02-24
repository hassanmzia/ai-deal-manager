'use client';

import { useEffect, useState } from 'react';

export default function LegalPage() {
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRisks = async () => {
      try {
        const response = await fetch('/api/legal/legal-risks/');
        if (response.ok) {
          const data = await response.json();
          setRisks(data.results || data);
        }
      } catch (error) {
        console.error('Failed to fetch legal risks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRisks();
  }, []);

  if (loading) {
    return <div>Loading legal information...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Legal & Risk</h1>
      <div className="grid gap-4">
        {risks.length > 0 ? (
          risks.map((risk: any) => (
            <div key={risk.id} className="p-4 border rounded-lg">
              <h2 className="text-xl font-semibold">{risk.title}</h2>
              <p className="text-gray-600">Severity: {risk.severity}</p>
              <p className="text-sm text-gray-500">{risk.description}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No legal risks found</p>
        )}
      </div>
    </div>
  );
}
