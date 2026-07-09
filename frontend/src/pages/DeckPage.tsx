import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  useGetDeckQuery,
  useUpdateCardMutation,
  useDeleteCardMutation,
  useGenerateDeckMutation,
  useDeleteDeckMutation,
  type Card,
} from "@/store/api";
import { API_URL } from "@/config";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function CardEditor({
  card,
  deckId,
  onClose,
}: {
  card: Card;
  deckId: string;
  onClose: () => void;
}) {
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [updateCard, { isLoading }] = useUpdateCardMutation();

  const handleSave = async () => {
    try {
      await updateCard({
        deckId,
        cardId: card.id,
        front,
        back,
      }).unwrap();
      toast.success("Card saved");
      onClose();
    } catch {
      // Error toast handled by apiErrorMiddleware
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit Card</DialogTitle>
      </DialogHeader>

      <div className="grid gap-1.5">
        <Label htmlFor="card-front">Front</Label>
        <Textarea
          id="card-front"
          value={front}
          onChange={(e) => setFront(e.target.value)}
          rows={4}
          className="font-mono"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="card-back">Back</Label>
        <Textarea
          id="card-back"
          value={back}
          onChange={(e) => setBack(e.target.value)}
          rows={4}
          className="font-mono"
        />
      </div>

      {card.sourcePageNum && (
        <p className="text-[0.8125rem] text-muted-foreground">
          Source: Slide {card.sourcePageNum}
        </p>
      )}

      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

const POLL_INTERVAL = 3000;

export default function DeckPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [generateDeck] = useGenerateDeckMutation();
  const [deleteCard] = useDeleteCardMutation();
  const [deleteDeck] = useDeleteDeckMutation();
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [polling, setPolling] = useState(false);

  const generationTriggered = useRef(false);

  const { data, isLoading } = useGetDeckQuery(id!, {
    pollingInterval: polling ? POLL_INTERVAL : 0,
  });

  const deck = data?.deck;
  const cards = deck?.cards ?? [];
  const status = deck?.status;

  const isGenerating = status === "generating" || status === "uploaded";

  // Auto-trigger generation when landing on a deck with status "uploaded"
  useEffect(() => {
    if (status === "uploaded" && deck?.sourceFileKey && !generationTriggered.current) {
      generationTriggered.current = true;
      generateDeck(id!).catch(() => {});
    }
  }, [status, deck?.sourceFileKey, id, generateDeck]);

  // Enable/disable polling based on deck status
  useEffect(() => {
    setPolling(isGenerating);
  }, [isGenerating]);

  // Toast on status transitions
  const prevStatus = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!status || !prevStatus.current) {
      prevStatus.current = status;
      return;
    }
    if (prevStatus.current === "generating" && status === "ready") {
      toast.success("Cards generated successfully!");
    } else if (prevStatus.current === "generating" && status === "error") {
      toast.error("Card generation failed. Please try again.");
    }
    prevStatus.current = status;
  }, [status]);

  const handleExport = async () => {
    if (!id) return;
    setIsExporting(true);
    try {
      const token = localStorage.getItem("ankify_token");
      const response = await fetch(`${API_URL}/generate/export/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${deck?.name || "deck"}.apkg`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Deck exported");
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleRegenerate = async () => {
    if (!id) return;
    if (!confirm("Regenerate all cards? This will replace existing cards."))
      return;
    generationTriggered.current = true;
    generateDeck(id).catch(() => {});
  };

  const handleDeleteDeck = async () => {
    if (!id) return;
    if (!confirm("Delete this entire deck?")) return;
    try {
      await deleteDeck(id).unwrap();
      toast.success("Deck deleted");
      navigate("/");
    } catch {
      // Error toast handled by apiErrorMiddleware
    }
  };

  if (isLoading) {
    return (
      <div>
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-semibold">Deck not found</h1>
        <Button asChild variant="ghost">
          <Link to="/">Back to Decks</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            to="/"
            className="mb-1.5 inline-flex items-center gap-1 text-[0.8125rem] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> All Decks
          </Link>
          <h1 className="text-2xl font-semibold">{deck.name}</h1>
          {deck.sourceFileName && (
            <p className="mt-1 text-[0.8125rem] text-muted-foreground">
              From: {deck.sourceFileName}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          {deck.sourceFileKey && !isGenerating && (
            <Button variant="ghost" onClick={handleRegenerate}>
              Regenerate
            </Button>
          )}
          <Button
            onClick={handleExport}
            disabled={isExporting || cards.length === 0 || isGenerating}
          >
            {isExporting ? "Exporting..." : "Export .apkg"}
          </Button>
          <Button variant="destructive" onClick={handleDeleteDeck}>
            Delete
          </Button>
        </div>
      </div>

      {isGenerating && (
        <div className="mb-6 flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 px-5 py-4 text-[0.9375rem] text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
          <Loader2 className="size-5 animate-spin" />
          <p>Generating cards from your slides... This may take a minute.</p>
        </div>
      )}

      {status === "error" && cards.length === 0 && (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/5 p-8 text-center text-destructive">
          <p className="mb-4 font-medium">Card generation failed.</p>
          {deck.sourceFileKey && (
            <Button onClick={handleRegenerate}>Try Again</Button>
          )}
        </div>
      )}

      {!isGenerating && (
        <p className="mb-4 text-sm text-muted-foreground">
          {cards.length} {cards.length === 1 ? "card" : "cards"}
        </p>
      )}

      {cards.length === 0 && !isGenerating && status !== "error" ? (
        <div className="rounded-md bg-muted/40 px-8 py-12 text-center text-muted-foreground">
          <p>No cards yet. Upload a PDF and generate cards to get started.</p>
        </div>
      ) : (
        !isGenerating && (
          <div className="flex flex-col gap-2">
            {cards.map((card, index) => (
              <div
                key={card.id}
                className="group flex items-start gap-3 rounded-md border p-3.5 transition-colors hover:border-primary"
              >
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex gap-2 text-sm font-medium">
                    <span className="mt-px flex size-[18px] shrink-0 items-center justify-center rounded-sm bg-blue-100 text-[0.6875rem] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      Q
                    </span>
                    <span dangerouslySetInnerHTML={{ __html: card.front }} />
                  </div>
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <span className="mt-px flex size-[18px] shrink-0 items-center justify-center rounded-sm bg-emerald-100 text-[0.6875rem] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      A
                    </span>
                    <div
                      className="[&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                      dangerouslySetInnerHTML={{ __html: card.back }}
                    />
                  </div>
                </div>
                {card.sourcePageNum && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    p.{card.sourcePageNum}
                  </span>
                )}
                <div className="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto px-2 py-1 text-xs"
                    onClick={() => setEditingCard(card)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto px-2 py-1 text-xs text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm("Delete this card?")) {
                        deleteCard({ deckId: id!, cardId: card.id });
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <Dialog
        open={!!editingCard}
        onOpenChange={(open) => !open && setEditingCard(null)}
      >
        {editingCard && (
          <CardEditor
            card={editingCard}
            deckId={id!}
            onClose={() => setEditingCard(null)}
          />
        )}
      </Dialog>
    </div>
  );
}
