import db from "../database.js";

export async function addSale(saleData) {
    const result = await db.run(`
        INSERT INTO sales (customer_name, customer_phone, sale_date, total_amount, payment_method, amount_paid, change_amount, debt_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        saleData.customer_name || null,
        saleData.customer_phone || null,
        saleData.sale_date,
        saleData.total_amount,
        saleData.payment_method,
        saleData.amount_paid || saleData.total_amount,
        saleData.change_amount || 0,
        saleData.debt_amount || 0
    ]);
    return result.lastID;
}

export async function addSaleItem(itemData) {
    return db.run(`
        INSERT INTO sales_items (sale_id, item_type, reference_id, quantity, unit_price, subtotal)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [
        itemData.sale_id,
        itemData.item_type,
        itemData.reference_id,
        itemData.quantity,
        itemData.unit_price,
        itemData.subtotal
    ]);
}

export async function getAllSales() {
    const sales = await db.all(`SELECT * FROM sales ORDER BY sale_date DESC`);
    const items = await db.all(`SELECT * FROM sales_items`);

    // Group items by sale_id for efficient mapping
    const itemsBySaleId = {};
    for (const item of items) {
        if (!itemsBySaleId[item.sale_id]) {
            itemsBySaleId[item.sale_id] = [];
        }
        itemsBySaleId[item.sale_id].push(item);
    }

    // Attach items to each sale
    return sales.map(sale => ({
        ...sale,
        items: itemsBySaleId[sale.id] || []
    }));
}

export async function getSaleDetails(saleId) {
    return db.all(`
        SELECT si.*, s.sale_date, s.payment_method, s.total_amount
        FROM sales_items si
        JOIN sales s ON si.sale_id = s.id
        WHERE si.sale_id = ?
        ORDER BY si.id
    `, [saleId]);
}

export async function getTotalSales(startDate = null, endDate = null) {
    let query = `SELECT COALESCE(SUM(total_amount), 0) as total FROM sales`;
    let params = [];

    if (startDate && endDate) {
        query += ` WHERE sale_date BETWEEN ? AND ?`;
        params = [startDate, endDate];
    }

    const result = await db.get(query, params);
    return result.total || 0;
}

export async function getSalesByPaymentMethod() {
    return db.all(`
        SELECT payment_method, COUNT(*) as count, SUM(total_amount) as total
        FROM sales
        GROUP BY payment_method
    `);
}

export async function getEggSalesRevenue() {
    return db.get(`
        SELECT COALESCE(SUM(eg.quantity * eg.selling_price), 0) as total
        FROM egg_grades eg
    `);
}

export async function getOutstandingDebts() {
    return db.all(`
        SELECT id, customer_name, customer_phone, sale_date, total_amount, debt_amount, payment_method
        FROM sales
        WHERE debt_amount > 0
        ORDER BY sale_date DESC
    `);
}

export async function getTotalOutstandingDebt() {
    const result = await db.get(`
        SELECT COALESCE(SUM(debt_amount), 0) as total
        FROM sales
        WHERE debt_amount > 0
    `);
    return result.total || 0;
}

export async function getOutstandingChange() {
    return db.all(`
        SELECT id, customer_name, customer_phone, sale_date, total_amount, change_amount, payment_method
        FROM sales
        WHERE change_amount > 0
        ORDER BY sale_date DESC
    `);
}

export async function getTotalOutstandingChange() {
    const result = await db.get(`
        SELECT COALESCE(SUM(change_amount), 0) as total
        FROM sales
        WHERE change_amount > 0
    `);
    return result.total || 0;
}

export async function payDebt(saleId, amountPaid) {
    const sale = await db.get(`SELECT debt_amount FROM sales WHERE id = ?`, [saleId]);
    const remainingDebt = Math.max(0, sale.debt_amount - amountPaid);

    return db.run(`
        UPDATE sales SET debt_amount = ? WHERE id = ?
    `, [remainingDebt, saleId]);
}

export async function returnChange(saleId) {
    return db.run(`
        UPDATE sales SET change_amount = 0 WHERE id = ?
    `, [saleId]);
}

export async function getBroilerSalesRevenue() {
    return db.get(`
        SELECT COALESCE(SUM(si.subtotal), 0) as total
        FROM sales_items si
        WHERE si.item_type = 'broiler'
    `);
}

