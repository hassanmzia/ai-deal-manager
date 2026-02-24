'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function KnowledgeVaultPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const { data } = await api.get('/knowledge-vault/documents/');
        setDocuments(data.results || data);
      } catch (error) {
        console.error('Failed to fetch knowledge vault documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  if (loading) {
    return <div>Loading knowledge vault...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Knowledge Vault</h1>
      <div className="grid gap-4">
        {documents.length > 0 ? (
          documents.map((doc: any) => (
            <div key={doc.id} className="p-4 border rounded-lg">
              <h2 className="text-xl font-semibold">{doc.title}</h2>
              <p className="text-gray-600">Category: {doc.category}</p>
              <p className="text-sm text-gray-500">{doc.description}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No documents found</p>
        )}
      </div>
    </div>
  );
}
