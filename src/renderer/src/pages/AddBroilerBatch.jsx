import { useEffect, useState } from "react";
import { Bird, Trash2, Edit2 } from 'lucide-react';
import { FormInput, FormSelect, FormButton, FormTextarea, Card, Table } from '../components/FormComponents';

export default function AddBroilerBatch() {
  const [suppliers, setSuppliers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    supplier_id: "",
    batch_code: "",
    quantity_received: "",
    cost_per_bird: "",
    date_received: "",
    notes: "",
  });

  async function loadData() {
    try {
      const [sup, bat] = await Promise.all([
        window.api.suppliers.list(),
        window.api.broiler.listBatches(),
      ]);
      setSuppliers(sup);
      setBatches(bat);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      if (editingId) {
        alert('Update functionality needs backend implementation');
        // await window.api.broiler.updateBatch(editingId, { ... });
      } else {
        await window.api.broiler.addBatch({
          supplier_id: Number(form.supplier_id),
          batch_code: form.batch_code || null,
          quantity_received: Number(form.quantity_received),
          cost_per_bird: Number(form.cost_per_bird),
          date_received: form.date_received,
          notes: form.notes || null,
        });
      }

      alert(editingId ? "Broiler batch updated" : "Broiler batch saved");
      resetForm();
      await loadData();
    } catch (error) {
      console.error("Error adding batch:", error);
      alert("Failed to save batch: " + error.message);
    }
  }

  const handleEditBatch = (batch) => {
    setEditingId(batch.id);
    setForm({
      supplier_id: batch.supplier_id,
      batch_code: batch.batch_code || "",
      quantity_received: batch.quantity_received,
      cost_per_bird: batch.cost_per_bird,
      date_received: batch.date_received,
      notes: batch.notes || "",
    });
  };

  const resetForm = () => {
    setForm({
      supplier_id: "",
      batch_code: "",
      quantity_received: "",
      cost_per_bird: "",
      date_received: "",
      notes: "",
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Bird className="text-blue-600" size={32} />
        <h1 className="text-3xl font-bold">Add Broiler Batch</h1>
      </div>

      <Card title={editingId ? "Edit Broiler Batch" : "Add New Broiler Batch"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              label="Supplier"
              name="supplier_id"
              value={form.supplier_id}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select Supplier' },
                ...suppliers.map(s => ({ value: s.id, label: `${s.name} - ${s.product}` }))
              ]}
              required
            />
            <FormInput
              type="text"
              label="Batch Code"
              name="batch_code"
              value={form.batch_code}
              onChange={handleChange}
              placeholder="e.g., BR-2026-001"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              type="number"
              label="Quantity Received"
              name="quantity_received"
              value={form.quantity_received}
              onChange={handleChange}
              required
            />
            <FormInput
              type="number"
              label="Cost Per Bird"
              name="cost_per_bird"
              value={form.cost_per_bird}
              onChange={handleChange}
              step="0.01"
              required
            />
          </div>

          <FormInput
            type="date"
            label="Date Received"
            name="date_received"
            value={form.date_received}
            onChange={handleChange}
            required
          />

          <FormTextarea
            label="Notes (optional)"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Add any relevant notes..."
            rows="3"
          />

          <FormButton type="submit" variant="success">
            {editingId ? 'Update Batch' : 'Save Batch'}
          </FormButton>
        </form>
      </Card>

      <Card title="Existing Batches">
        <Table 
          headers={['Batch Code', 'Supplier', 'Quantity', 'Cost/Bird', 'Date Received']} 
          rows={batches.map(b => ({
            'Batch Code': b.batch_code || '-',
            'Supplier': b.supplier_name || '-',
            'Quantity': b.quantity_received,
            'Cost/Bird': `$${b.cost_per_bird.toFixed(2)}`,
            'Date Received': b.date_received,
          }))}
          actions={(row) => {
            const batch = batches.find(b => (b.batch_code || '-') === row['Batch Code']);
            return (
              <>
                <button 
                  onClick={() => batch && handleEditBatch(batch)}
                  className="text-blue-600 hover:text-blue-700 transition mr-2" 
                  title="Edit"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => {
                    if (batch && window.confirm('Are you sure you want to delete this batch?')) {
                      console.log('Deleting batch:', batch.id);
                      alert('Delete functionality needs backend implementation');
                    }
                  }}
                  className="text-red-600 hover:text-red-700 transition" 
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </>
            );
          }}
        />
      </Card>
    </div>
  );
}
