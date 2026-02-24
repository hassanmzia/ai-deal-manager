'use client';

import { useEffect, useState } from 'react';

export default function ResearchPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/research/projects/');
        if (response.ok) {
          const data = await response.json();
          setProjects(data.results || data);
        }
      } catch (error) {
        console.error('Failed to fetch research projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return <div>Loading research projects...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Research</h1>
      <div className="grid gap-4">
        {projects.length > 0 ? (
          projects.map((project: any) => (
            <div key={project.id} className="p-4 border rounded-lg">
              <h2 className="text-xl font-semibold">{project.title}</h2>
              <p className="text-gray-600">Type: {project.research_type}</p>
              <p className="text-sm text-gray-500">Status: {project.status}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No research projects found</p>
        )}
      </div>
    </div>
  );
}
