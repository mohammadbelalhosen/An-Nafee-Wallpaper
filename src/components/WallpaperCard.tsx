import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize2, Smartphone, Monitor, Facebook, Loader2 } from 'lucide-react';
import { Wallpaper } from '../types';

interface WallpaperCardProps {
  wallpaper: Wallpaper;
  onPreview: (wallpaper: Wallpaper) => void;
}

const LazyImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className="relative w-full h-full min-h-[200px] bg-emerald-900/10 overflow-hidden">
      <AnimatePresence>
        {!isLoaded && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/20 backdrop-blur-[2px]"
          >
            {/* Islamic Geometric Placeholder Pattern */}
            <div className="relative w-12 h-12">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-emerald-500/20 rounded-lg rotate-45"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-emerald-500/10 rounded-lg"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 size={20} className="text-emerald-500/40 animate-spin" />
              </div>
            </div>
            <span className="mt-4 text-[10px] text-emerald-500/40 font-bold tracking-widest uppercase">লোড হচ্ছে</span>
          </motion.div>
        )}
      </AnimatePresence>

      {isInView && (
        <motion.img
          src={src}
          alt={alt}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 1.1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          onLoad={() => setIsLoaded(true)}
          className="w-full h-auto block transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
};

export const WallpaperCard: React.FC<WallpaperCardProps> = ({ wallpaper, onPreview }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }}
      className="group relative overflow-hidden rounded-2xl bg-emerald-950/40 border border-emerald-500/10 shadow-xl cursor-pointer mb-4"
      onClick={() => onPreview(wallpaper)}
    >
      <div className="relative overflow-hidden">
        <LazyImage src={wallpaper.imageUrl} alt="Wallpaper" />
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#022c22]/90 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 transition-transform duration-300 group-hover:translate-y-0">
          <div className="flex items-center justify-between text-white">
            <div>
              <p className="text-[9px] sm:text-[10px] text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                {wallpaper.type === 'mobile' && <Smartphone size={10} />}
                {wallpaper.type === 'desktop' && <Monitor size={10} />}
                {(wallpaper.type === 'fb_profile' || wallpaper.type === 'fb_cover') && <Facebook size={10} />}
                {wallpaper.type === 'mobile' ? 'মোবাইল' : 
                 wallpaper.type === 'desktop' ? 'ডেস্কটপ' : 
                 wallpaper.type === 'fb_profile' ? 'ফেসবুক প্রোফাইল' : 'ফেসবুক কভার'}
              </p>
              {wallpaper.category && <p className="text-[8px] text-emerald-200/50">{wallpaper.category}</p>}
            </div>
            <div className="flex gap-2">
              <button 
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/40 backdrop-blur-md transition-all border border-emerald-500/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(wallpaper);
                }}
              >
                <Maximize2 size={14} className="text-emerald-100" />
                <span className="text-[10px] font-bold text-emerald-50">প্রিভিউ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

