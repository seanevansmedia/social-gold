"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function SuggestedUsers() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const q = query(
          collection(db, "users"),
          orderBy("createdAt", "desc"),
          limit(8)
        );
        const snapshot = await getDocs(q);
        const users = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(u => u.id !== user?.uid) // Don't suggest yourself
          .slice(0, 5); // Show top 5
          
        setSuggestions(users);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, [user]);

  if (loading || suggestions.length === 0) return null;

  return (
    <div className="mb-12">
      <h3 className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30 mb-6 px-6">New Gold Members</h3>
      <div className="flex gap-4 overflow-x-auto pb-4 px-2 no-scrollbar">
        {suggestions.map((u) => (
          <Link 
            key={u.id} 
            href={`/profile/${u.username}`}
            className="flex flex-col items-center shrink-0 w-32 p-6 rounded-[2rem] bg-secondary border border-white/5 shadow-xl transition-all hover:scale-105 active:scale-95 group"
          >
            <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-primary/20 mb-3 group-hover:border-primary/50 transition-all">
              {u.photoURL ? (
                <img src={u.photoURL} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-background opacity-20">👤</div>
              )}
            </div>
            <p className="text-xs font-bold text-primary truncate w-full text-center">@{u.username}</p>
            <span className="text-[8px] font-black uppercase tracking-widest opacity-30 mt-1">View</span>
          </Link>
        ))}
      </div>
    </div>
  );
}