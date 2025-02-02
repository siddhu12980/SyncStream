# This makes the backend directory a Python package
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))  # Add the project root to the path