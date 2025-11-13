import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, Sparkles, X } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const platformKnowledge = {
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Getting Started & Onboarding
  // ─────────────────────────────────────────────────────────────────────────────
  'how do i sign up as a student': 'Students sign up for free:\n1. Click “Connect Wallet” on the homepage\n2. MetaMask will prompt you to connect\n3. Fill in your full name and email\n4. Your wallet becomes your permanent academic identity\nNo payment required – unlimited access for students.',
  
  'how do i request institution authorization': 'To become an authorized issuer:\n1. Go to “Institution → Request Authorization”\n2. Enter institution name, official website, and admin wallet address\n3. Submit the form\n4. Platform admin reviews (usually within 24h)\n5. Once approved, you can issue credentials immediately.',
  
  'what happens after i submit an authorization request': 'Your request enters the `institution_authorization_requests` table with status **pending**. The admin reviews supporting documents. You’ll receive an email when approved or rejected. Approved institutions gain the `MINTER` role in the smart contract.',
  
  'do i need to pay to become an authorized institution': 'Authorization itself is free. After approval you must subscribe to a paid plan (Basic/Pro/Enterprise) to issue credentials.',
  
  'how do i switch to sepolia testnet': 'The platform auto-switches your wallet:\n1. Click “Connect Wallet”\n2. If on another network, MetaMask shows “Switch to Sepolia”\n3. Approve the switch\nYou’ll stay on Sepolia for all transactions.',
  
  'where can i get free sepolia eth': 'Use any public faucet:\n• https://sepoliafaucet.com\n• https://faucet.sepolia.dev\n• https://faucet.quicknode.com/sepolia\nPaste your address, solve captcha, receive 0.5–2 Sepolia ETH (free, no real value).',

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Credential Issuance
  // ─────────────────────────────────────────────────────────────────────────────
  'what file types can i upload for a credential': 'Supported formats: **PDF**, **PNG**, **JPG/JPEG**. Max size per file: 10 MB.',
  
  'can i issue multiple credentials in one transaction': 'Each credential is minted individually (one transaction per NFT). Bulk upload is planned for Enterprise tier in Phase 2.',
  
  'what information is required to issue a credential': 'Required fields:\n- Student wallet address\n- Full name\n- Degree title\n- Institution name\n- Graduation year\n- Document file (PDF/PNG/JPG)',
  
  'how long does it take to issue a credential': 'Average ~15 seconds (IPFS upload ~5-10s + blockchain confirmation ~5s).',
  
  'is there a limit on how many credentials i can issue': 'Depends on your plan:\n• Basic – 100/month\n• Pro – 500/month\n• Enterprise – unlimited',
  
  'what happens if the transaction fails': 'If MetaMask rejects or gas is insufficient:\n1. The document stays in IPFS (you keep the hash)\n2. No NFT is minted\n3. You can retry with higher gas or correct inputs.',
  
  'can i edit a credential after issuing': 'No. Blockchain is immutable. To correct, revoke the old token and issue a new one.',
  
  'how do i know the credential was minted successfully': 'After transaction confirmation you’ll see:\n- Success toast\n- Token ID displayed\n- Entry in “Issued Credentials” table\n- Event logged in audit trail',

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Soulbound Tokens (SBT)
  // ─────────────────────────────────────────────────────────────────────────────
  'why are credentials non-transferable': 'Soulbound tokens use a custom `_update` override that reverts any transfer except minting (from address 0). This guarantees the degree stays with the original student forever.',
  
  'can a soulbound token be burned': 'Only the contract owner (platform) can burn a token for cleanup. Issuers can only **revoke** (mark as invalid).',
  
  'what is the difference between revoke and burn': '• **Revoke** – marks token as invalid, keeps history\n• **Burn** – removes token completely (rare, admin only)',
  
  'can a student transfer a credential to another wallet': 'No. Any attempt triggers “Soulbound: Token is non-transferable” error.',
  
  'are soulbound tokens visible on opensea': 'Yes, but they show “Non-Transferable” and cannot be listed for sale.',

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Verification & Sharing
  // ─────────────────────────────────────────────────────────────────────────────
  'how does a university verify a credential': '1. Student sends QR code or share link\n2. University opens link → Verification Portal\n3. System reads token ID → queries contract\n4. Shows: degree, issue date, institution, revocation status, IPFS doc\n5. All in <2 seconds.',
  
  'do verifiers need a wallet to check a credential': 'No. Verification portal is public; no login or wallet required.',
  
  'how long do share links stay active': 'Default: 24 hours. You can set 1h, 6h, 24h, 7 days, or custom expiration.',
  
  'can i see who accessed my share link': 'Yes. In Student Dashboard → “Access Logs” you see:\n- Timestamp\n- IP (anonymized)\n- Institution name (if provided)\n- Access count',
  
  'what happens when a share link expires': 'The link returns “Expired” and no data is shown. All access is blocked.',
  
  'can i revoke a share link before it expires': 'Yes. Click “Revoke Link” next to any active share; it is invalidated instantly.',
  
  'is the original document downloadable by verifiers': 'Yes, the IPFS link opens the PDF/PNG in the browser. The hash is shown for integrity check.',
  
  'how do i generate a qr code for a credential': 'In Student Wallet → select credential → “Share” → “QR Code”. A printable PNG is generated instantly.',

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Student Experience
  // ─────────────────────────────────────────────────────────────────────────────
  'how do i view my credentials in 3d': 'Open Student Wallet → toggle “3D Showcase”. Use mouse to rotate, flip, or switch between Grid/Stack/Focus views.',
  
  'can i export my entire academic portfolio': 'Yes. Click “Export Portfolio” → downloads a ZIP with:\n- All PDFs\n- Verification report (JSON)\n- QR code sheet',
  
  'do credentials appear automatically in my wallet': 'Yes. After the institution mints the NFT it appears under “Collectibles” in MetaMask and in your platform dashboard.',
  
  'what if i lose access to my wallet': 'Credentials are tied to the private key. Use seed phrase backup. Platform cannot recover lost keys.',
  
  'can i link multiple wallets to one profile': 'Currently one wallet per profile. Multi-wallet support planned for Phase 3.',

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Institution Dashboard
  // ─────────────────────────────────────────────────────────────────────────────
  'how do i see all credentials i have issued': 'Institution Dashboard → “Issued Credentials” table. Filter by student, degree, date, or status.',
  
  'can i bulk revoke credentials': 'Enterprise plan only: upload CSV of token IDs → bulk revoke transaction.',
  
  'what analytics are available for institutions': 'Live charts:\n- Credentials issued (daily/weekly)\n- Verification rate\n- Top degrees\n- Student enrollment heatmap',
  
  'how do i add another admin for my institution': 'Institution owner → “Team Management” → invite by email → assign role (Admin / Issuer).',

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. Admin & Operations
  // ─────────────────────────────────────────────────────────────────────────────
  'how do i approve an institution request': 'Admin Panel → “Authorization Requests” → review docs → click “Approve” or “Reject with notes”.',
  
  'what is the operations dashboard': 'Real-time system health:\n- Blockchain sync status\n- IPFS node health\n- Database latency\n- Active users\n- Revenue metrics',
  
  'can i see revenue per institution': 'Yes. Admin → “Billing” → filter by institution, plan, month.',
  
  'how are subscription payments processed': 'Stripe integration (not in MVP). Payments table tracks status, invoices, and usage quotas.',

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. Pricing & Subscriptions
  // ─────────────────────────────────────────────────────────────────────────────
  'what is promo code trinetra': 'Enter **TRINETRA** at checkout for **free trial access** (100 credentials for institutions, 50 verifications for employers).',
  
  'how do i upgrade my plan': 'Dashboard → “Billing” → select new tier → confirm payment → new limits apply instantly.',
  
  'is there a refund policy': '7-day money-back guarantee for monthly plans. Contact support@acadchain.com.',
  
  'do unused credentials roll over': 'No. Quotas reset monthly on the billing date.',
  
  'can i pay annually for a discount': 'Annual plans coming in Phase 2 – 2 months free.',

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. Security & Privacy
  // ─────────────────────────────────────────────────────────────────────────────
  'is my personal data stored on the blockchain': 'Only the **IPFS hash** and **token metadata** are on-chain. Personal data (name, email) is stored encrypted in Supabase with Row-Level Security.',
  
  'how is row level security enforced': 'Supabase RLS policies:\n- Students see only their own rows\n- Institutions see only their issued credentials\n- Admins have full read/write',
  
  'what happens if ipfs node goes down': 'Documents are pinned on Pinata + multiple public gateways. Platform falls back to alternative gateways automatically.',
  
  'are private keys ever sent to the server': 'Never. All signing happens in MetaMask; the frontend only receives signed transactions.',
  
  'does the platform comply with gdpr': 'Yes:\n- Data minimization\n- Right to revoke (token revocation)\n- Export & delete on request\n- Consent-based sharing',

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. Technical & Deployment
  // ─────────────────────────────────────────────────────────────────────────────
  'what is the contract address on sepolia': '0x4fc085056423592277734de8D10328C0875C9dA3',
  
  'how do i verify the smart contract on etherscan': 'Run:\n```bash\nnpx hardhat verify --network sepolia <CONTRACT_ADDRESS>\n```',
  
  'what environment variables are required': 'VITE_CONTRACT_ADDRESS\nVITE_PINATA_JWT\nVITE_PINATA_GATEWAY\nVITE_SUPABASE_URL\nVITE_SUPABASE_ANON_KEY',
  
  'how do i run database migrations locally': '```bash\nsupabase db push\n``` Applies all SQL files in `supabase/migrations/`.',
  
  'can i self-host the platform': 'Yes. Clone repo, set env vars, deploy frontend on Vercel/Netlify, point to your own Supabase project and Pinata account.',

  // ─────────────────────────────────────────────────────────────────────────────
  // 11. Testing
  // ─────────────────────────────────────────────────────────────────────────────
  'how do i run smart contract tests': '```bash\nnpx hardhat test\n``` Covers issuance, revocation, soulbound checks, access control.',
  
  'what demo accounts are available': 'Admin: admin@acadchain.com / admin123\nInstitution: institution@university.edu / inst123\nStudent: student@university.edu / student123\nVerifier: verifier@employer.com / verify123',

  // ─────────────────────────────────────────────────────────────────────────────
  // 12. Future Roadmap
  // ─────────────────────────────────────────────────────────────────────────────
  'when will mobile apps be released': 'Phase 2 (Q1 2026) – iOS & Android with biometric login and push notifications.',
  
  'will you support polygon or arbitrum': 'Yes, multi-chain deployment planned for lower gas fees. Bridge for cross-chain verification in Phase 3.',
  
  'is decentralized identity did planned': 'Phase 3 will implement W3C Verifiable Credentials and Self-Sovereign Identity (SSI).',
  
  'can micro-credentials be issued': 'Yes, same workflow – just use a different degree field (e.g., “Machine Learning Certificate”).',

  // ─────────────────────────────────────────────────────────────────────────────
  // 13. Miscellaneous
  // ─────────────────────────────────────────────────────────────────────────────
  'what is the maximum file size for uploads': '10 MB per document.',
  
  'how many verifications can an employer perform for free': 'Free tier: 0. Paid plans start at 50 verifications/month.',
  
  'is there an api for third-party integration': 'Public verification API available:\n`GET /api/verify?token=SHARE_TOKEN` returns JSON proof.',
  
  'where can i find the source code': 'GitHub: https://github.com/AcadChain/platform (MIT License).',
  
  'how do i report a bug': 'Open an issue on GitHub or email support@acadchain.com with steps to reproduce.',
  
  'is there a discord community': 'Yes – join via link in the footer: https://discord.gg/acadchain',
  
  'what is the current platform status': 'Production-ready MVP on Sepolia Testnet. Mainnet launch after pilot with 10 universities.',
  
  'can i use the platform for professional certifications': 'Absolutely. Any non-transferable achievement works – degrees, certificates, badges, licenses.',
  
  'does the platform support multiple languages': 'English only in MVP. i18n framework ready for future localisation.',
  
  'how do i change my email address': 'Student Dashboard → Profile → Edit Email → re-authenticate with wallet signature.'
};

