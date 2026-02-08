import { useEffect, useState } from "react";
import { Users, Trash2, Edit2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { FormInput, FormButton, Card, Table } from "../components/FormComponents";

export default function AddSupplier() {
  const [suppliers, setSuppliers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [form, setForm] = useState({
    name: "",
    product: "",
    phone: "",
    email: "",
    address: "",
  });
  const [error, setError] = useState(null);

  async function loadSuppliers() {
    try {
      const data = await window.api.suppliers.list();
      setSuppliers(data || []);
    } catch (err) {
      setError(err.message);
      console.error("Error loading suppliers:", err);
    }
  }

  useEffect(() => {
    loadSuppliers();
  }, []);

  function handleChange(e) {
    setForm(prev => ({...prev, [e.target.name]: e.target.value}));
  }

  async function handleSubmit(e){
    e.preventDefault();
    try {
      if (editingId) {
        await window.api.suppliers.update(editingId, {
          name: form.name,
          product: form.product,
          phone: form.phone,
          email: form.email,
          address: form.address,
        });
      } else {
        await window.api.suppliers.add({
          name: form.name,
          product: form.product,
          phone: form.phone,
          email: form.email,
          address: form.address,
        });
      }

      alert(editingId ? "Supplier updated successfully" : "Supplier added successfully");
      resetForm();
      await loadSuppliers();
    } catch (err) {
      setError(err.message);
      console.error("Error adding supplier:", err);
    }
  };

  const handleEditSupplier = (supplier) => {
    setEditingId(supplier.id);
    setForm({
      name: supplier.name,
      product: supplier.product,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
    });
  };

  const resetForm = () => {
    setForm({
      name: "",
      product: "",
      phone: "",
      email: "",
      address: "",
    });
    setEditingId(null);
    setError(null);
  };

  const handleDeleteSupplier = async (supplierId) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await window.api.suppliers.delete(supplierId);
        alert('Supplier deleted successfully');
        await loadSuppliers();
      } catch (err) {
        setError(err.message);
        console.error('Error deleting supplier:', err);
        alert('Error deleting supplier: ' + err.message);
      }
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="text-blue-600" size={32} />
        <h1 className="text-3xl font-bold">Add Supplier</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Card title={editingId ? "Edit Supplier" : "Add New Supplier"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              type="text"
              label="Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <FormInput
              type="text"
              label="Product"
              name="product"
              value={form.product}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              type="text"
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
            />
            <FormInput
              type="email"
              label="Email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <FormInput
            type="text"
            label="Address"
            name="address"
            value={form.address}
            onChange={handleChange}
            required
          />

          <FormButton type="submit" variant="success">
            {editingId ? 'Update Supplier' : 'Add Supplier'}
          </FormButton>
              <FormButton type="button" onClick={resetForm} variant="secondary">Cancel</FormButton>
        </form>
      </Card>

      <Card title="Existing Suppliers">
        {/* Search */}
        <div className="mb-6 flex items-center gap-2">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search suppliers by name or product..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filtered Suppliers */}
        {(() => {
          const filtered = suppliers.filter(sup => 
            sup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sup.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sup.phone.includes(searchTerm) ||
            sup.email.toLowerCase().includes(searchTerm.toLowerCase())
          );

          const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
          const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
          const paginatedSuppliers = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

          return (
            <>
              {filtered.length === 0 ? (
                <p className="text-gray-500">No suppliers found.</p>
              ) : (
                <>
                  <Table 
                    headers={['Name', 'Product', 'Phone', 'Email', 'Address']} 
                    rows={paginatedSuppliers.map(sup => ({
                      'Name': sup.name,
                      'Product': sup.product,
                      'Phone': sup.phone,
                      'Email': sup.email,
                      'Address': sup.address,
                    }))}
                    actions={(row) => {
                      const supplier = paginatedSuppliers.find(s => s.name === row['Name']);
                      return (
                        <>
                          <button 
                            onClick={() => supplier && handleEditSupplier(supplier)}
                            className="text-blue-600 hover:text-blue-700 transition mr-2" 
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => supplier && handleDeleteSupplier(supplier.id)}
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
                        Showing {startIdx + 1}-{Math.min(startIdx + ITEMS_PER_PAGE, filtered.length)} of {filtered.length} suppliers
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
              )}
            </>
          );
        })()}
      </Card>
    </div>
  );
}