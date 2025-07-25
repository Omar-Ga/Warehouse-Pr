from flask import Blueprint, render_template, jsonify, send_file
from ..models.db_utils import get_db_connection
import barcode
from barcode.writer import ImageWriter
import io

# Using Blueprint for routes modularity
bp = Blueprint('general', __name__)

@bp.route('/')
def index():
    """Serves the main index.html page."""
    
    return render_template('index.html') 

@bp.route('/api/stats', methods=['GET'])
def get_dashboard_stats():
    # ... existing code ...
    conn.close()
    return jsonify(stats)

@bp.route('/api/barcode/<string:barcode_value>', methods=['GET'])
def generate_barcode_image(barcode_value):
    """
    Generates a barcode image for the given value and returns it.
    """
    try:
        
        Code128 = barcode.get_barcode_class('code128')
        code128 = Code128(barcode_value, writer=ImageWriter())
        
        
        buffer = io.BytesIO()
        code128.write(buffer)
        buffer.seek(0)
        
        return send_file(
            buffer,
            mimetype='image/png',
            as_attachment=False
        )
    except Exception as e:
        
        print(f"Error generating barcode for value {barcode_value}: {e}")
        return jsonify({"error": "Failed to generate barcode"}), 500