const quickSuggestions = [
  'How do I issue a credential?',
  'How do students verify credentials?',
  'What is a soulbound token?',
  'How do I revoke a credential?',
  'What are the pricing plans?',
  'How does blockchain security work?'
];

export default function AIAssistantChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant for the Academic Credentials Platform. I can help you with questions about credential issuance, verification, blockchain technology, and platform features. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const findBestMatch = (query: string): string => {
    const normalizedQuery = query.toLowerCase().trim();

    for (const [key, answer] of Object.entries(platformKnowledge)) {
      if (normalizedQuery.includes(key) || key.includes(normalizedQuery)) {
        return answer;
      }
    }

    if (normalizedQuery.includes('credential') && normalizedQuery.includes('issue')) {
      return platformKnowledge['how do i issue a credential'];
    }
    if (normalizedQuery.includes('verify') || normalizedQuery.includes('verification')) {
      return platformKnowledge['how do students verify their credentials'];
    }
    if (normalizedQuery.includes('soulbound') || normalizedQuery.includes('sbt')) {
      return platformKnowledge['what is a soulbound token'];
    }
    if (normalizedQuery.includes('revoke') || normalizedQuery.includes('cancel')) {
      return platformKnowledge['how do i revoke a credential'];
    }
    if (normalizedQuery.includes('wallet') || normalizedQuery.includes('metamask')) {
      return platformKnowledge['how do i connect my wallet'];
    }
    if (normalizedQuery.includes('price') || normalizedQuery.includes('cost') || normalizedQuery.includes('plan')) {
      return platformKnowledge['what are pricing plans'];
    }
    if (normalizedQuery.includes('security') || normalizedQuery.includes('safe')) {
      return platformKnowledge['how does blockchain security work'];
    }
    if (normalizedQuery.includes('ipfs')) {
      return platformKnowledge['what is ipfs'];
    }
    if (normalizedQuery.includes('testnet') || normalizedQuery.includes('sepolia') || normalizedQuery.includes('eth')) {
      return platformKnowledge['how do i get testnet eth'];
    }

    return 'I\'m not sure about that specific question. I can help you with:\n\n- Issuing credentials\n- Verifying credentials\n- Understanding soulbound tokens\n- Revoking credentials\n- Wallet connection\n- Pricing plans\n- Blockchain security\n- IPFS and document storage\n- Getting testnet ETH\n\nPlease ask me about any of these topics!';
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      const response = findBestMatch(input);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setLoading(false);
    }, 500);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => handleSend(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Chat cleared! How can I help you with the Academic Credentials Platform?',
        timestamp: new Date()
      }
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-2xl border border-gray-700">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">AI Assistant</h3>
            <p className="text-xs text-gray-400">Ask me anything about the platform</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          title="Clear chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-100'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-semibold text-green-400">AI Assistant</span>
                </div>
              )}
              <p className="text-sm whitespace-pre-line">{message.content}</p>
              <p className="text-xs mt-2 opacity-60">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
                <span className="text-sm text-gray-300">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && (
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-400 mb-2">Quick suggestions:</p>
          <div className="grid grid-cols-2 gap-2">
            {quickSuggestions.slice(0, 4).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-left text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 p-2 rounded-lg transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            className="flex-1 bg-gray-700 text-white placeholder-gray-400 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          AI responses are based on platform documentation
        </p>
      </div>
    </div>
  );
}
  