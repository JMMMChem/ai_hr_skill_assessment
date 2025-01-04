import logging
from urllib.parse import quote, unquote
from fastapi import Request

class FunctionCallingRealEstate():

    def __init__(self) -> None:
        pass

    @staticmethod
    async def obtener_coeficiente_plusvalia(años_tenencia):
        """
        Devuelve el coeficiente de plusvalía según los años de tenencia de la propiedad.
        """
        # Diccionario con los coeficientes correspondientes a cada número de años
        coeficientes = {
            0: 0.15,  # Menos de 1 año
            1: 0.15,
            2: 0.14,
            3: 0.14,
            4: 0.16,
            5: 0.18,
            6: 0.19,
            7: 0.20,
            8: 0.19,
            9: 0.15,
            10: 0.12,
            11: 0.10,
            12: 0.09,
            13: 0.09,
            14: 0.09,
            15: 0.09,
            16: 0.10,
            17: 0.13,
            18: 0.17,
            19: 0.23
        }
        
        # Devolver coeficiente para 20 años o más, o buscar en el diccionario según los años de tenencia
        return coeficientes.get(años_tenencia, 0.40)
    