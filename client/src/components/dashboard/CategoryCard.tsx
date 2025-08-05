import { CategoryStat } from "@shared/schema";

interface CategoryCardProps {
  category: CategoryStat;
  icon: string;
}

export default function CategoryCard({ category, icon }: CategoryCardProps) {
  // Format category name for display
  const formatCategoryName = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <span className="material-icons mr-2 text-primary">{icon}</span>
          <h3 className="font-medium">{formatCategoryName(category.category)}</h3>
        </div>
        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
          {category.totalItems} items
        </span>
      </div>
      
      <div className="mt-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Positive</span>
          <div className="flex items-center">
            <div className="w-24 bg-gray-200 h-1.5 rounded-full mr-2">
              <div 
                className="bg-[#4CAF50] h-full rounded-full" 
                style={{ width: `${category.positivePercentage}%` }}
              />
            </div>
            <span className="text-xs text-gray-600">{category.positivePercentage}%</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Neutral</span>
          <div className="flex items-center">
            <div className="w-24 bg-gray-200 h-1.5 rounded-full mr-2">
              <div 
                className="bg-[#9E9E9E] h-full rounded-full" 
                style={{ width: `${category.neutralPercentage}%` }}
              />
            </div>
            <span className="text-xs text-gray-600">{category.neutralPercentage}%</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Negative</span>
          <div className="flex items-center">
            <div className="w-24 bg-gray-200 h-1.5 rounded-full mr-2">
              <div 
                className="bg-[#F44336] h-full rounded-full" 
                style={{ width: `${category.negativePercentage}%` }}
              />
            </div>
            <span className="text-xs text-gray-600">{category.negativePercentage}%</span>
          </div>
        </div>
      </div>
      
      <button className="mt-3 w-full py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
        View Details
      </button>
    </div>
  );
}
