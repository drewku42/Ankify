import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useCreateDeckMutation } from "@/store/api";

export default function UploadPage() {
  const navigate = useNavigate();
  const [createDeck] = useCreateDeckMutation();

  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === "application/pdf") {
      setFile(droppedFile);
      if (!name) {
        setName(droppedFile.name.replace(/\.pdf$/i, ""));
      }
    } else {
      toast.warning("Please upload a PDF file");
    }
  }, [name]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (!name) {
        setName(selected.name.replace(/\.pdf$/i, ""));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning("Please enter a deck name");
      return;
    }
    if (!file) {
      toast.warning("Please upload a PDF file");
      return;
    }

    setIsCreating(true);

    try {
      const result = await createDeck({ name: name.trim(), file }).unwrap();
      navigate(`/decks/${result.deck.id}`);
    } catch {
      setIsCreating(false);
    }
  };

  return (
    <div className="upload-page">
      <h1>Create New Deck</h1>
      <p className="upload-page__subtitle">
        Upload lecture slides and let AI generate your Anki cards.
      </p>

      <form onSubmit={handleSubmit} className="upload-form">
        <label className="upload-form__label">
          Deck Name
          <input
            type="text"
            className="upload-form__input"
            placeholder="e.g. Cardiovascular System"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isCreating}
          />
        </label>

        <div
          className={`upload-zone ${dragActive ? "upload-zone--active" : ""} ${file ? "upload-zone--has-file" : ""}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            hidden
          />
          {file ? (
            <div className="upload-zone__file">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <div>
                <p className="upload-zone__filename">{file.name}</p>
                <p className="upload-zone__size">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <button
                type="button"
                className="upload-zone__remove"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="upload-zone__placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p>
                <strong>Drop your PDF here</strong> or click to browse
              </p>
              <p className="upload-zone__hint">PDF files only</p>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn--primary btn--lg"
          disabled={isCreating || !name.trim() || !file}
        >
          {isCreating ? (
            <>
              <span className="spinner spinner--sm" /> Uploading...
            </>
          ) : (
            "Generate Anki Cards"
          )}
        </button>
      </form>
    </div>
  );
}
