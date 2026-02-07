import db from "../database.js";

export function addBroilerBatch(data) {
    return db.run(`
        INSERT INTO bird_batches
        (supplier_id,batch_code,quantity_received,cost_per_bird,date_received,notes)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [
        data.supplier_id,
        data.batch_code,
        data.quantity_received,
        data.cost_per_bird,
        data.date_received,
        data.notes
    ]);
}

export function recordBirdEvent(event) {
    return db.run(`
        INSERT INTO bird_events
        (batch_id,event_type,event_date,quantity,notes)
        VALUES (?, ?, ?, ?, ?)
    `, [
        event.batch_id,
        event.event_type,
        event.event_date,
        event.quantity,
        event.notes
    ]);
}

export async function getAvailableBirds(batchId) {
    return db.get(`
        SELECT
        quantity_received
        - COALESCE((SELECT SUM(quantity) FROM bird_events WHERE batch_id = ?), 0)
        AS available
        FROM bird_batches
        WHERE id = ?
    `, [batchId, batchId]);
}

export async function listBatches() {
    return db.all(`
        SELECT bb.*, s.name as supplier_name 
        FROM bird_batches bb
        LEFT JOIN suppliers s ON bb.supplier_id = s.id
        ORDER BY bb.date_received DESC
    `);
}

export async function getBatchCount() {
    const result = await db.get(`
        SELECT COUNT(*) as count FROM bird_batches
    `);
    return result.count;
}
       