import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Plus, Image as ImageIcon, Loader2, Trash2, Edit2, Settings, List, X, Check } from 'lucide-react';
import { Toast } from './Toast';

interface Wallpaper {
  id: string;
  title: string;
  imageUrl: string;
  type: 'mobile' | 'desktop';
  category?: string;
}

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manage'>('upload');
  const [title, setTitle] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [type, setType] = useState<'mobile' | 'desktop'>('mobile');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
  }, [activeTab]);

  const getDirectDriveLink = (url: string) => {
    if (!url.includes('drive.google.com')) return url;
    
    // Extract ID from various Google Drive link formats
    const idMatch = url.match(/\/d\/([^/]+)/) || url.match(/id=([^&]+)/);
    if (idMatch && idMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
    }
    return url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!imageUrlInput.trim()) {
      setToast({ message: 'দয়া করে ইমেজের ইউআরএল দিন।', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const finalImageUrl = getDirectDriveLink(imageUrlInput.trim());

      console.log('Adding document to Firestore...');
      await addDoc(collection(db, 'wallpapers'), {
        title,
        imageUrl: finalImageUrl,
        type,
        category,
        createdAt: serverTimestamp(),
        authorId: auth.currentUser.uid,
        authorEmail: auth.currentUser.email,
        isExternal: true
      });

      setTitle('');
      setImageUrlInput('');
      setCategory('');
      setToast({ message: 'ওয়ালপেপার সফলভাবে যোগ হয়েছে!', type: 'success' });
    } catch (error: any) {
      console.error('Error adding wallpaper:', error);
      let errorMessage = 'যোগ করতে ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন।';
      
      if (error.message?.includes('client is offline')) {
        errorMessage = 'আপনি অফলাইনে আছেন। ইন্টারনেট কানেকশন চেক করুন।';
      }
      
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'wallpapers', id));
      
      setToast({ message: 'ওয়ালপেপার ডিলিট করা হয়েছে।', type: 'success' });
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Delete error:', error);
      setToast({ message: 'ডিলিট করতে সমস্যা হয়েছে।', type: 'error' });
    }
  };

  const startEditing = (wallpaper: Wallpaper) => {
    setEditingId(wallpaper.id);
    setEditTitle(wallpaper.title);
    setEditCategory(wallpaper.category || '');
  };

  const handleUpdate = async (id: string) => {
    if (!editTitle.trim()) return;

    try {
      await updateDoc(doc(db, 'wallpapers', id), {
        title: editTitle,
        category: editCategory
      });
      setEditingId(null);
      setToast({ message: 'আপডেট সফল হয়েছে।', type: 'success' });
    } catch (error) {
      console.error('Update error:', error);
      setToast({ message: 'আপডেট করতে সমস্যা হয়েছে।', type: 'error' });
    }
  };

  return (
    <div className="p-6 bg-[#064e3b]/30 rounded-2xl border border-emerald-500/20 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <Settings className="text-emerald-500" size={18} />
          <h2 className="text-lg font-bold">এডমিন প্যানেল</h2>
        </div>
        <div className="flex gap-1 bg-black/20 p-1 rounded-lg w-full sm:w-auto">
          <button 
            onClick={() => setActiveTab('upload')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'upload' ? 'bg-emerald-600 text-white' : 'text-emerald-500/50 hover:text-emerald-400'}`}
          >
            <Plus size={14} />
            যোগ করুন
          </button>
          <button 
            onClick={() => setActiveTab('manage')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'manage' ? 'bg-emerald-600 text-white' : 'text-emerald-500/50 hover:text-emerald-400'}`}
          >
            <List size={14} />
            ম্যানেজ
          </button>
        </div>
      </div>

      {activeTab === 'upload' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-emerald-500/70 uppercase tracking-wider mb-1">শিরোনাম (Title)</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black/40 border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="যেমন: সুন্দর প্রকৃতি"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-emerald-500/70 uppercase tracking-wider mb-1">ইমেজ সোর্স (Image Source)</label>
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  required
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="w-full bg-black/40 border border-emerald-500/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm"
                  placeholder="গুগল ড্রাইভ লিংক অথবা ডাইরেক্ট ইমেজ ইউআরএল দিন..."
                />
                <div className="mt-1 text-[10px] text-emerald-500/40">
                  * গুগল ড্রাইভের শেয়ারিং লিংক দিলে সেটি অটোমেটিক ডাইরেক্ট লিংকে রুপান্তর হবে।
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-emerald-500/70 uppercase tracking-wider mb-1">ধরণ (Type)</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'mobile' | 'desktop')}
                className="w-full bg-black/40 border border-emerald-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="mobile">মোবাইল (Mobile)</option>
                <option value="desktop">ডেস্কটপ (Desktop)</option>
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
            disabled={loading || !imageUrlInput.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-emerald-900/20"
          >
            {loading ? <Loader2 className="animate-spin" /> : <ImageIcon size={20} />}
            {loading ? 'প্রসেস হচ্ছে...' : 'ওয়ালপেপার যোগ করুন'}
          </button>
        </form>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {wallpapers.length === 0 ? (
            <div className="text-center py-10 text-emerald-500/50">কোনো ওয়ালপেপার নেই।</div>
          ) : (
            wallpapers.map((w) => (
              <div key={w.id} className="flex flex-col gap-3 p-4 bg-black/20 rounded-xl border border-emerald-500/10 group">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <img src={w.imageUrl} className="w-full sm:w-16 h-32 sm:h-16 object-cover rounded-lg border border-emerald-500/20" alt="" />
                  
                  {editingId === w.id ? (
                    <div className="flex-1 w-full space-y-2">
                      <input 
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-black/40 border border-emerald-500/30 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-emerald-500"
                        placeholder="টাইটেল"
                      />
                      <input 
                        type="text"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full bg-black/40 border border-emerald-500/30 rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                        placeholder="ক্যাটাগরি"
                      />
                    </div>
                  ) : (
                  <div className="flex-1 min-w-0 w-full text-center sm:text-left">
                    <h3 className="text-sm font-bold text-emerald-50 truncate">{w.title}</h3>
                    <p className="text-[10px] text-emerald-500/60 uppercase tracking-widest">
                      {w.type === 'mobile' ? 'মোবাইল' : 'ডেস্কটপ'} • {w.category || 'ক্যাটাগরি নেই'}
                    </p>
                  </div>
                  )}

                  <div className="flex gap-2 justify-center sm:justify-end w-full sm:w-auto">
                    {editingId === w.id ? (
                      <>
                        <button 
                          onClick={() => handleUpdate(w.id)}
                          className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                        >
                          <Check size={16} />
                        </button>
                        <button 
                          onClick={() => setEditingId(null)}
                          className="p-2 rounded-lg bg-white/5 text-emerald-200/60 hover:bg-white/10 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => startEditing(w)}
                          className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(w.id)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {deleteConfirmId === w.id && (
                  <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20 animate-in fade-in slide-in-from-top-2">
                    <span className="text-xs font-medium text-red-200">আপনি কি নিশ্চিত?</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleDelete(w.id)}
                        className="px-3 py-1 bg-red-600 text-white text-[10px] font-bold rounded-md hover:bg-red-500 transition-colors"
                      >
                        হ্যাঁ, ডিলিট করুন
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-3 py-1 bg-white/5 text-emerald-200/60 text-[10px] font-bold rounded-md hover:bg-white/10 transition-colors"
                      >
                        না
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
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
