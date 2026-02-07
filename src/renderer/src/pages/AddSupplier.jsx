import { useEffect, useState } from "react";
import { Users, Trash2, Edit2 } from "lucide-react";
import { FormInput, FormButton, Card, Table } from "../components/FormComponents";

export default function AddSupplier() {
  const [suppliers, setSuppliers] = useState([]);
  const [editingId, setEditingId] = useState(null);
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
        alert('Update functionality needs backend implementation');
        // await window.api.suppliers.update(editingId, { ... });
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
        // Note: Implement delete in backend if not already done
        console.log('Deleting supplier:', supplierId);
        alert('Delete functionality needs backend implementation');
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
        {suppliers.length === 0 ? (
          <p className="text-gray-500">No suppliers yet.</p>
        ) : (
          <Table 
            headers={['Name', 'Product', 'Phone', 'Email', 'Address']} 
            rows={suppliers.map(sup => ({
              'Name': sup.name,
              'Product': sup.product,
              'Phone': sup.phone,
              'Email': sup.email,
              'Address': sup.address,
            }))}
            actions={(row) => {
              const supplier = suppliers.find(s => s.name === row['Name']);
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
                    onClick={() => {
                      if (supplier && window.confirm('Are you sure you want to delete this supplier?')) {
                        console.log('Deleting supplier:', supplier.id);
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
        )}
      </Card>
    </div>
  );
}