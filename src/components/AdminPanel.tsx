import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { Plus, Image as ImageIcon, Loader2, Trash2, Edit2, Settings, List, X, Check, FileText, Layout, Link as LinkIcon, Smartphone as AppIcon, Youtube, Bell } from 'lucide-react';
import { Toast } from './Toast';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Wallpaper, Article, SiteConfig, LinkItem, AppItem, VideoItem, FloatingContent } from '../types';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manage' | 'site' | 'articles' | 'links' | 'apps' | 'videos' | 'floating'>('upload');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [type, setType] = useState<Wallpaper['type']>('mobile');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Site Config State
  const [heroHeading, setHeroHeading] = useState('');
  const [heroSubHeading, setHeroSubHeading] = useState('');

  // Articles State
  const [articleTitle, setArticleTitle] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);

  // Links State
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [links, setLinks] = useState<LinkItem[]>([]);

  // Apps State
  const [appTitle, setAppTitle] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [appUrl, setAppUrl] = useState('');
  const [appImageUrl, setAppImageUrl] = useState('');
  const [apps, setApps] = useState<AppItem[]>([]);

  // Videos State
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videos, setVideos] = useState<VideoItem[]>([]);

  // Floating Content State
  const [floatingTitle, setFloatingTitle] = useState('');
  const [floatingDescription, setFloatingDescription] = useState('');
  const [floatingReference, setFloatingReference] = useState('');

  useEffect(() => {
    if (activeTab === 'manage') {
      const q = query(collection(db, 'wallpapers'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Wallpaper[];
        setWallpapers(docs);
      });
      return () => unsubscribe();
    }
    
    if (activeTab === 'site') {
      const fetchConfig = async () => {
        const docRef = doc(db, 'siteConfig', 'hero');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as SiteConfig;
          setHeroHeading(data.heroHeading);
          setHeroSubHeading(data.heroSubHeading);
        }
      };
      fetchConfig();
    }

    if (activeTab === 'articles') {
      const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Article[];
        setArticles(docs);
      });
      return () => unsubscribe();
    }

    if (activeTab === 'links') {
      const q = query(collection(db, 'links'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setLinks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LinkItem[]);
      });
      return () => unsubscribe();
    }

    if (activeTab === 'apps') {
      const q = query(collection(db, 'apps'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setApps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AppItem[]);
      });
      return () => unsubscribe();
    }

    if (activeTab === 'videos') {
      const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setVideos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as VideoItem[]);
      });
      return () => unsubscribe();
    }

    if (activeTab === 'floating') {
      const fetchFloating = async () => {
        const docRef = doc(db, 'floatingContent', 'main');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as FloatingContent;
          setFloatingTitle(data.title);
          setFloatingDescription(data.description);
          setFloatingReference(data.reference);
        }
      };
      fetchFloating();
    }
  }, [activeTab]);

  const getDirectDriveLink = (url: string) => {
    if (!url.includes('drive.google.com')) return url;
    const idMatch = url.match(/\/d\/([^/]+)/) || url.match(/id=([^&]+)/);
    if (idMatch && idMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
    }
    return url;
  };

  const handleSubmitWallpaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!imageUrlInput.trim()) {
      setToast({ message: 'দয়া করে ইমেজের ইউআরএল দিন।', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const finalImageUrl = getDirectDriveLink(imageUrlInput.trim());
      await addDoc(collection(db, 'wallpapers'), {
        imageUrl: finalImageUrl,
        type,
        category,
        createdAt: serverTimestamp(),
        authorId: auth.currentUser.uid,
      });

      setImageUrlInput('');
      setCategory('');
      setToast({ message: 'ওয়ালপেপার সফলভাবে যোগ হয়েছে!', type: 'success' });
    } catch (error: any) {
      console.error('Error adding wallpaper:', error);
      setToast({ message: 'যোগ করতে ব্যর্থ হয়েছে।', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSiteConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, 'siteConfig', 'hero'), {
        heroHeading,
        heroSubHeading
      });
      setToast({ message: 'সাইট কনফিগ আপডেট হয়েছে!', type: 'success' });
    } catch (error) {
      setToast({ message: 'আপডেট করতে সমস্যা হয়েছে।', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      if (editingArticleId) {
        await updateDoc(doc(db, 'articles', editingArticleId), {
          title: articleTitle,
          content: articleContent,
        });
        setEditingArticleId(null);
      } else {
        await addDoc(collection(db, 'articles'), {
          title: articleTitle,
          content: articleContent,
          createdAt: serverTimestamp(),
          likes: 0,
          authorId: auth.currentUser.uid,
        });
      }
      setArticleTitle('');
      setArticleContent('');
      setToast({ message: 'আর্টিকেল সফলভাবে সংরক্ষিত হয়েছে!', type: 'success' });
    } catch (error) {
      setToast({ message: 'সংরক্ষণ করতে সমস্যা হয়েছে।', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWallpaper = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'wallpapers', id));
      setToast({ message: 'ওয়ালপেপার ডিলিট করা হয়েছে।', type: 'success' });
      setDeleteConfirmId(null);
    } catch (error) {
      setToast({ message: 'ডিলিট করতে সমস্যা হয়েছে।', type: 'error' });
    }
  };

  const handleDeleteArticle = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'articles', id));
      setToast({ message: 'আর্টিকেল ডিলিট করা হয়েছে।', type: 'success' });
    } catch (error) {
      setToast({ message: 'ডিলিট করতে সমস্যা হয়েছে।', type: 'error' });
    }
  };

  const handleSubmitLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'links'), {
        title: linkTitle,
        description: linkDescription,
        url: linkUrl,
        createdAt: serverTimestamp(),
      });
      setLinkTitle('');
      setLinkDescription('');
      setLinkUrl('');
      setToast({ message: 'লিংক সফলভাবে যোগ হয়েছে!', type: 'success' });
    } catch (error) {
      setToast({ message: 'যোগ করতে সমস্যা হয়েছে।', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const finalImageUrl = getDirectDriveLink(appImageUrl.trim());
      await addDoc(collection(db, 'apps'), {
        title: appTitle,
        description: appDescription,
        url: appUrl,
        imageUrl: finalImageUrl,
        createdAt: serverTimestamp(),
      });
      setAppTitle('');
      setAppDescription('');
      setAppUrl('');
      setAppImageUrl('');
      setToast({ message: 'অ্যাপ সফলভাবে যোগ হয়েছে!', type: 'success' });
    } catch (error) {
      setToast({ message: 'যোগ করতে সমস্যা হয়েছে।', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'videos'), {
        title: videoTitle,
        videoUrl: videoUrl,
        createdAt: serverTimestamp(),
      });
      setVideoTitle('');
      setVideoUrl('');
      setToast({ message: 'ভিডিও সফলভাবে যোগ হয়েছে!', type: 'success' });
    } catch (error) {
      setToast({ message: 'যোগ করতে সমস্যা হয়েছে।', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFloating = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, 'floatingContent', 'main'), {
        title: floatingTitle,
        description: floatingDescription,
        reference: floatingReference,
      });
      setToast({ message: 'ফ্লোটিং কন্টেন্ট আপডেট হয়েছে!', type: 'success' });
    } catch (error) {
      setToast({ message: 'আপডেট করতে সমস্যা হয়েছে।', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (collectionName: string, id: string) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
      setToast({ message: 'ডিলিট করা হয়েছে।', type: 'success' });
    } catch (error) {
      setToast({ message: 'ডিলিট করতে সমস্যা হয়েছে।', type: 'error' });
    }
  };

  return (
    <div className="p-6 bg-[#064e3b]/30 rounded-2xl border border-emerald-500/20 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <Settings className="text-emerald-500" size={18} />
          <h2 className="text-lg font-bold">এডমিন প্যানেল</h2>
        </div>
        <div className="flex flex-wrap gap-1 bg-black/20 p-1 rounded-lg w-full lg:w-auto">
          {[
            { id: 'upload', icon: Plus, label: 'ওয়ালপেপার' },
            { id: 'manage', icon: List, label: 'ম্যানেজ' },
            { id: 'site', icon: Layout, label: 'সাইট টেক্সট' },
            { id: 'articles', icon: FileText, label: 'আর্টিকেল' },
            { id: 'links', icon: LinkIcon, label: 'লিংক' },
            { id: 'apps', icon: AppIcon, label: 'অ্যাপস' },
            { id: 'videos', icon: Youtube, label: 'ভিডিও' },
            { id: 'floating', icon: Bell, label: 'নোটিস' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${activeTab === tab.id ? 'bg-emerald-600 text-white' : 'text-emerald-500/50 hover:text-emerald-400'}`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'upload' && (
        <form onSubmit={handleSubmitWallpaper} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-emerald-500/70 uppercase tracking-wider mb-1">ইমেজ সোর্স (Image Source)</label>
            <input
              type="text"
              required
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              className="w-full bg-black/40 border border-emerald-500/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm"
              placeholder="গুগল ড্রাইভ লিংক অথবা ডাইরেক্ট ইমেজ ইউআরএল দিন..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-emerald-500/70 uppercase tracking-wider mb-1">ধরণ (Type)</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-black/40 border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="mobile">মোবাইল (Mobile)</option>
                <option value="desktop">ডেস্কটপ (Desktop)</option>
                <option value="fb_profile">ফেসবুক প্রোফাইল (FB Profile)</option>
                <option value="fb_cover">ফেসবুক কভার (FB Cover)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-emerald-500/70 uppercase tracking-wider mb-1">ক্যাটাগরি (Category)</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-black/40 border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="যেমন: ইসলামিক"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" /> : <ImageIcon size={20} />}
            ওয়ালপেপার যোগ করুন
          </button>
        </form>
      )}

      {activeTab === 'site' && (
        <form onSubmit={handleUpdateSiteConfig} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-emerald-500/70 uppercase tracking-wider mb-1">হিরো হেডিং (Hero Heading)</label>
            <input
              type="text"
              required
              value={heroHeading}
              onChange={(e) => setHeroHeading(e.target.value)}
              className="w-full bg-black/40 border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-emerald-500/70 uppercase tracking-wider mb-1">হিরো সাব-হেডিং (Hero Sub-Heading)</label>
            <textarea
              required
              value={heroSubHeading}
              onChange={(e) => setHeroSubHeading(e.target.value)}
              className="w-full bg-black/40 border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 h-24"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'আপডেট করুন'}
          </button>
        </form>
      )}

      {activeTab === 'articles' && (
        <div className="space-y-8">
          <form onSubmit={handleSubmitArticle} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-emerald-500/70 uppercase tracking-wider mb-1">আর্টিকেল টাইটেল</label>
              <input
                type="text"
                required
                value={articleTitle}
                onChange={(e) => setArticleTitle(e.target.value)}
                className="w-full bg-black/40 border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="bg-white rounded-lg text-black">
              <ReactQuill 
                theme="snow" 
                value={articleContent} 
                onChange={setArticleContent}
                className="h-64 mb-12"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" /> : editingArticleId ? 'আপডেট করুন' : 'পোস্ট করুন'}
            </button>
          </form>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest">আর্টিকেল লিস্ট</h3>
            {articles.map(art => (
              <div key={art.id} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-emerald-500/10">
                <span className="text-sm font-medium text-emerald-50 truncate flex-1">{art.title}</span>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingArticleId(art.id); setArticleTitle(art.title); setArticleContent(art.content); }} className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg"><Edit2 size={16} /></button>
                  <button onClick={() => handleDeleteArticle(art.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {wallpapers.map((w) => (
            <div key={w.id} className="flex flex-col gap-3 p-4 bg-black/20 rounded-xl border border-emerald-500/10">
              <div className="flex items-center gap-4">
                <img src={w.imageUrl} className="w-16 h-16 object-cover rounded-lg border border-emerald-500/20" alt="" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-emerald-500/60 uppercase tracking-widest">
                    {w.type} • {w.category || 'ক্যাটাগরি নেই'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setDeleteConfirmId(w.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={16} /></button>
                </div>
              </div>
              {deleteConfirmId === w.id && (
                <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <span className="text-xs font-medium text-red-200">আপনি কি নিশ্চিত?</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleDeleteWallpaper(w.id)} className="px-3 py-1 bg-red-600 text-white text-[10px] font-bold rounded-md">হ্যাঁ</button>
                    <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1 bg-white/5 text-emerald-200/60 text-[10px] font-bold rounded-md">না</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'links' && (
        <div className="space-y-8">
          <form onSubmit={handleSubmitLink} className="space-y-4">
            <input
              type="text"
              required
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              className="w-full bg-black/40 border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
              placeholder="লিংক টাইটেল"
            />
            <textarea
              required
              value={linkDescription}
              onChange={(e) => setLinkDescription(e.target.value)}
              className="w-full bg-black/40 border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 h-24"
              placeholder="লিংক বিবরণ"
            />
            <input
              type="url"
              required
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full bg-black/40 border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
              placeholder="লিংক ইউআরএল (https://...)"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'লিংক যোগ করুন'}
            </button>
          </form>

          <div className="space-y-4">
            {links.map(link => (
              <div key={link.id} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-emerald-500/10">
                <span className="text-sm font-medium text-emerald-50 truncate flex-1">{link.title}</span>
                <button onClick={() => handleDeleteItem('links', link.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'apps' && (
        <div className="space-y-8">
          <form onSubmit={handleSubmitApp} className="space-y-4">
            <input
              type="text"
              required
              value={appTitle}
              onChange={(e) => setAppTitle(e.target.value)}
              className="w-full bg-black/40 border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
              placeholder="অ্যাপ টাইটেল"
            />
            <textarea
              required
              value={appDescription}
              onChange={(e) => setAppDescription(e.target.value)}
              className="w-full bg-black/40 border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 h-24"
              placeholder="অ্যাপ বিবরণ"
            />
            <input
              type="url"
              required
              value={appUrl}
              onChange={(e) => setAppUrl(e.target.value)}
              className="w-full bg-black/40 border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
              placeholder="ডাউনলোড লিংক"
            />
            <input
              type="text"
              required
              value={appImageUrl}
              onChange={(e) => setAppImageUrl(e.target.value)}
              className="w-full bg-black/40 border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
              placeholder="অ্যাপ ইমেজ (ড্রাইভ লিংক বা ইউআরএল)"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'অ্যাপ যোগ করুন'}
            </button>
          </form>

          <div className="space-y-4">
            {apps.map(app => (
              <div key={app.id} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-emerald-500/10">
                <span className="text-sm font-medium text-emerald-50 truncate flex-1">{app.title}</span>
                <button onClick={() => handleDeleteItem('apps', app.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'videos' && (
        <div className="space-y-8">
          <form onSubmit={handleSubmitVideo} className="space-y-4">
            <input
              type="text"
              required
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              className="w-full bg-black/40 border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
              placeholder="ভিডিও টাইটেল"
            />
            <input
              type="url"
              required
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full bg-black/40 border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
              placeholder="ইউটিউব ভিডিও লিংক"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'ভিডিও যোগ করুন'}
            </button>
          </form>

          <div className="space-y-4">
            {videos.map(video => (
              <div key={video.id} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-emerald-500/10">
                <span className="text-sm font-medium text-emerald-50 truncate flex-1">{video.title}</span>
                <button onClick={() => handleDeleteItem('videos', video.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'floating' && (
        <form onSubmit={handleSubmitFloating} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-emerald-500/70 uppercase tracking-wider mb-1">টাইটেল (Title)</label>
            <input
              type="text"
              required
              value={floatingTitle}
              onChange={(e) => setFloatingTitle(e.target.value)}
              className="w-full bg-black/40 border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
              placeholder="ফ্লোটিং বক্সের টাইটেল"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-emerald-500/70 uppercase tracking-wider mb-1">বিবরণ (Description)</label>
            <textarea
              required
              value={floatingDescription}
              onChange={(e) => setFloatingDescription(e.target.value)}
              className="w-full bg-black/40 border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 h-32"
              placeholder="ফ্লোটিং বক্সের বিস্তারিত বিবরণ"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-emerald-500/70 uppercase tracking-wider mb-1">রেফারেন্স (Reference)</label>
            <input
              type="text"
              value={floatingReference}
              onChange={(e) => setFloatingReference(e.target.value)}
              className="w-full bg-black/40 border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
              placeholder="যেমন: বুখারী: ১২৩৪"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'আপডেট করুন'}
          </button>
        </form>
      )}

      <Toast 
        isVisible={!!toast}
        message={toast?.message || ''}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  );
};

