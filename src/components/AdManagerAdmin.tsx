import React, { useState, useRef } from 'react';
import { AdSlot, Category } from '../types';
import { 
  Plus, Upload, Image as ImageIcon, Video, Calendar, Link as LinkIcon, 
  Trash2, Edit3, Eye, MousePointerClick, Pin, CheckCircle2, XCircle, 
  Play, Pause, Volume2, VolumeX, Sparkles, ExternalLink, RefreshCw, BarChart2,
  Sliders, Layers, Tag, ArrowUpRight, AlertCircle, Info, FileText, Check
} from 'lucide-react';

interface AdManagerAdminProps {
  adSlots: AdSlot[];
  categories: Category[];
  onSaveAdSlots: (updated: AdSlot[]) => void;
  showBanner: (msg: string) => void;
}

const POSITIONS = [
  'Homepage Top Banner',
  'Homepage Middle Banner',
  'Homepage Bottom Banner',
  'Between Articles',
  'Article Top Section',
  'Article Middle Section',
  'Article Bottom Section',
  'Live Section',
  'Sidebar Section',
  'Footer Section',
  'Mobile Banner',
  'Breaking News Section',
  'Full Screen Popup'
];

export default function AdManagerAdmin({ adSlots, categories, onSaveAdSlots, showBanner }: AdManagerAdminProps) {
  const [ads, setAds] = useState<AdSlot[]>(adSlots || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<AdSlot | null>(null);
  const [previewAd, setPreviewAd] = useState<AdSlot | null>(null);
  const [filterPos, setFilterPos] = useState<string>('All');
  const [isUploading, setIsUploading] = useState(false);

  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formState, setFormState] = useState<{
    id: string;
    title: string;
    description: string;
    mediaType: 'image' | 'video' | 'html';
    imageUrl: string;
    videoUrl: string;
    targetUrl: string;
    position: string;
    paragraphPosition: number;
    category: string;
    targetPlacementScope: string;
    startDate: string;
    endDate: string;
    active: boolean;
    isPinned: boolean;
    autoPlay: boolean;
    muted: boolean;
    code: string;
  }>({
    id: '',
    title: '',
    description: '',
    mediaType: 'image',
    imageUrl: '',
    videoUrl: '',
    targetUrl: 'https://',
    position: 'Homepage Top Banner',
    paragraphPosition: 2,
    category: 'All',
    targetPlacementScope: 'Every Article',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    active: true,
    isPinned: false,
    autoPlay: true,
    muted: true,
    code: ''
  });

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate Statistics
  const totalAds = ads.length;
  const activeAdsCount = ads.filter(a => a.active && (!a.endDate || a.endDate >= todayStr)).length;
  const expiredAdsCount = ads.filter(a => a.endDate && a.endDate < todayStr).length;
  const totalViews = ads.reduce((acc, a) => acc + (a.views || 0), 0);
  const totalClicks = ads.reduce((acc, a) => acc + (a.clicks || 0), 0);
  const overallCtr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : '0.00';

  const resetForm = () => {
    setFormState({
      id: '',
      title: '',
      description: '',
      mediaType: 'image',
      imageUrl: '',
      videoUrl: '',
      targetUrl: 'https://',
      position: 'Homepage Top Banner',
      paragraphPosition: 2,
      category: 'All',
      targetPlacementScope: 'Every Article',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      active: true,
      isPinned: false,
      autoPlay: true,
      muted: true,
      code: ''
    });
    setEditingAd(null);
  };

  const handleOpenAddModal = (defaultMediaType: 'image' | 'video' = 'image') => {
    resetForm();
    setFormState(prev => ({ ...prev, mediaType: defaultMediaType }));
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ad: AdSlot) => {
    setEditingAd(ad);
    setFormState({
      id: ad.id,
      title: ad.title || ad.label || '',
      description: ad.description || '',
      mediaType: ad.mediaType || (ad.videoUrl ? 'video' : 'image'),
      imageUrl: ad.imageUrl || '',
      videoUrl: ad.videoUrl || '',
      targetUrl: ad.targetUrl || 'https://',
      position: ad.position || ad.type || 'Homepage Top Banner',
      paragraphPosition: ad.paragraphPosition || 2,
      category: ad.category || 'All',
      targetPlacementScope: ad.targetPlacementScope || 'Every Article',
      startDate: ad.startDate || new Date().toISOString().split('T')[0],
      endDate: ad.endDate || '',
      active: ad.active !== false,
      isPinned: !!ad.isPinned,
      autoPlay: ad.autoPlay !== false,
      muted: ad.muted !== false,
      code: ad.code || ''
    });
    setIsModalOpen(true);
  };

  // Image File Upload Handler
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        if (data.fileUrl) {
          setFormState(prev => ({
            ...prev,
            imageUrl: data.fileUrl,
            mediaType: 'image'
          }));
          showBanner('Image uploaded successfully to server.');
        }
      } else {
        // Fallback to FileReader Base64
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormState(prev => ({
            ...prev,
            imageUrl: reader.result as string,
            mediaType: 'image'
          }));
          showBanner('Image uploaded successfully.');
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      // Fallback Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormState(prev => ({
          ...prev,
          imageUrl: reader.result as string,
          mediaType: 'image'
        }));
        showBanner('Image uploaded locally.');
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  // Video File Upload Handler
  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('video', file);

      const res = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        if (data.fileUrl) {
          setFormState(prev => ({
            ...prev,
            videoUrl: data.fileUrl,
            mediaType: 'video'
          }));
          showBanner('Video uploaded successfully to server.');
        }
      } else {
        // Fallback Blob URL
        const url = URL.createObjectURL(file);
        setFormState(prev => ({
          ...prev,
          videoUrl: url,
          mediaType: 'video'
        }));
        showBanner('Video loaded into browser session.');
      }
    } catch (err) {
      const url = URL.createObjectURL(file);
      setFormState(prev => ({
        ...prev,
        videoUrl: url,
        mediaType: 'video'
      }));
      showBanner('Video preview loaded.');
    } finally {
      setIsUploading(false);
    }
  };

  // Save Advertisement (Create or Edit)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.title.trim()) {
      alert('Please enter an Advertisement Title.');
      return;
    }

    if (!formState.targetUrl.trim() || formState.targetUrl === 'https://') {
      alert('Please enter a valid Destination Redirect Link URL (e.g. https://advertiserwebsite.com).');
      return;
    }

    const newAdId = formState.id || `ad-${Date.now()}`;
    const formattedTargetUrl = formState.targetUrl.startsWith('http') 
      ? formState.targetUrl 
      : `https://${formState.targetUrl}`;

    const newAd: AdSlot = {
      id: newAdId,
      title: formState.title,
      label: formState.title,
      description: formState.description,
      mediaType: formState.mediaType,
      imageUrl: formState.imageUrl,
      videoUrl: formState.videoUrl,
      mediaUrl: formState.mediaType === 'video' ? formState.videoUrl : formState.imageUrl,
      targetUrl: formattedTargetUrl,
      type: formState.position,
      position: formState.position,
      paragraphPosition: Number(formState.paragraphPosition) || 2,
      category: formState.category,
      targetPlacementScope: formState.targetPlacementScope,
      startDate: formState.startDate,
      endDate: formState.endDate,
      active: formState.active,
      isPinned: formState.isPinned,
      autoPlay: formState.autoPlay,
      muted: formState.muted,
      code: formState.code,
      adType: formState.mediaType === 'video' ? 'Video Ad' : 'Image Ad',
      views: editingAd ? editingAd.views || 0 : 0,
      clicks: editingAd ? editingAd.clicks || 0 : 0,
      createdAt: editingAd ? editingAd.createdAt : new Date().toISOString()
    };

    let updatedList: AdSlot[];
    if (editingAd) {
      updatedList = ads.map(a => a.id === editingAd.id ? newAd : a);
    } else {
      updatedList = [newAd, ...ads];
    }

    setAds(updatedList);
    onSaveAdSlots(updatedList);

    // Save to API
    try {
      await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAd)
      });
    } catch (err) {
      // server sync fallback
    }

    setIsModalOpen(false);
    resetForm();
    showBanner(`Advertisement "${newAd.title}" saved successfully.`);
  };

  // Toggle Active State
  const handleToggleActive = async (id: string) => {
    const updated = ads.map(a => {
      if (a.id === id) {
        return { ...a, active: !a.active };
      }
      return a;
    });
    setAds(updated);
    onSaveAdSlots(updated);

    const item = updated.find(a => a.id === id);
    if (item) {
      fetch(`/api/ads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: item.active })
      }).catch(() => {});
      showBanner(`Advertisement "${item.title || item.label}" ${item.active ? 'enabled' : 'disabled'}.`);
    }
  };

  // Toggle Pin
  const handleTogglePin = async (id: string) => {
    const updated = ads.map(a => {
      if (a.id === id) {
        return { ...a, isPinned: !a.isPinned };
      }
      return a;
    });
    setAds(updated);
    onSaveAdSlots(updated);

    const item = updated.find(a => a.id === id);
    if (item) {
      fetch(`/api/ads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: item.isPinned })
      }).catch(() => {});
      showBanner(`Advertisement "${item.title || item.label}" ${item.isPinned ? 'pinned to top position' : 'unpinned'}.`);
    }
  };

  // Delete Ad
  const handleDeleteAd = async (id: string) => {
    const item = ads.find(a => a.id === id);
    if (!window.confirm(`Are you sure you want to permanently delete the advertisement "${item?.title || item?.label}"?`)) {
      return;
    }

    const updated = ads.filter(a => a.id !== id);
    setAds(updated);
    onSaveAdSlots(updated);

    try {
      await fetch(`/api/ads/${id}`, { method: 'DELETE' });
    } catch (err) {
      // ignore error
    }
    showBanner(`Advertisement permanently deleted.`);
  };

  const filteredAds = ads.filter(a => {
    if (filterPos === 'All') return true;
    if (filterPos === 'Active') return a.active && (!a.endDate || a.endDate >= todayStr);
    if (filterPos === 'Expired') return a.endDate && a.endDate < todayStr;
    if (filterPos === 'Image Ads') return a.mediaType === 'image' || (!a.videoUrl && a.imageUrl);
    if (filterPos === 'Video Ads') return a.mediaType === 'video' || !!a.videoUrl;
    return (a.position || a.type || '').toLowerCase().includes(filterPos.toLowerCase());
  });

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-red-500 animate-pulse" />
            <h2 className="text-xl font-black uppercase tracking-wide font-sans">
              ADVERTISEMENT MANAGEMENT SYSTEM
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Manage image, video, in-article, and pop-up advertisements across FAST COVERAGES GLOBAL NEWS NETWORK. Set target links, positions, and automated date schedules without touching website code.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleOpenAddModal('image')}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer font-mono"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Upload Image Ad</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddModal('video')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer font-mono"
          >
            <Video className="w-4 h-4" />
            <span>Upload Video Ad</span>
          </button>
        </div>
      </div>

      {/* 2. Analytics Dashboard Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold font-mono uppercase text-slate-400">Total Ads</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">{totalAds}</div>
          <span className="text-[10px] text-slate-400 mt-1">All Placements</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold font-mono uppercase text-emerald-500">Active Ads</span>
          <div className="text-2xl font-black text-emerald-500 mt-1 font-mono">{activeAdsCount}</div>
          <span className="text-[10px] text-slate-400 mt-1">Currently Running</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-amber-500/30 p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold font-mono uppercase text-amber-500">Expired Ads</span>
          <div className="text-2xl font-black text-amber-500 mt-1 font-mono">{expiredAdsCount}</div>
          <span className="text-[10px] text-slate-400 mt-1">Passed End Date</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-blue-500/30 p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold font-mono uppercase text-blue-500">Total Impressions</span>
          <div className="text-2xl font-black text-blue-500 mt-1 font-mono">{totalViews.toLocaleString()}</div>
          <span className="text-[10px] text-slate-400 mt-1">Total Views</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-purple-500/30 p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold font-mono uppercase text-purple-500">Total Clicks</span>
          <div className="text-2xl font-black text-purple-500 mt-1 font-mono">{totalClicks.toLocaleString()}</div>
          <span className="text-[10px] text-slate-400 mt-1">User Redirects</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-red-500/30 p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold font-mono uppercase text-red-500">Click Rate (CTR)</span>
          <div className="text-2xl font-black text-red-500 mt-1 font-mono">{overallCtr}%</div>
          <span className="text-[10px] text-slate-400 mt-1">Conversion Ratio</span>
        </div>
      </div>

      {/* 3. Filter Bar & Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-xs font-bold text-slate-400 uppercase font-mono mr-1">Filter:</span>
          {['All', 'Active', 'Expired', 'Image Ads', 'Video Ads', 'Homepage', 'Sidebar', 'Article', 'Popup'].map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => setFilterPos(tag)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer font-mono whitespace-nowrap ${
                filterPos === tag 
                  ? 'bg-red-600 text-white shadow' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="text-xs font-mono text-slate-400">
          Showing <span className="text-slate-900 dark:text-white font-bold">{filteredAds.length}</span> of {ads.length} Ads
        </div>
      </div>

      {/* 4. Advertisement List & Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[10px] font-mono font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                <th className="p-3.5">Media & Creative</th>
                <th className="p-3.5">Title & Link</th>
                <th className="p-3.5">Placement Position</th>
                <th className="p-3.5">Schedule</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-center">Analytics (Views/Clicks/CTR)</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredAds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-mono">
                    No advertisements match the selected filter. Click "Upload Image Ad" or "Upload Video Ad" above to create one.
                  </td>
                </tr>
              ) : (
                filteredAds.map((ad) => {
                  const isExpired = ad.endDate && ad.endDate < todayStr;
                  const isVideo = ad.mediaType === 'video' || !!ad.videoUrl;
                  const views = ad.views || 0;
                  const clicks = ad.clicks || 0;
                  const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : '0.0';

                  return (
                    <tr key={ad.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      {/* Media Preview */}
                      <td className="p-3.5">
                        <div className="w-20 h-12 bg-slate-900 rounded-lg overflow-hidden border border-slate-700/60 relative group shrink-0 flex items-center justify-center">
                          {isVideo && (ad.videoUrl || ad.mediaUrl) ? (
                            <video
                              src={ad.videoUrl || ad.mediaUrl}
                              className="w-full h-full object-cover"
                              muted
                            />
                          ) : ad.imageUrl || ad.mediaUrl ? (
                            <img
                              src={ad.imageUrl || ad.mediaUrl}
                              alt={ad.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-[10px] font-mono text-slate-400 p-1 text-center">HTML Ad</div>
                          )}
                          <span className={`absolute top-1 left-1 px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-wider text-white ${isVideo ? 'bg-indigo-600' : 'bg-red-600'}`}>
                            {isVideo ? 'VIDEO' : 'IMAGE'}
                          </span>
                        </div>
                      </td>

                      {/* Title & Link */}
                      <td className="p-3.5 max-w-xs">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white line-clamp-1">
                          {ad.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                          <span className="line-clamp-1">{ad.title || ad.label || 'Sponsored Ad'}</span>
                        </div>
                        <a
                          href={ad.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-mono text-red-500 hover:underline flex items-center gap-1 line-clamp-1 mt-0.5"
                        >
                          <span className="line-clamp-1">{ad.targetUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </td>

                      {/* Position */}
                      <td className="p-3.5">
                        <span className="inline-block px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px] font-bold font-mono border border-slate-200 dark:border-slate-700">
                          {ad.position || ad.type || 'Homepage Top Banner'}
                        </span>
                        {ad.paragraphPosition && (ad.position?.includes('Article') || ad.type?.includes('Article')) && (
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            After Para #{ad.paragraphPosition}
                          </div>
                        )}
                      </td>

                      {/* Schedule */}
                      <td className="p-3.5 font-mono text-[11px]">
                        <div>Start: {ad.startDate || 'Immediate'}</div>
                        <div className={isExpired ? 'text-amber-500 font-bold' : 'text-slate-400'}>
                          End: {ad.endDate || 'Ongoing'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold font-mono border border-amber-500/20">
                            <XCircle className="w-3 h-3" /> Expired
                          </span>
                        ) : ad.active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold font-mono border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 text-[10px] font-bold font-mono border border-slate-500/20">
                            Disabled
                          </span>
                        )}
                      </td>

                      {/* Analytics */}
                      <td className="p-3.5 text-center font-mono">
                        <div className="flex items-center justify-center gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 text-[9px] block">VIEWS</span>
                            <span className="font-bold text-slate-900 dark:text-white">{views.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[9px] block">CLICKS</span>
                            <span className="font-bold text-red-500">{clicks.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[9px] block">CTR</span>
                            <span className="font-bold text-emerald-500">{ctr}%</span>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Toggle Active */}
                          <button
                            type="button"
                            onClick={() => handleToggleActive(ad.id)}
                            className={`p-1.5 rounded transition cursor-pointer ${
                              ad.active ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-slate-400 hover:bg-slate-800'
                            }`}
                            title={ad.active ? 'Disable Advertisement' : 'Enable Advertisement'}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>

                          {/* Toggle Pin */}
                          <button
                            type="button"
                            onClick={() => handleTogglePin(ad.id)}
                            className={`p-1.5 rounded transition cursor-pointer ${
                              ad.isPinned ? 'text-amber-500 hover:bg-amber-500/10' : 'text-slate-400 hover:bg-slate-800'
                            }`}
                            title={ad.isPinned ? 'Unpin Advertisement' : 'Pin Advertisement to Top'}
                          >
                            <Pin className="w-4 h-4" />
                          </button>

                          {/* Live Preview */}
                          <button
                            type="button"
                            onClick={() => setPreviewAd(ad)}
                            className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded transition cursor-pointer"
                            title="Preview Advertisement"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(ad)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
                            title="Edit Advertisement"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteAd(ad.id)}
                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition cursor-pointer"
                            title="Delete Advertisement"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Create / Edit Advertisement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-black uppercase font-sans">
                  {editingAd ? 'Edit Advertisement' : 'Add New Advertisement'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 flex flex-col gap-5 text-xs text-slate-800 dark:text-slate-200">
              {/* Media Type Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="font-mono font-bold uppercase text-[10px] text-slate-400">
                  Advertisement Format & Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormState(prev => ({ ...prev, mediaType: 'image' }))}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold cursor-pointer transition ${
                      formState.mediaType === 'image'
                        ? 'border-red-600 bg-red-600/10 text-red-500'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Image Advertisement</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormState(prev => ({ ...prev, mediaType: 'video' }))}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold cursor-pointer transition ${
                      formState.mediaType === 'video'
                        ? 'border-indigo-600 bg-indigo-600/10 text-indigo-400'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>Video Advertisement</span>
                  </button>
                </div>
              </div>

              {/* Title & Description */}
              <div className="grid grid-cols-1 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-mono font-bold uppercase text-[10px] text-slate-400">
                    Advertisement Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Summer Special Promotion Campaign 2026"
                    value={formState.title}
                    onChange={e => setFormState(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg outline-none focus:border-red-500 dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-mono font-bold uppercase text-[10px] text-slate-400">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Brief internal note or tagline"
                    value={formState.description}
                    onChange={e => setFormState(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg outline-none focus:border-red-500 dark:text-white"
                  />
                </div>
              </div>

              {/* Destination Redirect Link URL */}
              <div className="flex flex-col gap-1">
                <label className="font-mono font-bold uppercase text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Destination Advertiser Link URL *</span>
                  <span className="text-emerald-500 font-sans normal-case text-[10px]">Clicking ad automatically redirects user here</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    placeholder="https://advertiserwebsite.com"
                    value={formState.targetUrl}
                    onChange={e => setFormState(prev => ({ ...prev, targetUrl: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 pl-8 rounded-lg outline-none focus:border-red-500 font-mono text-xs dark:text-white"
                  />
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Media File Upload Section */}
              {formState.mediaType === 'image' ? (
                <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 flex flex-col gap-3">
                  <label className="font-mono font-bold uppercase text-[10px] text-slate-400">
                    Upload Image Creative (JPG, JPEG, PNG, WEBP)
                  </label>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="file"
                      ref={imageFileInputRef}
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => imageFileInputRef.current?.click()}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Choose File</span>
                    </button>

                    <span className="text-slate-400 text-[11px] font-mono">OR enter image URL:</span>

                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={formState.imageUrl}
                      onChange={e => setFormState(prev => ({ ...prev, imageUrl: e.target.value }))}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg font-mono text-xs outline-none dark:text-white"
                    />
                  </div>

                  {formState.imageUrl && (
                    <div className="mt-2 relative max-h-[160px] rounded-lg overflow-hidden border border-slate-700">
                      <img src={formState.imageUrl} alt="Ad Preview" className="w-full h-32 object-cover" />
                      <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-mono px-2 py-0.5 rounded">Image Preview</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 flex flex-col gap-3">
                  <label className="font-mono font-bold uppercase text-[10px] text-slate-400">
                    Upload Video Creative (MP4, WEBM, MOV)
                  </label>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="file"
                      ref={videoFileInputRef}
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={handleVideoFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => videoFileInputRef.current?.click()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Choose Video File</span>
                    </button>

                    <span className="text-slate-400 text-[11px] font-mono">OR enter video URL:</span>

                    <input
                      type="text"
                      placeholder="https://assets.mixkit.co/videos/..."
                      value={formState.videoUrl}
                      onChange={e => setFormState(prev => ({ ...prev, videoUrl: e.target.value }))}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg font-mono text-xs outline-none dark:text-white"
                    />
                  </div>

                  {formState.videoUrl && (
                    <div className="mt-2 relative max-h-[180px] rounded-lg overflow-hidden border border-slate-700 bg-black">
                      <video src={formState.videoUrl} controls className="w-full h-36 object-contain" />
                    </div>
                  )}

                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formState.autoPlay}
                        onChange={e => setFormState(prev => ({ ...prev, autoPlay: e.target.checked }))}
                        className="rounded text-indigo-600"
                      />
                      <span className="font-bold text-[11px]">Auto Play Video</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formState.muted}
                        onChange={e => setFormState(prev => ({ ...prev, muted: e.target.checked }))}
                        className="rounded text-indigo-600"
                      />
                      <span className="font-bold text-[11px]">Mute Video by Default</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Placement Position & Paragraph Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-mono font-bold uppercase text-[10px] text-slate-400">
                    Advertisement Position
                  </label>
                  <select
                    value={formState.position}
                    onChange={e => setFormState(prev => ({ ...prev, position: e.target.value }))}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg outline-none font-sans dark:text-white"
                  >
                    {POSITIONS.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-mono font-bold uppercase text-[10px] text-slate-400">
                    In-Article Paragraph Position
                  </label>
                  <select
                    value={formState.paragraphPosition}
                    onChange={e => setFormState(prev => ({ ...prev, paragraphPosition: Number(e.target.value) }))}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg outline-none font-sans dark:text-white"
                  >
                    <option value={2}>After 2nd Paragraph</option>
                    <option value={4}>After 4th Paragraph</option>
                    <option value={6}>After 6th Paragraph</option>
                    <option value={8}>After 8th Paragraph</option>
                  </select>
                </div>
              </div>

              {/* Category & Placement Scope */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-mono font-bold uppercase text-[10px] text-slate-400">
                    Target Category Filter
                  </label>
                  <select
                    value={formState.category}
                    onChange={e => setFormState(prev => ({ ...prev, category: e.target.value }))}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg outline-none dark:text-white"
                  >
                    <option value="All">All Categories</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-mono font-bold uppercase text-[10px] text-slate-400">
                    Article Placement Scope
                  </label>
                  <select
                    value={formState.targetPlacementScope}
                    onChange={e => setFormState(prev => ({ ...prev, targetPlacementScope: e.target.value }))}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg outline-none dark:text-white"
                  >
                    <option value="Every Article">Show Advertisement in Every Article</option>
                    <option value="Selected Categories">Show Advertisement in Selected Categories</option>
                    <option value="Only Homepage">Show Advertisement Only on Homepage</option>
                  </select>
                </div>
              </div>

              {/* Date Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="flex flex-col gap-1">
                  <label className="font-mono font-bold uppercase text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-red-500" />
                    <span>Start Date (Auto Start)</span>
                  </label>
                  <input
                    type="date"
                    value={formState.startDate}
                    onChange={e => setFormState(prev => ({ ...prev, startDate: e.target.value }))}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg font-mono outline-none dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-mono font-bold uppercase text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-500" />
                    <span>End Date (Auto Expire)</span>
                  </label>
                  <input
                    type="date"
                    value={formState.endDate}
                    onChange={e => setFormState(prev => ({ ...prev, endDate: e.target.value }))}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg font-mono outline-none dark:text-white"
                  />
                </div>
              </div>

              {/* Controls Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.active}
                    onChange={e => setFormState(prev => ({ ...prev, active: e.target.checked }))}
                    className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="font-bold text-xs">Enable Advertisement Immediately</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.isPinned}
                    onChange={e => setFormState(prev => ({ ...prev, isPinned: e.target.checked }))}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-bold text-xs text-amber-500">Pin Advertisement to Top</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="bg-red-600 hover:bg-red-700 text-white font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-lg transition-all font-mono"
                >
                  {isUploading ? 'Uploading File...' : editingAd ? 'Update Advertisement' : 'Publish Advertisement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Live Advertisement Preview Modal */}
      {previewAd && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-white">
                <Eye className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-black uppercase font-mono">Live Advertisement Preview</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAd(null)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-2">
                SPONSORED ADVERTISEMENT • {previewAd.position || previewAd.type}
              </span>

              {previewAd.mediaType === 'video' || previewAd.videoUrl ? (
                <video
                  src={previewAd.videoUrl || previewAd.mediaUrl}
                  controls
                  autoPlay
                  muted
                  className="w-full h-auto max-h-[300px] rounded-lg object-cover"
                />
              ) : previewAd.imageUrl || previewAd.mediaUrl ? (
                <img
                  src={previewAd.imageUrl || previewAd.mediaUrl}
                  alt={previewAd.title}
                  className="w-full h-auto max-h-[300px] rounded-lg object-cover"
                />
              ) : (
                <div className="p-6 text-center text-slate-300 font-mono text-xs">
                  {previewAd.title || previewAd.label}
                </div>
              )}

              <div className="mt-4 w-full flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-300">
                <span className="font-bold line-clamp-1">{previewAd.title}</span>
                <a
                  href={previewAd.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded text-[10px] font-mono flex items-center gap-1 shrink-0"
                >
                  <span>TEST REDIRECT</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
