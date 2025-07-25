from flask import Blueprint, jsonify
from ..models.db_utils import create_timestamped_backup
import barcode
from barcode.writer import ImageWriter
import io
import base64
import os
import sys

bp = Blueprint('backup', __name__, url_prefix='/api/backup')

@bp.route('/create', methods=['POST'])
def create_backup_route():
    """
    Handles the API request to create a timestamped database backup.
    """
    success, message_or_path = create_timestamped_backup()
    
    if success:
        success_message = "تم إنشاء النسخة الاحتياطية بنجاح"
        return jsonify({'message': success_message, 'backup_path': message_or_path}), 200
    else:
        return jsonify({'error': 'Failed to create backup', 'details': message_or_path}), 500

def get_resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    if getattr(sys, 'frozen', False):
        
        base_path = sys._MEIPASS
    else:
        
        base_path = os.path.abspath(".")
    
    return os.path.join(base_path, relative_path)

@bp.route('/barcode/<string:barcode_value>', methods=['GET'])
def generate_barcode_image(barcode_value):
    """
    Generates a barcode image for the given value and returns it as a Base64 encoded string.
    """
    try:
        # Define the font path
        font_path = get_resource_path(os.path.join('assets', 'arial.ttf'))

        Code128 = barcode.get_barcode_class('code128')
        code128 = Code128(barcode_value, writer=ImageWriter())
        
        buffer = io.BytesIO()
        code128.write(buffer, options={"font_path": font_path})
        buffer.seek(0)

        # Encode the image to Base64
        encoded_string = base64.b64encode(buffer.read()).decode('utf-8')

        return jsonify({
            "barcodeValue": barcode_value,
            "imageData": encoded_string,
            "imageFormat": "png"
        })
    except Exception as e:
        print(f"Error generating barcode for value {barcode_value}: {e}")
        return jsonify({"error": "Failed to generate barcode"}), 500 