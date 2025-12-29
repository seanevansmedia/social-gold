"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function ProfileSetup() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Safety: If user isn't logged in, send them back to login
  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // Image to Base64 Converter (Bypasses the need for Firebase Storage Billing)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) { // Limit to 800KB
        setError("Image is too large. Please pick a smaller photo.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64Image(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setError("");

    try {
      // Basic check
      if (username.length < 3) throw new Error("Username must be at least 3 characters.");

      // Save user profile to Firestore database
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        username: username.toLowerCase().trim(),
        displayName: username.trim(),
        bio: bio.trim(),
        photoURL: base64Image || "", // String stored in Firestore
        createdAt: new Date().toISOString(),
        setupComplete: true,
      });

      // Once saved, go to the main app
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-background" />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground font-jakarta transition-colors duration-500">
      <div className="w-full max-w-md rounded-[2.5rem] bg-secondary p-10 md:p-14 shadow-2xl border border-white/5">
        
        <h1 className="mb-2 text-center text-4xl font-bold tracking-tight text-primary font-lexend">
          Profile Setup
        </h1>
        <p className="mb-10 text-center text-sm font-medium opacity-50">
          Finish creating your gold identity
        </p>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/50 p-4 text-center text-sm font-bold text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Circular Image Picker */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-28 w-28 overflow-hidden rounded-full bg-background ring-2 ring-primary ring-offset-4 ring-offset-secondary shadow-2xl transition-all">
              {base64Image ? (
                <img src={base64Image} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl opacity-20">
                  👤
                </div>
              )}
            </div>
            <label className="cursor-pointer text-xs font-bold text-primary uppercase tracking-widest hover:opacity-70 transition-all bg-primary/5 px-4 py-2 rounded-full border border-primary/20">
              Upload Photo
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>
          </div>

          <div className="space-y-2">
            <label className="ml-1 block text-sm font-bold opacity-70">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
              placeholder="e.g. gold_member"
              className="w-full rounded-2xl border-none bg-background p-4 text-base shadow-inner ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="ml-1 block text-sm font-bold opacity-70">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A little bit about you..."
              rows={3}
              className="w-full rounded-2xl border-none bg-background p-4 text-base shadow-inner ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{ background: `linear-gradient(to right, var(--gradient-from), var(--gradient-to))` }}
            className={`w-full rounded-2xl py-4 text-base font-bold text-primary-foreground shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:brightness-110"
            }`}
          >
            {isSubmitting ? "Saving Profile..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}