import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { Search as SearchIcon, MapPin, Star, Filter, ArrowRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface TutorProfile {
  uid: string;
  expertise: string[];
  rates: number;
  location: string;
  tutoringMode: string;
  rating: number;
  reviewsCount: number;
  isFeatured: boolean;
  name?: string;
  photoUrl?: string;
}

export default function Search() {
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTutors();
  }, []);

  const fetchTutors = async () => {
    setLoading(true);
    try {
      // 1. Fetch tutor profiles
      const q = query(collection(db, 'tutor_profiles'), limit(20));
      const querySnapshot = await getDocs(q);
      
      const tutorData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      
      // 2. Fetch corresponding user names/photos
      const enrichedTutors = await Promise.all(tutorData.map(async (t) => {
        const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', t.uid)));
        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          return { ...t, name: userData.name, photoUrl: userData.photoUrl };
        }
        return t;
      }));

      setTutors(enrichedTutors);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'tutor_profiles');
    } finally {
      setLoading(false);
    }
  };

  const filteredTutors = tutors.filter(t => {
    const matchesSearch = t.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.expertise.some(e => e.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSubject = !subjectFilter || t.expertise.some(e => e.toLowerCase() === subjectFilter.toLowerCase());
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 space-y-8">
      <div className="flex flex-col gap-6 pt-8">
        <h1 className="text-4xl font-bold tracking-tight">Find Your Perfect Tutor</h1>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search by name or subject (e.g. Math, Python)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border border-gray-200 bg-white font-semibold hover:border-indigo-200 transition-all shrink-0"
          >
            <Filter size={20} />
            Filters
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 bg-white rounded-2xl border border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Subject</label>
                  <select 
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="w-full p-2 bg-gray-50 rounded-lg border-transparent focus:border-indigo-600"
                  >
                    <option value="">All Subjects</option>
                    <option value="Math">Math</option>
                    <option value="Science">Science</option>
                    <option value="English">English</option>
                    <option value="Programming">Programming</option>
                  </select>
                </div>
                {/* Add more filters here as needed */}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-12">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-gray-100 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-24">
          {filteredTutors.length > 0 ? (
            filteredTutors.map(tutor => (
              <TutorCard key={tutor.uid} tutor={tutor} />
            ))
          ) : (
            <div className="col-span-full py-24 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-50 text-gray-400 mb-6">
                <SearchIcon size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">No tutors found</h3>
              <p className="text-gray-500 mt-2">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TutorCard({ tutor }: { tutor: TutorProfile; key?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group bg-white rounded-[2.5rem] p-6 border border-gray-100 hover:border-indigo-200 transition-all hover:shadow-2xl hover:shadow-indigo-50"
    >
      <div className="flex gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md shrink-0">
          <img 
            src={tutor.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tutor.uid}`} 
            alt={tutor.name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-gray-900 truncate">{tutor.name}</h3>
          <div className="flex items-center gap-1 text-amber-500 mt-1">
            <Star size={16} fill="currentColor" />
            <span className="text-sm font-bold">{tutor.rating || 'N/A'}</span>
            <span className="text-xs text-gray-400">({tutor.reviewsCount} reviews)</span>
          </div>
        </div>
        {tutor.isFeatured && (
          <div className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold self-start">
            Featured
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6 h-[4.5rem] overflow-hidden">
        {tutor.expertise.map(skill => (
          <span key={skill} className="bg-gray-50 text-gray-600 px-3 py-1 rounded-lg text-xs font-semibold border border-gray-100">
            {skill}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-gray-50">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rate</span>
          <span className="text-xl font-black text-indigo-600">₱{tutor.rates}<span className="text-xs text-gray-400 font-normal">/hr</span></span>
        </div>
        <Link 
          to={`/tutor/${tutor.uid}`}
          className="bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-700 transition-all flex items-center gap-2 group-hover:px-6"
        >
          <span className="hidden group-hover:block font-bold">View Profile</span>
          <ArrowRight size={20} />
        </Link>
      </div>
    </motion.div>
  );
}
