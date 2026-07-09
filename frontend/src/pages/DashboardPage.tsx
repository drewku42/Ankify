import { Link } from "react-router-dom";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { useGetDecksQuery, useDeleteDeckMutation } from "@/store/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
    uploaded: { label: "Ready", className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
    generating: { label: "Generating...", className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
    ready: { label: "Complete", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
    error: { label: "Error", className: "bg-destructive/10 text-destructive" },
  };
  const { label, className } = map[status] || {
    label: status,
    className: "bg-muted text-muted-foreground",
  };
  return (
    <Badge variant="secondary" className={className}>
      {label}
    </Badge>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useGetDecksQuery();
  const [deleteDeck] = useDeleteDeckMutation();
  const decks = data?.decks ?? [];

  if (isLoading) {
    return (
      <div>
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Your Decks</h1>
        </header>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your Decks</h1>
        <Button asChild>
          <Link to="/upload">+ New Deck</Link>
        </Button>
      </header>

      {decks.length === 0 ? (
        <div className="flex flex-col items-center rounded-lg border border-dashed bg-muted/40 px-8 py-16 text-center">
          <UploadCloud className="mb-4 size-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">No decks yet</h2>
          <p className="mb-6 max-w-sm text-muted-foreground">
            Upload your first lecture slides to generate Anki cards with AI.
          </p>
          <Button asChild>
            <Link to="/upload">Upload PDF</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {decks.map((deck) => (
            <Card
              key={deck.id}
              className="group gap-0 p-5 transition-colors hover:border-primary"
            >
              <Link to={`/decks/${deck.id}`} className="flex flex-col">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{deck.name}</h3>
                  <StatusBadge status={deck.status} />
                </div>
                <div className="mb-3 flex gap-4 text-[0.8125rem] text-muted-foreground">
                  <span>{deck._count?.cards ?? 0} cards</span>
                  <span className="truncate">
                    {deck.sourceFileName || "No file"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <time className="text-xs text-muted-foreground">
                    {new Date(deck.createdAt).toLocaleDateString()}
                  </time>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-destructive"
                    onClick={async (e) => {
                      e.preventDefault();
                      if (confirm("Delete this deck?")) {
                        try {
                          await deleteDeck(deck.id).unwrap();
                          toast.success("Deck deleted");
                        } catch {
                          // Error toast handled by apiErrorMiddleware
                        }
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
