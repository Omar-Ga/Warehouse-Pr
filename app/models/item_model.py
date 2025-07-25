import sqlite3
from .movement_log_model import add_log_entry
from .db_utils import get_db
from .category_model import get_category_by_id

def get_items_paginated(page=1, page_size=10, search_term=None, sub_category_id=None):
    """
    Retrieves a paginated list of items using a single DB connection for the request.
    Only 'active' items are retrieved. Archived and inactive items are excluded.
    """
    db = get_db()
    cursor = db.cursor()
    
    base_query = "FROM items i JOIN units u ON i.unit_id = u.id LEFT JOIN categories c ON i.sub_category_id = c.id LEFT JOIN providers p ON i.provider_id = p.id"
    where_clauses = ["i.status = 'active'"]
    params = []

    if search_term:
        where_clauses.append("(i.name LIKE ? OR i.id LIKE ? OR i.barcode LIKE ?)")
        search_like = f"%{search_term}%"
        params.extend([search_like, search_like, search_like])
    
    if sub_category_id is not None:
        where_clauses.append("i.sub_category_id = ?")
        params.append(sub_category_id)
        
    full_where_clause = " WHERE " + " AND ".join(where_clauses)
    
    count_query = "SELECT COUNT(i.id) " + base_query + full_where_clause
    cursor.execute(count_query, params)
    total_items = cursor.fetchone()[0]

    select_clause = "SELECT i.id, i.name, i.current_quantity, i.unit_id, u.name as unit_name, i.sub_category_id, c.name as sub_category_name, i.provider_id, p.name as provider_name, i.cost, i.status, i.barcode"
    query = select_clause + " " + base_query + full_where_clause + " ORDER BY i.id DESC LIMIT ? OFFSET ?"
    params.extend([page_size, (page - 1) * page_size])
    
    cursor.execute(query, params)
    items = [dict(row) for row in cursor.fetchall()]
    
    
    return {"items": items, "total_items": total_items}

def get_item_by_id(item_id: int, db=None):
    """Retrieves a single item by ID. Can use an existing DB connection."""
    if db is None:
        db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT i.*, u.name as unit_name, c.name as sub_category_name FROM items i JOIN units u ON i.unit_id = u.id LEFT JOIN categories c ON i.sub_category_id = c.id WHERE i.id = ?", (item_id,))
    item = cursor.fetchone()
    
    return dict(item) if item else None

def get_item_by_name(name: str, db=None):
    """Retrieves an item by name. Can use an existing DB connection."""
    if db is None:
        db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM items WHERE LOWER(name) = LOWER(?)", (name,))
    item = cursor.fetchone()
    
    return dict(item) if item else None

def get_item_by_barcode(barcode: str, db=None):
    """Retrieves a single active item by its barcode. Can use an existing DB connection."""
    if db is None:
        db = get_db()
    cursor = db.cursor()
    cursor.execute(
        """
        SELECT i.*, u.name as unit_name, c.name as sub_category_name 
        FROM items i 
        JOIN units u ON i.unit_id = u.id 
        LEFT JOIN categories c ON i.sub_category_id = c.id 
        WHERE i.barcode = ? AND i.status = 'active'
        """, 
        (barcode,)
    )
    item = cursor.fetchone()
    return dict(item) if item else None

def add_item(name: str, unit_id: int, sub_category_id: int, quantity: int, provider_id: int | None, cost: float | None, person_name: str | None, barcode: str | None):
    """Adds a new item and logs the creation within a single transaction."""
    db = get_db()
    
    
    existing_item = get_item_by_name(name, db=db)
    if existing_item:
        if existing_item['status'] in ('inactive', 'archived'):
            raise ValueError(f"Item '{name}' exists but is {existing_item['status']}. Restore it instead.")
        else:
            
            sub_category_id = existing_item.get('sub_category_id')
            if sub_category_id:
                category = get_category_by_id(sub_category_id)
                if category:
                    category_name = category.get('name', 'غير محددة')
                    raise sqlite3.IntegrityError(f"الصنف '{name}' موجود بالفعل في الفئة الفرعية '{category_name}'.")
            
            
            raise sqlite3.IntegrityError(f"An active item named '{name}' already exists.")

    cursor = db.cursor()
    
    try:
        cursor.execute("INSERT INTO items (name, current_quantity, unit_id, sub_category_id, provider_id, cost, status, barcode) VALUES (?, ?, ?, ?, ?, ?, 'active', ?)",
                       (name, quantity, unit_id, sub_category_id, provider_id, cost, barcode))
        item_id = cursor.lastrowid
        
        
        add_log_entry(item_id=item_id, item_name=name, action_type='Creation', quantity_changed=quantity, 
                      resulting_quantity=quantity, details="Item created.", person_name=person_name, 
                      provider_id=provider_id, db=db)
        
        db.commit()
        return get_item_by_id(item_id, db=db)
    except sqlite3.Error as e:
        db.rollback()
        raise e

