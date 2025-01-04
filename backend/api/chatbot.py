from database import get_db
from datetime import datetime
from fastapi import Depends, APIRouter, HTTPException
from langchain_community.agent_toolkits import create_sql_agent
from langchain_community.utilities.sql_database import SQLDatabase
from langchain_openai import ChatOpenAI
from openai import OpenAI
from sqlalchemy.orm import Session
from typing import List
from starlette import status
import models

import ast
import schema
import settings
import json
import logging

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])
logger = logging.getLogger(__name__)

@router.post("/", response_model=schema.ChatBotResponse)
async def chatbot_queries(user_input: str, db: Session = Depends(get_db)):
    # Get default assistant
    default_assistant = db.query(models.Assistant).filter(models.Assistant.id == 1).first()
    if default_assistant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Default assistant not found"
        )

    # Create conversation
    conversation = models.Conversation(
        assistant_id=default_assistant.id,
        team_id=default_assistant.team_id,
        created_at=datetime.utcnow()
    )
    db.add(conversation)
    db.flush()

    client = OpenAI(
        api_key=settings.OPENAI_API_KEY,
    )

    llm = ChatOpenAI(
        model="gpt-3.5-turbo-0125", openai_api_key=settings.OPENAI_API_KEY, temperature=0
    )
    db = SQLDatabase.from_uri(settings.DATABASE_URL)
    agent_executor = create_sql_agent(
        llm, db=db, agent_type="openai-tools", verbose=True
    )
    response = agent_executor.invoke(f"{user_input}")
    print("RESPUESTA: ", response["output"])
    print("TIPO: ", type(response))

    if user_input.startswith("quiero en forma de tabla") or user_input.startswith(
        "quiero en forma de gr"
    ):
        sql_context = [
            {
                "role": "system",
                "content": """
                You are a conversational AI from a platform in which a user can ask you questions related to a database about 
                posts on a social network in Spanish.
                The questions will be in Spanish, and your answers must be also in Spanish.
                """,
            },
            {
                "role": "user",
                "content": f"""
                {user_input.split(":")[1].strip()}
            """,
            },
            {
                "role": "assistant",
                "content": f"""
                {response['output']}
            """,
            },
        ]

        if user_input.startswith("quiero en forma de gr"):
            gpt_user = [
                {
                    "role": "user",
                    "content": """
                    Quiero que me pases la respuesta en formato lista de diccionarios de python. Las fechas que estén en formato AAAA/MM/DD.
                    Para tu información, los campos de la tabla "posts" son: id      title   content published       created_at. 
                    No tienes que utilizar esos campos en la lista.
                    Solo pasa una lista de diccionarios, nada de explicaciones adicionales. 
                    Aquí tienes un ejemplo de cómo podría ser esa lista:
                    [{"value": "value_for_date1", "date": "2023/04/01"}, {"value": "value_for_date2", "date": "2023/04/05"}, { "value": "value_for_date3", "date": "2023/04/11"}]
                    
                    Tanto los keys como los values tienen que ser strings, aunque sean números.
                    Por ejemplo, el usuario podría pedir el desglose del número de posts por día.

                    También puede pedir filtrar por el campo "title" (título) o "content" (contenido) de la tabla "posts".
                    En ese caso, la lista debe ser del tipo:
                    [{"value": "value1", "date": date1}, {"value": "value2", "date": date2}, { "value": "value3", "date":date3}]
                """,
                },
            ]

        elif user_input.startswith("quiero en forma de tabla"):
            gpt_user = [
                {
                    "role": "user",
                    "content": """
                    Quiero que me pases la respuesta en formato lista de diccionarios de python. Las fechas que estén en formato AAAA/MM/DD.
                    Para tu información, los campos de la tabla "posts" son: id      title   content published       created_at. 
                    No tienes que utilizar esos campos en la lista.
                    Solo pasa una lista de diccionarios, nada de explicaciones adicionales. 
                    Aquí tienes un ejemplo de cómo podría ser esa lista:
                    [{"value": "value_for_date1", "date": "2023/04/01"}, {"value": "value_for_date2", "date": "2023/04/05"}, { "value": "value_for_date3", "date": "2023/04/11"}]
                    
                    Tanto los keys como los values tienen que ser strings, aunque sean números.
                    Por ejemplo, el usuario podría pedir el desglose del número de posts por día.

                    También puede pedir filtrar por el campo "title" (título) o "content" (contenido) de la tabla "posts".
                    En ese caso, la lista debe ser del tipo:
                    [{"value": "value1", "date": date1}, {"value": "value2", "date": date2}, { "value": "value3", "date":date3}]
                """,
                },
            ]

        # Define the function to be called
        def get_weather(city):
            # Example weather function
            weather_data = {
                "Nueva York": {"temperature": "23°C", "description": "Nublado"},
                "San Francisco": {"temperature": "18°C", "description": "Con niebla"},
                "Tokyo": {"temperature": "30°C", "description": "Soleado"}
            }
            return weather_data.get(city, {"temperature": "unknown", "description": "unknown"})

        tools = [
            {
                "type": "function",
                "function": {
                "name": "get_weather",
                "description": "Saca el tiempo en la ciudad",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "city": {
                            "type": "string",
                            "description": "El nombre de la ciudad"
                        }
                    },
                    "required": ["city"]
                }
            }
            }
        ]

        gpt_context = sql_context + gpt_user
        subscription = client.chat.completions.create(
            model="gpt-3.5-turbo-0125",
            messages=gpt_context,
            temperature=0.5,
            top_p=1,
            frequency_penalty=1.5,
            presence_penalty=1.1,
            timeout=30.0,
            tools=tools,
            # functions=functions,
            # function_call="auto" 
        )

        # gpt_response = subscription.choices[0].message.content.replace("\n", " ")

        message = subscription.response['choices'][0]['message']
        logger.warning("MESSAGE: ", message)
        if message.get("function_call"):
            # Step 3: Extract function name and arguments
            function_name = message['function_call']['name']
            arguments = json.loads(message['function_call']['arguments'])
            if function_name == "get_weather":
                city = arguments.get("city")
                weather_info = get_weather(city)
                
                # Respond with the weather information
                response_message = f"The weather in {city} is {weather_info['temperature']} with {weather_info['description']}."
                gpt_response = response_message
        else:
            # Step 4: If no function call, just return the normal GPT response
            gpt_response = message['content'].replace("\n", " ")
        
        print("GPT RESPONSE: ", gpt_response)
        gpt_response_list = ast.literal_eval(gpt_response)
        print("GPT RESPONSE LIST: ", gpt_response_list)
        for pair in gpt_response_list:
            pair["date"] = datetime.strptime(pair["date"], "%Y/%m/%d")

        gpt_dict = {}
        gpt_dict["data"] = gpt_response_list
        if user_input.startswith("quiero en forma de tabla"):
            gpt_dict["type"] = "TABLE"
        else:
            gpt_dict["type"] = "PLOT"
        return gpt_dict

    else:
        return response