export async function updateSale(saleId, saleData) {
    return db.run(`
        UPDATE sales SET
            customer_name = ?,
            customer_phone = ?,
            sale_date = ?,
            total_amount = ?,
            payment_method = ?,
            amount_paid = ?,
            change_amount = ?,
            debt_amount = ?,
            status = ?
        WHERE id = ?
    `, [
        saleData.customer_name || null,
        saleData.customer_phone || null,
        saleData.sale_date,
        saleData.total_amount,
        saleData.payment_method,
        saleData.amount_paid || saleData.total_amount,
        saleData.change_amount || 0,
        saleData.debt_amount || 0,
        saleData.status || 'completed',
        saleId
    ]);
}

export async function deleteSale(saleId) {
    // First delete all sale items for this sale
    await db.run(`DELETE FROM sales_items WHERE sale_id = ?`, [saleId]);
    // Then delete the sale
    return db.run(`DELETE FROM sales WHERE id = ?`, [saleId]);
}

export async function getSaleById(saleId) {
    return db.get(`SELECT * FROM sales WHERE id = ?`, [saleId]);
}

// ==================== ADVANCED DEBT MANAGEMENT ====================

export async function recordDebtPayment(saleId, amountPaid, paymentMethod = 'cash', notes = '') {
    if (amountPaid <= 0) {
        throw new Error('Payment amount must be greater than 0');
    }

    const sale = await db.get(`SELECT debt_amount FROM sales WHERE id = ?`, [saleId]);
    if (!sale) {
        throw new Error('Sale not found');
    }

    if (amountPaid > sale.debt_amount) {
        throw new Error('Payment cannot exceed outstanding debt amount');
    }

    // Record payment in history
    await db.run(`
        INSERT INTO payment_history (sale_id, amount_paid, payment_date, payment_method, notes)
        VALUES (?, ?, ?, ?, ?)
    `, [saleId, amountPaid, new Date().toISOString().split('T')[0], paymentMethod, notes]);

    // Update debt amount
    const remainingDebt = sale.debt_amount - amountPaid;
    const newStatus = remainingDebt === 0 ? 'paid' : 'partial';

    return db.run(`
        UPDATE sales SET debt_amount = ?, status = ? WHERE id = ?
    `, [remainingDebt, newStatus, saleId]);
}

export async function getDebtPaymentHistory(saleId) {
    return db.all(`
        SELECT * FROM payment_history WHERE sale_id = ? ORDER BY payment_date DESC
    `, [saleId]);
}

export async function deleteDebtPayment(paymentId) {
    // Get payment details
    const payment = await db.get(`SELECT sale_id, amount_paid FROM payment_history WHERE id = ?`, [paymentId]);
    if (!payment) {
        throw new Error('Payment record not found');
    }

    // Restore debt amount
    const sale = await db.get(`SELECT debt_amount, total_amount FROM sales WHERE id = ?`, [payment.sale_id]);
    const restoredDebt = sale.debt_amount + payment.amount_paid;

    // Check if restored debt exceeds total
    if (restoredDebt > sale.total_amount) {
        throw new Error('Cannot restore payment: would exceed original debt amount');
    }

    // Delete payment record and update sale
    await db.run(`DELETE FROM payment_history WHERE id = ?`, [paymentId]);
    return db.run(`
        UPDATE sales SET debt_amount = ?, status = ? WHERE id = ?
    `, [restoredDebt, restoredDebt > 0 ? 'partial' : 'completed', payment.sale_id]);
}

export async function editDebtPayment(paymentId, newAmount, paymentMethod, notes) {
    if (newAmount <= 0) {
        throw new Error('Payment amount must be greater than 0');
    }

    const payment = await db.get(`SELECT sale_id, amount_paid FROM payment_history WHERE id = ?`, [paymentId]);
    if (!payment) {
        throw new Error('Payment record not found');
    }

    const sale = await db.get(`SELECT debt_amount, total_amount FROM sales WHERE id = ?`, [payment.sale_id]);

    // Calculate new debt based on difference
    const amountDifference = newAmount - payment.amount_paid;
    const newDebt = sale.debt_amount - amountDifference;

    if (newDebt < 0) {
        throw new Error('New amount would result in negative debt');
    }

    const newStatus = newDebt === 0 ? 'paid' : 'partial';

    // Update payment record
    await db.run(`
        UPDATE payment_history SET amount_paid = ?, payment_method = ?, notes = ? WHERE id = ?
    `, [newAmount, paymentMethod, notes, paymentId]);

    // Update sale debt
    return db.run(`
        UPDATE sales SET debt_amount = ?, status = ? WHERE id = ?
    `, [newDebt, newStatus, payment.sale_id]);
}

// ==================== ADVANCED CHANGE MANAGEMENT ====================

