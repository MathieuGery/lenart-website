#!/usr/bin/env python3
"""
Script d'installation et de compilation pour macOS
Installe les dépendances et compile l'application portable
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(cmd, description):
    """Exécute une commande avec gestion d'erreur"""
    print(f"\n🔧 {description}...")
    print(f"💻 Commande: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(f"✅ {description} - Succès")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - Échec")
        print(f"Erreur: {e.stderr}")
        return False

def check_python_version():
    """Vérifie la version de Python"""
    version = sys.version_info
    print(f"🐍 Python {version.major}.{version.minor}.{version.micro}")
    
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8+ requis")
        return False
    return True

def install_dependencies():
    """Installe les dépendances"""
    packages = [
        "PyQt6>=6.5.0",
        "rawpy>=0.19.0", 
        "Pillow>=10.0.0",
        "numpy>=1.21.0",
        "PyInstaller>=6.0.0"
    ]
    
    for package in packages:
        if not run_command([sys.executable, "-m", "pip", "install", package], 
                          f"Installation de {package}"):
            return False
    
    return True

def test_imports():
    """Test des importations"""
    print("\n🧪 Test des importations...")
    
    modules = [
        ("PyQt6.QtWidgets", "PyQt6"),
        ("rawpy", "rawpy"),
        ("PIL", "Pillow"),
        ("numpy", "numpy")
    ]
    
    for module, name in modules:
        try:
            __import__(module)
            print(f"✅ {name} - OK")
        except ImportError as e:
            print(f"❌ {name} - Échec: {e}")
            return False
    
    return True

def build_executable():
    """Compile l'application en exécutable"""
    script_dir = Path(__file__).parent
    spec_file = script_dir / "raw_converter.spec"
    
    if not spec_file.exists():
        print(f"❌ Fichier spec introuvable: {spec_file}")
        return False
    
    cmd = [sys.executable, "-m", "PyInstaller", str(spec_file), "--clean"]
    return run_command(cmd, "Compilation de l'exécutable")

def create_dmg():
    """Crée un fichier DMG pour la distribution (optionnel)"""
    print("\n📦 Création du DMG de distribution...")
    
    app_path = Path("dist/RAW Converter.app")
    if not app_path.exists():
        print(f"❌ Application non trouvée: {app_path}")
        return False
    
    # Commande pour créer un DMG (nécessite hdiutil sur macOS)
    if sys.platform == 'darwin':
        dmg_name = "RAW_Converter_Portable.dmg"
        cmd = [
            "hdiutil", "create", "-volname", "RAW Converter",
            "-srcfolder", "dist/RAW Converter.app",
            "-ov", "-format", "UDZO", dmg_name
        ]
        
        if run_command(cmd, "Création du DMG"):
            print(f"📦 DMG créé: {dmg_name}")
            return True
    
    return False

def main():
    """Fonction principale"""
    print("🚀 COMPILATION RAW CONVERTER POUR macOS")
    print("=" * 50)
    
    # Vérifications préalables
    if not check_python_version():
        return 1
        
    # Installation des dépendances
    if not install_dependencies():
        print("\n❌ Échec de l'installation des dépendances")
        return 1
        
    # Test des importations
    if not test_imports():
        print("\n❌ Certains modules ne peuvent pas être importés")
        return 1
    
    # Compilation
    if not build_executable():
        print("\n❌ Échec de la compilation")
        return 1
    
    print("\n🎉 COMPILATION RÉUSSIE!")
    print("📱 Application créée: dist/RAW Converter.app")
    
    # Option: créer un DMG
    try:
        response = input("\n📦 Créer un DMG pour distribution? (o/N): ").lower()
        if response in ['o', 'oui', 'y', 'yes']:
            create_dmg()
    except KeyboardInterrupt:
        pass
    
    print(f"\n📂 Fichiers de sortie dans: {Path.cwd() / 'dist'}")
    print("\n✅ Prêt à utiliser! Double-cliquez sur l'app pour la lancer.")
    
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n👋 Compilation interrompue")
        sys.exit(1)
