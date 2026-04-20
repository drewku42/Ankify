# ANKIFY-004 — Image cards don't actually include images


| Field        | Value                          |
| ------------ | ------------------------------ |
| **Status**   | `open`                         |
| **Priority** | `urgent`                       |
| **Touches**  | ai-server · backend · frontend |
| **Opened**   | 2026-04-19                     |
| **Shipped**  | —                              |


## Original issue

Cards typed as "image" in the generated output do not actually contain or render images. The card type exists in the data model and generation output, but the image content is missing. The pipeline breaks somewhere between AI generation and rendering.

Known from onboarding: `CardMedia` model exists in Prisma but `generate.ts` creates cards via `createMany` without creating any CardMedia rows. The AI response doesn't include media that gets persisted.

## Fix

Investigate and fix the full pipeline:

1. **AI server** — Ensure image cards reference extractable slide images. Images from PDF rendering should be stored and their paths/keys included in the AI response payload.
2. **Backend** — When persisting AI-generated cards, create `CardMedia` rows for image cards with the correct `fileKey`, `fileName`, `mimeType`. Store image files via the storage driver.
3. **Frontend** — Render image cards with their associated media (using `CardMedia.fileKey` to build the image URL). Differentiate image cards visually from basic/cloze.
4. **Export** — Ensure `.apkg` export includes images in the media mapping so they display in Anki.

## Expected behavior

- Image cards show the relevant slide image in the review/edit UI
- Image cards are visually distinct from basic and cloze cards
- Exported `.apkg` files include images — they render correctly in Anki Desktop
- Images are sourced from actual slide content, not placeholders

## QA checklist

- Upload a PDF with image-heavy slides → generation completes
- Check DeckPage → image cards display the actual slide image
- Image cards look different from basic/cloze cards in the UI
- Edit an image card → image still visible
- Export the deck as `.apkg` → open in Anki Desktop → images render
- Verify images are not broken/placeholder/missing in the Anki import

## Out of scope

- User-uploaded images for cards (only AI-extracted from slides)
- Image annotation or cropping tools

## Notes

This touches all three services. Deepest pipeline fix in Sprint 0. Check `knowledge/engineering/anki/` for `.apkg` media mapping requirements. Needs investigation before committing to a solution — start with the AI server response to understand what's currently being returned for image cards.