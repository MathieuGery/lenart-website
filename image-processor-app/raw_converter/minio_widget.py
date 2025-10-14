"""Widget et configuration Minio (extrait de l'ancien minio.py)."""
from __future__ import annotations
from typing import Optional
import os
from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QGridLayout, QGroupBox, QLabel, QLineEdit,
                             QCheckBox, QPushButton, QMessageBox, QProgressBar, QHBoxLayout)
from PyQt6.QtCore import Qt, QThread, pyqtSignal
import socket

class MinioConfig:
    def __init__(self):
        self.enabled = False
        self.endpoint = ""
        self.access_key = ""
        self.secret_key = ""
        self.bucket = ""
        self.use_ssl = True
        self.connection_tested = False

    def is_valid(self) -> bool:
        if not self.enabled:
            return False
        required = [self.endpoint, self.access_key, self.secret_key, self.bucket]
        return all(field.strip() for field in required)

    def split_endpoint(self):
        ep = self.endpoint.strip()
        if not ep:
            return "", 0
        if ':' in ep:
            host, port_s = ep.split(':', 1)
            try:
                port = int(port_s)
            except ValueError:
                port = 443 if self.use_ssl else 9000
        else:
            host = ep
            port = 443 if self.use_ssl else 9000
        return host, port

class MinioTestWorker(QThread):
    test_completed = pyqtSignal(bool, str)
    def __init__(self, config: MinioConfig):
        super().__init__()
        self.config = config
    def run(self):
        try:
            host, port = self.config.split_endpoint()
            if not host or not port:
                self.test_completed.emit(False, "❌ Endpoint invalide")
                return
            try:
                socket.create_connection((host, port), timeout=5).close()
            except socket.gaierror:
                self.test_completed.emit(False, f"❌ Résolution DNS impossible: {host}")
                return
            except TimeoutError:
                self.test_completed.emit(False, f"❌ Timeout de connexion {host}:{port}")
                return
            except OSError as e:
                self.test_completed.emit(False, f"❌ Connexion refusée {host}:{port} ({e})")
                return

            from minio import Minio
            from minio.error import S3Error
            from io import BytesIO

            client = Minio(
                self.config.endpoint,
                access_key=self.config.access_key,
                secret_key=self.config.secret_key,
                secure=self.config.use_ssl
            )

            # Test simple: listing (auth + accès)
            try:
                client.list_buckets()
            except S3Error as e:
                self.test_completed.emit(False, f"❌ Auth/accès échoué: {e.code}")
                return

            # Bucket existence / création
            try:
                bucket_exists = client.bucket_exists(self.config.bucket)
            except S3Error as e:
                self.test_completed.emit(False, f"❌ Vérif bucket échouée: {e.code}")
                return

            if not bucket_exists:
                try:
                    client.make_bucket(self.config.bucket)
                except S3Error as e:
                    self.test_completed.emit(False, f"❌ Création bucket échouée: {e.code}")
                    return
                bucket_msg = f"Bucket '{self.config.bucket}' créé"
            else:
                bucket_msg = f"Bucket '{self.config.bucket}' accessible"

            # Upload / delete test
            test_content = b"Test upload RAW Converter"
            try:
                client.put_object(self.config.bucket, "test_connection.txt",
                                  data=BytesIO(test_content),
                                  length=len(test_content),
                                  content_type="text/plain")
                client.remove_object(self.config.bucket, "test_connection.txt")
            except S3Error as e:
                self.test_completed.emit(False, f"❌ Upload test échoué: {e.code}")
                return

            self.test_completed.emit(True, f"✅ Connexion réussie - {bucket_msg}")
        except ImportError:
            self.test_completed.emit(False, "❌ Module 'minio' non installé. pip install minio")
        except Exception as e:
            self.test_completed.emit(False, f"❌ Erreur: {e}")

DEFAULT_MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio.gery.me")
DEFAULT_MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "lenart-admin")

