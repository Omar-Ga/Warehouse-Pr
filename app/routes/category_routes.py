from flask import Blueprint, request, jsonify
from app.models import category_model

bp = Blueprint('category_routes', __name__, url_prefix='/api/categories')

@bp.route('/', methods=['POST'])
def create_category():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Category name is required.'}), 400
    
    name = data['name'].strip()
    if not name:
        return jsonify({'error': 'Category name cannot be empty.'}), 400

    parent_id = data.get('parent_id')

    
    if parent_id is not None and parent_id != '':
        try:
            parent_id = int(parent_id)
        except (ValueError, TypeError):
            return jsonify({'error': 'parent_id must be a valid integer.'}), 400
    else:
        parent_id = None

    try:
        new_category = category_model.add_category(name, parent_id)
        if new_category:
            return jsonify(new_category), 201
        else:
            
            return jsonify({'error': 'Failed to create category. A database error occurred.'}), 500
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        
        print(f"An unexpected error occurred in create_category: {e}")
        return jsonify({'error': 'An unexpected server error occurred.'}), 500

@bp.route('/', methods=['GET'])
def get_categories_route():
    parent_id_str = request.args.get('parent_id')
    level = request.args.get('level')
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 10, type=int)

    parent_id = None
    main_categories_only = False

    if level == 'main':
        main_categories_only = True
    elif parent_id_str:
        try:
            parent_id = int(parent_id_str)
        except ValueError:
            return jsonify({'error': 'Invalid parent_id parameter. Must be an integer.'}), 400
    
    try:
        result = category_model.get_categories(
            parent_id=parent_id, 
            main_categories_only=main_categories_only,
            page=page,
            page_size=page_size
        )
        
        
        
        if main_categories_only:
            return jsonify(result.get('categories', [])), 200
        else:
            return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": "Failed to retrieve categories", "details": str(e)}), 500

@bp.route('/<int:category_id>', methods=['PUT'])
def update_category_route(category_id):
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'New category name is required.'}), 400

    name = data['name'].strip()
    if not name:
        return jsonify({'error': 'Category name cannot be empty.'}), 400

    if not category_model.get_category_by_id(category_id):
        return jsonify({'error': 'Category not found.'}), 404

    updated_category = category_model.update_category(category_id, name)
    
    if updated_category:
        
        full_category = category_model.get_category_by_id(category_id)
        return jsonify(full_category), 200
    else:
        return jsonify({'error': 'Failed to update category due to a database error.'}), 500

@bp.route('/<int:category_id>', methods=['DELETE'])
def delete_category_route(category_id):
    if not category_model.get_category_by_id(category_id):
        return jsonify({'error': 'Category not found.'}), 404

    if category_model.is_category_in_use(category_id):
        return jsonify({'error': 'Cannot delete category. It is in use by items or has sub-categories.'}), 409

    if category_model.delete_category(category_id):
        return jsonify({'message': 'Category deleted successfully.'}), 200
    else:
        return jsonify({'error': 'Failed to delete category due to a database error.'}), 500 