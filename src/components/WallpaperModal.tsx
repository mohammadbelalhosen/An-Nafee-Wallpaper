import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Smartphone, Monitor, Share2, ChevronLeft, ChevronRight } from 'lucide-react';

interface Wallpaper {
  id: string;
  title: string;
  imageUrl: string;
  type: 'mobile' | 'desktop';
}

interface WallpaperModalProps {
  wallpaper: Wallpaper | null;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export const WallpaperModal: React.FC<WallpaperModalProps> = ({ wallpaper, onClose, onNext, onPrev }) => {
  if (!wallpaper) return null;

  const handleDownload = async () => {
    try {
      // If it's a Google Drive link, we can try to use the direct download URL
      if (wallpaper.imageUrl.includes('googleusercontent.com/d/')) {
        const fileId = wallpaper.imageUrl.split('/d/')[1];
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        window.open(downloadUrl, '_blank');
        return;
      }

      const response = await fetch(wallpaper.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${wallpaper.title.replace(/\s+/g, '-').toLowerCase()}-${wallpaper.type}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(wallpaper.imageUrl, '_blank');
    }
  };

  const handleSetWallpaper = () => {
    window.open(wallpaper.imageUrl, '_blank');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#022c22]/95 p-4 md:p-8 backdrop-blur-xl"
        onClick={onClose}
      >
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-6 right-6 z-50 p-3 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-100 backdrop-blur-md border border-emerald-500/20"
          onClick={onClose}
        >
          <X size={24} />
        </motion.button>

        {/* Navigation Buttons */}
        {onPrev && (
          <button 
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-2 md:left-10 top-1/2 -translate-y-1/2 z-50 p-2 md:p-4 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10 flex"
          >
            <ChevronLeft size={24} className="md:w-8 md:h-8" />
          </button>
        )}
        {onNext && (
          <button 
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-2 md:right-10 top-1/2 -translate-y-1/2 z-50 p-2 md:p-4 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10 flex"
          >
            <ChevronRight size={24} className="md:w-8 md:h-8" />
          </button>
        )}

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative max-w-6xl w-full max-h-[90vh] flex flex-col md:flex-row gap-8 items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative max-h-[70vh] md:max-h-[85vh] w-auto overflow-hidden rounded-2xl shadow-2xl border border-emerald-500/20 flex items-center justify-center">
            <img
              src={wallpaper.imageUrl}
              alt={wallpaper.title}
              className="max-h-full w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex flex-col gap-4 sm:gap-6 text-white w-full md:w-80">
            <div>
              <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-emerald-50">{wallpaper.title}</h2>
              <p className="text-emerald-400 mt-1 sm:mt-2 flex items-center gap-2 uppercase text-[10px] sm:text-xs tracking-widest font-semibold">
                {wallpaper.type === 'mobile' ? <Smartphone size={12} /> : <Monitor size={12} />}
                {wallpaper.type === 'mobile' ? 'মোবাইল' : 'ডেস্কটপ'} ওয়ালপেপার
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:gap-3">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 w-full py-3 sm:py-4 bg-emerald-600 text-white rounded-xl text-sm sm:text-base font-bold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/40"
              >
                <Download size={18} />
                ডাউনলোড করুন
              </button>
              
              <button
                onClick={handleSetWallpaper}
                className="flex items-center justify-center gap-2 w-full py-3 sm:py-4 bg-emerald-950/40 text-emerald-100 rounded-xl text-sm sm:text-base font-bold hover:bg-emerald-900/40 transition-colors border border-emerald-500/20"
              >
                <Share2 size={18} />
                ওয়ালপেপার সেট করুন
              </button>
            </div>

            <div className="p-3 sm:p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/10 text-[10px] sm:text-sm text-emerald-200/60 leading-relaxed">
              <p className="italic">
                টিপ: "ওয়ালপেপার সেট করুন" এ ক্লিক করলে ইমেজটি নতুন ট্যাবে ওপেন হবে। সেখান থেকে আপনি আপনার ডিভাইসে সেভ করে ওয়ালপেপার হিসেবে সেট করতে পারবেন।
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
