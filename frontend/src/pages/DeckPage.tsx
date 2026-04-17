import { useParams } from "react-router-dom";

export default function DeckPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="deck-page">
      <h1>Deck {id}</h1>
      {/* TODO: card list, editor, source page preview, export button */}
    </div>
  );
}
