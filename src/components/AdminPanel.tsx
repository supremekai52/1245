import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Loader2, UserCheck } from 'lucide-react';
import { connectWallet, switchToSepolia } from '../utils/blockchain';
import { ethers } from 'ethers';
import contractData from '../contracts/AcademicCredentials.json';
import AuthorizationRequests from './AuthorizationRequests';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'authorize' | 'requests'>('requests');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [institutionAddress, setInstitutionAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [authStatus, setAuthStatus] = useState<{ address: string; authorized: boolean } | null>(null);

  useEffect(() => {
    initWallet();
  }, []);

  const initWallet = async () => {
    const address = await connectWallet();
    if (address) {
      setWalletAddress(address);
      await switchToSepolia();
      await checkIfOwner(address);
    }
  };

  const checkIfOwner = async (address: string) => {
    try {
      if (!window.ethereum) return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        contractData.contractAddress,
        contractData.abi,
        provider
      );

      const ownerAddress = await contract.owner();
      setIsOwner(ownerAddress.toLowerCase() === address.toLowerCase());
    } catch (err) {
      console.error('Error checking owner:', err);
    }
  };

  const authorizeInstitution = async () => {
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      if (!institutionAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('Invalid Ethereum address');
      }

      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractData.contractAddress,
        contractData.abi,
        signer
      );

      const tx = await contract.authorizeInstitution(institutionAddress);
      await tx.wait();

      setSuccess(`Institution ${institutionAddress} has been authorized successfully!`);
      setInstitutionAddress('');
    } catch (err: any) {
      setError(err.message || 'Failed to authorize institution');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkAuthorization = async () => {
    setCheckingAuth(true);
    setAuthStatus(null);
    setError(null);

    try {
      if (!institutionAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('Invalid Ethereum address');
      }

      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        contractData.contractAddress,
        contractData.abi,
        provider
      );

      const authorized = await contract.authorizedInstitutions(institutionAddress);
      setAuthStatus({ address: institutionAddress, authorized });
    } catch (err: any) {
      setError(err.message || 'Failed to check authorization');
      console.error(err);
    } finally {
      setCheckingAuth(false);
    }
  };

  const authorizeSelf = async () => {
    if (walletAddress) {
      setInstitutionAddress(walletAddress);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center mb-6">
          <Shield className="w-8 h-8 text-blue-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
        </div>

        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'requests'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Authorization Requests
          </button>
          <button
            onClick={() => setActiveTab('authorize')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'authorize'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Manual Authorization
          </button>
        </div>

        {activeTab === 'requests' && (
          <AuthorizationRequests />
        )}

        {activeTab === 'authorize' && (
          <div>
            {!isOwner && walletAddress && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> You are not the contract owner. Only the contract owner can authorize institutions.
                </p>
                <p className="text-sm text-yellow-700 mt-2">
                  Connected Address: <span className="font-mono">{walletAddress}</span>
                </p>
              </div>
            )}

            {isOwner && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <p className="text-sm text-green-800">
                    You are the contract owner and can authorize institutions.
                  </p>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Institution Wallet Address
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={institutionAddress}
                onChange={(e) => setInstitutionAddress(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="0x..."
              />
              <button
                onClick={authorizeSelf}
                disabled={!walletAddress}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Use My Address
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter the Ethereum address of the institution you want to authorize
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={authorizeInstitution}
              disabled={loading || !isOwner || !institutionAddress}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Authorizing...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Authorize Institution
                </>
              )}
            </button>

            <button
              onClick={checkAuthorization}
              disabled={checkingAuth || !institutionAddress}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {checkingAuth ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                'Check Status'
              )}
            </button>
          </div>

          {authStatus && (
            <div className={`p-4 rounded-lg border ${authStatus.authorized ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center">
                {authStatus.authorized ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mr-2" />
                )}
                <div>
                  <p className={`text-sm font-medium ${authStatus.authorized ? 'text-green-900' : 'text-red-900'}`}>
                    {authStatus.authorized ? 'Institution is Authorized' : 'Institution is NOT Authorized'}
                  </p>
                  <p className={`text-xs mt-1 font-mono ${authStatus.authorized ? 'text-green-700' : 'text-red-700'}`}>
                    {authStatus.address}
                  </p>
                </div>
              </div>
            </div>
          )}
            </div>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Quick Setup Guide:</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Connect with the wallet address that deployed the contract (contract owner)</li>
                <li>Enter the institution's wallet address or click "Use My Address" to authorize yourself</li>
                <li>Click "Authorize Institution" and confirm the transaction in MetaMask</li>
                <li>Once authorized, that address can issue credentials from the Institution Dashboard</li>
              </ol>
            </div>

            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Contract Information:</h3>
              <div className="space-y-1">
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Contract Address:</span>
                  <br />
                  <span className="font-mono">{contractData.contractAddress}</span>
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  <span className="font-medium">Your Wallet:</span>
                  <br />
                  <span className="font-mono">{walletAddress || 'Not connected'}</span>
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  <span className="font-medium">Status:</span> {isOwner ? 'Contract Owner ✓' : 'Not Owner'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
