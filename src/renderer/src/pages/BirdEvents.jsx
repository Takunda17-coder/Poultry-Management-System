import { useEffect, useState } from 'react';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { FormInput, FormSelect, FormButton, Card, Table, FormTextarea } from '../components/FormComponents';

export default function BirdEvents() {
  const [events, setEvents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    batch_id: '',
    event_type: 'mortality',
    quantity: '',
    event_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allEvents, allBatches] = await Promise.all([
        window.api.birdEvents.getAll(),
        window.api.broiler.listBatches()
      ]);
      setEvents(allEvents || []);
      setBatches(allBatches || []);
    } catch (error) {
      console.error('Error loading bird events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await window.api.birdEvents.record({
        ...formData,
        batch_id: Number(formData.batch_id),
        quantity: Number(formData.quantity)
      });
      alert('Event recorded successfully!');
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error recording event:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this event?')) {
      try {
        await window.api.birdEvents.delete(id);
        loadData();
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      batch_id: '',
      event_type: 'mortality',
      quantity: '',
      event_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowForm(false);
  };

  const getMortalityRate = () => {
    let totalReceived = 0;
    let totalMortality = 0;
    
    batches.forEach(batch => {
      totalReceived += batch.quantity_received;
      const batchMortality = events
        .filter(e => e.batch_id === batch.id && e.event_type === 'mortality')
        .reduce((sum, e) => sum + e.quantity, 0);
      totalMortality += batchMortality;
    });
    
    return totalReceived > 0 ? ((totalMortality / totalReceived) * 100).toFixed(2) : 0;
  };

  const getTotalMortality = () => {
    return events
      .filter(e => e.event_type === 'mortality')
      .reduce((sum, e) => sum + e.quantity, 0);
  };

  const getTotalHomeUse = () => {
    return events
      .filter(e => e.event_type === 'home_use')
      .reduce((sum, e) => sum + e.quantity, 0);
  };

  if (loading) return <div className="p-8 text-center">Loading bird events...</div>;

  const tableRows = events.map(event => ({
    'Batch': event.batch_code || `Batch #${event.batch_id}`,
    'Type': event.event_type === 'mortality' ? '🔴 Mortality' : '🏠 Home Use',
    'Quantity': event.quantity,
    'Date': event.event_date,
    'Notes': event.notes || '-'
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <AlertTriangle className="text-red-600" />
          Bird Events & Health Tracking
        </h1>
        <FormButton onClick={() => setShowForm(!showForm)} variant="primary">
          <Plus className="inline mr-2" size={20} /> Record Event
        </FormButton>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Mortality</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{getTotalMortality()}</p>
            </div>
            <AlertTriangle className="text-red-500" size={40} />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Home Use</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{getTotalHomeUse()}</p>
            </div>
            <div className="text-4xl">🏠</div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Overall Mortality Rate</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{getMortalityRate()}%</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </Card>
      </div>

      {/* Record Event Form */}
      {showForm && (
        <Card title="Record New Bird Event">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelect
                label="Batch"
                value={formData.batch_id}
                onChange={(e) => setFormData(prev => ({ ...prev, batch_id: e.target.value }))}
                options={[
                  { value: '', label: 'Select Batch' },
                  ...batches.map(b => ({ value: b.id, label: `${b.batch_code || `Batch #${b.id}`} (${b.quantity_received} birds)` }))
                ]}
                required
              />
              <FormSelect
                label="Event Type"
                value={formData.event_type}
                onChange={(e) => setFormData(prev => ({ ...prev, event_type: e.target.value }))}
                options={[
                  { value: 'mortality', label: 'Mortality (Death)' },
                  { value: 'home_use', label: 'Home Use (Consumption)' }
                ]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                type="number"
                label="Quantity"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                required
              />
              <FormInput
                type="date"
                label="Event Date"
                value={formData.event_date}
                onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                required
              />
            </div>

            <FormTextarea
              label="Notes (optional)"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any relevant notes..."
              rows="3"
            />

            <div className="flex gap-3 pt-4">
              <FormButton type="submit" variant="success" className="flex-1">Record Event</FormButton>
              <FormButton type="button" onClick={resetForm} variant="secondary" className="flex-1">Cancel</FormButton>
            </div>
          </form>
        </Card>
      )}

      {/* Events History */}
      <Card title="Event History">
        <Table
          headers={['Batch', 'Type', 'Quantity', 'Date', 'Notes']}
          rows={tableRows}
          actions={(row) => (
            <button
              className="text-red-600 hover:text-red-700"
              onClick={() => {
                const event = events.find(e => e.batch_code === row['Batch'] || `Batch #${e.batch_id}` === row['Batch']);
                if (event) handleDelete(event.id);
              }}
            >
              <Trash2 size={18} />
            </button>
          )}
        />
      </Card>

      {/* Batch Health Summary */}
      <Card title="Batch Status Overview">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Batch Code</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Received</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Mortality</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Home Use</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {batches.map((batch) => {
                const mortality = events
                  .filter(e => e.batch_id === batch.id && e.event_type === 'mortality')
                  .reduce((sum, e) => sum + e.quantity, 0);
                const homeUse = events
                  .filter(e => e.batch_id === batch.id && e.event_type === 'home_use')
                  .reduce((sum, e) => sum + e.quantity, 0);
                const available = batch.quantity_received - mortality - homeUse;
                const rate = ((mortality / batch.quantity_received) * 100).toFixed(1);

                return (
                  <tr key={batch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {batch.batch_code || `Batch #${batch.id}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{batch.quantity_received}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="text-red-600 font-semibold">{mortality}</span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="text-yellow-600 font-semibold">{homeUse}</span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded text-white font-semibold ${
                        rate < 5 ? 'bg-green-600' : rate < 10 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}>
                        {rate}% mortality
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
