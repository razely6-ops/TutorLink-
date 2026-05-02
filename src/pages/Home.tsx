import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, BookOpen, Star, ShieldCheck, MapPin, Globe } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center min-h-[70vh]">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold">
            <Star size={16} fill="currentColor" />
            <span>#1 Tutor Network in the Philippines</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight leading-[1.1] text-gray-900">
            Learn anything, <br />
            <span className="text-indigo-600">anywhere.</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-lg leading-relaxed">
            Connect with expert tutors for Math, Science, Arts, and more. Online or face-to-face sessions tailored to your schedule and budget.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/search" 
              className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
            >
              <Search size={20} />
              Find a Tutor
            </Link>
            <Link 
              to="/login" 
              className="bg-white text-gray-900 border border-gray-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              Become a Tutor
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <div className="aspect-square bg-indigo-600 rounded-[3rem] overflow-hidden rotate-3 shadow-2xl relative">
             <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop" 
              className="w-full h-full object-cover -rotate-3 scale-110 opacity-90"
              alt="Students learning"
              referrerPolicy="no-referrer"
            />
          </div>
          {/* Floating Stats */}
          <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-gray-50 max-w-[200px]">
             <div className="flex items-center gap-2 text-indigo-600 mb-1">
                <Star fill="currentColor" size={16} />
                <span className="font-bold text-xl text-gray-900">4.9/5</span>
             </div>
             <p className="text-sm text-gray-500">Average student rating for our expert tutors.</p>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-24 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
             <h2 className="text-4xl font-bold tracking-tight">Why Choose TutorLink?</h2>
             <p className="text-gray-500 max-w-2xl mx-auto">We provide the tools and security needed for a seamless learning experience.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Globe className="text-indigo-600" />}
              title="Online or In-Person"
              description="Learn from the comfort of your home or meet your tutor at a local library or cafe."
            />
            <FeatureCard 
              icon={<ShieldCheck className="text-green-600" />}
              title="Verified Experts"
              description="Every tutor profile is manually reviewed for certifications and expertise."
            />
            <FeatureCard 
              icon={<BookOpen className="text-amber-600" />}
              title="All Subjects"
              description="From elementary Math to advanced Programming. We have tutors for everyone."
            />
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="bg-indigo-900 rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden">
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Ready to boost your grades?</h2>
            <p className="text-indigo-100 text-xl max-w-2xl mx-auto opacity-80">
              Join thousands of students across the Philippines who are reaching their academic goals with TutorLink.
            </p>
            <Link 
              to="/login" 
              className="inline-block bg-white text-indigo-900 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-indigo-50 transition-all shadow-xl"
            >
              Start Learning Now
            </Link>
          </div>
          {/* Abstract blobs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800 rounded-full blur-[100px] -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-800 rounded-full blur-[100px] -ml-32 -mb-32"></div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string, description: string }) {
  return (
    <div className="p-8 rounded-[2rem] border border-gray-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50/50 transition-all group">
      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}
