import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { fetchProjects, setFilter, setSort, setPagination } from '../store/slices/projectsSlice';
import DataTable from '../components/Tables/DataTable';
import ProjectCard from '../components/Cards/ProjectCard';
import { useTranslation } from 'react-i18next';

const ProjectsPage: React.FC = () => {
  const { list: projects, loading, pagination, filter, sort } = useSelector((state: RootState) => state.projects);
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();
  const [view, setView] = useState<'list' | 'card'>('list');
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const onPageChange = (page: number) => {
    dispatch(setPagination({ ...pagination, page }));
    dispatch(fetchProjects());
  };

  const onSort = (colKey: string) => {
    dispatch(setSort(colKey));
    dispatch(fetchProjects());
  };

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' },
    { key: 'budget', label: 'Budget' },
    { key: 'progress', label: 'Progress', render: (v: number) => <span>{v}%</span> },
  ];

  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const paged = filtered.slice((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit);

  return (
    <section className="w-full max-w-screen-xl mx-auto p-4">
      <div className="flex justify-between mb-3 items-center">
        <h1 className="font-bold text-2xl">{t('projects')}</h1>
        <button className="bg-teal-700 px-4 py-2 text-white rounded hover:bg-teal-800 transition text-sm">{t('createProject')}</button>
      </div>
      <div className="flex gap-2 mb-3">
        <input className="border px-2 py-1 rounded" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." />
        <select className="border px-2 py-1 rounded" value={view} onChange={e => setView(e.target.value as any)}>
          <option value="list">List</option>
          <option value="card">Card</option>
        </select>
      </div>
      {view === 'list' ? (
        <DataTable
          columns={columns}
          data={paged}
          page={pagination.page}
          pageSize={pagination.limit}
          total={filtered.length}
          loading={loading}
          onPageChange={onPageChange}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {paged.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </section>
  );
};

export default React.memo(ProjectsPage);
