import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.put("/:deckId/cards/:cardId", async (req: Request, res: Response) => {
  const { front, back, cardType } = req.body;

  const deck = await prisma.deck.findFirst({
    where: { id: req.params.deckId as string, userId: req.authUser!.id },
  });

  if (!deck) {
    res.status(404).json({ error: "Deck not found" });
    return;
  }

  const card = await prisma.card.findFirst({
    where: { id: req.params.cardId as string, deckId: deck.id },
  });

  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }

  const updated = await prisma.card.update({
    where: { id: card.id },
    data: {
      ...(front !== undefined && { front }),
      ...(back !== undefined && { back }),
      ...(cardType !== undefined && { cardType }),
    },
    include: { media: true },
  });

  res.json({ card: updated });
});

router.delete("/:deckId/cards/:cardId", async (req: Request, res: Response) => {
  const deck = await prisma.deck.findFirst({
    where: { id: req.params.deckId as string, userId: req.authUser!.id },
  });

  if (!deck) {
    res.status(404).json({ error: "Deck not found" });
    return;
  }

  const card = await prisma.card.findFirst({
    where: { id: req.params.cardId as string, deckId: deck.id },
  });

  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }

  await prisma.card.delete({ where: { id: card.id } });
  res.json({ success: true });
});

export default router;
