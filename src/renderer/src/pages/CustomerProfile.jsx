import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, CreditCard, Coins, Receipt } from 'lucide-react';

export default function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCustomerDetails();
  }, [id]);

  const loadCustomerDetails = async () => {
    setIsLoading(true);
    try {
      const data = await window.api.customers.getDetails(id);
      setCustomer(data);
    } catch (error) {
      console.error("Failed to load customer details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-10 text-gray-500">Loading customer profile...</div>;
  }

  if (!customer) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-bold text-gray-700">Customer not found</h2>
        <button onClick={() => navigate('/customers')} className="mt-4 text-blue-600 hover:underline">
          Return to Customers
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate('/customers')}
          className="p-2 hover:bg-gray-200 rounded-full transition"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
          <p className="text-gray-500 text-sm">Customer Profile & History</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-1">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold mb-4">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-gray-900 text-center">{customer.name}</h2>
            <p className="text-sm text-gray-500 mt-1">Customer ID: #{customer.id}</p>
            <p className="text-xs text-gray-400 mt-1">
              Added: {new Date(customer.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3 text-sm">
              <Phone className="text-gray-400 mt-0.5" size={18} />
              <div>
                <p className="font-medium text-gray-900">Phone</p>
                <p className="text-gray-600">{customer.phone || 'Not provided'}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 text-sm">
              <Mail className="text-gray-400 mt-0.5" size={18} />
              <div>
                <p className="font-medium text-gray-900">Email</p>
                <p className="text-gray-600">{customer.email || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-sm">
              <MapPin className="text-gray-400 mt-0.5" size={18} />
              <div>
                <p className="font-medium text-gray-900">Address</p>
                <p className="text-gray-600">{customer.address || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats & History */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-red-100 flex items-center space-x-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                <CreditCard size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Debt</p>
                <p className="text-2xl font-bold text-gray-900">${customer.total_debt?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-sm border border-amber-100 flex items-center space-x-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                <Coins size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Change Pending</p>
                <p className="text-2xl font-bold text-gray-900">${customer.total_change?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>

          {/* Sales History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Receipt size={18} className="text-gray-500" />
                Transaction History
              </h3>
              <span className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                {customer.sales?.length || 0} Records
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Total Amount</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Paid</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Debt/Change</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {!customer.sales || customer.sales.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-5 py-8 text-center text-gray-500">
                        No transactions found for this customer.
                      </td>
                    </tr>
                  ) : (
                    customer.sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50 transition text-sm">
                        <td className="px-5 py-3">
                          {new Date(sale.sale_date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })}
                        </td>
                        <td className="px-5 py-3 font-medium text-gray-900">
                          ${sale.total_amount?.toFixed(2)}
                        </td>
                        <td className="px-5 py-3">
                          ${sale.amount_paid?.toFixed(2)}
                        </td>
                        <td className="px-5 py-3">
                          {sale.debt_amount > 0 && <span className="text-red-600 font-medium">Debt: ${sale.debt_amount.toFixed(2)}</span>}
                          {sale.change_amount > 0 && <span className="text-amber-600 font-medium">Change: ${sale.change_amount.toFixed(2)}</span>}
                          {sale.debt_amount === 0 && sale.change_amount === 0 && <span className="text-green-600 font-medium">Fully Paid</span>}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            sale.status === 'CLEARED' ? 'bg-green-100 text-green-700' :
                            sale.status === 'PARTIAL' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {sale.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
