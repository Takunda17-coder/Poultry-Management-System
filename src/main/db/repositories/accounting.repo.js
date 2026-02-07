import db from "../database.js";

// Calculate total cost of broiler batches
export async function getBroilerCosts() {
    const result = await db.get(`
        SELECT COALESCE(SUM(quantity_received * cost_per_bird), 0) as total
        FROM bird_batches
    `);
    return result.total || 0;
}

// Calculate total cost of egg batches
export async function getEggCosts() {
    const result = await db.get(`
        SELECT COALESCE(SUM(crates_received * cost_per_crate), 0) as total
        FROM egg_batches
    `);
    return result.total || 0;
}

// Calculate total inventory costs
export async function getInventoryCosts() {
    const result = await db.get(`
        SELECT COALESCE(SUM(quantity * cost_per_unit), 0) as total
        FROM inventory
    `);
    return result.total || 0;
}

// Get total revenue from sales
export async function getTotalRevenue() {
    const result = await db.get(`
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM sales
    `);
    return result.total || 0;
}

// Get total revenue from egg grades (sold eggs)
export async function getEggRevenue() {
    const result = await db.get(`
        SELECT COALESCE(SUM(quantity * selling_price), 0) as total
        FROM egg_grades
    `);
    return result.total || 0;
}

// Get total revenue from broiler sales
export async function getBroilerRevenue() {
    const result = await db.get(`
        SELECT COALESCE(SUM(subtotal), 0) as total
        FROM sales_items
        WHERE item_type = 'broiler'
    `);
    return result.total || 0;
}

// Calculate profit/loss
export async function getFinancialSummary() {
    const broilerCosts = await getBroilerCosts();
    const eggCosts = await getEggCosts();
    const inventoryCosts = await getInventoryCosts();
    const eggRevenue = await getEggRevenue();
    const broilerRevenue = await getBroilerRevenue();
    
    const totalCosts = broilerCosts + eggCosts + inventoryCosts;
    const totalRevenue = eggRevenue + broilerRevenue;
    const profit = totalRevenue - totalCosts;
    
    return {
        broilerCosts,
        eggCosts,
        inventoryCosts,
        totalCosts,
        eggRevenue,
        broilerRevenue,
        totalRevenue,
        profit,
        profitMargin: totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : 0
    };
}

// Get expense breakdown by type
export async function getExpenseBreakdown() {
    return db.all(`
        SELECT 
            'Broiler Batches' as category,
            COALESCE(SUM(quantity_received * cost_per_bird), 0) as amount
        FROM bird_batches
        UNION ALL
        SELECT 
            'Egg Batches',
            COALESCE(SUM(crates_received * cost_per_crate), 0)
        FROM egg_batches
        UNION ALL
        SELECT 
            'Inventory/Supplies',
            COALESCE(SUM(quantity * cost_per_unit), 0)
        FROM inventory
    `);
}

// Get monthly revenue
export async function getMonthlyRevenue(year, month) {
    const result = await db.get(`
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM sales
        WHERE strftime('%Y-%m', sale_date) = ?
    `, [`${year}-${String(month).padStart(2, '0')}`]);
    return result.total || 0;
}

// Get revenue by payment method
export async function getRevenueByPaymentMethod() {
    return db.all(`
        SELECT payment_method, COUNT(*) as transaction_count, SUM(total_amount) as amount
        FROM sales
        GROUP BY payment_method
        ORDER BY amount DESC
    `);
}