export async function recordChangeReturn(saleId, changeAmount, returnedBy = '', notes = '') {
    if (changeAmount <= 0) {
        throw new Error('Change amount must be greater than 0');
    }

    const sale = await db.get(`SELECT change_amount FROM sales WHERE id = ?`, [saleId]);
    if (!sale) {
        throw new Error('Sale not found');
    }

    if (changeAmount > sale.change_amount) {
        throw new Error('Return amount cannot exceed outstanding change');
    }

    // Record return in history
    await db.run(`
        INSERT INTO return_history (sale_id, change_amount, return_date, returned_by, notes)
        VALUES (?, ?, ?, ?, ?)
    `, [saleId, changeAmount, new Date().toISOString().split('T')[0], returnedBy, notes]);

    // Update change amount
    const remainingChange = sale.change_amount - changeAmount;

    return db.run(`
        UPDATE sales SET change_amount = ? WHERE id = ?
    `, [remainingChange, saleId]);
}

export async function getChangeReturnHistory(saleId) {
    return db.all(`
        SELECT * FROM return_history WHERE sale_id = ? ORDER BY return_date DESC
    `, [saleId]);
}

export async function deleteChangeReturn(returnId) {
    // Get return details
    const returnRecord = await db.get(`SELECT sale_id, change_amount FROM return_history WHERE id = ?`, [returnId]);
    if (!returnRecord) {
        throw new Error('Return record not found');
    }

    // Restore change amount
    const sale = await db.get(`SELECT change_amount FROM sales WHERE id = ?`, [returnRecord.sale_id]);
    const restoredChange = sale.change_amount + returnRecord.change_amount;

    // Delete return record and update sale
    await db.run(`DELETE FROM return_history WHERE id = ?`, [returnId]);
    return db.run(`
        UPDATE sales SET change_amount = ? WHERE id = ?
    `, [restoredChange, returnRecord.sale_id]);
}

export async function editChangeReturn(returnId, newAmount, returnedBy, notes) {
    if (newAmount <= 0) {
        throw new Error('Change amount must be greater than 0');
    }

    const returnRecord = await db.get(`SELECT sale_id, change_amount FROM return_history WHERE id = ?`, [returnId]);
    if (!returnRecord) {
        throw new Error('Return record not found');
    }

    const sale = await db.get(`SELECT change_amount FROM sales WHERE id = ?`, [returnRecord.sale_id]);

    // Calculate new change based on difference
    const amountDifference = newAmount - returnRecord.change_amount;
    const newChange = sale.change_amount - amountDifference;

    if (newChange < 0) {
        throw new Error('New amount would result in negative change');
    }

    // Update return record
    await db.run(`
        UPDATE return_history SET change_amount = ?, returned_by = ?, notes = ? WHERE id = ?
    `, [newAmount, returnedBy, notes, returnId]);

    // Update sale change amount
    return db.run(`
        UPDATE sales SET change_amount = ? WHERE id = ?
    `, [newChange, returnRecord.sale_id]);
}

// ==================== DELETE SALE ITEM ====================

export async function deleteSaleItem(itemId) {
    return db.run(`
        DELETE FROM sales_items WHERE id = ?
    `, [itemId]);
}

// ==================== DATA MIGRATION - ASSIGN BROILERS TO BATCHES ====================

export async function getUnassignedBroilerSales() {
    return db.all(`
        SELECT 
            si.id,
            si.sale_id,
            si.quantity,
            si.unit_price,
            s.sale_date,
            s.customer_name,
            s.customer_phone
        FROM sales_items si
        JOIN sales s ON si.sale_id = s.id
        WHERE si.item_type = 'broiler' AND (si.reference_id = 0 OR si.reference_id IS NULL OR NOT EXISTS (SELECT 1 FROM bird_batches WHERE id = si.reference_id))
        ORDER BY s.sale_date DESC
    `);
}

export async function getUnassignedEggSales() {
    return db.all(`
        SELECT 
            si.id,
            si.sale_id,
            si.quantity,
            si.unit_price,
            s.sale_date,
            s.customer_name,
            s.customer_phone
        FROM sales_items si
        JOIN sales s ON si.sale_id = s.id
        WHERE si.item_type = 'egg' AND (si.reference_id = 0 OR si.reference_id IS NULL OR NOT EXISTS (SELECT 1 FROM egg_batches WHERE id = si.reference_id))
        ORDER BY s.sale_date DESC
    `);
}

export async function assignBroilerToBatch(saleItemId, batchId) {
    return db.run(`
        UPDATE sales_items SET reference_id = ? WHERE id = ?
    `, [batchId, saleItemId]);
}

export async function assignEggToBatch(saleItemId, batchId) {
    return db.run(`
        UPDATE sales_items SET reference_id = ? WHERE id = ?
    `, [batchId, saleItemId]);
}