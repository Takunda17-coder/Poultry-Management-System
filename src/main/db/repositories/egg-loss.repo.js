import db from "../database.js";

export async function recordEggLoss(data) {
  const { egg_batch_id, quantity_lost, loss_date, reason, notes } = data;
  return db.run(
    `INSERT INTO egg_loss (egg_batch_id, quantity_lost, loss_date, reason, notes, created_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [egg_batch_id, quantity_lost, loss_date, reason, notes || null]
  );
}

export async function getAllEggLosses() {
  return db.all(
    `SELECT el.*, eb.supplier_id, s.name as supplier_name 
     FROM egg_loss el
     LEFT JOIN egg_batches eb ON el.egg_batch_id = eb.id
     LEFT JOIN suppliers s ON eb.supplier_id = s.id
     ORDER BY el.loss_date DESC`
  );
}

export async function getEggLossesByBatch(batchId) {
  return db.all(
    `SELECT el.*, s.name as supplier_name 
     FROM egg_loss el
     LEFT JOIN egg_batches eb ON el.egg_batch_id = eb.id
     LEFT JOIN suppliers s ON eb.supplier_id = s.id
     WHERE el.egg_batch_id = ?
     ORDER BY el.loss_date DESC`,
    [batchId]
  );
}

export async function getTotalEggLoss() {
  const result = db.get(
    `SELECT COALESCE(SUM(quantity_lost), 0) as total_loss FROM egg_loss`
  );
  return result.total_loss;
}

export async function getEggLossStats() {
  return db.all(
    `SELECT reason, COUNT(*) as count, SUM(quantity_lost) as total_quantity
     FROM egg_loss
     GROUP BY reason
     ORDER BY total_quantity DESC`
  );
}

export async function getEggLossByReason(reason) {
  return db.all(
    `SELECT el.*, s.name as supplier_name 
     FROM egg_loss el
     LEFT JOIN egg_batches eb ON el.egg_batch_id = eb.id
     LEFT JOIN suppliers s ON eb.supplier_id = s.id
     WHERE el.reason = ?
     ORDER BY el.loss_date DESC`,
    [reason]
  );
}

export async function getBatchLossStats(batchId) {
  return db.get(
    `SELECT 
       COALESCE(SUM(el.quantity_lost), 0) as total_loss,
       COUNT(DISTINCT el.id) as loss_records,
       eb.crates_received,
       (COALESCE(SUM(el.quantity_lost), 0) / eb.crates_received * 100) as loss_percentage
     FROM egg_loss el
     RIGHT JOIN egg_batches eb ON el.egg_batch_id = eb.id
     WHERE eb.id = ?`,
    [batchId]
  );
}

export async function deleteEggLoss(id) {
  return db.run(`DELETE FROM egg_loss WHERE id = ?`, [id]);
}
