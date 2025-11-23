import React from 'react';
import { Project } from '../../types';
import { formatDate, formatCurrency } from '../../utils/helpers';

interface ProjectCardProps {
  project: Project;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
}

const statusColors: Record<string, string> = {
  PLANNING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-blue-100 text-blue-800',
  ON_HOLD: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
  ARCHIVED: 'bg-gray-200 text-gray-500',
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onView, onEdit }) => {
  return (
    <div className="bg-white rounded shadow p-4 w-full max-w-sm border hover:shadow-lg transition">
      <div className="flex items-center gap-2 mb-1">
        <span className={`rounded px-2 py-1 text-xs font-bold ${statusColors[project.status]}`}>{project.status}</span>
        <span className="font-semibold text-lg text-teal-700 ml-auto">{project.code}</span>
      </div>
      <h2 className="font-bold text-xl text-gray-900 mb-1" tabIndex={0}>{project.name}</h2>
      <div className="mb-2 text-gray-600 text-sm line-clamp-2">{project.description}</div>
      <div className="mb-2 flex items-center text-xs gap-3">
        <span>Start: {formatDate(project.startDate)}</span>
        <span>End: {formatDate(project.endDate)}</span>
      </div>
      <div className="flex gap-2 items-center mb-2">
        <span className="p-1 rounded bg-gray-100">Budget: {formatCurrency(project.budget)}</span>
        <span className="p-1 rounded bg-gray-100">Spent: {formatCurrency(project.spent)}</span>
      </div>
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-teal-500 h-2 rounded-full"
            style={{ width: `${Math.round(project.progress)}%` }}
            aria-valuenow={project.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
          />
        </div>
        <div className="mt-1 text-xs text-gray-500">{Math.round(project.progress)}% Complete</div>
      </div>
      <div className="flex gap-2">
        {onView && (
          <button
            className="px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-semibold focus:outline-none"
            onClick={() => onView(project.id)}
            aria-label="View project"
          >
            View
          </button>
        )}
        {onEdit && (
          <button
            className="px-3 py-1 rounded bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs font-semibold focus:outline-none"
            onClick={() => onEdit(project.id)}
            aria-label="Edit project"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(ProjectCard);
