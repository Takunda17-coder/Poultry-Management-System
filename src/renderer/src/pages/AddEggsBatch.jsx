import {useEffect, useState} from "react";
import { Egg, Trash2, Edit2 } from "lucide-react";
import { FormInput, FormSelect, FormButton, Card, Table } from "../components/FormComponents";

export default function AddEggsBatch() {
  const [suppliers, setSuppliers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    supplier_id: "",
    crates_received: "",
    cost_per_crate: "",
    date_received: "",
  });

  async function loadData() {
    try {
      const [sup, bat] = await Promise.all([
        window.api.suppliers.list(),
        window.api.eggs.listBatches(),
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

  function handleChange(e){
    setForm(prev => ({...prev, [e.target.name]: e.target.value}));
  }

  async function handleSubmit(e){
    e.preventDefault();

    try {
      if (editingId) {
        alert('Update functionality needs backend implementation');
        // await window.api.eggs.updateBatch(editingId, { ... });
      } else {
        await window.api.eggs.addBatch({
          supplier_id: Number(form.supplier_id),
          crates_received: Number(form.crates_received),
          cost_per_crate: Number(form.cost_per_crate),
          date_received: form.date_received,
        });
      }

      alert(editingId ? "Egg batch updated" : "Egg batch saved");
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
      crates_received: batch.crates_received,
      cost_per_crate: batch.cost_per_crate,
      date_received: batch.date_received,
    });
  };

  const resetForm = () => {
    setForm({
      supplier_id: "",
      crates_received: "",
      cost_per_crate: "",
      date_received: "",
    });
    setEditingId(null);
  };

  const handleDeleteBatch = async (batchId) => {
    if (window.confirm('Are you sure you want to delete this batch?')) {
      try {
        // Note: Implement delete in backend if not already done
        console.log('Deleting egg batch:', batchId);
        alert('Delete functionality needs backend implementation');
      } catch (error) {
        console.error('Error deleting batch:', error);
        alert('Error deleting batch: ' + error.message);
      }
    }
  }

  return(
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Egg className="text-blue-600" size={32} />
        <h1 className="text-3xl font-bold">Add Egg Batch</h1>
      </div>

      <Card title={editingId ? "Edit Egg Batch" : "Add New Egg Batch"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              label="Supplier"
              name="supplier_id"
              value={form.supplier_id}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select Supplier' },
                ...suppliers.map(sup => ({ value: sup.id, label: sup.name }))
              ]}
              required
            />
            <FormInput
              type="number"
              label="Crates Received"
              name="crates_received"
              value={form.crates_received}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              type="number"
              label="Cost Per Crate"
              name="cost_per_crate"
              value={form.cost_per_crate}
              onChange={handleChange}
              step="0.01"
              required
            />
            <FormInput
              type="date"
              label="Date Received"
              name="date_received"
              value={form.date_received}
              onChange={handleChange}
              required
            />
          </div>

          <FormButton type="submit" variant="success">
            {editingId ? 'Update Batch' : 'Save Batch'}
          </FormButton>
        </form>
      </Card>

      <Card title="Existing Egg Batches">
        <Table 
          headers={['Supplier', 'Crates Received', 'Cost Per Crate', 'Date Received']} 
          rows={batches.map(batch => ({
            'Supplier': batch.supplier_name || batch.supplier_id,
            'Crates Received': batch.crates_received,
            'Cost Per Crate': `$${batch.cost_per_crate.toFixed(2)}`,
            'Date Received': batch.date_received,
          }))}
          actions={(row) => {
            const batch = batches.find(b => (b.supplier_name || b.supplier_id) === row['Supplier']);
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