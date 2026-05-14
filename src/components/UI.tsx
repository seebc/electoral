
import { Users } from 'lucide-react';

export const EmptyState = ({ message, icon: Icon = Users }: { message: string, icon?: any }) => (
  <div className="flex flex-col items-center justify-center py-16 px-10 text-center gap-4">
    <div className="bg-surface-100 p-5 rounded-2xl">
      <Icon className="w-10 h-10 text-surface-300" />
    </div>
    <p className="text-sm font-medium text-surface-400">{message}</p>
  </div>
);

export const SkeletonTable = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 bg-surface-200 w-48 rounded-lg" />
    <div className="card overflow-hidden">
      <div className="h-12 bg-surface-100 border-b border-surface-200" />
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="h-16 border-b border-surface-100 flex items-center px-6 gap-4">
          <div className="w-8 h-8 bg-surface-100 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-surface-100 w-1/3 rounded" />
            <div className="h-2.5 bg-surface-50 w-1/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonDashboard = () => (
  <div className="space-y-8 animate-pulse">
    <div className="flex justify-between items-end">
      <div className="space-y-3">
        <div className="h-3 bg-surface-200 w-24 rounded" />
        <div className="h-9 bg-surface-200 w-72 rounded-lg" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-36 card" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-[400px] card" />
      <div className="h-[400px] card" />
    </div>
  </div>
);
