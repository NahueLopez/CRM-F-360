import { useState, useRef, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent, DragOverEvent, CollisionDetection } from "@dnd-kit/core";
import type { Deal, DealStage } from "./types";
import PipelineStageColumn from "./components/PipelineStageColumn";
import PipelineDealCard from "./components/PipelineDealCard";
import DealFormModal from "./components/DealFormModal";
import { useToast } from "../../shared/context/ToastContext";
import ConfirmModal from "../../shared/ui/ConfirmModal";
import { useConfirm } from "../../shared/ui/useConfirm";
import {
  useDeals,
  useDealSummary,
  useCreateDeal,
  useUpdateDeal,
  useDeleteDeal,
  useMoveDeal,
  useSetDealsCache,
  usePipelineWebSockets,
} from "../../shared/hooks/useDealQuery";
import { useCompanies } from "../../shared/hooks/useCompanyQuery";
import { authStore } from "../../shared/auth/authStore";

const STAGES: { value: DealStage; label: string; color: string; bg: string }[] = [
  { value: "Lead", label: "Lead", color: "text-slate-300", bg: "bg-slate-700/50" },
  { value: "Contacted", label: "Contactado", color: "text-sky-300", bg: "bg-sky-900/30" },
  { value: "Proposal", label: "Propuesta", color: "text-violet-300", bg: "bg-violet-900/30" },
  { value: "Negotiation", label: "Negociación", color: "text-amber-300", bg: "bg-amber-900/30" },
  { value: "ClosedWon", label: "Ganado ✅", color: "text-emerald-300", bg: "bg-emerald-900/30" },
  { value: "ClosedLost", label: "Perdido ❌", color: "text-red-300", bg: "bg-red-900/30" },
];

const fmt = (v?: number, cur?: string) => {
  if (!v) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: cur || "ARS",
    maximumFractionDigits: 0,
  }).format(v);
};

