import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  useGetDeckQuery,
  useUpdateCardMutation,
  useDeleteCardMutation,
  useGenerateDeckMutation,
  useDeleteDeckMutation,
  type Card,
} from "@/store/api";
import { API_URL } from "@/config";

function CardTypeIcon({ type }: { type: string }) {
  if (type === "cloze")
    return <span className="card-type card-type--cloze">Cloze</span>;
  if (type === "image")
    return <span className="card-type card-type--image">Image</span>;
  return <span className="card-type card-type--basic">Basic</span>;
}

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
    await updateCard({
      deckId,
      cardId: card.id,
      front,
      back,
    }).unwrap();
    onClose();
  };

  return (
    <div className="card-editor-overlay" onClick={onClose}>
      <div className="card-editor" onClick={(e) => e.stopPropagation()}>
        <div className="card-editor__header">
          <h3>Edit Card</h3>
          <CardTypeIcon type={card.cardType} />
        </div>

        <label className="card-editor__label">
          Front
          <textarea
            className="card-editor__textarea"
            value={front}
            onChange={(e) => setFront(e.target.value)}
            rows={4}
          />
        </label>

        <label className="card-editor__label">
          Back
          <textarea
            className="card-editor__textarea"
            value={back}
            onChange={(e) => setBack(e.target.value)}
            rows={4}
          />
        </label>

        {card.sourcePageNum && (
          <p className="card-editor__source">
            Source: Slide {card.sourcePageNum}
          </p>
        )}

        <div className="card-editor__actions">
          <button className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn--primary"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DeckPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useGetDeckQuery(id!);
  const [generateDeck, { isLoading: isGenerating }] =
    useGenerateDeckMutation();
  const [deleteCard] = useDeleteCardMutation();
  const [deleteDeck] = useDeleteDeckMutation();
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const deck = data?.deck;
  const cards = deck?.cards ?? [];

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
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleRegenerate = async () => {
    if (!id) return;
    if (!confirm("Regenerate all cards? This will replace existing cards."))
      return;
    await generateDeck(id).unwrap();
    refetch();
  };

  const handleDeleteDeck = async () => {
    if (!id) return;
    if (!confirm("Delete this entire deck?")) return;
    await deleteDeck(id).unwrap();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="deck-page">
        <div className="deck-page__header">
          <div className="skeleton-text skeleton-text--lg" />
        </div>
        <div className="skeleton-list">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="deck-page">
        <h1>Deck not found</h1>
        <Link to="/" className="btn btn--ghost">
          Back to Decks
        </Link>
      </div>
    );
  }

  return (
    <div className="deck-page">
      <div className="deck-page__header">
        <div>
          <Link to="/" className="deck-page__back">
            &larr; All Decks
          </Link>
          <h1>{deck.name}</h1>
          {deck.sourceFileName && (
            <p className="deck-page__source">
              From: {deck.sourceFileName}
            </p>
          )}
        </div>
        <div className="deck-page__actions">
          {deck.sourceFileKey && (
            <button
              className="btn btn--ghost"
              onClick={handleRegenerate}
              disabled={isGenerating}
            >
              {isGenerating ? "Regenerating..." : "Regenerate"}
            </button>
          )}
          <button
            className="btn btn--primary"
            onClick={handleExport}
            disabled={isExporting || cards.length === 0}
          >
            {isExporting ? "Exporting..." : "Export .apkg"}
          </button>
          <button className="btn btn--danger" onClick={handleDeleteDeck}>
            Delete
          </button>
        </div>
      </div>

      {isGenerating && (
        <div className="deck-page__generating">
          <span className="spinner" />
          <p>
            Generating cards from your slides... This may take a minute.
          </p>
        </div>
      )}

      <p className="deck-page__count">
        {cards.length} {cards.length === 1 ? "card" : "cards"}
      </p>

      {cards.length === 0 && !isGenerating ? (
        <div className="deck-page__empty">
          <p>No cards yet. Upload a PDF and generate cards to get started.</p>
        </div>
      ) : (
        <div className="card-list">
          {cards.map((card, index) => (
            <div key={card.id} className="card-item">
              <div className="card-item__number">{index + 1}</div>
              <div className="card-item__content">
                <div className="card-item__front">
                  <span className="card-item__label">Q</span>
                  <span
                    dangerouslySetInnerHTML={{ __html: card.front }}
                  />
                </div>
                <div className="card-item__back">
                  <span className="card-item__label">A</span>
                  <span
                    dangerouslySetInnerHTML={{ __html: card.back }}
                  />
                </div>
              </div>
              <div className="card-item__meta">
                <CardTypeIcon type={card.cardType} />
                {card.sourcePageNum && (
                  <span className="card-item__page">
                    p.{card.sourcePageNum}
                  </span>
                )}
              </div>
              <div className="card-item__actions">
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => setEditingCard(card)}
                >
                  Edit
                </button>
                <button
                  className="btn btn--ghost btn--sm btn--danger-text"
                  onClick={() => {
                    if (confirm("Delete this card?")) {
                      deleteCard({ deckId: id!, cardId: card.id });
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingCard && (
        <CardEditor
          card={editingCard}
          deckId={id!}
          onClose={() => setEditingCard(null)}
        />
      )}
    </div>
  );
}
