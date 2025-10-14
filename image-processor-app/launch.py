#!/usr/bin/env python3
"""
Lancement simple de l'application RAW Converter
"""

import sys
import subprocess
from pathlib import Path

def main():
    """Lance l'application PyQt6"""
    script_dir = Path(__file__).parent
    app_script = script_dir / "raw_converter_pyqt.py"

    if not app_script.exists():
        print("❌ Erreur: raw_converter_pyqt.py non trouvé")
        return 1

    try:
        # Lancer l'application
        subprocess.run([sys.executable, str(app_script)], check=True)
        return 0
    except subprocess.CalledProcessError:
        return 1
    except KeyboardInterrupt:
        return 0

if __name__ == "__main__":
    sys.exit(main())
