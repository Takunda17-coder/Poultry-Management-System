import { useEffect, useState } from 'react';
import { Droplet, Trash2 } from 'lucide-react';
import { FormInput, FormSelect, FormButton, Card, Table } from '../components/FormComponents';

export default function EggLoss() {
  const [batches, setBatches] = useState([]);
  const [losses, setLosses] = useState([]);
  const [stats, setStats] = useState([]);
  const [totalLoss, setTotalLoss] = useState(0);

  const [form, setForm] = useState({
    egg_batch_id: '',
    quantity_lost: '',
    loss_date: new Date().toISOString().split('T')[0],
    reason: 'breakage',
    notes: '',
  });

  async function loadData() {
    try {
      const [bat, loss, stat, total] = await Promise.all([
        window.api.eggs.listBatches(),
        window.api.eggLoss.getAll(),
        window.api.eggLoss.getStats(),
        window.api.eggLoss.getTotalLoss(),
      ]);
      setBatches(bat);
      setLosses(loss);
      setStats(stat);
      setTotalLoss(total);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await window.api.eggLoss.record({
        egg_batch_id: Number(form.egg_batch_id),
        quantity_lost: Number(form.quantity_lost),
        loss_date: form.loss_date,
        reason: form.reason,
        notes: form.notes,
      });

      alert('Egg loss recorded successfully');

      setForm({
        egg_batch_id: '',
        quantity_lost: '',
        loss_date: new Date().toISOString().split('T')[0],
        reason: 'breakage',
        notes: '',
      });

      await loadData();
    } catch (error) {
      console.error('Error recording loss:', error);
      alert('Failed to record loss: ' + error.message);
    }
  }

  async function handleDelete(lossId) {
    if (confirm('Are you sure you want to delete this loss record?')) {
      try {
        await window.api.eggLoss.delete(lossId);
        alert('Loss record deleted');
        await loadData();
      } catch (error) {
        console.error('Error deleting loss:', error);
        alert('Failed to delete loss: ' + error.message);
      }
    }
  }

  const lossValue = losses.reduce((sum, loss) => sum + (loss.quantity_lost * 50), 0); // Assuming $50 per crate average
  const totalBatches = batches.reduce((sum, batch) => sum + batch.crates_received, 0);
  const lossPercentage = totalBatches > 0 ? ((totalLoss / totalBatches) * 100).toFixed(2) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Droplet className="text-blue-600" size={32} />
        <h1 className="text-3xl font-bold">Egg Loss Tracking</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Total Eggs Lost">
          <p className="text-3xl font-bold text-red-600">{totalLoss}</p>
          <p className="text-sm text-gray-500">Crates</p>
        </Card>
        <Card title="Loss Percentage">
          <p className="text-3xl font-bold text-orange-600">{lossPercentage}%</p>
          <p className="text-sm text-gray-500">Of total batches</p>
        </Card>
        <Card title="Total Loss Records">
          <p className="text-3xl font-bold text-blue-600">{losses.length}</p>
          <p className="text-sm text-gray-500">Records</p>
        </Card>
        <Card title="Estimated Loss Value">
          <p className="text-3xl font-bold text-purple-600">${(lossValue || 0).toFixed(2)}</p>
          <p className="text-sm text-gray-500">USD</p>
        </Card>
      </div>

      {/* Record Loss Form */}
      <Card title="Record Egg Loss">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              label="Batch"
              name="egg_batch_id"
              value={form.egg_batch_id}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select Batch' },
                ...batches.map(b => ({
                  value: b.id,
                  label: `${b.supplier_name || 'Unknown'} - ${b.crates_received} crates`,
                })),
              ]}
              required
            />
            <FormInput
              type="number"
              label="Quantity Lost (Crates)"
              name="quantity_lost"
              value={form.quantity_lost}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              type="date"
              label="Loss Date"
              name="loss_date"
              value={form.loss_date}
              onChange={handleChange}
              required
            />
            <FormSelect
              label="Reason"
              name="reason"
              value={form.reason}
              onChange={handleChange}
              options={[
                { value: 'breakage', label: 'Breakage' },
                { value: 'spoilage', label: 'Spoilage' },
                { value: 'disease', label: 'Disease' },
                { value: 'theft', label: 'Theft' },
                { value: 'other', label: 'Other' },
              ]}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Add any relevant notes..."
              rows="3"
              className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <FormButton type="submit" variant="success">Record Loss</FormButton>
        </form>
      </Card>

      {/* Loss Statistics */}
      {stats.length > 0 && (
        <Card title="Loss Statistics by Reason">
          <Table
            headers={['Reason', 'Count', 'Total Quantity', 'Percentage']}
            rows={stats.map(stat => ({
              'Reason': stat.reason.charAt(0).toUpperCase() + stat.reason.slice(1),
              'Count': stat.count,
              'Total Quantity': stat.total_quantity,
              'Percentage': `${((stat.total_quantity / totalLoss) * 100).toFixed(1)}%`,
            }))}
          />
        </Card>
      )}

      {/* Loss History */}
      <Card title="Loss History">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2 text-left">Batch</th>
                <th className="border px-3 py-2 text-left">Quantity Lost</th>
                <th className="border px-3 py-2 text-left">Reason</th>
                <th className="border px-3 py-2 text-left">Loss Date</th>
                <th className="border px-3 py-2 text-left">Notes</th>
                <th className="border px-3 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {losses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="border px-3 py-2 text-center text-gray-500">
                    No loss records yet
                  </td>
                </tr>
              ) : (
                losses.map(loss => (
                  <tr key={loss.id} className="hover:bg-gray-50">
                    <td className="border px-3 py-2">{loss.supplier_name || '-'}</td>
                    <td className="border px-3 py-2">{loss.quantity_lost}</td>
                    <td className="border px-3 py-2">
                      <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                        {loss.reason}
                      </span>
                    </td>
                    <td className="border px-3 py-2">{loss.loss_date}</td>
                    <td className="border px-3 py-2">{loss.notes || '-'}</td>
                    <td className="border px-3 py-2">
                      <button
                        onClick={() => handleDelete(loss.id)}
                        className="text-red-600 hover:text-red-800 transition"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
