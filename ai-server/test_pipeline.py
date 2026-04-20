"""Standalone end-to-end test: PDF -> slides -> GPT-4o -> cards -> .apkg

Usage:
    poetry run python test_pipeline.py <path-to-pdf> [--pages N]

Example:
    poetry run python test_pipeline.py ../example-slides/1_ExampleLecture_CS.pdf --pages 1
"""

import argparse
import asyncio
import json
import logging
import sys
import time
from pathlib import Path

from app.services.pdf_processor import pdf_to_slides
from app.services.card_generator import generate_cards
from app.services.deck_exporter import export_deck

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("test_pipeline")


async def run_pipeline(pdf_path: str, max_pages: int | None = None, single_slide: int | None = None) -> None:
    path = Path(pdf_path)
    if not path.exists():
        logger.error("PDF not found: %s", pdf_path)
        sys.exit(1)

    output_dir = str(path.parent)
    logger.info("=" * 60)
    logger.info("ANKIFY PIPELINE TEST")
    logger.info("PDF: %s (%.1f KB)", path.name, path.stat().st_size / 1024)
    if single_slide:
        logger.info("Testing single slide: %d", single_slide)
    elif max_pages:
        logger.info("Limiting to first %d page(s)", max_pages)
    logger.info("=" * 60)

    # Step 1: PDF -> slide images
    logger.info("\n--- Step 1: Extracting slides from PDF ---")
    t0 = time.time()
    slides = pdf_to_slides(str(path))
    t1 = time.time()
    logger.info("Extracted %d slides in %.1fs", len(slides), t1 - t0)

    if single_slide:
        if single_slide < 1 or single_slide > len(slides):
            logger.error("Slide %d out of range (1-%d)", single_slide, len(slides))
            sys.exit(1)
        slides = [slides[single_slide - 1]]
        logger.info("Using slide %d for test", single_slide)
    elif max_pages:
        slides = slides[:max_pages]
        logger.info("Using %d slide(s) for test", len(slides))

    # Step 2: Slides -> AI-generated cards
    logger.info("\n--- Step 2: Generating cards with GPT-4o Vision ---")
    t2 = time.time()
    deck = await generate_cards(slides)
    t3 = time.time()
    logger.info("Generated %d cards in %.1fs", len(deck.cards), t3 - t2)
    logger.info("Suggested title: %s", deck.title_suggestion)
    logger.info("Summary: %s", deck.summary)

    # Print first 3 cards as a sample
    logger.info("\n--- Sample Cards ---")
    for i, card in enumerate(deck.cards[:3]):
        logger.info(
            "Card %d (p.%s):\n  Front: %s\n  Back: %s",
            i + 1, card.source_page,
            card.front[:120], card.back[:120],
        )

    # Step 3: Cards -> .apkg file
    logger.info("\n--- Step 3: Exporting to .apkg ---")
    deck_name = deck.title_suggestion or path.stem
    apkg_path = export_deck(deck_name, deck.cards, output_dir=output_dir)
    logger.info("Exported to: %s", apkg_path)

    # Save card data as JSON for inspection
    json_path = str(path.with_suffix(".cards.json"))
    with open(json_path, "w") as f:
        json.dump(
            {
                "title": deck.title_suggestion,
                "summary": deck.summary,
                "page_count": len(slides),
                "card_count": len(deck.cards),
                "cards": [c.model_dump() for c in deck.cards],
            },
            f,
            indent=2,
        )
    logger.info("Card data saved to: %s", json_path)

    total = time.time() - t0
    logger.info("\n" + "=" * 60)
    logger.info("DONE — Total time: %.1fs", total)
    logger.info("  Pages: %d", len(slides))
    logger.info("  Cards: %d", len(deck.cards))
    logger.info("  .apkg: %s", apkg_path)
    logger.info("  JSON:  %s", json_path)
    logger.info("=" * 60)
    logger.info("\nNext: Open Anki → File → Import → select the .apkg file above")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ankify pipeline test")
    parser.add_argument("pdf_path", help="Path to the PDF file")
    parser.add_argument("--pages", type=int, default=None, help="Limit to first N pages")
    parser.add_argument("--slide", type=int, default=None, help="Process a single specific slide number")
    args = parser.parse_args()

    asyncio.run(run_pipeline(args.pdf_path, max_pages=args.pages, single_slide=args.slide))
