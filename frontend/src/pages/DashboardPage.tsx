import { Link } from "react-router-dom";

export default function DashboardPage() {
  const decks: unknown[] = []; // TODO: wire to RTK Query

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h1>Your Decks</h1>
        <Link to="/upload" className="dashboard__new-btn">
          + New Deck
        </Link>
      </header>

      {decks.length === 0 ? (
        <div className="dashboard__empty">
          <h2>No decks yet</h2>
          <p>Upload your first lecture slides to get started.</p>
          <Link to="/upload" className="dashboard__empty-cta">
            Upload PDF
          </Link>
        </div>
      ) : (
        <ul className="dashboard__list">
          {/* TODO: deck list items */}
        </ul>
      )}
    </div>
  );
}
