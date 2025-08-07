import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ShieldCheckIcon,
  LockIcon,
  UserCheckIcon,
  SmartphoneIcon,
  WifiIcon,
  CreditCardIcon,
  ExternalLinkIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon,
  EditIcon,
  LinkIcon,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Form schema for admin editing
const editItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  recommendationText: z.string().min(1, "Recommendation is required"),
  helpUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  toolLaunchUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  youtubeVideoUrl: z.string().url("Please enter a valid YouTube URL").optional().or(z.literal("")),
  estimatedTimeMinutes: z.number().min(0).optional(),
});

interface SecurityChecklistItem {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: "high" | "medium" | "low";
  recommendationText: string;
  helpUrl?: string | null;
  toolLaunchUrl?: string | null;
  youtubeVideoUrl?: string | null;
  estimatedTimeMinutes?: number | null;
  sortOrder: number;
}

interface UserSecurityProgress {
  id: number;
  userId: number;
  checklistItemId: number;
  isCompleted: boolean;
  completedAt?: string | null;
  notes?: string | null;
}

const categoryIcons = {
  identity_protection: ShieldCheckIcon,
  password_security: LockIcon,
  account_security: UserCheckIcon,
  device_security: SmartphoneIcon,
  network_security: WifiIcon,
  financial_security: CreditCardIcon,
};

const categoryLabels = {
  identity_protection: "Identity Protection",
  password_security: "Password Security",
  account_security: "Account Security",
  device_security: "Device Security",
  network_security: "Network Security",
  financial_security: "Financial Security",
};

const priorityColors = {
  high: "destructive",
  medium: "default",
  low: "secondary",
} as const;