def restore_item(item_id: int, sub_category_id: int, person_name: str | None):
    """Restores an item within a single transaction."""
    db = get_db()
    item = get_item_by_id(item_id, db=db)
    if not item: return None

    cursor = db.cursor()
    try:
        cursor.execute("UPDATE items SET status = 'active', sub_category_id = ? WHERE id = ?", (sub_category_id, item_id))
        add_log_entry(item_id=item_id, item_name=item['name'], action_type='Restored',
                      details=f"Item restored to category ID {sub_category_id}.", person_name=person_name, db=db)
        db.commit()
        return get_item_by_id(item_id, db=db)
    except sqlite3.Error as e:
        db.rollback()
        raise e
    # No conn.close()

def update_item_status(item_id: int, new_status: str, person_name: str | None):
    """Updates an item's status within a single transaction."""
    db = get_db()
    if new_status not in ('active', 'inactive'):
        raise ValueError("Invalid status provided.")
    
    item = get_item_by_id(item_id, db=db)
    if not item or item['status'] == new_status: return item

    cursor = db.cursor()
    try:
        cursor.execute("UPDATE items SET status = ? WHERE id = ?", (new_status, item_id))
        add_log_entry(item_id=item_id, item_name=item['name'], action_type='Status Change',
                      details=f"Status changed from '{item['status']}' to '{new_status}'.", person_name=person_name, db=db)
        db.commit()
        return get_item_by_id(item_id, db=db)
    except sqlite3.Error as e:
        db.rollback()
        raise e
    # No conn.close()

def update_item(item_id: int, name: str, unit_id: int, sub_category_id: int | None, barcode: str | None, person_name: str | None = None, force_unit_change: bool = False):
    """Updates item details within a single transaction."""
    db = get_db()
    cursor = db.cursor()
    try:
        current_item = get_item_by_id(item_id, db=db)
        if not current_item: return None

        if barcode and barcode != current_item.get('barcode'):
            cursor.execute("SELECT id FROM items WHERE barcode = ? AND id != ?", (barcode, item_id))
            if cursor.fetchone():
                raise sqlite3.IntegrityError(f"Barcode '{barcode}' is already in use by another item.")

        if unit_id != current_item['unit_id'] and not force_unit_change:
            cursor.execute("SELECT 1 FROM movement_logs WHERE item_id = ? LIMIT 1", (item_id,))
            if cursor.fetchone():
                return {"confirmation_required": True, "message": "Changing unit might affect logs."}

        cursor.execute("UPDATE items SET name = ?, unit_id = ?, sub_category_id = ?, barcode = ? WHERE id = ?",
                       (name, unit_id, sub_category_id, barcode, item_id))
        
        log_details = "Item details updated."
        add_log_entry(item_id=item_id, item_name=name, action_type='Update', details=log_details, person_name=person_name, db=db)

        db.commit()
        return get_item_by_id(item_id, db=db)
    except sqlite3.Error as e:
        db.rollback()
        raise e
    # No conn.close()

def record_quantity_adjustment(item_id, change_amount, adjustment_type, person_name, provider_id=None, cost=None, destination_id=None):
    """Records a quantity adjustment within a single transaction."""
    db = get_db()
    cursor = db.cursor()
            
    try:
        cursor.execute("SELECT current_quantity, name FROM items WHERE id = ?", (item_id,))
        item = cursor.fetchone()
        if not item: raise ValueError("Item not found.")

        current_quantity = item['current_quantity']
        new_quantity = current_quantity + change_amount if adjustment_type == 'addition' else current_quantity - change_amount
        
        if new_quantity < 0: raise ValueError("Resulting quantity cannot be negative.")

        cursor.execute("UPDATE items SET current_quantity = ? WHERE id = ?", (new_quantity, item_id))

        add_log_entry(item_id=item_id, item_name=item['name'], action_type=adjustment_type.capitalize(),
                      quantity_changed=change_amount, resulting_quantity=new_quantity, provider_id=provider_id,
                      cost_per_item=cost, destination_id=destination_id, person_name=person_name, db=db)
        db.commit()
        return get_item_by_id(item_id, db=db)
    except sqlite3.Error as e:
        db.rollback()
        raise e
    # No conn.close()