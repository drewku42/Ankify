import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useGetDecksQuery, useDeleteDeckMutation } from "@/store/api";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    draft: { label: "Draft", className: "badge--neutral" },
    uploaded: { label: "Ready", className: "badge--info" },
    generating: { label: "Generating...", className: "badge--warning" },
    ready: { label: "Complete", className: "badge--success" },
    error: { label: "Error", className: "badge--danger" },
  };
  const { label, className } = map[status] || {
    label: status,
    className: "badge--neutral",
  };
  return <span className={`badge ${className}`}>{label}</span>;
}

export default function DashboardPage() {
  const { data, isLoading } = useGetDecksQuery();
  const [deleteDeck] = useDeleteDeckMutation();
  const decks = data?.decks ?? [];

  if (isLoading) {
    return (
      <div className="dashboard">
        <header className="dashboard__header">
          <h1>Your Decks</h1>
        </header>
        <div className="skeleton-list">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h1>Your Decks</h1>
        <Link to="/upload" className="btn btn--primary">
          + New Deck
        </Link>
      </header>

      {decks.length === 0 ? (
        <div className="dashboard__empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <h2>No decks yet</h2>
          <p>Upload your first lecture slides to generate Anki cards with AI.</p>
          <Link to="/upload" className="btn btn--primary">
            Upload PDF
          </Link>
        </div>
      ) : (
        <div className="dashboard__grid">
          {decks.map((deck) => (
            <Link
              to={`/decks/${deck.id}`}
              key={deck.id}
              className="deck-card"
            >
              <div className="deck-card__header">
                <h3 className="deck-card__name">{deck.name}</h3>
                <StatusBadge status={deck.status} />
              </div>
              <div className="deck-card__meta">
                <span>{deck._count?.cards ?? 0} cards</span>
                <span>{deck.sourceFileName || "No file"}</span>
              </div>
              <div className="deck-card__footer">
                <time>
                  {new Date(deck.createdAt).toLocaleDateString()}
                </time>
                <button
                  className="deck-card__delete"
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
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
