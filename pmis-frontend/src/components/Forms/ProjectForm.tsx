import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectFormSchema } from '../../utils/validators';
import { ProjectFormValues } from '../../types';
import { useTranslation } from 'react-i18next';

interface ProjectFormProps {
  defaultValues?: Partial<ProjectFormValues>;
  loading?: boolean;
  onSubmit: (values: ProjectFormValues) => void;
  onCancel?: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ defaultValues, loading = false, onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: defaultValues as ProjectFormValues,
    mode: 'onChange',
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} aria-label="Project form">
      <div>
        <label htmlFor="name" className="block font-semibold text-sm mb-1">Name</label>
        <input
          {...register('name')}
          id="name"
          type="text"
          className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-teal-200"
          aria-invalid={!!errors.name}
        />
        {errors.name && <span className="text-red-600 text-xs" role="alert">{errors.name.message}</span>}
      </div>
      <div>
        <label htmlFor="description" className="block font-semibold text-sm mb-1">Description</label>
        <textarea
          {...register('description')}
          id="description"
          className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-teal-200"
          rows={3}
          aria-invalid={!!errors.description}
        />
        {errors.description && <span className="text-red-600 text-xs" role="alert">{errors.description.message}</span>}
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label htmlFor="startDate" className="block font-semibold text-sm mb-1">Start Date</label>
          <input
            {...register('startDate')}
            id="startDate"
            type="date"
            className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-teal-200"
            aria-invalid={!!errors.startDate}
          />
          {errors.startDate && <span className="text-red-600 text-xs" role="alert">{errors.startDate.message}</span>}
        </div>
        <div className="flex-1">
          <label htmlFor="endDate" className="block font-semibold text-sm mb-1">End Date</label>
          <input
            {...register('endDate')}
            id="endDate"
            type="date"
            className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-teal-200"
            aria-invalid={!!errors.endDate}
          />
          {errors.endDate && <span className="text-red-600 text-xs" role="alert">{errors.endDate.message}</span>}
        </div>
      </div>
      <div>
        <label htmlFor="budget" className="block font-semibold text-sm mb-1">Budget</label>
        <input
          {...register('budget', { valueAsNumber: true })}
          id="budget"
          type="number"
          min={0}
          step={0.01}
          className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-teal-200"
          aria-invalid={!!errors.budget}
        />
        {errors.budget && <span className="text-red-600 text-xs" role="alert">{errors.budget.message}</span>}
      </div>
      <div>
        <label htmlFor="priority" className="block font-semibold text-sm mb-1">Priority</label>
        <select
          {...register('priority')}
          id="priority"
          className="border px-3 py-2 rounded w-full focus:outline-none focus:ring-teal-200"
          aria-invalid={!!errors.priority}
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        {errors.priority && <span className="text-red-600 text-xs" role="alert">{errors.priority.message}</span>}
      </div>
      {/* File upload field for documents can be added here if required */}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 disabled:opacity-60"
          onClick={onCancel}
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          className="bg-teal-700 text-white px-4 py-2 rounded font-semibold hover:bg-teal-600 disabled:opacity-60"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? t('loading') : t('submit')}
        </button>
      </div>
    </form>
  );
};

export default React.memo(ProjectForm);
