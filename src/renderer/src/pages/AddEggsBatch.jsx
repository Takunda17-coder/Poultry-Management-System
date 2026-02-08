import {useEffect, useState} from "react";
import { Egg, Trash2, Edit2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { FormInput, FormSelect, FormButton, Card, Table } from '../components/FormComponents';

export default function AddEggsBatch() {
  const [suppliers, setSuppliers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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
        await window.api.eggs.updateBatch(editingId, {
          supplier_id: Number(form.supplier_id),
          crates_received: Number(form.crates_received),
          cost_per_crate: Number(form.cost_per_crate),
          date_received: form.date_received,
        });
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
        await window.api.eggs.deleteBatch(batchId);
        alert('Egg batch deleted successfully');
        await loadData();
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
        {/* Search */}
        <div className="mb-6 flex items-center gap-2">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search batches by supplier..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filtered Batches */}
        {(() => {
          const filtered = batches.filter(batch => 
            (batch.supplier_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            batch.date_received.includes(searchTerm)
          );

          const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
          const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
          const paginatedBatches = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

          return (
            <>
              <Table 
                headers={['Supplier', 'Crates Received', 'Cost Per Crate', 'Date Received']} 
                rows={paginatedBatches.map(batch => ({
                  'Supplier': batch.supplier_name || batch.supplier_id,
                  'Crates Received': batch.crates_received,
                  'Cost Per Crate': `$${batch.cost_per_crate.toFixed(2)}`,
                  'Date Received': batch.date_received,
                }))}
                actions={(row) => {
                  const batch = paginatedBatches.find(b => (b.supplier_name || b.supplier_id) === row['Supplier']);
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
                        onClick={() => batch && handleDeleteBatch(batch.id)}
                        className="text-red-600 hover:text-red-700 transition" 
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
                    Showing {startIdx + 1}-{Math.min(startIdx + ITEMS_PER_PAGE, filtered.length)} of {filtered.length} batches
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