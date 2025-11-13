import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { Bot, Send, Loader2, Sparkles, X } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// FULL RESTORED KNOWLEDGE BASE — EVERY QUESTION INCLUDED
const platformKnowledge: Record<string, string> = {
  // ──────────────────────────────────────────────────────────────
  // 1. Credential Issuance
  // ──────────────────────────────────────────────────────────────
  'how do i issue a credential': `To issue a credential, you need to:
1. Be an authorized institution (request authorization from the admin)
2. Go to the Institution Dashboard
3. Fill in student details: name, wallet address, degree, institution name, and graduation year
4. Upload the credential document (PDF, PNG, or JPG)
5. Click "Issue Credential" and approve the transaction in MetaMask
The credential will be minted as a soulbound token on the Sepolia blockchain and sent to the student's wallet.`,

  'who can issue credentials': `Only institutions that have been explicitly authorized by the platform admin can mint credentials.
Submit an authorization request with your institution name and wallet address; once approved you will be able to issue unlimited credentials (subject to your subscription tier).`,

  'what file types can i upload for a credential': `Supported formats:
- PDF (transcripts, certificates)
- PNG
- JPG/JPEG
Maximum file size: 10 MB (adjustable in Pinata settings).`,

  'what happens after i click issue credential': `1. Document is uploaded to IPFS via Pinata → you receive a CID (e.g., QmX…).
2. Smart-contract \`issueCredential()\` is called with the CID, student address, degree, and institution data.
3. Transaction is mined → NFT (soulbound) is minted to the student’s wallet.
4. Database row is created for fast lookup.
5. Audit log entry is recorded.`,

  'do i need sepolia eth to issue a credential': `Yes. Issuing a credential requires a blockchain transaction.
You need a small amount of Sepolia ETH (free from faucets) to pay gas.
Estimated cost on testnet: 0 (free).`,

  // ──────────────────────────────────────────────────────────────
  // 2. Student Side
  // ──────────────────────────────────────────────────────────────
  'how do students receive credentials': `1. Institution issues the credential to the student’s wallet address.
2. Student connects the same wallet on the platform.
3. Credential appears instantly in the **Student Wallet** dashboard.
4. Student can view it in 2D, 3D showcase, generate QR/share link, etc.`,

  'how do i view my credentials': `Connect your MetaMask wallet → go to **Student Dashboard → My Credentials**.
You’ll see:
- Token ID
- Degree & Institution
- Issue date
- 3D interactive card (hover to rotate)
- QR code & share button`,

  'how do i generate a share link': `1. Open the credential in your wallet.
2. Click **Share** → set expiration (1 h – 30 days) and optional recipient name.
3. Click **Create Link** → copy the URL (e.g., \`https://platform.com/verify?token=abc123\`).
4. Send it to the university/employer.`,

  'can i revoke a share link': `Yes. Go to **Shared Links** tab → find the link → click **Revoke**.
All future accesses will be denied, and the action is logged.`,

  'what happens when a share link expires': `After the expiry timestamp:
- The link returns “Link expired”.
- Access count stops incrementing.
- The event is logged in the audit trail.`,

  // ──────────────────────────────────────────────────────────────
  // 3. Verification
  // ──────────────────────────────────────────────────────────────
  'how does verification work': `1. Verifier receives QR code or share link.
2. Scans/clicks → lands on Verification Portal.
3. System reads token ID → queries \`getCredentialMetadata(tokenId)\` on-chain.
4. Checks:
   - Token exists & is owned by claimed address
   - Not revoked
   - Issuer is authorized
   - IPFS hash matches stored document
5. Displays result + PDF link + blockchain tx proof.`,

  'how long does verification take': `Typically **< 2 seconds** (cached DB + on-chain read).
Even on first access, full verification completes in **≤ 5 seconds** including IPFS fetch.`,

  'can a verifier see my personal data': `No. Only the following are shown:
- Institution name
- Degree title
- Issue date
- Revocation status
- Document (PDF/image) via IPFS
Personal details (email, full name) are **never** exposed to verifiers.`,

  // ──────────────────────────────────────────────────────────────
  // 4. Soulbound Tokens
  // ──────────────────────────────────────────────────────────────
  'what is a soulbound token': `A Soulbound Token (SBT) is a non-transferable NFT that represents achievements or credentials. Key features:
- Cannot be transferred or sold
- Permanently bound to the recipient’s wallet
- Proves ownership and authenticity
- Can be revoked by the issuer if needed
- Stored on blockchain for permanent verification
This makes them perfect for academic credentials since degrees should not be transferable between people.`,

  'can a soulbound token be transferred': `No. The smart contract overrides \`_update\` to revert any transfer where both \`from\` and \`to\` are non-zero addresses.`,

  'can i approve someone to transfer my credential': `No. \`setApprovalForAll\` and \`approve\` functions are disabled for soulbound tokens.`,

  // ──────────────────────────────────────────────────────────────
  // 5. Revocation
  // ──────────────────────────────────────────────────────────────
  'how do i revoke a credential': `To revoke a credential:
1. Go to Institution Dashboard
2. Find the credential by token ID or student address
3. Click "Revoke" button
4. Confirm the revocation
5. Approve the blockchain transaction in MetaMask
Once revoked, the credential will show as "REVOKED" in all verifications, and all active share links will be invalidated. This is irreversible.`,

  'is revocation reversible': `No. Once a credential is revoked on-chain, the \`revoked\` flag is set permanently.
A new credential can be issued if needed.`,

  'what does a verifier see for a revoked credential': `- Large **REVOKED** badge
- Original metadata (degree, institution, issue date)
- Revocation timestamp
- Link to revocation transaction on Etherscan`,

  // ──────────────────────────────────────────────────────────────
  // 6. Wallet & Network
  // ──────────────────────────────────────────────────────────────
  'how do i connect my wallet': `To connect your MetaMask wallet:
1. Install MetaMask browser extension if you haven’t
2. Create or import a wallet
3. Click "Connect Wallet" button on the platform
4. Approve the connection in MetaMask popup
5. System will automatically switch to Sepolia Testnet
You need Sepolia ETH for transactions. Get free testnet ETH from Sepolia faucets.`,

  'what network should i use': `**Sepolia Testnet** for development and demos.
Production will migrate to **Ethereum Mainnet** or **Polygon** (lower fees).`,

  'how do i switch to sepolia automatically': `The \`connectWallet()\` function calls \`wallet_switchEthereumChain\` with chainId \`0xaa36a7\`.
If the user does not have Sepolia, \`wallet_addEthereumChain\` is triggered with RPC, native currency, and block explorer URLs.`,

  'where can i get sepolia eth': `Free faucets:
- https://sepoliafaucet.com
- https://faucet.sepolia.dev
- https://faucet.quicknode.com/sepolia
Paste your address → request → wait a few minutes.`,

  // ──────────────────────────────────────────────────────────────
  // 7. Pricing & Subscriptions
  // ──────────────────────────────────────────────────────────────
  'what are the pricing plans': `Pricing is based on user type:
**Institutions:**
- Basic: $99.99/month (100 credentials)
- Pro: $299.99/month (500 credentials)
- Enterprise: $999.99/month (unlimited)
**Employers / Verifiers:**
- Basic: $49.99/month (50 verifications)
- Pro: $149.99/month (200 verifications)
**Students:** FREE with unlimited access
Use promo code **TRINETRA** for free trial access.`,

  'is there a free tier for institutions': `No, but the **TRINETRA** promo code gives a free trial period (check dashboard for duration).`,

  'how are verifications counted for employers': `Each successful verification (QR scan or share-link access) counts as **1 verification**.
Expired or revoked checks still count.`,

  'can i upgrade my plan mid-month': `Yes. Upgrade takes effect immediately; prorated credit is applied to the next billing cycle.`,

  // ──────────────────────────────────────────────────────────────
  // 8. Security & Privacy
  // ──────────────────────────────────────────────────────────────
  'how secure is the platform': `Multi-layer security:
1. **Blockchain** – immutable, decentralized
2. **Smart-contract** – role-based access, revocation, soulbound enforcement
3. **Database** – Row-Level Security (RLS), encrypted connections
4. **Frontend** – private keys never leave wallet, CSP, input validation
5. **IPFS** – content-addressed, distributed, tamper-proof`,

  'who owns the credential data': `The **student** owns the NFT (soulbound token) and controls sharing.
Institutions own the right to revoke.
Platform stores only hashes and metadata needed for verification.`,

  'is the platform gdpr compliant': `Yes:
- Students can revoke credentials (right to be forgotten)
- Share links are time-limited
- Personal data is encrypted at rest
- Audit logs available for data access requests`,

  // ──────────────────────────────────────────────────────────────
  // 9. IPFS & Document Storage
  // ──────────────────────────────────────────────────────────────
  'what is ipfs': `IPFS (InterPlanetary File System) is a decentralized file storage protocol:
- Documents stored across distributed network
- Content-addressable (files referenced by their hash)
- Permanently accessible and immutable
- No single point of failure
- Integrated with blockchain for verification
We use IPFS via Pinata to store credential documents (PDFs, certificates) while keeping the blockchain lightweight.`,

  'how long are documents stored on ipfs': `Forever, as long as at least one node (including Pinata) pins the file.
We pin every uploaded document on Pinata’s paid plan → guaranteed availability.`,

  'can a document be deleted from ipfs': `No. IPFS is immutable.
If a credential is revoked, the document remains accessible but the UI shows **REVOKED** status.`,

  // ──────────────────────────────────────────────────────────────
  // 10. Dashboard & Analytics
  // ──────────────────────────────────────────────────────────────
  'what can i see in the operations dashboard': `- Live issuance counter
- Verification heat-map
- Institution leaderboard
- System health (blockchain sync, IPFS, DB)
- Recent audit events
- Notification center`,

  'how do i export verification reports': `In the Verification Portal → after a successful check → click **Download Report**.
PDF includes:
- Credential details
- QR code
- Blockchain transaction link
- Timestamp & verifier IP (optional)`,

  // ──────────────────────────────────────────────────────────────
  // 11. Institution Authorization
  // ──────────────────────────────────────────────────────────────
  'how do i request institution authorization': `1. Go to **Institution → Request Authorization**
2. Fill: institution name, official website, admin wallet address, contact email
3. Submit → status becomes **Pending**
4. Platform admin reviews (manual or auto-approved)
5. On approval you receive an email and can start issuing.`,

  'how long does authorization take': `Typically **< 24 hours**.
Enterprise partners receive priority review.`,

  // ──────────────────────────────────────────────────────────────
  // 12. 3D Credential Showcase
  // ──────────────────────────────────────────────────────────────
  'what are the 3d viewing modes': `- **Grid View** – classic list
- **Stack View** – 3D stacked cards with depth
- **Focus View** – single credential spotlight with mouse-tracking rotation`,

  'can i embed the 3d showcase on my portfolio': `Yes. Use the **Embed Code** button → copy \`<iframe>\` snippet.`,

  // ──────────────────────────────────────────────────────────────
  // 13. Mobile & Future
  // ──────────────────────────────────────────────────────────────
  'is there a mobile app': `Planned for **Phase 2** (iOS & Android).
Current mobile experience works via browser with MetaMask app deep-linking.`,

  'will the platform support polygon': `Yes, **Phase 2** will deploy the same contract on Polygon for lower gas fees (~$0.01 per issuance).`,

  // ──────────────────────────────────────────────────────────────
  // 14. Technical & Developer Q&A
  // ──────────────────────────────────────────────────────────────
  'what is the contract address': `Sepolia Testnet: **0x4fc085056423592277734de8D10328C0875C9dA3**
(Will be updated for mainnet/Polygon deployment).`,

  'how do i verify the contract on etherscan': `Run:
\`\`\`bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
\`\`\`
Source code is already verified on Sepolia Etherscan.`,

  'what is the token standard used': `ERC-721 with OpenZeppelin extensions + custom soulbound logic.`,

  'can i issue micro-credentials or badges': `Planned for **Phase 3**. Current MVP supports only full degree/diploma credentials.`,

  'is there an api for institutions': `Not yet. Phase 3 will offer REST/GraphQL APIs for registrar-office integration.`,

  'how many credentials can be issued per transaction': `One per transaction (each \`issueCredential\` call mints a single NFT).`,

  'what is the gas cost on mainnet estimate': `~250,000 gas × $30/gwei ≈ **$7–$12** per credential (varies with network congestion).`,

  'do students need to pay gas': `No. Only the **issuer** (institution) pays gas for minting and revocation.`,

  'can a student have multiple credentials from different institutions': `Yes. Each credential is a separate NFT in the same wallet.`,

  'what happens if an institution closes': `The credential remains valid forever in the student’s wallet.
Only revocation (by the original issuer) can invalidate it.`,

  'is there a white-label option for universities': `Enterprise tier includes white-label branding (custom domain, logo, colors).`,

  'how do i contact support': `Email: **support@acadchain.com**
Response within 24 h (priority for Enterprise).`,

  'where can i see the audit trail': `Admin → **Audit Logs** (filter by action, actor, date).
All events are also emitted as blockchain events.`,

  'what browsers are supported': `Chrome ≥ 100, Firefox ≥ 98, Edge ≥ 100, Safari ≥ 15 (with MetaMask).`,

  'is metamask the only wallet supported': `Currently yes. Future support for WalletConnect (Phantom, Rainbow, etc.) planned.`,

  'can i bulk-issue credentials': `Enterprise dashboard offers CSV upload for bulk minting (up to 100 per file).`,

  'what is the maximum share-link duration': `30 days. Minimum 1 hour.`,

  'do share links count toward verification quotas': `Yes. Each access consumes one verification slot for employer plans.`,

  'how is rate-limiting implemented': `API: 100 req/min per IP.
Smart-contract: only authorized minters (no public rate limit).`,

  'is two-factor authentication available': `Yes (Supabase Auth) – email/password + optional TOTP.`,

  'can i change the wallet address linked to my profile': `No. Wallet address is the primary identifier (soulbound). Create a new profile with the new wallet.`,

  'what happens if i lose my wallet private key': `You lose access to all soulbound credentials.
Institutions cannot re-issue to a different address without revoking the old token first.`,

  'is the platform open source': `Frontend & smart-contract are MIT-licensed on GitHub.
Backend services (Supabase config, Pinata keys) are proprietary.`,

  'how do i contribute to the project': `1. Fork the repo
2. Create \`feature/xxx\` branch
3. Commit with tests
4. Open PR (follow contribution guidelines).`,

  'what is the current deployment status': `**Production-ready MVP** on Sepolia Testnet.
Mainnet/Polygon migration planned after pilot programs.`,

  'who are the target pilot partners': `Top 100 universities globally + large employers (Google, Microsoft, etc.).`,

  'what compliance standards are met': `- GDPR
- FERPA (compatible)
- Bologna Process
- UNESCO credential guidelines
- ERC-721`,

  'is there a demo video': `Yes – see **Documentation → Video Tutorials** on the platform.`,

  'how do i reset my password': `Click **Forgot Password** on login → enter email → receive reset link (valid 15 min).`,

  'can verifiers export data in csv': `Enterprise verifiers can export verification logs (date, token ID, result) via **Reports** tab.`,

  'what is the uptime sla': `99.9 % (monitored via Supabase & Vercel status pages).`,

  'how are database backups handled': `Supabase automatic daily backups (7-day retention) + point-in-time recovery.`,

  'is there a sandbox environment': `Sepolia Testnet serves as the sandbox. Use faucet ETH for unlimited testing.`,

  'can i simulate a revocation in testnet': `Yes. Issue a credential → revoke → verify the “REVOKED” status.`,

  'what is the token id format': `Sequential uint256 starting from 1 (e.g., \`1\`, \`2\`, …).`,

  'how do i find a credential by student name': `Use **Search** in Institution Dashboard (indexed by name + wallet).`,

  'is there dark mode': `Yes – the entire UI (including 3D showcase) respects system dark mode.`,

  'can i customize the credential card design': `Enterprise institutions can upload a custom background image (PNG, 1200×600 px).`,

  'what is the recommended screen size for 3d showcase': `≥ 768 px width for optimal mouse-tracking rotation.`,

  'does the platform support multiple languages': `English only in MVP. i18n hooks are in place for future localization.`,

  'how do i report a bug': `Open an issue on GitHub **Issues** tab or email **support@acadchain.com** with steps to reproduce.`,

  'is there a referral program': `Planned for Phase 3 – institutions earn free months for each successful referral.`,

  'what is the maximum number of active share links per credential': `Unlimited, but each link is tracked individually.`,

  'can i schedule automatic revocation': `Not yet. Manual revocation only (future automation via Chainlink Keepers).`,

  'how are timezones handled': `All timestamps are stored in UTC; UI converts to user’s local timezone.`,

  'is there a public api for verification': `Phase 3 will expose \`GET /verify/{token}\` returning JSON proof.`,

  'what is the database technology': `Supabase PostgreSQL with Row-Level Security (RLS) policies.`,

  'how is ipfs pinning managed': `Pinata “Pin by Hash” API called immediately after upload; pinned forever under paid plan.`,

  'can i download the original pdf from the platform': `Yes – click **Download Document** on any credential view (student or verifier).`,

  'is there a limit on document size': `10 MB per file (configurable in Pinata). Larger files require manual pinning.`,

  'what happens if ipfs gateway is down': `Fallback to secondary Pinata gateway + Cloudflare IPFS gateway. UI retries 3×.`,

  'how are errors communicated to users': `Toast notifications (success / error) + detailed error modal with transaction hash when applicable.`,

  'can i see gas price estimates before confirming': `Yes – MetaMask shows estimated gas; UI also displays approximate USD cost (via ethers.js).`,

  'is there a transaction history page': `Yes – **Wallet → Transactions** lists all contract interactions (issue, revoke, etc.).`,

  'what is the smart-contract version': `Solidity ^0.8.20 with OpenZeppelin 4.9.3.`,

  'how do i update the contract after deployment': `Upgradeable proxy pattern is prepared (UUPS). Future upgrades will be administered by multi-sig.`,

  'who controls the admin multi-sig': `Team + selected university partners (5-of-8).`,

  'is there a test coverage report': `Hardhat coverage ≥ 95 % for all critical paths.`,

  'what ci/cd pipeline is used': `GitHub Actions → lint → test → deploy to Vercel (frontend) + Hardhat verify (contract).`,

  'how do i run the project locally': `See **Installation & Setup** section in the documentation (clone, npm install, .env, npm run dev).`,

  'what environment variables are required': ```env
VITE_CONTRACT_ADDRESS=0x4fc...
VITE_PINATA_JWT=...
VITE_PINATA_GATEWAY=https://gateway.pinata.cloud
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```,

  'is there a docker compose file': `Yes – \`docker-compose.yml\` spins up Supabase local, Pinata mock, and Vite dev server.`,

  'how do i seed demo data': `Run \`supabase db seed\` after migrations. Demo accounts are listed under **Demo Credentials**.`,

  'what are the demo login credentials': `Admin: admin@acadchain.com / admin123
Institution: institution@university.edu / inst123
Student: student@university.edu / student123
Verifier: verifier@employer.com / verify123`,

  'can i change the demo data': `Yes – edit \`supabase/seed.sql\` and re-run \`supabase db reset\`.`,

  'is there a postman collection': `Yes – \`postman/AcademicCredentialsAPI.json\` contains all Supabase REST endpoints.`,

  'what is the license': `MIT License – see \`LICENSE\` file.`,

  'where can i find the project roadmap': `README → **Future Enhancements** (Phase 2 & 3).`,

  'how do i get notified of new features': `Subscribe to the **Newsletter** (footer) or follow **@AcadChain** on Twitter.`
};

