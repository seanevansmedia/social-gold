"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { compressImage } from "@/lib/imageUtils";

export default function ProfileSetup() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState(""); 
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    
    // NEW: If user has a Google photo, set it as default!
    if (user?.photoURL && !base64Image) {
        setBase64Image(user.photoURL);
    }
  }, [user, loading, router]); // Added base64Image dependency implicitly via logic

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 400, 0.6);
        setBase64Image(compressed);
      } catch (err) {
        setError("Image processing failed.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setError("");

    try {
      if (username.length < 3) throw new Error("Username must be at least 3 characters.");

      let formattedWebsite = website.trim();
      if (formattedWebsite && !formattedWebsite.startsWith('http')) {
        formattedWebsite = `https://${formattedWebsite}`;
      }

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        username: username.toLowerCase().trim(),
        displayName: username.trim(),
        bio: bio.trim(),
        website: formattedWebsite,
        // Use the base64Image (which might be the Google URL now)
        photoURL: base64Image || "",
        createdAt: new Date().toISOString(),
        setupComplete: true,
        followers: [],
        following: []
      });

      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="relative flex flex-col items-center px-4 pt-10 md:pt-24">
      <div className="relative z-10 w-full max-w-md rounded-[2.5rem] bg-secondary/80 backdrop-blur-2xl p-8 md:p-14 shadow-2xl border border-white/10 animate-in zoom-in duration-500">
        <h1 className="mb-2 text-center text-4xl font-bold tracking-tight text-primary font-lexend uppercase">
          Profile Setup
        </h1>
        <p className="mb-10 text-center text-sm font-medium text-foreground/50 uppercase tracking-widest">
          Establish your gold identity
        </p>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/50 p-4 text-center text-sm font-black text-red-500 uppercase">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 font-jakarta">
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-28 w-28 overflow-hidden rounded-full bg-background ring-2 ring-primary ring-offset-4 ring-offset-secondary shadow-2xl">
              {base64Image ? (
                <img src={base64Image} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl opacity-20">👤</div>
              )}
            </div>
            <label className="cursor-pointer text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-6 py-2 rounded-full border border-primary/20">
              {base64Image ? "Change Photo" : "Upload Photo"}
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>
          </div>

          <div className="space-y-2">
            <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-primary">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
              placeholder="gold_member"
              className="w-full rounded-2xl border-none bg-background/50 p-4 text-base focus:ring-2 focus:ring-primary text-foreground transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-primary">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Something gold about you..."
              rows={2}
              className="w-full rounded-2xl border-none bg-background/50 p-4 text-base focus:ring-2 focus:ring-primary text-foreground transition-all resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-primary">Website / Social Link</label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="e.g. instagram.com/yours"
              className="w-full rounded-2xl border-none bg-background/50 p-4 text-base focus:ring-2 focus:ring-primary text-foreground transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{ background: "linear-gradient(to right, var(--gradient-from), var(--gradient-to))" }}
            className={`w-full rounded-2xl py-5 text-sm font-black text-primary-foreground shadow-lg transition-all active:scale-95 uppercase tracking-widest ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:brightness-110"
            }`}
          >
            {isSubmitting ? "Saving..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}