"""Application PyQt principale refactorisée.
Contient la fenêtre et bootstrap main().
"""
from __future__ import annotations
import sys
import os
from pathlib import Path
from typing import List
from PyQt6.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, QSplitter,
                             QLabel, QGroupBox, QHBoxLayout, QPushButton, QListWidget,
                             QProgressBar, QLineEdit, QSlider, QTextEdit, QMessageBox, QCheckBox,
                             QFileDialog, QTabWidget)  # ← ajout QTabWidget
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont
from .workers import ConversionWorker
from .minio_widget import MinioConfigWidget
from .upload_worker import UploadWorker  # ← nouvel import

RAW_EXTENSIONS = {'.cr2', '.cr3', '.nef', '.arw', '.dng', '.raf', '.orf', '.rw2', '.pef', '.srw'}

class ImageProcessorApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.selected_files: List[str] = []
        self.output_directory = ""
        self.quality = 70
        self.watermark_enabled = True
        self.watermark_path = ""
        self.filename_display_enabled = True
        self.conversion_worker: ConversionWorker | None = None
        self.manual_upload_files: List[str] = []  # liste pour l’onglet upload
        self.upload_worker: UploadWorker | None = None
        self._build_ui()
        self._apply_style()

    def _build_ui(self):
        self.setWindowTitle("Len-art Raw to JPEG")
        self.setMinimumSize(900, 700)
        self.resize(1000, 800)
        central = QWidget(); self.setCentralWidget(central)
        root_layout = QVBoxLayout(central); root_layout.setSpacing(15); root_layout.setContentsMargins(20, 20, 20, 20)
        title = QLabel("🐴 Len-art convertisseur d'images RAW vers JPEG")
        font = QFont(); font.setPointSize(18); font.setBold(True); title.setFont(font); title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        root_layout.addWidget(title)
        splitter = QSplitter(Qt.Orientation.Horizontal); root_layout.addWidget(splitter)
        splitter.addWidget(self._create_file_panel())
        # Remplace l’ajout direct du panneau conversion par un QTabWidget
        self.tabs = QTabWidget()
        self.tabs.addTab(self._create_conversion_panel(), "🔄 Conversion")
        self.tabs.addTab(self._create_manual_upload_tab(), "☁️ Upload JPG")
        splitter.addWidget(self.tabs)
        splitter.setSizes([400, 600])
        self.status_bar = self.statusBar(); self.status_bar.showMessage("Prêt à convertir")

    def _create_file_panel(self) -> QWidget:
        panel = QWidget(); layout = QVBoxLayout(panel)
        group = QGroupBox("📁 Fichiers à convertir"); gl = QVBoxLayout(group)
        btns = QHBoxLayout()
        self.select_files_btn = QPushButton("📄 Sélectionner des fichiers"); self.select_files_btn.clicked.connect(self._select_files); btns.addWidget(self.select_files_btn)
        self.select_folder_btn = QPushButton("📂 Sélectionner un dossier"); self.select_folder_btn.clicked.connect(self._select_folder); btns.addWidget(self.select_folder_btn)
        self.clear_btn = QPushButton("🗑️ Effacer"); self.clear_btn.clicked.connect(self._clear_selection); btns.addWidget(self.clear_btn)
        gl.addLayout(btns)
        self.files_list = QListWidget(); self.files_list.setMinimumHeight(200); gl.addWidget(self.files_list)
        self.files_count_label = QLabel("Aucun fichier sélectionné"); self.files_count_label.setAlignment(Qt.AlignmentFlag.AlignCenter); gl.addWidget(self.files_count_label)
        layout.addWidget(group); layout.addStretch()
        return panel

    def _create_conversion_panel(self) -> QWidget:
        panel = QWidget(); layout = QVBoxLayout(panel)
        cfg_group = QGroupBox("⚙️ Configuration"); cfg_grid = QVBoxLayout(cfg_group)
        # Output dir
        out_row = QHBoxLayout(); out_row.addWidget(QLabel("Dossier de sortie:"))
        self.output_entry = QLineEdit(); self.output_entry.setPlaceholderText("Sélectionnez un dossier de sortie..."); self.output_entry.setReadOnly(True); out_row.addWidget(self.output_entry)
        self.browse_btn = QPushButton("📁 Parcourir"); self.browse_btn.clicked.connect(self._select_output_directory); out_row.addWidget(self.browse_btn)
        cfg_grid.addLayout(out_row)
        # Quality
        quality_row = QHBoxLayout(); quality_row.addWidget(QLabel("Qualité JPEG:"))
        self.quality_slider = QSlider(Qt.Orientation.Horizontal); self.quality_slider.setMinimum(10); self.quality_slider.setMaximum(100); self.quality_slider.setValue(self.quality); self.quality_slider.valueChanged.connect(self._update_quality); quality_row.addWidget(self.quality_slider)
        self.quality_label = QLabel(str(self.quality_slider.value())); self.quality_label.setMinimumWidth(30); quality_row.addWidget(self.quality_label)
        cfg_grid.addLayout(quality_row)
        # Watermark
        wm_group = QGroupBox("Watermark"); wm_layout = QVBoxLayout(wm_group)
        self.watermark_checkbox = QCheckBox("Ajouter un watermark"); self.watermark_checkbox.setChecked(True); self.watermark_checkbox.stateChanged.connect(self._toggle_watermark); wm_layout.addWidget(self.watermark_checkbox)
        wm_row = QHBoxLayout(); self.watermark_entry = QLineEdit(); self.watermark_entry.setPlaceholderText("Optionnel: sélectionnez une image watermark"); self.watermark_entry.setReadOnly(True); wm_row.addWidget(self.watermark_entry)
        self.watermark_browse_btn = QPushButton("🖼️ Image"); self.watermark_browse_btn.clicked.connect(self._select_watermark_image); wm_row.addWidget(self.watermark_browse_btn)
        self.watermark_clear_btn = QPushButton("❌"); self.watermark_clear_btn.clicked.connect(self._clear_watermark_image); self.watermark_clear_btn.setMaximumWidth(40); wm_row.addWidget(self.watermark_clear_btn)
        wm_layout.addLayout(wm_row); cfg_grid.addWidget(wm_group)
        # Filename overlay
        self.filename_checkbox = QCheckBox("Ajouter le nom du fichier sur l'image"); self.filename_checkbox.setChecked(True); self.filename_checkbox.stateChanged.connect(self._toggle_filename_display); cfg_grid.addWidget(self.filename_checkbox)
        web_info = QLabel("🌐 Optimisation web: 768px max"); web_info.setStyleSheet("color:#888; font-size:11px; margin-top:10px; padding:5px; background-color:#f0f0f0; border-radius:3px;"); web_info.setWordWrap(True); cfg_grid.addWidget(web_info)
        layout.addWidget(cfg_group)
        # Minio widget (optionnel)
        self.minio_widget = MinioConfigWidget(); layout.addWidget(self.minio_widget)
        # Conversion group
        conv_group = QGroupBox("🔄 Conversion Parallèle"); conv_layout = QVBoxLayout(conv_group)
        self.progress_bar = QProgressBar(); self.progress_bar.setMinimum(0); self.progress_bar.setMaximum(100); conv_layout.addWidget(self.progress_bar)
        self.conversion_status = QLabel("Prêt à convertir"); conv_layout.addWidget(self.conversion_status)
        btn_row = QHBoxLayout(); self.convert_btn = QPushButton("🐴 Commencer la conversion"); self.convert_btn.clicked.connect(self._start_conversion); self.convert_btn.setMinimumHeight(40); btn_row.addWidget(self.convert_btn)
        self.stop_btn = QPushButton("⏹️ Arrêter"); self.stop_btn.clicked.connect(self._stop_conversion); self.stop_btn.setEnabled(False); btn_row.addWidget(self.stop_btn)
        conv_layout.addLayout(btn_row); layout.addWidget(conv_group)
        # Log
        log_group = QGroupBox("📝 Journal de conversion"); log_layout = QVBoxLayout(log_group)
        self.log_text = QTextEdit(); self.log_text.setMaximumHeight(200); self.log_text.setReadOnly(True); log_layout.addWidget(self.log_text)
        layout.addWidget(log_group)
        return panel

    def _create_manual_upload_tab(self) -> QWidget:
        tab = QWidget()
        layout = QVBoxLayout(tab)
        info = QLabel("Uploader manuellement des fichiers JPEG vers Minio.\nUtilise la configuration Minio de l’onglet Conversion (tester d’abord).")
        info.setStyleSheet("color:#555; font-size:12px;")
        layout.addWidget(info)

        group = QGroupBox("📁 Fichiers JPEG à uploader")
        g_layout = QVBoxLayout(group)
        btns = QHBoxLayout()
        self.up_select_files_btn = QPushButton("📄 Sélectionner fichiers JPG"); self.up_select_files_btn.clicked.connect(self._select_upload_files); btns.addWidget(self.up_select_files_btn)
        self.up_select_folder_btn = QPushButton("📂 Sélectionner dossier"); self.up_select_folder_btn.clicked.connect(self._select_upload_folder); btns.addWidget(self.up_select_folder_btn)
        self.up_prefill_btn = QPushButton("📁 Depuis dossier de sortie"); self.up_prefill_btn.clicked.connect(self._prefill_upload_from_output); btns.addWidget(self.up_prefill_btn)
        self.up_clear_btn = QPushButton("🗑️ Effacer"); self.up_clear_btn.clicked.connect(self._clear_upload_selection); btns.addWidget(self.up_clear_btn)
        g_layout.addLayout(btns)
        self.upload_list = QListWidget(); self.upload_list.setMinimumHeight(180); g_layout.addWidget(self.upload_list)
        self.upload_count_label = QLabel("Aucun fichier"); self.upload_count_label.setAlignment(Qt.AlignmentFlag.AlignCenter); g_layout.addWidget(self.upload_count_label)
        layout.addWidget(group)

        conv = QGroupBox("☁️ Upload vers Minio")
        c_layout = QVBoxLayout(conv)
        self.upload_progress = QProgressBar(); self.upload_progress.setMinimum(0); self.upload_progress.setMaximum(100); c_layout.addWidget(self.upload_progress)
        self.upload_status = QLabel("Prêt"); c_layout.addWidget(self.upload_status)
        row = QHBoxLayout()
        self.start_upload_btn = QPushButton("☁️ Lancer upload"); self.start_upload_btn.clicked.connect(self._start_manual_upload); row.addWidget(self.start_upload_btn)
        self.stop_upload_btn = QPushButton("⏹️ Stop"); self.stop_upload_btn.clicked.connect(self._stop_manual_upload); self.stop_upload_btn.setEnabled(False); row.addWidget(self.stop_upload_btn)
        c_layout.addLayout(row)
        self.upload_log = QTextEdit(); self.upload_log.setReadOnly(True); self.upload_log.setMaximumHeight(180); c_layout.addWidget(self.upload_log)
        layout.addWidget(conv)
        layout.addStretch()
        return tab

    def _apply_style(self):
        self.setStyleSheet("""
            QMainWindow, QWidget { background-color:#1e1e1e; color:#fff; }
            QGroupBox { font-weight:bold; border:2px solid #444; border-radius:8px; margin-top:1ex; padding-top:10px; background-color:#2d2d2d; }
            QGroupBox::title { left:10px; padding:0 10px; }
            QPushButton { background-color:#007AFF; color:white; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; }
            QPushButton:hover { background-color:#0056CC; }
            QPushButton:pressed { background-color:#004499; }
            QPushButton:disabled { background-color:#555; color:#888; }
            QListWidget, QLineEdit, QTextEdit { border:1px solid #555; border-radius:4px; background-color:#2d2d2d; color:#fff; }
            QProgressBar { border:1px solid #555; border-radius:4px; text-align:center; background-color:#2d2d2d; }
            QProgressBar::chunk { background-color:#007AFF; border-radius:3px; }
            QSlider::groove:horizontal { border:1px solid #555; height:8px; background:#2d2d2d; margin:2px 0; border-radius:4px; }
            QSlider::handle:horizontal { background:#007AFF; border:1px solid #555; width:18px; margin:-2px 0; border-radius:9px; }
        """)

    # ===== Fichier sélection =====
    def _select_files(self):
        """Ouvre un dialogue pour sélectionner des fichiers RAW"""
        files, _ = QFileDialog.getOpenFileNames(
            self,
            "Sélectionner des fichiers RAW",
            "",
            "Fichiers RAW (*.cr2 *.cr3 *.nef *.arw *.dng *.raf *.orf *.rw2 *.pef *.srw);;Tous les fichiers (*)"
        )
        if files:
            self.selected_files.extend(files)
            self._update_files_list()

    def _select_folder(self):
        """Ouvre un dialogue pour sélectionner un dossier contenant des fichiers RAW"""
        folder = QFileDialog.getExistingDirectory(self, "Sélectionner un dossier")
        if folder:
            for root, _dirs, files in os.walk(folder):
                for file in files:
                    if Path(file).suffix.lower() in RAW_EXTENSIONS:
                        self.selected_files.append(os.path.join(root, file))
            self._update_files_list()

    def _clear_selection(self):
        self.selected_files.clear(); self._update_files_list()

    def _update_files_list(self):
        self.files_list.clear()
        for fp in self.selected_files:
            self.files_list.addItem(os.path.basename(fp))
        count = len(self.selected_files)
        if count == 0: self.files_count_label.setText("Aucun fichier sélectionné")
        elif count == 1: self.files_count_label.setText("1 fichier sélectionné")
        else: self.files_count_label.setText(f"{count} fichiers sélectionnés")

    def _select_output_directory(self):
        """Choix du dossier de sortie via dialogue standard"""
        directory = QFileDialog.getExistingDirectory(self, "Sélectionner le dossier de sortie")
        if directory:
            self.output_directory = directory; self.output_entry.setText(directory)

    def _update_quality(self, value):
        self.quality = value; self.quality_label.setText(str(value))

    def _toggle_watermark(self, state):
        self.watermark_enabled = state == 2
        self.watermark_entry.setEnabled(self.watermark_enabled)
        self.watermark_browse_btn.setEnabled(self.watermark_enabled)
        self.watermark_clear_btn.setEnabled(self.watermark_enabled)

    def _select_watermark_image(self):
        """Sélectionne une image pour servir de watermark"""
        file_path, _ = QFileDialog.getOpenFileName(
            self,
            "Sélectionner l'image watermark",
            "",
            "Images (*.png *.jpg *.jpeg *.bmp *.tiff *.gif);;Tous les fichiers (*.*)"
        )
        if file_path:
            self.watermark_path = file_path; self.watermark_entry.setText(os.path.basename(file_path))

    def _clear_watermark_image(self):
        self.watermark_path = ""; self.watermark_entry.clear()

    def _toggle_filename_display(self, state):
        self.filename_display_enabled = state == 2

    def _validate_inputs(self) -> bool:
        if not self.selected_files:
            QMessageBox.warning(self, "Erreur", "Veuillez sélectionner des fichiers à convertir."); return False
        if not self.output_directory:
            QMessageBox.warning(self, "Erreur", "Veuillez sélectionner un dossier de sortie."); return False
        if not os.path.exists(self.output_directory):
            QMessageBox.warning(self, "Erreur", "Le dossier de sortie n'existe pas."); return False
        # Vérification Minio si activé
        cfg = self.minio_widget.get_config()
        if cfg.enabled and not cfg.connection_tested:
            QMessageBox.warning(self, "Minio non testé",
                                "La configuration Minio est activée mais non validée.\nCliquez sur 'Tester' avant de lancer la conversion.")
            return False
        return True

    def _start_conversion(self):
        if not self._validate_inputs():
            return
        self.convert_btn.setEnabled(False); self.stop_btn.setEnabled(True); self.progress_bar.setValue(0); self.log_text.clear()
        self.log_text.append("🐴 Démarrage du traitement parallèle\n" + "=" * 50)
        self.conversion_worker = ConversionWorker(
            self.selected_files.copy(),
            self.output_directory,
            self.quality,
            self.watermark_enabled,
            self.watermark_path or None,
            self.filename_display_enabled,
            minio_config=self.minio_widget.get_config()
        )
        self.conversion_worker.progress_updated.connect(self.progress_bar.setValue)
        self.conversion_worker.status_updated.connect(self.conversion_status.setText)
        self.conversion_worker.file_converted.connect(self._on_file_converted)
        self.conversion_worker.conversion_finished.connect(self._on_conversion_finished)
        self.conversion_worker.start()

    def _stop_conversion(self):
        if self.conversion_worker:
            self.conversion_worker.stop()

    def _on_file_converted(self, filename: str, success: bool, message: str):
        self.log_text.append(message)

    def _on_conversion_finished(self, converted: int, failed: int, total: int):
        self.convert_btn.setEnabled(True); self.stop_btn.setEnabled(False); self.conversion_status.setText("Conversion terminée")
        msg = f"Conversion terminée!\n\nFichiers convertis: {converted}\nÉchecs: {failed}\nTotal: {total}\n"
        if failed > 0: msg += "\nCertains fichiers n'ont pas pu être convertis."
        QMessageBox.information(self, "Conversion terminée", msg)
        self.log_text.append("\n" + "=" * 50)
        self.log_text.append(f"🎉 TERMINÉ - {converted}/{total} fichiers convertis")
        if failed > 0: self.log_text.append(f"⚠️ {failed} échec(s)")

    # --- Sélection fichiers upload ---
    def _select_upload_files(self):
        files, _ = QFileDialog.getOpenFileNames(self, "Sélectionner fichiers JPG", "", "Images JPEG (*.jpg *.jpeg);;Tous (*)")
        if files:
            for f in files:
                if f.lower().endswith((".jpg", ".jpeg")) and f not in self.manual_upload_files:
                    self.manual_upload_files.append(f)
            self._update_upload_list()

    def _select_upload_folder(self):
        folder = QFileDialog.getExistingDirectory(self, "Sélectionner dossier contenant des JPG")
        if folder:
            for root, _dirs, files in os.walk(folder):
                for f in files:
                    if f.lower().endswith((".jpg", ".jpeg")):
                        full = os.path.join(root, f)
                        if full not in self.manual_upload_files:
                            self.manual_upload_files.append(full)
            self._update_upload_list()

    def _prefill_upload_from_output(self):
        if not self.output_directory:
            QMessageBox.information(self, "Dossier manquant", "Sélectionnez d’abord un dossier de sortie dans l’onglet Conversion.")
            return
        count_before = len(self.manual_upload_files)
        for f in os.listdir(self.output_directory):
            if f.lower().endswith((".jpg", ".jpeg")):
                full = os.path.join(self.output_directory, f)
                if full not in self.manual_upload_files:
                    self.manual_upload_files.append(full)
        added = len(self.manual_upload_files) - count_before
        self._update_upload_list()
        QMessageBox.information(self, "Pré-remplissage", f"{added} fichier(s) ajouté(s) depuis le dossier de sortie.")

    def _clear_upload_selection(self):
        self.manual_upload_files.clear()
        self._update_upload_list()

    def _update_upload_list(self):
        self.upload_list.clear()
        for f in self.manual_upload_files:
            self.upload_list.addItem(os.path.basename(f))
        n = len(self.manual_upload_files)
        if n == 0:
            self.upload_count_label.setText("Aucun fichier")
        elif n == 1:
            self.upload_count_label.setText("1 fichier")
        else:
            self.upload_count_label.setText(f"{n} fichiers")

    # --- Upload logique ---
    def _start_manual_upload(self):
        if not self.manual_upload_files:
            QMessageBox.warning(self, "Fichiers manquants", "Ajoutez des fichiers JPG avant d’uploader."); return
        cfg = self.minio_widget.get_config()
        if not (cfg.enabled and cfg.connection_tested):
            QMessageBox.warning(self, "Minio non prêt", "La configuration Minio doit être activée et testée dans l’onglet Conversion."); return
        self.start_upload_btn.setEnabled(False); self.stop_upload_btn.setEnabled(True)
        self.upload_progress.setValue(0); self.upload_log.clear(); self.upload_status.setText("Initialisation...")
        self.upload_worker = UploadWorker(self.manual_upload_files.copy(), cfg)
        self.upload_worker.progress_updated.connect(self.upload_progress.setValue)
        self.upload_worker.status_updated.connect(self.upload_status.setText)
        self.upload_worker.file_uploaded.connect(self._on_manual_file_uploaded)
        self.upload_worker.upload_finished.connect(self._on_manual_upload_finished)
        self.upload_worker.start()

    def _stop_manual_upload(self):
        if self.upload_worker:
            self.upload_worker.stop()

    def _on_manual_file_uploaded(self, filename: str, success: bool, message: str):
        base = os.path.basename(filename)
        prefix = "✅" if success else "❌"
        self.upload_log.append(f"{prefix} {base} - {message}")

    def _on_manual_upload_finished(self, uploaded: int, failed: int, total: int):
        self.start_upload_btn.setEnabled(True); self.stop_upload_btn.setEnabled(False)
        self.upload_status.setText("Terminé")
        self.upload_log.append("\n" + "=" * 40)
        self.upload_log.append(f"☁️ Upload terminé: {uploaded}/{total} OK")
        if failed:
            self.upload_log.append(f"⚠️ {failed} échec(s)")
        if self.upload_worker:
            self.upload_worker.deleteLater(); self.upload_worker = None


def main():
    app = QApplication(sys.argv)
    app.setApplicationName("Convertisseur RAW Parallèle")
    app.setApplicationVersion("2.1")
    app.setOrganizationName("ImageProcessor")
    app.setStyle('Fusion')
    window = ImageProcessorApp(); window.show()
    sys.exit(app.exec())
