import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  Monitor, 
  Search, 
  LogIn, 
  LogOut, 
  ShieldCheck,
  Facebook,
  FileText,
  Heart,
  Share2,
  ChevronRight,
  Menu,
  X as CloseIcon,
  Clock,
  Calendar,
  ExternalLink,
  PlayCircle,
  LayoutGrid,
  Link as LinkIcon,
  Bell,
  Info,
  Youtube
} from 'lucide-react';
import { auth, loginWithGoogle, logout, db } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { WallpaperCard } from './components/WallpaperCard';
import { WallpaperModal } from './components/WallpaperModal';
import { AdminPanel } from './components/AdminPanel';
import { Toast } from './components/Toast';
import { Wallpaper, Article, SiteConfig, LinkItem, AppItem, VideoItem, FloatingContent, VideoPlaylist } from './types';
import DOMPurify from 'dompurify';

const Navbar = () => {
  const [user] = useAuthState(auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isAdmin = user?.email === 'ashfbelal@gmail.com';

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-[#022c22]/80 backdrop-blur-xl border-b border-emerald-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <span className="text-[10px] sm:text-lg md:text-2xl font-black tracking-tighter uppercase text-emerald-50 whitespace-nowrap">An-Nafee Wallpaper</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-emerald-200/60">
          <Link to="/" className={`hover:text-emerald-400 transition-colors ${location.pathname === '/' ? 'text-emerald-400' : ''}`}>হোম</Link>
          <Link to="/articles" className={`hover:text-emerald-400 transition-colors ${location.pathname.startsWith('/articles') ? 'text-emerald-400' : ''}`}>আর্টিকেল</Link>
          <Link to="/links" className={`hover:text-emerald-400 transition-colors ${location.pathname.startsWith('/links') ? 'text-emerald-400' : ''}`}>লিংক</Link>
          <Link to="/apps" className={`hover:text-emerald-400 transition-colors ${location.pathname.startsWith('/apps') ? 'text-emerald-400' : ''}`}>অ্যাপস</Link>
          <Link to="/videos" className={`hover:text-emerald-400 transition-colors ${location.pathname === '/videos' ? 'text-emerald-400' : ''}`}>ভিডিও</Link>
          {isAdmin && <Link to="/admin" className={`hover:text-emerald-400 transition-colors ${location.pathname === '/admin' ? 'text-emerald-400' : ''}`}>এডমিন</Link>}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <img src={user.photoURL || ''} className="w-8 h-8 rounded-full border border-emerald-500/20" alt="" />
              <button onClick={logout} className="text-emerald-200/60 hover:text-emerald-400"><LogOut size={18} /></button>
            </div>
          ) : (
            <div className="w-8" /> // Spacer
          )}
          <button className="md:hidden text-emerald-200/60" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <CloseIcon size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-[#022c22] border-b border-emerald-900/50 p-4 space-y-4"
          >
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="block text-emerald-200/60 hover:text-emerald-400">হোম</Link>
            <Link to="/articles" onClick={() => setIsMenuOpen(false)} className="block text-emerald-200/60 hover:text-emerald-400">আর্টিকেল</Link>
            <Link to="/links" onClick={() => setIsMenuOpen(false)} className="block text-emerald-200/60 hover:text-emerald-400">লিংক</Link>
            <Link to="/apps" onClick={() => setIsMenuOpen(false)} className="block text-emerald-200/60 hover:text-emerald-400">অ্যাপস</Link>
            <Link to="/videos" onClick={() => setIsMenuOpen(false)} className="block text-emerald-200/60 hover:text-emerald-400">ভিডিও</Link>
            {isAdmin && <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="block text-emerald-200/60 hover:text-emerald-400">এডমিন প্যানেল</Link>}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const RealTimeInfo = () => {
  const [dates, setDates] = useState({ english: '' });
  const [prayer, setPrayer] = useState({ name: '', timeRemaining: '' });

  useEffect(() => {
    const updateDates = () => {
      const now = new Date();
      const english = now.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
      setDates({ english });
    };

    const fetchPrayers = async () => {
      try {
        const res = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Dhaka&country=Bangladesh&method=2');
        const data = await res.json();
        const timings = data.data.timings;
        
        const updatePrayer = () => {
          const now = new Date();
          const currentTime = now.getHours() * 60 + now.getMinutes();
          
          const prayerList = [
            { name: 'ফজর', time: timings.Fajr },
            { name: 'যোহর', time: timings.Dhuhr },
            { name: 'আসর', time: timings.Asr },
            { name: 'মাগরিব', time: timings.Maghrib },
            { name: 'ইশা', time: timings.Isha }
          ];

          let currentPrayer = prayerList[prayerList.length - 1];
          let nextPrayer = prayerList[0];

          for (let i = 0; i < prayerList.length; i++) {
            const [h, m] = prayerList[i].time.split(':').map(Number);
            const prayerMinutes = h * 60 + m;
            if (currentTime >= prayerMinutes) {
              currentPrayer = prayerList[i];
              nextPrayer = prayerList[(i + 1) % prayerList.length];
            }
          }

          const [nh, nm] = nextPrayer.time.split(':').map(Number);
          let nextMinutes = nh * 60 + nm;
          if (nextMinutes < currentTime) nextMinutes += 24 * 60;
          
          const diff = nextMinutes - currentTime;
          const hours = Math.floor(diff / 60);
          const mins = diff % 60;
          
          setPrayer({
            name: currentPrayer.name,
            timeRemaining: `${hours > 0 ? hours + ' ঘণ্টা ' : ''}${mins} মিনিট বাকি`
          });
        };

        updatePrayer();
        updateDates(); // Also update dates when prayer updates
        const interval = setInterval(() => {
          updatePrayer();
          updateDates();
        }, 60000);
        return () => clearInterval(interval);
      } catch (error) {
        console.error('Prayer fetch error:', error);
      }
    };

    updateDates();
    fetchPrayers();
  }, []);

  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-12 px-4 py-3 bg-emerald-950/30 border border-emerald-500/10 rounded-2xl backdrop-blur-sm">
      <div className="flex items-center gap-4 text-xs sm:text-sm text-emerald-200/80">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-emerald-500" />
          <span>{dates.english} (ইংরেজি)</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-xs sm:text-sm text-emerald-200/80">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-emerald-500" />
          <span className="font-bold text-emerald-400">{prayer.name}</span>
          <span>ওয়াক্ত চলছে</span>
        </div>
        <div className="w-px h-4 bg-emerald-500/20 hidden sm:block" />
        <div className="text-emerald-500/60 italic">{prayer.timeRemaining}</div>
      </div>
    </div>
  );
};

const FloatingInfo = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<FloatingContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = doc(db, 'floatingContent', 'main');
    const unsubscribe = onSnapshot(q, (docSnap) => {
      if (docSnap.exists()) {
        setContent(docSnap.data() as FloatingContent);
      } else {
        // Default content if none exists yet
        setContent({
          title: 'স্বাগতম',
          description: 'এডমিন প্যানেল থেকে এই লেখাটি পরিবর্তন করুন।',
          reference: ''
        });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return null;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-2">
        <motion.span 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg whitespace-nowrap"
        >
          আজকের নোটিস
        </motion.span>
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-emerald-500 hover:scale-110 transition-all group border-4 border-emerald-400/20"
        >
          <Bell size={24} className="group-hover:rotate-12 transition-transform" />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-emerald-950 border border-emerald-500/20 rounded-3xl p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-emerald-500/50 hover:text-emerald-400 transition-colors"
              >
                <CloseIcon size={24} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                  <Info size={24} />
                </div>
                <h2 className="text-2xl font-black text-emerald-50">{content.title}</h2>
              </div>

              <p className="text-emerald-100/80 leading-relaxed mb-8 whitespace-pre-wrap">
                {content.description}
              </p>

              {content.reference && (
                <div className="pt-6 border-t border-emerald-500/10">
                  <p className="text-xs text-emerald-500/60 italic">
                    রেফারেন্স: {content.reference}
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const Home = () => {
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [apps, setApps] = useState<AppItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [playlists, setPlaylists] = useState<VideoPlaylist[]>([]);
  
  const [filter, setFilter] = useState<Wallpaper['type'] | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedWallpaper, setSelectedWallpaper] = useState<Wallpaper | null>(null);
  const [selectedHomeVideo, setSelectedHomeVideo] = useState<VideoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    heroHeading: 'আপনার প্রতিটি দৃষ্টি যেন হয় রবের সন্তুষ্টির জন্য',
    heroSubHeading: '"নিশ্চয়ই আল্লাহ মুত্তাকীদের ভালোবাসেন।" আপনার স্মার্টফোনকে গুনাহের মাধ্যম নয়, বরং ঈমানি চেতনার অংশ করুন।'
  });

  useEffect(() => {
    const qW = query(collection(db, 'wallpapers'), orderBy('createdAt', 'desc'));
    const unsubscribeW = onSnapshot(qW, (snapshot) => {
      setWallpapers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Wallpaper[]);
      setLoading(false);
    });

    const qA = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
    const unsubscribeA = onSnapshot(qA, (snapshot) => {
      setArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Article[]);
    });

    const qL = query(collection(db, 'links'), orderBy('createdAt', 'desc'));
    const unsubscribeL = onSnapshot(qL, (snapshot) => {
      setLinks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LinkItem[]);
    });

    const qAp = query(collection(db, 'apps'), orderBy('createdAt', 'desc'));
    const unsubscribeAp = onSnapshot(qAp, (snapshot) => {
      setApps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AppItem[]);
    });

    const qV = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
    const unsubscribeV = onSnapshot(qV, (snapshot) => {
      setVideos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as VideoItem[]);
    });

    const qP = query(collection(db, 'videoPlaylists'), orderBy('createdAt', 'desc'));
    const unsubscribeP = onSnapshot(qP, (snapshot) => {
      setPlaylists(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as VideoPlaylist[]);
    });

    const fetchConfig = async () => {
      const docSnap = await getDoc(doc(db, 'siteConfig', 'hero'));
      if (docSnap.exists()) setSiteConfig(docSnap.data() as SiteConfig);
    };
    fetchConfig();

    return () => {
      unsubscribeW(); unsubscribeA(); unsubscribeL(); unsubscribeAp(); unsubscribeV(); unsubscribeP();
    };
  }, []);

  const filteredWallpapers = wallpapers.filter(w => {
    const matchesFilter = filter === 'all' || w.type === filter;
    const matchesSearch = w.category?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const displayWallpapers = filteredWallpapers.slice(0, 20);
  const displayArticles = articles.slice(0, 3);
  const displayLinks = links.slice(0, 4);
  const displayApps = apps.slice(0, 3);
  const displayVideos = videos.slice(0, 3);

  return (
    <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <RealTimeInfo />
      
      {/* Hero Section */}
      <section className="mb-20 text-center relative">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -z-10" />
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-4 bg-gradient-to-b from-emerald-50 to-emerald-500 bg-clip-text text-transparent px-4 leading-[1.2] pb-2">
          {siteConfig.heroHeading}
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-emerald-200/60 text-sm md:text-lg max-w-2xl mx-auto mb-8 px-6 leading-relaxed">
          {siteConfig.heroSubHeading}
        </motion.p>
      </section>

      {/* Wallpapers Section */}
      <section className="mb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-emerald-50 flex items-center gap-2">
            <LayoutGrid size={24} className="text-emerald-500" /> ওয়ালপেপার
          </h2>
          <Link to="/gallery" className="text-emerald-400 font-bold text-sm hover:text-emerald-300 transition-colors flex items-center gap-1">
            সব দেখুন <ChevronRight size={16} />
          </Link>
        </div>
        <div className="masonry-grid columns-1 sm:columns-2 md:columns-3 lg:columns-4">
          {displayWallpapers.map((wallpaper) => (
            <WallpaperCard key={wallpaper.id} wallpaper={wallpaper} onPreview={setSelectedWallpaper} />
          ))}
        </div>
        {filteredWallpapers.length > 20 && (
          <div className="mt-12 text-center">
            <Link to="/gallery" className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 rounded-full font-bold hover:bg-emerald-600/30 transition-all">
              আরও ওয়ালপেপার দেখুন <ChevronRight size={18} />
            </Link>
          </div>
        )}
      </section>

      {/* Articles Section */}
      <section className="mb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-emerald-50 flex items-center gap-2">
            <FileText size={24} className="text-emerald-500" /> আর্টিকেল
          </h2>
          <Link to="/articles" className="text-emerald-400 font-bold text-sm hover:text-emerald-300 transition-colors flex items-center gap-1">
            সব দেখুন <ChevronRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayArticles.map(art => (
            <div 
              key={art.id}
              onClick={() => navigate(`/articles/${art.id}`)}
              className="p-6 bg-emerald-950/40 border border-emerald-500/10 rounded-2xl hover:border-emerald-500/30 transition-all cursor-pointer group"
            >
              <h3 className="font-bold text-emerald-100 mb-2 group-hover:text-emerald-400 transition-colors">{art.title}</h3>
              <div 
                className="text-xs text-emerald-200/40 line-clamp-3"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(art.content) }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Apps Section */}
      <section className="mb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-emerald-50 flex items-center gap-2">
            <Smartphone size={24} className="text-emerald-500" /> অ্যাপস
          </h2>
          <Link to="/apps" className="text-emerald-400 font-bold text-sm hover:text-emerald-300 transition-colors flex items-center gap-1">
            সব দেখুন <ChevronRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayApps.map(app => (
            <div 
              key={app.id}
              onClick={() => navigate(`/apps/${app.id}`)}
              className="bg-emerald-950/40 border border-emerald-500/10 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all cursor-pointer group"
            >
              <div className="aspect-video relative overflow-hidden bg-emerald-900/20">
                <img src={app.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={app.title} referrerPolicy="no-referrer" />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-emerald-100 group-hover:text-emerald-400 transition-colors">{app.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Videos Section */}
      <section className="mb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-emerald-50 flex items-center gap-2">
            <Youtube size={24} className="text-emerald-500" /> ভিডিও
          </h2>
          <Link to="/videos" className="text-emerald-400 font-bold text-sm hover:text-emerald-300 transition-colors flex items-center gap-1">
            সব দেখুন <ChevronRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayVideos.map(video => {
            const getYoutubeId = (url: string) => {
              const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
              const match = url.match(regExp);
              return (match && match[2].length === 11) ? match[2] : null;
            };
            const videoId = getYoutubeId(video.videoUrl);
            const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
            return (
              <div 
                key={video.id}
                onClick={() => {
                  if (video.embedDisabled) {
                    window.open(video.videoUrl, '_blank', 'noopener,noreferrer');
                  } else {
                    setSelectedHomeVideo(video);
                  }
                }}
                className="bg-emerald-950/40 border border-emerald-500/10 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all cursor-pointer group"
              >
                <div className="aspect-video relative overflow-hidden bg-black">
                  <img src={thumbnailUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all" alt={video.title} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {video.embedDisabled ? (
                      <div className="flex flex-col items-center gap-2">
                        <PlayCircle size={40} className="text-emerald-500" />
                        <span className="text-[10px] bg-red-800/80 text-red-200 px-2 py-0.5 rounded-full backdrop-blur-sm font-semibold">ইউটিউবে দেখুন</span>
                      </div>
                    ) : (
                      <PlayCircle size={40} className="text-emerald-500" />
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-emerald-100 group-hover:text-emerald-400 transition-colors truncate">{video.title}</h3>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Home Video Lightbox */}
      <AnimatePresence>
        {selectedHomeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick={() => setSelectedHomeVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedHomeVideo(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition-all"
              >
                <CloseIcon size={24} />
              </button>
              <div className="absolute top-4 left-4 z-10">
                <a
                  href={selectedHomeVideo.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-red-600/90 hover:bg-red-500 text-white rounded-full text-xs font-bold transition-all backdrop-blur-md shadow-lg"
                >
                  <Youtube size={16} /> ইউটিউবে দেখুন
                </a>
              </div>
              <iframe
                src={`https://www.youtube.com/embed/${(() => {
                  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                  const match = selectedHomeVideo.videoUrl.match(regExp);
                  return (match && match[2].length === 11) ? match[2] : '';
                })()}?autoplay=1`}
                className="w-full h-full border-none"
                allow="autoplay; fullscreen"
                allowFullScreen
                title={selectedHomeVideo.title}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <WallpaperModal 
        wallpaper={selectedWallpaper} 
        onClose={() => setSelectedWallpaper(null)} 
        onNext={() => {
          const idx = filteredWallpapers.findIndex(w => w.id === selectedWallpaper?.id);
          setSelectedWallpaper(filteredWallpapers[(idx + 1) % filteredWallpapers.length]);
        }}
        onPrev={() => {
          const idx = filteredWallpapers.findIndex(w => w.id === selectedWallpaper?.id);
          setSelectedWallpaper(filteredWallpapers[(idx - 1 + filteredWallpapers.length) % filteredWallpapers.length]);
        }}
      />
    </main>
  );
};

const GalleryPage = () => {
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [filter, setFilter] = useState<Wallpaper['type'] | 'all'>('all');
  const [selectedWallpaper, setSelectedWallpaper] = useState<Wallpaper | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'wallpapers'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setWallpapers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Wallpaper[]);
      setLoading(false);
    });
  }, []);

  const filteredWallpapers = wallpapers.filter(w => filter === 'all' || w.type === filter);

  return (
    <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
        <h1 className="text-4xl font-black text-emerald-50">ওয়ালপেপার গ্যালারি</h1>
        <div className="flex flex-wrap justify-center gap-1 bg-emerald-950/40 p-1 rounded-xl border border-emerald-500/10">
          {([
            { id: 'all', label: 'সব' },
            { id: 'mobile', label: 'মোবাইল' },
            { id: 'desktop', label: 'ডেস্কটপ' },
            { id: 'fb_profile', label: 'প্রোফাইল' },
            { id: 'fb_cover', label: 'কভার' }
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id as any)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${filter === t.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-emerald-500/50 hover:text-emerald-400'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="masonry-grid columns-1 sm:columns-2 md:columns-3 lg:columns-4">
        {filteredWallpapers.map((wallpaper) => (
          <WallpaperCard key={wallpaper.id} wallpaper={wallpaper} onPreview={setSelectedWallpaper} />
        ))}
      </div>

      <WallpaperModal 
        wallpaper={selectedWallpaper} 
        onClose={() => setSelectedWallpaper(null)} 
        onNext={() => {
          const idx = filteredWallpapers.findIndex(w => w.id === selectedWallpaper?.id);
          setSelectedWallpaper(filteredWallpapers[(idx + 1) % filteredWallpapers.length]);
        }}
        onPrev={() => {
          const idx = filteredWallpapers.findIndex(w => w.id === selectedWallpaper?.id);
          setSelectedWallpaper(filteredWallpapers[(idx - 1 + filteredWallpapers.length) % filteredWallpapers.length]);
        }}
      />
    </main>
  );
};

const Articles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Article[]);
      setLoading(false);
    });
  }, []);

  const handleLike = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await updateDoc(doc(db, 'articles', id), { likes: increment(1) });
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleShare = (e: React.MouseEvent, article: Article) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: article.title,
        url: `${window.location.origin}/articles/${article.id}`
      });
    }
  };

  return (
    <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <h1 className="text-4xl font-black mb-12 text-emerald-50">আর্টিকেলস</h1>
      <div className="space-y-8">
        {articles.map(art => (
          <motion.div 
            key={art.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-950/40 border border-emerald-500/10 rounded-3xl p-8 hover:border-emerald-500/30 transition-all cursor-pointer group"
            onClick={() => navigate(`/articles/${art.id}`)}
          >
            <h2 className="text-2xl font-bold mb-4 text-emerald-100 group-hover:text-emerald-400 transition-colors">{art.title}</h2>
            <div 
              className="text-emerald-200/60 line-clamp-3 mb-6 prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(art.content) }}
            />
            <div className="flex items-center justify-between">
              <button className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                আরও পড়ুন <ChevronRight size={16} />
              </button>
              <div className="flex gap-4">
                <button onClick={(e) => handleLike(e, art.id)} className="flex items-center gap-1.5 text-emerald-500/60 hover:text-pink-500 transition-colors">
                  <Heart size={18} /> <span>{art.likes}</span>
                </button>
                <button onClick={(e) => handleShare(e, art)} className="text-emerald-500/60 hover:text-emerald-400 transition-colors">
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </main>
  );
};

const ArticleDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      const docSnap = await getDoc(doc(db, 'articles', id));
      if (docSnap.exists()) setArticle({ id: docSnap.id, ...docSnap.data() } as Article);
      setLoading(false);
    };
    fetchArticle();
  }, [id]);

  const handleLike = async () => {
    if (!article) return;
    try {
      await updateDoc(doc(db, 'articles', article.id), { likes: increment(1) });
      setArticle(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleShare = () => {
    if (!article) return;
    if (navigator.share) {
      navigator.share({
        title: article.title,
        url: window.location.href
      });
    }
  };

  if (loading) return <div className="pt-40 text-center">লোডিং...</div>;
  if (!article) return <div className="pt-40 text-center">আর্টিকেল পাওয়া যায়নি।</div>;

  return (
    <main className="pt-32 pb-20 px-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-black text-emerald-50">{article.title}</h1>
        <div className="flex gap-4">
          <button onClick={handleLike} className="flex items-center gap-2 px-4 py-2 bg-emerald-950/40 border border-emerald-500/20 rounded-xl text-emerald-500 hover:text-pink-500 transition-all">
            <Heart size={20} /> <span>{article.likes}</span>
          </button>
          <button onClick={handleShare} className="p-2 bg-emerald-950/40 border border-emerald-500/20 rounded-xl text-emerald-500 hover:text-emerald-400 transition-all">
            <Share2 size={20} />
          </button>
        </div>
      </div>
      <div 
        className="prose prose-invert prose-emerald max-w-none text-emerald-100/80 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
      />
    </main>
  );
};

const LinksPage = () => {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'links'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setLinks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LinkItem[]);
      setLoading(false);
    });
  }, []);

  return (
    <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <h1 className="text-4xl font-black mb-12 text-emerald-50">প্রয়োজনীয় লিংক</h1>
      <div className="grid gap-6">
        {links.map(link => (
          <motion.div 
            key={link.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-950/40 border border-emerald-500/10 rounded-3xl p-6 hover:border-emerald-500/30 transition-all cursor-pointer group"
            onClick={() => navigate(`/links/${link.id}`)}
          >
            <div className="flex justify-between items-start gap-4">
              <div>
                <h2 className="text-xl font-bold text-emerald-100 group-hover:text-emerald-400 transition-colors mb-2">{link.title}</h2>
                <p className="text-emerald-200/60 line-clamp-2 text-sm">{link.description}</p>
              </div>
              <div className="flex flex-col gap-2">
                <div 
                  className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 hover:bg-emerald-500/20 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(link.url, '_blank');
                  }}
                  title="সরাসরি লিংকে যান"
                >
                  <LinkIcon size={20} />
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                বিস্তারিত দেখুন <ChevronRight size={14} />
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </main>
  );
};

const LinkDetail = () => {
  const { id } = useParams();
  const [link, setLink] = useState<LinkItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLink = async () => {
      if (!id) return;
      const docSnap = await getDoc(doc(db, 'links', id));
      if (docSnap.exists()) setLink({ id: docSnap.id, ...docSnap.data() } as LinkItem);
      setLoading(false);
    };
    fetchLink();
  }, [id]);

  if (loading) return <div className="pt-40 text-center">লোডিং...</div>;
  if (!link) return <div className="pt-40 text-center">লিংক পাওয়া যায়নি।</div>;

  return (
    <main className="pt-32 pb-20 px-6 max-w-3xl mx-auto">
      <div className="bg-emerald-950/40 border border-emerald-500/10 rounded-3xl p-8">
        <h1 className="text-3xl font-black text-emerald-50 mb-6">{link.title}</h1>
        <p className="text-emerald-100/80 leading-relaxed mb-8 whitespace-pre-wrap">{link.description}</p>
        <a 
          href={link.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-all"
        >
          ওয়েবসাইট ভিজিট করুন <ExternalLink size={20} />
        </a>
      </div>
    </main>
  );
};

