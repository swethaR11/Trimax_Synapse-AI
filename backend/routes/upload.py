from fastapi import APIRouter, File, UploadFile

from backend.utils.pdf_parser import extract_upload


router = APIRouter(prefix="/api", tags=["uploads"])


@router.post("/upload-pdf")
async def upload_document(file: UploadFile = File(...)) -> dict[str, str]:
    text, filename = await extract_upload(file)
    return {"text": text, "filename": filename}

