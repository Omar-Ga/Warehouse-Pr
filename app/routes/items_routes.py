from flask import Blueprint, request, jsonify, send_file
import sqlite3
from app.models import item_model
import barcode
from barcode.writer import ImageWriter
from io import BytesIO

items_bp = Blueprint('items_bp', __name__, url_prefix='/api/items')

@items_bp.route('/', methods=['GET'])
def get_items_route():
    """
    Unified route for fetching items.
    Supports standard pagination (page, page_size) for tables.
    Supports offset/limit pagination and 'q' for react-select-async-paginate.
    """
    
    is_ranged_request = 'offset' in request.args
    
    if is_ranged_request:
        offset = request.args.get('offset', 0, type=int)
        limit = request.args.get('limit', 10, type=int)
        search_term = request.args.get('q', None)
        page = (offset // limit) + 1
        page_size = limit
    else:
        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('page_size', 10, type=int)
        search_term = request.args.get('search', None)

    sub_category_id = request.args.get('sub_category_id', None, type=int)
    
    try:
        data = item_model.get_items_paginated(page, page_size, search_term, sub_category_id)
        
        
        if is_ranged_request:
            return jsonify({
                "items": data.get("items", []),
                "total_count": data.get("total_items", 0)
            })
        
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": "Failed to retrieve items", "details": str(e)}), 500

@items_bp.route('/', methods=['POST'])
def add_item_route():
    """Handles adding a new item, with conflict detection for inactive/archived items."""
    data = request.get_json()
    required_fields = ['name', 'unit_id', 'sub_category_id', 'initial_quantity']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        new_item = item_model.add_item(
            name=data['name'].strip(),
            unit_id=data['unit_id'],
            sub_category_id=data['sub_category_id'],
            quantity=data['initial_quantity'],
            provider_id=data.get('provider_id'),
            cost=data.get('cost'),
            person_name=data.get('person_name'),
            barcode=data.get('barcode')
        )
        return jsonify(new_item), 201
    except ValueError as e:
        
        item = item_model.get_item_by_name(data['name'].strip())
        return jsonify({"error": str(e), "type": "item_conflict", "item_id": item['id']}), 409
    except sqlite3.IntegrityError as e:
        return jsonify({"error": f"Database integrity error: {e}"}), 409
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {e}"}), 500

@items_bp.route('/<int:item_id>/restore', methods=['PATCH'])
def restore_item_route(item_id):
    """Restores an inactive or archived item."""
    data = request.get_json()
    if 'sub_category_id' not in data:
        return jsonify({"error": "sub_category_id is required"}), 400

    try:
        restored_item = item_model.restore_item(
            item_id=item_id,
            sub_category_id=data['sub_category_id'],
            person_name=data.get('person_name')
        )
        if restored_item: return jsonify(restored_item), 200
        return jsonify({"error": "Item not found"}), 404
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {e}"}), 500

@items_bp.route('/<int:item_id>/status', methods=['PATCH'])
def update_item_status_route(item_id):
    """Updates an item's status."""
    data = request.get_json()
    if 'status' not in data: return jsonify({'error': 'Missing status field'}), 400
    
    try:
        updated_item = item_model.update_item_status(
            item_id=item_id, new_status=data['status'], person_name=data.get('person_name'))
        return jsonify(updated_item), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {e}"}), 500

@items_bp.route('/<int:item_id>', methods=['PUT'])
def update_item_route(item_id):
    """Updates an item's details."""
    data = request.get_json()
    if not data or 'name' not in data or 'unit_id' not in data:
        return jsonify({"error": "Missing required fields: name, unit_id"}), 400

    try:
        updated_item = item_model.update_item(
            item_id=item_id,
            name=data['name'],
            unit_id=data['unit_id'],
            sub_category_id=data.get('sub_category_id'),
            barcode=data.get('barcode'),
            person_name=data.get('person_name'),
            force_unit_change=data.get('force_unit_change', False)
        )
        
        if isinstance(updated_item, dict) and updated_item.get('confirmation_required'):
            return jsonify({
                "error": updated_item['message'],
                "type": "UNIT_CHANGE_CONFIRMATION"
            }), 409
            
        return jsonify(updated_item), 200
    except sqlite3.IntegrityError as e:
        
        return jsonify({"error": str(e)}), 409
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {e}"}), 500

@items_bp.route('/by-barcode/<string:barcode>', methods=['GET'])
def get_item_by_barcode_route(barcode):
    """Gets a single active item by its barcode."""
    try:
        item = item_model.get_item_by_barcode(barcode)
        if item:
            return jsonify(item), 200
        else:
            return jsonify({'error': 'Item not found or is not active'}), 404
    except Exception as e:
        return jsonify({"error": "Failed to retrieve item by barcode", "details": str(e)}), 500

@items_bp.route('/<int:item_id>/adjust', methods=['POST'])
def adjust_item_quantity_route(item_id):
    """Adjusts an item's quantity."""
    data = request.get_json()
    try:
        result = item_model.record_quantity_adjustment(item_id=item_id, **data)
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {e}"}), 500

@items_bp.route('/<int:item_id>/barcode', methods=['GET'])
def get_barcode_route(item_id):
    """Generates and returns a barcode image for a given item."""
    try:
        item = item_model.get_item_by_id(item_id)
        if not item:
            return jsonify({'error': 'Item not found'}), 404

        barcode_value = item.get('barcode')
        if not barcode_value:
            return jsonify({'error': 'Item does not have a barcode'}), 404

        # Generate barcode
        code128 = barcode.get_barcode_class('code128')
        barcode_instance = code128(barcode_value, writer=ImageWriter())

        # Save barcode to a memory buffer
        buffer = BytesIO()
        barcode_instance.write(buffer)
        buffer.seek(0)

        return send_file(
            buffer,
            mimetype='image/png',
            as_attachment=False,
            download_name=f'{barcode_value}.png'
        )
    except Exception as e:
        return jsonify({"error": "Failed to generate barcode", "details": str(e)}), 500

@items_bp.route('/<int:item_id>', methods=['GET'])
def get_item_by_id_route(item_id):
    """Gets a single item by its ID."""
    item = item_model.get_item_by_id(item_id)
    if item: return jsonify(item), 200
    return jsonify({'error': 'Item not found'}), 404
 