import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  Monitor, 
  Search, 
  LogIn, 
  LogOut, 
  ShieldCheck,
  Moon,
  Github
} from 'lucide-react';
import { auth, loginWithGoogle, logout, db } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { WallpaperCard } from './components/WallpaperCard';
import { WallpaperModal } from './components/WallpaperModal';
import { AdminPanel } from './components/AdminPanel';
import { Toast } from './components/Toast';

interface Wallpaper {
  id: string;
  title: string;
  imageUrl: string;
  type: 'mobile' | 'desktop';
  category?: string;
}

export default function App() {
  const [user] = useAuthState(auth);
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [filter, setFilter] = useState<'all' | 'mobile' | 'desktop'>('all');
  const [search, setSearch] = useState('');
  const [selectedWallpaper, setSelectedWallpaper] = useState<Wallpaper | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const isAdmin = user?.email === 'ashfbelal@gmail.com';

  useEffect(() => {
    const q = query(collection(db, 'wallpapers'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Wallpaper[];
      setWallpapers(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const result = await loginWithGoogle();
      if (result.user.email !== 'ashfbelal@gmail.com') {
        await logout();
        setToast({ message: 'দুঃখিত, শুধুমাত্র এডমিন লগইন করতে পারবেন।', type: 'error' });
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const filteredWallpapers = wallpapers.filter(w => {
    const matchesFilter = filter === 'all' || w.type === filter;
    const matchesSearch = w.title.toLowerCase().includes(search.toLowerCase()) || 
                         w.category?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#022c22] text-zinc-100 font-sans selection:bg-emerald-500/30 islamic-pattern">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-[#022c22]/80 backdrop-blur-xl border-b border-emerald-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setFilter('all')}>
            <img 
              src="/logo.png" 
              className="w-8 h-8 sm:w-12 sm:h-12 object-contain" 
              alt="An-Nafee Logo" 
            />
            <span className="text-[10px] sm:text-lg md:text-2xl font-black tracking-tighter uppercase text-emerald-50 whitespace-nowrap">An-Nafee Wallpaper</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-emerald-200/60">
            <button 
              onClick={() => setFilter('all')}
              className={`hover:text-emerald-400 transition-colors ${filter === 'all' ? 'text-emerald-400' : ''}`}
            >
              সবগুলো
            </button>
            <button 
              onClick={() => setFilter('mobile')}
              className={`hover:text-emerald-400 transition-colors ${filter === 'mobile' ? 'text-emerald-400' : ''}`}
            >
              মোবাইল
            </button>
            <button 
              onClick={() => setFilter('desktop')}
              className={`hover:text-emerald-400 transition-colors ${filter === 'desktop' ? 'text-emerald-400' : ''}`}
            >
              ডেস্কটপ
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-4">
                {isAdmin && (
                  <button 
                    onClick={() => setIsAdminOpen(!isAdminOpen)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all ${isAdminOpen ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/5 text-emerald-200/60'}`}
                  >
                    <ShieldCheck size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest hidden xs:inline">এডমিন</span>
                  </button>
                )}
                <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-emerald-900/50">
                  <img src={user.photoURL || ''} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-emerald-500/20" alt="" />
                  <button onClick={logout} className="text-emerald-200/60 hover:text-emerald-400">
                    <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-1.5 sm:py-2 bg-emerald-600 text-white rounded-full text-xs sm:text-sm font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/40 whitespace-nowrap"
              >
                <LogIn size={14} className="sm:w-4 sm:h-4" />
                এডমিন লগইন
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="mb-20 text-center relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -z-10"
          />
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-4 bg-gradient-to-b from-emerald-50 to-emerald-500 bg-clip-text text-transparent px-4 leading-[1.1]"
          >
            আপনার প্রতিটি দৃষ্টি যেন হয় রবের সন্তুষ্টির জন্য
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-emerald-200/60 text-sm sm:text-sm md:text-lg max-w-2xl mx-auto mb-8 px-6 leading-relaxed"
          >
            "নিশ্চয়ই আল্লাহ মুত্তাকীদের ভালোবাসেন।" আপনার স্মার্টফোনকে গুনাহের মাধ্যম নয়, বরং ঈমানি চেতনার অংশ করুন। ডাউনলোড করুন সেরা সব হালাল ও এইচডি ওয়ালপেপার।
          </motion.p>

          <div className="max-w-xl mx-auto relative group px-4">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-400 transition-colors" size={16} />
            <input 
              type="text"
              placeholder="টাইটেল বা ক্যাটাগরি দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-emerald-950/40 border border-emerald-500/20 rounded-2xl py-3 sm:py-3.5 pl-11 pr-4 text-sm sm:text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-emerald-500/30"
            />
          </div>

          {/* Admin Panel Toggle - Moved below Hero */}
          <div className="mt-8 flex justify-center">
            <AnimatePresence>
              {isAdmin && (
                <button 
                  onClick={() => setIsAdminOpen(!isAdminOpen)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border ${isAdminOpen ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-emerald-950/40 border-emerald-500/20 text-emerald-200/60 hover:border-emerald-500/40'}`}
                >
                  <ShieldCheck size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">এডমিন প্যানেল</span>
                </button>
              )}
            </AnimatePresence>
          </div>
        </section>

        <AnimatePresence>
          {isAdminOpen && isAdmin && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-12 px-4"
            >
              <AdminPanel />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters & Content */}
        <div className="flex flex-col gap-12">
          <div className="flex items-center justify-between px-2 sm:px-0">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3 text-emerald-50">
              {filter === 'all' && 'সাম্প্রতিক ওয়ালপেপার'}
              {filter === 'mobile' && <><Smartphone className="text-emerald-500" size={20} /> মোবাইল</>}
              {filter === 'desktop' && <><Monitor className="text-emerald-500" size={20} /> ডেস্কটপ</>}
            </h2>
            <div className="flex gap-1 bg-emerald-950/40 p-1 rounded-xl border border-emerald-500/10">
              {(['all', 'mobile', 'desktop'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg text-xs sm:text-xs font-bold uppercase tracking-widest transition-all ${filter === t ? 'bg-emerald-600 text-white shadow-lg' : 'text-emerald-500/50 hover:text-emerald-400'}`}
                >
                  {t === 'all' ? 'সব' : t === 'mobile' ? 'মোবাইল' : 'ডেস্কটপ'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="masonry-grid columns-1 sm:columns-2 md:columns-3 lg:columns-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="masonry-item bg-emerald-950/40 animate-pulse rounded-2xl border border-emerald-500/5 h-64" />
              ))}
            </div>
          ) : filteredWallpapers.length > 0 ? (
            <motion.div 
              layout
              className="masonry-grid columns-1 sm:columns-2 md:columns-3 lg:columns-4"
            >
              <AnimatePresence mode="popLayout">
                {filteredWallpapers.map((wallpaper) => (
                  <div key={wallpaper.id} className="masonry-item">
                    <WallpaperCard 
                      wallpaper={wallpaper} 
                      onPreview={setSelectedWallpaper}
                    />
                  </div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="text-center py-20 bg-emerald-950/20 rounded-3xl border border-emerald-500/5">
              <div className="w-20 h-20 bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={32} className="text-emerald-800" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-emerald-100">কোনো ওয়ালপেপার পাওয়া যায়নি</h3>
              <p className="text-emerald-500/60">অন্য কিছু লিখে সার্চ করুন অথবা ফিল্টার পরিবর্তন করুন।</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-900/50 py-12 px-6 bg-emerald-950/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              className="w-10 h-10 object-contain" 
              alt="An-Nafee Logo" 
            />
            <span className="font-bold tracking-tighter uppercase text-sm text-emerald-50">An-Nafee Wallpaper</span>
          </div>
          <p className="text-emerald-500/40 text-xs text-center md:text-left">
            © ২০২৪ An-Nafee Wallpaper. প্রতিটি ডিভাইসের জন্য মার্জিত ওয়ালপেপার।
          </p>
          <div className="flex gap-6 text-emerald-500/40">
            {/* Removed Github icon */}
          </div>
        </div>
      </footer>

      {/* Preview Modal */}
      <WallpaperModal 
        wallpaper={selectedWallpaper} 
        onClose={() => setSelectedWallpaper(null)} 
        onNext={() => {
          if (!selectedWallpaper) return;
          const currentIndex = filteredWallpapers.findIndex(w => w.id === selectedWallpaper.id);
          const nextIndex = (currentIndex + 1) % filteredWallpapers.length;
          setSelectedWallpaper(filteredWallpapers[nextIndex]);
        }}
        onPrev={() => {
          if (!selectedWallpaper) return;
          const currentIndex = filteredWallpapers.findIndex(w => w.id === selectedWallpaper.id);
          const prevIndex = (currentIndex - 1 + filteredWallpapers.length) % filteredWallpapers.length;
          setSelectedWallpaper(filteredWallpapers[prevIndex]);
        }}
      />

      <Toast 
        isVisible={!!toast}
        message={toast?.message || ''}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
