import React from 'react';
import { motion } from 'motion/react';
import { Maximize2, Smartphone, Monitor } from 'lucide-react';

interface Wallpaper {
  id: string;
  title: string;
  imageUrl: string;
  type: 'mobile' | 'desktop';
  category?: string;
}

interface WallpaperCardProps {
  wallpaper: Wallpaper;
  onPreview: (wallpaper: Wallpaper) => void;
}

export const WallpaperCard: React.FC<WallpaperCardProps> = ({ wallpaper, onPreview }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }}
      className="group relative overflow-hidden rounded-2xl bg-emerald-950/40 border border-emerald-500/10 shadow-xl cursor-pointer"
      onClick={() => onPreview(wallpaper)}
    >
      <div className="relative overflow-hidden">
        <img
          src={wallpaper.imageUrl}
          alt={wallpaper.title}
          className="w-full h-auto block transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#022c22]/90 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 transition-transform duration-300 group-hover:translate-y-0">
          <div className="flex items-center justify-between text-white">
            <div>
              <h3 className="text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-[150px]">{wallpaper.title}</h3>
              <p className="text-[9px] sm:text-[10px] text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                {wallpaper.type === 'mobile' ? <Smartphone size={8} /> : <Monitor size={8} />}
                {wallpaper.type === 'mobile' ? 'মোবাইল' : 'ডেস্কটপ'}
              </p>
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
