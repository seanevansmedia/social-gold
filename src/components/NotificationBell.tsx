"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, limit, doc, writeBatch } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, "notifications"),
      where("toUid", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      },
      (error) => {
        // Silence permission errors that occur during logout
        if (error.code === "permission-denied") {
          console.log("Notification listener stopped due to logout.");
        } else {
          console.error("Notification listener error:", error);
        }
      }
    );

    return () => unsubscribe();
  }, [user]);

  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;
    const batch = writeBatch(db);
    notifications.forEach(n => {
      if (!n.read) {
        batch.update(doc(db, "notifications", n.id), { read: true });
      }
    });
    await batch.commit();
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) markAllRead();
  };

  return (
    <div className="relative">
      <button onClick={toggleOpen} className="relative text-3xl p-1 hover:scale-110 transition-transform">
        🔔
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 bg-primary text-[10px] font-black flex items-center justify-center rounded-full text-primary-foreground border-2 border-background">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-80 max-h-[450px] overflow-y-auto bg-secondary border border-white/10 rounded-[2rem] shadow-2xl z-[100] animate-in zoom-in duration-200">
          <div className="p-6 border-b border-white/5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Notifications</h3>
          </div>
          
          <div className="divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="p-10 text-center opacity-20 text-xs uppercase tracking-widest">No activity yet</div>
            ) : (
              notifications.map((n) => (
                <Link 
                  key={n.id} 
                  href={n.postId ? `/post/${n.postId}` : `/profile/${n.fromUsername}`}
                  onClick={() => setIsOpen(false)}
                  className={`block p-5 hover:bg-white/5 transition-all ${!n.read ? 'border-l-4 border-primary' : ''}`}
                >
                  <p className="text-sm font-medium opacity-90">
                    <span className="font-bold text-primary">@{n.fromUsername}</span>
                    {n.type === "like" && " starred your gold post"}
                    {n.type === "comment" && " replied to your post"}
                    {n.type === "follow" && " started following you"}
                  </p>
                  <p className="text-[10px] opacity-30 mt-1 uppercase font-bold">
                    {n.createdAt?.toDate ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(n.createdAt.toDate()) : "Just now"}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}