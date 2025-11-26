import * as React from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import DashboardWorries from "@/components/user/DashboardWorries";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.username}.
          </p>
        </div>
         <div className="mt-4 md:mt-0">
          <Link href="/my-security-score">
            <Button className="gap-2">
              View My Security Score
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <DashboardWorries />
    </div>
  );
}
