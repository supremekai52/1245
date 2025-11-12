import { useState, useEffect } from 'react';
import { Upload, CheckCircle, Loader2, TrendingUp, Award, Users, Tabs } from 'lucide-react';
import { IssuanceFormData } from '../types/credential';
import { uploadToIPFS } from '../utils/ipfs';
import { issueCredential, connectWallet, switchToSepolia } from '../utils/blockchain';
import { saveCredential, getInstitutionStats } from '../utils/supabase';
import InstitutionRegistration from './InstitutionRegistration';

export default function InstitutionDashboard() {
  const [activeTab, setActiveTab] = useState<'issue' | 'register'>('issue');
  const [formData, setFormData] = useState<IssuanceFormData>({
    studentName: '',
    studentAddress: '',
    degree: '',
    institution: '',
    graduationYear: '',
    document: null,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ tokenId: string; txHash: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalIssued: 0, totalRevoked: 0, recentIssued: 0 });

  useEffect(() => {
    initWallet();
  }, []);

  useEffect(() => {
    if (walletAddress) {
      loadStats();
    }
  }, [walletAddress]);

  const initWallet = async () => {
    const address = await connectWallet();
    if (address) {
      setWalletAddress(address);
      await switchToSepolia();
    }
  };

  const loadStats = async () => {
    if (walletAddress) {
      const institutionStats = await getInstitutionStats(walletAddress);
      setStats(institutionStats);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, document: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      if (!formData.document) {
        throw new Error('Please upload a document');
      }

      if (!formData.studentAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('Invalid Ethereum address');
      }

      const ipfsHash = await uploadToIPFS(formData.document);

      const result = await issueCredential(
        formData.studentAddress,
        ipfsHash,
        `${formData.degree} (${formData.graduationYear})`,
        formData.institution
      );

      if (walletAddress) {
        await saveCredential(
          result.tokenId,
          formData.studentAddress,
          formData.institution,
          walletAddress,
          `${formData.degree} (${formData.graduationYear})`,
          ipfsHash,
          new Date()
        );
        await loadStats();
      }

      setSuccess(result);
      setFormData({
        studentName: '',
        studentAddress: '',
        degree: '',
        institution: '',
        graduationYear: '',
        document: null,
      });

      const fileInput = document.getElementById('document-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      setError(err.message || 'Failed to issue credential');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {walletAddress && activeTab === 'issue' && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Issued</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalIssued}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Recent (30 days)</p>
                <p className="text-3xl font-bold text-gray-900">{stats.recentIssued}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalIssued - stats.totalRevoked}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('issue')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'issue'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Issue Credential
        </button>
        <button
          onClick={() => setActiveTab('register')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'register'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Authorization Request
        </button>
      </div>

      {activeTab === 'issue' && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Issue Academic Credential</h2>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-green-900 mb-1">Credential Issued Successfully</h3>
                <p className="text-sm text-green-700 mb-2">Token ID: {success.tokenId}</p>
                <a
                  href={`https://sepolia.etherscan.io/tx/${success.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 hover:text-green-800 underline"
                >
                  View Transaction
                </a>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student Name
            </label>
            <input
              type="text"
              required
              value={formData.studentName}
              onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student Wallet Address
            </label>
            <input
              type="text"
              required
              value={formData.studentAddress}
              onChange={(e) => setFormData({ ...formData, studentAddress: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="0x..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Institution Name
            </label>
            <input
              type="text"
              required
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="University of Technology"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Degree / Program
              </label>
              <input
                type="text"
                required
                value={formData.degree}
                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Bachelor of Science"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year of Graduation
              </label>
              <input
                type="text"
                required
                value={formData.graduationYear}
                onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="2024"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Document
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="document-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="document-upload"
                      name="document-upload"
                      type="file"
                      className="sr-only"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      required
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
                {formData.document && (
                  <p className="text-sm text-green-600 mt-2">Selected: {formData.document.name}</p>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Issuing Credential...
              </>
            ) : (
              'Issue Credential'
            )}
          </button>
        </form>
        </div>
      )}

      {activeTab === 'register' && (
        <InstitutionRegistration />
      )}
    </div>
  );
}
