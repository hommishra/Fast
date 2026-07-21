import { Article, Category, User, AdSlot, WebsiteSettings, CareerListing, Comment, BreakingNewsItem, MarketItem, VideoItem, ParentSection } from './types';

export const initialParentSections: ParentSection[] = [
  { id: 'ps-1', name: 'World News', slug: 'world-news', active: true },
  { id: 'ps-2', name: 'India News', slug: 'india-news', active: true },
  { id: 'ps-3', name: 'Politics', slug: 'politics', active: true },
  { id: 'ps-4', name: 'Sports', slug: 'sports', active: true },
  { id: 'ps-5', name: 'Technology', slug: 'technology', active: true },
  { id: 'ps-6', name: 'Business', slug: 'business', active: true },
  { id: 'ps-7', name: 'Entertainment', slug: 'entertainment', active: true }
];

export const initialCategories: Category[] = [
  { id: '1', name: 'World News', slug: 'world-news', description: 'Latest news and updates from around the globe.', parentSectionId: 'ps-1' },
  { id: '2', name: 'India News', slug: 'india-news', description: 'Top headlines, deep-dives and breaking updates from India.', parentSectionId: 'ps-2' },
  { id: '3', name: 'Politics', slug: 'politics', description: 'Legislative battles, policy updates, and executive actions.', parentSectionId: 'ps-3' },
  { id: '4', name: 'Sports', slug: 'sports', description: 'Football, cricket, Olympics, basketball, and world sports updates.', parentSectionId: 'ps-4' },
  { id: '5', name: 'Technology', slug: 'technology', description: 'Artificial Intelligence, software development, cybersecurity and gadgets.', parentSectionId: 'ps-5' },
  { id: '6', name: 'Business', slug: 'business', description: 'Stock markets, corporate updates, economic policies, and global trade.', parentSectionId: 'ps-6' },
  { id: '7', name: 'Entertainment', slug: 'entertainment', description: 'Cinema, music, celebrity insights, and streaming trends.', parentSectionId: 'ps-7' },
  { id: '8', name: 'Education', slug: 'education', description: 'Academic updates, university standards, and learning technology.' },
  { id: '9', name: 'Health', slug: 'health', description: 'Medical research, mental well-being, healthcare policies, and fitness.' },
  { id: '10', name: 'Crime', slug: 'crime', description: 'Investigative updates, justice department actions, and legal reports.' },
  { id: '11', name: 'Science', slug: 'science', description: 'Space exploration, astrophysics, biotechnology, and geology.', parentSectionId: 'ps-5' },
  { id: '12', name: 'Lifestyle', slug: 'lifestyle', description: 'Travel, cuisine, fashion trends, and culture.' },
  { id: '13', name: 'Opinion', slug: 'opinion', description: 'Columns and analytical reviews by expert writers.' },
  { id: '14', name: 'Editorial', slug: 'editorial', description: 'The official voice of FAST COVERAGES.' },
  { id: '15', name: 'Fact Check', slug: 'fact-check', description: 'Debunking rumors, examining digital claims, and validating statistics.' }
];

export const initialUsers: User[] = [
  {
    id: 'u-1',
    name: 'Sarah Jenkins',
    email: 'sarah.j@fastcoverages.com',
    role: 'Super Admin',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    status: 'Active',
    bio: 'Chief Executive Editor at FAST COVERAGES. Formerly with Reuters and BBC World Service. Award-winning foreign correspondent.'
  },
  {
    id: 'u-2',
    name: 'Rajesh Sharma',
    email: 'rajesh.s@fastcoverages.com',
    role: 'Editor',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    status: 'Active',
    bio: 'Managing Editor for South Asia. Covering political shifts, economic developments, and environmental policies.'
  },
  {
    id: 'u-3',
    name: 'Marcus Vance',
    email: 'marcus.v@fastcoverages.com',
    role: 'Journalist',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    status: 'Active',
    bio: 'Senior Technology Correspondent. Based in San Francisco, covering Silicon Valley, AI innovation, and space-tech ventures.'
  },
  {
    id: 'u-4',
    name: 'Elena Rostova',
    email: 'elena.r@fastcoverages.com',
    role: 'Journalist',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    status: 'Active',
    bio: 'International Security and Investigative Journalist. Expert on East-European affairs and geopolitics.'
  },
  {
    id: 'u-5',
    name: 'Amara Diop',
    email: 'amara.d@fastcoverages.com',
    role: 'Moderator',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    status: 'Active',
    bio: 'Community Engagement Manager and Lead Comments Moderator.'
  }
];

