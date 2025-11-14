import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Copy, MessageSquare, AlertCircle } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { getContract } from '../utils/blockchain';

interface AuthRequest {
  id: string;
  institution_name: string;
  wallet_address: string;
  email: string;
  phone: string;
  description: string;
  status: string;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export default function AuthorizationRequests() {
  const [requests, setRequests] = useState<AuthRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const [selectedRequest, setSelectedRequest] = useState<AuthRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchRequests = async () => {
    try {
      let query = supabase
        .from('institution_authorization_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    setError(null);
    setSuccess(null);

    try {
      const request = requests.find(r => r.id === id);
      if (!request) {
        throw new Error('Request not found');
      }

      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      const contract = await getContract();

      const tx = await contract.authorizeInstitution(request.wallet_address);
      await tx.wait();

      const { error: dbError } = await supabase
        .from('institution_authorization_requests')
        .update({
          status: 'approved',
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (dbError) throw dbError;

      setSuccess(`Institution ${request.institution_name} has been authorized on blockchain!`);
      setSelectedRequest(null);
      setAdminNotes('');
      fetchRequests();

      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('Error approving request:', err);
      setError(err.message || 'Failed to authorize institution');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from('institution_authorization_requests')
        .update({
          status: 'rejected',
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      setSelectedRequest(null);
      setAdminNotes('');
      fetchRequests();
    } catch (err) {
      console.error('Error rejecting request:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const copyToClipboard = (text: string, address: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 border-green-200';
      case 'rejected':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  const filteredRequests = filterStatus === 'all' ? requests : requests.filter(r => r.status === filterStatus);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-red-900">Error</h4>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-green-900">Success</h4>
            <p className="text-sm text-green-700 mt-1">{success}</p>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="text-green-400 hover:text-green-600"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Institution Authorization Requests</h2>

        <div className="flex flex-wrap gap-2 mb-6">
          {(['all', 'pending', 'approved', 'rejected'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => {
                setFilterStatus(status);
                setSelectedRequest(null);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-2 inline-block bg-opacity-20 px-2 py-1 rounded text-xs">
                {status === 'all' ? requests.length : requests.filter(r => r.status === status).length}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No {filterStatus !== 'all' ? filterStatus : ''} requests found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className={`border rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                  selectedRequest?.id === request.id
                    ? `${getStatusColor(request.status)} border-opacity-100`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  setSelectedRequest(request);
                  setAdminNotes(request.admin_notes);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(request.status)}
                      <h3 className="text-lg font-semibold text-gray-900">{request.institution_name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{request.email} • {request.phone}</p>
                    <p className="text-sm text-gray-700 mb-3">{request.description}</p>
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-600 mb-1">Wallet Address:</p>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm font-mono text-gray-800 break-all flex-1">{request.wallet_address}</code>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(request.wallet_address, request.wallet_address);
                          }}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                        >
                          <Copy className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                      {copiedAddress === request.wallet_address && (
                        <p className="text-xs text-green-600 mt-2">Copied!</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Submitted: {new Date(request.created_at).toLocaleDateString()} at {new Date(request.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {selectedRequest?.id === request.id && (
                  <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                        <MessageSquare className="w-4 h-4" />
                        Admin Notes
                      </label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Add notes about this request..."
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    {request.status === 'pending' && (
                      <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs text-blue-800">
                            Clicking Approve will trigger MetaMask to authorize this institution on the blockchain.
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(request.id);
                            }}
                            disabled={processingId === request.id}
                            className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {processingId === request.id ? 'Authorizing on Blockchain...' : 'Approve & Authorize'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(request.id);
                            }}
                            disabled={processingId === request.id}
                            className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            {processingId === request.id ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
