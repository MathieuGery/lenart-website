"""Fonctions de traitement d'image RAW vers JPEG.
Séparé de PyQt pour faciliter les tests.
"""
from __future__ import annotations
import os
from pathlib import Path
from typing import Optional, Tuple
import rawpy
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw, ImageFont

MAX_WEB_SIZE = 768

class ConversionResult:
    def __init__(self, filename: str, success: bool, message: str):
        self.filename = filename
        self.success = success
        self.message = message

    def __iter__(self):  # compatibilité avec unpacking
        yield self.filename
        yield self.success
        yield self.message


def _apply_web_optimizations(image: Image.Image) -> Image.Image:
    # Redimensionnement intelligent
    if max(image.size) > MAX_WEB_SIZE:
        ratio = MAX_WEB_SIZE / max(image.size)
        new_size = tuple(int(dim * ratio) for dim in image.size)
        image = image.resize(new_size, Image.Resampling.LANCZOS)
    # Contraste & saturation
    image = ImageEnhance.Contrast(image).enhance(1.1)
    image = ImageEnhance.Color(image).enhance(1.08)
    # Netteté
    image = image.filter(ImageFilter.UnsharpMask(radius=0.8, percent=150, threshold=3))
    return image


def _apply_watermark(image: Image.Image, watermark_path: str) -> Image.Image:
    if not watermark_path or not os.path.exists(watermark_path):
        return image
    try:
        watermark = Image.open(watermark_path)
        if watermark.mode != 'RGBA':
            watermark = watermark.convert('RGBA')
        max_width = int(image.width * 0.15)
        if watermark.width > max_width:
            ratio = max_width / watermark.width
            new_size = (max_width, int(watermark.height * ratio))
            watermark = watermark.resize(new_size, Image.Resampling.LANCZOS)
        margin = 20
        x = image.width - watermark.width - margin
        y = image.height - watermark.height - margin
        if image.mode != 'RGBA':
            image = image.convert('RGBA')
        image.paste(watermark, (x, y), watermark)
        if image.mode == 'RGBA':
            bg = Image.new('RGB', image.size, (255, 255, 255))
            bg.paste(image, mask=image.split()[3])
            image = bg
    except Exception as e:
        print(f"Erreur watermark: {e}")
    return image


def _apply_filename_overlay(image: Image.Image, source_path: str) -> Image.Image:
    try:
        draw = ImageDraw.Draw(image)
        filename_text = Path(source_path).stem
        font_size = max(20, min(60, int(min(image.size) * 0.03)))
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", font_size)
        except Exception:
            font = ImageFont.load_default()
        bbox = draw.textbbox((0, 0), filename_text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        margin = 20
        x = image.width - text_width - margin
        y = image.height - text_height - margin
        draw.text((x, y), filename_text, fill=(255, 50, 50), font=font)
    except Exception as e:
        print(f"Erreur overlay texte: {e}")
    return image


def convert_raw_to_jpeg(file_path: str, output_dir: str, quality: int,
                        watermark_enabled: bool = True, watermark_path: Optional[str] = None,
                        filename_display_enabled: bool = True) -> ConversionResult:
    filename = os.path.basename(file_path)
    try:
        with rawpy.imread(file_path) as raw:
            rgb = raw.postprocess(
                use_camera_wb=True,
                half_size=False,
                no_auto_bright=True,
                output_bps=8,
                bright=1.15,
                highlight_mode=rawpy.HighlightMode.Clip,
                use_auto_wb=False,
                gamma=(2.2, 4.5),
                output_color=rawpy.ColorSpace.sRGB,
                demosaic_algorithm=rawpy.DemosaicAlgorithm.AHD,
            )
        image = Image.fromarray(rgb)
        image = _apply_web_optimizations(image)
        if watermark_enabled:
            image = _apply_watermark(image, watermark_path or '')
        if filename_display_enabled:
            image = _apply_filename_overlay(image, file_path)
        base_name = Path(file_path).stem
        output_path = os.path.join(output_dir, f"{base_name}.jpg")
        original_size = os.path.getsize(file_path) / (1024 * 1024)
        save_options = {
            'format': 'JPEG',
            'quality': quality,
            'optimize': True,
            'progressive': True,
            'subsampling': 0 if quality > 85 else 2,
            'dpi': (150, 150),
        }
        image.save(output_path, **save_options)
        final_size = os.path.getsize(output_path) / (1024 * 1024)
        compression_ratio = (1 - final_size / original_size) * 100 if original_size > 0 else 0
        msg = f"✅ {base_name}.jpg ({original_size:.1f}MB → {final_size:.1f}MB, -{compression_ratio:.0f}%)"
        return ConversionResult(filename, True, msg)
    except Exception as e:
        return ConversionResult(filename, False, f"❌ Erreur: {e}")
