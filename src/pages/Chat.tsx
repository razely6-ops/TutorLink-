import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { Send, User, ArrowLeft, MessageSquare, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ChatRoom {
  id: string;
  participantIds: string[];
  lastMessage: string;
  updatedAt: any;
  otherName?: string;
  otherPhoto?: string;
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: any;
}

export default function Chat() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chat_rooms'),
      where('participantIds', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const roomData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      
      const enrichedRooms = await Promise.all(roomData.map(async (r) => {
        const otherId = r.participantIds.find((id: string) => id !== user.uid);
        const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', otherId)));
        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          return { ...r, otherName: userData.name, otherPhoto: userData.photoUrl };
        }
        return r;
      }));

      setRooms(enrichedRooms);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!roomId || !user) return;

    const q = query(
      collection(db, `chat_rooms/${roomId}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setMessages(msgs);
      scrollToBottom();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `chat_rooms/${roomId}/messages`);
    });

    return () => unsubscribe();
  }, [roomId, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !roomId) return;

    const text = inputText;
    setInputText('');

    try {
      await addDoc(collection(db, `chat_rooms/${roomId}/messages`), {
        senderId: user.uid,
        text,
        timestamp: serverTimestamp()
      });

      await updateDoc(doc(db, 'chat_rooms', roomId), {
        lastMessage: text,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `chat_rooms/${roomId}/messages`);
    }
  };

  const activeRoom = rooms.find(r => r.id === roomId);

  return (
    <div className="max-w-7xl mx-auto px-6 h-[80vh] flex gap-8">
      {/* Rooms Sidebar */}
      <div className={cn(
        "w-full md:w-80 flex-col bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm",
        roomId ? "hidden md:flex" : "flex"
      )}>
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
           <h2 className="text-xl font-bold">Chats</h2>
           <MessageSquare size={20} className="text-indigo-600" />
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {rooms.map(room => (
            <Link 
              key={room.id} 
              to={`/chat/${room.id}`}
              className={cn(
                "flex gap-4 p-4 rounded-2xl transition-all border border-transparent",
                roomId === room.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "hover:bg-gray-50 text-gray-900"
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border-2 border-white shadow-sm">
                <img 
                  src={room.otherPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${room.id}`} 
                  className="w-full h-full object-cover" 
                  alt=""
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-start">
                    <h3 className="font-bold truncate">{room.otherName}</h3>
                 </div>
                 <p className={cn(
                   "text-xs truncate transition-colors",
                   roomId === room.id ? "text-indigo-100" : "text-gray-400"
                 )}>
                   {room.lastMessage || 'Start a conversation'}
                 </p>
              </div>
            </Link>
          ))}
          {rooms.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-400 px-4">
              <p className="text-sm italic">No active conversations yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className={cn(
        "flex-1 flex flex-col bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm",
        !roomId ? "hidden md:flex justify-center items-center text-gray-300" : "flex"
      )}>
        {roomId ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-gray-50 flex items-center gap-4 bg-white z-10">
              <Link to="/chat" className="md:hidden p-2 hover:bg-gray-50 rounded-xl text-gray-400">
                 <ArrowLeft size={20} />
              </Link>
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-indigo-50 border border-indigo-100">
                <img src={activeRoom?.otherPhoto} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{activeRoom?.otherName}</h2>
                <span className="text-xs text-green-500 font-bold uppercase tracking-wider">Online</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
              {messages.map((msg, i) => {
                const isMine = msg.senderId === user?.uid;
                const prevMsg = messages[i-1];
                const showTime = !prevMsg || (msg.timestamp?.seconds - prevMsg.timestamp?.seconds > 300);

                return (
                  <div key={msg.id} className="space-y-1">
                    {showTime && msg.timestamp && (
                       <div className="text-center py-4">
                          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-gray-50">
                            {format(msg.timestamp.toDate(), 'p')}
                          </span>
                       </div>
                    )}
                    <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[70%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed",
                        isMine 
                          ? "bg-indigo-600 text-white rounded-tr-none" 
                          : "bg-white text-gray-900 rounded-tl-none border border-gray-50"
                      )}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 bg-white border-t border-gray-50">
               <form onSubmit={handleSendMessage} className="flex gap-4">
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-gray-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                  />
                  <button 
                    type="submit"
                    disabled={!inputText.trim()}
                    className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={24} />
                  </button>
               </form>
            </div>
          </>
        ) : (
          <div className="text-center space-y-4">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
                <MessageSquare size={40} />
             </div>
             <p className="font-bold text-gray-400">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
