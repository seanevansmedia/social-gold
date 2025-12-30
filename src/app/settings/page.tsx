"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { compressImage } from "@/lib/imageUtils";
import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      getDoc(doc(db, "users", user.uid)).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setUsername(data.username || "");
          setDisplayName(data.displayName || "");
          setBio(data.bio || "");
          setWebsite(data.website || "");
          setPhotoURL(data.photoURL || "");
        }
      });
    }
  }, [user, authLoading, router]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 400, 0.6);
        setPhotoURL(compressed);
      } catch (err) {
        setMessage("Image failed to process.");
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setMessage("");

    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: displayName.trim(),
        bio: bio.trim(),
        website: website.trim(),
        photoURL: photoURL,
      });
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background text-foreground font-jakarta pb-20">
      <nav className="sticky top-0 z-40 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/feed" className="text-primary text-3xl hover:scale-110 transition-transform">←</Link>
            <h1 className="text-2xl font-black font-lexend uppercase tracking-tighter">Settings</h1>
          </div>
          <div className="flex items-center gap-6">
            <NotificationBell />
            {username && (
              <Link 
                href={`/profile/${username}`}
                className="text-[10px] font-black uppercase tracking-widest text-primary border-2 border-primary/20 px-4 py-2 rounded-xl hover:bg-primary/10 transition-all"
              >
                My Profile
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-xl px-6 pt-10">
        <form onSubmit={handleSave} className="space-y-8">
          <div className="flex flex-col items-center gap-6 p-8 rounded-[2.5rem] bg-secondary border border-white/10 shadow-2xl">
            <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-primary shadow-lg">
              {photoURL ? (
                <img src={photoURL} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-background text-4xl">👤</div>
              )}
            </div>
            <label className="cursor-pointer text-[10px] font-black text-primary-foreground uppercase tracking-widest bg-primary px-8 py-3 rounded-2xl hover:brightness-110 transition-all shadow-lg">
              Change Photo
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-2">Display Name</label>
              <input 
                type="text" 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-secondary border-2 border-white/5 rounded-[1.5rem] p-5 focus:border-primary focus:ring-0 transition-all text-lg font-medium text-foreground"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-2">Bio</label>
              <textarea 
                value={bio} 
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full bg-secondary border-2 border-white/5 rounded-[1.5rem] p-5 focus:border-primary focus:ring-0 transition-all text-lg font-medium text-foreground resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-2">Website</label>
              <input 
                type="url" 
                value={website} 
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://"
                className="w-full bg-secondary border-2 border-white/5 rounded-[1.5rem] p-5 focus:border-primary focus:ring-0 transition-all text-lg font-medium text-foreground"
              />
            </div>
          </div>

          {message && (
            <p className="text-center font-bold text-primary animate-pulse text-sm uppercase tracking-widest">{message}</p>
          )}

          <button 
            type="submit" 
            disabled={isSaving}
            style={{ background: "linear-gradient(to right, var(--gradient-from), var(--gradient-to))" }}
            className="w-full rounded-[1.5rem] py-6 text-base font-black text-primary-foreground uppercase tracking-[0.2em] shadow-xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </main>
    </div>
  );
}