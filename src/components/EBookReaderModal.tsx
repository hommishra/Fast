import React, { useState } from "react";
import { EBook } from "../types";
import { X, BookOpen, Download, FileText, Lock, ExternalLink, RefreshCw } from "lucide-react";
import { useLanguage } from "../utils/LanguageContext";

interface EBookReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: EBook | null;
  onDownload: (book: EBook) => void;
}

export default function EBookReaderModal({
  isOpen,
  onClose,
  book,
  onDownload,
}: EBookReaderModalProps) {
  const { t } = useLanguage();
  const [loadError, setLoadError] = useState(false);

  if (!isOpen || !book) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fadeIn"
      id="ebook_reader_modal_overlay"
    >
      <div 
        className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden font-sans flex flex-col h-[90vh] max-h-[800px]"
        id="ebook_reader_modal_box"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center border-b border-slate-950 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <BookOpen size={18} className="text-red-500 shrink-0 animate-pulse" />
            <div className="overflow-hidden">
              <h3 className="text-xs md:text-sm font-black tracking-widest text-white uppercase font-sans truncate">
                {book.title}
              </h3>
              <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider truncate">
                {t("By:")} {book.author} &bull; {book.fileSize || "PDF"}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-full hover:bg-slate-800 shrink-0"
            title={t("Close Reader")}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Layout Body */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row min-h-0 bg-slate-50">
          
          {/* Left Column: Cover & Information Metadata */}
          <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-200 p-6 flex flex-col justify-between shrink-0 bg-white overflow-y-auto">
            <div className="space-y-4">
              <div className="w-32 h-44 mx-auto overflow-hidden rounded-xl bg-slate-100 shadow-md border border-slate-200 relative select-none">
                <img 
                  src={book.coverUrl || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400"} 
                  alt={book.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="space-y-2 text-center lg:text-left">
                <span className="inline-block text-[9px] font-mono uppercase font-bold text-red-650 tracking-wider bg-red-50 px-2 py-0.5 rounded border border-red-100">
                  {t("OFFICIAL DOSSIER")}
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                  {book.title}
                </h4>
                <p className="text-xs text-slate-500 font-mono font-medium">
                  {t("By:")} {book.author}
                </p>
              </div>

              <hr className="border-slate-100" />

              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">
                  {t("Document Overview")}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed max-h-[120px] lg:max-h-none overflow-y-auto pr-1">
                  {book.description || t("This digital file is part of the Fast Coverage analytical directory. It contains verified reporting, official indices, and comprehensive analytical coverage of ongoing world events.")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 block">{t("File Format")}</span>
                  <span className="font-bold text-slate-700">PDF Document</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{t("File Size")}</span>
                  <span className="font-bold text-slate-700">{book.fileSize || "1.2 MB"}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-200/50">
                  <span className="text-slate-400 block">{t("Publish Date")}</span>
                  <span className="font-bold text-slate-700 text-[9px]">
                    {new Date(book.publishDate).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions of Left Column */}
            <div className="pt-6 lg:pt-0 space-y-3">
              {book.allowDownload !== false ? (
                <div className="space-y-1">
                  <button
                    onClick={() => onDownload(book)}
                    className="w-full bg-red-700 hover:bg-red-800 text-white font-mono text-xs font-black py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md select-none"
                  >
                    <Download size={14} />
                    {t("DOWNLOAD DOCUMENT")}
                  </button>
                  <p className="text-[9px] text-slate-400 text-center font-mono">
                    {t("Downloads permitted by administration")}
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center space-y-1">
                  <div className="flex justify-center items-center gap-1.5 text-amber-700 font-bold font-mono text-[10px] uppercase">
                    <Lock size={12} className="text-amber-600 animate-pulse" />
                    {t("View Only Mode")}
                  </div>
                  <p className="text-[9px] text-amber-600/90 leading-normal font-sans">
                    {t("Direct PDF download option has been restricted by the administrator.")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Embedded PDF Reader */}
          <div className="flex-1 flex flex-col bg-slate-100 min-h-[300px] lg:min-h-0 relative select-none">
            {/* Embed PDF Viewer */}
            <div className="flex-1 w-full h-full relative" id="pdf_embedded_viewer_area">
              {!loadError ? (
                <iframe 
                  src={book.pdfUrl} 
                  className="w-full h-full border-0 absolute inset-0"
                  title={book.title}
                  onError={() => setLoadError(true)}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-50">
                  <FileText size={40} className="text-slate-300 mb-2" />
                  <h4 className="text-sm font-bold text-slate-700">{t("Document Preview Mode")}</h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 leading-relaxed">
                    {t("Due to custom browser configuration or local iframe permissions, direct document rendering might be blocked.")}
                  </p>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        window.open(book.pdfUrl, "_blank");
                      }}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-mono text-[10px] font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <ExternalLink size={12} />
                      {t("Open in New Tab")}
                    </button>
                    {book.allowDownload !== false && (
                      <button 
                        onClick={() => onDownload(book)}
                        className="bg-red-700 hover:bg-red-800 text-white font-mono text-[10px] font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Download size={12} />
                        {t("Download PDF")}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Helper Overlay Status Bar */}
            <div className="bg-slate-900/90 px-4 py-2.5 flex justify-between items-center text-[10px] font-mono text-slate-300 shrink-0">
              <span className="flex items-center gap-1.5 text-[9px] tracking-wider uppercase font-bold text-slate-400">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-ping" />
                {t("SECURE EMBEDDED READER")}
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    window.open(book.pdfUrl, "_blank");
                  }}
                  className="hover:text-white text-slate-300 font-bold transition flex items-center gap-1 cursor-pointer uppercase text-[9px] bg-slate-800 hover:bg-slate-705 px-2.5 py-1 rounded border border-slate-700"
                  title={t("Open original publication file source")}
                >
                  <ExternalLink size={10} />
                  {t("Full View")}
                </button>
                {book.allowDownload !== false && (
                  <button 
                    onClick={() => onDownload(book)}
                    className="bg-red-700 hover:bg-red-800 text-white font-extrabold transition flex items-center gap-1 cursor-pointer uppercase text-[9px] px-3 py-1 rounded shadow-md"
                    title={t("Download E-Book PDF publication")}
                  >
                    <Download size={10} />
                    {t("DOWNLOAD PDF")}
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
