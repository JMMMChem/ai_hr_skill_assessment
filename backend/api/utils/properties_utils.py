import logging
from urllib.parse import quote, unquote
from fastapi import Request

class Properties():

    def __init__(self) -> None:
        pass

    @staticmethod
    async def get_properties(request: Request) -> dict:
        """
        Extracts properties from request

        Args:
            request: Request

        Returns:
            properties: Dict with the properties
        """
        content_type = request.headers.get("Content-Type", "")
        logging.info(f"Content-Type: {content_type}")
        print(f"CONTENT-TYPE: {content_type}")
        if "multipart/form-data" in content_type:
            logging.info("get_properties - multipart/form-data")
            form = await request.form()
            properties = dict(form)
            print(f"PROPERTIES: {properties}")
        elif "application/json" in content_type:
            logging.info("get_properties - application/json")
            properties = request.json
            print(f"PROPERTIES: {properties}")
            logging.info(f"Properties: {properties}")
            logging.info(f"Properties type: {type(properties)}")
        if "Url" in properties and unquote(properties["Url"]) == properties["Url"]:
            properties["Url"] = quote(properties["Url"], safe=":/\\")
        if isinstance(properties, dict):
            properties = Properties.filter_properties(properties)
        logging.info(f"Properties: {properties}")
        print(f"PROPERTIES: {properties}")

        return properties

    @staticmethod
    def filter_properties(properties: dict) -> dict:
        """
        Remove elements with None or empty string values and unify cati_name and cati_value

        Args:
            properties: Dictionary of properties to be filtered.

        Returns:
            updated_properties: Filtered dictionary of properties.
        """
        updated_properties = {}

        for key, value in properties.items():
            if value in (None, "", "X-Api-Key"):
                continue
            if key.startswith("cat") and key.endswith("name"):
                corresponding_value_key = key.replace("name", "value")
                if corresponding_value_key in properties:
                    updated_properties[value] = properties[corresponding_value_key]
            else:
                updated_properties[key] = value

        return updated_properties
