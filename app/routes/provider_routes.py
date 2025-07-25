from flask import Blueprint, request, jsonify
from app.models import provider_model

bp = Blueprint('providers', __name__, url_prefix='/api/providers')

@bp.route('', methods=['GET'])
def get_providers():
    """Returns a list of all providers."""
    try:
        providers = provider_model.get_all_providers()
        return jsonify(providers), 200
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve providers: {e}'}), 500

@bp.route('', methods=['POST'])
def add_provider():
    """Adds a new provider."""
    data = request.get_json()
    if not data or 'name' not in data or not data['name'].strip():
        return jsonify({'error': 'Provider name is required.'}), 400
    
    try:
        name = data['name'].strip()
        new_provider = provider_model.add_provider(name)
        return jsonify(new_provider), 201
    except ValueError as e:
        return jsonify({'error': str(e)}), 409 # Conflict
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {e}'}), 500

@bp.route('/<int:provider_id>', methods=['PUT'])
def update_provider(provider_id):
    """Updates an existing provider's name."""
    data = request.get_json()
    if not data or 'name' not in data or not data['name'].strip():
        return jsonify({'error': 'Provider name is required.'}), 400
        
    try:
        name = data['name'].strip()
        updated_provider = provider_model.update_provider(provider_id, name)
        if updated_provider is None:
            return jsonify({'error': 'Provider not found.'}), 404
        return jsonify(updated_provider), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 409 # Conflict
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {e}'}), 500

@bp.route('/<int:provider_id>', methods=['DELETE'])
def delete_provider(provider_id):
    """Deletes a provider."""
    try:
        if provider_model.delete_provider(provider_id):
            return jsonify({'message': 'Provider deleted successfully.'}), 200
        else:
            return jsonify({'error': 'Provider not found.'}), 404
    except ValueError as e:
        return jsonify({'error': str(e)}), 400 # Bad request because it's in use
    except Exception as e:
        return jsonify({'error': f'An unexpected error occurred: {e}'}), 500 