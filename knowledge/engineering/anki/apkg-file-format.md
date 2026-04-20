# APKG File Format Specification

> Technical specification for agents implementing .apkg import/export.
> Sources: Eiko Wagenknecht's APKG format analysis, AnkiDroid wiki (Database-Structure-2026), Anki source code.

## Overview

An `.apkg` file is a **ZIP archive** containing a SQLite database, media mapping, and media files. This is the format used for sharing and importing decks.

There are two package types:

- **Deck package** (`.apkg`): Contains a single deck and its subdecks. Merges into existing collection on import.
- **Collection package** (`.colpkg`): Contains the entire collection. **Replaces** the existing collection on import.

## Format Versions


| Feature              | Legacy 1             | Legacy 2 (target)    | Latest                          |
| -------------------- | -------------------- | -------------------- | ------------------------------- |
| **Database file**    | `collection.anki2`   | `collection.anki21`  | `collection.anki21b`            |
| **Schema version**   | v11                  | v11                  | v18                             |
| **Number of tables** | 5                    | 5                    | 12                              |
| **ZIP compression**  | deflate              | deflate              | store (db compressed with zstd) |
| **Config storage**   | JSON in TEXT columns | JSON in TEXT columns | Protobuf in BLOB columns        |
| **Introduced**       | 2012 (Anki 2.0)      | 2018 (Anki 2.1)      | 2020-2022 (Anki 2.1.50+)        |


**We should target Legacy 2 (schema v11)** for maximum compatibility. Desktop Anki internally upgrades to v18 but downgrades back to v11 for `.apkg` exports. v11 is the correct target for any tool that reads/writes Anki packages.

## File Structure (Legacy 2)

```
my-deck.apkg (ZIP archive)
├── collection.anki2     # Compatibility DB (dummy content for old clients)
├── collection.anki21    # Main SQLite database (deflate compressed)
├── meta                 # Format metadata (Protobuf)
├── media                # Media file mapping (JSON)
├── 0                    # First media file (renamed)
├── 1                    # Second media file (renamed)
└── ...                  # Additional media files
```

### `media` file

JSON object mapping numeric string keys to original filenames:

```json
{
  "0": "image.jpg",
  "1": "audio.mp3",
  "2": "photo.png"
}
```

Media files are stored in the ZIP root with their numeric names (`0`, `1`, `2`, ...).

### `meta` file

Binary Protobuf message containing format version information. For Legacy 2, the version field is `2`.

## Database Schema (v11)

The `collection.anki21` file is a SQLite database with 5 tables:

### `col` table (Collection — single row)

```sql
CREATE TABLE col (
    id     integer PRIMARY KEY,   -- always 1
    crt    integer NOT NULL,      -- collection creation time (epoch seconds)
    mod    integer NOT NULL,      -- last modification time (epoch milliseconds)
    scm    integer NOT NULL,      -- schema modification time (epoch milliseconds)
    ver    integer NOT NULL,      -- schema version (always 11)
    dty    integer NOT NULL,      -- dirty flag, unused, always 0
    usn    integer NOT NULL,      -- update sequence number for sync
    ls     integer NOT NULL,      -- last sync time (epoch milliseconds)
    conf   text NOT NULL,         -- global config JSON
    models text NOT NULL,         -- note types JSON (keyed by model ID)
    decks  text NOT NULL,         -- decks JSON (keyed by deck ID)
    dconf  text NOT NULL,         -- deck config/options JSON
    tags   text NOT NULL          -- tag cache JSON
);
```

### `notes` table

```sql
CREATE TABLE notes (
    id    integer PRIMARY KEY,    -- epoch milliseconds
    guid  text NOT NULL,          -- globally unique id (base91, ~10 chars)
    mid   integer NOT NULL,       -- model (note type) id
    mod   integer NOT NULL,       -- modification time (epoch seconds)
    usn   integer NOT NULL,       -- update sequence number
    tags  text NOT NULL,          -- space-separated tags
    flds  text NOT NULL,          -- field values joined by \x1f (unit separator)
    sfld  integer NOT NULL,       -- sort field (first field, HTML stripped)
    csum  integer NOT NULL,       -- checksum of first field (for dupe detection)
    flags integer NOT NULL,       -- unused, 0
    data  text NOT NULL           -- unused, empty string
);
```

### `cards` table

```sql
CREATE TABLE cards (
    id     integer PRIMARY KEY,   -- epoch milliseconds
    nid    integer NOT NULL,      -- note id → notes.id
    did    integer NOT NULL,      -- deck id
    ord    integer NOT NULL,      -- card type ordinal (0-indexed)
    mod    integer NOT NULL,      -- modification time (epoch seconds)
    usn    integer NOT NULL,      -- update sequence number
    type   integer NOT NULL,      -- 0=new, 1=learning, 2=review, 3=relearning
    queue  integer NOT NULL,      -- -3=sched buried, -2=user buried, -1=suspended, 0=new, 1=learn, 2=review, 3=day-learn, 4=preview
    due    integer NOT NULL,      -- due date/position
    ivl    integer NOT NULL,      -- interval (days, negative=seconds)
    factor integer NOT NULL,      -- ease factor (permille, 2500=250%)
    reps   integer NOT NULL,      -- review count
    lapses integer NOT NULL,      -- lapse count
    left   integer NOT NULL,      -- remaining reps in learning
    odue   integer NOT NULL,      -- original due (filtered decks)
    odid   integer NOT NULL,      -- original deck id (filtered decks)
    flags  integer NOT NULL,      -- card flags
    data   text NOT NULL          -- custom data (JSON)
);
```

### `revlog` table

