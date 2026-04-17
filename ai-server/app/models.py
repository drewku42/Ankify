from enum import Enum

from pydantic import BaseModel, Field


class CardType(str, Enum):
    BASIC = "basic"
    CLOZE = "cloze"
    IMAGE = "image"


class GeneratedCard(BaseModel):
    """A single flashcard generated from lecture slide content."""

    card_type: CardType = Field(description="The type of Anki card to create")
    front: str = Field(description="Front side of the card (question/prompt). HTML content.")
    back: str = Field(description="Back side of the card (answer). HTML content.")
    source_page: int = Field(description="1-indexed page number this card was generated from")
    tags: list[str] = Field(
        default_factory=list,
        description="Relevant topic tags for organization",
    )


class GeneratedDeck(BaseModel):
    """A complete set of flashcards generated from lecture slides."""

    cards: list[GeneratedCard] = Field(description="All generated flashcards")
    title_suggestion: str = Field(
        description="Suggested deck title based on the lecture content",
    )
    summary: str = Field(
        description="Brief summary of what the lecture covers",
    )


class SlideInput(BaseModel):
    """Input representing a single slide image for processing."""

    page_number: int
    image_base64: str
    mime_type: str = "image/png"


class GenerateRequest(BaseModel):
    """Request to generate flashcards from a PDF."""

    pdf_path: str | None = Field(
        default=None,
        description="Local file path to the PDF",
    )
    s3_key: str | None = Field(
        default=None,
        description="S3 key for the uploaded PDF",
    )
    deck_name: str | None = Field(
        default=None,
        description="Optional deck name override",
    )


class ExportRequest(BaseModel):
    """Request to export cards as an .apkg file."""

    deck_name: str
    cards: list[GeneratedCard]


class GenerateResponse(BaseModel):
    """Response from card generation."""

    deck: GeneratedDeck
    page_count: int
    processing_time_seconds: float


class ExportResponse(BaseModel):
    """Response from .apkg export."""

    file_path: str
    file_size_bytes: int
    card_count: int
