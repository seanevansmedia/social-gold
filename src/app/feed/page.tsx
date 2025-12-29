"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove 
} from "firebase/firestore";
import Link from "next/link";

export default function FeedPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [userData, setUserData] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  // 1. Route Protection & Fetch User Profile
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      const fetchUser = async () => {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      };
      fetchUser();
    }
  }, [user, authLoading, router]);

  // 2. Real-time Post Listener
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, []);

  // 3. Create Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !userData) return;

    setIsPosting(true);
    try {
      await addDoc(collection(db, "posts"), {
        content: newPost,
        uid: user?.uid,
        username: userData.username,
        displayName: userData.displayName,
        photoURL: userData.photoURL || "",
        createdAt: serverTimestamp(),
        likes: [] // Initialize empty likes array
      });
      setNewPost("");
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsPosting(false);
    }
  };

  // 4. Like / Unlike Logic
  const handleLike = async (postId: string, postLikes: string[]) => {
    if (!user) return;
    const postRef = doc(db, "posts", postId);
    const hasLiked = postLikes.includes(user.uid);

    try {
      if (hasLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid)
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background text-foreground font-jakarta pb-20">
      
      {/* Premium Sticky Nav */}
      <nav className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-2xl font-black tracking-tighter font-lexend text-primary">
            GOLD
          </Link>
          <div className="flex items-center gap-4">
            {userData?.photoURL && (
              <div className="h-8 w-8 overflow-hidden rounded-full border border-primary/50">
                <img src={userData.photoURL} alt="Me" className="h-full w-full object-cover" />
              </div>
            )}
            <button 
              onClick={() => logout()}
              className="text-[10px] font-bold uppercase tracking-widest text-primary hover:opacity-70 transition-all px-2 py-1"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 pt-8">
        
        {/* Create Post Area */}
        <div className="mb-12 rounded-[2.5rem] bg-secondary p-8 shadow-2xl border border-white/5">
          <div className="flex gap-5">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-background border border-primary/20 shadow-inner">
              {userData?.photoURL ? (
                <img src={userData.photoURL} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center opacity-20 text-xl">👤</div>
              )}
            </div>
            <form onSubmit={handleCreatePost} className="w-full">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="What is happening in your world?"
                className="w-full resize-none border-none bg-transparent p-2 text-lg focus:outline-none focus:ring-0 placeholder:opacity-30"
                rows={3}
              />
              <div className="mt-4 flex justify-end border-t border-white/5 pt-5">
                <button
                  type="submit"
                  disabled={isPosting || !newPost.trim()}
                  style={{ 
                    background: "linear-gradient(to right, var(--gradient-from), var(--gradient-to))",
                    boxShadow: !newPost.trim() ? "none" : "0 0 20px rgba(202, 138, 4, 0.4)"
                  }}
                  className={`rounded-2xl px-10 py-3 text-sm font-bold text-primary-foreground transition-all duration-300 transform active:scale-95 ${
                    !newPost.trim() 
                      ? "opacity-30 grayscale cursor-not-allowed" 
                      : "hover:scale-105 hover:brightness-110 hover:shadow-[0_0_30px_rgba(202,138,4,0.6)]"
                  }`}
                >
                  {isPosting ? "Posting..." : "Share Gold"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Post Feed */}
        <div className="space-y-8">
          {posts.map((post) => {
            const hasLiked = user && post.likes?.includes(user.uid);
            
            return (
              <div 
                key={post.id} 
                className="rounded-[2.5rem] bg-secondary p-8 shadow-lg border border-white/5 animate-in fade-in slide-in-from-bottom-6 duration-700"
              >
                <div className="flex items-start gap-5">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-primary/30 shadow-md">
                    {post.photoURL ? (
                      <img src={post.photoURL} alt={post.username} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-background text-sm">👤</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary font-lexend text-lg leading-none">
                          {post.displayName}
                        </span>
                        <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">
                          @{post.username}
                        </span>
                      </div>
                    </div>
                    
                    <p className="mt-4 text-base leading-relaxed opacity-90 whitespace-pre-wrap font-medium">
                      {post.content}
                    </p>
                    
                    {/* Interactive Actions */}
                    <div className="mt-8 flex items-center gap-8 border-t border-white/5 pt-5">
                      <button 
                        onClick={() => handleLike(post.id, post.likes || [])}
                        className={`flex items-center gap-2 text-xs font-bold transition-all duration-300 ${
                          hasLiked 
                            ? "text-primary scale-110" 
                            : "opacity-40 hover:opacity-100 hover:text-primary"
                        }`}
                      >
                        <span className="text-lg">{hasLiked ? "✨" : "⭐"}</span>
                        <span>{post.likes?.length || 0}</span>
                      </button>

                      <button className="flex items-center gap-2 text-xs font-bold opacity-40 hover:opacity-100 hover:text-primary transition-all">
                        <span className="text-lg">💬</span>
                        <span>0</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {posts.length === 0 && (
            <div className="py-24 text-center">
              <p className="font-lexend text-xl uppercase tracking-widest opacity-20">The vault is empty</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}