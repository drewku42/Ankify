import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { config } from "../config";
import { getFile } from "../lib/storage";
import { asyncHandler } from "../lib/errors";

interface AiCard {
  card_type: string;
  front: string;
  back: string;
  source_page: number;
  tags: string[];
}

interface AiGenerateResponse {
  deck: { cards: AiCard[] };
  page_count: number;
  processing_time_seconds: number;
}

const router = Router();
router.use(requireAuth);

router.post("/deck/:deckId", asyncHandler(async (req: Request, res: Response) => {
  const deck = await prisma.deck.findFirst({
    where: { id: req.params.deckId as string, userId: req.authUser!.id },
  });

  if (!deck) {
    res.status(404).json({ error: "Deck not found", code: "DECK_NOT_FOUND" });
    return;
  }

  if (!deck.sourceFileKey) {
    res.status(400).json({ error: "Deck has no uploaded PDF", code: "NO_PDF_UPLOADED" });
    return;
  }

  await prisma.deck.update({
    where: { id: deck.id },
    data: { status: "generating" },
  });

  try {
    const pdfBuffer = await getFile(config.s3.bucketUploads, deck.sourceFileKey);

    const formData = new FormData();
    formData.append(
      "file",
      new Blob([pdfBuffer], { type: "application/pdf" }),
      deck.sourceFileName || "upload.pdf"
    );
    if (deck.name) {
      formData.append("deck_name", deck.name);
    }

    const aiResponse = await fetch(`${config.aiServer.url}/generate/deck`, {
      method: "POST",
      body: formData,
    });

    if (!aiResponse.ok) {
      const err = await aiResponse.text();
      throw new Error(`AI server error: ${aiResponse.status} ${err}`);
    }

    const result = (await aiResponse.json()) as AiGenerateResponse;
    const generatedCards = result.deck.cards;

    await prisma.card.deleteMany({ where: { deckId: deck.id } });

    const cardData = generatedCards.map((card, index) => ({
      deckId: deck.id,
      cardType: card.card_type,
      front: card.front,
      back: card.back,
      sourcePageNum: card.source_page,
      sortOrder: index,
    }));

    await prisma.card.createMany({ data: cardData });

    await prisma.deck.update({
      where: { id: deck.id },
      data: { status: "ready" },
    });

    const updatedDeck = await prisma.deck.findUnique({
      where: { id: deck.id },
      include: {
        cards: { orderBy: { sortOrder: "asc" }, include: { media: true } },
      },
    });

    res.json({
      deck: updatedDeck,
      generation: {
        page_count: result.page_count,
        processing_time_seconds: result.processing_time_seconds,
        card_count: generatedCards.length,
      },
    });
  } catch (err: unknown) {
    await prisma.deck.update({
      where: { id: deck.id },
      data: { status: "error" },
    });

    const message = err instanceof Error ? err.message : "Unknown error";
    const cause =
      err instanceof Error && err.cause != null
        ? String(err.cause)
        : "";
    const detail = [message, cause].filter(Boolean).join(" | ");
    console.error(
      "Generation failed:",
      message,
      cause || "",
      "url=",
      `${config.aiServer.url}/generate/deck`
    );
    res.status(500).json({ error: "Card generation failed", code: "GENERATION_FAILED", detail });
  }
}));

router.post("/card/:deckId/:cardId", asyncHandler(async (req: Request, res: Response) => {
  const deck = await prisma.deck.findFirst({
    where: { id: req.params.deckId as string, userId: req.authUser!.id },
  });

  if (!deck) {
    res.status(404).json({ error: "Deck not found", code: "DECK_NOT_FOUND" });
    return;
  }

  const card = await prisma.card.findFirst({
    where: { id: req.params.cardId as string, deckId: deck.id },
  });

  if (!card) {
    res.status(404).json({ error: "Card not found", code: "CARD_NOT_FOUND" });
    return;
  }

  // TODO: Call AI server to regenerate a single card based on the source page
  res.status(501).json({ error: "Single card regeneration not yet implemented" });
}));

router.post("/export/:deckId", asyncHandler(async (req: Request, res: Response) => {
  const deck = await prisma.deck.findFirst({
    where: { id: req.params.deckId as string, userId: req.authUser!.id },
    include: { cards: { orderBy: { sortOrder: "asc" } } },
  });

  if (!deck) {
    res.status(404).json({ error: "Deck not found", code: "DECK_NOT_FOUND" });
    return;
  }

  if (deck.cards.length === 0) {
    res.status(400).json({ error: "Deck has no cards to export" });
    return;
  }

  try {
    const exportPayload = {
      deck_name: deck.name,
      cards: deck.cards.map((card) => ({
        card_type: card.cardType,
        front: card.front,
        back: card.back,
        source_page: card.sourcePageNum || 0,
        tags: [],
      })),
    };

    const aiResponse = await fetch(
      `${config.aiServer.url}/generate/export/download`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exportPayload),
      }
    );

    if (!aiResponse.ok) {
      const err = await aiResponse.text();
      throw new Error(`Export failed: ${aiResponse.status} ${err}`);
    }

    const apkgBuffer = await aiResponse.arrayBuffer();
    const safeName = deck.name.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");

    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}.apkg"`);
    res.send(Buffer.from(apkgBuffer));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Export failed:", message);
    res.status(500).json({ error: "Export failed", code: "EXPORT_FAILED", detail: message });
  }
}));

export default router;
