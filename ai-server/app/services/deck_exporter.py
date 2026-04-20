import logging
import os
import random
import re
import tempfile

import genanki

from app.models import GeneratedCard

logger = logging.getLogger(__name__)

BASIC_MODEL = genanki.Model(
    model_id=1607392319,
    name="Ankify Basic",
    fields=[
        {"name": "Front"},
        {"name": "Back"},
        {"name": "SourcePage"},
    ],
    templates=[
        {
            "name": "Card 1",
            "qfmt": "{{Front}}",
            "afmt": '{{FrontSide}}<hr id="answer">{{Back}}'
                    '{{#SourcePage}}<div class="source">p. {{SourcePage}}</div>{{/SourcePage}}',
        },
    ],
    css=".card { font-family: arial; font-size: 20px; text-align: center; color: #333; "
        "background-color: white; padding: 20px; }\n"
        ".source { font-size: 12px; color: #999; margin-top: 16px; }",
)


def _sanitize_tags(tags: list[str]) -> list[str]:
    """Anki tags cannot contain spaces — replace with underscores."""
    return [tag.strip().replace(" ", "_") for tag in tags if tag.strip()]


def _make_note(card: GeneratedCard) -> genanki.Note:
    """Convert a GeneratedCard into a genanki Note."""
    page_str = str(card.source_page) if card.source_page else ""
    tags = _sanitize_tags(card.tags or [])

    return genanki.Note(
        model=BASIC_MODEL,
        fields=[card.front, card.back, page_str],
        tags=tags,
    )


def export_deck(
    deck_name: str,
    cards: list[GeneratedCard],
    media_files: list[str] | None = None,
    output_dir: str | None = None,
) -> str:
    """Build an .apkg file from generated cards.

    Args:
        deck_name: Name of the Anki deck.
        cards: List of GeneratedCard objects.
        media_files: Optional list of media file paths to include.
        output_dir: Directory to write the .apkg file. Uses temp dir if None.

    Returns:
        Path to the generated .apkg file.
    """
    deck_id = random.randrange(1 << 30, 1 << 31)
    deck = genanki.Deck(deck_id, deck_name)

    note_count = 0
    for card in cards:
        note = _make_note(card)
        deck.add_note(note)
        note_count += 1

    package = genanki.Package(deck)
    if media_files:
        package.media_files = media_files

    if output_dir is None:
        output_dir = tempfile.mkdtemp(prefix="ankify_")

    safe_name = re.sub(r"[^\w\s-]", "", deck_name).strip().replace(" ", "_")
    file_path = os.path.join(output_dir, f"{safe_name}.apkg")

    package.write_to_file(file_path)
    file_size = os.path.getsize(file_path)

    logger.info(
        "Exported deck '%s': %d cards, %d bytes -> %s",
        deck_name, note_count, file_size, file_path,
    )

    return file_path
