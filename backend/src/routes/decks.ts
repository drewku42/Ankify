import { Router, Request, Response } from "express";
import fs from "fs/promises";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { pdfUpload } from "../middleware/upload";
import { uploadFile } from "../lib/storage";
import { config } from "../config";
import { asyncHandler } from "../lib/errors";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(async (req: Request, res: Response) => {
  const decks = await prisma.deck.findMany({
    where: { userId: req.authUser!.id },
    include: { _count: { select: { cards: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ decks });
}));

router.post(
  "/",
  pdfUpload.single("file"),
  asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: "Deck name is required", code: "VALIDATION_ERROR" });
      return;
    }

    let sourceFileKey: string | null = null;
    let sourceFileName: string | null = null;

    try {
      if (req.file) {
        const key = `uploads/${req.authUser!.id}/${Date.now()}_${req.file.originalname}`;
        const buffer = await fs.readFile(req.file.path);
        await uploadFile(
          config.s3.bucketUploads,
          key,
          buffer,
          req.file.mimetype
        );
        sourceFileKey = key;
        sourceFileName = req.file.originalname;
      }

      const deck = await prisma.deck.create({
        data: {
          name,
          userId: req.authUser!.id,
          sourceFileKey,
          sourceFileName,
          status: req.file ? "uploaded" : "draft",
        },
      });

      res.status(201).json({ deck });
    } finally {
      if (req.file?.path) {
        fs.unlink(req.file.path).catch(() => {});
      }
    }
  }),
);

router.get("/:id", asyncHandler(async (req: Request, res: Response) => {
  const deck = await prisma.deck.findFirst({
    where: { id: req.params.id as string, userId: req.authUser!.id },
    include: {
      cards: {
        orderBy: { sortOrder: "asc" },
        include: { media: true },
      },
    },
  });

  if (!deck) {
    res.status(404).json({ error: "Deck not found", code: "DECK_NOT_FOUND" });
    return;
  }

  res.json({ deck });
}));

router.put("/:id", asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body;

  const deck = await prisma.deck.findFirst({
    where: { id: req.params.id as string, userId: req.authUser!.id },
  });

  if (!deck) {
    res.status(404).json({ error: "Deck not found", code: "DECK_NOT_FOUND" });
    return;
  }

  const updated = await prisma.deck.update({
    where: { id: deck.id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
    },
  });

  res.json({ deck: updated });
}));

router.delete("/:id", asyncHandler(async (req: Request, res: Response) => {
  const deck = await prisma.deck.findFirst({
    where: { id: req.params.id as string, userId: req.authUser!.id },
  });

  if (!deck) {
    res.status(404).json({ error: "Deck not found", code: "DECK_NOT_FOUND" });
    return;
  }

  await prisma.deck.delete({ where: { id: deck.id } });
  res.json({ success: true });
}));

export default router;
