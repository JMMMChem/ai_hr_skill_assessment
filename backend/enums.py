#
#
#   Enums
#
#

from enum import Enum


class ResponseType(str, Enum):
    PLOT = "PLOT"
    TABLE = "TABLE"


class RoleType(str, Enum):
    human = "human"
    bot = "bot"