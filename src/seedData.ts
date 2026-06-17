import { collection, writeBatch, getDocs, doc, query, limit } from "firebase/firestore";
import { db } from "./firebase";
import { Article, Category, Comment, BreakingNews, WebSettings } from "./types";

const INITIAL_CATEGORIES: Category[] = [
  { id: "politics", name: "Politics", slug: "politics" },
  { id: "us-politics", name: "US Politics", slug: "us-politics", parentId: "politics" },
  { id: "world-politics", name: "World Politics", slug: "world-politics", parentId: "politics" },
  { id: "technology", name: "Technology", slug: "technology" },
  { id: "ai-robots", name: "AI & Future", slug: "ai-robots", parentId: "technology" },
  { id: "gadgets", name: "Gadgets", slug: "gadgets", parentId: "technology" },
  { id: "business", name: "Business", slug: "business" },
  { id: "markets", name: "Markets", slug: "markets", parentId: "business" },
  { id: "opinion", name: "Opinion", slug: "opinion" },
  { id: "style", name: "Style", slug: "style" }
];

const INITIAL_ARTICLES: Article[] = [
  {
    id: "art-1",
    title: "Global Summit Agrees on New Carbon reduction Guidelines",
    subtitle: "Over 120 nations sign the historic pledge in Geneva, targeting a 40% reduction by 2035.",
    excerpt: "Nations around the world have reached a landmark consensus detailing aggressive emission cuts and strict enforcement schedules starting next fiscal year.",
    content: `GENEVA — In a historic milestone for global environmental policy, leaders representing 120 countries concluded the Climate Assembly today by signing the Geneva Carbon Accords. The agreement outlines mandatory directives for a 40% reduction in carbon dioxide releases by 2035.

"Today we took a bold, coordinated step forward," declared Summit Chairperson Dr. Elena Rostova. "For the first time, multiple major industrial powers have agreed to direct timelines with unified oversight."

**What This Means for Global Industries**

The accord imposes strict regulatory constraints on heavy manufacturers, power grids, and aviation networks, urging a rapid pivot toward renewable initiatives. A central component of the accord is a $150 billion annual support fund, sponsored by developed countries, to assist low-income nations in developing their green energy infrastructures.

**Public Reaction & Market Shocks**

While global tech and solar shares rallied immediately following the announcement, conventional energy commodities experienced a sharp correction. Critics argue the compliance targets are overly ambitious, pointing to the economic friction of rapid grid overhauls. However, advocates maintain that doing nothing will cost ten times more in climate-driven disasters.

Negotiators worked through three consecutive nights to finalize the document, resolving last-minute disputes regarding carbon tax exemptions and industrial credits. The treaty is scheduled to enter national ratification processes starting next month.`,
    slug: "global-summit-carbon-reduction-agreement",
    featuredImage: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=1200",
    status: "Published",
    categoryId: "politics",
    subCategoryId: "world-politics",
    publishDate: new Date().toISOString(),
    authorId: "auth-default",
    authorName: "Sarah Jenkins",
    views: 1420,
    seoTitle: "Global Summit Carbon Agreement - Geneva Accords 2035",
    seoDescription: "Over 120 nations signed the historic Geneva Carbon Accords, agreeing to cut carbon outputs by 40% before 2035 with unified oversight.",
    seoKeywords: "Climate Summit, Carbon Reduction, Geneva Accords, Green Energy, Renewable Energy"
  },
  {
    id: "art-2",
    title: "The Next Frontier: Gemini Ultra Redefines Collaborative Reasoning",
    subtitle: "New multi-modal agents are performing complex multi-step logical operations at human speed.",
    excerpt: "Engineers have demonstrated next-generation collaborative AI agents executing sophisticated software engineering, legal review, and diagnostic processes.",
    content: `SILICON VALLEY — Synthetic intelligence is moving beyond chatbots to agent systems capable of deep collaborative reasoning. Today, leading researchers demonstrated a set of experimental modules capable of taking complex prompts, detailing a logical plan, and writing, testing, and rectifying their own outputs.

"We aren't just looking at text generators anymore," said Lead AI Scientist Aris Thorne. "These models act as team members. They ask questions, assess alternatives, and work through failures iteratively."

**Autonomy within Sandboxed Workspaces**

During one showcase, an agent team was given a complex legacy database migration and security update task. The software agent successfully mapped the database structure, identified vulnerabilities, designed a migration script, and compiled the source files successfully while maintaining compliance with local regulations.

**Ethical Guardrails & Governance**

As agent autonomy expands, discussions around security rules, rate limit overrides, and governance are accelerating. Experts urge strict guidelines to prevent unintentional infinite loops or recursive loops. Researchers confirm that keeping safety monitors embedded in active environments is key to preventing system deviations.

The tech industry is already preparing for a major productivity shift as companies look to deploy these multi-agent modules to streamline analytics and administration.`,
    slug: "next-frontier-gemini-collaborative-reasoning",
    featuredImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200",
    status: "Published",
    categoryId: "technology",
    subCategoryId: "ai-robots",
    publishDate: new Date(Date.now() - 3600000 * 2).toISOString(),
    authorId: "auth-default",
    authorName: "Michael Chang",
    views: 3105,
    seoTitle: "Next Frontier: Deep Collaborative AI Agents",
    seoDescription: "New multi-agent platforms demonstrate human-like iterative reasoning, debugging, and multi-step complex tasks within sandboxed containers.",
    seoKeywords: "Artificial Intelligence, Agentic AI, AI Agents, Machine Learning"
  },
  {
    id: "art-3",
    title: "Global Markets Steady Amid Moderate Interest Rate Signals",
    subtitle: "Stock indices show resilience as central banks hint at gradual adjustment cycles.",
    excerpt: "Investors reacted constructively to statements suggesting inflation is cooling and interest rates may hold steady over the next two fiscal quarters.",
    content: `NEW YORK — Global equity indexes posted modest gains today as treasury securities stabilized following comments from the Federal Reserve Chair. The signals suggest monetary policy may remain steady without additional aggressive hiking cycles.

The Dow Jones Industrial Average rose 0.8%, while the tech-weighted Nasdaq composite added 1.2%. Similar positive indicators were recorded across European and Asian sessions.

**Adjustments in Capital Allocations**

"The markets appreciate clarity above all," remarked Senior Portfolio Manager Diane Sterling. "Knowing that we've likely hit the terminal rate allows long-term bond managers to allocate funds comfortably."

Small-cap and industrial stocks, which are particularly sensitive to credit costs, led the afternoon recovery. Energy commodities remained neutral, resisting recent downward forces.

**Outlook for the Second Half**

Economists warn that while current metrics indicate a soft landing, geopolitical factors and supply-chain pressures could still trigger localized inflation pockets. The next official inflation index is scheduled for release on Friday morning.`,
    slug: "global-markets-steady-interest-rate-signals",
    featuredImage: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=1200",
    status: "Published",
    categoryId: "business",
    subCategoryId: "markets",
    publishDate: new Date(Date.now() - 3600000 * 8).toISOString(),
    authorId: "auth-2",
    authorName: "Caroline Vance",
    views: 890,
    seoTitle: "Global Markets Steady on Central Bank Guidance",
    seoDescription: "Stock markets showed strong positive momentum after central banks signaled interest rates will hold flat for the coming quarters.",
    seoKeywords: "Financial Markets, Stocks, Federal Reserve, Interest Rates, Inflation"
  },
  {
    id: "art-4",
    title: "How Space-Saving Architecture is Transforming Urban Apartments",
    subtitle: "Elegant double-duty layouts bring minimalist aesthetics and workspace utility together.",
    excerpt: "Architects are designing smart space solutions for modern living spaces to support remote work and comfort simultaneously.",
    content: `TOKYO — As cities become denser, architects are reimagining small-space layouts. In Tokyo, Stockholm, and London, a movement toward modular living is showing that you don't need excessive square footage to experience elevated living.

A complete transformation occurs with custom-engineered moving walls, folding desks, and hidden storage vaults. This allows a 400-square-foot suite to transition gracefully from a bright morning office to a cozy dinner setting.

**The Aesthetic of Multi-Functionality**

"The secret is visual relief," says interior designer Kenji Sato. "If you hide the clutter of work equipment when it isn't needed, your brain perceives the room as a place of rest."

Matte finishes, organic oak, and brushed aluminum accents are the materials of choice, creating clean boundaries and soothing tactile experiences. Studies show that these streamlined, uncluttered interiors significantly reduce baseline stress levels, especially for remote knowledge workers.

As remote-first setups persist globally, furniture manufacturers report record requests for smart beds, integrated screens, and noise-canceling dividers.`,
    slug: "space-saving-architecture-urban-apartments",
    featuredImage: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1200",
    status: "Published",
    categoryId: "style",
    publishDate: new Date(Date.now() - 3600000 * 24).toISOString(),
    authorId: "auth-2",
    authorName: "Caroline Vance",
    views: 1205,
    seoTitle: "Space-Saving Architecture & Intelligent Interior Design",
    seoDescription: "Modular furniture and moving walls are turning tiny metropolitan apartments into stylish, highly functional spaces.",
    seoKeywords: "Interior Design, Architecture, Small Space Living, Micro Apartments"
  }
];

