import { useQuery } from "@tanstack/react-query";
import { Shield, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";

export function SecurityScore() {
  const { user } = useAuth();

  // Fetch user's security progress
  const { data: userProgress = [] } = useQuery({
    queryKey: ["/api/security-checklist/progress"],
    enabled: !!user,
  });

  // Fetch all security checklist items
  const { data: checklistItems = [] } = useQuery({
    queryKey: ["/api/security-checklist"],
  });

  // Calculate completion percentage
  const calculateSecurityScore = () => {
    if (!userProgress || !checklistItems || checklistItems.length === 0) {
      return 0;
    }

    const completedItems = userProgress.filter((progress: any) => progress.isCompleted);
    const activeItems = checklistItems.filter((item: any) => item.isActive);
    
    if (activeItems.length === 0) return 0;
    
    return Math.round((completedItems.length / activeItems.length) * 100);
  };

  const securityScore = calculateSecurityScore();

  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <ShieldCheck className="h-3 w-3" />;
    return <Shield className="h-3 w-3" />;
  };

  if (!user) return null;

  return (
    <Link href="/digital-security-checklist">
      <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-full border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors" title={`Security Score: ${securityScore}% - Click to improve`}>
        <div className={getScoreColor(securityScore)}>
          {getScoreIcon(securityScore)}
        </div>
        <span className={`text-xs font-medium ${getScoreColor(securityScore)}`}>
          {securityScore}%
        </span>
      </div>
    </Link>
  );
}