import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, OperationType, handleFirestoreError } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { UserPlus, LogIn, GraduationCap, Briefcase } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Login() {
  const [roleSelection, setRoleSelection] = useState<'student' | 'tutor' | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    if (!roleSelection) {
      alert("Please select a role first!");
      return;
    }

    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user already exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Create new user profile
        const newProfile = {
          uid: user.uid,
          name: user.displayName || 'Unnamed User',
          email: user.email || '',
          role: roleSelection,
          photoUrl: user.photoURL || '',
          bio: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'users', user.uid), newProfile);
        
        // If tutor, create default tutor profile
        if (roleSelection === 'tutor') {
          await setDoc(doc(db, 'tutor_profiles', user.uid), {
            uid: user.uid,
            expertise: [],
            rates: 0,
            education: '',
            certifications: [],
            location: 'Remote',
            tutoringMode: 'online',
            availability: {},
            rating: 0,
            reviewsCount: 0,
            isFeatured: false,
            updatedAt: new Date().toISOString()
          });
        }
      }

      navigate('/dashboard');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-xl shadow-indigo-100/50 border border-indigo-50"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Welcome to TutorLink</h2>
          <p className="text-gray-500 mt-2">Find your perfect tutor or start your teaching journey today.</p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setRoleSelection('student')}
              className={cn(
                "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                roleSelection === 'student' 
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700" 
                  : "border-gray-100 hover:border-indigo-200 text-gray-600"
              )}
            >
              <GraduationCap size={32} />
              <span className="font-semibold">I'm a Student</span>
            </button>
            <button
              onClick={() => setRoleSelection('tutor')}
              className={cn(
                "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                roleSelection === 'tutor' 
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700" 
                  : "border-gray-100 hover:border-indigo-200 text-gray-600"
              )}
            >
              <Briefcase size={32} />
              <span className="font-semibold">I'm a Tutor</span>
            </button>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading || !roleSelection}
            className={cn(
              "w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold transition-all",
              !roleSelection 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
            )}
          >
            {loading ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              <>
                <LogIn size={20} />
                Continue with Google
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400 px-4">
            By continuing, you agree to our Terms of Service and Privacy Policy. Secure login powered by Firebase.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
