interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down';
  };
  progressBar?: {
    value: number;
    label: string;
    color: string;
  };
}

export default function StatCard({ title, value, icon, trend, progressBar }: StatCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <span className={`material-icons ${progressBar?.color || 'text-primary'}`}>{icon}</span>
      </div>
      <p className="text-2xl font-semibold mt-2">{value}</p>
      
      {trend && (
        <p className={`text-xs ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'} mt-1 flex items-center`}>
          <span className="material-icons text-xs mr-1">
            {trend.direction === 'up' ? 'arrow_upward' : 'arrow_downward'}
          </span>
          <span>{trend.value}% {trend.label}</span>
        </p>
      )}
      
      {progressBar && (
        <>
          <div className="mt-1 bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`${progressBar.color} h-full rounded-full`} 
              style={{ width: `${progressBar.value}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">{progressBar.value}% {progressBar.label}</p>
        </>
      )}
    </div>
  );
}
