# Cloze Deletions

> Reference for agents implementing cloze deletion card creation and rendering.
> Source: [https://docs.ankiweb.net/editing.html#cloze-deletion](https://docs.ankiweb.net/editing.html#cloze-deletion), templates/generation.html

## What Are Cloze Deletions?

Cloze deletion hides one or more parts of a sentence, testing the user's knowledge of the hidden information. This is one of the most powerful card creation techniques in Anki.

Example:

- **Full text**: "Canberra was founded in 1913."
- **Card question**: "Canberra was founded in [...]."
- **Card answer**: "Canberra was founded in **1913**."

## Syntax

### Basic Cloze

```
{{c1::text to hide}}
```

- `c1` — cloze number (determines which card this deletion appears on)
- `text to hide` — the content that gets replaced with `[...]`

### Cloze with Hint

```
{{c1::text to hide::hint text}}
```

When this cloze is active, `[hint text]` is shown instead of `[...]`.

### Multiple Cloze Deletions (Separate Cards)

```
{{c2::Canberra}} was founded in {{c1::1913}}.
```

Generates **two cards**:

- Card 1: "Canberra was founded in [...]." → answer: 1913
- Card 2: "[...] was founded in 1913." → answer: Canberra

Each unique cloze number generates a separate card.

### Multiple Cloze Deletions (Same Card)

```
{{c1::Canberra}} was founded in {{c1::1913}}.
```

Using the same number (`c1`) puts both deletions on the **same card**:

- Card 1: "[...] was founded in [...]." → answer: Canberra, 1913

### Nested Cloze Deletions (Anki 2.1.56+)

```
{{c1::Canberra was {{c2::founded}}}} in 1913
```

The inner cloze is fully contained within the outer. Supported up to ~3 nesting levels (Anki 24.11).

**Not supported**: partial overlaps where deletions cross boundaries.

## Cloze Note Type Specifics

### Special Note Type

The **Cloze** note type is special in Anki:

- It has a `Text` field and an `Extra` field (shown on answer side)
- It uses `type: 1` (vs `type: 0` for standard note types)
- Cannot be created from a regular note type — must clone existing Cloze type
- Has a single card type template shared by all cloze numbers

### Template Syntax

Front template:

```html
{{cloze:Text}}
```

Back template:

```html
{{cloze:Text}}
<br />
{{Extra}}
```

### Card Generation

Unlike standard note types (which generate cards based on templates), cloze cards are generated based on cloze references found in the field content:

1. Anki scans the front template for `{{cloze:FieldName}}`
2. It scans the field content for all `{{cN::...}}` patterns
3. For each unique number N, a card is generated

### Per-Card Conditional Content

```html
{{cloze:Text}} {{#c1}} Hint for card 1: {{Hint1}} {{/c1}} {{#c2}} Hint for card
2: {{Hint2}} {{/c2}}
```

## Rendering Algorithm

For our web app to render cloze cards:

### Parsing Cloze Markup

```
Input: "{{c2::Canberra}} was founded in {{c1::1913}}."
```

Parse into tokens:

```json
[
  { "type": "cloze", "num": 2, "text": "Canberra", "hint": null },
  { "type": "text", "content": " was founded in " },
  { "type": "cloze", "num": 1, "text": "1913", "hint": null },
  { "type": "text", "content": "." }
]
```

### Rendering for Card N

**Front (question) for card N:**

- For each cloze token with `num === N`: replace with `[...]` or `[hint]`
- For all other cloze tokens: show the plain text (un-hidden)

**Back (answer) for card N:**

- For each cloze token with `num === N`: show the text with highlight/emphasis
- For all other cloze tokens: show the plain text

### Regex for Parsing

```javascript
const CLOZE_REGEX = /\{\{c(\d+)::(.+?)(?:::(.+?))?\}\}/gs;
```

Match groups:

1. Cloze number
2. Hidden text
3. Hint (optional)

**Note**: The `s` flag is needed for multi-line cloze content. Use a non-greedy match (`+?`) to handle multiple clozes on the same line.

### Handling Nested Clozes

For nested clozes like `{{c1::Canberra was {{c2::founded}}}}`:

- When rendering card 1: The entire outer region is hidden → `[...]`
- When rendering card 2: Only "founded" is hidden → "Canberra was [...]"

Implementation approach: Process from innermost to outermost, or use a recursive parser.

## Counting Cards from Cloze Content

To determine how many cards a cloze note will generate:

```javascript
function countClozeCards(text) {
  const nums = new Set();
  const regex = /\{\{c(\d+)::/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    nums.add(parseInt(match[1]));
  }
  return nums.size;
}
```

The card ordinals (0-indexed) map to cloze numbers: `c1` → ord 0, `c2` → ord 1, etc.

## Image Occlusion

Image Occlusion is a special case of cloze deletion for images. Instead of hiding text, it hides regions of an image.

### IO Note Type Fields

- **Image**: The base image with SVG overlay data
- **Header**: Shown above image on front and back
- **Back Extra**: Shown below image on back only
- **Comments**: Not displayed on cards

### IO Modes

- **Hide All, Guess One**: All regions hidden, one revealed per card
- **Hide One, Guess One**: Only one region hidden per card, others visible

### IO Shapes

- Rectangle
- Ellipse
- Polygon

Each shape (or group of shapes) generates one card.

## Implementation Checklist

- Parse `{{cN::text}}` and `{{cN::text::hint}}` syntax
- Handle multiple cloze numbers → multiple cards
- Handle same cloze number on multiple deletions → same card
- Support nested clozes (Anki 2.1.56+)
- Render front: active cloze → `[...]` or `[hint]`, inactive cloze → plain text
- Render back: active cloze → highlighted text, inactive cloze → plain text
- Count unique cloze numbers to determine card count
- Validate: at least one cloze deletion exists
- Validate: cloze numbers are sequential starting from 1 (warn if gaps)
- Support `{{cloze:FieldName}}` in template rendering
- Support `{{type:cloze:Text}}` for type-in-answer cloze
