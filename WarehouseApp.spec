# WarehouseApp.spec

# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

# Define data files to be included in the application bundle.
# The paths are relative to this .spec file (project root).
# The tuple format is (source_path, destination_path_in_bundle).
datas_list = [
    ('UI/dist/', './dist/'),              # Copies the built React frontend.
    ('database/schema.sql', './database/'), # Copies the database schema.
    ('app/assets/arial.ttf', './assets/') # Copies the font file.
]


a = Analysis(
    ['run.py'], # <<< UPDATED: Use the new run.py entry point.
    pathex=['.'],
    binaries=[],
    datas=datas_list, 
    hiddenimports=[
        'webview.platforms.edgechromium',
        'webview.platforms.mshtml',
        'engineio.async_drivers.threading',
        'Pillow',
        'barcode',
        'barcode.writer',
        
        # Models
        'app.models.db_utils',
        'app.models.item_model',
        'app.models.movement_log_model',
        'app.models.unit_model',
        'app.models.category_model',
        'app.models.destination_model',
        'app.models.provider_model',

        # Routes
        'app.routes.items_routes',
        'app.routes.log_routes',
        'app.routes.units_routes',
        'app.routes.backup_routes',
        'app.routes.category_routes',
        'app.routes.destination_routes',
        'app.routes.provider_routes',
    ],
    hookspath=[],
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
    [],
    [],
    [],
    name='WarehouseApp',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    # icon='path/to/your/app.ico'
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='WarehouseApp_Build',
)