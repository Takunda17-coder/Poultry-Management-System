import db from "../database.js";

export function addSupplier(data) {
    return db.run(`   
        INSERT INTO suppliers(name,product,phone,email,address)
        VALUES (?, ?, ?, ?, ?)
    `, [data.name, data.product, data.phone, data.email, data.address]);
}
export function updateSupplier(supplierId, data) {
    return db.run(`
        UPDATE suppliers
        SET name = ?, product = ?, phone = ?, email = ?, address = ?
        WHERE id = ?
    `, [data.name, data.product, data.phone, data.email, data.address, supplierId]);
}

export function deleteSupplier(supplierId) {
    return db.run(`
        DELETE FROM suppliers WHERE id = ?
    `, [supplierId]);
}

export async function getAllSuppliers() {
    return db.all(`SELECT * FROM suppliers ORDER BY name DESC`);
}

export async function getSupplierCount() {
    const result = await db.get(`
        SELECT COUNT(*) as count FROM suppliers
    `);
    return result.count;
}