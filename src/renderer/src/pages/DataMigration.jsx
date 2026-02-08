import { useEffect, useState } from 'react';
import { Database, CheckCircle, AlertCircle, Save, Egg, Bird } from 'lucide-react';
import { FormSelect, FormButton, Card, Table } from '../components/FormComponents';

export default function DataMigration() {
  const [unassignedBroilers, setUnassignedBroilers] = useState([]);
  const [unassignedEggs, setUnassignedEggs] = useState([]);
  const [broilerBatches, setBroilerBatches] = useState([]);
  const [eggBatches, setEggBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [broilerAssignments, setBroilerAssignments] = useState({});
  const [eggAssignments, setEggAssignments] = useState({});
  const [activeTab, setActiveTab] = useState('broilers');
  const [broilerCompleted, setBroilerCompleted] = useState(false);
  const [eggCompleted, setEggCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [unassignedB, unassignedE, allBroilers, allEggs] = await Promise.all([
        window.api.sales.getUnassignedBroilers(),
        window.api.sales.getUnassignedEggs(),
        window.api.broiler.listBatches(),
        window.api.eggs.listBatches()
      ]);
      
      setUnassignedBroilers(unassignedB || []);
      setUnassignedEggs(unassignedE || []);
      setBroilerBatches(allBroilers || []);
      setEggBatches(allEggs || []);
      
      // Initialize assignments objects
      const broilerInit = {};
      (unassignedB || []).forEach(item => {
        broilerInit[item.id] = '';
      });
      setBroilerAssignments(broilerInit);

      const eggsInit = {};
      (unassignedE || []).forEach(item => {
        eggsInit[item.id] = '';
      });
      setEggAssignments(eggsInit);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBroilerBatchSelect = (saleItemId, batchId) => {
    setBroilerAssignments(prev => ({
      ...prev,
      [saleItemId]: batchId
    }));
  };

  const handleEggBatchSelect = (saleItemId, batchId) => {
    setEggAssignments(prev => ({
      ...prev,
      [saleItemId]: batchId
    }));
  };

  const handleSaveBroilerMigration = async () => {
    const unassignedCount = Object.values(broilerAssignments).filter(v => !v).length;
    if (unassignedCount > 0) {
      alert(`Please assign a batch to all ${unassignedCount} item(s)`);
      return;
    }

    setSaving(true);
    try {
      for (const [saleItemId, batchId] of Object.entries(broilerAssignments)) {
        if (batchId) {
          await window.api.sales.assignBroilerToBatch(Number(saleItemId), Number(batchId));
        }
      }
      alert('All broiler sales have been successfully assigned to batches!');
      setBroilerCompleted(true);
      loadData();
    } catch (error) {
      console.error('Error saving migration:', error);
      alert('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEggMigration = async () => {
    const unassignedCount = Object.values(eggAssignments).filter(v => !v).length;
    if (unassignedCount > 0) {
      alert(`Please assign a batch to all ${unassignedCount} item(s)`);
      return;
    }

    setSaving(true);
    try {
      for (const [saleItemId, batchId] of Object.entries(eggAssignments)) {
        if (batchId) {
          await window.api.sales.assignEggToBatch(Number(saleItemId), Number(batchId));
        }
      }
      alert('All egg sales have been successfully assigned to batches!');
      setEggCompleted(true);
      loadData();
    } catch (error) {
      console.error('Error saving migration:', error);
      alert('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading data...</div>;

  const allMigrationsComplete = unassignedBroilers.length === 0 && unassignedEggs.length === 0 && !broilerCompleted && !eggCompleted;
  const allCompleted = broilerCompleted && eggCompleted;

  if (allMigrationsComplete) {
    return (
      <div className="space-y-6 p-8">
        <div className="flex items-center gap-2">
          <CheckCircle className="text-green-600" size={32} />
          <h1 className="text-3xl font-bold">Data Already Migrated</h1>
        </div>
        <Card>
          <div className="text-center py-8">
            <p className="text-lg text-green-700">
              ✓ All broiler and egg sales are already assigned to batches!
            </p>
            <p className="text-gray-600 mt-2">
              Your historical data is current and accurate.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (allCompleted) {
    return (
      <div className="space-y-6 p-8">
        <div className="flex items-center gap-2">
          <CheckCircle className="text-green-600" size={32} />
          <h1 className="text-3xl font-bold">Migration Completed</h1>
        </div>
        <Card className="border-l-4 border-l-green-600">
          <div className="text-center py-8">
            <p className="text-lg text-green-700 font-semibold">
              ✓ All sales have been assigned to batches!
            </p>
            <p className="text-gray-600 mt-2">
              Your data is now fully accurate and batch-aware.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Database className="text-blue-600" size={32} />
        <h1 className="text-3xl font-bold">Data Migration - Assign to Batches</h1>
      </div>

      {/* Info */}
      <Card className="bg-yellow-50 border-l-4 border-l-yellow-600">
        <div className="flex gap-3">
          <AlertCircle className="text-yellow-600 flex-shrink-0 mt-1" size={20} />
          <div>
            <h3 className="font-semibold text-yellow-900">Historical Data Update</h3>
            <p className="text-sm text-yellow-800 mt-1">
              You have {unassignedBroilers.length} broiler and {unassignedEggs.length} egg sale(s) that need batch assignment.
              This ensures your historical data is accurate and batch-aware for inventory tracking.
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('broilers')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold border-b-2 transition ${
            activeTab === 'broilers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Bird size={20} />
          Broilers ({unassignedBroilers.length})
        </button>
        <button
          onClick={() => setActiveTab('eggs')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold border-b-2 transition ${
            activeTab === 'eggs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Egg size={20} />
          Eggs ({unassignedEggs.length})
        </button>
      </div>

      {/* Broilers Tab */}
      {activeTab === 'broilers' && (
        <Card title="Assign Broilers to Batches">
          {unassignedBroilers.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="text-green-600 mx-auto mb-3" size={32} />
              <p className="text-green-700 font-semibold">✓ All broiler sales are assigned!</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {unassignedBroilers.map((item) => (
                  <div key={item.id} className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <div>
                        <p className="text-sm text-gray-600">Sale Date</p>
                        <p className="font-semibold">{item.sale_date}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Customer</p>
                        <p className="font-semibold">{item.customer_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Quantity</p>
                        <p className="font-semibold text-lg text-blue-600">{item.quantity} birds</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Batch</label>
                        <select
                          value={broilerAssignments[item.id] || ''}
                          onChange={(e) => handleBroilerBatchSelect(item.id, e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">-- Select Batch --</option>
                          {broilerBatches.map(batch => (
                            <option key={batch.id} value={batch.id}>
                              {batch.batch_code || `Batch #${batch.id}`} ({batch.quantity_received})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <FormButton
                  onClick={handleSaveBroilerMigration}
                  disabled={saving}
                  variant="success"
                  className="flex items-center gap-2"
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save Broiler Assignments'}
                </FormButton>
                <p className="text-sm text-gray-600 self-center">
                  {Object.values(broilerAssignments).filter(v => v).length} / {unassignedBroilers.length} assigned
                </p>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Eggs Tab */}
      {activeTab === 'eggs' && (
        <Card title="Assign Eggs to Batches">
          {unassignedEggs.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="text-green-600 mx-auto mb-3" size={32} />
              <p className="text-green-700 font-semibold">✓ All egg sales are assigned!</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {unassignedEggs.map((item) => (
                  <div key={item.id} className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                      <div>
                        <p className="text-sm text-gray-600">Sale Date</p>
                        <p className="font-semibold">{item.sale_date}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Customer</p>
                        <p className="font-semibold">{item.customer_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Quantity</p>
                        <p className="font-semibold text-lg text-blue-600">{item.quantity} crates</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Batch</label>
                        <select
                          value={eggAssignments[item.id] || ''}
                          onChange={(e) => handleEggBatchSelect(item.id, e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">-- Select Batch --</option>
                          {eggBatches.map(batch => (
                            <option key={batch.id} value={batch.id}>
                              {`Batch #${batch.id}`} ({batch.crates_received} crates)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <FormButton
                  onClick={handleSaveEggMigration}
                  disabled={saving}
                  variant="success"
                  className="flex items-center gap-2"
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save Egg Assignments'}
                </FormButton>
                <p className="text-sm text-gray-600 self-center">
                  {Object.values(eggAssignments).filter(v => v).length} / {unassignedEggs.length} assigned
                </p>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Summary */}
      <Card title="Summary">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <p className="text-sm text-gray-600">Unassigned Broiler Sales</p>
            <p className="text-3xl font-bold text-blue-600">{unassignedBroilers.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded border border-green-200">
            <p className="text-sm text-gray-600">Total Birds to Migrate</p>
            <p className="text-3xl font-bold text-green-600">
              {unassignedBroilers.reduce((sum, item) => sum + item.quantity, 0)}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded border border-purple-200">
            <p className="text-sm text-gray-600">Unassigned Egg Sales</p>
            <p className="text-3xl font-bold text-purple-600">{unassignedEggs.length}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded border border-orange-200">
            <p className="text-sm text-gray-600">Total Crates to Migrate</p>
            <p className="text-3xl font-bold text-orange-600">
              {unassignedEggs.reduce((sum, item) => sum + item.quantity, 0)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