const INITIAL_COMMENTS: Comment[] = [
  {
    id: "comm-1",
    articleId: "art-1",
    articleTitle: "Global Summit Agrees on New Carbon reduction Guidelines",
    articleSlug: "global-summit-carbon-reduction-agreement",
    authorName: "Robert Miller",
    authorEmail: "robert@millers.com",
    content: "This is a historic moment. I hope there are actual teeth to this agreement and countries are held accountable to these timelines. We cannot afford another non-binding declaration.",
    status: "Approved",
    createdAt: new Date(Date.now() - 12000000).toISOString()
  },
  {
    id: "comm-2",
    articleId: "art-1",
    articleTitle: "Global Summit Agrees on New Carbon reduction Guidelines",
    articleSlug: "global-summit-carbon-reduction-agreement",
    authorName: "Elena S.",
    authorEmail: "elena@earthwatch.org",
    content: "A major win for renewable technology! This will hopefully jumpstart investments in geothermal and grid storage systems, which are desperately needed to stabilize our transitions.",
    status: "Approved",
    createdAt: new Date(Date.now() - 6000000).toISOString()
  },
  {
    id: "comm-3",
    articleId: "art-2",
    articleTitle: "The Next Frontier: Gemini Ultra Redefines Collaborative Reasoning",
    articleSlug: "next-frontier-gemini-collaborative-reasoning",
    authorName: "Steve Peterson",
    authorEmail: "stevedev@webops.io",
    content: "Awesome read. I've been experimenting with multi-agent workflows and the capability to write a script inside an environment and check its own errors is insane. Saved me hours.",
    status: "Approved",
    createdAt: new Date(Date.now() - 2000000).toISOString()
  },
  {
    id: "comm-4",
    articleId: "art-2",
    articleTitle: "The Next Frontier: Gemini Ultra Redefines Collaborative Reasoning",
    articleSlug: "next-frontier-gemini-collaborative-reasoning",
    authorName: "Alice Woods",
    authorEmail: "alice.w@techpulse.net",
    content: "BUY EXTREMELY CHEAP STOCKS TODAY AT SCAM-WEBSITE!!! GAIN 1000% !!!",
    status: "Spam",
    createdAt: new Date(Date.now() - 1000000).toISOString()
  }
];

