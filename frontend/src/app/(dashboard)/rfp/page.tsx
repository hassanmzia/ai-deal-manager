'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function RFPPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const { data } = await api.get('/rfp/documents/');
        setDocuments(data.results || data);
      } catch (error) {
        console.error('Failed to fetch RFP documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  if (loading) {
    return <div>Loading RFP documents...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">RFP Documents</h1>
      <div className="grid gap-4">
        {documents.length > 0 ? (
          documents.map((doc: any) => (
            <div key={doc.id} className="p-4 border rounded-lg">
              <h2 className="text-xl font-semibold">{doc.title}</h2>
              <p className="text-gray-600">Type: {doc.document_type}</p>
              <p className="text-sm text-gray-500">Status: {doc.extraction_status}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No RFP documents found</p>
        )}
      </div>
    </div>
  );
}
