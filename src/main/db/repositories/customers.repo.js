import db from "../database.js";

export async function addCustomer(data) {
    const result = await db.run(`
        INSERT INTO customers (name, phone, email, address)
        VALUES (?, ?, ?, ?)
    `, [
        data.name,
        data.phone || null,
        data.email || null,
        data.address || null
    ]);
    return result.lastID;
}

export async function updateCustomer(id, data) {
    return db.run(`
        UPDATE customers 
        SET name = ?, phone = ?, email = ?, address = ?
        WHERE id = ?
    `, [
        data.name,
        data.phone || null,
        data.email || null,
        data.address || null,
        id
    ]);
}

export async function deleteCustomer(id) {
    // Note: Deleting a customer doesn't delete their sales automatically here unless foreign key cascade is set
    // But since order history is important, maybe we just nullify the customer_id or throw an error if sales exist.
    // For now, we'll just execute standard delete.
    return db.run(`DELETE FROM customers WHERE id = ?`, [id]);
}

export async function getAllCustomers() {
    return db.all(`
        SELECT 
            c.*,
            COALESCE((SELECT SUM(debt_amount) FROM sales WHERE customer_id = c.id), 0) as total_debt,
            COALESCE((SELECT SUM(change_amount) FROM sales WHERE customer_id = c.id), 0) as total_change
        FROM customers c
        ORDER BY c.name ASC
    `);
}

export async function getCustomerDetails(id) {
    const customer = await db.get(`
        SELECT 
            c.*,
            COALESCE((SELECT SUM(debt_amount) FROM sales WHERE customer_id = c.id), 0) as total_debt,
            COALESCE((SELECT SUM(change_amount) FROM sales WHERE customer_id = c.id), 0) as total_change
        FROM customers c
        WHERE c.id = ?
    `, [id]);

    if (!customer) return null;

    // Fetch related sales
    const sales = await db.all(`
        SELECT * FROM sales WHERE customer_id = ? ORDER BY sale_date DESC
    `, [id]);

    // Fetch related sales items for detail view
    const salesItems = await db.all(`
        SELECT si.* 
        FROM sales_items si
        JOIN sales s ON s.id = si.sale_id
        WHERE s.customer_id = ?
    `, [id]);

    // Attach items to sales
    const itemsBySaleId = {};
    for (const item of salesItems) {
        if (!itemsBySaleId[item.sale_id]) {
            itemsBySaleId[item.sale_id] = [];
        }
        itemsBySaleId[item.sale_id].push(item);
    }

    const mappedSales = sales.map(s => ({
        ...s,
        items: itemsBySaleId[s.id] || []
    }));

    // Fetch payment history
    const paymentHistory = await db.all(`
        SELECT ph.* 
        FROM payment_history ph
        JOIN sales s ON ph.sale_id = s.id
        WHERE s.customer_id = ?
        ORDER BY ph.payment_date DESC
    `, [id]);

    // Fetch return history
    const returnHistory = await db.all(`
        SELECT rh.* 
        FROM return_history rh
        JOIN sales s ON rh.sale_id = s.id
        WHERE s.customer_id = ?
        ORDER BY rh.return_date DESC
    `, [id]);

    return {
        ...customer,
        sales: mappedSales,
        paymentHistory,
        returnHistory
    };
}

export async function getCustomerByName(name) {
    return db.get(`SELECT * FROM customers WHERE name = ? COLLATE NOCASE`, [name]);
}
