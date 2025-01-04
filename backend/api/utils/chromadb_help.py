from time import sleep

from langchain.docstore.document import Document
from langchain.text_splitter import TokenTextSplitter
from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
    UnstructuredPowerPointLoader,
    UnstructuredWordDocumentLoader,
)
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

import settings
import logging


class ChromaHelper:
    def __init__(
        self,
        chunk_size: int,
        chunk_overlap: int,
        assistant_id: str = None,
    ) -> None:
        """ """
        self.embeddings = OpenAIEmbeddings(
            openai_api_key=settings.OPENAI_API_KEY,
            model="text-embedding-3-large",
        )
        self.vectorstore = Chroma(
            persist_directory=f"./chroma_db_{assistant_id}",
            embedding_function=self.embeddings,
        )
        self.text_splitter = TokenTextSplitter(
            chunk_size=chunk_size, chunk_overlap=chunk_overlap
        )

    def upload_text(self, text: str, metadata: dict) -> list:
        """
        Upload text with metadata and their embedding to local ChromaDB

        Args:
            text: content to be uploaded
            metadata: dictionary with the metadata

        Returns:
            str: top scorers of the match season and game stats
        """
        doc = [Document(page_content=text)]
        doc = self.text_splitter.split_documents(doc)

        doc = self.add_metadata(doc, metadata)

        self.upload_docs(doc)

        return doc

    def upload_docs(self, docs: list) -> None:
        """
        Upload the documents in local ChromaDB with their embedding

        Args:
            docs: list of documents to be uploaded
        """
        print("len(docs):", len(docs))
        iterations = len(docs) / 16
        if iterations == int(iterations):
            iterations = int(iterations)
        else:
            iterations = int(iterations) + 1
        for i in range(iterations):
            start = i * 16
        end = min((i + 1) * 16, len(docs))
        try:
            response = self.vectorstore.add_documents(docs[start:end])
        except Exception as e:
            logging.error(f"Exception occurred: {e}")
            if hasattr(e, 'error') and e.error.get("code") == "429":
                retry_after = int(e.headers["Retry-After"])
                sleep(retry_after)
                response = self.vectorstore.add_documents(docs[start:end])
            else:
                raise e

    def similarity_search_with_score(
        self, query: str, num_docs: int = 3
    ) -> list:
        """
        Perform a similarity search between a query and the ingested documents

        Args:
            query: Text to be searched by embedding distance
            num_docs: Number of documents to be returned

        Returns:
            response: List of tuples with the document and its similarity score
        """

        response = self.vectorstore.similarity_search_with_score(query, k=num_docs)

        return response

    def add_metadata(self, data: list, properties: dict) -> list:
        """
        Add metadata and ChunkIndex parameter

        Args:
            data: list of documents
            properties: dictionary with the metadata

        Returns:
            data: list of documents with metadata and ChunkIndex parameter
        """
        properties["ChunkIndex"] = 0
        for index in range(len(data)):
            properties["ChunkIndex"] += 1
            data[index].metadata = properties.copy()

        return data

    def add_txt(self, file_path, properties: dict) -> list:
        """
        Add a text file split by self.text_splitter to the collection

        Args:
            file_path: path of the text file
            properties: dictionary with the metadata

        Returns:
            data: list of sections with metadata
        """
        loader = TextLoader(file_path, encoding="utf-8")
        data = loader.load_and_split(self.text_splitter)

        data = self.add_metadata(data, properties)

        self.upload_docs(data)

        return data

    def add_pdf(self, file_path: str, properties: dict) -> list:
        """
        Add a PDF file split by pages to the collection

        Args:
            file_path: path of the PDF file
            properties: dictionary with the metadata

        Returns:
            data: list of sections with metadata
        """
        loader = PyPDFLoader(file_path)
        pages = loader.load_and_split()

        pages = self.add_metadata(pages, properties)
        self.upload_docs(pages)

        return pages

    def get_docx_sections_text(self, data: list) -> list:
        """
        Split a Word document by title category

        Args:
            data: list of elements of the document

        Returns:
            sections: list of sections of the document
        """
        sections = []
        current_section_content = ""

        for elem in data:
            category = elem.metadata.get("category", "").lower()
            content = elem.page_content

            if category == "title":
                if current_section_content:
                    sections.append(Document(page_content=current_section_content))
                current_section_content = content
            else:
                current_section_content += content

        if current_section_content:
            sections.append(Document(page_content=current_section_content))

        return sections

    def add_docx(self, file_path: str, properties: dict) -> list:
        """
        Add a Word document split by sections to the collection

        Args:
            file_path: path of the Word document
            properties: dictionary with the metadata

        Returns:
            data: list of pages with metadata
        """
        loader = UnstructuredWordDocumentLoader(file_path, mode="elements")
        data = loader.load()
        data = self.get_docx_sections_text(data)

        data = self.add_metadata(data, properties)

        self.upload_docs(data)

        return data

    def get_pptx_page_text(self, doc: Document):
        """
        Get the text from a slide

        Args:
            doc: slide as type langchain.schema.document.Document

        Returns:
            text: string with the text from the slide
        """
        category = doc.metadata["category"]
        if category == "Title":
            text = "\n" + doc.page_content.strip().upper() + "\n"
        elif category == "ListItem":
            text = " - " + doc.page_content.strip() + "\n"
        else:
            text = doc.page_content.strip() + " "

        return text

    def add_pptx(self, file_path: str, properties: dict, min_characters: int = 5):
        """
        Add a ppt file split by slides to the collection

        Args:
            file_path: the path of the ppt file
            properties: dictionary with the metadata
            min_characters: the minimum number of characters for a slide to be included in the list

        Returns:
            ppt_slides: list of slides with metadata
        """
        loader = UnstructuredPowerPointLoader(
            file_path, mode="elements", strategy="fast"
        )
        data = loader.load()

        page_text = ""
        page_index = 1
        ppt_slides = []

        for doc in data:
            if doc.metadata["category"] == "PageBreak":
                pass
            elif doc.metadata["page_number"] == page_index:
                page_text += self.get_pptx_page_text(doc)
            else:
                if len(page_text) > min_characters:
                    chunk = Document(page_content=page_text.strip())
                    ppt_slides.append(chunk)
                page_index += 1
                page_text = self.get_pptx_page_text(doc)

        if len(page_text) > min_characters:
            chunk = Document(page_content=page_text.strip())
            ppt_slides.append(chunk)

        data = self.add_metadata(ppt_slides, properties)

        self.upload_docs(ppt_slides)

        return ppt_slides
