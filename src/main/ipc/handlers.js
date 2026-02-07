import {ipcMain} from 'electron';
import * as suppliers from "../db/repositories/suppliers.repo.js";
import * as broilers from "../db/repositories/broilers.repo.js";
import * as eggs from "../db/repositories/eggs.repos.js";
import * as sales from "../db/repositories/sales.repo.js";
import * as accounting from "../db/repositories/accounting.repo.js";
import * as inventory from "../db/repositories/inventory.repo.js";
import * as birdEvents from "../db/repositories/bird-events.repo.js";
import * as eggLoss from "../db/repositories/egg-loss.repo.js";

export function registerIpcHandlers() {

    ipcMain.handle('supplier:add', (_, data) =>
    suppliers.addSupplier(data)
    );

    ipcMain.handle('supplier:list', () =>
    suppliers.getAllSuppliers()
    );
    
    ipcMain.handle('broiler:addBatch', (_, data) =>
        broilers.addBroilerBatch(data)
    );

    ipcMain.handle('broiler:addEvent',(_,data) =>
        broilers.recordBirdEvent(data)
    );

    ipcMain.handle('broiler:listBatches', () =>
        broilers.listBatches()
    );

    ipcMain.handle('egg:addBatch', (_, data) =>
        eggs.addEggBatch(data)
    );

    ipcMain.handle('egg:listBatches', () =>
        eggs.listBatches()
    );

    ipcMain.handle('egg:grade', (_, data) =>
        eggs.gradeEggs(data)
    );

    ipcMain.handle('stats:getBroilerCount', () =>
        broilers.getBatchCount()
    );

    ipcMain.handle('stats:getEggCount', () =>
        eggs.getEggBatchCount()
    );

    ipcMain.handle('stats:getSupplierCount', () =>
        suppliers.getSupplierCount()
    );

    ipcMain.handle('stats:getRevenue', () =>
        eggs.getTotalRevenue()
    );

    // Sales handlers
    ipcMain.handle('sales:add', (_, data) =>
        sales.addSale(data)
    );

    ipcMain.handle('sales:addItem', (_, data) =>
        sales.addSaleItem(data)
    );

    ipcMain.handle('sales:getAll', () =>
        sales.getAllSales()
    );

    ipcMain.handle('sales:getDetails', (_, saleId) =>
        sales.getSaleDetails(saleId)
    );

    ipcMain.handle('sales:getTotalSales', (_, startDate, endDate) =>
        sales.getTotalSales(startDate, endDate)
    );

    ipcMain.handle('sales:getByPaymentMethod', () =>
        sales.getSalesByPaymentMethod()
    );

    ipcMain.handle('sales:update', (_, saleId, data) =>
        sales.updateSale(saleId, data)
    );

    ipcMain.handle('sales:delete', (_, saleId) =>
        sales.deleteSale(saleId)
    );

    ipcMain.handle('sales:getById', (_, saleId) =>
        sales.getSaleById(saleId)
    );

    // Accounting handlers
    ipcMain.handle('accounting:getFinancialSummary', () =>
        accounting.getFinancialSummary()
    );

    ipcMain.handle('accounting:getExpenseBreakdown', () =>
        accounting.getExpenseBreakdown()
    );

    ipcMain.handle('accounting:getMonthlyRevenue', (_, year, month) =>
        accounting.getMonthlyRevenue(year, month)
    );

    ipcMain.handle('accounting:getRevenueByPaymentMethod', () =>
        accounting.getRevenueByPaymentMethod()
    );

    // Inventory handlers
    ipcMain.handle('inventory:add', (_, data) =>
        inventory.addInventoryItem(data)
    );

    ipcMain.handle('inventory:getAll', () =>
        inventory.getAllInventory()
    );

    ipcMain.handle('inventory:getStats', () =>
        inventory.getInventoryStats()
    );

    ipcMain.handle('inventory:getTotalValue', () =>
        inventory.getTotalInventoryValue()
    );

    ipcMain.handle('inventory:update', (_, id, quantity) =>
        inventory.updateInventoryQuantity(id, quantity)
    );

    ipcMain.handle('inventory:delete', (_, id) =>
        inventory.deleteInventoryItem(id)
    );

    // Bird Events handlers
    ipcMain.handle('birdEvents:record', (_, data) =>
        birdEvents.recordBirdEvent(data)
    );

    ipcMain.handle('birdEvents:getAll', () =>
        birdEvents.getAllBirdEvents()
    );

    ipcMain.handle('birdEvents:getByBatch', (_, batchId) =>
        birdEvents.getEventsByBatch(batchId)
    );

    ipcMain.handle('birdEvents:getByType', (_, eventType) =>
        birdEvents.getEventsByType(eventType)
    );

    ipcMain.handle('birdEvents:getTotalMortality', (_, batchId) =>
        birdEvents.getTotalMortality(batchId)
    );

    ipcMain.handle('birdEvents:getTotalHomeUse', (_, batchId) =>
        birdEvents.getTotalHomeUse(batchId)
    );

    ipcMain.handle('birdEvents:getAvailable', (_, batchId) =>
        birdEvents.getAvailableBirdsInBatch(batchId)
    );

    ipcMain.handle('birdEvents:getHealthSummary', (_, batchId) =>
        birdEvents.getBatchHealthSummary(batchId)
    );

    ipcMain.handle('birdEvents:delete', (_, eventId) =>
        birdEvents.deleteEvent(eventId)
    );

    // Egg Loss handlers
    ipcMain.handle('eggLoss:record', (_, data) =>
        eggLoss.recordEggLoss(data)
    );

    ipcMain.handle('eggLoss:getAll', () =>
        eggLoss.getAllEggLosses()
    );

    ipcMain.handle('eggLoss:getByBatch', (_, batchId) =>
        eggLoss.getEggLossesByBatch(batchId)
    );

    ipcMain.handle('eggLoss:getTotalLoss', () =>
        eggLoss.getTotalEggLoss()
    );

    ipcMain.handle('eggLoss:getStats', () =>
        eggLoss.getEggLossStats()
    );

    ipcMain.handle('eggLoss:getByReason', (_, reason) =>
        eggLoss.getEggLossByReason(reason)
    );

    ipcMain.handle('eggLoss:getBatchStats', (_, batchId) =>
        eggLoss.getBatchLossStats(batchId)
    );

    ipcMain.handle('eggLoss:delete', (_, lossId) =>
        eggLoss.deleteEggLoss(lossId)
    );

    // Debt and Change handlers
    ipcMain.handle('debt:getOutstanding', () =>
        sales.getOutstandingDebts()
    );

    ipcMain.handle('debt:getTotalOutstanding', () =>
        sales.getTotalOutstandingDebt()
    );

    ipcMain.handle('debt:pay', (_, saleId, amountPaid) =>
        sales.payDebt(saleId, amountPaid)
    );

    ipcMain.handle('change:getOutstanding', () =>
        sales.getOutstandingChange()
    );

    ipcMain.handle('change:getTotalOutstanding', () =>
        sales.getTotalOutstandingChange()
    );

    ipcMain.handle('change:return', (_, saleId) =>
        sales.returnChange(saleId)
    );

    // Advanced Debt Management
    ipcMain.handle('debt:recordPayment', (_, saleId, amountPaid, paymentMethod, notes) =>
        sales.recordDebtPayment(saleId, amountPaid, paymentMethod, notes)
    );

    ipcMain.handle('debt:getPaymentHistory', (_, saleId) =>
        sales.getDebtPaymentHistory(saleId)
    );

    ipcMain.handle('debt:deletePayment', (_, paymentId) =>
        sales.deleteDebtPayment(paymentId)
    );

    ipcMain.handle('debt:editPayment', (_, paymentId, newAmount, paymentMethod, notes) =>
        sales.editDebtPayment(paymentId, newAmount, paymentMethod, notes)
    );

    // Advanced Change Management
    ipcMain.handle('change:recordReturn', (_, saleId, changeAmount, returnedBy, notes) =>
        sales.recordChangeReturn(saleId, changeAmount, returnedBy, notes)
    );

    ipcMain.handle('change:getReturnHistory', (_, saleId) =>
        sales.getChangeReturnHistory(saleId)
    );

    ipcMain.handle('change:deleteReturn', (_, returnId) =>
        sales.deleteChangeReturn(returnId)
    );

    ipcMain.handle('change:editReturn', (_, returnId, newAmount, returnedBy, notes) =>
        sales.editChangeReturn(returnId, newAmount, returnedBy, notes)
    );
}