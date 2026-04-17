# Anki Overview

> Reference for agents building the Anki card generator web app.
> Source: [https://docs.ankiweb.net/getting-started.html](https://docs.ankiweb.net/getting-started.html)

## What is Anki?

Anki is a spaced-repetition flashcard program. Users create **notes** (facts), which generate **cards** (reviewable question/answer pairs). Anki schedules cards for review using an algorithm that spaces reviews further apart as the user demonstrates mastery.

The ecosystem includes:

- **Anki** (desktop — Windows, macOS, Linux)
- **AnkiMobile** (iOS, paid)
- **AnkiDroid** (Android, free)
- **AnkiWeb** (browser-based sync & review)

## Core Domain Concepts

### Collection

Everything a user has in Anki: cards, notes, decks, note types, deck options, etc. Stored in a single SQLite database (`collection.anki2`).

### Notes

A **note** is a collection of related fields — the raw content from which cards are generated. A note is NOT a card. One note can produce multiple cards via card templates.

Example note with three fields:

```
French: Bonjour
English: Hello
Page: 12
```

### Fields

Each piece of data in a note. Fields are defined by the note type. Reserved field names that cannot be used: `Tags`, `Type`, `Deck`, `Card`, `FrontSide`.

### Cards

A **card** is a single question/answer pair derived from a note. Cards are what users actually review. One note can generate multiple cards (e.g., a forward card and a reverse card).

Card states:


| State        | Description                                               |
| ------------ | --------------------------------------------------------- |
| **New**      | Never studied. Waiting in the new queue.                  |
| **Learning** | Recently introduced, still in initial learning steps.     |
| **Review**   | Graduated from learning. Has an interval for next review. |
| **Relearn**  | Previously known but forgotten. Back in learning steps.   |


Review cards are further classified:

- **Young**: interval < 21 days
- **Mature**: interval ≥ 21 days

### Decks

A **deck** is a group of cards. Decks can be nested using `::` as separator (e.g., `French::Vocabulary`). Each deck can have its own scheduling options.

Key behaviors:

- Studying a parent deck includes all subdeck cards
- Decks are sorted alphabetically in the list
- The `Default` deck is hidden when empty and other decks exist
- Best used for broad categories, NOT fine-grained topics (use tags instead)

### Note Types (Models)

A **note type** defines:

1. Which **fields** a note has
2. Which **card types** (templates) generate cards from those fields

Built-in note types:


| Note Type                     | Fields                              | Cards Generated                                   |
| ----------------------------- | ----------------------------------- | ------------------------------------------------- |
| **Basic**                     | Front, Back                         | 1 (front→back)                                    |
| **Basic (and reversed)**      | Front, Back                         | 2 (front→back, back→front)                        |
| **Basic (optional reversed)** | Front, Back, Add Reverse            | 1 or 2 (reverse only if Add Reverse is non-empty) |
| **Basic (type in answer)**    | Front, Back                         | 1 (with answer typing)                            |
| **Cloze**                     | Text, Extra                         | 1 per cloze deletion                              |
| **Image Occlusion**           | Image, Header, Back Extra, Comments | 1 per occluded region                             |


Note types are collection-wide, not deck-specific. A single deck can contain cards from multiple note types, and cards from the same note can go to different decks.

### Card Types (Templates)

Each note type has one or more **card types**. A card type is a template pair:

- **Front template** (question side)
- **Back template** (answer side)

Templates use Mustache-like `{{FieldName}}` syntax for field replacement.

Example front template:

```html
What's the capital city of {{Country}}?
```

Example back template:

```html
{{FrontSide}}
<hr id=answer>
{{Capital}}
```

### Tags

Labels attached to notes for organization and searching. Tags are space-separated. Tags can be hierarchical using `::` (e.g., `chapter::1`). Tags apply at the note level (all cards from a tagged note inherit the tag).

## Key Principles for Our Generator

1. **We create notes, not cards directly.** Cards are generated from notes via templates.
2. **The first field is the uniqueness key.** Anki uses it for duplicate detection on import.
3. **Fields are HTML.** All field content is stored as HTML strings.
4. **Templates are HTML + CSS.** Card appearance is fully customizable via web technologies.
5. **Media is referenced in fields**, not in templates (e.g., `<img src="image.jpg">`, `[sound:audio.mp3]`).
6. **IDs are epoch milliseconds.** Note IDs, card IDs, and model IDs are all timestamps in milliseconds.
7. **GUIDs ensure global uniqueness.** Each note has a GUID for cross-collection dedup.

