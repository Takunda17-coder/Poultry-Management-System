import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
    suppliers: {
        add: (data) => ipcRenderer.invoke("supplier:add", data),
        list: () => ipcRenderer.invoke("supplier:list"),
    },
    broiler: {
        addBatch: (data) => ipcRenderer.invoke("broiler:addBatch", data),
        addEvent: (data) => ipcRenderer.invoke("broiler:addEvent", data),
        listBatches: () => ipcRenderer.invoke("broiler:listBatches"),
    },
    eggs: {
        addBatch: (data) => ipcRenderer.invoke("egg:addBatch", data),
        listBatches: () => ipcRenderer.invoke("egg:listBatches"),
        grade: (data) => ipcRenderer.invoke("egg:grade", data),
    },
    stats: {
        getBroilerCount: () => ipcRenderer.invoke("stats:getBroilerCount"),
        getEggCount: () => ipcRenderer.invoke("stats:getEggCount"),
        getSupplierCount: () => ipcRenderer.invoke("stats:getSupplierCount"),
        getRevenue: () => ipcRenderer.invoke("stats:getRevenue"),
    },
    sales: {
        add: (data) => ipcRenderer.invoke("sales:add", data),
        addItem: (data) => ipcRenderer.invoke("sales:addItem", data),
        getAll: () => ipcRenderer.invoke("sales:getAll"),
        getDetails: (saleId) => ipcRenderer.invoke("sales:getDetails", saleId),
        getTotalSales: (startDate, endDate) => ipcRenderer.invoke("sales:getTotalSales", startDate, endDate),
        getByPaymentMethod: () => ipcRenderer.invoke("sales:getByPaymentMethod"),
        update: (saleId, data) => ipcRenderer.invoke("sales:update", saleId, data),
        delete: (saleId) => ipcRenderer.invoke("sales:delete", saleId),
        getById: (saleId) => ipcRenderer.invoke("sales:getById", saleId),
    },
    accounting: {
        getFinancialSummary: () => ipcRenderer.invoke("accounting:getFinancialSummary"),
        getExpenseBreakdown: () => ipcRenderer.invoke("accounting:getExpenseBreakdown"),
        getMonthlyRevenue: (year, month) => ipcRenderer.invoke("accounting:getMonthlyRevenue", year, month),
        getRevenueByPaymentMethod: () => ipcRenderer.invoke("accounting:getRevenueByPaymentMethod"),
    },
    inventory: {
        add: (data) => ipcRenderer.invoke("inventory:add", data),
        getAll: () => ipcRenderer.invoke("inventory:getAll"),
        getStats: () => ipcRenderer.invoke("inventory:getStats"),
        getTotalValue: () => ipcRenderer.invoke("inventory:getTotalValue"),
        update: (id, quantity) => ipcRenderer.invoke("inventory:update", id, quantity),
        delete: (id) => ipcRenderer.invoke("inventory:delete", id),
    },
    birdEvents: {
        record: (data) => ipcRenderer.invoke("birdEvents:record", data),
        getAll: () => ipcRenderer.invoke("birdEvents:getAll"),
        getByBatch: (batchId) => ipcRenderer.invoke("birdEvents:getByBatch", batchId),
        getByType: (eventType) => ipcRenderer.invoke("birdEvents:getByType", eventType),
        getTotalMortality: (batchId) => ipcRenderer.invoke("birdEvents:getTotalMortality", batchId),
        getTotalHomeUse: (batchId) => ipcRenderer.invoke("birdEvents:getTotalHomeUse", batchId),
        getAvailable: (batchId) => ipcRenderer.invoke("birdEvents:getAvailable", batchId),
        getHealthSummary: (batchId) => ipcRenderer.invoke("birdEvents:getHealthSummary", batchId),
        delete: (eventId) => ipcRenderer.invoke("birdEvents:delete", eventId),
    },
    eggLoss: {
        record: (data) => ipcRenderer.invoke("eggLoss:record", data),
        getAll: () => ipcRenderer.invoke("eggLoss:getAll"),
        getByBatch: (batchId) => ipcRenderer.invoke("eggLoss:getByBatch", batchId),
        getTotalLoss: () => ipcRenderer.invoke("eggLoss:getTotalLoss"),
        getStats: () => ipcRenderer.invoke("eggLoss:getStats"),
        getByReason: (reason) => ipcRenderer.invoke("eggLoss:getByReason", reason),
        getBatchStats: (batchId) => ipcRenderer.invoke("eggLoss:getBatchStats", batchId),
        delete: (lossId) => ipcRenderer.invoke("eggLoss:delete", lossId),
    },
    debt: {
        getOutstanding: () => ipcRenderer.invoke("debt:getOutstanding"),
        getTotalOutstanding: () => ipcRenderer.invoke("debt:getTotalOutstanding"),
        pay: (saleId, amountPaid) => ipcRenderer.invoke("debt:pay", saleId, amountPaid),
        recordPayment: (saleId, amountPaid, paymentMethod = 'cash', notes = '') => 
            ipcRenderer.invoke("debt:recordPayment", saleId, amountPaid, paymentMethod, notes),
        getPaymentHistory: (saleId) => ipcRenderer.invoke("debt:getPaymentHistory", saleId),
        deletePayment: (paymentId) => ipcRenderer.invoke("debt:deletePayment", paymentId),
        editPayment: (paymentId, newAmount, paymentMethod, notes) => 
            ipcRenderer.invoke("debt:editPayment", paymentId, newAmount, paymentMethod, notes),
    },
    change: {
        getOutstanding: () => ipcRenderer.invoke("change:getOutstanding"),
        getTotalOutstanding: () => ipcRenderer.invoke("change:getTotalOutstanding"),
        return: (saleId) => ipcRenderer.invoke("change:return", saleId),
        recordReturn: (saleId, changeAmount, returnedBy = '', notes = '') =>
            ipcRenderer.invoke("change:recordReturn", saleId, changeAmount, returnedBy, notes),
        getReturnHistory: (saleId) => ipcRenderer.invoke("change:getReturnHistory", saleId),
        deleteReturn: (returnId) => ipcRenderer.invoke("change:deleteReturn", returnId),
        editReturn: (returnId, newAmount, returnedBy, notes) =>
            ipcRenderer.invoke("change:editReturn", returnId, newAmount, returnedBy, notes),
    },
});