const quickSuggestions = [
  'How do I issue a credential?',
  'How do students verify credentials?',
  'What is a soulbound token?',
  'How do I revoke a credential?',
  'What are the pricing plans?',
  'How does blockchain security work?',
  'How do I connect my wallet?',
  'How do I get Sepolia ETH?',
  'What is IPFS?',
  'How do I request institution authorization?'
];

// COMPONENT (UNCHANGED FROM PREVIOUS OPTIMIZED VERSION)
export default function AIAssistantChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hello! I'm your AI assistant for the Academic Credentials Platform. I can help you with questions about credential issuance, verification, blockchain technology, and platform features. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  useLayoutEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const findBestMatch = useCallback((query: string): string => {
    const normalized = query.toLowerCase().trim();

    for (const [key, answer] of Object.entries(platformKnowledge)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return answer;
      }
    }

    const keywords: Record<string, string> = {
      issue: 'how do i issue a credential',
      verify: 'how does verification work',
      soulbound: 'what is a soulbound token',
      sbt: 'what is a soulbound token',
      revoke: 'how do i revoke a credential',
      cancel: 'how do i revoke a credential',
      wallet: 'how do i connect my wallet',
      metamask: 'how do i connect my wallet',
      price: 'what are the pricing plans',
      cost: 'what are the pricing plans',
      plan: 'what are the pricing plans',
      security: 'how secure is the platform',
      safe: 'how secure is the platform',
      ipfs: 'what is ipfs',
      sepolia: 'where can i get sepolia eth',
      eth: 'where can i get sepolia eth',
      testnet: 'where can i get sepolia eth',
    };

    for (const [word, key] of Object.entries(keywords)) {
      if (normalized.includes(word)) {
        return platformKnowledge[key] || 'I’m not sure, but here’s what I know...';
      }
    }

    return `I'm not sure about that specific question. I can help you with:

- Issuing credentials
- Verifying credentials
- Understanding soulbound tokens
- Revoking credentials
- Wallet connection
- Pricing plans
- Blockchain security
- IPFS and document storage
- Getting testnet ETH

Please ask me about any of these topics!`;
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 600));

    const response = findBestMatch(userMessage.content);
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setLoading(false);
  }, [input, loading, findBestMatch]);

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
    setTimeout(() => handleSend(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
        timestamp: new Date(),
      },
    ]);
  };

  const showSuggestions = messages.length === 1;

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-2xl border border-gray-700 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">AI Assistant</h3>
            <p className="text-xs text-gray-400">Ask me anything about the platform</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
          aria-label="Clear chat"
          title="Clear chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl p-3 shadow-sm transition-all ${
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
              <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
              <p className="text-xs mt-2 opacity-60">
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 rounded-xl p-3 shadow-sm">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
                <span className="text-sm text-gray-300">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      {showSuggestions && (
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-400 mb-2">Quick suggestions:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickSuggestions.slice(0, 4).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-left text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 p-2.5 rounded-lg transition-all duration-200 text-sm font-medium"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            className="flex-1 bg-gray-700 text-white placeholder-gray-400 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 disabled:opacity-50"
            disabled={loading}
            aria-label="Chat input"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 shadow-md disabled:shadow-none"
            aria-label="Send message"
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