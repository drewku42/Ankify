# Anki Documentation — Card Generator Reference

> This directory contains extracted and synthesized documentation from [Anki's official manual](https://docs.ankiweb.net/) and related technical sources. It serves as the reference knowledge base for agents building the Anki card generator web app.

## Documents


| File                                                     | Purpose                                  | Key Topics                                                                                           |
| -------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `[overview.md](./overview.md)`                           | Domain concepts and terminology          | Collection, Notes, Cards, Decks, Note Types, Tags, Fields                                            |
| `[data-model.md](./data-model.md)`                       | Entity relationships and database schema | Note Type → Note → Card relationships, field definitions, ID generation, duplicate detection         |
| `[apkg-file-format.md](./apkg-file-format.md)`           | .apkg file format technical spec         | ZIP structure, SQLite schema v11, all 5 tables, JSON config structures, APKG build algorithm         |
| `[templates-and-styling.md](./templates-and-styling.md)` | Card template system                     | Mustache-like syntax, field replacement, conditionals, CSS styling, special fields, TTS, media       |
| `[import-export.md](./import-export.md)`                 | Import/export formats and behaviors      | Text/CSV import, .apkg import, file headers, duplicate handling, media import, merge behavior        |
| `[cloze-deletions.md](./cloze-deletions.md)`             | Cloze deletion mechanics                 | Syntax (`{{c1::text::hint}}`), rendering algorithm, nested clozes, Image Occlusion, card counting    |
| `[libraries-and-tools.md](./libraries-and-tools.md)`     | Libraries and APIs for implementation    | JS/TS libs (anki-apkg, sql.js, jszip), Python (genanki), AnkiConnect API, tech stack recommendations |


## Quick Reference: Core Concepts

```
Note Type (Model)          Defines fields + card templates + CSS
    ├── Fields             Ordered list of named fields
    └── Card Types         Template pairs (front HTML + back HTML)

Note                       An instance of a Note Type with field values filled in
    ├── belongs to         one Note Type
    ├── has                field values (joined by \x1f separator)
    ├── has                tags (space-separated)
    └── generates          one Card per Card Type

Card                       A reviewable question/answer pair
    ├── derived from       a Note + Card Type
    └── belongs to         a Deck

Deck                       A group of cards (nestable via :: separator)
```

## Key Implementation Facts

1. **We create Notes, not Cards.** Cards are auto-generated from Notes via templates.
2. **First field = uniqueness key.** Used for duplicate detection on import.
3. **All content is HTML.** Field values and templates are HTML strings.
4. **Target schema v11** for .apkg export (maximum compatibility).
5. **IDs are epoch milliseconds.** Note, Card, Model, and Deck IDs.
6. **Field separator is `\x1f`** (ASCII 31, unit separator) in the database.
7. **Cloze is a special note type** (`type: 1`) with different card generation logic.
8. **No foreign keys in the DB.** All relationships are enforced by application logic.

## Source URLs

- Official Manual: [https://docs.ankiweb.net/](https://docs.ankiweb.net/)
- APKG Format Analysis: [https://eikowagenknecht.com/posts/understanding-the-anki-apkg-format/](https://eikowagenknecht.com/posts/understanding-the-anki-apkg-format/)
- APKG Legacy 2 Details: [https://eikowagenknecht.com/posts/understanding-the-anki-apkg-format-legacy-2/](https://eikowagenknecht.com/posts/understanding-the-anki-apkg-format-legacy-2/)
- Database Schema (AnkiDroid Wiki): [https://github.com/ankidroid/Anki-Android/wiki/Database-Structure-2026](https://github.com/ankidroid/Anki-Android/wiki/Database-Structure-2026)
- Anki Source (schema11.sql): [https://github.com/ankitects/anki/blob/main/rslib/src/storage/schema11.sql](https://github.com/ankitects/anki/blob/main/rslib/src/storage/schema11.sql)
- genanki: [https://github.com/kerrickstaley/genanki](https://github.com/kerrickstaley/genanki)
- AnkiConnect: [https://github.com/amikey/anki-connect](https://github.com/amikey/anki-connect)
- anki-apkg (npm): [https://github.com/NdYAG/anki-apkg](https://github.com/NdYAG/anki-apkg)

