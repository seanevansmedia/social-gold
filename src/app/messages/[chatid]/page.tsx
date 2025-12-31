"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, 
  doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove 
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
        if (!otherUid) { router.push('/messages'); return; }

        const chatRef = doc(db, "chats", chatid);
        await updateDoc(chatRef, { unreadBy: arrayRemove(user.uid) }).catch(() => {});

        const userSnap = await getDoc(doc(db, "users", otherUid));
        if (userSnap.exists()) setOtherUser(userSnap.data());

        const chatSnap = await getDoc(chatRef);
        if (!chatSnap.exists()) {
          await setDoc(chatRef, { participants: uids, lastUpdate: serverTimestamp(), lastMessage: "", unreadBy: [] });
        }

        const q = query(collection(db, "chats", chatid, "messages"), orderBy("createdAt", "asc"));
        unsubscribe = onSnapshot(q, (snapshot) => {
          setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any)));
          setLoading(false); 
          setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        }, (err) => { setLoading(false); });

      } catch (err) { setLoading(false); }
    };

    initVault();
    return () => unsubscribe && unsubscribe();
  }, [user, authLoading, chatid, router]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !chatid || !otherUser) return;

    const msgText = newMessage.trim();
    setNewMessage(""); 

    try {
      const chatRef = doc(db, "chats", chatid);
      const otherUid = chatid.split("_").find(id => id !== user.uid);

      await addDoc(collection(db, "chats", chatid, "messages"), {
        text: msgText, senderUid: user.uid, createdAt: serverTimestamp()
      });
      
      await updateDoc(chatRef, {
        lastMessage: msgText,
        lastUpdate: serverTimestamp(),
        unreadBy: arrayUnion(otherUid)
      });
    } catch (err) { console.error(err); }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-primary animate-pulse">
        <span className="text-4xl mb-4 animate-bounce">🛡️</span>
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Opening Vault...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-transparent text-foreground font-jakarta overflow-hidden">
      <nav className="border-b border-white/10 bg-background/80 backdrop-blur-xl px-6 py-4 md:p-6 shrink-0 z-10">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <button onClick={() => router.push('/messages')} className="text-primary text-2xl md:text-3xl hover:scale-110 transition-transform">←</button>
            {otherUser && (
                <Link href={`/profile/${otherUser.username}`} className="flex items-center gap-3 md:gap-4 group min-w-0">
                    <img src={otherUser.photoURL || "/default-avatar.png"} className="h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-full border-2 border-primary object-cover" alt="" />
                    <div className="min-w-0">
                      <p className="font-bold text-primary font-lexend uppercase tracking-tight group-hover:underline text-sm md:text-base truncate">{otherUser.displayName}</p>
                      <p className="text-[8px] md:text-[10px] font-bold opacity-40 uppercase tracking-widest truncate">@{otherUser.username}</p>
                    </div>
                </Link>
            )}
          </div>
          <span className="text-[8px] md:text-[10px] font-black text-primary uppercase tracking-widest">Secure</span>
        </div>
      </nav>

      {/* FIXED: Removed scrollbar-hide and added gold-scrollbar */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 gold-scrollbar bg-[#050502]/50">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          <div className="text-center py-10 opacity-40 uppercase tracking-[0.5em] text-[8px] font-black text-primary">Vault established</div>
          {messages.map((msg) => {
            const isMe = msg.senderUid === user?.uid;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-1`}>
                <div className={`max-w-[85%] p-4 rounded-2xl md:rounded-[1.5rem] shadow-2xl text-base font-semibold ${isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-secondary border border-white/10 text-foreground rounded-tl-none"}`}>
                  {msg.text}
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} className="h-4" />
        </div>
      </main>

      <div className="p-4 md:p-6 border-t border-white/10 bg-secondary/80 backdrop-blur-xl pb-10 shrink-0">
        <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto flex items-center gap-3">
          <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Write a message..." className="h-14 flex-1 bg-background border-2 border-primary/20 rounded-2xl px-6 focus:border-primary focus:outline-none focus:ring-0 text-foreground placeholder:text-foreground/40 text-lg font-medium" />
          <button type="submit" disabled={!newMessage.trim()} style={{ background: "linear-gradient(to right, var(--gradient-from), var(--gradient-to))" }} className="h-14 px-6 md:px-8 shrink-0 rounded-2xl flex items-center justify-center hover:brightness-125 transition-all shadow-lg border-2 border-white/10">
            <span className="text-xs md:text-sm font-black uppercase tracking-widest text-primary-foreground">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}