```sql
CREATE TABLE revlog (
    id      integer PRIMARY KEY,  -- epoch milliseconds of review
    cid     integer NOT NULL,     -- card id
    usn     integer NOT NULL,     -- update sequence number
    ease    integer NOT NULL,     -- 1=Again, 2=Hard, 3=Good, 4=Easy
    ivl     integer NOT NULL,     -- new interval
    lastIvl integer NOT NULL,     -- previous interval
    factor  integer NOT NULL,     -- new ease factor
    time    integer NOT NULL,     -- review time (milliseconds)
    type    integer NOT NULL      -- 0=learn, 1=review, 2=relearn, 3=filtered
);
```

### `graves` table (Sync tombstones)

```sql
CREATE TABLE graves (
    usn  integer NOT NULL,
    oid  integer NOT NULL,        -- original id of deleted object
    type integer NOT NULL         -- 0=card, 1=note, 2=deck
);
```

### Indexes

```sql
CREATE INDEX ix_cards_nid ON cards (nid);
CREATE INDEX ix_cards_sched ON cards (did, queue, due);
CREATE INDEX ix_cards_usn ON cards (usn);
CREATE INDEX ix_notes_csum ON notes (csum);
CREATE INDEX ix_notes_usn ON notes (usn);
CREATE INDEX ix_revlog_cid ON revlog (cid);
CREATE INDEX ix_revlog_usn ON revlog (usn);
```

## JSON Configuration Structures

### `col.models` — Note Types

```json
{
  "1607392319": {
    "id": 1607392319,
    "name": "Basic",
    "type": 0,
    "mod": 1607392319,
    "usn": -1,
    "sortf": 0,
    "did": 1,
    "tmpls": [
      {
        "name": "Card 1",
        "ord": 0,
        "qfmt": "{{Front}}",
        "afmt": "{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}",
        "bqfmt": "",
        "bafmt": "",
        "did": null
      }
    ],
    "flds": [
      {
        "name": "Front",
        "ord": 0,
        "sticky": false,
        "rtl": false,
        "font": "Arial",
        "size": 20,
        "media": []
      },
      {
        "name": "Back",
        "ord": 1,
        "sticky": false,
        "rtl": false,
        "font": "Arial",
        "size": 20,
        "media": []
      }
    ],
    "css": ".card {\n  font-family: arial;\n  font-size: 20px;\n  text-align: center;\n  color: black;\n  background-color: white;\n}",
    "latexPre": "\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n",
    "latexPost": "\\end{document}",
    "latexsvg": false,
    "req": [[0, "any", [0]]]
  }
}
```

### `col.decks` — Decks

```json
{
  "1": {
    "id": 1,
    "name": "Default",
    "mod": 0,
    "usn": 0,
    "lrnToday": [0, 0],
    "revToday": [0, 0],
    "newToday": [0, 0],
    "timeToday": [0, 0],
    "collapsed": false,
    "desc": "",
    "dyn": 0,
    "conf": 1,
    "extendNew": 10,
    "extendRev": 50
  }
}
```

### `col.dconf` — Deck Options

```json
{
  "1": {
    "id": 1,
    "name": "Default",
    "new": {
      "delays": [1, 10],
      "ints": [1, 4, 7],
      "initialFactor": 2500,
      "order": 1,
      "perDay": 20
    },
    "rev": {
      "perDay": 200,
      "ease4": 1.3,
      "fuzz": 0.05,
      "minSpace": 1,
      "ivlFct": 1,
      "maxIvl": 36500
    },
    "lapse": {
      "delays": [10],
      "mult": 0,
      "minInt": 1,
      "leechFails": 8,
      "leechAction": 0
    },
    "maxTaken": 60
  }
}
```

## Building an APKG File (Algorithm)

For our web app to **export** decks:

1. Create a SQLite database in memory (using `sql.js` for browser)
2. Create all 5 tables with the schema above
3. Insert the `col` row with:
  - `models` JSON containing all note types used
  - `decks` JSON containing the target deck(s)
  - `dconf` JSON with default deck config
  - `conf` JSON with default collection config
4. For each note, insert into `notes` with:
  - Generate unique `id` (epoch ms)
  - Generate `guid` (base91 random, 10 chars)
  - Set `mid` to the note type ID
  - Join field values with `\x1f` into `flds`
  - Compute `csum` as integer from first 8 hex chars of SHA1 of stripped first field
  - Set `sfld` to the HTML-stripped first field value
5. For each note × card type combination, insert into `cards` with:
  - `nid` = note id, `did` = deck id, `ord` = template index
  - For new cards: `type=0`, `queue=0`, `due=<position>`, `ivl=0`, `factor=0`
6. Create the `media` JSON mapping
7. Package everything into a ZIP archive:
  - Add `collection.anki21` (deflate compressed)
  - Add `collection.anki2` (compatibility stub — can be minimal/empty db)
  - Add `media` JSON file
  - Add numbered media files

## Checksum Calculation

The `csum` field is the first 8 hex digits of the SHA-1 hash of the first field value (with HTML stripped), interpreted as a 32-bit integer:

```javascript
const stripped = stripHtml(firstFieldValue);
const sha1hex = sha1(stripped);
const csum = parseInt(sha1hex.substring(0, 8), 16);
```

## GUID Generation

Anki uses a base91-encoded random string. The `genanki` library generates GUIDs like:

```python
def guid_for(*values):
    hash_str = '__'.join(str(v) for v in values)
    return base91(hashlib.sha256(hash_str.encode('utf-8')).digest())[:10]
```

For our web app, generating a random 10-character base91 string is sufficient.