const INITIAL_BREAKING: BreakingNews[] = [
  {
    id: "break-1",
    text: "BREAKING NEWS: Historic Geneva Accord ratified by European Assembly with immediate green funding approvals.",
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "break-2",
    text: "ALERT: Central bank indices hint at early rate drop in third quarter; NYSE opens strong with a 200-point jump.",
    active: true,
    createdAt: new Date().toISOString()
  }
];

const INITIAL_SETTINGS: WebSettings = {
  logoText: "FAST COVERAGE",
  siteTitle: "Fast Coverage | Rapid, Accurate Global News Headlines",
  contactEmail: "press@fastcoverage.news",
  aboutText: "Fast Coverage delivers objective, breaking news reports, insightful political coverage, tech analyses, and styling trends directly to readers with speed and integrity.",
  socialFacebook: "https://facebook.com/fastcoverage",
  socialTwitter: "https://twitter.com/fastcoverage",
  socialInstagram: "https://instagram.com/fastcoverage",
  socialYoutube: "https://youtube.com/fastcoverage",
  seoDescription: "Your leading source for global news summaries, breaking bulletins, financial updates, in-depth politics, and tech innovations.",
  adSenseCode: "ca-pub-681675716008",
  analyticsCode: "G-92031153339"
};

export async function seedDatabaseIfEmpty() {
  try {
    const catCheck = await getDocs(query(collection(db, "categories"), limit(1)));
    if (!catCheck.empty) {
      console.log("Database has already been seeded or has files.");
      return;
    }

    console.log("Database empty. Seeding initial categories, articles, settings, comments, and breaking news...");

    const batch = writeBatch(db);

    // Seeding categories
    for (const cat of INITIAL_CATEGORIES) {
      const docRef = doc(db, "categories", cat.id);
      batch.set(docRef, cat);
    }

    // Seeding articles
    for (const art of INITIAL_ARTICLES) {
      const docRef = doc(db, "articles", art.id);
      batch.set(docRef, art);
    }

    // Seeding comments
    for (const comm of INITIAL_COMMENTS) {
      const docRef = doc(db, "comments", comm.id);
      batch.set(docRef, comm);
    }

    // Seeding breaking news
    for (const b of INITIAL_BREAKING) {
      const docRef = doc(db, "breaking_news", b.id);
      batch.set(docRef, b);
    }

    // Seeding web settings
    const settingsRef = doc(db, "settings", "global");
    batch.set(settingsRef, INITIAL_SETTINGS);

    // Seeding default users (Admin role for hommishra65@gmail.com)
    const adminUserRef = doc(db, "users", "admin-hommishra");
    batch.set(adminUserRef, {
      id: "admin-hommishra",
      email: "hommishra65@gmail.com",
      name: "Hariom Mishra",
      role: "Admin",
      status: "Active",
      createdAt: new Date().toISOString()
    });

    await batch.commit();
    console.log("Database successfully seeded!");
  } catch (error) {
    console.error("Seeding database failed: ", error);
  }
}
