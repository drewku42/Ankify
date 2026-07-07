"""Tests for pdf_processor: output shape (must stay stable) and, crucially,
that peak memory during rendering does NOT scale with page count.

The memory test is the one that drives the streaming refactor. It reproduces the
2026-07-06 prod OOM: the original code rendered every page into RAM at once, so a
big deck ballooned to ~3 GB and wedged the box. Streaming one page at a time keeps
peak memory flat regardless of deck size.
"""

import base64
import io
import multiprocessing
import platform
import resource
from pathlib import Path

from PIL import Image

# ai-server root, so spawned subprocesses can import `app`.
PROJECT_ROOT = str(Path(__file__).resolve().parent.parent)


def _make_pdf(path: Path, pages: int) -> str:
    """Write a `pages`-long PDF of letter-size (8.5x11 in @ 200 DPI) blank pages.

    Page content is irrelevant to the memory profile — a decoded RGB page is
    width*height*3 bytes regardless of what's drawn (~11 MB per page here), which
    is exactly the pressure that caused the outage.
    """
    page = Image.new("RGB", (1700, 2200), "white")
    page.save(
        path,
        "PDF",
        resolution=200.0,
        save_all=True,
        append_images=[page] * (pages - 1),
    )
    return str(path)


def _peak_rss_child(pdf_path: str, project_root: str, queue) -> None:
    """Run pdf_to_slides in a fresh process and report its peak RSS.

    ru_maxrss is the peak resident memory over the process lifetime, so a fresh
    subprocess gives a clean peak for exactly this work — no cross-test bleed.
    """
    import sys

    sys.path.insert(0, project_root)
    from app.services.pdf_processor import pdf_to_slides

    slides = pdf_to_slides(pdf_path)
    peak = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    queue.put((len(slides), peak))


def _measure_peak_mb(pdf_path: str) -> tuple[int, float]:
    ctx = multiprocessing.get_context("spawn")
    queue = ctx.Queue()
    proc = ctx.Process(target=_peak_rss_child, args=(pdf_path, PROJECT_ROOT, queue))
    proc.start()
    n_slides, peak = queue.get()
    proc.join()
    # macOS reports ru_maxrss in bytes; Linux in kilobytes.
    peak_mb = peak / (1024 * 1024) if platform.system() == "Darwin" else peak / 1024
    return n_slides, peak_mb


def test_peak_memory_does_not_scale_with_page_count(tmp_path):
    # Both sizes are past the ~20-page startup knee (fixed Poppler/PIL warmup
    # cost), so the difference measures genuine per-page scaling, not one-time
    # setup. Holding the whole deck in RAM grows ~11 MB/page; streaming one page
    # at a time stays flat.
    small = _make_pdf(tmp_path / "small.pdf", pages=24)
    large = _make_pdf(tmp_path / "large.pdf", pages=72)

    n_small, peak_small = _measure_peak_mb(small)
    n_large, peak_large = _measure_peak_mb(large)

    assert n_small == 24
    assert n_large == 72

    growth = peak_large - peak_small
    # All-in-RAM would grow by ~(72-24) * ~11 MB ≈ 530 MB. Streaming stays within
    # a few tens of MB. 60 MB sits well between the two regimes.
    assert growth < 60, (
        f"peak memory grew {growth:.0f} MB going from 24 to 72 pages "
        f"(small={peak_small:.0f} MB, large={peak_large:.0f} MB) — "
        f"rendering is holding the whole deck in RAM"
    )


def test_returns_one_valid_jpeg_slide_per_page(tmp_path):
    """Output-shape guard: the refactor must not change what comes out."""
    from app.services.pdf_processor import pdf_to_slides

    pdf = _make_pdf(tmp_path / "deck.pdf", pages=3)
    slides = pdf_to_slides(pdf)

    assert [s.page_number for s in slides] == [1, 2, 3]
    for s in slides:
        assert s.mime_type == "image/jpeg"
        img = Image.open(io.BytesIO(base64.b64decode(s.image_base64)))
        img.verify()
        assert img.format == "JPEG"
