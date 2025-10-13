#!/usr/bin/env python3
"""
Configuration pour PyInstaller - Création d'un exécutable portable
"""

# -*- mode: python ; coding: utf-8 -*-
import sys

block_cipher = None

a = Analysis(
    ['raw_converter_pyqt.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=[
        'rawpy',
        'PIL',
        'PIL.Image',
        'numpy',
        'PyQt6.QtCore',
        'PyQt6.QtGui', 
        'PyQt6.QtWidgets',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='RAW_Converter',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

# Configuration spéciale pour macOS
if sys.platform == 'darwin':
    app = BUNDLE(
        exe,
        name='RAW Converter.app',
        icon=None,
        bundle_identifier='com.imageprocessor.rawconverter',
        info_plist={
            'CFBundleName': 'RAW Converter',
            'CFBundleDisplayName': 'RAW Converter',
            'CFBundleVersion': '2.0',
            'CFBundleShortVersionString': '2.0',
            'NSHighResolutionCapable': True,
            'NSSupportsAutomaticGraphicsSwitching': True,
        },
    )
