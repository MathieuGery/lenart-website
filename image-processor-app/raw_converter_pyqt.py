#!/usr/bin/env python3
"""
Convertisseur d'Images RAW vers JPEG - Version PyQt6 Portable avec traitement parallèle
Interface graphique moderne compilable en app macOS portable
"""

import sys
import os
import threading
from pathlib import Path
from typing import List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
import rawpy
from PIL import Image
import numpy as np

try:
    from PyQt6.QtWidgets import (
        QApplication, QMainWindow, QVBoxLayout, QHBoxLayout, QWidget,
        QPushButton, QLabel, QListWidget, QProgressBar, QSlider,
        QFileDialog, QMessageBox, QGroupBox, QLineEdit, QTextEdit,
        QSplitter, QFrame, QGridLayout, QSpacerItem, QSizePolicy, QCheckBox
    )
    from PyQt6.QtCore import Qt, QThread, pyqtSignal, QTimer, QSize
    from PyQt6.QtGui import QFont, QIcon, QPalette, QColor, QPixmap
except ImportError:
    print("❌ Erreur: PyQt6 n'est pas installé")
    print("💡 Installation: pip install PyQt6")
    sys.exit(1)


class ConversionWorker(QThread):
    """Worker thread pour la conversion des images avec traitement parallèle"""

    # Signaux pour communiquer avec l'interface
    progress_updated = pyqtSignal(int)
    status_updated = pyqtSignal(str)
    file_converted = pyqtSignal(str, bool, str)  # filename, success, message
    conversion_finished = pyqtSignal(int, int, int)  # converted, failed, total

    def __init__(self, files: List[str], output_dir: str, quality: int, 
                 watermark_enabled: bool = True, watermark_path: Optional[str] = None,
                 filename_display_enabled: bool = True):
        super().__init__()
        self.files = files
        self.output_dir = output_dir
        self.quality = quality
        self.watermark_enabled = watermark_enabled
        self.watermark_path = watermark_path
        self.filename_display_enabled = filename_display_enabled
        self._stop_requested = False

    def stop(self):
        """Arrête la conversion"""
        self._stop_requested = True

    def convert_single_file(self, file_path: str) -> tuple:
        """Convertit un seul fichier et retourne le résultat"""
        filename = os.path.basename(file_path)
        try:
            # Lecture du fichier RAW avec traitement optimisé pour le web
            with rawpy.imread(file_path) as raw:
                rgb = raw.postprocess(
                    use_camera_wb=True,
                    half_size=False,
                    no_auto_bright=True,  # Contrôle manuel pour plus de contraste
                    output_bps=8,
                    bright=1.15,          # Légèrement plus lumineux pour le web
                    highlight_mode=rawpy.HighlightMode.Clip,
                    use_auto_wb=False,
                    gamma=(2.2, 4.5),     # Gamma standard web
                    output_color=rawpy.ColorSpace.sRGB,  # Espace couleur web
                    demosaic_algorithm=rawpy.DemosaicAlgorithm.AHD  # Meilleure qualité
                )
            
            # Conversion en image PIL
            image = Image.fromarray(rgb)
            
            # Optimisations pour le web
            # Redimensionnement intelligent (max 768px côté long pour le web)
            max_size = 768
            if max(image.size) > max_size:
                # Calcul des nouvelles dimensions en gardant le ratio
                ratio = max_size / max(image.size)
                new_size = tuple(int(dim * ratio) for dim in image.size)
                image = image.resize(new_size, Image.Resampling.LANCZOS)

            # Améliorations visuelles pour le web
            from PIL import ImageEnhance, ImageFilter

            # Amélioration du contraste (+10%)
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(1.1)

            # Amélioration de la saturation (+8%)
            enhancer = ImageEnhance.Color(image)
            image = enhancer.enhance(1.08)

            # Netteté optimisée pour l'affichage web
            image = image.filter(ImageFilter.UnsharpMask(radius=0.8, percent=150, threshold=3))

            # Gestion de l'orientation EXIF
            try:
                from PIL.ExifTags import ORIENTATION
                if hasattr(image, '_getexif') and image._getexif():
                    exif = image._getexif()
                    if ORIENTATION in exif:
                        orientation = exif[ORIENTATION]
                        if orientation == 3:
                            image = image.rotate(180, expand=True)
                        elif orientation == 6:
                            image = image.rotate(270, expand=True)
                        elif orientation == 8:
                            image = image.rotate(90, expand=True)
            except:
                pass  # Ignore les erreurs EXIF

            # Ajout du watermark image si activé
            if self.watermark_enabled and self.watermark_path and os.path.exists(self.watermark_path):
                try:
                    # Charger l'image watermark
                    watermark = Image.open(self.watermark_path)

                    # Convertir en RGBA si nécessaire pour gérer la transparence
                    if watermark.mode != 'RGBA':
                        watermark = watermark.convert('RGBA')

                    # Redimensionner le watermark (max 15% de la largeur de l'image)
                    max_width = int(image.width * 0.15)
                    if watermark.width > max_width:
                        ratio = max_width / watermark.width
                        new_size = (max_width, int(watermark.height * ratio))
                        watermark = watermark.resize(new_size, Image.Resampling.LANCZOS)

                    # Position en bas à droite avec marge
                    margin = 20
                    x = image.width - watermark.width - margin
                    y = image.height - watermark.height - margin

                    # Convertir l'image principale en RGBA pour la transparence
                    if image.mode != 'RGBA':
                        image = image.convert('RGBA')

                    # Appliquer le watermark avec transparence
                    image.paste(watermark, (x, y), watermark)

                    # Reconvertir en RGB si nécessaire
                    if image.mode == 'RGBA':
                        background = Image.new('RGB', image.size, (255, 255, 255))
                        background.paste(image, mask=image.split()[3])
                        image = background

                except Exception as e:
                    print(f"Erreur chargement watermark: {e}")

            # Ajout du nom de fichier si activé
            if self.filename_display_enabled:
                from PIL import ImageDraw, ImageFont

                # Créer un objet de dessin
                draw = ImageDraw.Draw(image)

                # Nom du fichier sans extension
                filename_text = Path(file_path).stem

                # Tentative de charger une police système, sinon police par défaut
                try:
                    # Taille de police proportionnelle à la taille de l'image (entre 20 et 60px)
                    font_size = max(20, min(60, int(min(image.size) * 0.03)))
                    font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", font_size)
                except:
                    try:
                        # Police par défaut avec taille
                        font_size = max(20, min(60, int(min(image.size) * 0.03)))
                        font = ImageFont.load_default()
                    except:
                        font = None
                
                # Calculer la position (bas droite avec marge)
                if font:
                    # Obtenir les dimensions du texte
                    bbox = draw.textbbox((0, 0), filename_text, font=font)
                    text_width = bbox[2] - bbox[0]
                    text_height = bbox[3] - bbox[1]
                else:
                    # Estimation approximative sans police
                    text_width = len(filename_text) * 10
                    text_height = 15
                
                # Position en bas à droite avec marge de 20px
                margin = 20
                x = image.width - text_width - margin
                y = image.height - text_height - margin
                
                # Couleur rouge vif
                text_color = (255, 50, 50)  # RGB rouge vif
                
                # Ajouter le texte
                if font:
                    draw.text((x, y), filename_text, fill=text_color, font=font)
                else:
                    draw.text((x, y), filename_text, fill=text_color)
            
            # Génération du nom de sortie
            base_name = Path(file_path).stem
            output_path = os.path.join(self.output_dir, f"{base_name}.jpg")
            
            # Sauvegarde JPEG optimisée pour le web
            original_size = os.path.getsize(file_path) / (1024 * 1024)  # MB
            
            save_options = {
                'format': 'JPEG',
                'quality': self.quality,
                'optimize': True,
                'progressive': True,
                'subsampling': 0 if self.quality > 85 else 2,
                'dpi': (150, 150),  # Résolution 150 PPI pour HD maximum
            }
            
            image.save(output_path, **save_options)
            
            # Calcul de la compression
            final_size = os.path.getsize(output_path) / (1024 * 1024)  # MB
            compression_ratio = (1 - final_size/original_size) * 100 if original_size > 0 else 0
            
            success_msg = f"✅ {base_name}.jpg ({original_size:.1f}MB → {final_size:.1f}MB, -{compression_ratio:.0f}%)"
            return (filename, True, success_msg)
            
        except Exception as e:
            error_msg = f"❌ Erreur: {str(e)}"
            return (filename, False, error_msg)
        
    def run(self):
        """Exécute la conversion avec traitement parallèle (5 images simultanées)"""
        converted = 0
        failed = 0
        total = len(self.files)
        completed = 0
        
        self.status_updated.emit(f"Démarrage du traitement parallèle de {total} fichiers...")
        
        # Utiliser ThreadPoolExecutor pour traiter 5 images en parallèle
        with ThreadPoolExecutor(max_workers=5) as executor:
            # Soumettre tous les fichiers au pool de threads
            future_to_file = {
                executor.submit(self.convert_single_file, file_path): file_path 
                for file_path in self.files
            }
            
            # Traiter les résultats au fur et à mesure qu'ils arrivent
            for future in as_completed(future_to_file):
                if self._stop_requested:
                    # Arrêter tous les threads en cours
                    executor.shutdown(wait=False, cancel_futures=True)
                    break
                
                file_path = future_to_file[future]
                filename, success, message = future.result()
                
                # Mettre à jour les compteurs
                if success:
                    converted += 1
                else:
                    failed += 1
                
                completed += 1
                
                # Émettre les signaux de mise à jour
                self.status_updated.emit(f"Terminé: {filename} ({completed}/{total})")
                self.file_converted.emit(filename, success, message)
                
                # Mise à jour de la progression
                progress = int((completed / total) * 100)
                self.progress_updated.emit(progress)
        
        self.conversion_finished.emit(converted, failed, total)


