import { useQuery } from "@tanstack/react-query";
import { Feedback, User } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface FeedbackWithTeam extends Feedback {
  teamMembers: User[];
}

export default function RecentFeedback() {
  const { data: recentFeedback, isLoading, error } = useQuery<FeedbackWithTeam[]>({
    queryKey: ["/api/feedback/recent"],
  });
  
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMilliseconds = now.getTime() - new Date(date).getTime();
    
    const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInDays > 0) {
      return `${diffInDays}d ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours}h ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes}m ago`;
    } else {
      return 'just now';
    }
  };
  
  const getSentimentClasses = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'sentiment-positive';
      case 'neutral':
        return 'sentiment-neutral';
      case 'negative':
        return 'sentiment-negative';
      default:
        return '';
    }
  };
  
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return { icon: 'thumb_up', color: 'text-[#4CAF50]' };
      case 'neutral':
        return { icon: 'thumbs_up_down', color: 'text-[#9E9E9E]' };
      case 'negative':
        return { icon: 'thumb_down', color: 'text-[#F44336]' };
      default:
        return { icon: 'question_mark', color: 'text-gray-500' };
    }
  };
  
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };
  
  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Recent Feedback</h2>
        </div>
        <div className="space-y-3 mt-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-3 rounded-md border-l-4 border-gray-200 bg-gray-50">
              <div className="flex justify-between items-start">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-8 w-full mt-2" />
              <div className="flex justify-between items-center mt-2">
                <Skeleton className="h-4 w-24" />
                <div className="flex -space-x-1">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Recent Feedback</h2>
        </div>
        <div className="text-center py-8 text-red-500">
          <span className="material-icons text-3xl mb-2">error_outline</span>
          <p>Error loading feedback data</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Recent Feedback</h2>
        <a href="/feedback" className="text-primary text-sm hover:underline">View All</a>
      </div>
      
      <div className="space-y-3 mt-2 max-h-[320px] overflow-y-auto pr-2">
        {recentFeedback && recentFeedback.map((item) => {
          const { icon, color } = getSentimentIcon(item.sentiment);
          return (
            <div key={item.id} className={`p-3 rounded-md ${getSentimentClasses(item.sentiment)}`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <span className={`material-icons ${color} mr-2`}>{icon}</span>
                  <h4 className="font-medium text-sm">{item.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                </div>
                <span className="text-xs text-gray-500">{formatTimeAgo(new Date(item.createdAt))}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {truncateText(item.content, 100)}
              </p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">Client: {item.client}</span>
                <div className="flex -space-x-1">
                  {item.teamMembers && item.teamMembers.slice(0, 2).map((member, index) => (
                    <div key={index} className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center bg-primary text-white text-xs">
                      {member.displayName.charAt(0)}
                    </div>
                  ))}
                  {item.teamMembers && item.teamMembers.length > 2 && (
                    <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center bg-gray-300 text-gray-700 text-xs">
                      +{item.teamMembers.length - 2}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {recentFeedback && recentFeedback.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <span className="material-icons text-3xl mb-2">feedback</span>
            <p>No feedback items yet</p>
          </div>
        )}
      </div>
      
      <button
        className="w-full mt-4 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        onClick={() => {/* Load more logic */}}
      >
        Load More
      </button>
    </div>
  );
}
