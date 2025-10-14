"""Threads et workers PyQt pour la conversion parallèle."""
from __future__ import annotations
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Optional
from PyQt6.QtCore import QThread, pyqtSignal
from .processing import convert_raw_to_jpeg
from .minio_widget import MinioConfig
from .minio_uploader import build_client, ensure_bucket, upload_file

class ConversionWorker(QThread):
    progress_updated = pyqtSignal(int)
    status_updated = pyqtSignal(str)
    file_converted = pyqtSignal(str, bool, str)
    conversion_finished = pyqtSignal(int, int, int)

    def __init__(self, files: List[str], output_dir: str, quality: int,
                 watermark_enabled: bool = True, watermark_path: Optional[str] = None,
                 filename_display_enabled: bool = True,
                 minio_config: Optional[MinioConfig] = None):
        super().__init__()
        self.files = files
        self.output_dir = output_dir
        self.quality = quality
        self.watermark_enabled = watermark_enabled
        self.watermark_path = watermark_path
        self.filename_display_enabled = filename_display_enabled
        self._stop_requested = False
        self.minio_config = minio_config
        self._minio_client = None
        self._minio_bucket_ok = False

    def stop(self):
        self._stop_requested = True

    def run(self):
        converted = 0
        failed = 0
        total = len(self.files)
        completed = 0
        self.status_updated.emit(f"Démarrage du traitement parallèle de {total} fichiers...")
        # Initialisation Minio si nécessaire
        if self.minio_config and self.minio_config.enabled and self.minio_config.connection_tested:
            self._minio_client = build_client(self.minio_config)
            if self._minio_client:
                ok, msg = ensure_bucket(self._minio_client, self.minio_config.bucket)
                self._minio_bucket_ok = ok
                self.status_updated.emit(msg)
        with ThreadPoolExecutor(max_workers=5) as executor:
            future_to_file = {executor.submit(convert_raw_to_jpeg, file_path, self.output_dir, self.quality,
                                              self.watermark_enabled, self.watermark_path, self.filename_display_enabled): file_path
                              for file_path in self.files}
            for future in as_completed(future_to_file):
                if self._stop_requested:
                    executor.shutdown(wait=False, cancel_futures=True)
                    break
                file_path = future_to_file[future]
                result = future.result()
                filename, success, message = result.filename, result.success, result.message
                # Upload Minio si succès et config ok
                if success and self._minio_client and self._minio_bucket_ok:
                    local_jpeg = os.path.join(self.output_dir, f"{os.path.splitext(filename)[0]}.jpg")
                    _up_ok, up_msg = upload_file(self._minio_client, self.minio_config.bucket, local_jpeg)  # type: ignore
                    message = message + (" | " + up_msg)
                if success:
                    converted += 1
                else:
                    failed += 1
                completed += 1
                self.status_updated.emit(f"Terminé: {filename} ({completed}/{total})")
                self.file_converted.emit(filename, success, message)
                progress = int((completed / total) * 100)
                self.progress_updated.emit(progress)
        self.conversion_finished.emit(converted, failed, total)
