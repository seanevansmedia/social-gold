"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  setDoc, 
  getDoc,
  updateDoc 
} from "firebase/firestore";
import Link from "next/link";

export default function ChatRoom() {
  const params = useParams();
  const chatid = params.chatid as string; 
  
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [otherUser, setOtherUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading || !chatid || !user) return;

    let unsubscribe: () => void;
    
    const initVault = async () => {
      try {
        const uids = chatid.split("_");
        const otherUid = uids.find(id => id !== user.uid);

        if (!otherUid) {
          router.push('/messages');
          return;
        }

        const userSnap = await getDoc(doc(db, "users", otherUid));
        if (userSnap.exists()) {
          setOtherUser(userSnap.data());
        }

        const chatRef = doc(db, "chats", chatid);
        const chatSnap = await getDoc(chatRef);
        
        if (!chatSnap.exists()) {
          await setDoc(chatRef, {
            participants: uids,
            lastUpdate: serverTimestamp(),
            lastMessage: ""
          });
        }

        const msgsRef = collection(db, "chats", chatid, "messages");
        const q = query(msgsRef, orderBy("createdAt", "asc"));

        unsubscribe = onSnapshot(q, (snapshot) => {
          const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          setMessages(msgs);
          setLoading(false); 
          setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        }, (err) => {
          console.error("Vault Listener Error:", err);
          setLoading(false);
        });

      } catch (err) {
        console.error("Vault Initialization Error:", err);
        setLoading(false);
      }
    };

    initVault();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, authLoading, chatid, router]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !chatid) return;

    const msgText = newMessage.trim();
    setNewMessage(""); 

    try {
      const chatRef = doc(db, "chats", chatid);
      await addDoc(collection(db, "chats", chatid, "messages"), {
        text: msgText,
        senderUid: user.uid,
        createdAt: serverTimestamp()
      });
      
      await updateDoc(chatRef, {
        lastMessage: msgText,
        lastUpdate: serverTimestamp()
      });

    } catch (err) {
      console.error("Message Error:", err);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-primary font-lexend">
        <span className="text-4xl mb-4 animate-bounce">🛡️</span>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Syncing Vault...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-jakarta overflow-hidden">
      <nav className="border-b border-white/10 bg-background/80 backdrop-blur-xl p-4 md:p-6 shrink-0 z-10">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <button onClick={() => router.push('/messages')} className="text-primary text-2xl md:text-3xl hover:scale-110 transition-transform">←</button>
            {otherUser && (
                <Link href={`/profile/${otherUser.username}`} className="flex items-center gap-3 md:gap-4 group min-w-0">
                    <img src={otherUser.photoURL || "/default-avatar.png"} className="h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-full border-2 border-primary object-cover shadow-lg" alt="" />
                    <div className="min-w-0">
                      <p className="font-bold text-primary font-lexend uppercase tracking-tight group-hover:underline decoration-2 truncate text-sm md:text-base">{otherUser.displayName}</p>
                      <p className="text-[8px] md:text-[10px] font-bold opacity-30 uppercase tracking-widest truncate">@{otherUser.username}</p>
                    </div>
                </Link>
            )}
          </div>
          <span className="text-[8px] md:text-[10px] font-black text-primary uppercase tracking-widest hidden xs:block">Secure</span>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 scrollbar-hide bg-[#050502]">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          <div className="text-center py-6 md:py-10 opacity-40 uppercase tracking-[0.5em] text-[8px] font-black text-primary">
             Vault established
          </div>

          {messages.map((msg) => {
            const isMe = msg.senderUid === user?.uid;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-1`}>
                <div className={`max-w-[85%] md:max-w-[75%] p-3 md:p-4 rounded-2xl md:rounded-[1.5rem] shadow-2xl text-sm md:text-base font-semibold leading-relaxed break-words ${
                  isMe ? "bg-primary text-primary-foreground rounded-tr-none shadow-primary/20" : "bg-secondary border border-white/10 text-foreground rounded-tl-none"
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })}
          
          {messages.length === 0 && (
            <div className="text-center py-10 md:py-20 text-primary font-bold text-xs md:text-sm uppercase tracking-widest">
              Send the first gold bar...
            </div>
          )}

          <div ref={scrollRef} className="h-4" />
        </div>
      </main>

      <div className="p-4 md:p-6 border-t border-white/10 bg-secondary pb-8 md:pb-10 shrink-0">
        <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto flex gap-2 md:gap-3">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write a message..."
            className="flex-1 bg-background border-2 border-primary/20 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 focus:border-primary focus:ring-0 transition-all text-foreground placeholder:text-foreground/50 shadow-inner text-sm md:text-lg font-medium"
          />
          <button 
            type="submit" 
            style={{ background: "linear-gradient(to right, var(--gradient-from), var(--gradient-to))" }}
            className="h-12 w-12 md:h-14 md:w-14 shrink-0 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-2xl hover:brightness-125 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/40 border border-white/10"
          >
            <span className="drop-shadow-md">🏹</span>
          </button>
        </form>
      </div>
    </div>
  );
}