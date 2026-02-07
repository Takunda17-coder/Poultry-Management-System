import db from "../database.js";

export async function recordBirdEvent(data) {
    return db.run(`
        INSERT INTO bird_events (batch_id, event_type, quantity, event_date, notes)
        VALUES (?, ?, ?, ?, ?)
    `, [
        data.batch_id,
        data.event_type,
        data.quantity,
        data.event_date,
        data.notes
    ]);
}

export async function getAllBirdEvents() {
    return db.all(`
        SELECT be.*, bb.batch_code
        FROM bird_events be
        LEFT JOIN bird_batches bb ON be.batch_id = bb.id
        ORDER BY be.event_date DESC
    `);
}

export async function getEventsByBatch(batchId) {
    return db.all(`
        SELECT * FROM bird_events
        WHERE batch_id = ?
        ORDER BY event_date DESC
    `, [batchId]);
}

export async function getEventsByType(eventType) {
    return db.all(`
        SELECT be.*, bb.batch_code
        FROM bird_events be
        LEFT JOIN bird_batches bb ON be.batch_id = bb.id
        WHERE be.event_type = ?
        ORDER BY be.event_date DESC
    `, [eventType]);
}

export async function getTotalMortality(batchId = null) {
    let query = `SELECT COALESCE(SUM(quantity), 0) as total FROM bird_events WHERE event_type = 'mortality'`;
    let params = [];
    
    if (batchId) {
        query += ` AND batch_id = ?`;
        params = [batchId];
    }
    
    const result = await db.get(query, params);
    return result.total || 0;
}

export async function getTotalHomeUse(batchId = null) {
    let query = `SELECT COALESCE(SUM(quantity), 0) as total FROM bird_events WHERE event_type = 'home_use'`;
    let params = [];
    
    if (batchId) {
        query += ` AND batch_id = ?`;
        params = [batchId];
    }
    
    const result = await db.get(query, params);
    return result.total || 0;
}

export async function getAvailableBirdsInBatch(batchId) {
    const result = await db.get(`
        SELECT 
            bb.quantity_received,
            COALESCE(SUM(be.quantity), 0) as events_total
        FROM bird_batches bb
        LEFT JOIN bird_events be ON bb.id = be.batch_id
        WHERE bb.id = ?
        GROUP BY bb.id
    `, [batchId]);
    
    if (!result) return 0;
    return result.quantity_received - result.events_total;
}

export async function deleteEvent(eventId) {
    return db.run(`
        DELETE FROM bird_events
        WHERE id = ?
    `, [eventId]);
}

export async function getBatchHealthSummary(batchId) {
    const [mortality, homeUse, available] = await Promise.all([
        getTotalMortality(batchId),
        getTotalHomeUse(batchId),
        getAvailableBirdsInBatch(batchId)
    ]);
    
    const batch = await db.get(`SELECT quantity_received FROM bird_batches WHERE id = ?`, [batchId]);
    const total = batch?.quantity_received || 0;
    const accounted = mortality + homeUse + available;
    
    return {
        total,
        mortality,
        homeUse,
        available,
        accounted,
        mortalityRate: total > 0 ? ((mortality / total) * 100).toFixed(2) : 0
    };
}
