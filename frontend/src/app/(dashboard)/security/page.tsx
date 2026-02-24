'use client';

import { useEffect, useState } from 'react';

export default function SecurityPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('/api/security-compliance/reports/');
        if (response.ok) {
          const data = await response.json();
          setReports(data.results || data);
        }
      } catch (error) {
        console.error('Failed to fetch security reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) {
    return <div>Loading security compliance reports...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Security & Compliance</h1>
      <div className="grid gap-4">
        {reports.length > 0 ? (
          reports.map((report: any) => (
            <div key={report.id} className="p-4 border rounded-lg">
              <h2 className="text-xl font-semibold">{report.report_type}</h2>
              <p className="text-gray-600">Status: {report.status}</p>
              <p className="text-sm text-gray-500">Compliance: {report.overall_compliance_pct}%</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No security reports found</p>
        )}
      </div>
    </div>
  );
}
