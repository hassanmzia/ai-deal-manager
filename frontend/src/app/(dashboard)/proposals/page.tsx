'use client';

import { useEffect, useState } from 'react';

export default function ProposalsPage() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const response = await fetch('/api/proposals/proposals/');
        if (response.ok) {
          const data = await response.json();
          setProposals(data.results || data);
        }
      } catch (error) {
        console.error('Failed to fetch proposals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, []);

  if (loading) {
    return <div>Loading proposals...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Proposals</h1>
      <div className="grid gap-4">
        {proposals.length > 0 ? (
          proposals.map((proposal: any) => (
            <div key={proposal.id} className="p-4 border rounded-lg">
              <h2 className="text-xl font-semibold">{proposal.title}</h2>
              <p className="text-gray-600">Status: {proposal.status}</p>
              <p className="text-sm text-gray-500">Compliance: {proposal.compliance_percentage}%</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No proposals found</p>
        )}
      </div>
    </div>
  );
}
