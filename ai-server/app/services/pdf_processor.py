import base64
import io
import logging
import tempfile
from pathlib import Path

from pdf2image import convert_from_bytes, convert_from_path
from PIL import Image

from app.models import SlideInput

logger = logging.getLogger(__name__)

MAX_IMAGE_DIMENSION = 2048
JPEG_QUALITY = 85


def _optimize_image(image: Image.Image) -> bytes:
    """Resize and compress a slide image for efficient API usage."""
    width, height = image.size
    if max(width, height) > MAX_IMAGE_DIMENSION:
        scale = MAX_IMAGE_DIMENSION / max(width, height)
        new_size = (int(width * scale), int(height * scale))
        image = image.resize(new_size, Image.LANCZOS)

    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=JPEG_QUALITY, optimize=True)
    buffer.seek(0)
    return buffer.read()


def pdf_to_slides(pdf_source: str | bytes) -> list[SlideInput]:
    """Convert a PDF into a list of SlideInput objects with base64-encoded images.

    Args:
        pdf_source: Either a file path (str) or raw PDF bytes.

    Returns:
        List of SlideInput objects, one per page.
    """
    slides: list[SlideInput] = []

    # Render every page to a temp folder in a single Poppler pass, but pull the
    # decoded images back into RAM ONE AT A TIME (paths_only returns file paths,
    # not loaded images). This keeps peak memory flat regardless of deck size —
    # the fix for the 2026-07-06 OOM outage. See adrs/0001-*.
    with tempfile.TemporaryDirectory() as tmpdir:
        if isinstance(pdf_source, str):
            path = Path(pdf_source)
            if not path.exists():
                raise FileNotFoundError(f"PDF not found: {pdf_source}")
            logger.info("Converting PDF to images: %s", pdf_source)
            page_paths = convert_from_path(
                str(path), dpi=200, output_folder=tmpdir, paths_only=True
            )
        else:
            logger.info("Converting PDF bytes to images (%d bytes)", len(pdf_source))
            page_paths = convert_from_bytes(
                pdf_source, dpi=200, output_folder=tmpdir, paths_only=True
            )

        logger.info("Extracted %d pages from PDF", len(page_paths))

        for i, page_path in enumerate(page_paths):
            with Image.open(page_path) as image:
                image_bytes = _optimize_image(image)
            b64 = base64.b64encode(image_bytes).decode("utf-8")
            slides.append(
                SlideInput(
                    page_number=i + 1,
                    image_base64=b64,
                    mime_type="image/jpeg",
                )
            )
            logger.debug("Page %d: %d bytes encoded", i + 1, len(image_bytes))

    return slides


def get_slide_image_bytes(pdf_source: str | bytes, page_number: int) -> bytes:
    """Extract a single page image from a PDF as raw bytes (for media embedding)."""
    if isinstance(pdf_source, str):
        images = convert_from_path(pdf_source, dpi=200, first_page=page_number, last_page=page_number)
    else:
        images = convert_from_bytes(pdf_source, dpi=200, first_page=page_number, last_page=page_number)

    if not images:
        raise ValueError(f"Could not extract page {page_number}")

    return _optimize_image(images[0])
