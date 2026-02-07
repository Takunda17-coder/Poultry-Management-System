import db from "../database.js";

export async function addInventoryItem(data) {
    return db.run(`
        INSERT INTO inventory (supplier_id, item_name, quantity, unit, cost_per_unit, date_added)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [
        data.supplier_id,
        data.item_name,
        data.quantity,
        data.unit,
        data.cost_per_unit,
        data.date_added
    ]);
}

export async function getAllInventory() {
    return db.all(`
        SELECT i.*, s.name as supplier_name
        FROM inventory i
        LEFT JOIN suppliers s ON i.supplier_id = s.id
        ORDER BY i.date_added DESC
    `);
}

export async function getInventoryByItem(itemName) {
    return db.all(`
        SELECT * FROM inventory
        WHERE item_name LIKE ?
        ORDER BY date_added DESC
    `, [`%${itemName}%`]);
}

export async function updateInventoryQuantity(inventoryId, quantity) {
    return db.run(`
        UPDATE inventory
        SET quantity = ?
        WHERE id = ?
    `, [quantity, inventoryId]);
}

export async function deleteInventoryItem(inventoryId) {
    return db.run(`
        DELETE FROM inventory
        WHERE id = ?
    `, [inventoryId]);
}

export async function getTotalInventoryValue() {
    const result = await db.get(`
        SELECT COALESCE(SUM(quantity * cost_per_unit), 0) as total
        FROM inventory
    `);
    return result.total || 0;
}

export async function getInventoryStats() {
    return db.all(`
        SELECT item_name, SUM(quantity) as total_quantity, cost_per_unit, supplier_id
        FROM inventory
        GROUP BY item_name, cost_per_unit, supplier_id
        ORDER BY item_name
    `);
}
