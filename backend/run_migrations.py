"""Run Alembic migrations programmatically."""
import sys
import os

# Set working directory to backend root so alembic.ini is found
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from alembic.config import Config
from alembic import command

alembic_cfg = Config("alembic.ini")

print("=== Current migration state ===")
command.current(alembic_cfg, verbose=True)

print("\n=== Running upgrade to head ===")
command.upgrade(alembic_cfg, "head")

print("\n=== Migration complete ===")
command.current(alembic_cfg, verbose=True)
