#!/bin/bash

# exit when any command fails

alembic upgrade head

exec "$@"