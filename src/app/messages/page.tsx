"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, deleteDoc } from "firebase/firestore";
import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";

export default function MessagesInbox() {
  const { user, loading: authLoading } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ isOpen: boolean; title: string; message: string; chatId: string | null; }>({ isOpen: false, title: "", message: "", chatId: null });

  const closeAlert = () => setAlert({ ...alert, isOpen: false, chatId: null });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "chats"), where("participants", "array-contains", user.uid), orderBy("lastUpdate", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const chatPromises = snapshot.docs.map(async (chatDoc) => {
          const data = chatDoc.data() as any;
          const otherUid = data.participants?.find((id: string) => id !== user.uid);
          if (!otherUid) return null;
          const otherUserSnap = await getDoc(doc(db, "users", otherUid));
          const otherUser = otherUserSnap.exists() ? otherUserSnap.data() : { displayName: "Gold Member", username: "unknown", photoURL: "" };
          return { id: chatDoc.id, ...data, otherUser };
        });
        const results = await Promise.all(chatPromises);
        setChats(results.filter(c => c !== null));
        setLoading(false);
      } catch (err) { setLoading(false); }
    }, (err) => { setLoading(false); });
    return () => unsubscribe();
  }, [user]);

  const handleDeleteChat = async () => {
    if (!alert.chatId) return;
    try { await deleteDoc(doc(db, "chats", alert.chatId)); closeAlert(); } 
    catch (err) { console.error(err); }
  };

  if (authLoading) return null;

  return (
    <div className="text-foreground font-jakarta">
      {alert.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2.5rem] bg-secondary p-8 shadow-2xl border border-white/10 text-center animate-in zoom-in duration-300">
            <h2 className="text-2xl font-bold font-lexend text-primary mb-2 uppercase">{alert.title}</h2>
            <p className="text-sm opacity-60 mb-8">{alert.message}</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleDeleteChat} style={{ background: "linear-gradient(to right, var(--gradient-from), var(--gradient-to))" }} className="w-full rounded-2xl py-4 font-black text-primary-foreground uppercase tracking-widest text-xs">Confirm Delete</button>
              <button onClick={closeAlert} className="w-full rounded-2xl py-4 font-bold text-foreground/40 uppercase tracking-widest text-xs">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <nav className="sticky top-0 z-40 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4 md:py-6">
          <div className="flex items-center gap-3 md:gap-4">
            <Link href="/feed" className="text-primary text-2xl md:text-3xl p-1 md:p-2 hover:scale-110 transition-transform">←</Link>
            <h1 className="text-xl md:text-2xl font-black font-lexend uppercase tracking-tighter">Inbox</h1>
          </div>
          <NotificationBell />
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 py-6 md:py-8">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center text-primary animate-pulse">
            <span className="text-4xl mb-4">✉️</span>
            <p className="text-[10px] font-black uppercase tracking-[0.5em]">Syncing Vault...</p>
          </div>
        ) : (
          <>
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-6 md:mb-8 px-2 md:px-4">Conversations</h2>
            <div className="space-y-3 md:space-y-4">
              {chats.length === 0 ? (
                <div className="text-center py-10 px-6 rounded-[2rem] bg-secondary border border-white/10"><p className="text-primary font-bold italic text-sm">Your vault is empty.</p></div>
              ) : (
                chats.map((chat) => {
                  const isUnread = chat.unreadBy?.includes(user?.uid);
                  return (
                    <Link 
                      key={chat.id} 
                      href={`/messages/${chat.id}`}
                      className={`flex items-center gap-4 md:gap-5 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] bg-secondary/80 border ${isUnread ? 'border-primary shadow-[0_0_20px_rgba(202,138,4,0.2)]' : 'border-white/10'} backdrop-blur-md hover:bg-white/5 transition-all group relative`}
                    >
                      <div className="h-12 w-12 md:h-16 md:w-16 shrink-0 overflow-hidden rounded-full border-2 border-primary/20">
                         <img src={chat.otherUser.photoURL || "/default-avatar.png"} className="h-full w-full object-cover" alt="" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className={`text-base md:text-lg font-bold uppercase tracking-tight truncate pr-2 ${isUnread ? 'text-primary' : 'text-primary/60'}`}>{chat.otherUser.displayName}</p>
                          {isUnread && <span className="h-2 w-2 bg-primary rounded-full animate-pulse shadow-primary" />}
                        </div>
                        <p className={`text-xs md:text-sm truncate ${isUnread ? 'text-foreground font-black' : 'text-foreground/40 font-medium italic'}`}>
                          {chat.lastMessage || "Open vault..."}
                        </p>
                      </div>
                      <button onClick={(e) => { e.preventDefault(); setAlert({ isOpen: true, title: "Clear Vault", message: `Permanent delete chat with @${chat.otherUser.username}?`, chatId: chat.id }); }} className="text-primary hover:text-red-500 transition-all p-2 text-xl hover:scale-125">🗑️</button>
                    </Link>
                  );
                })
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}