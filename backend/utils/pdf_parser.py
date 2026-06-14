from __future__ import annotations

from io import BytesIO
from pathlib import Path

from fastapi import HTTPException, UploadFile
from pypdf import PdfReader


MAX_UPLOAD_BYTES = 12 * 1024 * 1024
MAX_EXTRACTED_CHARS = 80_000


async def extract_upload(file: UploadFile) -> tuple[str, str]:
    filename = Path(file.filename or "upload").name
    suffix = Path(filename).suffix.lower()
    if suffix not in {".pdf", ".txt", ".md"}:
        raise HTTPException(415, "Upload a PDF, TXT, or Markdown file.")

    raw = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "File is larger than the 12 MB limit.")

    try:
        if suffix == ".pdf":
            reader = PdfReader(BytesIO(raw))
            text = "\n\n".join(page.extract_text() or "" for page in reader.pages)
        else:
            text = raw.decode("utf-8-sig")
    except Exception as exc:
        raise HTTPException(422, f"Could not extract text from {filename}.") from exc

    normalized = "\n".join(line.rstrip() for line in text.splitlines()).strip()
    if not normalized:
        raise HTTPException(422, "No readable text was found in the uploaded file.")
    return normalized[:MAX_EXTRACTED_CHARS], filename