class ImageProcessorApp(QMainWindow):
    """Application principale de conversion d'images RAW"""
    
    def __init__(self):
        super().__init__()
        self.selected_files = []
        self.output_directory = ""
        self.quality = 70  # Qualité par défaut optimisée pour le web
        self.watermark_enabled = True  # Watermark activé par défaut
        self.watermark_path = ""  # Chemin vers l'image watermark
        self.filename_display_enabled = True  # Affichage nom fichier activé par défaut
        self.conversion_worker = None
        
        self.setup_ui()
        self.setup_style()
        
    def setup_ui(self):
        """Configuration de l'interface utilisateur"""
        self.setWindowTitle("Len-art Raw to JPEG")
        self.setMinimumSize(900, 700)
        self.resize(1000, 800)
        
        # Widget central
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        layout = QVBoxLayout(central_widget)
        layout.setSpacing(15)
        layout.setContentsMargins(20, 20, 20, 20)
        
        # Titre
        title_label = QLabel("🐴 Len-art convertisseur d'images RAW vers JPEG")
        title_font = QFont()
        title_font.setPointSize(18)
        title_font.setBold(True)
        title_label.setFont(title_font)
        title_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(title_label)
        
        # Splitter principal
        splitter = QSplitter(Qt.Orientation.Horizontal)
        layout.addWidget(splitter)
        
        # Panneau gauche - Sélection de fichiers
        left_panel = self.create_file_selection_panel()
        splitter.addWidget(left_panel)
        
        # Panneau droit - Configuration et conversion
        right_panel = self.create_conversion_panel()
        splitter.addWidget(right_panel)
        
        # Définir les tailles des panneaux
        splitter.setSizes([400, 500])
        
        # Barre de statut
        self.status_bar = self.statusBar()
        self.status_bar.showMessage("Prêt à convertir")
        
    def create_file_selection_panel(self) -> QWidget:
        """Crée le panneau de sélection de fichiers"""
        panel = QWidget()
        layout = QVBoxLayout(panel)
        
        # Groupe de sélection
        files_group = QGroupBox("📁 Fichiers à convertir")
        files_layout = QVBoxLayout(files_group)
        
        # Boutons de sélection
        buttons_layout = QHBoxLayout()
        
        self.select_files_btn = QPushButton("📄 Sélectionner des fichiers")
        self.select_files_btn.clicked.connect(self.select_files)
        buttons_layout.addWidget(self.select_files_btn)
        
        self.select_folder_btn = QPushButton("📂 Sélectionner un dossier")
        self.select_folder_btn.clicked.connect(self.select_folder)
        buttons_layout.addWidget(self.select_folder_btn)
        
        self.clear_btn = QPushButton("🗑️ Effacer")
        self.clear_btn.clicked.connect(self.clear_selection)
        buttons_layout.addWidget(self.clear_btn)
        
        files_layout.addLayout(buttons_layout)
        
        # Liste des fichiers
        self.files_list = QListWidget()
        self.files_list.setMinimumHeight(200)
        files_layout.addWidget(self.files_list)
        
        # Compteur de fichiers
        self.files_count_label = QLabel("Aucun fichier sélectionné")
        self.files_count_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        files_layout.addWidget(self.files_count_label)
        
        layout.addWidget(files_group)
        layout.addStretch()
        
        return panel
        
    def create_conversion_panel(self) -> QWidget:
        """Crée le panneau de conversion"""
        panel = QWidget()
        layout = QVBoxLayout(panel)
        
        # Configuration
        config_group = QGroupBox("⚙️ Configuration")
        config_layout = QGridLayout(config_group)
        
        # Dossier de sortie
        config_layout.addWidget(QLabel("Dossier de sortie:"), 0, 0)
        
        output_layout = QHBoxLayout()
        self.output_entry = QLineEdit()
        self.output_entry.setPlaceholderText("Sélectionnez un dossier de sortie...")
        self.output_entry.setReadOnly(True)
        output_layout.addWidget(self.output_entry)
        
        self.browse_btn = QPushButton("📁 Parcourir")
        self.browse_btn.clicked.connect(self.select_output_directory)
        output_layout.addWidget(self.browse_btn)
        
        config_layout.addLayout(output_layout, 0, 1)
        
        # Qualité JPEG
        config_layout.addWidget(QLabel("Qualité JPEG:"), 1, 0)
        
        quality_layout = QHBoxLayout()
        self.quality_slider = QSlider(Qt.Orientation.Horizontal)
        self.quality_slider.setMinimum(10)
        self.quality_slider.setMaximum(100)
        self.quality_slider.setValue(self.quality)
        self.quality_slider.valueChanged.connect(self.update_quality)
        quality_layout.addWidget(self.quality_slider)

        self.quality_label = QLabel(str(self.quality_slider.value()))
        self.quality_label.setMinimumWidth(30)
        quality_layout.addWidget(self.quality_label)
        
        config_layout.addLayout(quality_layout, 1, 1)
        
        # Watermark
        config_layout.addWidget(QLabel("Watermark:"), 2, 0)
        
        watermark_layout = QVBoxLayout()
        
        # Checkbox pour activer/désactiver le watermark
        self.watermark_checkbox = QCheckBox("Ajouter un watermark")
        self.watermark_checkbox.setChecked(True)  # Activé par défaut
        self.watermark_checkbox.stateChanged.connect(self.toggle_watermark)
        watermark_layout.addWidget(self.watermark_checkbox)
        
        # Sélection de l'image watermark
        watermark_file_layout = QHBoxLayout()
        self.watermark_entry = QLineEdit()
        self.watermark_entry.setPlaceholderText("Optionnel: sélectionnez une image watermark")
        self.watermark_entry.setReadOnly(True)
        watermark_file_layout.addWidget(self.watermark_entry)
        
        self.watermark_browse_btn = QPushButton("🖼️ Image")
        self.watermark_browse_btn.clicked.connect(self.select_watermark_image)
        watermark_file_layout.addWidget(self.watermark_browse_btn)
        
        self.watermark_clear_btn = QPushButton("❌")
        self.watermark_clear_btn.clicked.connect(self.clear_watermark_image)
        self.watermark_clear_btn.setMaximumWidth(40)
        watermark_file_layout.addWidget(self.watermark_clear_btn)
        
        watermark_layout.addLayout(watermark_file_layout)
        
        config_layout.addLayout(watermark_layout, 2, 1)
        
        # Affichage nom de fichier
        config_layout.addWidget(QLabel("Nom de fichier:"), 3, 0)
        
        self.filename_checkbox = QCheckBox("Ajouter le nom du fichier sur l'image")
        self.filename_checkbox.setChecked(True)  # Activé par défaut
        self.filename_checkbox.stateChanged.connect(self.toggle_filename_display)
        config_layout.addWidget(self.filename_checkbox, 3, 1)
        
        # Info sur l'optimisation web et parallélisation
        web_info = QLabel("🌐 Optimisation web: 768px max")
        web_info.setStyleSheet("color: #888888; font-size: 11px; margin-top: 10px; padding: 5px; background-color: #f0f0f0; border-radius: 3px;")
        web_info.setWordWrap(True)
        config_layout.addWidget(web_info, 4, 0, 1, 2)
        
        layout.addWidget(config_group)
        
        # Conversion
        conversion_group = QGroupBox("🔄 Conversion Parallèle")
        conversion_layout = QVBoxLayout(conversion_group)
        
        # Barre de progression
        self.progress_bar = QProgressBar()
        self.progress_bar.setMinimum(0)
        self.progress_bar.setMaximum(100)
        conversion_layout.addWidget(self.progress_bar)
        
        # Status de conversion
        self.conversion_status = QLabel("Prêt à convertir")
        conversion_layout.addWidget(self.conversion_status)
        
        # Boutons de conversion
        buttons_layout = QHBoxLayout()
        
        self.convert_btn = QPushButton("🐴 Commencer la conversion")
        self.convert_btn.clicked.connect(self.start_conversion)
        self.convert_btn.setMinimumHeight(40)
        buttons_layout.addWidget(self.convert_btn)
        
        self.stop_btn = QPushButton("⏹️ Arrêter")
        self.stop_btn.clicked.connect(self.stop_conversion)
        self.stop_btn.setEnabled(False)
        buttons_layout.addWidget(self.stop_btn)
        
        conversion_layout.addLayout(buttons_layout)
        
        layout.addWidget(conversion_group)
        
        # Log de conversion
        log_group = QGroupBox("📝 Journal de conversion")
        log_layout = QVBoxLayout(log_group)
        
        self.log_text = QTextEdit()
        self.log_text.setMaximumHeight(200)
        self.log_text.setReadOnly(True)
        log_layout.addWidget(self.log_text)
        
        layout.addWidget(log_group)
        
        return panel
        
    def setup_style(self):
        """Configure le style de l'application - Thème sombre"""
        self.setStyleSheet("""
            QMainWindow {
                background-color: #1e1e1e;
                color: #ffffff;
            }
            QWidget {
                background-color: #1e1e1e;
                color: #ffffff;
            }
            QGroupBox {
                font-weight: bold;
                border: 2px solid #444444;
                border-radius: 8px;
                margin-top: 1ex;
                padding-top: 10px;
                background-color: #2d2d2d;
                color: #ffffff;
            }
            QGroupBox::title {
                subcontrol-origin: margin;
                left: 10px;
                padding: 0 10px 0 10px;
                color: #ffffff;
            }
            QPushButton {
                background-color: #007AFF;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                font-weight: bold;
                min-height: 20px;
            }
            QPushButton:hover {
                background-color: #0056CC;
            }
            QPushButton:pressed {
                background-color: #004499;
            }
            QPushButton:disabled {
                background-color: #555555;
                color: #888888;
            }
            QListWidget {
                border: 1px solid #555555;
                border-radius: 4px;
                background-color: #2d2d2d;
                color: #ffffff;
                selection-background-color: #007AFF;
            }
            QListWidget::item {
                padding: 4px;
                border-bottom: 1px solid #444444;
            }
            QListWidget::item:selected {
                background-color: #007AFF;
            }
            QLineEdit {
                border: 1px solid #555555;
                border-radius: 4px;
                padding: 6px;
                background-color: #2d2d2d;
                color: #ffffff;
                selection-background-color: #007AFF;
            }
            QLineEdit:focus {
                border: 1px solid #007AFF;
            }
            QTextEdit {
                border: 1px solid #555555;
                border-radius: 4px;
                background-color: #2d2d2d;
                color: #ffffff;
                font-family: 'Monaco', 'Consolas', monospace;
                selection-background-color: #007AFF;
            }
            QProgressBar {
                border: 1px solid #555555;
                border-radius: 4px;
                text-align: center;
                background-color: #2d2d2d;
                color: #ffffff;
            }
            QProgressBar::chunk {
                background-color: #007AFF;
                border-radius: 3px;
            }
            QLabel {
                color: #ffffff;
                background-color: transparent;
            }
            QSlider::groove:horizontal {
                border: 1px solid #555555;
                height: 8px;
                background-color: #2d2d2d;
                margin: 2px 0;
                border-radius: 4px;
            }
            QSlider::handle:horizontal {
                background-color: #007AFF;
                border: 1px solid #555555;
                width: 18px;
                margin: -2px 0;
                border-radius: 9px;
            }
            QSlider::handle:horizontal:hover {
                background-color: #0056CC;
            }
            QStatusBar {
                background-color: #2d2d2d;
                color: #ffffff;
                border-top: 1px solid #444444;
            }
        """)
        
    def select_files(self):
        """Sélectionne des fichiers RAW individuels"""
        files, _ = QFileDialog.getOpenFileNames(
            self,
            "Sélectionner des fichiers RAW",
            "",
            "Fichiers RAW (*.cr2 *.cr3 *.nef *.arw *.dng *.raf *.orf *.rw2 *.pef *.srw);;Tous les fichiers (*)"
        )
        
        if files:
            self.selected_files.extend(files)
            self.update_files_list()
            
    def select_folder(self):
        """Sélectionne un dossier contenant des fichiers RAW"""
        folder = QFileDialog.getExistingDirectory(self, "Sélectionner un dossier")
        
        if folder:
            raw_extensions = {'.cr2', '.cr3', '.nef', '.arw', '.dng', '.raf', 
                             '.orf', '.rw2', '.pef', '.srw'}
            
            for root, dirs, files in os.walk(folder):
                for file in files:
                    if Path(file).suffix.lower() in raw_extensions:
                        self.selected_files.append(os.path.join(root, file))
                        
            self.update_files_list()
            
    def clear_selection(self):
        """Efface la sélection de fichiers"""
        self.selected_files.clear()
        self.update_files_list()
        
    def update_files_list(self):
        """Met à jour la liste des fichiers"""
        self.files_list.clear()
        
        for file_path in self.selected_files:
            filename = os.path.basename(file_path)
            self.files_list.addItem(filename)
            
        count = len(self.selected_files)
        if count == 0:
            self.files_count_label.setText("Aucun fichier sélectionné")
        elif count == 1:
            self.files_count_label.setText("1 fichier sélectionné")
        else:
            self.files_count_label.setText(f"{count} fichiers sélectionnés")
            
    def select_output_directory(self):
        """Sélectionne le dossier de sortie"""
        directory = QFileDialog.getExistingDirectory(self, "Sélectionner le dossier de sortie")
        if directory:
            self.output_directory = directory
            self.output_entry.setText(directory)
            
    def update_quality(self, value):
        """Met à jour la qualité JPEG"""
        self.quality = value
        self.quality_label.setText(str(value))
    
    def toggle_watermark(self, state):
        """Active/désactive le watermark"""
        self.watermark_enabled = state == 2  # Qt.CheckState.Checked
        self.watermark_entry.setEnabled(self.watermark_enabled)
        self.watermark_browse_btn.setEnabled(self.watermark_enabled)
        self.watermark_clear_btn.setEnabled(self.watermark_enabled)
    
    def select_watermark_image(self):
        """Sélectionne l'image watermark"""
        file_path, _ = QFileDialog.getOpenFileName(
            self, 
            "Sélectionner l'image watermark",
            "",
            "Images (*.png *.jpg *.jpeg *.bmp *.tiff *.gif);;Tous les fichiers (*.*)"
        )
        if file_path:
            self.watermark_path = file_path
            self.watermark_entry.setText(os.path.basename(file_path))
    
    def clear_watermark_image(self):
        """Efface la sélection d'image watermark"""
        self.watermark_path = ""
        self.watermark_entry.clear()
    
    def toggle_filename_display(self, state):
        """Active/désactive l'affichage du nom de fichier"""
        self.filename_display_enabled = state == 2  # Qt.CheckState.Checked
        
    def validate_inputs(self) -> bool:
        """Valide les entrées avant conversion"""
        if not self.selected_files:
            QMessageBox.warning(self, "Erreur", "Veuillez sélectionner des fichiers à convertir.")
            return False
            
        if not self.output_directory:
            QMessageBox.warning(self, "Erreur", "Veuillez sélectionner un dossier de sortie.")
            return False
            
        if not os.path.exists(self.output_directory):
            QMessageBox.warning(self, "Erreur", "Le dossier de sortie n'existe pas.")
            return False
            
        return True
        
    def start_conversion(self):
        """Démarre la conversion"""
        if not self.validate_inputs():
            return
            
        # Interface en mode conversion
        self.convert_btn.setEnabled(False)
        self.stop_btn.setEnabled(True)
        self.progress_bar.setValue(0)
        self.log_text.clear()
        
        # Message d'information sur le traitement parallèle
        self.log_text.append("🐴 Démarrage du traitement parallèle")
        self.log_text.append("="*50)
        
        # Créer et démarrer le worker
        self.conversion_worker = ConversionWorker(
            self.selected_files.copy(),
            self.output_directory,
            self.quality,
            self.watermark_enabled,
            self.watermark_path if self.watermark_path else None,
            self.filename_display_enabled
        )
        
        # Connecter les signaux
        self.conversion_worker.progress_updated.connect(self.progress_bar.setValue)
        self.conversion_worker.status_updated.connect(self.conversion_status.setText)
        self.conversion_worker.file_converted.connect(self.on_file_converted)
        self.conversion_worker.conversion_finished.connect(self.on_conversion_finished)
        
        # Démarrer la conversion
        self.conversion_worker.start()
        
    def stop_conversion(self):
        """Arrête la conversion"""
        if self.conversion_worker:
            self.conversion_worker.stop()
            
    def on_file_converted(self, filename: str, success: bool, message: str):
        """Appelée quand un fichier est converti"""
        self.log_text.append(message)
        
    def on_conversion_finished(self, converted: int, failed: int, total: int):
        """Appelée à la fin de la conversion"""
        # Remettre l'interface en état normal
        self.convert_btn.setEnabled(True)
        self.stop_btn.setEnabled(False)
        self.conversion_status.setText("Conversion terminée")
        
        # Message de résumé
        message = f"Conversion terminée!\n\n"
        message += f"Fichiers convertis: {converted}\n"
        message += f"Échecs: {failed}\n"
        message += f"Total: {total}\n\n"
        
        if failed > 0:
            message += f"\n\nCertains fichiers n'ont pas pu être convertis."
            
        QMessageBox.information(self, "Conversion terminée", message)
        
        # Log final
        self.log_text.append("\n" + "="*50)
        self.log_text.append(f"🎉 TERMINÉ - {converted}/{total} fichiers convertis")
        if failed > 0:
            self.log_text.append(f"⚠️ {failed} échec(s)")


def main():
    """Fonction principale"""
    app = QApplication(sys.argv)
    app.setApplicationName("Convertisseur RAW Parallèle")
    app.setApplicationVersion("2.1")
    app.setOrganizationName("ImageProcessor")
    
    # Style moderne
    app.setStyle('Fusion')
    
    # Créer et afficher la fenêtre principale
    window = ImageProcessorApp()
    window.show()
    
    # Exécuter l'application
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