export const initialArticles: Article[] = [
  {
    id: 'art-1',
    title: 'Historic Climate Summit Reaches Landmark Accord on Global Carbon Offsets',
    subtitle: 'Nearly 200 nations sign the Geneva Green Alliance, committing to a stricter carbon taxation protocol by 2028.',
    content: `GENEVA — In a dramatic final-day consensus, representatives from nearly 200 nations have formally signed the Geneva Green Alliance. The treaty establishes the most rigorous binding carbon reduction metrics since the Paris Agreement.

The breakthrough came at 4:32 AM local time, following an exhaustive 72-hour continuous negotiation cycle led by delegates from the European Union, India, Brazil, and the United States. 

### Stricter Carbon Taxation by 2028
The landmark accord mandates a unified carbon offset pricing mechanism, which aims to tax industrial emissions uniformly at $45 per metric ton of CO2 equivalent by 2028. This system will fund local reforestation and clean energy grids in developing regions.

"Today we have demonstrated that global cooperation is not a relic of the past, but our strongest vehicle for a sustainable future," declared UN Climate Commissioner, Helena Lindqvist. 

Critics, however, suggest that the enforcement protocols lack a clear punitive system for nations failing to meet the intermediate 2026 goals. Despite this, stock markets responded positively, with major renewable energy indices climbing 4.2% globally in early-morning trading.`,
    summary: 'Nearly 200 countries agree to a binding carbon offset taxation protocol by 2028 in a historic climate agreement signed in Geneva.',
    category: 'World News',
    subcategory: 'Environment',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200',
    author: 'Elena Rostova',
    authorRole: 'Journalist',
    publishDate: '2026-07-20T00:15:00-07:00',
    status: 'Published',
    isPinned: true,
    isFeatured: true,
    views: 14502,
    likes: 894,
    commentsCount: 42,
    keywords: ['climate', 'accord', 'un', 'carbon tax', 'green energy']
  },
  {
    id: 'art-2',
    title: 'India Launches Next-Generation Deep-Space Research Probe from Sriharikota',
    subtitle: 'The Aditya-L2 probe is engineered to study solar winds and solar flares from an advanced Lagrange point orbit.',
    content: `SRIHARIKOTA — The Indian Space Research Organisation (ISRO) has successfully launched its heavy-lift launch vehicle carrying the Aditya-L2 solar observatory. This mission represents India's most advanced deep-space research venture to date.

The launch, which executed with flawless synchronization at 9:15 AM IST, was witnessed by thousands of spectators and top space scientists at the Satish Dhawan Space Centre.

### Probing Solar Winds and Coronal Mass Ejections
The Aditya-L2 probe is engineered to reach the L2 Lagrange point—approximately 1.5 million kilometers from Earth—to carry out specialized studies on the Sun's magnetic fields, solar wind mechanics, and coronal heating patterns that affect communications infrastructure globally.

ISRO Chief Dr. S. Somnath expressed supreme confidence in the spacecraft's payload: "All instruments are performing perfectly as per trajectory calculations. Aditya-L2 will unlock mysteries that have baffled solar physicists for decades."`,
    summary: 'ISRO successfully launches the Aditya-L2 deep-space observatory to study solar winds and flares from the Lagrange point.',
    category: 'India News',
    subcategory: 'Space',
    image: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&q=80&w=1200',
    author: 'Rajesh Sharma',
    authorRole: 'Editor',
    publishDate: '2026-07-19T21:40:00-07:00',
    status: 'Published',
    isPinned: false,
    isFeatured: true,
    views: 9812,
    likes: 612,
    commentsCount: 18,
    keywords: ['isro', 'aditya-l2', 'space launch', 'sun probe', 'india space']
  },
  {
    id: 'art-3',
    title: 'AI Revolution: New Neural Network Framework Eliminates Hallucinations entirely',
    subtitle: 'Tech company Synthetix announces a validated deterministic model that references objective public ledgers.',
    content: `SILICON VALLEY — In what researchers are terming the "death of AI hallucinations," technology pioneer Synthetix has unveiled a breakthrough neural network architecture named LedgerNet.

Traditional Large Language Models rely strictly on probabilistic text generation, which leads to fabricated facts. LedgerNet solves this by binding the generation process with a real-time, mathematically validated semantic graph of objective public ledgers.

### Validated Grounding
"We are moving from generative fantasy to grounded reasoning," said Marcus Vance, who had an exclusive look at the model in San Francisco. LedgerNet scored a perfect 100% on historical factual accuracy tests conducted by independent academic institutions.

The breakthrough is expected to open the doors for AI integration in mission-critical industries like healthcare diagnostic systems, legal drafting, and real-time news indexing.`,
    summary: 'Tech firm Synthetix releases LedgerNet, an AI framework designed to achieve zero hallucinations by grounding responses on verified ledgers.',
    category: 'Technology',
    subcategory: 'Artificial Intelligence',
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=1200',
    author: 'Marcus Vance',
    authorRole: 'Journalist',
    publishDate: '2026-07-19T18:30:00-07:00',
    status: 'Published',
    isPinned: false,
    isFeatured: false,
    views: 18456,
    likes: 1250,
    commentsCount: 56,
    keywords: ['ai', 'neural networks', 'ledgernet', 'hallucinations', 'silicon valley']
  },
  {
    id: 'art-4',
    title: 'Federal Election Commission Implements Secure Digital Blockchain for Voting Audits',
    subtitle: 'An unprecedented bi-partisan bill mandates immutable cryptographic receipt logs for the upcoming midterm elections.',
    content: `WASHINGTON — The Federal Election Commission, in a historic bi-partisan agreement, has voted to integrate cryptographic ledger technology to modernize state-level voting audits. 

The move, aimed at restoring absolute public trust in election outcomes, ensures that while ballots remain strictly anonymous, every vote cast generates an immutable, unique cryptographic hash ledger. This ledger allows instantaneous auditing of local, regional, and national counts.

### Cryptographic Security Standards
The technology will be deployed alongside traditional paper ballots, serving as a parallel validation layer. Major security agencies have endorsed the model as "virtually impenetrable" to tampering from external malicious state actors.`,
    summary: 'A bi-partisan commission approves the deployment of cryptographic blockchain audit trails for upcoming federal midterm elections.',
    category: 'Politics',
    subcategory: 'Elections',
    image: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=1200',
    author: 'Sarah Jenkins',
    authorRole: 'Super Admin',
    publishDate: '2026-07-19T14:20:00-07:00',
    status: 'Published',
    isPinned: false,
    isFeatured: true,
    views: 7421,
    likes: 421,
    commentsCount: 89,
    keywords: ['voting', 'blockchain', 'fec', 'elections', 'security']
  },
  {
    id: 'art-5',
    title: 'Global Markets Settle After Federal Reserve Announces Planned Rate Cut Cycle',
    subtitle: 'Dow climbs 500 points, gold prices touch record highs, while consumer bond yields adjust to 3.5%.',
    content: `NEW YORK — Global equity markets rallied on Monday as investors digested the Federal Reserve's strongest signal yet of an imminent cycle of interest rate cuts starting in September.

Wall Street's primary indices closed significantly in the green, with the Dow Jones Industrial Average gaining 512 points, and the tech-heavy Nasdaq rising 1.8%.

### Rebalancing Economic Targets
Fed Chairman Jerome Powell, during a policy briefing in Chicago, noted that inflation metrics have stabilized safely near the targeted 2% threshold, allowing the central bank to prioritize job security and business expansion efforts.`,
    summary: 'The Dow climbs 500 points following a clear statement by the Federal Reserve indicating a planned cycle of rate cuts.',
    category: 'Business',
    subcategory: 'Finance',
    image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=1200',
    author: 'Sarah Jenkins',
    authorRole: 'Super Admin',
    publishDate: '2026-07-19T10:00:00-07:00',
    status: 'Published',
    isPinned: false,
    isFeatured: false,
    views: 6512,
    likes: 219,
    commentsCount: 12,
    keywords: ['federal reserve', 'stocks', 'dow jones', 'interest rates', 'inflation']
  },
  {
    id: 'art-6',
    title: 'Fact Check: Did the WHO Release a Mandate for Mandatory Screen-Time Curfews?',
    subtitle: 'Viral social media videos claim the World Health Organization is recommending state-enforced screen bans for children.',
    content: `GENEVA — Viral posts across TikTok and Instagram claim that the World Health Organization (WHO) has drafted a global mandate urging governments to enforce a daily "screen-time curfew" for minors under the age of 14, complete with internet lockouts.

Our Investigative Unit examined the source documents. The claims are officially **FALSE**.

### The Facts
The WHO has issued *guidelines* suggesting that parents limit passive screen time for young children to promote healthy physical and mental development. However, the organization does not have, nor has it ever suggested, the legal authority to mandate screen-time lockouts or government-enforced curfews.`,
    summary: 'Social media claims that the WHO is mandating state-enforced screen curfews for minors are completely false and based on a misrepresentation of health guidelines.',
    category: 'Fact Check',
    subcategory: 'Health',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200',
    author: 'Elena Rostova',
    authorRole: 'Journalist',
    publishDate: '2026-07-18T16:45:00-07:00',
    status: 'Published',
    isPinned: false,
    isFeatured: false,
    views: 12560,
    likes: 490,
    commentsCount: 31,
    keywords: ['fact check', 'who', 'screen time', 'social media', 'hoax']
  }
];

