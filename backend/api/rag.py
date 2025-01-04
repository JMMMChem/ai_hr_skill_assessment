import logging
import os
from .utils import chromadb_help, llm_help, properties_utils, function_calling_utils
from fastapi import HTTPException, Depends
import settings
import schema
from fastapi import APIRouter, Request, UploadFile, File, status, HTTPException
from fastapi.responses import JSONResponse
from database import get_db
from sqlalchemy.orm import Session
import models
from enums import RoleType

router = APIRouter(prefix="/api/rag", tags=["RAG"])


@router.post("/upload_doc_to_folder")
async def upload_doc_to_folder(request: Request):
    # Define the path for the /docs folder
    docs_folder = os.path.join(os.getcwd(), 'docs')
    os.makedirs(docs_folder, exist_ok=True)

    properties = properties_utils.Properties.get_properties(request)
    print("PROPERTIES", properties)
    form = await request.form()
    file: UploadFile = form.get("File")

    # Save the uploaded file to the /docs folder
    file_path = os.path.join(docs_folder, file.filename)
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Update the last uploaded file reference
    with open(os.path.join(docs_folder, 'last_uploaded.txt'), 'w') as f:
        f.write(file.filename)

    logging.info(f"File uploaded to {file_path}")

    return JSONResponse(
        status_code=201,
        content={"description": "File uploaded successfully to /docs folder", "filePath": file_path}
    )


@router.post("/add_uploaded_file_to_chromadb/")
async def add_uploaded_file_to_chromadb(assistant: schema.UpdateChromaDb, db: Session = Depends(get_db)):

    logging.info("assistant id", assistant.id)

    chroma_helper = chromadb_help.ChromaHelper(
        chunk_size=settings.CHUNK_SIZE, chunk_overlap=settings.CHUNK_OVERLAP, assistant_id=assistant.id
    )
    
    # Define the path for the /docs folder
    docs_folder = os.path.join(os.getcwd(), 'docs')
    last_uploaded_file_path = os.path.join(docs_folder, 'last_uploaded.txt')

    # Check if the last uploaded file reference exists
    if not os.path.exists(last_uploaded_file_path):
        logging.info("ERROR: No file has been uploaded yet.")
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"description": "No file has been uploaded yet."}
        )

    # Read the last uploaded file name
    with open(last_uploaded_file_path, 'r') as f:
        file_name = f.read().strip()

    file_path = os.path.join(docs_folder, file_name)
    if not os.path.exists(file_path):
        logging.info(f"ERROR: File {file_name} not found in /docs folder.")
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"description": f"File {file_name} not found in /docs folder."}
        )

    extension = file_name.split(".")[-1].lower()

    upload_functions = {
        "txt": chroma_helper.add_txt,
        "pdf": chroma_helper.add_pdf,
        "docx": chroma_helper.add_docx,
        "pptx": chroma_helper.add_pptx,
    }

    try:
        data = upload_functions[extension](file_path, {})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

    logging.info(f"Data: {data}")

    return JSONResponse(
        status_code=201,
        content={"description": "File processed and uploaded to ChromaDB successfully", "numberChunks": len(data)}
    )

@router.post("/qna")#, response_model=schema.ChatBotResponse)
async def qna(assistant: schema.QnaAssistant, request: Request, db: Session = Depends(get_db)):

    # assistant_id = models.Conversation(id=assistant.conversation_id).assistant_id
    assistant_id = "1"

    chroma_helper = chromadb_help.ChromaHelper(
        chunk_size=settings.CHUNK_SIZE, chunk_overlap=settings.CHUNK_OVERLAP, assistant_id=1
    )
    function_calling_utils_realestate = function_calling_utils.FunctionCallingRealEstate()
    
    llm_helper = llm_help.LLMHelper(
        chroma_helper=chroma_helper,
        session_uuid=assistant.conversation_id
    )

    logging.info(f"Created llm_helper: {llm_helper}")

    conversation_id = assistant.conversation_id
    # Add message to conversation
    message = models.Message(conversation_id=conversation_id, content=assistant.question, role=RoleType.human)
    db.add(message)
    db.commit()


    sources, prompt, llm_response = llm_helper.qna_response(assistant.question)

    
    print(repr(llm_response))
    message = models.Message(conversation_id=conversation_id, content=llm_response["completion"], role=RoleType.bot)
    db.add(message)
    db.commit()
    
    return JSONResponse(
        status_code=201,
        content={"completion": llm_response["completion"]#, "sources": sources
                 }
    )
