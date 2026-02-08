import { useEffect, useState } from 'react';
import { ShoppingCart, Plus, DollarSign, CreditCard, Trash2, Edit2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { FormInput, FormSelect, FormButton, Card, Table } from '../components/FormComponents';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [batches, setBatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [formData, setFormData] = useState({
    sale_date: new Date().toISOString().split('T')[0],
    customer_name: '',
    customer_phone: '',
    payment_method: 'cash',
    amount_paid: 0,
    items: [{ item_type: 'egg', quantity: 0, unit_price: 0, batch_id: null }]
  });

  useEffect(() => {
    loadSalesData();
  }, []);

  useEffect(() => {
    if (showForm) {
      loadBatchesData();
    }
  }, [showForm]);

  const loadSalesData = async () => {
    try {
      const [allSales, total, methods] = await Promise.all([
        window.api.sales.getAll(),
        window.api.sales.getTotalSales(),
        window.api.sales.getByPaymentMethod()
      ]);
      setSales(allSales || []);
      setTotalSales(total || 0);
      setPaymentMethods(methods || []);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBatchesData = async () => {
    try {
      const batchesData = await window.api.broiler.listBatchesWithAvailability();
      setBatches(batchesData || []);
    } catch (error) {
      console.error('Error loading batches:', error);
    }
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { item_type: 'egg', quantity: 0, unit_price: 0, batch_id: null }]
    }));
  };

  const handleRemoveItem = (idx) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const handleItemChange = (idx, field, value) => {
    const newItems = [...formData.items];
    newItems[idx][field] = field === 'quantity' || field === 'unit_price' ? Number(value) : value;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const total = calculateTotal();

      // Validation
      if (!formData.customer_name.trim()) {
        alert('Please enter customer name');
        return;
      }
      
      if (formData.payment_method === 'cash' && formData.amount_paid <= 0) {
        alert('Please enter amount paid for cash transactions');
        return;
      }

      // Validate broiler items - check batch availability
      for (const item of formData.items) {
        if (item.item_type === 'broiler') {
          if (!item.batch_id) {
            alert('Please select a batch for each broiler item');
            return;
          }
          
          const batch = batches.find(b => b.id === item.batch_id);
          if (!batch) {
            alert(`Batch ${item.batch_id} not found`);
            return;
          }

          if (item.quantity > batch.available_birds) {
            alert(`Batch "${batch.batch_code}" only has ${batch.available_birds} birds available, but you requested ${item.quantity}`);
            return;
          }

          if (batch.available_birds === 0) {
            alert(`Batch "${batch.batch_code}" has no birds available (finished batch)`);
            return;
          }
        }
      }

      // Calculate change and debt
      let changeAmount = 0;
      let debtAmount = 0;

      if (formData.payment_method === 'cash') {
        const amountPaid = Number(formData.amount_paid);
        if (amountPaid >= total) {
          changeAmount = amountPaid - total;
        } else {
          // Amount paid is less than total - create debt
          debtAmount = total - amountPaid;
        }
      } else if (formData.payment_method === 'credit') {
        debtAmount = total;
      }
      
      if (editingId) {
        // Update existing sale
        await window.api.sales.update(editingId, {
          sale_date: formData.sale_date,
          customer_name: formData.customer_name,
          customer_phone: formData.customer_phone,
          total_amount: total,
          payment_method: formData.payment_method,
          amount_paid: formData.payment_method === 'cash' ? Number(formData.amount_paid) : 0,
          change_amount: changeAmount,
          debt_amount: debtAmount
        });

        // Delete old items and add new ones
        const existingSale = sales.find(s => s.id === editingId);
        if (existingSale && existingSale.items) {
          for (const item of existingSale.items) {
            // Delete each old item
            try {
              await window.api.sales.deleteItem?.(item.id);
            } catch (e) {
              // Item might already be deleted
            }
          }
        }

        // Add updated items
        for (const item of formData.items) {
          await window.api.sales.addItem({
            sale_id: editingId,
            item_type: item.item_type,
            reference_id: item.batch_id || 0,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.quantity * item.unit_price
          });
        }
      } else {
        // Create new sale
        const saleId = await window.api.sales.add({
          sale_date: formData.sale_date,
          customer_name: formData.customer_name,
          customer_phone: formData.customer_phone,
          total_amount: total,
          payment_method: formData.payment_method,
          amount_paid: formData.payment_method === 'cash' ? Number(formData.amount_paid) : 0,
          change_amount: changeAmount,
          debt_amount: debtAmount
        });

        for (const item of formData.items) {
          await window.api.sales.addItem({
            sale_id: saleId,
            item_type: item.item_type,
            reference_id: item.batch_id || 0,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.quantity * item.unit_price
          });
        }
      }

      alert(editingId ? 'Sale updated successfully!' : 'Sale recorded successfully!');
      resetForm();
      loadSalesData();
      loadBatchesData(); // Reload batches to update availability
    } catch (error) {
      console.error('Error with sale:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleEditSale = async (sale) => {
    try {
      // Load the full sale details including items
      const saleDetails = await window.api.sales.getDetails(sale.id);
      
      setEditingId(sale.id);
      setFormData({
        sale_date: sale.sale_date,
        customer_name: sale.customer_name || '',
        customer_phone: sale.customer_phone || '',
        payment_method: sale.payment_method,
        amount_paid: sale.amount_paid || 0,
        items: (saleDetails || []).map(item => ({
          id: item.id,
          item_type: item.item_type,
          quantity: item.quantity,
          unit_price: item.unit_price,
          batch_id: item.reference_id || null
        })) || [{ item_type: 'egg', quantity: 0, unit_price: 0, batch_id: null }]
      });
      setShowForm(true);
    } catch (error) {
      console.error('Error loading sale details:', error);
      alert('Error loading sale details: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      sale_date: new Date().toISOString().split('T')[0],
      customer_name: '',
      customer_phone: '',
      payment_method: 'cash',
      amount_paid: 0,
      items: [{ item_type: 'egg', quantity: 0, unit_price: 0, batch_id: null }]
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleDeleteSale = async (saleId) => {
    if (!window.confirm('Are you sure you want to delete this sale? This action cannot be undone.')) {
      return;
    }

    try {
      await window.api.sales.delete(saleId);
      alert('Sale deleted successfully');
      loadSalesData();
    } catch (error) {
      console.error('Error deleting sale:', error);
      alert('Error: ' + error.message);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading sales data...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShoppingCart className="text-blue-600" />
          Sales Management
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
        >
          <Plus size={20} /> New Sale
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Sales</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">${totalSales.toFixed(2)}</p>
            </div>
            <DollarSign className="text-green-500" size={40} />
          </div>
        </div>

        {paymentMethods.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard size={20} /> Payment Methods
            </h3>
            <div className="space-y-2">
              {paymentMethods.map((method, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="capitalize">{method.payment_method}</span>
                  <span className="font-semibold">${method.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Sale Form */}
      {showForm && (
        <Card title={editingId ? "Edit Sale" : "Record New Sale"}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                type="date"
                label="Sale Date"
                value={formData.sale_date}
                onChange={(e) => setFormData(prev => ({ ...prev, sale_date: e.target.value }))}
                required
              />
              <FormSelect
                label="Payment Method"
                value={formData.payment_method}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                options={[
                  { value: 'cash', label: 'Cash' },
                  { value: 'mobile_money', label: 'Mobile Money' },
                  { value: 'bank_transfer', label: 'Bank Transfer' },
                  { value: 'credit', label: 'Credit' }
                ]}
              />
            </div>

            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-yellow-50 p-4 rounded border border-yellow-200">
              <FormInput
                type="text"
                label="Customer Name *"
                value={formData.customer_name}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                placeholder="Enter customer name"
                required
              />
              <FormInput
                type="tel"
                label="Customer Phone"
                value={formData.customer_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                placeholder="Enter customer phone"
              />
              {formData.payment_method === 'cash' && (
                <FormInput
                  type="number"
                  label="Amount Paid *"
                  value={formData.amount_paid}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount_paid: e.target.value }))}
                  placeholder="Cash amount received"
                  step="0.01"
                  required
                />
              )}
            </div>

            {/* Items */}
            <div className="space-y-3 border border-gray-200 p-4 rounded">
              <h3 className="font-semibold text-lg">Sale Items</h3>
              {formData.items.map((item, idx) => {
                const selectedBatch = item.batch_id ? batches.find(b => b.id === item.batch_id) : null;
                const availableBirds = selectedBatch?.available_birds || 0;
                
                return (
                  <div key={idx} className="space-y-3 border border-gray-200 p-4 rounded bg-gray-50">
                    {/* Item Type and Batch Selection Row */}
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
                        <select
                          value={item.item_type}
                          onChange={(e) => handleItemChange(idx, 'item_type', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="egg">Eggs</option>
                          <option value="broiler">Broiler</option>
                        </select>
                      </div>

                      {/* Broiler Batch Selection */}
                      {item.item_type === 'broiler' && (
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Batch *
                          </label>
                          <select
                            value={item.batch_id || ''}
                            onChange={(e) => handleItemChange(idx, 'batch_id', e.target.value ? Number(e.target.value) : null)}
                            className="w-full border border-gray-300 rounded px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">-- Select a batch --</option>
                            {batches.map(batch => (
                              <option 
                                key={batch.id} 
                                value={batch.id}
                                disabled={batch.available_birds === 0}
                              >
                                {batch.batch_code} 
                                ({batch.available_birds > 0 
                                  ? `${batch.available_birds} birds available` 
                                  : 'FINISHED'})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Batch Info and Quantity Row */}
                    <div className="flex gap-3 items-end">
                      {/* Batch Info Display */}
                      {item.item_type === 'broiler' && selectedBatch && (
                        <div className="flex-1 bg-blue-50 border border-blue-200 p-3 rounded">
                          <div className="text-sm text-gray-700">
                            <p>
                              <span className="font-semibold">Available:</span>{' '}
                              <span className={availableBirds === 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                                {availableBirds} birds
                              </span>
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              Received: {selectedBatch.quantity_received} | 
                              Mortality: {selectedBatch.mortality_count} | 
                              Home Use: {selectedBatch.home_use_count} | 
                              Sold: {selectedBatch.sold_count}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="w-24">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          max={item.item_type === 'broiler' ? availableBirds : undefined}
                          required
                        />
                        {item.item_type === 'broiler' && item.quantity > availableBirds && (
                          <p className="text-red-600 text-xs mt-1">Exceeds available ({availableBirds})</p>
                        )}
                      </div>

                      <div className="w-32">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="0.01"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subtotal</label>
                        <span className="block font-semibold text-green-600 py-2">
                          ${(item.quantity * item.unit_price).toFixed(2)}
                        </span>
                      </div>

                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-red-600 hover:text-red-700 p-2"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={handleAddItem}
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 mt-2"
              >
                <Plus size={18} /> Add Another Item
              </button>
            </div>

            <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-500">
              <p className="text-right text-xl font-bold text-blue-700">
                Total: ${calculateTotal().toFixed(2)}
              </p>
            </div>

            <div className="flex gap-3">
              <FormButton type="submit" variant="success" className="flex-1">
                {editingId ? 'Update Sale' : 'Save Sale'}
              </FormButton>
              <FormButton
                type="button"
                onClick={resetForm}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </FormButton>
            </div>
          </form>
        </Card>
      )}

      {/* Sales List */}
      <Card title="Sales History">
        {/* Search */}
        <div className="mb-6 flex items-center gap-2">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search sales by customer name or date..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filtered Sales */}
        {(() => {
          const filtered = sales.filter(sale => 
            sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.sale_date.includes(searchTerm)
          );

          const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
          const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
          const paginatedSales = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

          return (
            <>
              <Table
                headers={['Date', 'Customer', 'Quantity Sold', 'Amount', 'Payment Method']}
                rows={paginatedSales.map(sale => {
                  const totalQty = sale.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
                  return {
                    'Date': sale.sale_date,
                    'Customer': sale.customer_name || '-',
                    'Quantity Sold': `${totalQty} unit${totalQty !== 1 ? 's' : ''}`,
                    'Amount': `$${sale.total_amount.toFixed(2)}`,
                    'Payment Method': sale.payment_method.charAt(0).toUpperCase() + sale.payment_method.slice(1),
                  };
                })}
                actions={(row) => {
                  const sale = paginatedSales.find(s => s.sale_date === row['Date'] && s.total_amount.toFixed(2) === row['Amount'].replace('$', ''));
                  return (
                    <>
                      <button 
                        onClick={() => sale && handleEditSale(sale)} 
                        className="text-blue-600 hover:text-blue-700 transition mr-2"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => sale && handleDeleteSale(sale.id)}
                        className="text-red-600 hover:text-red-800 transition"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  );
                }}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Showing {startIdx + 1}-{Math.min(startIdx + ITEMS_PER_PAGE, filtered.length)} of {filtered.length} sales
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 rounded ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </Card>
    </div>
  );
}