export const initialComments: Comment[] = [
  {
    id: 'c-1',
    articleId: 'art-1',
    authorName: 'Dr. Arthur Pendelton',
    authorEmail: 'arthur.p@cambridge.edu',
    content: 'This is an outstanding geopolitical milestone. However, the carbon pricing offset rate of $45 is still far too low compared to actual carbon capture expenditures. Let us hope 2028 brings actual enforcement.',
    date: '2026-07-20T01:10:00-07:00',
    isApproved: true
  },
  {
    id: 'c-2',
    articleId: 'art-3',
    authorName: 'DevByte99',
    authorEmail: 'devbyte@gmail.com',
    content: 'LedgerNet seems like a game changer if it can actually be scaled. But how does it perform in terms of lookup latency? Cryptographic lookups on public ledgers are traditionally very slow.',
    date: '2026-07-19T19:45:00-07:00',
    isApproved: true
  }
];

export const initialAdSlots: AdSlot[] = [
  { id: 'ad-1', type: 'Header', label: 'Main Premium Header banner (728x90)', imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=728&h=90', targetUrl: '/', active: true },
  { id: 'ad-2', type: 'Sidebar', label: 'Sidebar Business Banner (300x250)', imageUrl: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&q=80&w=300&h=250', targetUrl: '/', active: true },
  { id: 'ad-3', type: 'Footer', label: 'Standard Footer Promotion (468x60)', imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=468&h=60', targetUrl: '/', active: true },
  { id: 'ad-4', type: 'Sticky', label: 'Anchor Sticky Ad (320x50)', active: false }
];

export const initialSettings: WebsiteSettings = {
  name: 'FAST COVERAGES',
  tagline: 'GLOBAL NEWS NETWORK',
  logoUrl: '',
  footerText: '© FAST COVERAGES – GLOBAL NEWS NETWORK. ALL RIGHTS RESERVED.',
  primaryColor: 'red',
  facebookUrl: 'https://facebook.com',
  twitterUrl: 'https://twitter.com',
  instagramUrl: 'https://instagram.com',
  youtubeUrl: 'https://youtube.com',
  rssEnabled: true,
  twoFactorEnabled: true,
  contactPhone: '+1 (212) 555-0199',
  contactEmail: 'editorial@fastcoverages.com',
  officeAddressNY: 'Times Square News Tower, Floor 44, New York, NY 10036',
  officeAddressLondon: 'Reuters Way, Westminster Hub, London EC4Y 0DY',
  officeAddressDelhi: 'Connaught Space Chambers, Sector 4, New Delhi 110001',
  chartPosition: 'Side',
  cryptoMarketEnabled: true,
  forexMarketEnabled: true,
  commoditiesEnabled: true,
  usMarketsEnabled: true,
  indiaMarketsEnabled: true,
  ukMarketsEnabled: true,
  japanMarketsEnabled: true,
  chinaMarketsEnabled: true,
  europeMarketsEnabled: true
};

export const initialCareers: CareerListing[] = [
  {
    id: 'car-1',
    title: 'Senior Investigative Reporter',
    department: 'Editorial - Geopolitics',
    location: 'London, UK / Hybrid',
    type: 'Full-time',
    description: 'We are seeking an experienced reporter with a proven track record of breaking high-impact investigative global stories. You will collaborate with our international bureaus to expose corruption, track security developments, and deliver world-class stories.',
    requirements: [
      '6+ years experience in investigative news reporting at a major publication.',
      'Strong network of verified sources in international bodies or security agencies.',
      'Impeccable journalistic ethics and deep knowledge of libel laws.',
      'Exceptional storytelling skills under tight deadlines.'
    ]
  },
  {
    id: 'car-2',
    title: 'Lead Frontend Engineer - Media Tech',
    department: 'Technology',
    location: 'Remote (US/EU Timezones)',
    type: 'Full-time',
    description: 'Help us design the next generation of FAST COVERAGES digital portals. You will optimize rendering pipelines, manage real-time databases, build high-speed content delivery modules, and support lightweight SEO-optimized page structures.',
    requirements: [
      '3+ years experience with React, Vite, and tailwindcss.',
      'Deep understanding of Core Web Vitals, CDN caching structures, and Server Side Rendering paradigms.',
      'Experience building high-traffic, low-latency news portals or media portals.'
    ]
  }
];

export const initialBreakingNews: BreakingNewsItem[] = [
  { id: 'b-1', title: 'GLOBAL REEF ECOSYSTEM RESTORATION ACT APPROVED BY UN ENVIRONMENTAL ASSEMBLY', isPinned: true, publishDate: '2026-07-20T03:00:00Z', category: 'WORLD NEWS', active: true },
  { id: 'b-2', title: 'ISRO CONFIRMS ADITYA-L2 SOL observatory HAS REACHED HALO ORBIT SUCCESSFULLY', isPinned: false, publishDate: '2026-07-20T02:30:00Z', category: 'INDIA NEWS', active: true },
  { id: 'b-3', title: 'SYNTHETIX INC SHARES RALLY 18% IN PRE-MARKET TRADING AFTER LEDGERNET ANNOUNCEMENT', isPinned: true, publishDate: '2026-07-20T02:00:00Z', category: 'BUSINESS', active: true },
  { id: 'b-4', title: 'CENTRAL BANKS DISCUSS INTEGRATING MULTI-LATERAL BLOCKCHAIN CLEARING PROTOCOLS', isPinned: false, publishDate: '2026-07-20T01:15:00Z', category: 'POLITICS', active: true }
];

export const initialMarkets: MarketItem[] = [
  // UNITED STATES
  { id: 'm-1', name: 'Dow Jones', value: '39,122.40', change: '+1.31%', isUp: true, active: true, position: 1, symbol: '^DJI', category: 'United States' },
  { id: 'm-2', name: 'NASDAQ', value: '16,274.94', change: '+1.82%', isUp: true, active: true, position: 2, symbol: '^IXIC', category: 'United States' },
  { id: 'm-3', name: 'S&P 500', value: '5,211.49', change: '+0.89%', isUp: true, active: true, position: 3, symbol: '^GSPC', category: 'United States' },
  
  // INDIA
  { id: 'm-4', name: 'NIFTY 50', value: '22,513.70', change: '+1.15%', isUp: true, active: true, position: 4, symbol: '^NSEI', category: 'India' },
  { id: 'm-5', name: 'SENSEX', value: '74,248.22', change: '+1.08%', isUp: true, active: true, position: 5, symbol: '^BSESN', category: 'India' },
  { id: 'm-6', name: 'BANK NIFTY', value: '48,582.35', change: '+1.22%', isUp: true, active: true, position: 6, symbol: '^NSEBANK', category: 'India' },

  // UNITED KINGDOM
  { id: 'm-7', name: 'FTSE 100', value: '7,935.09', change: '-0.22%', isUp: false, active: true, position: 7, symbol: '^FTSE', category: 'United Kingdom' },

  // JAPAN
  { id: 'm-8', name: 'Nikkei 225', value: '38,722.10', change: '+1.45%', isUp: true, active: true, position: 8, symbol: '^N225', category: 'Japan' },

  // CHINA
  { id: 'm-9', name: 'Shanghai Composite', value: '3,065.25', change: '+0.42%', isUp: true, active: true, position: 9, symbol: '000001.SS', category: 'China' },
  { id: 'm-10', name: 'Hang Seng', value: '16,742.85', change: '-0.54%', isUp: false, active: true, position: 10, symbol: '^HSI', category: 'China' },

  // EUROPE
  { id: 'm-11', name: 'EURO STOXX 50', value: '5,015.42', change: '+0.62%', isUp: true, active: true, position: 11, symbol: '^STOXX50E', category: 'Europe' },
  { id: 'm-12', name: 'DAX', value: '18,175.24', change: '+0.75%', isUp: true, active: true, position: 12, symbol: '^GDAXI', category: 'Europe' },

  // CRYPTO MARKET
  { id: 'm-13', name: 'Bitcoin', value: '$64,150.00', change: '+2.41%', isUp: true, active: true, position: 13, symbol: 'BTC-USD', category: 'Crypto Market' },
  { id: 'm-14', name: 'Ethereum', value: '$3,480.12', change: '+3.15%', isUp: true, active: true, position: 14, symbol: 'ETH-USD', category: 'Crypto Market' },
  { id: 'm-15', name: 'Solana', value: '$145.50', change: '+4.22%', isUp: true, active: true, position: 15, symbol: 'SOL-USD', category: 'Crypto Market' },
  { id: 'm-16', name: 'BNB', value: '$575.20', change: '+1.85%', isUp: true, active: true, position: 16, symbol: 'BNB-USD', category: 'Crypto Market' },
  { id: 'm-17', name: 'XRP', value: '$0.58', change: '-1.12%', isUp: false, active: true, position: 17, symbol: 'XRP-USD', category: 'Crypto Market' },

  // FOREX MARKET
  { id: 'm-18', name: 'USD/INR', value: '83.42', change: '-0.08%', isUp: false, active: true, position: 18, symbol: 'USDINR=X', category: 'Forex Market' },
  { id: 'm-19', name: 'USD/EUR', value: '0.9241', change: '+0.05%', isUp: true, active: true, position: 19, symbol: 'USDEUR=X', category: 'Forex Market' },
  { id: 'm-20', name: 'USD/GBP', value: '0.7852', change: '-0.12%', isUp: false, active: true, position: 20, symbol: 'USDGBP=X', category: 'Forex Market' },
  { id: 'm-21', name: 'USD/JPY', value: '155.45', change: '+0.32%', isUp: true, active: true, position: 21, symbol: 'USDJPY=X', category: 'Forex Market' },
  { id: 'm-22', name: 'EUR/USD', value: '1.0822', change: '+0.12%', isUp: true, active: true, position: 22, symbol: 'EURUSD=X', category: 'Forex Market' },

  // COMMODITIES
  { id: 'm-23', name: 'Gold', value: '$2,342.10', change: '+0.45%', isUp: true, active: true, position: 23, symbol: 'GC=F', category: 'Commodities' },
  { id: 'm-24', name: 'Silver', value: '$27.85', change: '+0.92%', isUp: true, active: true, position: 24, symbol: 'SI=F', category: 'Commodities' },
  { id: 'm-25', name: 'Crude Oil', value: '$78.45', change: '-1.45%', isUp: false, active: true, position: 25, symbol: 'CL=F', category: 'Commodities' },
  { id: 'm-26', name: 'Natural Gas', value: '$2.15', change: '+2.54%', isUp: true, active: true, position: 26, symbol: 'NG=F', category: 'Commodities' }
];

export const initialVideos: VideoItem[] = [
  {
    id: 'v-1',
    title: 'Global Climate Summit 2026: Key Takeaways and Policy Commitments',
    description: 'A special broadcast highlighting the immediate policy commitments agreed upon by global leaders at the 2026 Climate Summit.',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800',
    publishDate: '2026-07-20T04:00:00Z',
    category: 'World News',
    author: 'Sarah Jenkins'
  },
  {
    id: 'v-2',
    title: 'Artificial Intelligence and the Future of Cybersecurity Bureau Briefing',
    description: 'Our lead technology correspondent breaks down the new cybersecurity frameworks established to combat sophisticated neural attacks.',
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
    publishDate: '2026-07-20T02:15:00Z',
    category: 'Technology',
    author: 'David Vance'
  }
];

