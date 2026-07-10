import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../lib/errors";

const router = Router();
router.use(requireAuth);

router.put(
  "/:deckId/cards/:cardId",
  asyncHandler(async (req: Request, res: Response) => {
    const { front, back } = req.body;

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

    const updated = await prisma.card.update({
      where: { id: card.id },
      data: {
        ...(front !== undefined && { front }),
        ...(back !== undefined && { back }),
      },
      include: { media: true },
    });

    res.json({ card: updated });
  }),
);

router.delete(
  "/:deckId/cards/:cardId",
  asyncHandler(async (req: Request, res: Response) => {
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

    await prisma.card.delete({ where: { id: card.id } });
    res.json({ success: true });
  }),
);

export default router;
