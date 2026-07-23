import React, { useState } from 'react';
import { 
  BookOpen, Search, Download, Eye, DollarSign, CreditCard, 
  CheckCircle, ArrowRight, ShieldCheck, FileText, Sparkles, 
  X, Check, Lock, QrCode, Copy, RefreshCw, Star, Layers, ChevronRight
} from 'lucide-react';
import { EBook, PaymentSettings, EBookPurchase } from '../types';

interface EBooksStoreProps {
  ebooks: EBook[];
  paymentSettings: PaymentSettings;
  purchases: EBookPurchase[];
  onPurchaseComplete: (purchaseData: {
    ebookId: string;
    buyerName: string;
    buyerEmail: string;
    buyerPhone: string;
    paymentGateway: 'Razorpay' | 'UPI' | 'PayPal';
    transactionId?: string;
  }) => Promise<{ success: boolean; purchase: EBookPurchase; downloadUrl: string }>;
}

export const EBooksStore: React.FC<EBooksStoreProps> = ({
  ebooks,
  paymentSettings,
  purchases,
  onPurchaseComplete
}) => {
  const [activeTab, setActiveTab] = useState<'store' | 'my-library'>('store');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected E-Book for Purchase or Preview
  const [buyingEbook, setBuyingEbook] = useState<EBook | null>(null);
  const [previewEbook, setPreviewEbook] = useState<EBook | null>(null);

  // In-App PDF Reader Modal State
  const [readingEbook, setReadingEbook] = useState<EBook | null>(null);

  // Checkout Form State
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [selectedGateway, setSelectedGateway] = useState<'Razorpay' | 'UPI' | 'PayPal'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Purchase Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState<{ purchase: EBookPurchase; downloadUrl: string } | null>(null);

  // My Library email lookup state
  const [userEmailSearch, setUserEmailSearch] = useState('');
  const [libraryPurchases, setLibraryPurchases] = useState<EBookPurchase[]>([]);

  const publishedBooks = ebooks.filter(e => e.published);

  const categories = ['All', 'Business & Economy', 'Politics & Diplomacy', 'Technology & AI', 'Investigative Reports', 'World Affairs', 'Defense & Security'];

  const filteredBooks = publishedBooks.filter(b => {
    const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (b.subtitle && b.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCopyUpi = () => {
    const upiId = paymentSettings?.upi?.upiId || 'fastcoverages@upi';
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyingEbook) return;
    if (!buyerName.trim() || !buyerEmail.trim()) {
      alert('Please provide your Name and Email address.');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await onPurchaseComplete({
        ebookId: buyingEbook.id,
        buyerName: buyerName.trim(),
        buyerEmail: buyerEmail.trim().toLowerCase(),
        buyerPhone: buyerPhone.trim(),
        paymentGateway: selectedGateway,
        transactionId: `TXN-${selectedGateway.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`
      });

      if (result.success) {
        setBuyingEbook(null);
        setActiveReceipt(result);
        // Save to local library
        setLibraryPurchases(prev => [result.purchase, ...prev]);
      } else {
        alert('Transaction failed or was cancelled. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error completing payment: ' + (err.message || 'Server error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSearchLibrary = () => {
    if (!userEmailSearch.trim()) return;
    const found = purchases.filter(p => p.buyerEmail.toLowerCase() === userEmailSearch.trim().toLowerCase());
    setLibraryPurchases(found);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Hero Banner Section */}
      <div className="relative bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-b border-slate-800 pt-8 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl text-center md:text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-red-400" />
                <span>FAST COVERAGES DIGITAL LIBRARY</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Global Editorial <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-400">E-Books & Reports</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Access deep investigative journalism, international affairs intelligence, geopolitical risk analysis, and macroeconomic insights formatted in high-resolution PDF publications.
              </p>

              {/* Navigation Tabs */}
              <div className="flex items-center justify-center md:justify-start space-x-3 pt-2">
                <button
                  onClick={() => setActiveTab('store')}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center space-x-2 cursor-pointer ${
                    activeTab === 'store'
                      ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Browse E-Books Store</span>
                </button>

                <button
                  onClick={() => setActiveTab('my-library')}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center space-x-2 cursor-pointer ${
                    activeTab === 'my-library'
                      ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>My Purchased E-Books</span>
                </button>
              </div>
            </div>

            {/* Featured Book Badge Graphic */}
            <div className="hidden lg:flex items-center justify-center relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-amber-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-75 transition duration-500" />
              <div className="relative bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-2xl flex items-center space-x-4 max-w-sm">
                <img
                  src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=300"
                  alt="Featured E-Book"
                  className="w-24 h-32 object-cover rounded-lg shadow-xl"
                />
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">BESTSELLER</span>
                  <h4 className="text-xs font-bold text-white line-clamp-2 mt-1">Global Business & International Affairs</h4>
                  <p className="text-[10px] text-slate-400 mt-1">By Hari Om Mishra</p>
                  <div className="mt-2 text-xs font-bold text-red-400">Instant PDF Download</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {activeTab === 'store' ? (
          <div className="space-y-8">
            {/* Filter and Search Toolbar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-lg">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by title, author or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto scrollbar-none pb-1 md:pb-0">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-red-600 text-white shadow'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* E-Books Grid */}
            {filteredBooks.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white">No E-Books Available</h3>
                <p className="text-xs text-slate-400 mt-1">Try resetting search filters or explore other categories.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredBooks.map(book => (
                  <div
                    key={book.id}
                    className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden hover:border-red-500/50 transition-all duration-300 flex flex-col justify-between group shadow-xl hover:shadow-2xl hover:shadow-red-950/20"
                  >
                    <div>
                      {/* Cover Image Container */}
                      <div className="relative h-64 bg-slate-950 overflow-hidden">
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                        {/* Category Badge */}
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-950/90 text-red-300 border border-red-800 backdrop-blur">
                            {book.category}
                          </span>
                        </div>

                        {/* Price Tag */}
                        <div className="absolute bottom-3 right-3 bg-slate-950/90 border border-slate-700 rounded-xl px-3 py-1.5 backdrop-blur text-right">
                          {book.discountPrice !== undefined && book.discountPrice > 0 ? (
                            <div className="flex items-center space-x-1.5">
                              <span className="text-red-400 font-extrabold text-sm">{book.currency} {book.discountPrice}</span>
                              <span className="text-slate-500 line-through text-[10px]">{book.currency} {book.price}</span>
                            </div>
                          ) : (
                            <span className="text-white font-bold text-sm">
                              {book.price === 0 ? 'FREE' : `${book.currency} ${book.price}`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info Content */}
                      <div className="p-5 space-y-2">
                        <h3 className="font-bold text-white text-base leading-snug group-hover:text-red-400 transition-colors line-clamp-2">
                          {book.title}
                        </h3>
                        {book.subtitle && (
                          <p className="text-xs text-slate-400 italic line-clamp-1">{book.subtitle}</p>
                        )}
                        <p className="text-xs text-slate-300 line-clamp-3 pt-1">{book.description}</p>
                        
                        <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 mt-3">
                          <span>By <strong className="text-slate-200">{book.author}</strong></span>
                          <span className="text-slate-500 font-mono">{book.pdfFileSize || 'PDF'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Button Action Footer */}
                    <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPreviewEbook(book)}
                        className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>Preview</span>
                      </button>

                      <button
                        onClick={() => setBuyingEbook(book)}
                        className="w-full py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-red-900/30 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Get E-Book</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* MY PURCHASED LIBRARY TAB */
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-red-500" />
                Access Your Purchased E-Books
              </h3>
              <p className="text-xs text-slate-300">
                Enter your registered Email Address below to access all your purchased E-Books and download links instantly.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email address..."
                  value={userEmailSearch}
                  onChange={(e) => setUserEmailSearch(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
                <button
                  onClick={handleSearchLibrary}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Retrieve My E-Books
                </button>
              </div>
            </div>

            {libraryPurchases.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
                <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-300">No Purchased E-Books Displayed</p>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your email above to fetch your order history or browse the store to make your first purchase.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  YOUR UNLOCKED PUBLICATIONS ({libraryPurchases.length})
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {libraryPurchases.map(p => {
                    const matchedBook = ebooks.find(e => e.id === p.ebookId);
                    return (
                      <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex gap-4 items-center">
                        <img
                          src={p.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=200'}
                          alt={p.ebookTitle}
                          className="w-16 h-24 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="space-y-1 flex-1">
                          <h5 className="font-bold text-white text-sm line-clamp-1">{p.ebookTitle}</h5>
                          <p className="text-[10px] text-emerald-400 font-semibold">Payment Completed • {p.transactionId}</p>
                          <p className="text-[10px] text-slate-400">Purchased on {new Date(p.purchasedAt).toLocaleDateString()}</p>
                          
                          <div className="pt-2 flex items-center space-x-2">
                            {matchedBook && (
                              <button
                                onClick={() => setReadingEbook(matchedBook)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-300" />
                                <span>Read PDF</span>
                              </button>
                            )}

                            <a
                              href={`/api/ebooks/download/${p.ebookId}?token=${p.downloadToken}&email=${encodeURIComponent(p.buyerEmail)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg flex items-center space-x-1 transition-all cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- PREVIEW E-BOOK MODAL --- */}
      {previewEbook && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
            <button
              onClick={() => setPreviewEbook(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row gap-6">
              <img
                src={previewEbook.coverImage}
                alt={previewEbook.title}
                className="w-44 h-64 object-cover rounded-xl shadow-2xl border border-slate-700 flex-shrink-0 mx-auto sm:mx-0"
              />

              <div className="space-y-4 flex-1">
                <div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-950 text-red-300 border border-red-800">
                    {previewEbook.category}
                  </span>
                  <h3 className="text-xl font-extrabold text-white mt-2 leading-tight">{previewEbook.title}</h3>
                  {previewEbook.subtitle && <p className="text-xs text-slate-400 italic mt-1">{previewEbook.subtitle}</p>}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{previewEbook.description}</p>
                
                <div className="text-xs text-slate-400 border-t border-slate-800 pt-2">
                  Published by <strong className="text-white">{previewEbook.author}</strong>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block">SPECIAL PRICE</span>
                    <span className="text-2xl font-black text-emerald-400">
                      {previewEbook.discountPrice !== undefined && previewEbook.discountPrice > 0 
                        ? `${previewEbook.currency} ${previewEbook.discountPrice}` 
                        : (previewEbook.price === 0 ? 'FREE' : `${previewEbook.currency} ${previewEbook.price}`)}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setBuyingEbook(previewEbook);
                      setPreviewEbook(null);
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-900/40 cursor-pointer flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Buy & Download PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- CHECKOUT / BUY NOW MODAL --- */}
      {buyingEbook && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative space-y-6">
            <button
              onClick={() => setBuyingEbook(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
              <div className="p-2.5 bg-red-600/20 text-red-500 rounded-xl border border-red-500/30">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Complete Your Order</h3>
                <p className="text-xs text-slate-400">Unlock instant PDF download access</p>
              </div>
            </div>

            {/* E-Book Order Summary */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center space-x-3">
              <img
                src={buyingEbook.coverImage}
                alt={buyingEbook.title}
                className="w-12 h-16 object-cover rounded-lg flex-shrink-0"
              />
              <div className="flex-1 overflow-hidden">
                <h4 className="text-xs font-bold text-white truncate">{buyingEbook.title}</h4>
                <p className="text-[10px] text-slate-400">PDF Publication • {buyingEbook.author}</p>
                <div className="text-xs font-extrabold text-emerald-400 mt-1">
                  Amount: {buyingEbook.discountPrice !== undefined && buyingEbook.discountPrice > 0 
                    ? `${buyingEbook.currency} ${buyingEbook.discountPrice}` 
                    : `${buyingEbook.currency} ${buyingEbook.price}`}
                </div>
              </div>
            </div>

            {/* Customer Details Form */}
            <form onSubmit={handleProcessCheckout} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Email Address * (For PDF Delivery)</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Payment Gateway Options */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-300 uppercase">Select Payment Gateway</label>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedGateway('UPI')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedGateway === 'UPI' 
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <QrCode className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                    <span className="text-[11px]">UPI (GPay/Paytm)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedGateway('Razorpay')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedGateway === 'Razorpay' 
                        ? 'bg-blue-950/60 border-blue-500 text-blue-300 font-bold' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                    <span className="text-[11px]">Razorpay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedGateway('PayPal')}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedGateway === 'PayPal' 
                        ? 'bg-indigo-950/60 border-indigo-500 text-indigo-300 font-bold' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5 mx-auto mb-1 text-indigo-400" />
                    <span className="text-[11px]">PayPal</span>
                  </button>
                </div>
              </div>

              {/* UPI QR Display Box */}
              {selectedGateway === 'UPI' && (
                <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-800/50 text-center space-y-2">
                  <p className="text-[11px] text-emerald-300 font-bold">Official UPI Address:</p>
                  <div className="flex items-center justify-center space-x-2 bg-slate-950 p-2 rounded-lg border border-slate-800 font-mono text-xs text-white">
                    <span>{paymentSettings?.upi?.upiId || 'fastcoverages@upi'}</span>
                    <button type="button" onClick={handleCopyUpi} className="text-emerald-400 hover:text-white cursor-pointer">
                      {copiedUpi ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-red-900/40 transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Secure Payment...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pay Now & Unlock E-Book</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- RECEIPT & DOWNLOAD UNLOCKED MODAL --- */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl relative animate-fadeIn">
            <button
              onClick={() => setActiveReceipt(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-white">Payment Successful!</h3>
              <p className="text-xs text-slate-300 mt-1">Thank you for your order. Your E-Book is unlocked.</p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-left text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Transaction ID:</span>
                <span className="font-mono text-white font-bold">{activeReceipt.purchase.transactionId}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>E-Book Title:</span>
                <span className="text-white font-bold truncate max-w-[180px]">{activeReceipt.purchase.ebookTitle}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Amount Paid:</span>
                <span className="text-emerald-400 font-bold">{activeReceipt.purchase.currency} {activeReceipt.purchase.amountPaid}</span>
              </div>
            </div>

            <a
              href={activeReceipt.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>Download PDF File Now</span>
            </a>
          </div>
        </div>
      )}

      {/* --- IN-APP PDF READER MODAL --- */}
      {readingEbook && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
          {/* Reader Top Bar */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-5 h-5 text-red-500" />
              <div>
                <h4 className="text-sm font-bold text-white leading-none">{readingEbook.title}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">FAST COVERAGES Official PDF Reader</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <a
                href={readingEbook.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Copy</span>
              </a>
              <button
                onClick={() => setReadingEbook(null)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* PDF Viewer Frame */}
          <div className="flex-1 bg-slate-950 p-2 sm:p-4">
            <iframe
              src={readingEbook.pdfUrl}
              title={readingEbook.title}
              className="w-full h-full rounded-xl border border-slate-800 bg-slate-900"
            />
          </div>
        </div>
      )}
    </div>
  );
};
