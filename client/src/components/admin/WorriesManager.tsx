// client/src/components/admin/WorriesManager.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api-interceptor";
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  ListChecks,
  MessageSquare,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Check,
  X,
} from "lucide-react";

/* ----------------- helpers ----------------- */
function toSlug(text?: string | null) {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

/* A small palette to rotate per-card */
const CARD_THEMES = [
  {
    bar: "from-indigo-500/80 to-indigo-400/80",
    panelBg: "bg-indigo-50",
    ring: "ring-indigo-200",
  },
  {
    bar: "from-teal-500/80 to-teal-400/80",
    panelBg: "bg-teal-50",
    ring: "ring-teal-200",
  },
  {
    bar: "from-rose-500/80 to-rose-400/80",
    panelBg: "bg-rose-50",
    ring: "ring-rose-200",
  },
  {
    bar: "from-amber-500/80 to-amber-400/80",
    panelBg: "bg-amber-50",
    ring: "ring-amber-200",
  },
  {
    bar: "from-sky-500/80 to-sky-400/80",
    panelBg: "bg-sky-50",
    ring: "ring-sky-200",
  },
];

export default function WorriesManager() {
  return <AdminWorriesPanel />;
}

function AdminWorriesPanel() {
  const qc = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [expandedWorryId, setExpandedWorryId] = useState<number | null>(null);

  const {
    data: worries = [],
    isLoading,
    error,
  } = useQuery<any[]>({
    queryKey: ["/api/worries"],
    queryFn: async () => {
      const res = await apiRequest("/api/worries");
      if (!res.ok) throw new Error("Failed to fetch worries");
      return res.json();
    },
  });

  const createForm = useForm<any>({
    defaultValues: { is_active: true, sort_order: 0 },
  });
  const editForm = useForm<any>({ defaultValues: { is_active: true } });

  useEffect(() => {
    if (isEditOpen && editing) {
      editForm.reset({
        worry_key: editing.worry_key ?? "",
        label: editing.label ?? "",
        blurb: editing.blurb ?? "",
        icon_name: editing.icon_name ?? "",
        is_active: !!editing.is_active,
        sort_order: editing.sort_order ?? 0,
      });
    }
  }, [isEditOpen, editing]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("/api/worries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/worries"] });
      setIsCreateOpen(false);
      toast({ title: "Worry created" });
    },
    onError: (e: any) =>
      toast({
        title: "Create failed",
        description: String(e),
        variant: "destructive",
      }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest(`/api/worries/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/worries"] });
      setIsEditOpen(false);
      toast({ title: "Worry updated" });
    },
    onError: (e: any) =>
      toast({
        title: "Update failed",
        description: String(e),
        variant: "destructive",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(`/api/worries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/worries"] });
      toast({ title: "Worry deleted" });
    },
    onError: (e: any) =>
      toast({
        title: "Delete failed",
        description: String(e),
        variant: "destructive",
      }),
  });

  if (isLoading) return <div>Loading worries…</div>;
  if (error) return <div className="text-red-600">Failed to load worries</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">Worries Manager</h2>
        <Button onClick={() => setIsCreateOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-2" /> Add Worry
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {worries.map((w: any, idx: number) => {
          const theme = CARD_THEMES[idx % CARD_THEMES.length];
          return (
            <Card
              key={w.id}
              className={`transition hover:shadow-md ring-1 ${theme.ring}`}
            >
              {/* top color bar */}
              <div className={`h-1 w-full bg-gradient-to-r ${theme.bar}`} />
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{w.label}</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(w);
                        setIsEditOpen(true);
                      }}
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(w.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">{w.blurb}</p>
                <div className="flex gap-2 mt-2">
                  <Badge>{w.worry_key}</Badge>
                  {w.is_active ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setExpandedWorryId(expandedWorryId === w.id ? null : w.id)
                    }
                  >
                    <ListChecks className="h-4 w-4 mr-1" /> Details
                  </Button>
                </div>
                {expandedWorryId === w.id && (
                  <div
                    className={`mt-3 space-y-3 rounded-lg p-2 ${theme.panelBg}`}
                  >
                    <WorryResponseLines worryId={w.id} />
                    <WorryRecommendations worryId={w.id} />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Worry</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={createForm.handleSubmit((vals) =>
              createMutation.mutate(vals),
            )}
            className="space-y-3"
          >
            <Input placeholder="Key" {...createForm.register("worry_key")} />
            <Input placeholder="Label" {...createForm.register("label")} />
            <Textarea placeholder="Blurb" {...createForm.register("blurb")} />
            <Input placeholder="Icon" {...createForm.register("icon_name")} />
            <div className="flex items-center gap-2">
              <Switch
                checked={!!createForm.watch("is_active")}
                onCheckedChange={(v) => createForm.setValue("is_active", v)}
              />
              <span>Active</span>
            </div>
            <Input
              type="number"
              placeholder="Sort order"
              {...createForm.register("sort_order", { valueAsNumber: true })}
            />
            <Button type="submit">Save</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Worry</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit((vals) =>
              updateMutation.mutate(vals),
            )}
            className="space-y-3"
          >
            <Input placeholder="Key" {...editForm.register("worry_key")} />
            <Input placeholder="Label" {...editForm.register("label")} />
            <Textarea placeholder="Blurb" {...editForm.register("blurb")} />
            <Input placeholder="Icon" {...editForm.register("icon_name")} />
            <div className="flex items-center gap-2">
              <Switch
                checked={!!editForm.watch("is_active")}
                onCheckedChange={(v) => editForm.setValue("is_active", v)}
              />
              <span>Active</span>
            </div>
            <Input
              type="number"
              placeholder="Sort order"
              {...editForm.register("sort_order", { valueAsNumber: true })}
            />
            <Button type="submit">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- Response Lines ---------- */
function WorryResponseLines({ worryId }: { worryId: number }) {
  const qc = useQueryClient();
  const { data: lines = [] } = useQuery<any[]>({
    queryKey: ["/api/worries", worryId, "response-lines"],
    queryFn: async () => {
      const res = await apiRequest(`/api/worries/${worryId}/response-lines`);
      if (!res.ok) throw new Error("Failed to fetch response lines");
      return res.json();
    },
  });

  const [text, setText] = useState("");

  const addMutation = useMutation({
    mutationFn: async (line_text: string) => {
      const res = await apiRequest(`/api/worries/${worryId}/response-lines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ line_text }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["/api/worries", worryId, "response-lines"],
      });
      setText("");
    },
    onError: (e: any) =>
      toast({
        title: "Add failed",
        description: String(e),
        variant: "destructive",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(`/api/worry-response-lines/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["/api/worries", worryId, "response-lines"],
      });
    },
    onError: (e: any) =>
      toast({
        title: "Delete failed",
        description: String(e),
        variant: "destructive",
      }),
  });

  return (
    <div className="border rounded p-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquare className="h-4 w-4" /> Response Lines
        </div>
      </div>
      {lines.map((l: any) => (
        <div
          key={l.id}
          className="flex justify-between items-center border-b py-1"
        >
          <span>{l.line_text}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => deleteMutation.mutate(l.id)}
          >
            <TrashIcon className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add response line"
        />
        <Button onClick={() => text.trim() && addMutation.mutate(text)}>
          Add
        </Button>
      </div>
    </div>
  );
}

/* ---------- Recommendations (server expects worryId, slug, title, rationale) ---------- */
type ExpandedRecommendation = {
  id: number; // recommendation id (old model) OR link id (if your server maps it)
  title: string;
  slug?: string;
  checklist_item_id?: number;
  estimated_time_minutes?: number | null;
};

function WorryRecommendations({ worryId }: { worryId: number }) {
  const qc = useQueryClient();

  const { data: recs = [] } = useQuery<ExpandedRecommendation[]>({
    queryKey: ["/api/worries", worryId, "recommendations"],
    queryFn: async () => {
      const res = await apiRequest(`/api/worries/${worryId}/recommendations`);
      if (!res.ok) throw new Error("Failed to fetch recommendations");
      return res.json();
    },
  });

  const { data: checklist = [] } = useQuery<any[]>({
    queryKey: ["/api/security-checklist"],
    queryFn: async () => {
      const res = await apiRequest("/api/security-checklist");
      if (!res.ok) throw new Error("Failed to fetch checklist");
      return res.json();
    },
  });

  /* ===== duplicate detection =====
     Build a set of normalized slugs and lowercase titles
  */
  const existingSlugSet = useMemo(() => {
    const set = new Set<string>();
    for (const r of recs) {
      const s = (r.slug && r.slug.trim()) || toSlug(r.title);
      if (s) set.add(s);
    }
    return set;
  }, [recs]);

  const existingTitleSet = useMemo(() => {
    const set = new Set<string>();
    for (const r of recs) set.add((r.title || "").toLowerCase().trim());
    return set;
  }, [recs]);

  const addMutation = useMutation({
    mutationFn: async (item: any) => {
      const title = item.title ?? "";
      const slug = item.slug ?? toSlug(title);
      const rationale =
        item.recommendation_text ??
        item.recommendationText ??
        item.description ??
        item.descriptionText ??
        "";

      // client-side duplicate block
      if (
        existingSlugSet.has(slug) ||
        existingTitleSet.has(title.toLowerCase().trim())
      ) {
        throw new Error("This recommendation is already linked to this worry.");
      }

      const payload = {
        worryId, // REQUIRED by your backend
        slug, // REQUIRED
        title, // REQUIRED
        rationale, // REQUIRED
        // optional legacy extras if your server accepts them:
        points_text: item.points_text ?? null,
        est_text:
          (item.estimated_time_minutes ?? item.estimatedTimeMinutes) != null
            ? `${item.estimated_time_minutes ?? item.estimatedTimeMinutes} min`
            : null,
      };

      const res = await apiRequest(`/api/worries/${worryId}/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // if server enforces uniqueness and returns 409/400, bubble as toast
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to add recommendation");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["/api/worries", worryId, "recommendations"],
      });
      toast({ title: "Recommendation added" });
    },
    onError: (e: any) =>
      toast({
        title: "Add failed",
        description: String(e),
        variant: "destructive",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      // Old endpoint for removing a recommendation
      const res = await apiRequest(`/api/worry-recommendations/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["/api/worries", worryId, "recommendations"],
      });
      toast({ title: "Recommendation removed" });
    },
    onError: (e: any) =>
      toast({
        title: "Delete failed",
        description: String(e),
        variant: "destructive",
      }),
  });

  const nudgeSort = useMutation({
    mutationFn: async ({ id, delta }: { id: number; delta: number }) => {
      // If your backend supports sort updates on old model:
      const res = await apiRequest(`/api/worry-recommendations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deltaSort: delta }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["/api/worries", worryId, "recommendations"],
      }),
  });

  return (
    <div className="border rounded p-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4" /> Recommendations
        </div>
      </div>

      {recs.length === 0 && (
        <div className="text-sm text-muted-foreground mb-2">
          No recommendations yet. Add from the checklist below.
        </div>
      )}

      {recs.map((r: any) => (
        <div
          key={r.id}
          className="flex justify-between items-center border-b py-1"
        >
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{r.title}</div>
            {typeof r.estimated_time_minutes === "number" && (
              <div className="text-xs text-muted-foreground truncate">
                ~{r.estimated_time_minutes} min
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              title="Move up"
              onClick={() => nudgeSort.mutate({ id: r.id, delta: -1 })}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              title="Move down"
              onClick={() => nudgeSort.mutate({ id: r.id, delta: 1 })}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => deleteMutation.mutate(r.id)}
            >
              <TrashIcon className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}

      <div className="mt-3">
        <Label>Select from Security Checklist</Label>
        <div className="max-h-48 overflow-auto border rounded p-2">
          {checklist.map((c: any) => {
            const title = c.title ?? "";
            const candidateSlug = c.slug ?? toSlug(title);
            const already =
              existingSlugSet.has(candidateSlug) ||
              existingTitleSet.has(title.toLowerCase().trim());

            return (
              <div
                key={c.id}
                className="flex justify-between items-center border-b py-1"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{c.title}</div>
                  {typeof c.estimated_time_minutes === "number" && (
                    <div className="text-xs text-muted-foreground truncate">
                      ~{c.estimated_time_minutes} min
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={already ? "outline" : "default"}
                  disabled={already || addMutation.isPending}
                  onClick={() => addMutation.mutate(c)}
                >
                  {already ? "Added" : "Add"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
