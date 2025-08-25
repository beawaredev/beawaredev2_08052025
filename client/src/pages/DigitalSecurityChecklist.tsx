// src/pages/DigitalSecurityChecklist.tsx
import React, { useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
  ListChecksIcon,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

/* ======================= Types & Schema ======================= */
const editItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  recommendationText: z.string().min(1, "Recommendation is required"),
  helpUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  toolLaunchUrl: z
    .string()
    .url("Enter a valid URL")
    .optional()
    .or(z.literal("")),
  youtubeVideoUrl: z
    .string()
    .url("Enter a valid YouTube URL")
    .optional()
    .or(z.literal("")),
  estimatedTimeMinutes: z.number().min(0).optional(),
});

type Priority = "high" | "medium" | "low";
type CategoryKey =
  | "identity_protection"
  | "password_security"
  | "account_security"
  | "device_security"
  | "network_security"
  | "financial_security";

interface SecurityChecklistItem {
  id: number;
  title: string;
  description: string;
  category: CategoryKey;
  priority: Priority;
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

/* ======================= Labels & Helpers ======================= */
const categoryIcons: Record<CategoryKey, any> = {
  identity_protection: ShieldCheckIcon,
  password_security: LockIcon,
  account_security: UserCheckIcon,
  device_security: SmartphoneIcon,
  network_security: WifiIcon,
  financial_security: CreditCardIcon,
};

const categoryLabels: Record<CategoryKey, string> = {
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

const PRIORITY_WEIGHTS: Record<Priority, number> = {
  high: 40,
  medium: 20,
  low: 10,
};
const weightFor = (p: Priority) => PRIORITY_WEIGHTS[p] ?? 10;

/* ======================= UI Helpers ======================= */
/** Section wrapper with hover highlighter (Home palette: sky → violet/indigo → emerald) */
function Section({
  id,
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  id: string;
  icon: React.ComponentType<any>;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="
        group relative rounded-2xl transition-all
      "
    >
      {/* Hover gradient layer (behind content) */}
      <div
        className="
        pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-0
        group-hover:opacity-100
        bg-gradient-to-br from-sky-200 via-violet-200 to-emerald-200
        dark:from-sky-500/30 dark:via-violet-500/30 dark:to-emerald-500/30
        transition-opacity duration-300
        "
      />
      {/* Content frame with subtle ring/shadow on hover */}
      <div
        className="
        relative space-y-4 p-4 md:p-5 rounded-2xl border bg-background/30
        transition-all
        group-hover:shadow-xl group-hover:scale-[1.01]
        group-hover:ring-2 group-hover:ring-sky-300
        dark:group-hover:ring-sky-400
        "
      >
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground -mt-1 ml-7">{subtitle}</p>
        )}
        {children}
      </div>
    </section>
  );
}

/** Return classes for bar/text based on percent (match header tone) */
function getToneClasses(pct: number) {
  if (pct >= 80) return { bar: "bg-green-600", text: "text-green-600" };
  if (pct >= 60) return { bar: "bg-lime-600", text: "text-lime-600" };
  if (pct >= 40) return { bar: "bg-amber-600", text: "text-amber-600" };
  return { bar: "bg-red-600", text: "text-red-600" };
}

