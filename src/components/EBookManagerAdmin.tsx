import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Upload, DollarSign, Eye, Edit3, Trash2, CheckCircle, 
  XCircle, Calendar, Plus, RefreshCw, BarChart2, ShieldCheck, 
  CreditCard, FileText, Check, AlertCircle, ArrowUpRight, Download,
  Layers, Lock, Sparkles, Image as ImageIcon, Search, ExternalLink
} from 'lucide-react';
import { EBook, PaymentSettings, EBookPurchase } from '../types';

interface EBookManagerAdminProps {
  ebooks: EBook[];
  paymentSettings: PaymentSettings;
  purchases: EBookPurchase[];
  onSaveEBook: (ebook: Partial<EBook>) => Promise<void>;
  onDeleteEBook: (id: string) => Promise<void>;
  onSavePaymentSettings: (settings: PaymentSettings) => Promise<void>;
  adminToken?: string;
}

export const EBookManagerAdmin: React.FC<EBookManagerAdminProps> = ({
  ebooks,
  paymentSettings: initialPaymentSettings,
  purchases,
  onSaveEBook,
  onDeleteEBook,
  onSavePaymentSettings,
  adminToken
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ebooks' | 'add' | 'payment' | 'reports'>('ebooks');
  
  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [author, setAuthor] = useState('FAST COVERAGES Editorial');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Business & Economy');
  const [price, setPrice] = useState<number>(199);
  const [discountPrice, setDiscountPrice] = useState<number | ''>(149);
  const [currency, setCurrency] = useState('₹');
  const [published, setPublished] = useState(true);
  const [scheduledDate, setScheduledDate] = useState('');
  
  // PDF Upload State
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfFileSize, setPdfFileSize] = useState('');
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);

  // Cover & Banner Image State
  const [coverImage, setCoverImage] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Preview Modal
  const [previewEbook, setPreviewEbook] = useState<EBook | null>(null);

  // Feedback banner
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Payment Settings Form State
  const [paymentForm, setPaymentForm] = useState<PaymentSettings>(() => initialPaymentSettings || {
    razorpay: { keyId: 'rzp_live_fc_global_2026', secretKey: 'fc_razorpay_secret_key', enabled: true, isTestMode: false },
    upi: { upiId: 'fastcoverages@upi', payeeName: 'FAST COVERAGES MEDIA', enabled: true },
    paypal: { merchantEmail: 'payments@fastcoverages.com', clientId: 'paypal_client_id_fc_2026', secretKey: 'paypal_secret_key', enabled: true, isSandbox: false }
  });

  useEffect(() => {
    if (initialPaymentSettings) {
      setPaymentForm(initialPaymentSettings);
    }
  }, [initialPaymentSettings]);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleResetForm = () => {
    setEditingId(null);
    setTitle('');
    setSubtitle('');
    setAuthor('FAST COVERAGES Editorial');
    setDescription('');
    setCategory('Business & Economy');
    setPrice(199);
    setDiscountPrice(149);
    setCurrency('₹');
    setPublished(true);
    setScheduledDate('');
    setPdfUrl('');
    setPdfFileName('');
    setPdfFileSize('');
    setCoverImage('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800');
    setBannerImage('');
  };

  const handleStartEdit = (ebook: EBook) => {
    setEditingId(ebook.id);
    setTitle(ebook.title);
    setSubtitle(ebook.subtitle || '');
    setAuthor(ebook.author || '');
    setDescription(ebook.description || '');
    setCategory(ebook.category || 'Business & Economy');
    setPrice(ebook.price);
    setDiscountPrice(ebook.discountPrice !== undefined ? ebook.discountPrice : '');
    setCurrency(ebook.currency || '₹');
    setPublished(ebook.published);
    setScheduledDate(ebook.scheduledDate || '');
    setPdfUrl(ebook.pdfUrl || '');
    setPdfFileName(ebook.pdfFileName || '');
    setPdfFileSize(ebook.pdfFileSize || '');
    setCoverImage(ebook.coverImage || '');
    setBannerImage(ebook.bannerImage || '');
    setActiveSubTab('add');
  };

  // PDF Drag & Drop / File Upload Handler
  const handlePdfFileSelect = async (file: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      showFeedback('Please select a valid PDF file (.pdf)', 'error');
      return;
    }

    setUploadingPdf(true);
    setPdfProgress(15);
    setPdfFileName(file.name);
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    setPdfFileSize(sizeInMB);

    try {
      const reader = new FileReader();
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 80) + 15;
          setPdfProgress(percent);
        }
      };

      reader.onload = async () => {
        const base64 = reader.result as string;
        setPdfProgress(90);

        try {
          const res = await fetch('/api/upload-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: file.name, base64 })
          });
          const data = await res.json();
          if (data.success && data.fileUrl) {
            setPdfUrl(data.fileUrl);
            setPdfProgress(100);
            showFeedback(`PDF "${file.name}" uploaded successfully!`);
          } else {
            // Fallback to Base64 URI if server upload response error
            setPdfUrl(base64);
            setPdfProgress(100);
            showFeedback(`PDF attached successfully.`);
          }
        } catch (err) {
          setPdfUrl(base64);
          setPdfProgress(100);
          showFeedback(`PDF file loaded successfully.`);
        } finally {
          setUploadingPdf(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setUploadingPdf(false);
      showFeedback('Failed to read PDF file', 'error');
    }
  };

  // Cover Image Upload Handler
  const handleImageUpload = (file: File, target: 'cover' | 'banner') => {
    if (!file) return;
    if (target === 'cover') setUploadingCover(true);
    else setUploadingBanner(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, base64 })
        });
        const data = await res.json();
        const finalUrl = data.success && data.fileUrl ? data.fileUrl : base64;
        if (target === 'cover') setCoverImage(finalUrl);
        else setBannerImage(finalUrl);
        showFeedback(`${target === 'cover' ? 'Cover' : 'Banner'} image uploaded successfully!`);
      } catch (err) {
        if (target === 'cover') setCoverImage(base64);
        else setBannerImage(base64);
        showFeedback(`${target === 'cover' ? 'Cover' : 'Banner'} image uploaded.`);
      } finally {
        if (target === 'cover') setUploadingCover(false);
        else setUploadingBanner(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showFeedback('E-Book title is required', 'error');
      return;
    }
    if (!pdfUrl) {
      showFeedback('Please upload or provide a PDF file for this E-Book', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const ebookPayload: Partial<EBook> = {
        id: editingId || `ebook-${Date.now()}`,
        title: title.trim(),
        subtitle: subtitle.trim(),
        author: author.trim(),
        description: description.trim(),
        category,
        price: Number(price) || 0,
        discountPrice: discountPrice !== '' ? Number(discountPrice) : undefined,
        currency,
        pdfUrl,
        pdfFileName: pdfFileName || 'document.pdf',
        pdfFileSize: pdfFileSize || '3.5 MB',
        coverImage: coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
        bannerImage: bannerImage || undefined,
        published,
        scheduledDate: scheduledDate || undefined,
        isFree: Number(price) === 0
      };

      await onSaveEBook(ebookPayload);
      showFeedback(editingId ? 'E-Book updated successfully!' : 'New E-Book published successfully!');
      handleResetForm();
      setActiveSubTab('ebooks');
    } catch (err: any) {
      showFeedback(err.message || 'Error saving E-Book', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (ebook: EBook) => {
    try {
      await onSaveEBook({
        ...ebook,
        published: !ebook.published
      });
      showFeedback(`E-Book "${ebook.title}" ${!ebook.published ? 'Published' : 'Disabled'}`);
    } catch (err) {
      showFeedback('Failed to update E-Book status', 'error');
    }
  };

  const handleDeleteBook = async (id: string, titleStr: string) => {
    if (window.confirm(`Are you sure you want to delete the E-Book "${titleStr}"?`)) {
      try {
        await onDeleteEBook(id);
        showFeedback('E-Book deleted successfully.');
      } catch (err) {
        showFeedback('Failed to delete E-Book', 'error');
      }
    }
  };

  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSavePaymentSettings(paymentForm);
      showFeedback('Payment Gateways Configuration Saved Successfully!');
    } catch (err) {
      showFeedback('Failed to save payment settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered eBooks
  const categoriesList = ['All', 'Business & Economy', 'Politics & Diplomacy', 'Technology & AI', 'Investigative Reports', 'World Affairs', 'Defense & Security'];

  const filteredEBooks = ebooks.filter(b => {
    const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate Sales Metrics
  const totalBooksCount = ebooks.length;
  const totalSalesCount = ebooks.reduce((sum, b) => sum + (b.salesCount || 0), 0);
  const totalRevenueAmount = ebooks.reduce((sum, b) => sum + (b.revenue || 0), 0);

  return (
    <div className="bg-slate-900 text-slate-100 rounded-xl border border-slate-800 p-4 sm:p-6 shadow-2xl">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-red-600/20 text-red-500 rounded-lg border border-red-500/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                E-BOOK MARKETPLACE MANAGEMENT
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800">
                  ADMIN CONTROL
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Manage digital PDF publications, pricing, downloads, and payment gateway configurations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { handleResetForm(); setActiveSubTab('add'); }}
            className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg shadow-lg shadow-red-900/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New E-Book</span>
          </button>
        </div>
      </div>

      {/* Status Feedback Banner */}
      {statusMessage && (
        <div className={`mt-4 p-3.5 rounded-lg border text-sm flex items-center justify-between animate-fadeIn ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200' 
            : 'bg-red-950/80 border-red-500/50 text-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            {statusMessage.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub Tabs Navigation */}
      <div className="flex overflow-x-auto space-x-2 border-b border-slate-800 my-6 pb-2 scrollbar-none">
        <button
          onClick={() => setActiveSubTab('ebooks')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'ebooks'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>All E-Books ({ebooks.length})</span>
        </button>

        <button
          onClick={() => { if (activeSubTab !== 'add') handleResetForm(); setActiveSubTab('add'); }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'add'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>{editingId ? 'Edit E-Book' : 'Upload & Publish PDF'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('payment')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'payment'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment Gateways (Razorpay/UPI/PayPal)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reports')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'reports'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Sales & Revenue Reports</span>
        </button>
      </div>

      {/* --- SUB TAB 1: ALL E-BOOKS LIST --- */}
      {activeSubTab === 'ebooks' && (
        <div className="space-y-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>TOTAL E-BOOKS PUBLISHED</span>
                <BookOpen className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-2xl font-bold text-white mt-2">{totalBooksCount}</div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>TOTAL SALES COPIES</span>
                <Download className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 mt-2">{totalSalesCount} Copies</div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>TOTAL REVENUE GENERATED</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400 mt-2">₹ {totalRevenueAmount.toLocaleString()}</div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto scrollbar-none">
              <span className="text-xs text-slate-400 whitespace-nowrap">Category:</span>
              {categoriesList.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* E-Books Grid */}
          {filteredEBooks.length === 0 ? (
            <div className="text-center py-16 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-semibold text-base">No E-Books found</p>
              <p className="text-slate-500 text-xs mt-1">Click "Upload New E-Book" to publish your first PDF publication.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEBooks.map(ebook => (
                <div 
                  key={ebook.id}
                  className="bg-slate-800/70 border border-slate-700/80 rounded-xl overflow-hidden hover:border-red-500/50 transition-all flex flex-col group shadow-lg"
                >
                  {/* Cover Header */}
                  <div className="relative h-48 bg-slate-900 overflow-hidden">
                    <img 
                      src={ebook.coverImage} 
                      alt={ebook.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3 flex items-center space-x-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ebook.published ? 'bg-emerald-500/90 text-white' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {ebook.published ? 'ACTIVE / LIVE' : 'DISABLED'}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-950/90 text-red-300 border border-red-800">
                        {ebook.category}
                      </span>
                    </div>

                    {/* Price Tag */}
                    <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur border border-slate-700 text-white font-bold px-3 py-1 rounded-lg text-sm shadow-xl flex items-center space-x-1">
                      {ebook.discountPrice !== undefined && ebook.discountPrice > 0 ? (
                        <>
                          <span className="text-red-400 font-extrabold">{ebook.currency} {ebook.discountPrice}</span>
                          <span className="text-slate-500 line-through text-xs ml-1">{ebook.currency} {ebook.price}</span>
                        </>
                      ) : (
                        <span>{ebook.price === 0 ? 'FREE' : `${ebook.currency} ${ebook.price}`}</span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-white text-base line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                        {ebook.title}
                      </h3>
                      {ebook.subtitle && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1 italic">{ebook.subtitle}</p>
                      )}
                      <p className="text-xs text-slate-300 mt-2 line-clamp-2">{ebook.description}</p>
                      
                      <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-700/50 pt-2">
                        <span>By {ebook.author}</span>
                        <span className="text-slate-500">{ebook.pdfFileSize || 'PDF'}</span>
                      </div>
                    </div>

                    {/* Footer Controls */}
                    <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setPreviewEbook(ebook)}
                          className="p-2 bg-slate-700/60 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center space-x-1 cursor-pointer"
                          title="Preview E-Book Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Preview</span>
                        </button>
                        <button
                          onClick={() => handleStartEdit(ebook)}
                          className="p-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg text-xs font-medium flex items-center space-x-1 border border-blue-500/30 cursor-pointer"
                          title="Edit E-Book"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleTogglePublish(ebook)}
                          className={`p-2 rounded-lg text-xs font-medium cursor-pointer ${
                            ebook.published 
                              ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30' 
                              : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                          }`}
                          title={ebook.published ? 'Disable E-Book' : 'Enable E-Book'}
                        >
                          {ebook.published ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDeleteBook(ebook.id, ebook.title)}
                          className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg text-xs font-medium border border-red-500/30 cursor-pointer"
                          title="Delete E-Book"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- SUB TAB 2: UPLOAD & EDIT FORM --- */}
      {activeSubTab === 'add' && (
        <form onSubmit={handleSaveBook} className="space-y-6 max-w-4xl mx-auto bg-slate-800/40 p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-red-500" />
              {editingId ? 'Edit E-Book Publication' : 'Upload & Publish New E-Book (PDF)'}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={handleResetForm}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Cancel Editing
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  E-Book Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Global Business & World Foreign Policy"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Subtitle (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Geopolitics, Macroeconomic Shifts & Defense Analysis"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Author Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hari Om Mishra"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="Business & Economy">Business & Economy</option>
                    <option value="Politics & Diplomacy">Politics & Diplomacy</option>
                    <option value="Technology & AI">Technology & AI</option>
                    <option value="Investigative Reports">Investigative Reports</option>
                    <option value="World Affairs">World Affairs</option>
                    <option value="Defense & Security">Defense & Security</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  E-Book Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide a detailed summary of what readers will learn from this publication..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              {/* Pricing Section */}
              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700 space-y-3">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>PRICING & CURRENCY</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="₹">₹ INR</option>
                      <option value="$">$ USD</option>
                      <option value="€">€ EUR</option>
                      <option value="£">£ GBP</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Original Price</label>
                    <input
                      type="number"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Offer Price (Optional)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 149"
                      value={discountPrice}
                      onChange={(e) => setDiscountPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: PDF Upload & Media Cover */}
            <div className="space-y-4">
              {/* PDF Document Upload Box */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>PDF Document File <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-slate-400">Supported: .pdf</span>
                </label>

                <div className="border-2 border-dashed border-slate-700 hover:border-red-500 rounded-xl p-4 bg-slate-900/60 text-center transition-all">
                  {pdfUrl ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center space-x-3 text-red-400 bg-red-950/40 p-3 rounded-lg border border-red-800/50">
                        <FileText className="w-8 h-8 flex-shrink-0" />
                        <div className="text-left overflow-hidden">
                          <p className="text-xs font-bold text-white truncate">{pdfFileName || 'PDF File Attached'}</p>
                          <p className="text-[10px] text-slate-400">{pdfFileSize || 'Ready for Download'}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-center space-x-3">
                        <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg cursor-pointer transition-all border border-slate-700">
                          Replace PDF
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => e.target.files?.[0] && handlePdfFileSelect(e.target.files[0])}
                            className="hidden"
                          />
                        </label>
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-xs font-medium text-red-300 rounded-lg border border-red-500/30 flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview PDF</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      <p className="text-xs text-slate-300 font-semibold">Choose File or Drag & Drop PDF here</p>
                      <p className="text-[10px] text-slate-500 mt-1">Upload high-resolution editorial PDF files securely</p>
                      <label className="mt-3 inline-block px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg cursor-pointer shadow-md transition-all">
                        Browse PDF File
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => e.target.files?.[0] && handlePdfFileSelect(e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}

                  {/* Progress Bar */}
                  {uploadingPdf && (
                    <div className="mt-3">
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-red-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${pdfProgress}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Uploading PDF... {pdfProgress}%</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  E-Book Cover Image Banner <span className="text-red-500">*</span>
                </label>

                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      placeholder="Paste image URL or upload below..."
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                    <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg border border-slate-700 cursor-pointer whitespace-nowrap">
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'cover')}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {coverImage && (
                    <div className="h-28 bg-slate-900 rounded-lg overflow-hidden border border-slate-700 relative">
                      <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 bg-slate-900/90 text-white text-[10px] px-2 py-0.5 rounded font-bold">
                        Cover Preview
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Publish & Schedule Toggles */}
              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-white block">Publish Status</label>
                    <p className="text-[10px] text-slate-400">Enable to make this E-Book live on homepage store</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPublished(!published)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${published ? 'bg-emerald-500' : 'bg-slate-700'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${published ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="border-t border-slate-800 pt-3">
                  <label className="block text-[11px] text-slate-400 mb-1">Schedule Publishing Date (Optional)</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg cursor-pointer"
            >
              Reset Form
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-lg shadow-lg shadow-red-900/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving E-Book...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{editingId ? 'Update E-Book' : 'Publish E-Book Now'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* --- SUB TAB 3: PAYMENT GATEWAYS CONFIGURATION --- */}
      {activeSubTab === 'payment' && (
        <form onSubmit={handleSavePaymentConfig} className="space-y-6 max-w-4xl mx-auto bg-slate-800/40 p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                Payment Gateway Configurations
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure Razorpay, UPI ID, and PayPal credentials for instant automated payment collection.
              </p>
            </div>
          </div>

          {/* 1. RAZORPAY SETTINGS */}
          <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30 font-bold text-xs">
                  RAZORPAY
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Razorpay Gateway</h4>
                  <p className="text-[10px] text-slate-400">Accept Credit Cards, NetBanking, Debit Cards & UPI via Razorpay</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-400">Enable</span>
                <button
                  type="button"
                  onClick={() => setPaymentForm({
                    ...paymentForm,
                    razorpay: { ...paymentForm.razorpay, enabled: !paymentForm.razorpay.enabled }
                  })}
                  className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                    paymentForm.razorpay?.enabled ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    paymentForm.razorpay?.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Razorpay Key ID</label>
                <input
                  type="text"
                  placeholder="rzp_live_xxxxxxxxxxxx"
                  value={paymentForm.razorpay?.keyId || ''}
                  onChange={(e) => setPaymentForm({
                    ...paymentForm,
                    razorpay: { ...paymentForm.razorpay, keyId: e.target.value }
                  })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Razorpay Secret Key</label>
                <input
                  type="password"
                  placeholder="Secret Key..."
                  value={paymentForm.razorpay?.secretKey || ''}
                  onChange={(e) => setPaymentForm({
                    ...paymentForm,
                    razorpay: { ...paymentForm.razorpay, secretKey: e.target.value }
                  })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 2. DIRECT UPI SETTINGS */}
          <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-lg border border-emerald-500/30 font-bold text-xs">
                  UPI DIRECT
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Direct UPI Payment (GPay / PhonePe / Paytm)</h4>
                  <p className="text-[10px] text-slate-400">Accept instant zero-fee UPI payments via VPA address</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-400">Enable</span>
                <button
                  type="button"
                  onClick={() => setPaymentForm({
                    ...paymentForm,
                    upi: { ...paymentForm.upi, enabled: !paymentForm.upi.enabled }
                  })}
                  className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                    paymentForm.upi?.enabled ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    paymentForm.upi?.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">UPI ID (VPA)</label>
                <input
                  type="text"
                  placeholder="e.g. fastcoverages@upi"
                  value={paymentForm.upi?.upiId || ''}
                  onChange={(e) => setPaymentForm({
                    ...paymentForm,
                    upi: { ...paymentForm.upi, upiId: e.target.value }
                  })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payee Name</label>
                <input
                  type="text"
                  placeholder="e.g. FAST COVERAGES MEDIA"
                  value={paymentForm.upi?.payeeName || ''}
                  onChange={(e) => setPaymentForm({
                    ...paymentForm,
                    upi: { ...paymentForm.upi, payeeName: e.target.value }
                  })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* 3. PAYPAL SETTINGS */}
          <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30 font-bold text-xs">
                  PAYPAL
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">PayPal Global Gateway</h4>
                  <p className="text-[10px] text-slate-400">Accept international credit cards and USD payments globally</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-400">Enable</span>
                <button
                  type="button"
                  onClick={() => setPaymentForm({
                    ...paymentForm,
                    paypal: { ...paymentForm.paypal, enabled: !paymentForm.paypal.enabled }
                  })}
                  className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                    paymentForm.paypal?.enabled ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    paymentForm.paypal?.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">PayPal Merchant Email</label>
                <input
                  type="email"
                  placeholder="payments@fastcoverages.com"
                  value={paymentForm.paypal?.merchantEmail || ''}
                  onChange={(e) => setPaymentForm({
                    ...paymentForm,
                    paypal: { ...paymentForm.paypal, merchantEmail: e.target.value }
                  })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">PayPal Client ID</label>
                <input
                  type="text"
                  placeholder="Client ID..."
                  value={paymentForm.paypal?.clientId || ''}
                  onChange={(e) => setPaymentForm({
                    ...paymentForm,
                    paypal: { ...paymentForm.paypal, clientId: e.target.value }
                  })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-lg shadow-lg shadow-emerald-900/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Save Payment Gateway Credentials</span>
            </button>
          </div>
        </form>
      )}

      {/* --- SUB TAB 4: SALES & REVENUE REPORTS --- */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400 font-bold uppercase">TOTAL PUBLICATIONS</div>
              <div className="text-3xl font-extrabold text-white mt-2">{totalBooksCount}</div>
            </div>
            <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400 font-bold uppercase">COPIES SOLD</div>
              <div className="text-3xl font-extrabold text-emerald-400 mt-2">{totalSalesCount}</div>
            </div>
            <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-400 font-bold uppercase">GROSS REVENUE</div>
              <div className="text-3xl font-extrabold text-amber-400 mt-2">₹ {totalRevenueAmount.toLocaleString()}</div>
            </div>
          </div>

          {/* Transaction Log Table */}
          <div className="bg-slate-800/60 rounded-xl border border-slate-700/80 overflow-hidden">
            <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-400" />
                Customer Purchase & Sales History ({purchases.length})
              </h4>
            </div>

            {purchases.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No orders recorded yet. When users purchase E-Books, transaction records will display here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Txn ID</th>
                      <th className="px-4 py-3">E-Book Title</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Gateway</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {purchases.map(p => (
                      <tr key={p.id} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono text-slate-400">{p.transactionId}</td>
                        <td className="px-4 py-3 font-semibold text-white">{p.ebookTitle}</td>
                        <td className="px-4 py-3">
                          <div>{p.buyerName}</div>
                          <div className="text-[10px] text-slate-400">{p.buyerEmail}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-200 text-[10px] font-bold">
                            {p.paymentGateway}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-400">{p.currency} {p.amountPaid}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                            {p.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {new Date(p.purchasedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- PREVIEW MODAL --- */}
      {previewEbook && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setPreviewEbook(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800 cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row gap-6">
              <img
                src={previewEbook.coverImage}
                alt={previewEbook.title}
                className="w-40 h-56 object-cover rounded-xl shadow-2xl border border-slate-700 flex-shrink-0 mx-auto sm:mx-0"
              />
              <div className="space-y-3 flex-1">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-950 text-red-300 border border-red-800">
                  {previewEbook.category}
                </span>
                <h3 className="text-xl font-bold text-white">{previewEbook.title}</h3>
                {previewEbook.subtitle && <p className="text-xs text-slate-400 italic">{previewEbook.subtitle}</p>}
                <p className="text-xs text-slate-300">{previewEbook.description}</p>
                <div className="text-xs text-slate-400">By <strong className="text-white">{previewEbook.author}</strong></div>
                
                <div className="p-3 bg-slate-800/80 rounded-lg flex items-center justify-between">
                  <span className="text-xs text-slate-400">Price:</span>
                  <span className="text-lg font-bold text-emerald-400">
                    {previewEbook.discountPrice !== undefined ? `${previewEbook.currency} ${previewEbook.discountPrice}` : `${previewEbook.currency} ${previewEbook.price}`}
                  </span>
                </div>

                <a
                  href={previewEbook.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download / Preview PDF File</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
