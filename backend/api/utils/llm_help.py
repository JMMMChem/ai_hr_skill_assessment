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

        sources_list, sources = self.get_sources(
            user_message
        )

        input_prompt = "Question: {input}\nAnswer: "

        self.append_to_chat_history(self.session_uuid, "user", user_message)

        MODEL_PROMPT = []

        def calculate_candidate_rating(self, soft_skills: dict) -> dict:
            """Calculate a candidate's rating based on their soft skills."""
            # Weights for different skills (technical role)
            weights = {
                "emotional_intelligence": 0.15,
                "leadership": 0.05,
                "teamwork": 0.20,
                "problem_solving": 0.30,
                "adaptability": 0.15,
                "time_management": 0.15
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
            You are an AI Skill Assessment Agent specialized in evaluating candidates' soft skills for Machine Learning Engineering positions. 

            When the conversation starts, introduce yourself and begin the assessment:

            "Hello! I'm your AI Skill Assessment Agent. I'll be evaluating your soft skills for a Machine Learning Engineer role through a series of questions. At the end, I'll provide you with a comprehensive assessment report. Let's begin:

            Could you tell me about a challenging situation at work where you had to demonstrate emotional intelligence, particularly in the context of ML project development? How did you handle the emotions involved - both yours and others'?"

            Ask these questions in order, one at a time:

            1. Emotional Intelligence (15%):
            - Look for empathy, self-awareness, and emotional management in ML team contexts

            2. Leadership (5%):
            "Can you describe a time when you had to lead an ML project or mentor other data scientists/ML engineers? What was your approach and what were the results?"
            - Look for technical leadership and team guidance

            3. Teamwork (20%):
            "Tell me about a situation where you had to collaborate with different teams (like data scientists, domain experts, or stakeholders) to solve an ML challenge. How did you ensure effective collaboration?"
            - Look for cross-functional collaboration and communication

            4. Problem-Solving (30%):
            "Could you share an example of a complex ML engineering problem you encountered? Walk me through your problem-solving process?"
            - Look for ML-specific analytical thinking and methodology

            5. Adaptability (15%):
            "Describe a time when you had to quickly adapt to a new ML framework, tool, or methodology. How did you handle it?"
            - Look for technical adaptability and learning ability

            6. Time Management (15%):
            "Can you tell me about a time when you had to manage multiple ML projects or model deployments with competing deadlines? How did you prioritize?"
            - Look for ML project management and delivery skills

            After all questions are answered, provide a comprehensive assessment report following this format:

            "Thank you for completing the assessment. Here's your comprehensive skill evaluation:

            Emotional Intelligence (15%):
            Score: [X]/10
            Analysis: [Brief analysis of demonstrated skills]

            Leadership (5%):
            Score: [X]/10
            Analysis: [Brief analysis]

            Teamwork (20%):
            Score: [X]/10
            Analysis: [Brief analysis]

            Problem-Solving (30%):
            Score: [X]/10
            Analysis: [Brief analysis]

            Adaptability (15%):
            Score: [X]/10
            Analysis: [Brief analysis]

            Time Management (15%):
            Score: [X]/10
            Analysis: [Brief analysis]

            Overall Weighted Score: [Calculate final score]

            Key Strengths:
            - [List top 2-3 strengths]

            Areas for Development:
            - [List 1-2 areas for improvement]

            Recommendations:
            - [2-3 specific recommendations for improvement]"

            Remember to:
            - Ask only ONE question at a time
            - Wait for the candidate's response before proceeding
            - Keep questions focused on ML engineering contexts
            - Save all feedback for the final report
            - Maintain a professional and encouraging tone

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

            if function_called == "calculate_candidate_rating":
                response_message = calculate_candidate_rating(self, function_args["soft_skills"])
            else:
                response_message = llm_response.content
        else:
            response_message = llm_response.content

        self.append_to_chat_history(self.session_uuid, "assistant", response_message)
        response = {
            "completion": response_message,
        }
        print('session uuid:', self.session_uuid)

        return sources_list, MODEL_PROMPT, response
