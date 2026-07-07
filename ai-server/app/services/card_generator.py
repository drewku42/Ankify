import logging
import time

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

from app.config import settings
from app.models import GeneratedDeck, SlideInput

logger = logging.getLogger(__name__)

MAX_OUTPUT_TOKENS = 16384
TEMPERATURE = 0.3


def _build_llm() -> BaseChatModel:
    """Construct the vision LLM for the configured provider.

    Both providers accept the same multimodal `image_url` data-URI content blocks
    (LangChain normalizes them) and support `.with_structured_output()`.
    """
    provider = settings.llm_provider.lower()

    if provider == "google":
        from langchain_google_genai import ChatGoogleGenerativeAI

        return ChatGoogleGenerativeAI(
            model=settings.gemini_model,
            google_api_key=settings.google_api_key or None,
            max_output_tokens=MAX_OUTPUT_TOKENS,
            temperature=TEMPERATURE,
        )

    if provider == "openai":
        return ChatOpenAI(
            model=settings.openai_model,
            api_key=settings.openai_api_key,
            max_tokens=MAX_OUTPUT_TOKENS,
            temperature=TEMPERATURE,
            use_responses_api=True,
        )

    raise ValueError(f"Unknown LLM_PROVIDER: {settings.llm_provider!r} (expected 'openai' or 'google')")

SYSTEM_PROMPT = """You are an expert medical education flashcard creator. Your job is to analyze
lecture slides and generate high-quality Anki flashcards optimized for active recall.

CORE METHOD — Atomic Recall Cards:
1. Read each slide and identify every distinct, testable piece of knowledge.
2. Decompose dense facts into the SMALLEST atomic units. One question per distinct fact.
   Do NOT combine multiple facts into a single card.
3. For each question, count the number of discrete recall targets (N) — the distinct items,
   categories, or list entries the student must recall.
4. Append the count to the question as "(N)".

FRONT FORMAT:
- Use a concise "Topic: aspect? (N)" style. No full sentences.
- Always end with (N) where N is the number of recall targets. Even single-answer questions get (1).
- Examples: "Milia: definition? (1)" or "Milia: appearance? (2)" or "Lipoma: red flags? (3)"

BACK FORMAT:
- When N = 1: a single concise sentence. No extra context beyond what the question asks.
- When N > 1: an HTML ordered list with one item per recall target.
  Use <ol><li>…</li></ol> format.
- Keep answers tight — no filler, no restating the question.

DECOMPOSITION EXAMPLE:
  Bad (too much info in one card):
    Front: What are milia?
    Back: Milia are small keratin-filled cysts, less than 3 mm in diameter, that appear
          as firm, pearly white or yellow papules.

  Good (atomic, concise front):
    Card 1 — Front: Milia: definition? (1)  |  Back: Small keratin-filled cysts.
    Card 2 — Front: Milia: size? (1)  |  Back: Less than 3 mm in diameter.
    Card 3 — Front: Milia: appearance? (2)
             Back: <ol><li>Pearly white</li><li>Yellow</li></ol>

  Another example (from a lipoma slide):
    Card 1 — Front: Lipoma: location? (5)
             Back: <ol><li>Neck</li><li>Trunk</li><li>Extremities</li><li>Buttocks</li><li>Abdominal wall</li></ol>
    Card 2 — Front: Lipoma: red flags? (3)
             Back: <ol><li>Deep to fascia</li><li>≥ 5 cm in diameter</li><li>Rapid growth</li></ol>
    Card 3 — Front: Lipoma: squeeze technique — define? (1)
             Back: A 6-mm punch or stab incision with manual expression and curettage.

SPLITTING RULE:
- Maximum of 10 recall targets per card. If a topic has more than 10 items, split into
  multiple cards (e.g., "Diabetes: risk factors — pt. 1? (5)" and "pt. 2? (5)").

QUALITY GUIDELINES:
- Avoid trivial cards (e.g., "What is the title of this lecture?")
- Avoid overly broad cards (e.g., "Explain everything about the cardiovascular system")
- Prefer specific, testable knowledge
- Include relevant tags based on the medical topic (e.g., "cardiology", "pharmacology")
- Reference the source page number for every card
- Zero cards for blank, title-only, or purely decorative slides

OUTPUT:
- Generate a suggested deck title based on the lecture content
- Generate a brief 1-2 sentence summary of what the lecture covers
- Generate as many atomic cards as the content warrants"""

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
    """Generate flashcards from lecture slide images using a vision LLM.

    The provider (OpenAI GPT-4o or Google Gemini) is selected via LLM_PROVIDER.
    Processes slides in batches to manage context window limits.
    """
    llm = _build_llm()
    logger.info("Using LLM provider=%s", settings.llm_provider)

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
