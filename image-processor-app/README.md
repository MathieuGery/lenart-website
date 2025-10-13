# 🖼️ Convertisseur RAW vers JPEG - Version Portable pour macOS

Application moderne avec interface PyQt6 compilable en app macOS portable.

## ✨ Fonctionnalités

- 🖥️ **Interface graphique moderne** avec PyQt6
- 📁 **Sélection intuitive** de fichiers ou dossiers
- 🔄 **Conversion par lots** avec progression en temps réel
- ⚙️ **Qualité ajustable** (1-100) pour optimiser taille/qualité
- 📱 **Application portable** compilée en .app pour macOS
- 🚀 **Performances optimisées** avec traitement multi-threadé

## 🎯 Formats supportés

| Marque | Formats |
|--------|---------|
| **Canon** | CR2, CR3 |
| **Nikon** | NEF |
| **Sony** | ARW |
| **Adobe** | DNG |
| **Fujifilm** | RAF |
| **Olympus** | ORF |
| **Panasonic** | RW2 |
| **Pentax** | PEF |
| **Samsung** | SRW |

## 🔧 Installation et compilation

### 1. Test des dépendances
```bash
python test_dependencies.py
```

### 2. Compilation automatique
```bash
python build_macos.py
```

### 3. Lancement de l'app compilée
```bash
open "dist/RAW Converter.app"
```

## 🚀 Modes d'utilisation

### Mode développement
```bash
# Interface graphique PyQt6
python raw_converter_pyqt.py

# Ou via le launcher
python launch_pyqt.py
```

### Mode portable (après compilation)
- Double-cliquez sur `RAW Converter.app`
- Ou glissez l'app vers le dossier Applications

## 📦 Processus de compilation

L'application utilise **PyInstaller** pour créer un bundle macOS :

1. **Installation** des dépendances Python
2. **Compilation** du code Python en exécutable
3. **Bundling** en application macOS (.app)
4. **Optimisation** avec UPX (compression)
5. **Création DMG** (optionnelle) pour distribution

### Fichiers de sortie :
```
dist/
└── RAW Converter.app/     # Application prête à utiliser
    ├── Contents/
    │   ├── MacOS/
    │   │   └── RAW_Converter  # Exécutable
    │   ├── Resources/
    │   └── Info.plist
```

## 💡 Configuration avancée

### Personnalisation du build
Éditez `raw_converter.spec` pour :
- Changer l'icône de l'app
- Modifier les métadonnées
- Ajouter des ressources
- Configurer la signature de code

### Optimisation de taille
- **UPX activé** : Compression de l'exécutable
- **Exclusion de modules** non utilisés
- **One-file bundle** pour simplicité

## 🛠️ Résolution de problèmes

### PyQt6 non disponible
```bash
pip install PyQt6
```

### Erreur de compilation
```bash
# Nettoyage et recompilation
rm -rf build/ dist/
python build_macos.py
```

### Application ne se lance pas
- Vérifiez les permissions : `chmod +x "dist/RAW Converter.app/Contents/MacOS/RAW_Converter"`
- Testez depuis le terminal : `"dist/RAW Converter.app/Contents/MacOS/RAW_Converter"`

### Problèmes de dépendances manquantes
```bash
# Réinstallation complète
pip uninstall PyQt6 rawpy Pillow numpy PyInstaller
pip install -r requirements.txt
```

## 📊 Performance

- **Taille de l'app** : ~150-200 MB (inclut Python + toutes les dépendances)
- **RAM requise** : 200-500 MB selon la taille des images
- **Vitesse** : ~5-15 secondes par image RAW (selon la résolution)

## 🎨 Captures d'écran

L'interface moderne inclut :
- 📁 Panneau de sélection de fichiers
- ⚙️ Configuration de qualité JPEG
- 📊 Barre de progression en temps réel
- 📝 Journal détaillé de conversion
- 🎨 Design macOS natif avec thème sombre/clair

## 📄 Distribution

### Pour utilisateurs finaux
1. Compilez l'application : `python build_macos.py`
2. Créez un DMG : Répondez "oui" lors de la compilation
3. Distribuez le fichier `.dmg`

### Installation utilisateur
1. Montez le DMG
2. Glissez l'app vers Applications
3. Lancez depuis Launchpad

## 🔐 Sécurité

- ✅ Code non signé (pour usage personnel)
- ⚠️ Pour distribution publique : signature de code Apple requise
- 🛡️ Aucune donnée envoyée sur internet (traitement 100% local)

## 📋 Prérequis système

- **macOS** 10.14+ (Mojave ou supérieur)  
- **Architecture** : Intel x64 ou Apple Silicon (M1/M2)
- **RAM** : 4 GB minimum, 8 GB recommandé
- **Stockage** : 500 MB pour l'app + espace pour images converties

## 🆘 Support

En cas de problème :
1. Vérifiez `python test_dependencies.py`
2. Consultez les logs dans le terminal
3. Recompilez avec `python build_macos.py`