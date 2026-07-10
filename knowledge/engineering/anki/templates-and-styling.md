# Card Templates & Styling

> Reference for agents implementing template editing and card preview.
> Source: [https://docs.ankiweb.net/templates/intro.html](https://docs.ankiweb.net/templates/intro.html), fields.html, styling.html, generation.html

## Template System Overview

Card templates define how notes are rendered into reviewable cards. Each card type has:

1. **Front template** (question side) — HTML
2. **Back template** (answer side) — HTML
3. **Shared CSS** (styling) — CSS, shared across all card types in a note type

Templates use a Mustache-like syntax for field replacement.

## Field Replacements

### Basic Replacement

```html
{{FieldName}}
```

Replaces with the field's content. Field names are **case sensitive**.

### FrontSide

```html
{{FrontSide}}
```

Only valid in the back template. Inserts the rendered front template content. Does NOT auto-replay audio from the front.

### The Answer Divider

```html
{{FrontSide}}
<hr id="answer" />
{{Back}}
```

The `id=answer` tells Anki where the answer begins (for auto-scrolling on mobile).

### Line Breaks

Templates are HTML, so use `<br>` for line breaks, not literal newlines:

```html
{{Field 1}}<br />
{{Field 2}}
```

### HTML Stripping

Use `{{text:FieldName}}` to strip HTML formatting from a field value. Useful for dictionary links:

```html
<a href="https://dictionary.com/search?q={{text:Expression}}">Look up</a>
```

### Hint Fields

```html
{{hint:MyField}}
```

Renders as a "show hint" link that reveals the field content when clicked.

## Special Fields

Available in any template without being defined as note fields:

| Syntax          | Content                                     |
| --------------- | ------------------------------------------- |
| `{{Tags}}`      | Note's tags                                 |
| `{{Type}}`      | Note type name                              |
| `{{Deck}}`      | Card's deck name                            |
| `{{Subdeck}}`   | Card's subdeck name                         |
| `{{CardFlag}}`  | Card's flag                                 |
| `{{Card}}`      | Card type name (e.g., "Forward")            |
| `{{FrontSide}}` | Front template content (back template only) |

## Conditional Replacement

Show content only when a field is non-empty:

```html
{{#FieldName}} This shows when FieldName has content {{/FieldName}}
{{^FieldName}} This shows when FieldName is empty {{/FieldName}}
```

Real-world example — show tags only when present:

```html
{{#Tags}} Tags: {{Tags}} {{/Tags}}
```

### Controlling Card Generation

Anki won't generate cards with empty front sides. Use conditionals to control which cards are created:

```html
{{#Expression}} {{Expression}} {{Notes}} {{/Expression}}
```

This card is only generated if `Expression` is non-empty.

Require multiple fields:

```html
{{#Expression}} {{#Notes}} {{Expression}} {{Notes}} {{/Notes}} {{/Expression}}
```

## Cloze Templates

Cloze note types use a different template syntax:

```html
{{cloze:Text}}
```

The field content uses cloze markers:

```
{{c1::answer::optional hint}}
```

Example note content:

```
{{c2::Canberra}} was founded in {{c1::1913}}.
```

This generates two cards:

- Card 1: "Canberra was founded in [...]."
- Card 2: "[...] was founded in 1913."

Cloze-specific conditional blocks:

```html
{{cloze:Text}} {{#c1}} {{Hint1}} {{/c1}} {{#c2}} {{Hint2}} {{/c2}}
```

### Nested Cloze Deletions (2.1.56+)

```
{{c1::Canberra was {{c2::founded}}}} in 1913
```

Supported up to ~3 levels deep (Anki 24.11). No support for partial overlaps.

## Text to Speech

### Single Field

```html
{{tts en_US:Front}}
```

### With Voice Selection

```html
{{tts ja_JP voices=Apple_Otoya,Microsoft_Haruka:Field}}
```

### With Speed

```html
{{tts fr_FR speed=0.8:SomeField}}
```

### Cloze-Only TTS

```html
{{tts en_US:cloze-only:Text}}
```

### Multi-Field TTS

```html
[anki:tts lang=en_US]This text and {{Field1}} will be read[/anki:tts]
```

## Ruby Characters (Furigana)

For languages with pronunciation annotations:

| Filter                 | Input              | Output                     |
| ---------------------- | ------------------ | -------------------------- |
| `{{furigana:MyField}}` | `日本語[にほんご]` | 日本語 with にほんご above |
| `{{kana:MyField}}`     | `日本語[にほんご]` | にほんご (reading only)    |
| `{{kanji:MyField}}`    | `日本語[にほんご]` | 日本語 (base text only)    |

Syntax: `BaseText[RubyText]` with a space before the base character to scope correctly.

## Type-in-the-Answer

Add to front template:

```html
{{type:FieldName}}
```

Anki renders a text input. On answer reveal, it shows a diff of typed vs. correct. Only one `type:` field per card. For cloze: `{{type:cloze:Text}}`.

Use `{{type:nc:FieldName}}` to ignore diacritics in comparison.

## CSS Styling

### Default Card Style

```css
.card {
  font-family: arial;
  font-size: 20px;
  text-align: center;
  color: black;
  background-color: white;
}
```

### Card-Specific Styling

```css
.card {
  background-color: yellow;
} /* all cards */
.card1 {
  background-color: blue;
} /* first card type only */
.card2 {
  background-color: green;
} /* second card type only */
```

### Field-Specific Styling

Wrap fields in styled divs:

```html
<div class="expression">{{Expression}}</div>
```

```css
.expression {
  font-family: "MS Mincho";
  font-size: 30px;
}
```

### Night Mode

```css
.card.nightMode {
  background-color: #555;
}
.nightMode .myclass {
  color: yellow;
}
```

### Platform-Specific CSS

```css
.win .example {
  font-family: "Example1";
}
.mac .example {
  font-family: "Example2";
}
.linux:not(.android) .example {
  font-family: "Example3";
}
.mobile .example {
  font-family: "Example5";
}
.iphone .example,
.ipad .example {
  font-family: "Example6";
}
.android .example {
  font-family: "Example7";
}
```

### RTL Text Direction

```css
.card {
  direction: rtl;
}
```

Or per-field:

```html
<div dir="rtl">{{Front}}</div>
```

### Custom Fonts

Bundle fonts by prefixing filenames with `_` and adding to media:

```css
@font-face {
  font-family: myfont;
  src: url("_arial.ttf");
}
.card {
  font-family: myfont;
}
```

### Image Resizing

Default: images shrink to fit screen. Override:

```css
img {
  max-width: none;
  max-height: none;
}
```

## Media in Templates

### Static Media (Same on Every Card)

Prefix filename with `_` to prevent cleanup:

```html
<img src="_logo.jpg" />
```

### Dynamic Media (From Fields)

Media must be referenced **inside field values**, not in templates:

```html
<!-- IN THE FIELD VALUE, not the template -->
<img src="myimage.jpg" />
[sound:myaudio.mp3]
```

Template references like `<img src="{{Expression}}.jpg">` are NOT supported.

## Implementation Notes for Our Web App

1. **Template Preview**: Render templates by replacing `{{FieldName}}` with actual values. Handle conditionals (`{{#Field}}`/`{{^Field}}`), special fields, and cloze syntax.
2. **CSS Isolation**: When previewing cards, scope the CSS to avoid leaking into the app UI.
3. **Cloze Rendering**: Parse `{{c1::text::hint}}` syntax. Replace active cloze with `[...]` or `[hint]` on front, show full text on back.
4. **Card Generation Logic**: For each note, iterate card types. Skip if front would render empty (after removing special fields and non-field text).
5. **The `{{FrontSide}}` tag**: On the back template, replace with the fully rendered front template.
