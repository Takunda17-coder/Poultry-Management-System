import { useEffect, useState } from 'react';
import { Coins, DollarSign, AlertCircle, Check } from 'lucide-react';
import { FormButton, Card, Table } from '../components/FormComponents';

export default function Change() {
  const [changes, setChanges] = useState([]);
  const [totalChange, setTotalChange] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  async function loadData() {
    try {
      const [outstandingChanges, total] = await Promise.all([
        window.api.change.getOutstanding(),
        window.api.change.getTotalOutstanding()
      ]);
      setChanges(outstandingChanges || []);
      setTotalChange(total || 0);
    } catch (error) {
      console.error('Error loading change:', error);
      alert('Failed to load change data: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleReturnChange = async (changeRecord) => {
    if (!window.confirm(`Return change of $${changeRecord.change_amount.toFixed(2)} to ${changeRecord.customer_name}?`)) {
      return;
    }

    setProcessingId(changeRecord.id);
    try {
      await window.api.change.return(changeRecord.id);
      alert('Change returned successfully');
      await loadData();
    } catch (error) {
      console.error('Error returning change:', error);
      alert('Error: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading change data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Coins className="text-green-600" size={32} />
        <h1 className="text-3xl font-bold">Outstanding Customer Change</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Total Change Owed">
          <p className="text-3xl font-bold text-green-600">${totalChange.toFixed(2)}</p>
        </Card>
        <Card title="Customers Awaiting Change">
          <p className="text-3xl font-bold text-blue-600">{changes.length}</p>
        </Card>
        <Card title="Status">
          <p className="text-lg font-semibold text-yellow-600">
            {changes.length > 0 ? 'Action Required' : 'All Clear'}
          </p>
        </Card>
      </div>

      {/* Change Records Table */}
      <Card title="Awaiting Change Return">
        {changes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-green-600 text-lg font-semibold">✓ No outstanding change!</p>
          </div>
        ) : (
          <Table
            headers={['Customer', 'Phone', 'Sale Date', 'Sale Total', 'Change Amount']}
            rows={changes.map(change => ({
              'Customer': change.customer_name || '-',
              'Phone': change.customer_phone || '-',
              'Sale Date': change.sale_date,
              'Sale Total': `$${change.total_amount.toFixed(2)}`,
              'Change Amount': `$${change.change_amount.toFixed(2)}`,
            }))}
            actions={(row) => {
              const change = changes.find(c => c.customer_name === row['Customer'] && c.sale_date === row['Sale Date']);
              return (
                <button
                  onClick={() => handleReturnChange(change)}
                  disabled={processingId === change.id}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition flex items-center gap-1"
                  title="Mark as Returned"
                >
                  <Check size={16} />
                  {processingId === change.id ? 'Processing...' : 'Return'}
                </button>
              );
            }}
          />
        )}
      </Card>

      {/* Instructions */}
      <Card title="How to Use">
        <div className="bg-blue-50 p-4 rounded space-y-2 text-sm text-gray-700">
          <p>• <strong>Outstanding Customer Change</strong> displays cash change owed to customers from cash transactions</p>
          <p>• Click the <strong>Return</strong> button when you've returned the change to the customer</p>
          <p>• This will remove the record from the outstanding list</p>
          <p>• The total shows how much cash you're holding that belongs to customers</p>
        </div>
      </Card>
    </div>
  );
}
