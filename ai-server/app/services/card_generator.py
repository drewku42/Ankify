import logging
import time

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

from app.config import settings
from app.models import GeneratedDeck, SlideInput

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert medical education flashcard creator. Your job is to analyze
lecture slides and generate high-quality Anki flashcards that help medical and PA students study
efficiently.

RULES:
1. Create cards that test understanding, not just memorization of isolated facts.
2. Each card should be self-contained — a student should understand the question without
   seeing the original slide.
3. Use HTML formatting in card content: <b>bold</b> for key terms, <br> for line breaks,
   <ul>/<li> for lists.
4. Every card is a basic front/back card: the front is the question or prompt, the back is
   the answer.

QUALITY GUIDELINES:
- Avoid trivial cards (e.g., "What is the title of this lecture?")
- Avoid overly broad cards (e.g., "Explain everything about the cardiovascular system")
- Prefer specific, testable knowledge
- For dense slides, create multiple focused cards rather than one sprawling card
- Include relevant tags based on the medical topic (e.g., "cardiology", "pharmacology")
- Reference the source page number for every card

OUTPUT:
- Generate a suggested deck title based on the lecture content
- Generate a brief 1-2 sentence summary of what the lecture covers
- Generate as many cards as the content warrants — typically 2-5 cards per content-rich slide,
  fewer for title/transition slides, zero for blank or purely decorative slides"""

BATCH_SIZE = 10


def _build_slide_content(slides: list[SlideInput]) -> list[dict]:
    """Build the multimodal message content for a batch of slides."""
    content: list[dict] = []

    content.append({
        "type": "text",
        "text": f"Analyze these {len(slides)} lecture slides and generate Anki flashcards. "
                f"Pages: {slides[0].page_number}-{slides[-1].page_number}.",
    })

    for slide in slides:
        content.append({
            "type": "text",
            "text": f"--- Page {slide.page_number} ---",
        })
        content.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:{slide.mime_type};base64,{slide.image_base64}",
                "detail": "high",
            },
        })

    return content


async def generate_cards(slides: list[SlideInput]) -> GeneratedDeck:
    """Generate flashcards from lecture slide images using GPT-4o Vision.

    Processes slides in batches to manage context window limits.
    """
    llm = ChatOpenAI(
        model=settings.openai_model,
        api_key=settings.openai_api_key,
        max_tokens=16384,
        temperature=0.3,
        use_responses_api=True,
    )

    structured_llm = llm.with_structured_output(GeneratedDeck)

    all_cards = []
    title_suggestion = ""
    summary = ""

    for batch_start in range(0, len(slides), BATCH_SIZE):
        batch = slides[batch_start : batch_start + BATCH_SIZE]
        batch_num = (batch_start // BATCH_SIZE) + 1
        total_batches = (len(slides) + BATCH_SIZE - 1) // BATCH_SIZE

        logger.info(
            "Processing batch %d/%d (pages %d-%d)",
            batch_num, total_batches, batch[0].page_number, batch[-1].page_number,
        )

        content = _build_slide_content(batch)
        message = HumanMessage(content=content)

        start = time.time()
        result: GeneratedDeck = await structured_llm.ainvoke(
            [
                {"role": "system", "content": SYSTEM_PROMPT},
                message,
            ]
        )
        elapsed = time.time() - start

        logger.info(
            "Batch %d: generated %d cards in %.1fs",
            batch_num, len(result.cards), elapsed,
        )

        all_cards.extend(result.cards)

        if batch_start == 0:
            title_suggestion = result.title_suggestion
            summary = result.summary

    return GeneratedDeck(
        cards=all_cards,
        title_suggestion=title_suggestion,
        summary=summary,
    )
