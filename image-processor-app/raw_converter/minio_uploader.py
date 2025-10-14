"""Fonctions utilitaires pour uploader des fichiers vers Minio.
Séparé pour garder la logique d'upload distincte du traitement d'image.
"""
from __future__ import annotations
from datetime import datetime
from pathlib import Path
from typing import Tuple
from io import BytesIO

try:  # Import optionnel
    from minio import Minio  # type: ignore
    from minio.error import S3Error  # type: ignore
except ImportError:  # pragma: no cover
    Minio = None  # type: ignore
    class S3Error(Exception):  # fallback minimal
        pass

from .minio_widget import MinioConfig

def build_client(config: MinioConfig):
    """Construit et retourne un client Minio à partir de la config.
    Retourne None si Minio n'est pas disponible ou config non valide.
    """
    if Minio is None or not config.enabled or not config.connection_tested:
        return None
    return Minio(
        config.endpoint,
        access_key=config.access_key,
        secret_key=config.secret_key,
        secure=config.use_ssl,
    )

def ensure_bucket(client, bucket: str) -> Tuple[bool, str]:  # client: Minio | None
    """Vérifie / crée le bucket si nécessaire."""
    try:
        exists = client.bucket_exists(bucket)
        if not exists:
            client.make_bucket(bucket)
            return True, f"Bucket créé: {bucket}"
        return True, f"Bucket OK: {bucket}"
    except S3Error as e:  # pragma: no cover (dépend réseau)
        return False, f"Erreur bucket: {getattr(e, 'code', e)}"
    except Exception as e:
        return False, f"Erreur bucket: {e}"

def generate_object_name(local_path: str) -> str:
    """Génère un nom d'objet dans un dossier daté (YYYY-MM-DD/filename)."""
    date_folder = datetime.utcnow().strftime("%Y-%m-%d")
    return f"{date_folder}/{Path(local_path).name}"

def upload_file(client, bucket: str, local_path: str) -> Tuple[bool, str]:  # client: Minio | None
    """Upload d'un fichier vers Minio (retour succès, message)."""
    object_name = generate_object_name(local_path)
    try:
        client.fput_object(bucket, object_name, local_path, content_type="image/jpeg")
        url_hint = f"s3://{bucket}/{object_name}" if client else object_name
        return True, f"☁️ Upload OK: {url_hint}"
    except S3Error as e:  # pragma: no cover
        return False, f"☁️ Upload échoué ({getattr(e, 'code', e)})"
    except Exception as e:
        return False, f"☁️ Upload échoué ({e})"
