import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { Project } from '../types';
import { formatDate, formatCurrency } from '../utils/helpers';
import { useTranslation } from 'react-i18next';

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [project, setProject] = useState<Project | null>(null);
  const [tab, setTab] = useState<'overview' | 'budget' | 'milestones' | 'team' | 'equipment' | 'documents' | 'activity'>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    projectService.getProjectById(id)
      .then(setProject)
      .catch(e => setError(e.message || t('error')))
      .finally(() => setLoading(false));
  }, [id, t]);

  if (loading) return <div className="p-6">{t('loading')}</div>;
  if (!project) return <div className="p-6 text-red-600">{error || 'Project not found.'}</div>;

  return (
    <section className="w-full max-w-screen-xl mx-auto p-4">
      <div className="flex justify-between items-center mb-3">
        <h1 className="font-bold text-xl">{project.name}</h1>
        <span className="rounded px-2 py-1 text-xs font-bold bg-blue-100 text-blue-800">{project.status}</span>
      </div>
      <div className="flex gap-3 mb-4">
        <button className={tab === 'overview' ? 'font-bold border-b-2 border-teal-700' : ''} onClick={() => setTab('overview')}>Overview</button>
        <button className={tab === 'budget' ? 'font-bold border-b-2 border-teal-700' : ''} onClick={() => setTab('budget')}>Budget</button>
        <button className={tab === 'milestones' ? 'font-bold border-b-2 border-teal-700' : ''} onClick={() => setTab('milestones')}>Milestones</button>
        <button className={tab === 'team' ? 'font-bold border-b-2 border-teal-700' : ''} onClick={() => setTab('team')}>Team</button>
        <button className={tab === 'equipment' ? 'font-bold border-b-2 border-teal-700' : ''} onClick={() => setTab('equipment')}>Equipment</button>
        <button className={tab === 'documents' ? 'font-bold border-b-2 border-teal-700' : ''} onClick={() => setTab('documents')}>Documents</button>
        <button className={tab === 'activity' ? 'font-bold border-b-2 border-teal-700' : ''} onClick={() => setTab('activity')}>Activity</button>
      </div>
      {tab === 'overview' && (
        <div className="space-y-2">
          <div>Description: {project.description}</div>
          <div>Dates: {formatDate(project.startDate)} - {formatDate(project.endDate)}</div>
          <div>Budget: {formatCurrency(project.budget)}</div>
        </div>
      )}
      {tab === 'budget' && (
        <div>
          {/* Budget breakdown table goes here */}
        </div>
      )}
      {tab === 'milestones' && (
        <ul className="list-disc ml-6">
          {project.milestones.map(ms => <li key={ms.id}>{ms.name} ({ms.status})</li>)}
        </ul>
      )}
      {tab === 'team' && (
        <ul>
          {project.team.map(member => <li key={member.id}>{member.name} ({member.roles.join(', ')})</li>)}
        </ul>
      )}
      {tab === 'equipment' && <div>Allocated equipment goes here.</div>}
      {tab === 'documents' && <div>Project documents and attachments go here.</div>}
      {tab === 'activity' && <div>Recent activities and changes go here.</div>}
    </section>
  );
};

export default React.memo(ProjectDetailPage);
