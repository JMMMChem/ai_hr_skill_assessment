import json
import re

from langchain_openai import ChatOpenAI

from . import chromadb_help
from . import function_calling_utils

import settings
import redis

from openai import OpenAI

import requests
import json

import time
import numpy as np

class LLMHelper:
    def __init__(
        self,
        chroma_helper: chromadb_help.ChromaHelper,
        session_uuid: str,
    ) -> None:
        """ """
        self.completion_model = ChatOpenAI(
            openai_api_key=settings.OPENAI_API_KEY,
            model_name="gpt-4o",
            temperature=settings.TEMPERATURE,
        )

        self.session_uuid = session_uuid
        self.chroma_helper = chroma_helper
        self.r = redis.from_url(settings.REDIS_URL)

    def get_default_prompts(self):
        """
        Get default prompts from prompts.json

        Returns:
            role_prompt: role prompt
            sources_prompt: sources prompt
        """

        role_prompt = "Responde la pregunta de forma agradable y exacta\n\n"
        sources_prompt = """

        Eres un asistente del sector inmobiliario. Tus funciones son resolver dudas a los clientes sobre las siguientes materias:

        - Gastos e impuestos al vender una propiedad
        - Gastos e impuestos al comprar una propiedad

        A modo de resumen, los gastos e impuestos al vender una propiedad son los siguientes:
        - Impuesto sobre el Incremento de Valor de los Terrenos de Naturaleza Urbana (Plusvalía Municipal)
        - Impuesto sobre la Renta de las Personas Físicas (IRPF)
        - Impuesto sobre Bienes Inmuebles (IBI)
        - Gastos de plusvalía
        - Gastos de cancelación de hipoteca
        - Gastos de agencia inmobiliaria

        El impuesto de Plusvalía Municipal es un impuesto que grava el incremento de valor de los terrenos de naturaleza urbana. Se calcula en función del valor catastral del terreno y del número
        de años que han transcurrido desde la última transmisión de la propiedad. En Andalucía, el tipo impositivo es del 30%
        del incremento de valor del terreno. 

        Mientras que los gastos e impuestos al comprar una propiedad son los siguientes:
        - Impuesto sobre Transmisiones Patrimoniales (ITP) para viviendas de segunda mano.
        En Andalucía:
            Tipo general: 8-10 %
            Tipo reducido:
            7 % para vivienda habitual de no más de 130.000 €.
            3,5% para vivienda habitual de no más de 130.000 € destinada a un menor de 35 años, o de no más de 180.000 € destinada a una persona con discapacidad superior al 33 por ciento o miembro de una familia numerosa.

        - Impuesto sobre el Valor Añadido (IVA): En el caso de vivienda nueva, se aplica el IVA, que es el mismo en todo el territorio español: el tipo reducido del 10 % 
        con carácter general y el superreducido del 4 % 
        en algunos casos, como la compra de una vivienda de protección oficial. 
        La única excepción es Canarias, donde se aplica el IGIC (del 6,5 %
          con carácter general o reducido del 3 % para vivienda social).
        - Impuesto sobre Actos Jurídicos Documentados (AJD):
        Ese impuesto en Andalucía es:
            Tipo general: 1,5 %
            Tipo reducido:
            0,3 % para vivienda habitual de menores de 35 si no supera los 130.000 €.
            0,1 % para familia numerosa o personas con discapacidad superior al 33 por ciento si no supera los 180.000 €.
        - Gastos de notaría
        - Gastos de registro de la propiedad
        - Gastos de gestoría

        Cuando pregunten por cuántos impuestos tienen que pagar, si dan cifras, dalas tu también. Si no dan cifras, no las des tú tampoco.

        Tienes una fuente de conocimientos amplia.
        
        INICIO DE LA BASE DE CONOCIMIENTOS:\n\n{sources}\n\nFIN DE LA BASE DE CONOCIMIENTOS
                
        """

        return role_prompt, sources_prompt

    def get_sources(
        self,
        user_message: str,
        num_docs: int = 4,
    ):
        """
        Get sources from local ChromaDB with similarity search

        Args:
            user_message: text message from the user
            num_docs: number of documents to return

        Returns:
            sources: list of sources
            sources_prompt: prompt with the sources
        """

        search_response = self.chroma_helper.similarity_search_with_score(
            user_message,
            num_docs=num_docs,
        )
        
        sources_prompt = ""
        sources = []
        for index, result in enumerate(search_response):
            document_name = result[0].metadata.get("DocumentName")
            chunk_index = result[0].metadata.get("ChunkIndex")
            content = result[0].page_content
            score = result[1]

            sources_prompt += f"({index+1}) {content} + \n\n"

            source_dict = {
                "document": document_name,
                "page": chunk_index,
                "score": score,
            }
            sources.append(source_dict)
            print(f"Document: {document_name}, Chunk: {chunk_index}, Score: {score}")
            print(f"Content: {content}")
        return sources, sources_prompt
    
    def append_to_chat_history(self, session_id, role, message):
        chat_history = self.r.get(session_id)
        
        if chat_history is None:
            chat_history = []
        else:
            chat_history = json.loads(chat_history)
        
        # Append the new message
        chat_history.append({"role": role, "content": message})
        
        # Store updated chat history back in Redis
        self.r.set(session_id, json.dumps(chat_history))
    
    def get_history(self, session_id: str):
        """
        Get history from local ChromaDB by user_id

        Args:
            user_id: user_id

        Returns:
            memory_prompt: chat history prompt
        """

        chat_history = self.r.get(session_id)
        if chat_history:
            chat_history = json.loads(chat_history)
        else:
            chat_history = []

        return chat_history


    def qna_response(
        self, user_message: str, experimental: bool = False
    ):
        """
        Get a response from LLM with context
        Args:
            user_message: text message from the user
            experimental: experimental mode
        Returns:
            prompt: prompt to be sent to LLM
            response: dictionary with the response and the cost
        """
        role_prompt, sources_prompt = self.get_default_prompts()

        sources_list, sources = self.get_sources(
            user_message
        )

        input_prompt = "Question: {input}\nAnswer: "

        self.append_to_chat_history(self.session_uuid, "user", user_message)

        MODEL_PROMPT = []

        def calculate_candidate_rating(self, soft_skills: dict) -> dict:
            """
            Calculate a candidate's rating based on their soft skills.
            
            Args:
                soft_skills: Dictionary containing soft skill scores
                    Example: {
                        "communication": 8,
                        "teamwork": 7,
                        "leadership": 6,
                        "problem_solving": 8,
                        "adaptability": 7
                    }
                    Each skill should be rated from 1-10
            
            Returns:
                dict: Contains overall rating and individual skill ratings
                    Example: {
                        "overall_rating": 7.2,
                        "strengths": ["communication", "problem_solving"],
                        "areas_for_improvement": ["leadership"],
                        "skill_ratings": {
                            "communication": "Excellent",
                            "teamwork": "Good",
                            ...
                        }
                    }
            """
            # Weights for different skills (can be adjusted)
            weights = {
                "communication": 0.25,
                "teamwork": 0.2,
                "leadership": 0.15,
                "problem_solving": 0.25,
                "adaptability": 0.15
            }
            
            # Calculate weighted average
            weighted_scores = []
            for skill, score in soft_skills.items():
                if skill in weights:
                    weighted_scores.append(score * weights[skill])
            
            overall_rating = round(sum(weighted_scores), 1)
            
            # Determine strengths and areas for improvement
            strengths = [skill for skill, score in soft_skills.items() if score >= 8]
            areas_for_improvement = [skill for skill, score in soft_skills.items() if score <= 5]
            
            # Convert numerical scores to ratings
            rating_scale = {
                range(9, 11): "Excellent",
                range(7, 9): "Good",
                range(5, 7): "Average",
                range(3, 5): "Fair",
                range(0, 3): "Needs Improvement"
            }
            
            skill_ratings = {}
            for skill, score in soft_skills.items():
                for score_range, rating in rating_scale.items():
                    if score in score_range:
                        skill_ratings[skill] = rating
                        break
            
            return {
                "overall_rating": overall_rating,
                "strengths": strengths,
                "areas_for_improvement": areas_for_improvement,
                "skill_ratings": skill_ratings
            }


        def obtener_mejor_interes_hipotecario(tipo_hipoteca):
            """
            Obtiene la mejor tasa hipotecaria para un préstamo desde una página web.

            Args:
                tipo_hipoteca (str): El tipo de hipoteca (fija, variable, mixta).

            Returns:
                float: La mejor tasa hipotecaria.
            """
            url = "https://www.helpmycash.com/api/front/comparator/products/compare/hipotecas/"
            payload = json.dumps({
            "page": 2,
            "filters": None,
            "sortOptions": {
                "featured": "asc"
            },
            "layoutOptions": {
                "mortgageAmount": 100000,
                "term": 300
            }
            })
            headers = {
            'content-type': 'application/json',
            'Cookie': 'XSRF-TOKEN=eyJpdiI6IkwvTDFteExVaXNSSW9za21MK3J5dFE9PSIsInZhbHVlIjoicjhNZnI0TVVLOXdFMy8yeW1YOS8wczFBL1A2RHIwSHJNQVhiN1hXaGFCR0x1QWNuQitJL2tXUVZobnVUdGFoNlh5SWFURGxyMDdkMDNtQlRNeVh3MzA1MlpRU0RRMit3ekluR29JdEVGOGVMUzQ3cUxIbE9zU0o5ZU5zQ2wxb1ciLCJtYWMiOiIwZDcyODJkNTMyZTVlYWMxZjY1NmRhZWRiZTQ5OTdlZjJkZTg5MTQ5YzVlZWJlZTI5NWQ5M2M0MWRhYjQ4NmIzIiwidGFnIjoiIn0%3D; hmc=eyJpdiI6Im9HYjhxWHVOUDVyVHlPSVlrTnFzMmc9PSIsInZhbHVlIjoiNmZoME1BQSswL2dxZUpKV0o4b0I4R1RnRWJYcXJzbVVDSzVOUVNiT1FENklDZDRUZCtHNHVrbnlISGtteFNsMFJRNlJZSzBUVHRIaGdubm9Rc0RUTXZTVmdlZWdWNW9XNW9GZExXVThaamorNzZVTWhob2s2SFMwNDlIQ2tCYVgiLCJtYWMiOiJjMjVmNmM2NWU2MDNlNjhjNzY3MzBmYWQ0Zjg5ODQ4NmViMjliYzMzMDYzYTI0MGYzZDZiOTY1YTY2NTg2MWZmIiwidGFnIjoiIn0%3D'
            }

            mortgage_type_translated = {
                "fija": "fixed",
                "fijo": "fixed",
                "variable": "variable",
                "mixta": "mixed",
                "mixto": "mixed"
            }

            response = requests.request("POST", url, headers=headers, data=payload)
            print(response.json())
            filtered_hipoteca_list = [mortgage for mortgage in response.json()['products'] if mortgage['sheetInfo']['mortgageType'] == mortgage_type_translated[tipo_hipoteca]]
            sorted_mortgage_list = sorted(filtered_hipoteca_list, key=lambda x: x['sheetInfo']['interest']['tae'])

            if mortgage_type_translated[tipo_hipoteca]=='fixed':
                best_mortgages = [
                    {
                        "title": mortgage['title'],
                        "bank": mortgage['brand']['name'],
                        "tae": mortgage['sheetInfo']['interest']['tae'],
                        "tin": mortgage['sheetInfo']['interest']['initialInterestWithoutBonuses'],
                    }
                    for mortgage in sorted_mortgage_list[:2]
                ]

                return f"Las mejores hipotecas son: \n\n {best_mortgages[0]['title']} - {best_mortgages[0]['bank']} al {best_mortgages[0]['tae']}% TAE y {best_mortgages[0]['tin']}% TIN \n\n  {best_mortgages[1]['title']} - {best_mortgages[1]['bank']} al {best_mortgages[1]['tae']}% TAE y {best_mortgages[1]['tin']}% TIN"

            elif mortgage_type_translated[tipo_hipoteca]=='variable':
                best_mortgages = [
                    {
                        "title": mortgage['title'],
                        "bank": mortgage['brand']['name'],
                        "tae": mortgage['sheetInfo']['interest']['tae'],
                        "tin": mortgage['sheetInfo']['interest']['initialInterestWithoutBonuses'],
                        "month": mortgage['sheetInfo']['interest']['initialTerm'],
                        "tin_after": mortgage['sheetInfo']['interest']['formattedAfterInterestWithoutBonuses'].replace(",", ".")
                    }
                    for mortgage in sorted_mortgage_list[:2]
                ]

                return f"Las mejores hipotecas son: \n\n {best_mortgages[0]['title']} - {best_mortgages[0]['bank']} al {best_mortgages[0]['tae']}% TAE y {best_mortgages[0]['tin']}% TIN los primeros {best_mortgages[0]['month']} meses, luego {best_mortgages[0]['tin_after']} \n\n {best_mortgages[1]['title']} - {best_mortgages[1]['bank']} al {best_mortgages[1]['tae']}% TAE y {best_mortgages[1]['tin']}% TIN los primeros {best_mortgages[1]['month']} meses, luego {best_mortgages[1]['tin_after']}"

            elif mortgage_type_translated[tipo_hipoteca]=='mixed':
                best_mortgages = [
                    {
                        "title": mortgage['title'],
                        "bank": mortgage['brand']['name'],
                        "tae": mortgage['sheetInfo']['interest']['tae'],
                        "tin": mortgage['sheetInfo']['interest']['initialInterestWithoutBonuses'],
                        "years": int(mortgage['sheetInfo']['interest']['initialTerm']/12),
                        "tin_after": mortgage['sheetInfo']['interest']['formattedAfterInterestWithoutBonuses'].replace(",", ".")
                    }
                    for mortgage in sorted_mortgage_list[:2]
                ]

                return f"Las mejores hipotecas son: \n\n {best_mortgages[0]['title']} - {best_mortgages[0]['bank']} al {best_mortgages[0]['tae']}% TAE y {best_mortgages[0]['tin']}% TIN los primeros {best_mortgages[0]['years']} años, luego {best_mortgages[0]['tin_after']} \n\n {best_mortgages[1]['title']} - {best_mortgages[1]['bank']} al {best_mortgages[1]['tae']}% TAE y {best_mortgages[1]['tin']}% TIN los primeros {best_mortgages[1]['years']} años, luego {best_mortgages[1]['tin_after']}"

        client = OpenAI(
        api_key=settings.OPENAI_API_KEY,
        )        
        functions = [
            {
                "name": "calculate_candidate_rating",
                "description": "Calculate a candidate's rating based on their soft skills.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "soft_skills": {
                            "type": "object",
                            "description": "Dictionary of soft skills with scores from 1-10",
                            "properties": {
                                "communication": {"type": "number", "description": "Score for communication skills"},
                                "teamwork": {"type": "number", "description": "Score for teamwork abilities"},
                                "leadership": {"type": "number", "description": "Score for leadership capabilities"},
                                "problem_solving": {"type": "number", "description": "Score for problem solving abilities"},
                                "adaptability": {"type": "number", "description": "Score for adaptability"}
                            }
                        }
                    },
                    "required": ["soft_skills"]
                }
            }
        ]

        messages = []
        message_with_sources = {
            "role": "system",
            "content": f"""
            You are an AI Skill Assessment Agent specialized in evaluating candidates' soft skills. Your role is to:

            1. Help assess candidates' soft skills through conversation
            2. Ask relevant questions to evaluate key soft skills including:
               - Communication
               - Teamwork
               - Leadership
               - Problem Solving
               - Adaptability

            Guidelines for assessment:
            - Ask one question at a time
            - Listen carefully to responses and look for specific behavioral indicators
            - Be objective and professional in your evaluation
            - Focus on concrete examples and past experiences
            - Avoid leading questions
            
            After gathering sufficient information, you can use the calculate_candidate_rating function to generate a comprehensive assessment.

            Remember to:
            - Keep the conversation flowing naturally
            - Be encouraging but neutral
            - Ask for specific examples when needed
            - Maintain professional boundaries
            - Provide clear explanations of what you're assessing

            Base your assessment on the candidate's responses and any additional context provided:

            {sources}
            """
        }

        messages.append(message_with_sources)

        chat_history = self.get_history(self.session_uuid)
        chat_history_with_context = messages + chat_history

        # print(f"CHAT HISTORY WITH CONTEXT: {chat_history_with_context}")

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=chat_history_with_context,
            functions=functions,
            function_call = 'auto'
        )

        llm_response = response.choices[0].message
        print(f"RESPONSE: {llm_response}")

        if dict(llm_response).get('function_call'):
            
            # Which function call was invoked
            function_called = llm_response.function_call.name
            print(f"FUNCTION CALLED: {function_called}")

            # Extracting the arguments
            function_args  = json.loads(llm_response.function_call.arguments)
            
            # Function names
            available_functions = {
                "calculate_candidate_rating": calculate_candidate_rating
            }
            
            print(f"ARGUMENTS: {list(function_args.values())}")

            fuction_to_call = available_functions[function_called]
            response_message = fuction_to_call(*list(function_args.values()))
        else:
            response_message = llm_response.content

        self.append_to_chat_history(self.session_uuid, "assistant", response_message)
        response = {
            "completion": response_message,
        }
        print('session uuid:', self.session_uuid)

        return sources_list, MODEL_PROMPT, response
