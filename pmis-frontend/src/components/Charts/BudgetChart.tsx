import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface BudgetChartProps {
  categories: { name: string; value: number }[];
  allocation: number;
  spent: number;
}

const COLORS = [
  '#22C55E', '#208C93', '#F59E0B', '#EF4444', '#6B5D47', '#6366F1', '#F87171', '#60A5FA', '#16A34A', '#64748B'
];

const BudgetChart: React.FC<BudgetChartProps> = ({ categories, allocation, spent }) => {
  return (
    <div className="w-full grid gap-4 md:grid-cols-2">
      {/* Pie Chart by Category */}
      <div className="p-2">
        <h3 className="font-semibold mb-2 text-xs text-gray-700">Budget by Category</h3>
        <ResponsiveContainer width="100%" height={225}>
          <PieChart>
            <Pie
              data={categories}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={60}
              label={({ name }) => name}
              aria-label="Budget category breakdown"
            >
              {categories.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Bar Chart Allocation vs Spent */}
      <div className="p-2">
        <h3 className="font-semibold mb-2 text-xs text-gray-700">Budget Allocation vs Spent</h3>
        <ResponsiveContainer width="100%" height={225}>
          <BarChart data={[
            { name: 'Allocation', value: allocation },
            { name: 'Spent', value: spent }
          ]}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#208C93">
              <Cell fill="#22C55E" />
              <Cell fill="#EF4444" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default React.memo(BudgetChart);
