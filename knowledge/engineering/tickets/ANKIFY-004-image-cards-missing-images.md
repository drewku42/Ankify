# ANKIFY-004 — Image cards don't actually include images

| Field        | Value                          |
| ------------ | ------------------------------ |
| **Status**   | `cancelled`                    |
| **Priority** | `urgent`                       |
| **Touches**  | ai-server · backend · frontend |
| **Opened**   | 2026-04-19                     |
| **Shipped**  | —                              |

## Resolution

**Cancelled** — Card types (basic, cloze, image) have been removed entirely for v1. All cards are now simple front/back (basic) cards. Image and cloze support is logged as a potential future feature.

### What was removed

- **AI Server**: `CardType` enum deleted, `card_type` field removed from `GeneratedCard`, system prompt simplified to only produce basic Q/A cards, deck exporter stripped of cloze/image models
- **Backend**: `cardType` column dropped from `Card` schema (Prisma migration), removed from all routes (`generate.ts`, `cards.ts`)
- **Frontend**: `CardTypeIcon` component removed, card type badges removed from DeckPage, `cardType` removed from `Card` interface and `updateCard` mutation, `.card-type` SCSS styles removed

### Future feature ideas

- **Cloze cards**: Re-add `card_type` field, teach the AI to produce cloze syntax, restore `CLOZE_MODEL` in exporter
- **Image cards**: Requires full pipeline — PDF image extraction → storage → media attachment → rendering. Most complex feature. Consider as a v2 epic.

## Original issue

Cards typed as "image" in the generated output do not actually contain or render images. The card type exists in the data model and generation output, but the image content is missing. The pipeline breaks somewhere between AI generation and rendering.

## Out of scope

- User-uploaded images for cards (only AI-extracted from slides)
- Image annotation or cropping tools
