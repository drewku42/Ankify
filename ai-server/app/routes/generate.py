import logging
import time

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse

from app.models import (
    ExportRequest,
    ExportResponse,
    GenerateResponse,
    GeneratedDeck,
)
from app.services.pdf_processor import pdf_to_slides
from app.services.card_generator import generate_cards
from app.services.deck_exporter import export_deck

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/generate", tags=["generation"])


@router.post("/deck", response_model=GenerateResponse)
async def generate_deck_from_pdf(
    file: UploadFile = File(...),
    deck_name: str | None = Form(default=None),
):
    """Upload a PDF and generate a full deck of Anki flashcards."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File must be under 10 MB")

    start = time.time()

    pdf_bytes = await file.read()
    logger.info("Received PDF: %s (%d bytes)", file.filename, len(pdf_bytes))

    try:
        slides = pdf_to_slides(pdf_bytes)
    except Exception as e:
        logger.error("PDF processing failed: %s", e)
        raise HTTPException(status_code=422, detail=f"Could not process PDF: {e}")

    try:
        deck: GeneratedDeck = await generate_cards(slides)
    except Exception as e:
        logger.error("Card generation failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Card generation failed: {e}")

    if deck_name:
        deck.title_suggestion = deck_name

    elapsed = time.time() - start

    return GenerateResponse(
        deck=deck,
        page_count=len(slides),
        processing_time_seconds=round(elapsed, 2),
    )


@router.post("/export", response_model=ExportResponse)
async def export_deck_apkg(request: ExportRequest):
    """Export a set of cards as a downloadable .apkg file."""
    if not request.cards:
        raise HTTPException(status_code=400, detail="No cards to export")

    try:
        file_path = export_deck(request.deck_name, request.cards)
    except Exception as e:
        logger.error("Export failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Export failed: {e}")

    import os
    file_size = os.path.getsize(file_path)

    return ExportResponse(
        file_path=file_path,
        file_size_bytes=file_size,
        card_count=len(request.cards),
    )


@router.post("/export/download")
async def export_and_download(request: ExportRequest):
    """Export cards and directly return the .apkg file for download."""
    if not request.cards:
        raise HTTPException(status_code=400, detail="No cards to export")

    try:
        file_path = export_deck(request.deck_name, request.cards)
    except Exception as e:
        logger.error("Export failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Export failed: {e}")

    safe_name = request.deck_name.replace(" ", "_")
    return FileResponse(
        path=file_path,
        media_type="application/octet-stream",
        filename=f"{safe_name}.apkg",
    )
