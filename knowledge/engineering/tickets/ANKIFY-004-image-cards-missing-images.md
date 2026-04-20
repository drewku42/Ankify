# ANKIFY-004 — Image cards don't actually include images


| Field        | Value                          |
| ------------ | ------------------------------ |
| **Status**   | `open`                         |
| **Priority** | `urgent`                       |
| **Touches**  | ai-server · backend · frontend |
| **Opened**   | 2026-04-19                     |
| **Shipped**  | —                              |


## Problem

Cards typed as "image" in the generated output do not actually contain or render images. The card type exists in the data model and generation output, but the image content is missing — either not extracted from the PDF, not stored, not linked in the card payload, or not rendered in the UI.

## Solution

Investigate the full pipeline and fix wherever the break is:

1. **AI server**: Does the prompt instruct GPT-4o to reference specific slide images for image cards? Are the images being extracted and stored during PDF processing?
2. **Backend/storage**: Are image files stored and accessible? Is the card record linked to an image path?
3. **Frontend**: Does the card renderer handle image cards and display the image?
4. **Export**: Does the `.apkg` export include images in the media mapping for image cards?

## Acceptance criteria

- Image cards display the relevant image in the review/edit UI
- Image cards export correctly in `.apkg` with media included
- Images are sourced from the actual slide content (not placeholders)
- The image card type is clearly differentiated from basic/cloze in the UI

## Out of scope

- User-uploaded images for cards (only AI-extracted from slides)
- Image annotation or cropping tools

## Notes

This touches all three services. Needs investigation to find where the pipeline breaks before committing to a solution. Check `knowledge/engineering/anki/` for `.apkg` media mapping requirements.