import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot, orderBy, getDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Calendar, Clock, CheckCircle, XCircle, User, Settings, Briefcase, Plus, Save } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'bookings' | 'settings'>('bookings');
  
  if (!user || !profile) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 space-y-8">
      <div className="flex justify-between items-end border-b border-gray-100 pb-8">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">Welcome, {profile.name}</h1>
          <p className="text-gray-500 font-medium">Manage your {profile.role} account and scheduled sessions.</p>
        </div>
        <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
           <TabButton 
            active={activeTab === 'bookings'} 
            onClick={() => setActiveTab('bookings')} 
            label="Bookings" 
            icon={<Calendar size={18} />} 
          />
           <TabButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            label="Settings" 
            icon={<Settings size={18} />} 
          />
        </div>
      </div>

      <div className="py-4">
        {activeTab === 'bookings' && <BookingsList role={profile.role} uid={user.uid} />}
        {activeTab === 'settings' && <ProfileSettings role={profile.role} uid={user.uid} profile={profile} />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all",
        active 
          ? "bg-white text-indigo-600 shadow-sm" 
          : "text-gray-400 hover:text-gray-600"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function BookingsList({ role, uid }: { role: 'student' | 'tutor', uid: string }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'bookings'),
      where(role === 'student' ? 'studentId' : 'tutorId', '==', uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const bookingData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Enrich with other user's info
      const enriched = await Promise.all(bookingData.map(async (b: any) => {
        const otherId = role === 'student' ? b.tutorId : b.studentId;
        const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', otherId)));
        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          return { ...b, otherName: userData.name, otherPhoto: userData.photoUrl };
        }
        return b;
      }));
      
      setBookings(enriched);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bookings');
    });

    return () => unsubscribe();
  }, [role, uid]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'bookings', id), { 
        status,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, `bookings/${id}`);
    }
  };

  if (loading) return <div className="animate-pulse space-y-4">
    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-50 rounded-3xl border border-gray-100"></div>)}
  </div>;

  return (
    <div className="space-y-6">
      {bookings.length > 0 ? bookings.map((b) => (
        <div key={b.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-6 flex-1">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center overflow-hidden shrink-0">
                 {b.otherPhoto ? <img src={b.otherPhoto} className="w-full h-full object-cover" /> : <User className="text-indigo-400" />}
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">{b.subject}</h3>
                <p className="text-gray-500 font-medium">With <span className="text-gray-900">{b.otherName}</span></p>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {format(new Date(b.sessionDate), 'PPP')}</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {format(new Date(b.sessionDate), 'p')}</span>
                </div>
              </div>
           </div>
           
           <div className="flex items-center gap-6">
             <div className="text-right">
                <span className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest",
                  b.status === 'pending' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                  b.status === 'confirmed' ? "bg-green-50 text-green-600 border border-green-100" :
                  b.status === 'completed' ? "bg-indigo-50 text-indigo-600 border border-indigo-100" :
                  "bg-red-50 text-red-600 border border-red-100"
                )}>
                  {b.status}
                </span>
             </div>
             
             <div className="flex items-center gap-2">
               {b.status === 'pending' && role === 'tutor' && (
                 <>
                   <button 
                    onClick={() => updateStatus(b.id, 'confirmed')}
                    className="p-3 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-all shadow-lg shadow-green-100"
                    title="Confirm Booking"
                   >
                     <CheckCircle size={20} />
                   </button>
                   <button 
                    onClick={() => updateStatus(b.id, 'cancelled')}
                    className="p-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-100"
                    title="Decline Booking"
                   >
                     <XCircle size={20} />
                   </button>
                 </>
               )}
               {b.status === 'pending' && role === 'student' && (
                 <button 
                  onClick={() => updateStatus(b.id, 'cancelled')}
                  className="px-6 py-2 border border-red-100 text-red-500 rounded-xl hover:bg-red-50 font-bold transition-all text-sm"
                 >
                   Cancel Request
                 </button>
               )}
               {b.status === 'confirmed' && role === 'tutor' && (
                 <button 
                  onClick={() => updateStatus(b.id, 'completed')}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold transition-all text-sm shadow-lg shadow-indigo-100"
                 >
                   Mark Completed
                 </button>
               )}
             </div>
           </div>
        </div>
      )) : (
        <div className="py-24 text-center bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
           <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
           <h3 className="text-xl font-bold text-gray-500">No sessions scheduled yet.</h3>
        </div>
      )}
    </div>
  );
}

function ProfileSettings({ role, uid, profile }: { role: 'student' | 'tutor', uid: string, profile: any }) {
  const [formData, setFormData] = useState({
    name: profile.name,
    bio: profile.bio || '',
    rates: 0,
    expertise: [] as string[],
    newSkill: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (role === 'tutor') {
      const fetchTutorData = async () => {
        const tutorSnap = await getDoc(doc(db, 'tutor_profiles', uid));
        if (tutorSnap.exists()) {
          const t = tutorSnap.data();
          setFormData(prev => ({
            ...prev,
            rates: t.rates,
            expertise: t.expertise || []
          }));
        }
      };
      fetchTutorData();
    }
  }, [role, uid]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', uid), {
        name: formData.name,
        bio: formData.bio,
        updatedAt: new Date().toISOString()
      });

      if (role === 'tutor') {
        await updateDoc(doc(db, 'tutor_profiles', uid), {
          rates: Number(formData.rates),
          expertise: formData.expertise,
          updatedAt: new Date().toISOString()
        });
      }
      alert('Profile updated successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (formData.newSkill && !formData.expertise.includes(formData.newSkill)) {
      setFormData({ 
        ...formData, 
        expertise: [...formData.expertise, formData.newSkill],
        newSkill: ''
      });
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      expertise: formData.expertise.filter(s => s !== skill)
    });
  };

  return (
    <form onSubmit={handleSave} className="max-w-3xl space-y-12">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Display Name</label>
          <input 
            type="text" 
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-indigo-600 outline-none transition-all"
          />
        </div>
        {role === 'tutor' && (
          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Hourly Rate (₱)</label>
            <input 
              type="number" 
              value={formData.rates}
              onChange={(e) => setFormData({...formData, rates: Number(e.target.value)})}
              className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-indigo-600 outline-none transition-all"
            />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Short Bio</label>
        <textarea 
          rows={4}
          value={formData.bio}
          onChange={(e) => setFormData({...formData, bio: e.target.value})}
          placeholder="Tell students about your teaching style and experience..."
          className="w-full p-4 rounded-2xl bg-white border border-gray-200 focus:border-indigo-600 outline-none transition-all resize-none"
        />
      </div>

      {role === 'tutor' && (
        <div className="space-y-4">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Expertise / Subjects</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={formData.newSkill}
              onChange={(e) => setFormData({...formData, newSkill: e.target.value})}
              placeholder="Add a subject (e.g. Algebra)"
              className="flex-1 p-4 rounded-2xl bg-white border border-gray-200 focus:border-indigo-600 outline-none transition-all"
            />
            <button 
              type="button"
              onClick={addSkill}
              className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all font-bold"
            >
              <Plus size={24} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
             {formData.expertise.map(skill => (
               <span key={skill} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-indigo-100">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)}><Plus size={14} className="rotate-45" /></button>
               </span>
             ))}
          </div>
        </div>
      )}

      <button 
        type="submit"
        disabled={saving}
        className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-xl shadow-indigo-100"
      >
        <Save size={20} />
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
