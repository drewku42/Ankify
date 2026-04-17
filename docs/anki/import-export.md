# Import & Export

> Reference for agents implementing file import/export in the card generator.
> Source: https://docs.ankiweb.net/importing/intro.html, text-files.html, packaged-decks.html, exporting.html

## Export Formats

### 1. Plain Text (CSV/TSV)

Anki can export notes as plain text with fields separated by tabs (default) or other delimiters.

**Characteristics:**
- Field values include embedded HTML
- First field used for re-import matching
- Newlines within fields are escaped or use `<br>`

### 2. Deck Package (.apkg)

Contains cards, notes, note types, and media in a ZIP archive with a SQLite database. See `apkg-file-format.md` for the full specification.

**Deck package behavior on import:**
- Merges into existing collection (does NOT replace)
- Uses note GUID or first field for duplicate detection
- If imported note is newer (`mod` timestamp), existing note is updated
- Existing scheduling info is preserved for updated cards
- Cards stay in their current deck when updated (not moved)

### 3. Collection Package (.colpkg)

Same structure as .apkg but exports ALL decks with scheduling. **Replaces** the entire collection on import (destructive).

## Import: Text Files

### Supported Formats

Any plain text file with fields separated by commas, semicolons, or tabs. Requirements:
- **Plain text** (.txt, .csv) — NOT .xls, .rtf, .doc
- **UTF-8 encoding** (critical for non-Latin characters)
- Anki auto-detects the separator but can be overridden

### File Structure

```
apple;banana;grape
first field;second field;third field
```

Number of fields is determined by the first non-comment line.

### Handling Special Characters in Fields

**Option A — Quote escaping:**
```
hello;"this is
a two line answer"
"this includes a ; (semicolon)";another field
field one;"field two with ""escaped quotes"" inside it"
```

**Option B — HTML line breaks:**
```
hello;this is<br>a two line answer
```

HTML mode must be enabled in import options.

### Comments

Lines starting with `#` are ignored:

```
# this is a comment
foo bar;bar baz;baz quux
```

### Tags in Import

Tags can be included as a field and mapped to the tags column:

```
front;back;tag1 tag2
```

### File Headers (Anki 2.1.54+)

Headers at the top of the file control import behavior:

```
#separator:Tab
#html:true
#tags:chapter1 vocabulary
#columns:Front	Back	Extra
#notetype:Basic
#deck:My Deck
#notetype column:1
#deck column:2
#tags column:3
#guid column:4
```

| Header | Description |
|--------|-------------|
| `#separator` | `Comma`, `Semicolon`, `Tab`, `Space`, `Pipe`, `Colon` |
| `#html` | `true` or `false` — whether to parse HTML in fields |
| `#tags` | Space-separated tags applied to all imported notes |
| `#columns` | Column names (separated by the chosen separator) |
| `#notetype` | Note type name or ID to use |
| `#deck` | Deck name or ID to import into |
| `#notetype column` | Column number containing per-note note type |
| `#deck column` | Column number containing per-note deck |
| `#tags column` | Column number containing per-note tags |
| `#guid column` | Column number containing GUID for each note |

### Duplicate Handling on Import

| Setting | Behavior |
|---------|----------|
| **Update** (default) | Match on first field + note type. Update if imported version is newer. |
| **Ignore** | Skip notes with matching first field. |
| **Import as new** | Create new notes regardless of duplicates. |

Match scope options:
- **Note type only**: Duplicate if same note type has same first field
- **Note type + deck**: Also requires the existing note to be in the import target deck

### GUID Column

When a GUID column is present:
- Used for matching instead of first field
- Notes with matching GUID are always updated (duplicate option ignored)
- GUIDs are Anki-internal; prefer using first field as a custom ID instead

### Importing Media via Text Files

Reference media files in field values:

```
What is this?;<img src="photo.jpg">
Listen to this;[sound:pronunciation.mp3]
```

Media files must be copied to the `collection.media` folder before import.

## Import: Packaged Decks (.apkg)

### Merge Behavior

When importing an .apkg:
1. Notes are matched by GUID (or first field if no GUID)
2. If the imported note has a newer `mod` timestamp → update existing
3. If the existing note is newer → skip
4. New notes (no match) are added
5. Cards retain their current scheduling and deck placement

### Note Type Conflicts

If the note type structure has changed (fields added/removed), updates to existing notes may fail. New notes will still import.

**Anki 23.10+ additions:**
- Option to unconditionally update notes and note types
- Option to merge modified note types (preserves all fields and templates from both versions)
- Option to never update existing objects

### Scheduling Information

Shared decks typically should NOT include scheduling. When exporting for sharing:
- Uncheck "Include scheduling information"
- This strips intervals, review history, leech/marked tags
- Recipients start fresh with all cards as "new"

On import, users can uncheck "Import any learning progress" to strip scheduling.

## Implementation Plan for Our Web App

### Creating Cards (Internal)

The web app should support creating notes with:
- Selectable note type (with custom field definitions)
- Rich text editing for each field
- Tag management
- Deck assignment
- Live preview of generated cards

### Export to .apkg

Generate a valid .apkg file for download:
1. Build SQLite DB in browser using `sql.js`
2. Populate all 5 tables per schema v11
3. Bundle with media mapping and files
4. ZIP and offer for download

### Export to Text (CSV)

Generate a CSV/TSV file:
1. Include file headers for seamless re-import
2. Tab-separate fields
3. Include HTML in fields
4. Add tags column
5. UTF-8 encoding

### Import from .apkg

Parse an uploaded .apkg:
1. Unzip the archive
2. Read `collection.anki21` (or fall back to `collection.anki2`)
3. Parse `col.models` for note type definitions
4. Read `notes` table and split `flds` by `\x1f`
5. Read `cards` table for deck assignments
6. Parse `media` mapping and extract media files

### Import from Text (CSV/TSV)

Parse an uploaded text file:
1. Detect or use specified separator
2. Parse file headers if present
3. Map columns to fields
4. Handle HTML vs plain text mode
5. Process quoted fields and escapes
6. Create notes from rows

### Import from Existing Anki (via AnkiConnect)

If the user has Anki running locally with AnkiConnect:
1. Query deck and note type lists
2. Fetch existing notes/cards
3. Push new notes back to Anki

See `libraries-and-tools.md` for AnkiConnect API details.
