"""Worker pour upload manuel de fichiers JPEG vers Minio."""
from __future__ import annotations
import os
from typing import List
from PyQt6.QtCore import QThread, pyqtSignal
from .minio_widget import MinioConfig
from .minio_uploader import build_client, ensure_bucket, upload_file

class UploadWorker(QThread):
    progress_updated = pyqtSignal(int)
    status_updated = pyqtSignal(str)
    file_uploaded = pyqtSignal(str, bool, str)
    upload_finished = pyqtSignal(int, int, int)
    def __init__(self, files: List[str], minio_config: MinioConfig):
        super().__init__()
        self.files = files
        self.minio_config = minio_config
        self._stop = False
        self._client = None
        self._bucket_ok = False
    def stop(self):
        self._stop = True
    def run(self):
        total = len(self.files)
        uploaded = 0
        failed = 0
        self.status_updated.emit(f"Initialisation upload ({total} fichiers)...")
        if not (self.minio_config and self.minio_config.enabled and self.minio_config.connection_tested):
            self.status_updated.emit("❌ Configuration Minio invalide ou non testée.")
            self.upload_finished.emit(0, total, total)
            return
        self._client = build_client(self.minio_config)
        if not self._client:
            self.status_updated.emit("❌ Client Minio indisponible.")
            self.upload_finished.emit(0, total, total)
            return
        ok, msg = ensure_bucket(self._client, self.minio_config.bucket)
        self._bucket_ok = ok
        self.status_updated.emit(msg)
        if not ok:
            self.upload_finished.emit(0, total, total)
            return
        for idx, fpath in enumerate(self.files, start=1):
            if self._stop:
                self.status_updated.emit("⏹️ Upload interrompu")
                break
            if not os.path.exists(fpath):
                self.file_uploaded.emit(fpath, False, "❌ Fichier introuvable")
                failed += 1
            else:
                up_ok, up_msg = upload_file(self._client, self.minio_config.bucket, fpath)  # type: ignore
                if up_ok:
                    uploaded += 1
                else:
                    failed += 1
                self.file_uploaded.emit(fpath, up_ok, up_msg)
            progress = int((idx / total) * 100)
            self.progress_updated.emit(progress)
            self.status_updated.emit(f"{idx}/{total} traités")
        self.upload_finished.emit(uploaded, failed, total)