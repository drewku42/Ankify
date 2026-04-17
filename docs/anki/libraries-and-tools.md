# Libraries & Tools

> Reference for agents choosing technologies to build the card generator web app.
> Sources: npm, PyPI, GitHub repos, AnkiConnect documentation.

## JavaScript/TypeScript Libraries (for Browser-Based Web App)

### anki-apkg (Recommended for Export)

**npm**: `anki-apkg` | **GitHub**: [NdYAG/anki-apkg](https://github.com/NdYAG/anki-apkg)
**Language**: TypeScript | **License**: MIT | **Last updated**: June 2025

Creates .apkg files with custom fields and templates. Works in both Node.js and browser (webpack).

```typescript
import { APKG } from 'anki-apkg';

const apkg = new APKG({
    name: 'VocabularyBuilder',
    card: {
        fields: ['word', 'meaning', 'usage'],
        template: {
            question: '{{word}}',
            answer: `
                <div>{{word}}</div>
                <hr>
                <div>{{meaning}}</div>
                <div>{{usage}}</div>
            `
        },
        styleText: '.card { text-align: center; }'
    }
});

apkg.addCard({
    timestamp: Date.now(),
    content: ['hello', 'greeting', 'Hello, how are you?']
});

// Node.js
apkg.save(__dirname);

// Browser — returns a Promise<Blob>
const blob = await apkg.save(); // then use file-saver or URL.createObjectURL
```

**Media support:**
```typescript
apkg.addMedia('unicorn.gif', bufferData);
apkg.addCard({
    content: ['What is this?', '<img src="unicorn.gif" />']
});
```

**Pros**: TypeScript, custom fields, active maintenance, media support
**Cons**: Smaller community than anki-apkg-export

### anki-apkg-export (Alternative)

**npm**: `anki-apkg-export` | **GitHub**: [ewnd9/anki-apkg-export](https://github.com/ewnd9/anki-apkg-export)
**Language**: JavaScript | **License**: MIT | **Last updated**: 2020

Older but widely used. Simpler API, limited to Front/Back fields by default.

```javascript
import AnkiExport from 'anki-apkg-export';

const apkg = new AnkiExport('My Deck');
apkg.addCard('front of card', 'back of card', { tags: ['tag1'] });

const zip = await apkg.save();
// zip is a Blob in browser, Buffer in Node
```

**Pros**: Well-tested, many dependents, browser + Node
**Cons**: Last updated 2020, limited to basic Front/Back, no custom fields

### @steve2955/anki-apkg-export (Fork)

**npm**: `@steve2955/anki-apkg-export`

Fork of anki-apkg-export with custom template variable support (frontside, backside, CSS).

### sql.js (Core Dependency)

**npm**: `sql.js` | **GitHub**: [sql-js/sql.js](https://github.com/sql-js/sql.js)

SQLite compiled to WebAssembly. Required by all browser-based APKG generators. Runs a full SQLite engine in the browser.

```javascript
import initSqlJs from 'sql.js';

const SQL = await initSqlJs();
const db = new SQL.Database();
db.run("CREATE TABLE notes (id INTEGER PRIMARY KEY, ...)");
// ... build the APKG database
const data = db.export(); // Uint8Array of SQLite file
```

### JSZip (Core Dependency)

**npm**: `jszip`

Creates ZIP archives in the browser. Used to package the SQLite DB + media into .apkg.

```javascript
import JSZip from 'jszip';

const zip = new JSZip();
zip.file('collection.anki21', sqliteData, { compression: 'DEFLATE' });
zip.file('media', JSON.stringify(mediaMapping));
zip.file('0', imageBuffer);

const blob = await zip.generateAsync({ type: 'blob' });
```

### file-saver (Utility)

**npm**: `file-saver`

Triggers file download in the browser:

```javascript
import { saveAs } from 'file-saver';
saveAs(blob, 'my-deck.apkg');
```

### yanki-connect (AnkiConnect Client)

**npm**: `yanki-connect` | **Version**: 4.0.1

Fully-typed TypeScript client for the AnkiConnect API. Universal (browser + Node).

```typescript
import { YankiConnect } from 'yanki-connect';

const client = new YankiConnect();

const decks = await client.deck.deckNames();
const noteId = await client.note.addNote({
    note: {
        deckName: 'Default',
        modelName: 'Basic',
        fields: { Front: 'question', Back: 'answer' },
        tags: ['generated']
    }
});
```

Covers all 116 AnkiConnect actions with full type annotations.

## Python Libraries (for Backend/CLI)

### genanki

**PyPI**: `genanki` | **GitHub**: [kerrickstaley/genanki](https://github.com/kerrickstaley/genanki)
**Version**: 0.13.1 | **Python**: ≥3.6 | **License**: MIT

The standard Python library for generating Anki decks. 2.5k+ GitHub stars.

```python
import genanki
import random

model = genanki.Model(
    random.randrange(1 << 30, 1 << 31),
    'Simple Model',
    fields=[
        {'name': 'Question'},
        {'name': 'Answer'},
    ],
    templates=[
        {
            'name': 'Card 1',
            'qfmt': '{{Question}}',
            'afmt': '{{FrontSide}}<hr id=answer>{{Answer}}',
        },
    ],
    css='.card { font-family: arial; font-size: 20px; text-align: center; }'
)

deck = genanki.Deck(
    random.randrange(1 << 30, 1 << 31),
    'Country Capitals'
)

note = genanki.Note(
    model=model,
    fields=['Capital of Argentina?', 'Buenos Aires'],
    tags=['geography']
)
deck.add_note(note)

# With media
package = genanki.Package(deck)
package.media_files = ['photo.jpg', 'audio.mp3']
package.write_to_file('output.apkg')
```

**Key features:**
- Custom models with arbitrary fields and templates
- Multiple card types per model
- Cloze deletion support via `genanki.CLOZE_MODEL`
- Media file bundling
- Stable GUIDs for note updates
- Can write to local Anki collection (inside add-on context)

**GUID handling:**
```python
class MyNote(genanki.Note):
    @property
    def guid(self):
        return genanki.guid_for(self.fields[0])
```

## AnkiConnect API (Live Integration)

AnkiConnect is an Anki add-on that exposes a REST API on `localhost:8765`.

### Setup

User must install the AnkiConnect add-on (code: `2055492159`) and have Anki running.

### API Format

```json
{
    "action": "actionName",
    "version": 6,
    "params": { ... }
}
```

Response:
```json
{
    "result": ...,
    "error": null
}
```

### Key Actions for Our App

#### Deck Management

```javascript
// List decks
{ "action": "deckNames", "version": 6 }

// Create deck
{ "action": "createDeck", "version": 6, "params": { "deck": "My Deck" } }

// Get deck names and IDs
{ "action": "deckNamesAndIds", "version": 6 }
```

#### Note Type / Model Management

```javascript
// List models
{ "action": "modelNames", "version": 6 }

// Get model fields
{ "action": "modelFieldNames", "version": 6, "params": { "modelName": "Basic" } }

// Get model templates
{ "action": "modelTemplates", "version": 6, "params": { "modelName": "Basic" } }
```

#### Note Operations

```javascript
// Add a single note
{
    "action": "addNote",
    "version": 6,
    "params": {
        "note": {
            "deckName": "Default",
            "modelName": "Basic",
            "fields": { "Front": "question", "Back": "answer" },
            "tags": ["tag1", "tag2"],
            "options": {
                "allowDuplicate": false,
                "duplicateScope": "deck"
            }
        }
    }
}

// Add multiple notes
{
    "action": "addNotes",
    "version": 6,
    "params": {
        "notes": [ /* array of note objects */ ]
    }
}

// Find notes
{ "action": "findNotes", "version": 6, "params": { "query": "deck:Default" } }

// Get note info
{ "action": "notesInfo", "version": 6, "params": { "notes": [1502298033753] } }

// Update note
{
    "action": "updateNote",
    "version": 6,
    "params": {
        "note": {
            "id": 1502298033753,
            "fields": { "Front": "updated question", "Back": "updated answer" },
            "tags": ["updated"]
        }
    }
}
```

#### Media Operations

```javascript
// Store media file (base64)
{
    "action": "storeMediaFile",
    "version": 6,
    "params": {
        "filename": "image.jpg",
        "data": "base64EncodedData"
    }
}

// Store media from URL
{
    "action": "storeMediaFile",
    "version": 6,
    "params": {
        "filename": "audio.mp3",
        "url": "https://example.com/audio.mp3"
    }
}
```

### CORS and Security

AnkiConnect runs on `http://localhost:8765`. By default it allows all origins. For production, users may need to configure allowed origins in AnkiConnect settings.

The web app should detect whether AnkiConnect is available and gracefully degrade if not.

## Recommended Technology Stack

### For a Browser-Based Web App

| Purpose | Library | Why |
|---------|---------|-----|
| **APKG Export** | `anki-apkg` | TypeScript, custom fields, active |
| **SQLite in Browser** | `sql.js` | Required for APKG generation |
| **ZIP Generation** | `jszip` | Mature, well-supported |
| **File Download** | `file-saver` | Simple download trigger |
| **AnkiConnect Client** | `yanki-connect` | Full TypeScript types |
| **CSV Parsing** | `papaparse` | Robust CSV parser for imports |

### For a Backend (If Needed)

| Purpose | Library | Why |
|---------|---------|-----|
| **APKG Generation** | `genanki` (Python) | Most mature, widely used |
| **CSV Processing** | Built-in `csv` module | Standard library |

### Build-or-Buy Decision

**Decided:** Use `genanki` (Python) on the AI server for `.apkg` generation.

Rationale:
1. **`genanki`** is the most mature library (2.5k+ GitHub stars), handles cloze + media + custom templates natively
2. The AI server is already Python (LangChain + structured outputs), so `genanki` runs in the same process — no cross-language serialization needed
3. Card generation and `.apkg` packaging happen on the same server, simplifying the pipeline: PDF → GPT-4o Vision → structured card data → `genanki` → `.apkg` → S3
4. The JS libraries (`anki-apkg`, `anki-apkg-export`) remain useful as reference implementations for understanding the format, but are not used in production

**Not in v1:**
- AnkiConnect live-sync (requires user to have Anki desktop running — too much friction for v1)
- CSV export (`.apkg` only for now)
- Browser-side `.apkg` generation (server-side via `genanki` instead)
