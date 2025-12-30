"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  serverTimestamp, 
  doc, 
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  where,
  limit,
  startAfter,
  getDocs,
  onSnapshot,
  DocumentData,
  QueryDocumentSnapshot
} from "firebase/firestore";
import Link from "next/link";
import { compressImage } from "@/lib/imageUtils";
import { createNotification } from "@/lib/notificationUtils";
import NotificationBell from "@/components/NotificationBell";
import PostSkeleton from "@/components/PostSkeleton";
import confetti from "canvas-confetti";

export default function FeedPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const [userData, setUserData] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [postImage, setPostImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [feedType, setFeedType] = useState<"global" | "following">("global");

  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchPosts(true);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoadingMore, hasMore]);

  const [alert, setAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: (() => void) | null;
  }>({ isOpen: false, title: "", message: "", onConfirm: null });

  const showCustomAlert = (title: string, message: string, onConfirm?: () => void) => {
    setAlert({ isOpen: true, title, message, onConfirm: onConfirm || null });
  };
  const closeAlert = () => setAlert({ ...alert, isOpen: false });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      const userRef = doc(db, "users", user.uid);
      const unsubscribe = onSnapshot(userRef, 
        (docSnap) => {
          if (docSnap.exists()) setUserData(docSnap.data());
        },
        (error) => {
          if (error.code !== "permission-denied") console.error(error);
        }
      );
      return () => unsubscribe();
    }
  }, [user, authLoading, router]);

  const fetchPosts = async (isLoadMore = false) => {
    if (!isLoadMore) setIsLoadingInitial(true);
    else if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const baseQuery = collection(db, "posts");
      const constraints: any[] = [orderBy("createdAt", "desc"), limit(10)];
      if (feedType === "following") {
        const followingList = userData?.following || [];
        if (followingList.length === 0) {
          setPosts([]); setHasMore(false); setIsLoadingInitial(false); setIsLoadingMore(false); return;
        }
        constraints.unshift(where("uid", "in", followingList));
      }
      if (isLoadMore && lastDoc) constraints.push(startAfter(lastDoc));
      const q = query(baseQuery, ...constraints);
      const snapshot = await getDocs(q);
      const newPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (isLoadMore) setPosts(prev => [...prev, ...newPosts]);
      else setPosts(newPosts);
      
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === 10);
    } catch (error) { 
        console.error(error); 
    } finally { 
        setIsLoadingInitial(false);
        setIsLoadingMore(false); 
    }
  };

  useEffect(() => {
    if (userData || feedType === "global") {
        setLastDoc(null); setHasMore(true); fetchPosts(false);
    }
  }, [feedType, userData?.following]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 1000, 0.7);
        setPostImage(compressed);
      } catch (error) { showCustomAlert("Error", "Could not process image."); }
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newPost.trim() && !postImage) || !userData) return;
    setIsPosting(true);
    try {
      const docRef = await addDoc(collection(db, "posts"), {
        content: newPost, postImage: postImage || null, uid: user?.uid,
        username: userData.username, displayName: userData.displayName,
        photoURL: userData.photoURL || "", createdAt: serverTimestamp(), likes: [] 
      });
      const freshPost = {
        id: docRef.id, content: newPost, postImage: postImage || null, uid: user?.uid,
        username: userData.username, displayName: userData.displayName,
        photoURL: userData.photoURL || "", createdAt: new Date(), likes: []
      };
      setPosts(prev => [freshPost, ...prev]);
      setNewPost(""); setPostImage(null);
    } catch (error) { showCustomAlert("Error", "Could not share gold."); }
    finally { setIsPosting(false); }
  };

  const handleLike = async (post: any) => {
    if (!user || !userData) return;
    const postRef = doc(db, "posts", post.id);
    const hasLiked = post.likes?.includes(user.uid);
    
    if (!hasLiked) {
      confetti({
        particleCount: 40, spread: 70, origin: { y: 0.8 },
        colors: ["#ca8a04", "#fde047", "#ffffff"]
      });
    }

    setPosts(prev => prev.map(p => {
        if (p.id === post.id) {
            return { ...p, likes: hasLiked ? p.likes.filter((id: string) => id !== user.uid) : [...(p.likes || []), user.uid] };
        }
        return p;
    }));

    try {
      if (hasLiked) {
        await updateDoc(postRef, { likes: arrayRemove(user.uid) });
      } else {
        await updateDoc(postRef, { likes: arrayUnion(user.uid) });
        await createNotification(post.uid, { uid: user.uid, username: userData.username, displayName: userData.displayName }, "like", post.id);
      }
    } catch (error) { console.error(error); }
  };

  const handleDeletePost = (postId: string) => {
    showCustomAlert("Confirm Delete", "Remove this post?", async () => {
      try { await deleteDoc(doc(db, "posts", postId)); setPosts(prev => prev.filter(p => p.id !== postId)); }
      catch (error) { showCustomAlert("Error", "Failed to delete."); }
    });
  };

  if (authLoading) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background text-foreground font-jakarta pb-20">
      {alert.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm animate-in fade-in duration-300 text-foreground">
          <div className="w-full max-w-sm rounded-[2.5rem] bg-secondary p-8 shadow-2xl border border-white/10 text-center animate-in zoom-in duration-300">
            <h2 className="text-2xl font-bold font-lexend text-primary mb-2 uppercase tracking-tight">{alert.title}</h2>
            <p className="text-sm opacity-60 mb-8 leading-relaxed font-medium">{alert.message}</p>
            <div className="flex flex-col gap-3">
              {alert.onConfirm ? (
                <><button onClick={() => { alert.onConfirm?.(); closeAlert(); }} style={{ background: "linear-gradient(to right, var(--gradient-from), var(--gradient-to))" }} className="w-full rounded-2xl py-4 font-black text-primary-foreground shadow-lg hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest text-xs">Confirm</button><button onClick={closeAlert} className="w-full rounded-2xl py-4 font-bold opacity-40 hover:opacity-100 hover:bg-white/5 transition-all uppercase tracking-widest text-xs">Cancel</button></>
              ) : (
                <button onClick={closeAlert} style={{ background: "linear-gradient(to right, var(--gradient-from), var(--gradient-to))" }} className="w-full rounded-2xl py-4 font-black text-primary-foreground shadow-lg hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest text-xs">Okay</button>
              )}
            </div>
          </div>
        </div>
      )}

      <nav className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-6">
          <Link href="/" className="text-3xl md:text-4xl font-black tracking-tighter font-lexend uppercase flex items-center gap-2"><span className="text-foreground">Social</span><span className="text-primary">Gold</span></Link>
          <div className="flex items-center gap-6">
            <Link href="/search" className="text-3xl hover:scale-110 transition-transform p-1">🔍</Link>
            <NotificationBell />
            {userData?.photoURL && (
              <Link href={`/profile/${userData.username}`} className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary/50 shadow-lg hover:scale-105 transition-transform"><img src={userData.photoURL} alt="Me" className="h-full w-full object-cover" /></Link>
            )}
            <button onClick={() => logout()} className="text-sm md:text-base font-bold uppercase tracking-widest text-primary hover:opacity-70 transition-all border-2 border-primary/20 px-5 py-2.5 rounded-2xl bg-primary/5 shadow-md">Logout</button>
          </div>
        </div>

        <div className="mx-auto flex max-w-2xl px-6 border-t border-white/5">
           <button onClick={() => setFeedType("global")} className={`flex-1 py-5 text-sm md:text-base font-medium uppercase tracking-[0.3em] transition-all border-b-2 ${feedType === "global" ? "border-primary text-primary" : "border-transparent opacity-30"}`}>Global Feed</button>
           <button onClick={() => setFeedType("following")} className={`flex-1 py-5 text-sm md:text-base font-medium uppercase tracking-[0.3em] transition-all border-b-2 ${feedType === "following" ? "border-primary text-primary" : "border-transparent opacity-30"}`}>Following</button>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 pt-10">
        <div className="mb-12 rounded-[2.5rem] bg-secondary p-8 shadow-2xl border border-white/5">
          <div className="flex gap-5 mb-4">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-background border border-primary/20 shadow-inner">
              {userData?.photoURL ? (<img src={userData.photoURL} alt="Avatar" className="h-full w-full object-cover" />) : (<div className="flex h-full w-full items-center justify-center opacity-20 text-xl">👤</div>)}
            </div>
            <form onSubmit={handleCreatePost} className="w-full">
              <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder="What is happening in your world?" className="w-full resize-none border-none bg-transparent p-2 text-xl focus:outline-none focus:ring-0 placeholder:opacity-30 text-foreground" rows={3} />
              {postImage && (
                <div className="relative mt-4 mb-4 rounded-3xl overflow-hidden border-2 border-primary/20 animate-in zoom-in duration-300"><img src={postImage} alt="Preview" className="w-full max-h-80 object-cover" /><button onClick={() => setPostImage(null)} className="absolute top-4 right-4 bg-black/50 text-white h-10 w-10 rounded-full backdrop-blur-md font-bold hover:bg-black transition-all">✕</button></div>
              )}
            </form>
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-6">
            <label className="cursor-pointer flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all active:scale-95 border border-white/5">
              <span className="text-2xl leading-none">📷</span>
              <span className="text-sm font-black uppercase tracking-widest opacity-70">Photo</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>

            <button type="submit" onClick={handleCreatePost} disabled={isPosting} style={{ background: "linear-gradient(to right, var(--gradient-from), var(--gradient-to))", boxShadow: "0 0 30px rgba(202, 138, 4, 0.6)" }} className={`rounded-2xl px-12 py-4 text-base font-black text-primary-foreground transition-all duration-300 transform active:scale-95 hover:scale-105 hover:brightness-110 ${isPosting ? "opacity-70 cursor-not-allowed" : "opacity-100"}`}>
              {isPosting ? "POSTING..." : "SHARE GOLD"}
            </button>
          </div>
        </div>

        <div className="space-y-10">
          {isLoadingInitial ? (
            <>
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </>
          ) : (
            posts.map((post, index) => {
              const hasLiked = user && post.likes?.includes(user.uid);
              const isOwner = user && post.uid === user.uid;
              const isLastElement = posts.length === index + 1;

              return (
                <div 
                  key={post.id} 
                  ref={isLastElement ? lastPostElementRef : null} 
                  className="rounded-[2.5rem] bg-secondary p-8 shadow-xl border border-white/5 animate-in fade-in slide-in-from-bottom-8 duration-700"
                >
                  <div className="flex items-start gap-5">
                    <Link href={`/profile/${post.username}`} className="h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-primary/30 shadow-md hover:scale-105 transition-transform">{post.photoURL ? (<img src={post.photoURL} alt={post.username} className="h-full w-full object-cover" />) : (<div className="flex h-full w-full items-center justify-center bg-background text-sm">👤</div>)}</Link>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <Link href={`/profile/${post.username}`} className="flex items-center gap-3 group"><span className="font-bold text-primary font-lexend text-2xl leading-none group-hover:underline underline-offset-4 decoration-2">{post.displayName}</span><span className="text-[12px] font-bold opacity-30 uppercase tracking-[0.2em]">@{post.username}</span></Link>
                        {isOwner && (<button onClick={() => handleDeletePost(post.id)} className="opacity-20 hover:opacity-100 hover:text-red-500 transition-all p-2 text-xl">🗑️</button>)}
                      </div>
                      <p className="mt-5 text-xl leading-relaxed opacity-90 whitespace-pre-wrap font-medium">{post.content}</p>
                      {post.postImage && (<div className="mt-6 rounded-3xl overflow-hidden border border-white/5 shadow-2xl"><img src={post.postImage} alt="Post content" className="w-full max-h-[500px] object-cover" /></div>)}
                    </div>
                  </div>

                  <div className="mt-8 flex items-center gap-8 border-t border-white/5 pt-8">
                    <button onClick={() => handleLike(post)} className={`flex items-center gap-2 text-sm font-black transition-all duration-300 ${hasLiked ? "text-primary scale-110" : "opacity-40 hover:opacity-100 hover:text-primary"}`}>
                      <span className="text-3xl">{hasLiked ? "✨" : "⭐"}</span>
                      <span>{post.likes?.length || 0}</span>
                    </button>
                    <Link href={`/post/${post.id}`} className="flex items-center gap-2 text-sm font-black opacity-40 hover:opacity-100 hover:text-primary transition-all group">
                      <span className="text-3xl group-hover:scale-110 transition-transform">💬</span>
                      <span>Comments</span>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}