const PipelinePage = () => {
  const { addToast } = useToast();
  const { confirm, confirmProps } = useConfirm();

  // ── React Query — replaces 6 useState + useEffect + useCallback ──
  const { data: deals = [] } = useDeals();
  const { data: summary = [] } = useDealSummary();
  const { data: companies = [] } = useCompanies();
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const deleteDeal = useDeleteDeal();
  const moveDeal = useMoveDeal();
  const setDealsCache = useSetDealsCache();

  // ── Real-time WebSocket sync ──
  usePipelineWebSockets();

  // ── Local UI state only ──
  const [showCreate, setShowCreate] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);
  const [form, setForm] = useState({
    title: "",
    companyId: "",
    value: "",
    notes: "",
    expectedCloseDate: "",
  });
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const originalDealsRef = useRef<Deal[]>([]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Custom collision detection: pointerWithin detects empty columns,
  // closestCenter handles card-to-card sorting within populated columns.
  const collisionDetection: CollisionDetection = useCallback((args) => {
    // First check if pointer is within any droppable (works for empty columns)
    const withinCollisions = pointerWithin(args);
    if (withinCollisions.length > 0) {
      // Prefer stage containers over individual cards when pointer is within both
      const stageCol = withinCollisions.find((c) => String(c.id).startsWith("stage-"));
      if (stageCol) {
        // Also check for card collisions within that stage
        const cardCollisions = closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter((c) =>
            withinCollisions.some((w) => w.id === c.id) && !String(c.id).startsWith("stage-")
          ),
        });
        return cardCollisions.length > 0 ? cardCollisions : [stageCol];
      }
      return withinCollisions;
    }
    // Fallback to closestCenter
    return closestCenter(args);
  }, []);

  const dealsByStage = (stage: DealStage) =>
    deals.filter((d) => d.stage === stage).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const stageTotal = (stage: string) => summary.find((s) => s.stage === stage);

  const handleEditDealClick = (deal: Deal) => {
    setForm({
      title: deal.title,
      companyId: deal.companyId?.toString() || "",
      value: deal.value?.toString() || "",
      notes: deal.notes || "",
      expectedCloseDate: deal.expectedCloseDate
        ? new Date(deal.expectedCloseDate).toISOString().split("T")[0]
        : "",
    });
    setEditDeal(deal);
  };

  // ── Drag & Drop ──
  const handleDragStart = (event: DragStartEvent) => {
    if (!authStore.hasPermission("deals.move")) return;
    const deal = deals.find((d) => d.id === event.active.id);
    setActiveDeal(deal ?? null);
    originalDealsRef.current = deals; // Save snapshot for rollback
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!authStore.hasPermission("deals.move")) return;
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id;

    let targetStage: DealStage | undefined;
    if (typeof overId === "string" && overId.startsWith("stage-")) {
      targetStage = overId.replace("stage-", "") as DealStage;
    } else {
      const overDeal = deals.find((d) => d.id === overId);
      targetStage = overDeal?.stage;
    }

    if (!targetStage) return;

    const draggedDeal = deals.find((d) => d.id === activeId);
    if (!draggedDeal || draggedDeal.stage === targetStage) return;

    // Optimistic: update React Query cache instantly
    setDealsCache((prev) =>
      prev.map((d) => (d.id === activeId ? { ...d, stage: targetStage! } : d)),
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!authStore.hasPermission("deals.move")) return;
    setActiveDeal(null);
    const { active, over } = event;
    if (!over) {
      // Revert optimistic drag-over cache if dropped outside
      if (originalDealsRef.current.length > 0) setDealsCache(() => originalDealsRef.current);
      return;
    }

    const dealId = active.id as number;
    const overId = over.id;

    let targetStage: DealStage | undefined;
    if (typeof overId === "string" && overId.startsWith("stage-")) {
      targetStage = overId.replace("stage-", "") as DealStage;
    } else {
      const overDeal = deals.find((d) => d.id === overId);
      targetStage = overDeal?.stage;
    }

    if (!targetStage) return;

    // Use the original snapshot to check the card's REAL stage (before handleDragOver changed it)
    const originalDeal = originalDealsRef.current.find((d) => d.id === dealId);
    const currentDeal = deals.find((d) => d.id === dealId);
    if (!originalDeal && !currentDeal) return;

    // If dropped back on itself in the same original stage, skip
    if (originalDeal && originalDeal.stage === targetStage && overId === dealId) return;

    // Get other cards in the target stage, sorted by sortOrder
    // Use the freshest deals array, which may have handleDragOver's optimistic stage update
    const stageDeals = deals
      .filter((d) => d.stage === targetStage && d.id !== dealId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    // If all sortOrders are the same (common for unseeded data), space them out locally
    // to allow proper fractional computation. The backend normalizes after save.
    const sortOrders = stageDeals.map((d) => d.sortOrder ?? 0);
    const allSame = stageDeals.length > 1 && sortOrders.every((v) => v === sortOrders[0]);
    const effectiveOrders = allSame
      ? stageDeals.map((_, i) => i * 1000)
      : sortOrders;

    let newSortOrder: number;
    if (typeof overId === "string" && overId.startsWith("stage-")) {
      // Dropped on empty area — put at the end
      const lastOrder = effectiveOrders.length > 0 ? effectiveOrders[effectiveOrders.length - 1] : 0;
      newSortOrder = lastOrder + 1000;
    } else {
      const overIndex = stageDeals.findIndex((d) => d.id === overId);
      if (overIndex === -1) {
        // Target card not found — put at end
        const lastOrder = effectiveOrders.length > 0 ? effectiveOrders[effectiveOrders.length - 1] : 0;
        newSortOrder = lastOrder + 1000;
      } else {
        // Determine drag direction for same-column moves
        const isSameColumn = originalDeal && originalDeal.stage === targetStage;
        const originalSortOrder = originalDeal?.sortOrder ?? 0;
        const overCardSortOrder = effectiveOrders[overIndex];
        const draggingDown = isSameColumn && originalSortOrder < overCardSortOrder;

        if (draggingDown) {
          // Dragging DOWN → insert AFTER the target card
          if (overIndex < effectiveOrders.length - 1) {
            const curr = effectiveOrders[overIndex];
            const next = effectiveOrders[overIndex + 1];
            newSortOrder = Math.round((curr + next) / 2);
            if (newSortOrder <= curr) newSortOrder = curr + 1;
          } else {
            // Target is the last card — put after it
            newSortOrder = effectiveOrders[overIndex] + 1000;
          }
        } else {
          // Dragging UP or cross-column → insert BEFORE the target card
          if (overIndex === 0) {
            newSortOrder = effectiveOrders[0] - 1000;
          } else {
            const prev = effectiveOrders[overIndex - 1];
            const curr = effectiveOrders[overIndex];
            newSortOrder = Math.round((prev + curr) / 2);
            if (newSortOrder <= prev) newSortOrder = prev + 1;
          }
        }
      }
    }

    // Optimistic cache update with the new stage and sortOrder
    setDealsCache((prev) =>
      prev.map((d) =>
        d.id === dealId ? { ...d, stage: targetStage!, sortOrder: newSortOrder } : d,
      ),
    );

    const stageName = STAGES.find((s) => s.value === targetStage)?.label ?? targetStage;
    moveDeal.mutate(
      { id: dealId, stage: targetStage, sortOrder: newSortOrder },
      {
        onSuccess: () => addToast("success", `Oportunidad movida a ${stageName}`),
        onError: () => {
          addToast("error", "Error al mover la oportunidad");
          if (originalDealsRef.current.length > 0) setDealsCache(() => originalDealsRef.current);
        },
      },
    );
  };

  const handleDragCancel = () => {
    setActiveDeal(null);
    if (originalDealsRef.current.length > 0) setDealsCache(() => originalDealsRef.current);
  };

  // ── CRUD ──
  const handleCreate = async () => {
    if (!form.title.trim()) return;
    createDeal.mutate(
      {
        title: form.title,
        companyId: form.companyId ? Number(form.companyId) : undefined,
        value: form.value ? Number(form.value) : undefined,
        notes: form.notes || undefined,
        expectedCloseDate: form.expectedCloseDate || undefined,
      },
      {
        onSuccess: () => {
          addToast("success", `Oportunidad "${form.title}" creada`);
          setForm({ title: "", companyId: "", value: "", notes: "", expectedCloseDate: "" });
          setShowCreate(false);
        },
        onError: () => addToast("error", "Error al crear la oportunidad"),
      },
    );
  };

  const handleUpdate = async () => {
    if (!editDeal || !form.title.trim()) return;
    updateDeal.mutate(
      {
        id: editDeal.id,
        data: {
          title: form.title,
          companyId: form.companyId ? Number(form.companyId) : undefined,
          value: form.value ? Number(form.value) : undefined,
          notes: form.notes || undefined,
          expectedCloseDate: form.expectedCloseDate || undefined,
        },
      },
      {
        onSuccess: () => {
          addToast("success", "Oportunidad actualizada");
          setForm({ title: "", companyId: "", value: "", notes: "", expectedCloseDate: "" });
          setEditDeal(null);
        },
        onError: () => addToast("error", "Error al actualizar"),
      },
    );
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: "Eliminar oportunidad",
      message: "Se eliminará esta oportunidad del pipeline. ¿Continuar?",
      confirmLabel: "Sí, eliminar",
      variant: "danger",
    });
    if (!ok) return;
    deleteDeal.mutate(id, {
      onSuccess: () => addToast("success", "Oportunidad eliminada"),
      onError: () => addToast("error", "Error al eliminar"),
    });
  };

  const totalPipeline = deals
    .filter((d) => d.stage !== "ClosedLost")
    .reduce((s, d) => s + (d.value ?? 0), 0);
  const wonTotal = deals
    .filter((d) => d.stage === "ClosedWon")
    .reduce((s, d) => s + (d.value ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-linear-to-br from-indigo-600/20 to-violet-600/10 border border-indigo-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-400">Total Pipeline</p>
          <p className="text-2xl font-bold text-indigo-300">{fmt(totalPipeline)}</p>
          <p className="text-[10px] text-slate-500">{deals.length} oportunidades</p>
        </div>
        <div className="bg-linear-to-br from-emerald-600/20 to-green-600/10 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-xs text-slate-400">Ganados</p>
          <p className="text-2xl font-bold text-emerald-300">{fmt(wonTotal)}</p>
          <p className="text-[10px] text-slate-500">
            {deals.filter((d) => d.stage === "ClosedWon").length} deals cerrados
          </p>
        </div>
        <div className="flex items-center justify-end">
          {authStore.hasPermission("deals.create") && (
            <button
              onClick={() => {
                setForm({ title: "", companyId: "", value: "", notes: "", expectedCloseDate: "" });
                setShowCreate(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition"
            >
              + Nueva oportunidad
            </button>
          )}
        </div>
      </div>

      {/* Pipeline columns with DnD — responsive breakpoints */}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 min-h-[60vh]">
          {STAGES.map((stg) => (
            <PipelineStageColumn
              key={stg.value}
              stage={stg}
              deals={dealsByStage(stg.value)}
              summary={stageTotal(stg.value)}
              onEditDeal={authStore.hasPermission("deals.edit") ? handleEditDealClick : () => { }}
            />
          ))}
        </div>

        {/* Drag overlay — floating card while dragging */}
        <DragOverlay>
          {activeDeal ? (
            <div className="rotate-1 scale-105 opacity-90">
              <PipelineDealCard deal={activeDeal} onEdit={() => { }} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Create modal — extracted component */}
      {showCreate && (
        <DealFormModal
          form={form}
          companies={companies}
          onChange={setForm}
          onSubmit={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* Detail/Edit modal */}
      {editDeal && (
        <DealFormModal
          form={form}
          companies={companies}
          isEdit={true}
          onChange={setForm}
          onSubmit={handleUpdate}
          onClose={() => setEditDeal(null)}
          onDelete={authStore.hasPermission("deals.delete") ? () => {
            handleDelete(editDeal.id);
            setEditDeal(null);
          } : undefined}
        />
      )}
      <ConfirmModal {...confirmProps} />
    </div>
  );
};

export default PipelinePage;
