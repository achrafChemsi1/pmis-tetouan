import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import ProjectCard from '../components/Cards/ProjectCard';
import BudgetChart from '../components/Charts/BudgetChart';
import { useTranslation } from 'react-i18next';

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { list: projects, loading } = useSelector((state: RootState) => state.projects);
  const metrics = {
    total: projects.length,
    active: projects.filter(p => p.status === 'ACTIVE').length,
    completed: projects.filter(p => p.status === 'COMPLETED').length,
    onTime: Math.round(100 * (projects.filter(p => p.progress >= 100).length || 0) / (projects.length || 1)),
    budget: projects.reduce((sum, p) => sum + p.budget, 0),
    spent: projects.reduce((sum, p) => sum + p.spent, 0),
  };
  return (
    <section className="w-full max-w-screen-xl mx-auto p-4">
      <h1 className="font-bold text-2xl mb-4">{t('dashboard')}</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded shadow text-center p-4">
          <span className="block text-xs text-gray-500">Total Projects</span>
          <span className="font-bold text-2xl text-teal-700">{metrics.total}</span>
        </div>
        <div className="bg-white rounded shadow text-center p-4">
          <span className="block text-xs text-gray-500">Active Projects</span>
          <span className="font-bold text-2xl text-green-600">{metrics.active}</span>
        </div>
        <div className="bg-white rounded shadow text-center p-4">
          <span className="block text-xs text-gray-500">On-Time %</span>
          <span className="font-bold text-2xl text-blue-700">{metrics.onTime}%</span>
        </div>
        <div className="bg-white rounded shadow text-center p-4">
          <span className="block text-xs text-gray-500">Budget Spent</span>
          <span className="font-bold text-2xl text-orange-700">{metrics.spent.toLocaleString()}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
        <BudgetChart 
          categories={projects.map(p => ({ name: p.name, value: p.budget }))}
          allocation={metrics.budget}
          spent={metrics.spent}
        />
        <div className="bg-white rounded shadow p-4 flex flex-col">
          <h2 className="text-gray-700 font-bold text-lg mb-2">Recent Projects</h2>
          <div className="grid gap-3 overflow-y-auto max-h-56">
            {loading && <div>Loading...</div>}
            {projects.slice(0, 3).map(project => <ProjectCard key={project.id} project={project} />)}
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(DashboardPage);
