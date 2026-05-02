import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Star, GraduationCap, MapPin, Globe, Calendar, MessageSquare, BookOpen, ArrowLeft, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface TutorData {
  uid: string;
  name: string;
  photoUrl: string;
  bio: string;
  expertise: string[];
  rates: number;
  education: string;
  certifications: string[];
  location: string;
  tutoringMode: string;
  rating: number;
}

export default function TutorProfile() {
  const { id } = useParams();
  const { user, profile: studentProfile } = useAuth();
  const [tutor, setTutor] = useState<TutorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function getTutor() {
      if (!id) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', id));
        const tutorDoc = await getDoc(doc(db, 'tutor_profiles', id));
        
        if (userDoc.exists() && tutorDoc.exists()) {
          setTutor({
            ...userDoc.data() as any,
            ...tutorDoc.data() as any
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    getTutor();
  }, [id]);

  const handleStartChat = async () => {
    if (!user) return navigate('/login');
    if (!id || !tutor) return;

    try {
      // Check if chat room already exists
      const q = query(
        collection(db, 'chat_rooms'),
        where('participantIds', 'array-contains', user.uid)
      );
      const querySnapshot = await getDocs(q);
      let existingRoomId = '';
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.participantIds.includes(id)) {
          existingRoomId = doc.id;
        }
      });

      if (existingRoomId) {
        navigate(`/chat/${existingRoomId}`);
      } else {
        const newRoom = await addDoc(collection(db, 'chat_rooms'), {
          participantIds: [user.uid, id],
          lastMessage: '',
          updatedAt: new Date().toISOString()
        });
        navigate(`/chat/${newRoom.id}`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'chat_rooms');
    }
  };

  const handleBooking = async () => {
    if (!user) return navigate('/login');
    if (!id || !tutor) return;

    setBookingLoading(true);
    try {
      await addDoc(collection(db, 'bookings'), {
        studentId: user.uid,
        tutorId: id,
        status: 'pending',
        sessionDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow default
        subject: tutor.expertise[0] || 'General Tutoring',
        price: tutor.rates,
        createdAt: new Date().toISOString()
      });
      alert('Booking request sent successfully!');
      navigate('/dashboard');
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, 'bookings');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto p-24 text-center animate-pulse text-indigo-200">LOADING PROFILE...</div>;
  if (!tutor) return <div className="max-w-7xl mx-auto p-24 text-center">Tutor not found.</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 space-y-12 pb-24">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-semibold"
      >
        <ArrowLeft size={20} />
        Back to search
      </button>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Left Column: Profile Info */}
        <div className="lg:col-span-2 space-y-12">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-[2.5rem] bg-indigo-100 overflow-hidden shadow-2xl relative shrink-0">
               <img 
                src={tutor.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tutor.uid}`} 
                alt={tutor.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                 {tutor.expertise.map(skill => (
                    <span key={skill} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-bold border border-indigo-100">
                      {skill}
                    </span>
                 ))}
              </div>
              <h1 className="text-5xl font-black tracking-tight text-gray-900">{tutor.name}</h1>
              <div className="flex items-center gap-6 text-gray-500">
                <div className="flex items-center gap-2">
                   <Star size={20} fill="#f59e0b" stroke="#f59e0b" />
                   <span className="font-bold text-gray-900 text-xl">{tutor.rating || 'New'}</span>
                </div>
                <div className="flex items-center gap-2">
                   <MapPin size={20} />
                   <span>{tutor.location}</span>
                </div>
                <div className="flex items-center gap-2">
                   <Globe size={20} />
                   <span className="capitalize">{tutor.tutoringMode} Tutoring</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="text-indigo-600" />
              About Me
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap">
              {tutor.bio || 'This tutor hasn\'t shared a bio yet.'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
             <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-4">
               <h3 className="text-xl font-bold flex items-center gap-2">
                  <GraduationCap className="text-indigo-600" />
                  Education
               </h3>
               <p className="text-gray-600 leading-relaxed">
                  {tutor.education || 'Certifications and education details not listed.'}
               </p>
             </div>
             <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-4">
               <h3 className="text-xl font-bold flex items-center gap-2">
                  <ShieldCheck className="text-green-600" />
                  Certifications
               </h3>
               <ul className="space-y-2">
                  {tutor.certifications?.length > 0 ? tutor.certifications.map(c => (
                    <li key={c} className="flex items-center gap-2 text-gray-600">
                       <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                       {c}
                    </li>
                  )) : <li className="text-gray-400">No certifications listed.</li>}
               </ul>
             </div>
          </div>
        </div>

        {/* Right Column: Booking Widget */}
        <div className="lg:col-span-1">
          <div className="sticky top-32 p-8 bg-white rounded-[3rem] border border-gray-100 shadow-2xl shadow-indigo-100 space-y-8">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                 <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Hourly Rate</span>
                 <h3 className="text-4xl font-black text-indigo-600">₱{tutor.rates}</h3>
              </div>
              <div className="text-right">
                 <span className="text-xs text-gray-400 block mb-1">Session length</span>
                 <span className="font-bold text-gray-900 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">60 mins</span>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={handleBooking}
                disabled={bookingLoading}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-100"
              >
                <Calendar size={20} />
                {bookingLoading ? 'Requesting...' : 'Book a Session'}
              </button>
              <button 
                onClick={handleStartChat}
                className="w-full bg-white text-indigo-600 border-2 border-indigo-600 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-50 transition-all flex items-center justify-center gap-3"
              >
                <MessageSquare size={20} />
                Send a Message
              </button>
            </div>

            <div className="pt-6 border-t border-gray-50 flex items-center gap-3 text-sm text-gray-400">
               <ShieldCheck size={16} className="text-green-500" />
               <span>Secured payments through platforms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
