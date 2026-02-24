'use client';

import { useEffect, useState } from 'react';

export default function ContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await fetch('/api/contracts/contracts/');
        if (response.ok) {
          const data = await response.json();
          setContracts(data.results || data);
        }
      } catch (error) {
        console.error('Failed to fetch contracts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, []);

  if (loading) {
    return <div>Loading contracts...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Contracts</h1>
      <div className="grid gap-4">
        {contracts.length > 0 ? (
          contracts.map((contract: any) => (
            <div key={contract.id} className="p-4 border rounded-lg">
              <h2 className="text-xl font-semibold">{contract.title}</h2>
              <p className="text-gray-600">Status: {contract.status}</p>
              <p className="text-sm text-gray-500">Value: ${contract.contract_value}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No contracts found</p>
        )}
      </div>
    </div>
  );
}
