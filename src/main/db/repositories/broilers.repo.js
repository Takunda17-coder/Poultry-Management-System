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
        COALESCE(bb.quantity_received, 0)
        - COALESCE((SELECT SUM(quantity) FROM bird_events WHERE batch_id = ?), 0)
        - COALESCE((SELECT SUM(quantity) FROM sales_items WHERE item_type = 'broiler' AND reference_id = ?), 0)
        AS available
        FROM bird_batches bb
        WHERE bb.id = ?
    `, [batchId, batchId, batchId]);
}

export async function updateBroilerBatch(batchId, data) {
    return db.run(`
        UPDATE bird_batches 
        SET supplier_id = ?, batch_code = ?, quantity_received = ?, cost_per_bird = ?, date_received = ?, notes = ?
        WHERE id = ?
    `, [data.supplier_id, data.batch_code, data.quantity_received, data.cost_per_bird, data.date_received, data.notes, batchId]);
}

export async function listBatchesWithAvailability() {
    return db.all(`
        SELECT 
            bb.id,
            bb.batch_code,
            bb.supplier_id,
            s.name as supplier_name,
            bb.quantity_received,
            bb.cost_per_bird,
            bb.date_received,
            COALESCE(bb.quantity_received, 0)
            - COALESCE((SELECT SUM(quantity) FROM bird_events WHERE batch_id = bb.id), 0)
            - COALESCE((SELECT SUM(quantity) FROM sales_items WHERE item_type = 'broiler' AND reference_id = bb.id), 0)
            AS available_birds,
            COALESCE((SELECT SUM(quantity) FROM bird_events WHERE batch_id = bb.id AND event_type = 'mortality'), 0) as mortality_count,
            COALESCE((SELECT SUM(quantity) FROM bird_events WHERE batch_id = bb.id AND event_type = 'home_use'), 0) as home_use_count,
            COALESCE((SELECT SUM(quantity) FROM sales_items WHERE item_type = 'broiler' AND reference_id = bb.id), 0) as sold_count
        FROM bird_batches bb
        LEFT JOIN suppliers s ON bb.supplier_id = s.id
        ORDER BY bb.date_received DESC
    `);
}

export async function listBatches() {
    return db.all(`
        SELECT bb.*, s.name as supplier_name 
        FROM bird_batches bb
        LEFT JOIN suppliers s ON bb.supplier_id = s.id
        ORDER BY bb.date_received DESC
    `);
}

export async function deleteBroilerBatch(batchId) {
    return db.run(`
        DELETE FROM bird_batches WHERE id = ?
    `, [batchId]);
}

export async function getBatchCount() {
    const result = await db.get(`
        SELECT COUNT(*) as count FROM bird_batches
    `);
    return result.count;
}
       