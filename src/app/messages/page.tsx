"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";

export default function MessagesInbox() {
  const { user, loading: authLoading } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
      orderBy("lastUpdate", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const chatPromises = snapshot.docs.map(async (chatDoc) => {
          const data = chatDoc.data();
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

  if (authLoading) return null;

  return (
    <div className="text-foreground font-jakarta">
      <nav className="sticky top-0 z-40 w-full border-b border-white/10 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/feed" className="text-primary text-3xl p-2 hover:scale-110 transition-transform">←</Link>
            <h1 className="text-2xl font-black font-lexend uppercase tracking-tighter">Inbox</h1>
          </div>
          <NotificationBell />
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center text-primary animate-pulse">
            <span className="text-4xl mb-4">✉️</span>
            <p className="text-[10px] font-black uppercase tracking-[0.5em]">Syncing Vaults...</p>
          </div>
        ) : (
          <>
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-8 px-4">Conversations</h2>
            <div className="space-y-4">
              {chats.length === 0 ? (
                <div className="text-center py-10 px-10 rounded-[2.5rem] bg-secondary/40 backdrop-blur-md border border-white/10">
                  <p className="text-primary font-bold italic text-sm">Your vault is empty.</p>
                </div>
              ) : (
                chats.map((chat) => (
                  <Link 
                    key={chat.id} 
                    href={`/messages/${chat.id}`}
                    className="flex items-center gap-5 p-6 rounded-[2.5rem] bg-secondary/40 backdrop-blur-md border border-white/10 hover:border-primary/50 transition-all group active:scale-[0.98] shadow-xl"
                  >
                    <img src={chat.otherUser.photoURL || "/default-avatar.png"} className="h-16 w-16 rounded-full border-2 border-primary object-cover" alt="" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-lg font-bold text-primary font-lexend uppercase tracking-tight truncate">{chat.otherUser.displayName}</p>
                        <p className="text-[10px] font-bold text-foreground/40 whitespace-nowrap ml-2">
                          {chat.lastUpdate?.toDate ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(chat.lastUpdate.toDate()) : "New"}
                        </p>
                      </div>
                      <p className="text-sm text-foreground font-medium italic truncate">{chat.lastMessage || "Open vault..."}</p>
                    </div>
                    <div className="text-primary transition-all text-xl pr-2 group-hover:translate-x-1">→</div>
                  </Link>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}