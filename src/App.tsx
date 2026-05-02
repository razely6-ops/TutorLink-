/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { StrictMode } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Search from './pages/Search';
import TutorProfile from './pages/TutorProfile';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Login from './pages/Login';
import { LogOut, User as UserIcon, MessageSquare, Search as SearchIcon, Home as HomeIcon } from 'lucide-react';
import { auth } from './lib/firebase';
import { signOut } from 'firebase/auth';

function Navbar() {
  const { user, profile } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-100 py-4 px-6 fixed top-0 w-full z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold tracking-tight text-indigo-600 flex items-center gap-2">
          <BookOpenIcon className="w-8 h-8" />
          <span>TutorLink</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 font-medium text-gray-600">
          <NavLink to="/" icon={<HomeIcon size={18} />} label="Home" />
          <NavLink to="/search" icon={<SearchIcon size={18} />} label="Find Tutors" />
          {user && <NavLink to="/dashboard" icon={<UserIcon size={18} />} label="Dashboard" />}
          {user && <NavLink to="/chat" icon={<MessageSquare size={18} />} label="Messages" />}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-900">{profile?.name || user.displayName}</span>
                <span className="text-xs text-gray-500 capitalize">{profile?.role || 'User'}</span>
              </div>
              <button 
                onClick={() => signOut(auth)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link 
              to="/login"
              className="bg-indigo-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-indigo-700 transition-all shadow-sm"
            >
              Get Started
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center font-mono text-gray-400">LOADING...</div>;
  return user ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#FDFDFF] text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
          <Navbar />
          <main className="pt-24 pb-12">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/tutor/:id" element={<TutorProfile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
              <Route path="/chat/:roomId" element={<PrivateRoute><Chat /></PrivateRoute>} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
