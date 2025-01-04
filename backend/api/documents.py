from typing import List
from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from starlette import status
import models
import schema
from fastapi import APIRouter
from database import get_db

router = APIRouter(prefix="/api/documents", tags=["Documents"])


@router.get("/", response_model=List[schema.Document])
def get_documents(db: Session = Depends(get_db)):
    documents = db.query(models.Document).all()

    return documents


@router.post(
    "/", status_code=status.HTTP_201_CREATED, response_model=schema.CreateDocument
)
def create_document(document: schema.CreateDocument, db: Session = Depends(get_db)):
    new_document = models.Document(**document.dict())
    db.add(new_document)
    db.commit()
    db.refresh(new_document)

    return new_document


@router.get("/{id}", response_model=schema.Document, status_code=status.HTTP_200_OK)
def get_document(id: int, db: Session = Depends(get_db)):
    document = db.query(models.Document).filter(models.Document.id == id).first()

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"The id:{id} does not exist"
        )

    return document


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(id: int, db: Session = Depends(get_db)):
    document = db.query(models.Document).filter(models.Document.id == id)

    if document.first() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"The id:{id} does not exist"
        )

    document.delete(synchronize_session=False)
    db.commit()

    return


@router.put("/{id}", response_model=schema.UpdateDocument, status_code=status.HTTP_200_OK)
def update_document(id: int, document: schema.CreateDocument, db: Session = Depends(get_db)):
    db.query(models.Document).filter(models.Document.id == id).update(document.dict())
    db.commit()

    return document