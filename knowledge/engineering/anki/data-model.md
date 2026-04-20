# Anki Data Model

> Detailed entity relationships for agents implementing the card generator.
> Source: [https://docs.ankiweb.net/getting-started.html](https://docs.ankiweb.net/getting-started.html), AnkiDroid wiki, Eiko Wagenknecht's APKG format analysis.

## Entity Relationship Diagram (Conceptual)

```
Collection (1)
 ├── has many → Decks
 ├── has many → Note Types (Models)
 │                ├── has many → Fields (ordered)
 │                └── has many → Card Types (Templates)
 │                     ├── front template (HTML)
 │                     ├── back template (HTML)
 │                     └── shared CSS
 └── has many → Notes
                  ├── belongs to → Note Type
                  ├── has many → field values (ordered, matching Note Type fields)
                  ├── has many → Tags
                  └── generates → Cards (one per Card Type)
                                   └── belongs to → Deck
```

## Entities in Detail

### Note Type (Model)

Defines the schema for a category of notes.


| Property    | Type    | Description                                       |
| ----------- | ------- | ------------------------------------------------- |
| `id`        | integer | Epoch milliseconds, unique identifier             |
| `name`      | string  | Display name (e.g., "Basic", "Cloze")             |
| `fields`    | array   | Ordered list of field definitions                 |
| `templates` | array   | Card type definitions (front/back HTML templates) |
| `css`       | string  | Shared CSS for all card types                     |
| `type`      | integer | `0` = standard, `1` = cloze                       |
| `sortField` | integer | Index of field used for sorting in browser        |


Each field definition:


| Property | Type    | Description                                            |
| -------- | ------- | ------------------------------------------------------ |
| `name`   | string  | Field name (used in templates as `{{name}}`)           |
| `ord`    | integer | Display/storage order (0-indexed)                      |
| `sticky` | boolean | Whether field retains value when adding multiple notes |
| `rtl`    | boolean | Right-to-left text direction                           |
| `font`   | string  | Editor font name                                       |
| `size`   | integer | Editor font size                                       |


Each template (card type) definition:


| Property | Type    | Description                                |
| -------- | ------- | ------------------------------------------ |
| `name`   | string  | Card type name (e.g., "Card 1", "Forward") |
| `ord`    | integer | Order (0-indexed)                          |
| `qfmt`   | string  | Front (question) template HTML             |
| `afmt`   | string  | Back (answer) template HTML                |
| `did`    | integer | Deck override (0 = use note's deck)        |


### Note

The raw content from which cards are derived.


| Property | Type    | Description                                                 |
| -------- | ------- | ----------------------------------------------------------- |
| `id`     | integer | Epoch milliseconds, unique identifier                       |
| `guid`   | string  | Globally unique identifier (for sync/import dedup)          |
| `mid`    | integer | Note type (model) ID                                        |
| `mod`    | integer | Last modification timestamp (epoch seconds)                 |
| `tags`   | string  | Space-separated tags                                        |
| `flds`   | string  | Field values joined by `\x1f` (unit separator, ASCII 31)    |
| `sfld`   | string  | Sort field value (first field by default, stripped of HTML) |
| `csum`   | integer | Checksum of first field for quick duplicate detection       |
| `flags`  | integer | Unused, always 0                                            |
| `data`   | string  | Unused, always empty string                                 |


**Critical**: The `flds` column stores ALL field values as a single string, separated by the unit separator character (`\x1f`, ASCII 31). The order matches the field order defined in the note type.

### Card

A reviewable item. Generated automatically from a note + card type.


| Property | Type    | Description                                                                                                                        |
| -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `id`     | integer | Epoch milliseconds                                                                                                                 |
| `nid`    | integer | Note ID (foreign key → notes.id)                                                                                                   |
| `did`    | integer | Deck ID                                                                                                                            |
| `ord`    | integer | Which card type generated this card (0-indexed)                                                                                    |
| `mod`    | integer | Modification timestamp (epoch seconds)                                                                                             |
| `type`   | integer | `0`=new, `1`=learning, `2`=review, `3`=relearning                                                                                  |
| `queue`  | integer | Queue position: `-3`=sched buried, `-2`=user buried, `-1`=suspended, `0`=new, `1`=learning, `2`=review, `3`=day-learn, `4`=preview |
| `due`    | integer | Due position/date (meaning varies by queue type)                                                                                   |
| `ivl`    | integer | Current interval in days (negative = seconds)                                                                                      |
| `factor` | integer | Ease factor (permille, e.g., 2500 = 2.5)                                                                                           |
| `reps`   | integer | Number of reviews                                                                                                                  |
| `lapses` | integer | Number of times card went from review → relearn                                                                                    |
| `left`   | integer | Remaining learning steps                                                                                                           |
| `odue`   | integer | Original due (used in filtered decks)                                                                                              |
| `odid`   | integer | Original deck ID (used in filtered decks)                                                                                          |
| `flags`  | integer | Card flags (for colored markers)                                                                                                   |
| `data`   | string  | Custom data (JSON, used by custom schedulers/FSRS)                                                                                 |


### Deck


| Property    | Type    | Description                               |
| ----------- | ------- | ----------------------------------------- |
| `id`        | integer | Epoch milliseconds (`1` for default deck) |
| `name`      | string  | Deck name (uses `::` for nesting)         |
| `mod`       | integer | Modification timestamp                    |
| `desc`      | string  | Deck description                          |
| `conf`      | integer | Deck config/options group ID              |
| `collapsed` | boolean | Whether collapsed in deck list            |


### Review Log


| Property  | Type    | Description                                             |
| --------- | ------- | ------------------------------------------------------- |
| `id`      | integer | Epoch milliseconds of review                            |
| `cid`     | integer | Card ID                                                 |
| `usn`     | integer | Update sequence number                                  |
| `ease`    | integer | Button pressed: `1`=Again, `2`=Hard, `3`=Good, `4`=Easy |
| `ivl`     | integer | New interval after review                               |
| `lastIvl` | integer | Previous interval                                       |
| `factor`  | integer | New ease factor                                         |
| `time`    | integer | Review duration in milliseconds                         |
| `type`    | integer | `0`=learn, `1`=review, `2`=relearn, `3`=filtered        |


## Key Relationships

```
notes.mid  → col.models[id]     (note belongs to a note type)
cards.nid  → notes.id           (card belongs to a note)
cards.did  → col.decks[id]      (card belongs to a deck)
cards.ord  → model.templates[n] (card was generated by nth template)
revlog.cid → cards.id           (review belongs to a card)
```

**No foreign key constraints exist in the database.** All relationships are implicit and enforced by application logic.

## ID Generation

- Note IDs, Card IDs, Review Log IDs: epoch milliseconds at creation time
- Model IDs: epoch milliseconds (or random in `genanki`)
- Deck IDs: epoch milliseconds (`1` for default deck)
- GUIDs: Base91-encoded random string (10 characters)

## Duplicate Detection

When importing, Anki checks for duplicates using:

1. **First field content** — the `csum` (checksum) of the first field
2. **Note type** — duplicates are scoped to the same note type
3. **GUID** — if present, overrides first-field matching

If a matching note exists and the imported version has a newer `mod` timestamp, the existing note is updated. Otherwise the import is skipped.