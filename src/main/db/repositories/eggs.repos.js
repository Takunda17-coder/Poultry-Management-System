import db from "../database.js";

export function addEggBatch(batch){
    return db.run(`
        INSERT INTO egg_batches
        (supplier_id,crates_received,cost_per_crate,date_received)
        VALUES (?, ?, ?, ?)
    `, [
        batch.supplier_id,
        batch.crates_received,
        batch.cost_per_crate,
        batch.date_received,
    ]);
}

export function updateEggBatch(batchId, batch) {
    return db.run(`
        UPDATE egg_batches
        SET supplier_id = ?, crates_received = ?, cost_per_crate = ?, date_received = ?
        WHERE id = ?
    `, [batch.supplier_id, batch.crates_received, batch.cost_per_crate, batch.date_received, batchId]);
}

export function listBatches() {
    return db.all(`
        SELECT eb.*, s.name as supplier_name
        FROM egg_batches eb
        LEFT JOIN suppliers s ON eb.supplier_id = s.id
        ORDER BY eb.date_received DESC
    `);
}

export function gradeEggs(grade){
    return db.run(`
        INSERT INTO egg_grades
        (egg_batch_id,size,quantity,selling_price)
        VALUES (?, ?, ?, ?)
    `, [
        grade.egg_batch_id,
        grade.size,
        grade.quantity,
        grade.selling_price
    ]);
}

export async function getEggBatchCount() {
    const result = await db.get(`
        SELECT COUNT(*) as count FROM egg_batches
    `);
    return result.count;
}

export function deleteEggBatch(batchId) {
    return db.run(`
        DELETE FROM egg_batches WHERE id = ?
    `, [batchId]);
}

export async function getTotalRevenue() {
    const result = await db.get(`
        SELECT COALESCE(SUM(quantity * selling_price), 0) as total FROM egg_grades
    `);
    return result.total || 0;
}