const AppsPage = () => {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'apps'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setApps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AppItem[]);
      setLoading(false);
    });
  }, []);

  return (
    <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
      <h1 className="text-4xl font-black mb-12 text-emerald-50">প্রয়োজনীয় অ্যাপস</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map(app => (
          <motion.div 
            key={app.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-950/40 border border-emerald-500/10 rounded-3xl overflow-hidden hover:border-emerald-500/30 transition-all cursor-pointer group flex flex-col"
            onClick={() => navigate(`/apps/${app.id}`)}
          >
            <div className="aspect-video relative overflow-hidden bg-emerald-900/20">
              <img 
                src={app.imageUrl} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                alt={app.title}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h2 className="text-xl font-bold text-emerald-100 group-hover:text-emerald-400 transition-colors mb-2">{app.title}</h2>
              <p className="text-emerald-200/60 line-clamp-2 text-sm mb-4">{app.description}</p>
              <div className="mt-auto flex justify-end">
                <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                  বিস্তারিত দেখুন <ChevronRight size={14} />
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </main>
  );
};

const AppDetail = () => {
  const { id } = useParams();
  const [app, setApp] = useState<AppItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApp = async () => {
      if (!id) return;
      const docSnap = await getDoc(doc(db, 'apps', id));
      if (docSnap.exists()) setApp({ id: docSnap.id, ...docSnap.data() } as AppItem);
      setLoading(false);
    };
    fetchApp();
  }, [id]);

  if (loading) return <div className="pt-40 text-center">লোডিং...</div>;
  if (!app) return <div className="pt-40 text-center">অ্যাপ পাওয়া যায়নি।</div>;

  return (
    <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <div className="bg-emerald-950/40 border border-emerald-500/10 rounded-3xl overflow-hidden">
        <div className="aspect-video w-full bg-emerald-900/20">
          <img src={app.imageUrl} className="w-full h-full object-cover" alt={app.title} referrerPolicy="no-referrer" />
        </div>
        <div className="p-8">
          <h1 className="text-3xl font-black text-emerald-50 mb-6">{app.title}</h1>
          <p className="text-emerald-100/80 leading-relaxed mb-8 whitespace-pre-wrap">{app.description}</p>
          <a 
            href={app.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-all"
          >
            ডাউনলোড / ভিজিট করুন <ExternalLink size={20} />
          </a>
        </div>
      </div>
    </main>
  );
};

const VideosPage = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [playlists, setPlaylists] = useState<VideoPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  useEffect(() => {
    const qV = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
    const unsubscribeV = onSnapshot(qV, (snapshot) => {
      setVideos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as VideoItem[]);
    });

    const qP = query(collection(db, 'videoPlaylists'), orderBy('createdAt', 'desc'));
    const unsubscribeP = onSnapshot(qP, (snapshot) => {
      setPlaylists(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as VideoPlaylist[]);
      setLoading(false);
    });

    return () => {
      unsubscribeV();
      unsubscribeP();
    };
  }, []);

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <h1 className="text-4xl font-black mb-12 text-emerald-50">ভিডিও গ্যালারি</h1>
      
      {/* Playlists Section */}
      <section className="mb-20">
        <h2 className="text-2xl font-bold mb-8 text-emerald-50 flex items-center gap-3">
          <Youtube className="text-emerald-500" size={24} /> ভিডিও প্লে-লিস্ট
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map(pl => (
            <motion.a 
              key={pl.id}
              href={pl.playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-950/40 border border-emerald-500/10 rounded-3xl p-6 hover:border-emerald-500/30 transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform">
                  <LayoutGrid size={24} />
                </div>
                <h3 className="font-bold text-emerald-100 group-hover:text-emerald-400 transition-colors">{pl.title}</h3>
              </div>
              <ExternalLink size={20} className="text-emerald-500/40 group-hover:text-emerald-400" />
            </motion.a>
          ))}
        </div>
      </section>

      {/* Individual Videos Section */}
      <section>
        <h2 className="text-2xl font-bold mb-8 text-emerald-50 flex items-center gap-3">
          <PlayCircle className="text-emerald-500" size={24} /> ইনডিভিজুয়াল ভিডিও
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {videos.map(video => {
            const videoId = getYoutubeId(video.videoUrl);
            const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
            
            return (
              <motion.div 
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-950/40 border border-emerald-500/10 rounded-3xl overflow-hidden hover:border-emerald-500/30 transition-all group cursor-pointer"
                onClick={() => {
                  if (video.embedDisabled) {
                    window.open(video.videoUrl, '_blank', 'noopener,noreferrer');
                  } else {
                    setSelectedVideo(video);
                  }
                }}
              >
                <div className="aspect-video relative overflow-hidden bg-black">
                  {thumbnailUrl ? (
                    <>
                      <img 
                        src={thumbnailUrl} 
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" 
                        alt={video.title} 
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded-full flex items-center justify-center text-white shadow-2xl group-hover:scale-110 group-hover:bg-emerald-500/40 transition-all duration-300">
                          <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent ml-1" />
                        </div>
                      </div>
                      {video.embedDisabled && (
                        <div className="absolute bottom-2 right-2">
                          <span className="text-[10px] bg-red-800/80 text-red-200 px-2 py-0.5 rounded-full backdrop-blur-sm font-semibold">ইউটিউবে দেখুন</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-emerald-500/40">
                      <PlayCircle size={48} />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h2 className="text-lg font-bold text-emerald-100 line-clamp-2 group-hover:text-emerald-400 transition-colors">{video.title}</h2>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Video Lightbox */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition-all"
              >
                <CloseIcon size={24} />
              </button>
              
              <div className="absolute top-4 left-4 z-10">
                <a 
                  href={selectedVideo.videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-red-600/90 hover:bg-red-500 text-white rounded-full text-xs font-bold transition-all backdrop-blur-md shadow-lg"
                >
                  <Youtube size={16} /> ইউটিউবে দেখুন (Watch on YouTube)
                </a>
              </div>

              <iframe 
                src={`https://www.youtube.com/embed/${getYoutubeId(selectedVideo.videoUrl)}?autoplay=1`}
                className="w-full h-full border-none"
                allow="autoplay; fullscreen"
                allowFullScreen
                title={selectedVideo.title}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};


const Admin = () => {
  const [user] = useAuthState(auth);
  const [loginError, setLoginError] = useState<string | null>(null);
  const isAdmin = user?.email === 'ashfbelal@gmail.com';

  const handleLogin = async () => {
    setLoginError(null);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      console.error('Login error:', error);
      setLoginError(error.message || 'লগইন করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    }
  };

  if (!user) {
    return (
      <div className="pt-40 flex flex-col items-center justify-center gap-6 px-6">
        <h2 className="text-2xl font-bold text-emerald-50 text-center">এডমিন লগইন প্রয়োজন</h2>
        <button 
          onClick={handleLogin}
          className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-500 transition-all"
        >
          <LogIn size={20} /> গুগল দিয়ে লগইন করুন
        </button>
        {loginError && (
          <div className="mt-4 p-4 bg-red-950/50 border border-red-500/20 rounded-xl text-red-200 text-sm max-w-md text-center">
            {loginError}
            <p className="mt-2 text-xs text-red-300/60">
              নোট: যদি 'unauthorized domain' সংক্রান্ত এরর আসে, তবে ফায়ারবেস কনসোলে গিয়ে Authentication &gt; Settings &gt; Authorized Domains এ আপনার ভিজিট করা ডোমেইনটি যুক্ত করুন।
            </p>
          </div>
        )}
      </div>
    );
  }

  if (!isAdmin) return <div className="pt-40 text-center text-red-400">আপনার এডমিন এক্সেস নেই।</div>;

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <AdminPanel />
    </div>
  );
};

const Footer = () => {
  const [requestUrl, setRequestUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      const docSnap = await getDoc(doc(db, 'siteConfig', 'hero'));
      if (docSnap.exists()) {
        const data = docSnap.data() as SiteConfig;
        if (data.wallpaperRequestUrl) {
          setRequestUrl(data.wallpaperRequestUrl);
        }
      }
    };
    fetchConfig();
  }, []);

  return (
    <footer className="border-t border-emerald-900/50 pt-8 pb-12 px-6 bg-emerald-950/20 mt-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col gap-4 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start">
            <span className="font-bold tracking-tighter uppercase text-sm text-emerald-50">An-Nafee Wallpaper</span>
          </div>
          <p className="text-emerald-500/40 text-xs">
            © ২০২৪ An-Nafee Wallpaper. প্রতিটি ডিভাইসের জন্য মার্জিত ওয়ালপেপার।
          </p>
        </div>
        
        <div className="flex flex-col items-center md:items-end gap-4">
          {requestUrl && (
            <a 
              href={requestUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 rounded-full font-bold hover:bg-emerald-600/30 transition-all text-sm mb-2"
            >
              ওয়ালপেপারের জন্য আবেদন করুন <ExternalLink size={16} />
            </a>
          )}
          
          <div className="flex flex-col items-center md:items-end gap-2">
            <p className="text-emerald-200/40 text-xs">Developed by</p>
            <a 
              href="https://facebook.com/belalvisuals" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors flex items-center gap-2 text-sm"
            >
              Belal Hosen <Facebook size={14} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#022c22] text-zinc-100 font-sans selection:bg-emerald-500/30 islamic-pattern flex flex-col">
        <Navbar />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/:id" element={<ArticleDetail />} />
            <Route path="/links" element={<LinksPage />} />
            <Route path="/links/:id" element={<LinkDetail />} />
            <Route path="/apps" element={<AppsPage />} />
            <Route path="/apps/:id" element={<AppDetail />} />
            <Route path="/videos" element={<VideosPage />} />
          </Routes>
        </div>
        
        <FloatingInfo />
        <Footer />
      </div>
    </Router>
  );
}
