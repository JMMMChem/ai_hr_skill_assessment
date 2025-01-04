import os
import warnings

try:
    # local settings always have preference
    from .local import *  # noqa
except (ImportError, ModuleNotFoundError):
    environ = os.environ.get("ENV", "DEV")

    if environ == "PRO":
        from .prod import *  # noqa
    elif environ == "PRE":
        from .pre import *  # noqa
    elif environ == "DEV":
        from .dev import *  # noqa
    else:
        warnings.warn(f"Unexpected env {environ} found. Loading base settings ...")
        from .base import *  # noqa