class MinioConfigWidget(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.config = MinioConfig()
        self.test_worker: Optional[MinioTestWorker] = None
        self._build_ui()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        group = QGroupBox("☁️ Upload Minio (Optionnel)")
        grid = QGridLayout(group)
        self.enable_checkbox = QCheckBox("Uploader vers Minio après conversion")
        self.enable_checkbox.stateChanged.connect(self._on_enable_changed)
        grid.addWidget(self.enable_checkbox, 0, 0, 1, 2)
        # Endpoint
        grid.addWidget(QLabel("Endpoint:"), 1, 0)
        self.endpoint_entry = QLineEdit(); self.endpoint_entry.setPlaceholderText("ex: minio.example.com:9000")
        self.endpoint_entry.setEnabled(False); self.endpoint_entry.textChanged.connect(self._on_config_changed)
        grid.addWidget(self.endpoint_entry, 1, 1)
        # SSL
        self.ssl_checkbox = QCheckBox("Utiliser SSL (HTTPS)"); self.ssl_checkbox.setChecked(True)
        self.ssl_checkbox.setEnabled(False); self.ssl_checkbox.stateChanged.connect(self._on_config_changed)
        grid.addWidget(self.ssl_checkbox, 2, 0, 1, 2)
        # Access Key
        grid.addWidget(QLabel("Access Key:"), 3, 0)
        self.access_key_entry = QLineEdit(); self.access_key_entry.setEnabled(False)
        self.access_key_entry.setPlaceholderText("Clé d'accès Minio"); self.access_key_entry.textChanged.connect(self._on_config_changed)
        grid.addWidget(self.access_key_entry, 3, 1)
        # Secret Key
        grid.addWidget(QLabel("Secret Key:"), 4, 0)
        self.secret_key_entry = QLineEdit(); self.secret_key_entry.setEchoMode(QLineEdit.EchoMode.Password)
        self.secret_key_entry.setEnabled(False); self.secret_key_entry.setPlaceholderText("Clé secrète Minio")
        self.secret_key_entry.textChanged.connect(self._on_config_changed)
        grid.addWidget(self.secret_key_entry, 4, 1)
        self.show_secret_btn = QPushButton("👁️"); self.show_secret_btn.setMaximumWidth(40); self.show_secret_btn.setEnabled(False)
        self.show_secret_btn.clicked.connect(self._toggle_secret_visibility)
        grid.addWidget(self.show_secret_btn, 4, 2)
        # Bucket
        grid.addWidget(QLabel("Bucket:"), 5, 0)
        self.bucket_entry = QLineEdit(); self.bucket_entry.setEnabled(False)
        self.bucket_entry.setPlaceholderText("nom-du-bucket"); self.bucket_entry.textChanged.connect(self._on_config_changed)
        grid.addWidget(self.bucket_entry, 5, 1)
        # Buttons
        btn_layout = QHBoxLayout()
        self.test_btn = QPushButton("🔗 Tester"); self.test_btn.setEnabled(False); self.test_btn.clicked.connect(self._test_connection)
        btn_layout.addWidget(self.test_btn)
        self.clear_btn = QPushButton("🗑️ Effacer"); self.clear_btn.setEnabled(False); self.clear_btn.clicked.connect(self._clear_config)
        btn_layout.addWidget(self.clear_btn)
        grid.addLayout(btn_layout, 6, 0, 1, 2)
        # Progress + status
        self.progress_bar = QProgressBar(); self.progress_bar.setVisible(False); self.progress_bar.setRange(0, 0)
        grid.addWidget(self.progress_bar, 7, 0, 1, 2)
        self.status_label = QLabel("Configuration Minio désactivée"); self.status_label.setStyleSheet("color:#888; font-style:italic; padding:5px;")
        grid.addWidget(self.status_label, 8, 0, 1, 2)
        layout.addWidget(group)
        # Pré-remplissage valeurs par défaut (sans activer Minio)
        self.endpoint_entry.setText(DEFAULT_MINIO_ENDPOINT)
        self.access_key_entry.setText(DEFAULT_MINIO_ACCESS_KEY)
        self._update_status()

    def _on_enable_changed(self, state):
        enabled = state == Qt.CheckState.Checked.value
        self.config.enabled = enabled
        widgets = [self.endpoint_entry, self.ssl_checkbox, self.access_key_entry, self.secret_key_entry,
                   self.show_secret_btn, self.bucket_entry, self.test_btn, self.clear_btn]
        for w in widgets:
            w.setEnabled(enabled)
        self._update_status()

    def _on_config_changed(self):
        self.config.endpoint = self.endpoint_entry.text().strip()
        self.config.access_key = self.access_key_entry.text().strip()
        self.config.secret_key = self.secret_key_entry.text().strip()
        self.config.bucket = self.bucket_entry.text().strip()
        self.config.use_ssl = self.ssl_checkbox.isChecked()
        self.config.connection_tested = False
        self._update_status()

    def _update_status(self):
        if not self.config.enabled:
            self.status_label.setText("Configuration Minio désactivée"); self.status_label.setStyleSheet("color:#888; font-style:italic; padding:5px;")
        elif not self.config.is_valid():
            self.status_label.setText("⚠️ Champs obligatoires manquants"); self.status_label.setStyleSheet("color:#FFA500; font-style:italic; padding:5px;")
        elif self.config.connection_tested:
            self.status_label.setText("✅ Configuration validée - prêt"); self.status_label.setStyleSheet("color:#0A0; font-weight:bold; padding:5px;")
        else:
            self.status_label.setText("🔄 Configuration complète - test requis"); self.status_label.setStyleSheet("color:#007AFF; font-style:italic; padding:5px;")

    def _toggle_secret_visibility(self):
        if self.secret_key_entry.echoMode() == QLineEdit.EchoMode.Password:
            self.secret_key_entry.setEchoMode(QLineEdit.EchoMode.Normal); self.show_secret_btn.setText("🙈")
        else:
            self.secret_key_entry.setEchoMode(QLineEdit.EchoMode.Password); self.show_secret_btn.setText("👁️")

    def _test_connection(self):
        if not self.config.is_valid():
            QMessageBox.warning(self, "Configuration incomplète", "Veuillez remplir tous les champs avant de tester.")
            return
        self.test_btn.setEnabled(False); self.progress_bar.setVisible(True)
        self.status_label.setText("🔄 Test de connexion..."); self.status_label.setStyleSheet("color:#007AFF; font-style:italic; padding:5px;")
        self.test_worker = MinioTestWorker(self.config)
        self.test_worker.test_completed.connect(self._on_test_completed)
        self.test_worker.start()

    def _on_test_completed(self, success: bool, message: str):
        self.progress_bar.setVisible(False); self.test_btn.setEnabled(True)
        self.config.connection_tested = success; self.status_label.setText(message)
        if success:
            self.status_label.setStyleSheet("color:#0A0; font-weight:bold; padding:5px;")
            QMessageBox.information(self, "Test réussi", message)
        else:
            self.status_label.setStyleSheet("color:#F00; font-weight:bold; padding:5px;")
            QMessageBox.critical(self, "Test échoué", message)
        if self.test_worker:
            self.test_worker.deleteLater(); self.test_worker = None

    def _clear_config(self):
        reply = QMessageBox.question(self, "Effacer", "Effacer toute la configuration Minio ?",
                                     QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
                                     QMessageBox.StandardButton.No)
        if reply == QMessageBox.StandardButton.Yes:
            self.endpoint_entry.setText(DEFAULT_MINIO_ENDPOINT)
            self.access_key_entry.setText(DEFAULT_MINIO_ACCESS_KEY)
            self.ssl_checkbox.setChecked(True)
            # Reset model config
            self.config = MinioConfig(); self.config.enabled = self.enable_checkbox.isChecked()
            self.config.endpoint = DEFAULT_MINIO_ENDPOINT
            self.config.access_key = DEFAULT_MINIO_ACCESS_KEY
            self._update_status()

    def get_config(self) -> MinioConfig:
        return self.config

    def set_config(self, config: MinioConfig):
        self.config = config
        self.enable_checkbox.setChecked(config.enabled)
        self.endpoint_entry.setText(config.endpoint)
        self.access_key_entry.setText(config.access_key)
        self.secret_key_entry.setText(config.secret_key)
        self.bucket_entry.setText(config.bucket)
        self.ssl_checkbox.setChecked(config.use_ssl)
        self._update_status()
