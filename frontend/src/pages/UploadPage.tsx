import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FileText, UploadCloud, Loader2 } from "lucide-react";
import { useCreateDeckMutation } from "@/store/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
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
    },
    [name],
  );

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
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">Create New Deck</h1>
      <p className="mt-1 mb-8 text-muted-foreground">
        Upload lecture slides and let AI generate your Anki cards.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid gap-1.5">
          <Label htmlFor="deck-name">Deck Name</Label>
          <Input
            id="deck-name"
            type="text"
            placeholder="e.g. Cardiovascular System"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isCreating}
          />
        </div>

        <div
          className={cn(
            "cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
            file
              ? "border-solid border-emerald-500 bg-emerald-50 text-left dark:bg-emerald-950/30"
              : dragActive
                ? "border-primary bg-accent"
                : "border-border hover:border-primary hover:bg-accent",
          )}
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
            <div className="flex items-center gap-3">
              <FileText className="size-6 shrink-0 text-emerald-600" />
              <div className="min-w-0">
                <p className="truncate text-[0.9375rem] font-medium">
                  {file.name}
                </p>
                <p className="text-[0.8125rem] text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <UploadCloud className="size-10 text-muted-foreground" />
              <p className="text-[0.9375rem]">
                <strong>Drop your PDF here</strong> or click to browse
              </p>
              <p className="text-[0.8125rem] text-muted-foreground">
                PDF files only
              </p>
            </div>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={isCreating || !name.trim() || !file}
        >
          {isCreating ? (
            <>
              <Loader2 className="animate-spin" /> Uploading...
            </>
          ) : (
            "Generate Anki Cards"
          )}
        </Button>
      </form>
    </div>
  );
}