export default function DigitalSecurityChecklist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>(
    {},
  );
  const [notesText, setNotesText] = useState<Record<number, string>>({});
  const [editingItem, setEditingItem] = useState<SecurityChecklistItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Check if user is admin
  const isAdmin = user?.role === "admin";

  // Fetch checklist items (always available)
  const { data: checklistItems = [], isLoading: itemsLoading } = useQuery<
    SecurityChecklistItem[]
  >({
    queryKey: ["/api/security-checklist"],
    enabled: true, // Always fetch checklist items
  });

  // Fetch user progress (only when authenticated)
  const { data: userProgress = [], isLoading: progressLoading } = useQuery<
    UserSecurityProgress[]
  >({
    queryKey: ["/api/security-checklist/progress"],
    enabled: !!user,
    // For non-authenticated users, return empty array to ensure clean state
    select: (data) => {
      if (!user) return [];
      return data || [];
    },
  });

  // Edit form
  const editForm = useForm<z.infer<typeof editItemSchema>>({
    resolver: zodResolver(editItemSchema),
    defaultValues: {
      title: "",
      description: "",
      recommendationText: "",
      helpUrl: "",
      toolLaunchUrl: "",
      youtubeVideoUrl: "",
      estimatedTimeMinutes: 0,
    },
  });

  // Update item mutation (admin only)
  const updateItemMutation = useMutation({
    mutationFn: async (data: { itemId: number; updates: Partial<SecurityChecklistItem> }) => {
      return apiRequest(`/api/security-checklist/${data.itemId}`, {
        method: "PUT",
        body: JSON.stringify(data.updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security-checklist"] });
      setIsEditDialogOpen(false);
      setEditingItem(null);
    },
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({
      itemId,
      isCompleted,
      notes,
    }: {
      itemId: number;
      isCompleted: boolean;
      notes?: string;
    }) => {
      // Ensure isCompleted is explicitly converted to boolean
      const completedStatus = Boolean(isCompleted);

      // Log the request data for debugging
      console.log("Security checklist mutation request:", {
        itemId,
        isCompleted,
        completedStatus,
        isCompletedType: typeof isCompleted,
        completedStatusType: typeof completedStatus,
        notes,
        requestBody: JSON.stringify({ isCompleted: completedStatus, notes }),
      });

      return apiRequest(`/api/security-checklist/${itemId}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isCompleted: completedStatus,
          notes: notes || "",
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/security-checklist/progress"],
      });
    },
    onError: (error) => {
      console.error("Security checklist mutation error:", error);
    },
  });

  // Comprehensive fallback data for when server is not responding
  const fallbackItems: SecurityChecklistItem[] = [
    {
      id: 1,
      title: "Enable Two-Factor Authentication",
      description: "Secure your most important accounts with 2FA",
      category: "account_security",
      priority: "high",
      recommendationText: "Set up 2FA on your email, banking, and social media accounts using an authenticator app like Google Authenticator or Authy.",
      helpUrl: "https://authy.com/what-is-2fa/",
      toolLaunchUrl: "https://authy.com/",
      estimatedTimeMinutes: 15,
      sortOrder: 1,
    },
    {
      id: 2,
      title: "Use a Password Manager",
      description: "Generate and store strong, unique passwords",
      category: "password_security",
      priority: "high",
      recommendationText: "Install a reputable password manager like Bitwarden, 1Password, or LastPass to create unique passwords for every account.",
      helpUrl: "https://bitwarden.com/help/getting-started-webvault/",
      toolLaunchUrl: "https://bitwarden.com/pricing/",
      estimatedTimeMinutes: 30,
      sortOrder: 2,
    },
    {
      id: 3,
      title: "Monitor Your Credit Reports",
      description: "Watch for signs of identity theft",
      category: "identity_protection",
      priority: "high",
      recommendationText: "Check your credit reports from all three bureaus annually at annualcreditreport.com and dispute any errors immediately.",
      helpUrl: "https://www.annualcreditreport.com/",
      toolLaunchUrl: "https://www.annualcreditreport.com/",
      estimatedTimeMinutes: 30,
      sortOrder: 3,
    },
    {
      id: 4,
      title: "Review Bank and Credit Card Statements",
      description: "Monitor your financial accounts for unauthorized transactions",
      category: "financial_security",
      priority: "high",
      recommendationText: "Check your bank and credit card statements weekly for suspicious activity. Set up account alerts for transactions over a certain amount.",
      helpUrl: "https://www.consumer.ftc.gov/articles/0213-lost-or-stolen-credit-atm-and-debit-cards",
      estimatedTimeMinutes: 20,
      sortOrder: 4,
    },
    {
      id: 5,
      title: "Update Software and Operating Systems",
      description: "Keep your devices secure with the latest updates",
      category: "device_security",
      priority: "medium",
      recommendationText: "Enable automatic updates for your operating system, web browsers, and important software to protect against security vulnerabilities.",
      helpUrl: "https://www.cisa.gov/tips/st04-006",
      estimatedTimeMinutes: 10,
      sortOrder: 5,
    },
    {
      id: 6,
      title: "Secure Your Wi-Fi Network",
      description: "Protect your home internet connection",
      category: "network_security",
      priority: "medium",
      recommendationText: "Use WPA3 encryption, change default router passwords, and regularly update router firmware.",
      helpUrl: "https://www.fcc.gov/consumers/guides/how-protect-yourself-online",
      estimatedTimeMinutes: 25,
      sortOrder: 6,
    },
    {
      id: 7,
      title: "Be Cautious with Public Wi-Fi",
      description: "Protect your data on public networks",
      category: "network_security",
      priority: "medium",
      recommendationText: "Avoid accessing sensitive information on public Wi-Fi. Use a VPN when necessary and ensure websites use HTTPS.",
      helpUrl: "https://www.cisa.gov/tips/st05-017",
      estimatedTimeMinutes: 5,
      sortOrder: 7,
    },
    {
      id: 8,
      title: "Review Privacy Settings on Social Media",
      description: "Control what information you share online",
      category: "account_security",
      priority: "medium",
      recommendationText: "Regularly review and update privacy settings on social media platforms to limit who can see your personal information.",
      helpUrl: "https://www.ftc.gov/tips-advice/business-center/privacy-and-security/social-media",
      estimatedTimeMinutes: 30,
      sortOrder: 8,
    },
    {
      id: 9,
      title: "Use Secure Email Practices",
      description: "Protect yourself from email-based threats",
      category: "account_security",
      priority: "medium",
      recommendationText: "Be suspicious of unexpected emails, verify sender identity, and never click links or download attachments from unknown sources.",
      helpUrl: "https://www.cisa.gov/tips/st04-014",
      estimatedTimeMinutes: 10,
      sortOrder: 9,
    },
    {
      id: 10,
      title: "Backup Important Data",
      description: "Protect your data from loss or ransomware",
      category: "device_security",
      priority: "high",
      recommendationText: "Regularly backup important files to multiple locations including cloud storage and external drives using the 3-2-1 backup rule.",
      helpUrl: "https://www.cisa.gov/tips/st05-012",
      estimatedTimeMinutes: 60,
      sortOrder: 10,
    },
    {
      id: 11,
      title: "Install Antivirus Software",
      description: "Protect your devices from malware",
      category: "device_security",
      priority: "medium",
      recommendationText: "Install reputable antivirus software and keep it updated. Enable real-time protection and regular system scans.",
      helpUrl: "https://www.cisa.gov/tips/st04-005",
      estimatedTimeMinutes: 20,
      sortOrder: 11,
    },
    {
      id: 12,
      title: "Freeze Your Credit Reports",
      description: "Place security freezes on your credit reports with all three major credit bureaus",
      category: "identity_protection",
      priority: "high",
      recommendationText: "Contact Experian, Equifax, and TransUnion to freeze your credit reports. This prevents new accounts from being opened in your name without your explicit permission.",
      helpUrl: "https://www.consumer.ftc.gov/articles/what-know-about-credit-freezes-and-fraud-alerts",
      estimatedTimeMinutes: 30,
      sortOrder: 12,
    },
    {
      id: 13,
      title: "Use Encrypted Communication Apps",
      description: "Protect your private conversations",
      category: "account_security",
      priority: "low",
      recommendationText: "Use encrypted messaging apps like Signal or WhatsApp for sensitive communications instead of regular SMS.",
      helpUrl: "https://signal.org/",
      toolLaunchUrl: "https://signal.org/download/",
      estimatedTimeMinutes: 15,
      sortOrder: 13,
    },
  ];

  // Use fallback data if server data is not available
  const effectiveItems =
    (checklistItems as SecurityChecklistItem[]).length > 0
      ? (checklistItems as SecurityChecklistItem[])
      : fallbackItems;

  // Create progress map for easy lookup - only for authenticated users
  const progressMap = user ? (userProgress as UserSecurityProgress[]).reduce(
    (
      acc: Record<number, UserSecurityProgress>,
      progress: UserSecurityProgress,
    ) => {
      acc[progress.checklistItemId] = progress;
      return acc;
    },
    {},
  ) : {}; // Empty progress map for non-authenticated users

  // Filter items by category
  const filteredItems =
    selectedCategory === "all"
      ? effectiveItems
      : effectiveItems.filter(
          (item: SecurityChecklistItem) => item.category === selectedCategory,
        );

  // Calculate completion statistics - only for authenticated users
  const totalItems = effectiveItems.length;
  const completedItems = user ? (userProgress as UserSecurityProgress[]).filter(
    (p: UserSecurityProgress) => p.isCompleted,
  ).length : 0;
  const completionPercentage =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Group items by category for the tabs
  const categories = Array.from(
    new Set(effectiveItems.map((item: SecurityChecklistItem) => item.category)),
  );

  const handleToggleComplete = (item: SecurityChecklistItem) => {
    console.log("🔥 handleToggleComplete called for item:", item.id);

    // Prevent multiple clicks while mutation is pending
    if (updateProgressMutation.isPending) {
      console.log("⚠️ Mutation already pending, ignoring click");
      return;
    }

    const currentProgress = progressMap[item.id];
    const currentCompletedStatus = Boolean(currentProgress?.isCompleted);
    const newCompletedState = !currentCompletedStatus;

    console.log("🎯 Toggling completion:", {
      itemId: item.id,
      from: currentCompletedStatus,
      to: newCompletedState,
      userAuthenticated: !!user,
    });

    // If no user, just update local state for demo
    if (!user) {
      console.log("👤 No user - updating local state only");

      // Update progressMap directly for immediate UI update
      const mockProgress = {
        id: Date.now(),
        userId: 0,
        checklistItemId: item.id,
        isCompleted: newCompletedState,
        notes: currentProgress?.notes || null,
        completedAt: newCompletedState ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      };

      // Force immediate update by updating the progressMap
      progressMap[item.id] = mockProgress;

      // Also update query cache to trigger re-render
      queryClient.setQueryData(
        ["/api/security-checklist/progress"],
        (oldData: any) => {
          const existingProgress = Array.isArray(oldData) ? oldData : [];
          const filteredProgress = existingProgress.filter(
            (p: any) => p.checklistItemId !== item.id,
          );
          const newProgress = [...filteredProgress, mockProgress];
          console.log(
            "📊 Updated local progress cache:",
            newProgress.length,
            "items",
          );
          return newProgress;
        },
      );

      return;
    }

    // If user is authenticated, use the API
    console.log("🔐 User authenticated - using API");
    const notes = notesText[item.id] || currentProgress?.notes || "";

    // Optimistically update the UI immediately
    const optimisticProgress = {
      id: currentProgress?.id || Date.now(),
      userId: currentProgress?.userId || 0,
      checklistItemId: item.id,
      isCompleted: newCompletedState,
      notes: notes || null,
      completedAt: newCompletedState ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    };
    
    // Update local state immediately for responsive UI
    progressMap[item.id] = optimisticProgress;
    
    // Also update the query cache for immediate visual feedback
    queryClient.setQueryData(['/api/security-checklist/progress'], (oldData: any) => {
      const existingProgress = Array.isArray(oldData) ? oldData : [];
      const filteredProgress = existingProgress.filter((p: any) => p.checklistItemId !== item.id);
      const newProgress = [...filteredProgress, optimisticProgress];
      console.log('🎨 Updated UI state optimistically');
      return newProgress;
    });

    updateProgressMutation.mutate(
      {
        itemId: item.id,
        isCompleted: newCompletedState,
        notes,
      },
      {
        onSuccess: () => {
          console.log("✅ Successfully updated progress via API");
          // Refetch to ensure sync with server
          queryClient.invalidateQueries({ queryKey: ['/api/security-checklist/progress'] });
        },
        onError: (error) => {
          console.error("❌ Failed to update progress:", error);
          // Revert optimistic update on error
          queryClient.invalidateQueries({ queryKey: ['/api/security-checklist/progress'] });
        },
      },
    );
  };

  const handleNotesChange = (itemId: number, notes: string) => {
    setNotesText((prev) => ({ ...prev, [itemId]: notes }));
  };

  const handleSaveNotes = async (item: SecurityChecklistItem) => {
    const currentProgress = progressMap[item.id];
    const notes = notesText[item.id] || "";
    // Explicitly convert to boolean to ensure type safety
    const completedStatus = Boolean(currentProgress?.isCompleted);

    await updateProgressMutation.mutateAsync({
      itemId: item.id,
      isCompleted: completedStatus,
      notes,
    });

    setExpandedNotes((prev) => ({ ...prev, [item.id]: false }));
  };

  const handleEditItem = (item: SecurityChecklistItem) => {
    setEditingItem(item);
    editForm.reset({
      title: item.title,
      description: item.description,
      recommendationText: item.recommendationText,
      helpUrl: item.helpUrl || "",
      toolLaunchUrl: item.toolLaunchUrl || "",
      youtubeVideoUrl: item.youtubeVideoUrl || "",
      estimatedTimeMinutes: item.estimatedTimeMinutes || 0,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (data: z.infer<typeof editItemSchema>) => {
    if (!editingItem) return;

    const updates = {
      ...data,
      helpUrl: data.helpUrl || null,
      toolLaunchUrl: data.toolLaunchUrl || null,
      youtubeVideoUrl: data.youtubeVideoUrl || null,
    };

    await updateItemMutation.mutateAsync({
      itemId: editingItem.id,
      updates,
    });
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircleIcon className="h-4 w-4 text-red-500" />;
      case "medium":
        return <InfoIcon className="h-4 w-4 text-yellow-500" />;
      default:
        return <InfoIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  // Allow access without authentication for demo purposes, but show message
  const isAuthenticated = !!user;

  if (itemsLoading || progressLoading) {
    return (
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">
            Digital Security Checklist
          </h1>
          <p>Loading your security checklist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">

          {!isAuthenticated && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <InfoIcon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-blue-800 font-medium mb-1">
                    Demo Mode
                  </p>
                  <p className="text-sm text-blue-700">
                    You're viewing the security checklist in demo mode. Log in
                    to save your progress permanently.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Progress Overview */}
          <Card className="mb-4">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">
                    {completedItems} of {totalItems} completed
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  {completionPercentage}%
                </span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </CardContent>
          </Card>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-7 mb-4">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            {categories.map((category) => {
              const Icon =
                categoryIcons[category as keyof typeof categoryIcons] ||
                InfoIcon;
              return (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="text-xs"
                >
                  <Icon className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline text-xs">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={selectedCategory}>
            <div className="grid gap-3 md:grid-cols-2">
              {filteredItems.map((item: SecurityChecklistItem) => {
                const progress = progressMap[item.id];
                const isCompleted = Boolean(progress?.isCompleted);
                
                // Debug logging for checkbox state
                console.log(`Item ${item.id} (${item.title}): progress=`, progress, 'isCompleted=', isCompleted);
                
                const Icon =
                  categoryIcons[item.category as keyof typeof categoryIcons] ||
                  InfoIcon;

                return (
                  <Card
                    key={item.id}
                    className={`transition-all ${isCompleted ? "bg-green-50 border-green-200" : ""}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={(checked) => {
                            handleToggleComplete(item);
                          }}
                          disabled={updateProgressMutation.isPending}
                          className="mt-0.5 cursor-pointer"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1 flex-1 min-w-0">
                              <Icon className="h-3 w-3 text-gray-600 flex-shrink-0" />
                              <CardTitle
                                className={`text-sm font-medium leading-tight ${isCompleted ? "line-through text-gray-600" : ""}`}
                              >
                                {item.title}
                              </CardTitle>
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditItem(item)}
                                  className="h-5 w-5 p-0 flex-shrink-0"
                                >
                                  <EditIcon className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {getPriorityIcon(item.priority)}
                              <Badge
                                variant={
                                  priorityColors[
                                    item.priority as keyof typeof priorityColors
                                  ]
                                }
                                className="text-xs"
                              >
                                {item.priority}
                              </Badge>
                            </div>
                          </div>
                          <CardDescription className="text-xs text-gray-600 line-clamp-2">
                            {item.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      {!isCompleted && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
                          <div className="flex items-start gap-2">
                            <InfoIcon className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs text-yellow-700 leading-tight">
                                {item.recommendationText}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mt-2">
                            {item.estimatedTimeMinutes && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <ClockIcon className="h-3 w-3" />
                                {item.estimatedTimeMinutes}m
                              </div>
                            )}
                            {item.toolLaunchUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(item.toolLaunchUrl!, '_blank')}
                                className="h-6 text-xs px-2 py-1"
                              >
                                <LinkIcon className="h-3 w-3 mr-1" />
                                🔗 Launch Tool
                              </Button>
                            )}
                            {item.helpUrl && (
                              <a
                                href={item.helpUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                              >
                                <ExternalLinkIcon className="h-3 w-3" />
                                Learn
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Compact Notes section */}
                      <div className="border-t pt-2">
                        {expandedNotes[item.id] ? (
                          <div className="space-y-2">
                            <Textarea
                              value={
                                notesText[item.id] || progress?.notes || ""
                              }
                              onChange={(e) =>
                                handleNotesChange(item.id, e.target.value)
                              }
                              placeholder="Add notes..."
                              rows={2}
                              className="text-xs"
                            />
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={() => handleSaveNotes(item)}
                                disabled={updateProgressMutation.isPending}
                                className="h-6 text-xs px-2 py-1"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setExpandedNotes((prev) => ({
                                    ...prev,
                                    [item.id]: false,
                                  }))
                                }
                                className="h-6 text-xs px-2 py-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            {progress?.notes ? (
                              <p className="text-xs text-gray-600 italic truncate flex-1 mr-2">
                                "{progress.notes}"
                              </p>
                            ) : (
                              <span className="text-xs text-gray-400 flex-1">
                                No notes
                              </span>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setExpandedNotes((prev) => ({
                                  ...prev,
                                  [item.id]: true,
                                }));
                                setNotesText((prev) => ({
                                  ...prev,
                                  [item.id]: progress?.notes || "",
                                }));
                              }}
                              className="h-6 text-xs px-2 py-1"
                            >
                              {progress?.notes ? "Edit" : "Add"}
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* YouTube Video Embed */}
                      {item.youtubeVideoUrl && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Educational Video:</h4>
                          <div className="aspect-video">
                            <iframe
                              src={item.youtubeVideoUrl.replace('watch?v=', 'embed/')}
                              className="w-full h-full rounded-lg"
                              frameBorder="0"
                              allowFullScreen
                              title={`${item.title} Tutorial`}
                            />
                          </div>
                        </div>
                      )}

                      {isCompleted && progress?.completedAt && (
                        <div className="text-xs text-green-600 mt-2">
                          ✓ Completed on{" "}
                          {new Date(progress.completedAt).toLocaleDateString()}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {filteredItems.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No items found in this category.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Admin Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Security Checklist Item</DialogTitle>
              <DialogDescription>
                Update the details for this security checklist item.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleSaveEdit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="recommendationText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recommendation Text</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="toolLaunchUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Launch Tool URL (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://example.com/tool" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="helpUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Help URL (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://example.com/help" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="youtubeVideoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>YouTube Video URL (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://youtube.com/watch?v=..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="estimatedTimeMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Time (minutes)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          min={0}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateItemMutation.isPending}
                  >
                    {updateItemMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
