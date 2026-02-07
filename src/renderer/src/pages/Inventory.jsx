import { useEffect, useState } from 'react';
import { Package, Plus, Trash2, Edit2 } from 'lucide-react';
import { FormInput, FormSelect, FormButton, Card, Table } from '../components/FormComponents';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    supplier_id: '',
    item_name: '',
    quantity: '',
    unit: 'kg',
    cost_per_unit: '',
    date_added: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [inv, sups, value] = await Promise.all([
        window.api.inventory.getAll(),
        window.api.suppliers.list(),
        window.api.inventory.getTotalValue()
      ]);
      setInventory(inv || []);
      setSuppliers(sups || []);
      setTotalValue(value || 0);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await window.api.inventory.add({
        ...formData,
        supplier_id: Number(formData.supplier_id),
        quantity: Number(formData.quantity),
        cost_per_unit: Number(formData.cost_per_unit)
      });
      alert('Item added successfully!');
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await window.api.inventory.delete(id);
        loadData();
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      supplier_id: '',
      item_name: '',
      quantity: '',
      unit: 'kg',
      cost_per_unit: '',
      date_added: new Date().toISOString().split('T')[0]
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) return <div className="p-8 text-center">Loading inventory...</div>;

  const tableRows = inventory.map(item => ({
    'Item': item.item_name,
    'Supplier': item.supplier_name || '-',
    'Quantity': `${item.quantity} ${item.unit}`,
    'Cost/Unit': `$${item.cost_per_unit.toFixed(2)}`,
    'Total': `$${(item.quantity * item.cost_per_unit).toFixed(2)}`,
    'Date Added': item.date_added
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package className="text-blue-600" />
          Inventory Management
        </h1>
        <FormButton onClick={() => setShowForm(!showForm)} variant="primary">
          <Plus className="inline mr-2" size={20} /> Add Item
        </FormButton>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Items</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{inventory.length}</p>
            </div>
            <Package className="text-blue-500" size={40} />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Inventory Value</p>
              <p className="text-3xl font-bold text-green-600 mt-2">${totalValue.toFixed(2)}</p>
            </div>
            <div className="text-4xl font-bold text-green-300">$</div>
          </div>
        </Card>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card title="Add Inventory Item">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelect
                label="Supplier"
                value={formData.supplier_id}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier_id: e.target.value }))}
                options={[
                  { value: '', label: 'Select Supplier' },
                  ...suppliers.map(s => ({ value: s.id, label: s.name }))
                ]}
              />
              <FormInput
                type="text"
                label="Item Name"
                value={formData.item_name}
                onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))}
                placeholder="e.g., Fish Meal, Wheat Bran"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormInput
                type="number"
                label="Quantity"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                step="0.01"
                required
              />
              <FormSelect
                label="Unit"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                options={[
                  { value: 'kg', label: 'Kilograms (kg)' },
                  { value: 'bag', label: 'Bags' },
                  { value: 'litre', label: 'Litre' },
                  { value: 'unit', label: 'Units' }
                ]}
              />
              <FormInput
                type="number"
                label="Cost Per Unit"
                value={formData.cost_per_unit}
                onChange={(e) => setFormData(prev => ({ ...prev, cost_per_unit: e.target.value }))}
                step="0.01"
                required
              />
            </div>

            <FormInput
              type="date"
              label="Date Added"
              value={formData.date_added}
              onChange={(e) => setFormData(prev => ({ ...prev, date_added: e.target.value }))}
              required
            />

            <div className="flex gap-3 pt-4">
              <FormButton type="submit" variant="success" className="flex-1">Save Item</FormButton>
              <FormButton type="button" onClick={resetForm} variant="secondary" className="flex-1">Cancel</FormButton>
            </div>
          </form>
        </Card>
      )}

      {/* Inventory Table */}
      <Card title="Inventory Items">
        <Table
          headers={['Item', 'Supplier', 'Quantity', 'Cost/Unit', 'Total', 'Date Added']}
          rows={tableRows}
          actions={(row) => (
            <>
              <button className="text-blue-600 hover:text-blue-700" onClick={() => console.log('Edit', row)}>
                <Edit2 size={18} />
              </button>
              <button className="text-red-600 hover:text-red-700" onClick={() => {
                const item = inventory.find(i => i.item_name === row['Item']);
                if (item) handleDelete(item.id);
              }}>
                <Trash2 size={18} />
              </button>
            </>
          )}
        />
      </Card>
    </div>
  );
}