/** Minimal custom colored progress (instead of donut) */
function ColoredProgress({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const tone = getToneClasses(clamped);
  return (
    <div className="h-2 w-full rounded bg-muted overflow-hidden">
      <div
        className={`h-full ${tone.bar} transition-all`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/* ======================= Component ======================= */
export default function DigitalSecurityChecklist() {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const isAdmin = (user as any)?.role === "admin";
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>(
    {},
  );
  const [notesText, setNotesText] = useState<Record<number, string>>({});
  const [editingItem, setEditingItem] = useState<SecurityChecklistItem | null>(
    null,
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  /* --------- Queries --------- */
  const fetchChecklistItems = async (): Promise<SecurityChecklistItem[]> => {
    const res = await apiRequest("/api/security-checklist");
    if (!res.ok) throw new Error(`Failed to load checklist (${res.status})`);
    return res.json();
  };

  const fetchProgress = async (): Promise<UserSecurityProgress[]> => {
    const res = await apiRequest("/api/security-checklist/progress");
    if (!res.ok) return [];
    return res.json();
  };

  const {
    data: checklistItems = [],
    isLoading: itemsLoading,
    isError: itemsError,
    error: itemsErrObj,
  } = useQuery<SecurityChecklistItem[]>({
    queryKey: ["/api/security-checklist"],
    queryFn: fetchChecklistItems,
    staleTime: 5 * 60 * 1000,
  });

  const { data: userProgress = [], isLoading: progressLoading } = useQuery<
    UserSecurityProgress[]
  >({
    queryKey: ["/api/security-checklist/progress"],
    queryFn: fetchProgress,
    enabled: true,
    staleTime: 60 * 1000,
  });

  /* --------- Mutations --------- */
  const updateItemMutation = useMutation({
    mutationFn: async (data: {
      itemId: number;
      updates: Partial<SecurityChecklistItem>;
    }) => {
      const res = await apiRequest(`/api/security-checklist/${data.itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.updates),
      });
      if (!res.ok) throw new Error("Failed to update item");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security-checklist"] });
      setIsEditDialogOpen(false);
      setEditingItem(null);
    },
  });

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
      const res = await apiRequest(
        `/api/security-checklist/${itemId}/progress`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isCompleted: Boolean(isCompleted),
            notes: notes || "",
          }),
        },
      );
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to update progress");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/security-checklist/progress"],
      });
    },
  });

  /* --------- Fallback Items (shown if API returns empty) --------- */
  const fallbackItems: SecurityChecklistItem[] = [
    {
      id: 1,
      title: "Enable Two-Factor Authentication",
      description: "Secure your most important accounts with 2FA",
      category: "account_security",
      priority: "high",
      recommendationText:
        "Set up 2FA on your email, banking, and social media using an authenticator app (e.g., Authy).",
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
      recommendationText:
        "Install a reputable password manager (e.g., Bitwarden) and rotate weak/reused passwords.",
      helpUrl: "https://bitwarden.com/help/getting-started-webvault/",
      toolLaunchUrl: "https://bitwarden.com/",
      estimatedTimeMinutes: 30,
      sortOrder: 2,
    },
    {
      id: 3,
      title: "Monitor Your Credit Reports",
      description: "Watch for signs of identity theft",
      category: "identity_protection",
      priority: "high",
      recommendationText:
        "Check your credit reports from all three bureaus at AnnualCreditReport.com.",
      helpUrl: "https://www.annualcreditreport.com/",
      toolLaunchUrl: "https://www.annualcreditreport.com/",
      estimatedTimeMinutes: 30,
      sortOrder: 3,
    },
    {
      id: 12,
      title: "Freeze Your Credit Reports",
      description: "Block new credit lines without your approval",
      category: "identity_protection",
      priority: "high",
      recommendationText:
        "Freeze at Experian, Equifax, and TransUnion to reduce identity-theft risk.",
      helpUrl:
        "https://www.consumer.ftc.gov/articles/what-know-about-credit-freezes-and-fraud-alerts",
      estimatedTimeMinutes: 30,
      sortOrder: 12,
    },
    {
      id: 5,
      title: "Update Software & OS",
      description: "Patch known vulnerabilities quickly",
      category: "device_security",
      priority: "medium",
      recommendationText:
        "Enable automatic updates for OS, browsers, and critical apps.",
      helpUrl: "https://www.cisa.gov/tips/st04-006",
      estimatedTimeMinutes: 10,
      sortOrder: 5,
    },
  ];

  const effectiveItems: SecurityChecklistItem[] =
    checklistItems?.length > 0 ? checklistItems : fallbackItems;

  /* --------- Derived Stats --------- */
  const progressMap = useMemo(
    () =>
      (userProgress as UserSecurityProgress[]).reduce(
        (acc, p) => {
          acc[p.checklistItemId] = p;
          return acc;
        },
        {} as Record<number, UserSecurityProgress>,
      ),
    [userProgress],
  );

  const completedItems = useMemo(
    () => effectiveItems.filter((i) => progressMap[i.id]?.isCompleted),
    [effectiveItems, progressMap],
  );

  const remainingItems = useMemo(
    () => effectiveItems.filter((i) => !progressMap[i.id]?.isCompleted),
    [effectiveItems, progressMap],
  );

  const totalItems = effectiveItems.length;
  const percentComplete = totalItems
    ? Math.round((completedItems.length / totalItems) * 100)
    : 0;

  const totalPossible = effectiveItems.reduce(
    (sum, i) => sum + weightFor(i.priority),
    0,
  );
  const totalEarned = effectiveItems.reduce(
    (sum, i) =>
      sum + (progressMap[i.id]?.isCompleted ? weightFor(i.priority) : 0),
    0,
  );
  // score retained for potential future use
  const score = totalPossible
    ? Math.round((totalEarned / totalPossible) * 100)
    : 0;

  const nextActions = useMemo(
    () =>
      [...remainingItems]
        .sort((a, b) => {
          const prio: Priority[] = ["high", "medium", "low"];
          const pa = prio.indexOf(a.priority);
          const pb = prio.indexOf(b.priority);
          return pa === pb ? a.sortOrder - b.sortOrder : pa - pb;
        })
        .slice(0, 3),
    [remainingItems],
  );

  const recent = useMemo(() => {
    const withCompletedAt = effectiveItems
      .map((i) => ({
        item: i,
        completedAt: progressMap[i.id]?.completedAt || null,
      }))
      .filter((x) => x.completedAt);
    return withCompletedAt
      .sort(
        (a, b) =>
          new Date(b.completedAt as string).getTime() -
          new Date(a.completedAt as string).getTime(),
      )
      .slice(0, 8);
  }, [effectiveItems, progressMap]);

  /* --------- Handlers --------- */
  const handleToggleComplete = (item: SecurityChecklistItem) => {
    if (!isAuthenticated) return;
    const current = progressMap[item.id]?.isCompleted ?? false;

    // optimistic update
    const optimistic: UserSecurityProgress = {
      id: progressMap[item.id]?.id || Date.now(),
      userId: progressMap[item.id]?.userId ?? 0,
      checklistItemId: item.id,
      isCompleted: !current,
      notes: progressMap[item.id]?.notes ?? null,
      completedAt: !current ? new Date().toISOString() : null,
    } as any;

    queryClient.setQueryData(
      ["/api/security-checklist/progress"],
      (old: any) => {
        const arr = Array.isArray(old) ? old : [];
        const filtered = arr.filter((p: any) => p.checklistItemId !== item.id);
        return [...filtered, optimistic];
      },
    );

    updateProgressMutation.mutate(
      {
        itemId: item.id,
        isCompleted: !current,
        notes: progressMap[item.id]?.notes,
      },
      {
        onError: () =>
          queryClient.invalidateQueries({
            queryKey: ["/api/security-checklist/progress"],
          }),
      },
    );
  };

  const handleSaveNotes = async (item: SecurityChecklistItem) => {
    if (!isAuthenticated) return;
    const current = progressMap[item.id];
    const notes = notesText[item.id] || "";
    await updateProgressMutation.mutateAsync({
      itemId: item.id,
      isCompleted: Boolean(current?.isCompleted),
      notes,
    });
    setExpandedNotes((prev) => ({ ...prev, [item.id]: false }));
  };

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
    await updateItemMutation.mutateAsync({ itemId: editingItem.id, updates });
  };

  /* --------- Loading --------- */
  if (itemsLoading || progressLoading) {
    return (
      <div className="space-y-6">
        <div className="w-full text-center">
          <p className="text-sm text-muted-foreground">
            Loading your security data…
          </p>
        </div>
      </div>
    );
  }

  const tone = getToneClasses(percentComplete);

  /* ======================= Render ======================= */
  return (
    <div className="space-y-6">
      {/* Header: title (left), colored progress (right) */}
      <div className="flex flex-col gap-2 md:grid md:grid-cols-[auto_1fr] md:items-center md:gap-4">
        <h1 className="text-3xl font-bold leading-none">Digital Security</h1>
        <div className="w-full">
          <div className="flex items-center justify-between text-xs mb-1">
            <span>Overall progress</span>
            <span className={tone.text}>{percentComplete}%</span>
          </div>
          <ColoredProgress value={percentComplete} />
        </div>
      </div>

      {/* Demo banner (shown when logged out) */}
      {!isAuthenticated && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <InfoIcon className="h-5 w-5 text-blue-700 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-blue-900">Demo Mode</div>
                <div className="text-xs text-blue-800">
                  Log in to save your progress and unlock your personalized
                  score.
                </div>
              </div>
              <div className="flex gap-2">
                <Link to="/login">
                  <Button size="sm">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="outline" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* What’s Next (TOP) */}
      <Section
        id="next"
        icon={ShieldCheckIcon}
        title="What’s Next"
        subtitle="Do these next for the biggest impact."
      >
        <Card>
          <CardContent className="p-3 space-y-2">
            {nextActions.length === 0 ? (
              <div className="text-muted-foreground">All caught up! 🎉</div>
            ) : (
              nextActions.map((item) => {
                const Icon = categoryIcons[item.category] || InfoIcon;
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-md border p-3"
                  >
                    <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium leading-tight">
                        {item.title}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        {item.estimatedTimeMinutes && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ClockIcon className="h-4 w-4" />
                            {item.estimatedTimeMinutes}m
                          </div>
                        )}
                        {item.toolLaunchUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2"
                            disabled={!isAuthenticated}
                            onClick={() =>
                              window.open(item.toolLaunchUrl!, "_blank")
                            }
                          >
                            <LinkIcon className="h-4 w-4 mr-1" />
                            Launch
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="h-7 px-2"
                          variant="default"
                          disabled={
                            !isAuthenticated || updateProgressMutation.isPending
                          }
                          onClick={() => handleToggleComplete(item)}
                        >
                          Mark Done
                        </Button>
                      </div>
                    </div>
                    <Badge
                      variant={priorityColors[item.priority]}
                      className="text-xs"
                    >
                      {item.priority}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </Section>

      {/* Full Checklist (TOP, after What's Next) */}
      <Section
        id="checklist"
        icon={ListChecksIcon}
        title="Your Security Checklist"
        subtitle="Review each category, launch tools, add notes, and mark tasks done."
      >
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          {/* Mobile tabs */}
          <TabsList className="grid w-full grid-cols-7 mb-3 sm:hidden">
            <TabsTrigger value="all" className="text-xs">
              All
            </TabsTrigger>
            {(
              [
                "identity_protection",
                "password_security",
                "account_security",
                "device_security",
                "network_security",
                "financial_security",
              ] as CategoryKey[]
            ).map((cat) => {
              const Icon = categoryIcons[cat] || InfoIcon;
              return (
                <TabsTrigger key={cat} value={cat} className="text-xs">
                  <Icon className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">
                    {categoryLabels[cat]}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={selectedCategory}>
            {/* 1 card per row, YouTube on right */}
            <div className="space-y-3">
              {(selectedCategory === "all"
                ? effectiveItems
                : effectiveItems.filter(
                    (i) => i.category === (selectedCategory as CategoryKey),
                  )
              ).map((item) => {
                const progress = progressMap[item.id];
                const isCompleted = Boolean(progress?.isCompleted);
                const Icon = categoryIcons[item.category] || InfoIcon;

                // Build embed URL safely
                const embedUrl = item.youtubeVideoUrl
                  ? item.youtubeVideoUrl.includes("embed/")
                    ? item.youtubeVideoUrl
                    : item.youtubeVideoUrl.replace("watch?v=", "embed/")
                  : "";

                return (
                  <Card
                    key={item.id}
                    className={`transition-all ${isCompleted ? "bg-green-50 border-green-200" : ""}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={() => handleToggleComplete(item)}
                          disabled={
                            !isAuthenticated || updateProgressMutation.isPending
                          }
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <CardTitle
                                className={`text-sm font-medium leading-tight truncate ${isCompleted ? "line-through text-gray-600" : ""}`}
                              >
                                {item.title}
                              </CardTitle>
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditItem(item)}
                                  className="h-6 w-6 p-0"
                                >
                                  <EditIcon className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            <Badge
                              variant={priorityColors[item.priority]}
                              className="text-xs"
                            >
                              {item.priority}
                            </Badge>
                          </div>
                          <CardDescription className="text-xs text-muted-foreground line-clamp-2">
                            {item.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      {/* Two-column content: left = actions/notes, right = YouTube */}
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="md:col-span-2">
                          {!isCompleted && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
                              <div className="flex items-start gap-2">
                                <InfoIcon className="h-4 w-4 text-yellow-700 mt-0.5" />
                                <p className="text-xs text-yellow-800">
                                  {item.recommendationText}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 mt-2">
                                {item.estimatedTimeMinutes && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <ClockIcon className="h-4 w-4" />
                                    {item.estimatedTimeMinutes}m
                                  </div>
                                )}
                                {item.toolLaunchUrl && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2"
                                    disabled={!isAuthenticated}
                                    onClick={() =>
                                      window.open(item.toolLaunchUrl!, "_blank")
                                    }
                                  >
                                    <LinkIcon className="h-4 w-4 mr-1" />
                                    Launch Tool
                                  </Button>
                                )}
                                {item.helpUrl && (
                                  <a
                                    href={item.helpUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                                  >
                                    <ExternalLinkIcon className="h-4 w-4" />
                                    Learn
                                  </a>
                                )}
                                <Button
                                  size="sm"
                                  className="h-7 px-2"
                                  disabled={
                                    !isAuthenticated ||
                                    updateProgressMutation.isPending
                                  }
                                  onClick={() => handleToggleComplete(item)}
                                >
                                  Mark Done
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Notes */}
                          <div className="border-t pt-2">
                            {expandedNotes[item.id] ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={
                                    notesText[item.id] || progress?.notes || ""
                                  }
                                  onChange={(e) =>
                                    setNotesText((prev) => ({
                                      ...prev,
                                      [item.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Add notes…"
                                  rows={2}
                                  className="text-xs"
                                />
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    className="h-7 px-2"
                                    disabled={
                                      !isAuthenticated ||
                                      updateProgressMutation.isPending
                                    }
                                    onClick={() => handleSaveNotes(item)}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2"
                                    onClick={() =>
                                      setExpandedNotes((prev) => ({
                                        ...prev,
                                        [item.id]: false,
                                      }))
                                    }
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                {progress?.notes ? (
                                  <p className="text-xs text-muted-foreground italic truncate flex-1 mr-2">
                                    “{progress.notes}”
                                  </p>
                                ) : (
                                  <span className="text-xs text-muted-foreground flex-1">
                                    No notes
                                  </span>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2"
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
                                >
                                  {progress?.notes ? "Edit" : "Add"}
                                </Button>
                              </div>
                            )}
                          </div>

                          {isCompleted && progress?.completedAt && (
                            <div className="text-xs text-green-700 mt-2">
                              ✓ Completed on{" "}
                              {new Date(
                                progress.completedAt,
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        {/* Right: YouTube (only if present) */}
                        <div className="md:col-span-1">
                          {embedUrl && (
                            <div className="aspect-video">
                              <iframe
                                src={embedUrl}
                                className="w-full h-full rounded"
                                frameBorder={0}
                                allowFullScreen
                                title={`${item.title} Tutorial`}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </Section>

      {/* Partner Tools */}
      <Section
        id="partners"
        icon={LockIcon}
        title="Partner Tools"
        subtitle="Try trusted services to speed up your protection."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <PartnerCard
            name="Password Manager"
            tagline="Create & store strong, unique passwords."
            cta="Explore Bitwarden"
            href="https://bitwarden.com/"
            badge="Recommended"
          />
          <PartnerCard
            name="Identity Protection"
            tagline="Credit freeze & breach monitoring options."
            cta="See Options"
            href="https://www.annualcreditreport.com/"
          />
          <PartnerCard
            name="Private Email & Alias"
            tagline="Reduce spam and protect your identity."
            cta="Try Proton"
            href="https://proton.me/mail"
          />
        </div>
      </Section>

      {/* Recent Activity (end) */}
      <Section
        id="activity"
        icon={CheckCircleIcon}
        title="Recent Activity"
        subtitle="Your latest completions."
      >
        <Card className="w-full">
          <CardContent className="p-3">
            {recent.length === 0 ? (
              <div className="text-muted-foreground">
                No recent activity yet.
              </div>
            ) : (
              <ul className="space-y-2">
                {recent.map(({ item, completedAt }) => (
                  <li key={item.id} className="flex items-start gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="leading-tight">{item.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Completed{" "}
                        {completedAt
                          ? new Date(completedAt).toLocaleString()
                          : ""}
                      </div>
                    </div>
                    <Badge
                      variant={priorityColors[item.priority]}
                      className="text-xs"
                    >
                      {item.priority}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </Section>

      {/* Admin Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Security Checklist Item</DialogTitle>
            <DialogDescription>
              Update the details for this item.
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleSaveEdit)}
              className="space-y-4"
            >
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
                      <Textarea rows={2} {...field} />
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
                    <FormLabel>Recommendation</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
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
                    <FormLabel>Launch Tool URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/tool"
                        {...field}
                      />
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
                    <FormLabel>Help URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/help"
                        {...field}
                      />
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
                    <FormLabel>YouTube URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://youtube.com/watch?v=..."
                        {...field}
                      />
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
                        type="number"
                        min={0}
                        value={field.value ?? 0}
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
                <Button type="submit" disabled={updateItemMutation.isPending}>
                  {updateItemMutation.isPending ? "Saving…" : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Error footer */}
      {itemsError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-3 text-red-800">
            <div className="flex items-center gap-2">
              <AlertCircleIcon className="h-5 w-5" />
              <span className="text-sm">
                {(itemsErrObj as Error)?.message ||
                  "Failed to load checklist items."}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ===== PartnerCard helper ===== */
function PartnerCard({
  name,
  tagline,
  cta,
  href,
  badge,
}: {
  name: string;
  tagline: string;
  cta: string;
  href: string;
  badge?: string;
}) {
  return (
    <Card className="h-full">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{name}</CardTitle>
          {badge && <Badge variant="outline">{badge}</Badge>}
        </div>
        <CardDescription className="text-xs">{tagline}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button asChild className="w-full">
          <a href={href} target="_blank" rel="noopener noreferrer">
            <ExternalLinkIcon className="h-4 w-4 mr-2" />
            {cta}
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
