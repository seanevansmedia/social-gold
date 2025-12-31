"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  deleteDoc,
  increment 
} from "firebase/firestore";
import Link from "next/link";
import { createNotification } from "@/lib/notificationUtils";
import Navbar from "@/components/Navbar";

export default function PostDetailPage() {
  const params = useParams();
  const postid = params.postid as string; 
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [post, setPost] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [alert, setAlert] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: (() => void) | null; }>({ isOpen: false, title: "", message: "", onConfirm: null });
  const showCustomAlert = (title: string, message: string, onConfirm?: () => void) => setAlert({ isOpen: true, title, message, onConfirm: onConfirm || null });
  const closeAlert = () => setAlert({ ...alert, isOpen: false });

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login"); return; }
    const fetchData = async () => {
      if (!postid) return;
      try {
        if (user) {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) setUserData(userSnap.data());
        }
        const postRef = doc(db, "posts", postid);
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) setPost({ id: postSnap.id, ...postSnap.data() });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [user, authLoading, postid, router]);

  useEffect(() => {
    if (!postid) return;
    const commentsRef = collection(db, "posts", postid, "comments");
    const q = query(commentsRef, orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setComments(commentsData);
      },
      (error) => {
        if (error.code !== "permission-denied") console.error(error);
      }
    );
    return () => unsubscribe();
  }, [postid]);

  const handleLike = async () => {
    if (!user || !post || !userData) return;
    const postRef = doc(db, "posts", post.id);
    const hasLiked = post.likes?.includes(user.uid);
    try {
      if (hasLiked) {
        await updateDoc(postRef, { likes: arrayRemove(user.uid) });
        setPost({ ...post, likes: post.likes.filter((id: string) => id !== user.uid) });
      } else {
        await updateDoc(postRef, { likes: arrayUnion(user.uid) });
        setPost({ ...post, likes: [...(post.likes || []), user.uid] });
        await createNotification(post.uid, { uid: user.uid, username: userData.username, displayName: userData.displayName }, "like", post.id);
      }
    } catch (err) { console.error(err); }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !userData || !post) return;
    setIsCommenting(true);
    try {
      const postRef = doc(db, "posts", postid);
      const commentsRef = collection(db, "posts", postid, "comments");
      await addDoc(commentsRef, { 
        content: newComment, 
        uid: user?.uid, 
        username: userData.username, 
        displayName: userData.displayName, 
        photoURL: userData.photoURL || "", 
        createdAt: serverTimestamp() 
      });
      await updateDoc(postRef, { commentCount: increment(1) });
      await createNotification(post.uid, { uid: user?.uid!, username: userData.username, displayName: userData.displayName }, "comment", postid);
      setNewComment("");
    } catch (error) { showCustomAlert("Error", "Could not reply."); }
    finally { setIsCommenting(false); }
  };

  const handleDeleteComment = (commentId: string) => {
    showCustomAlert("Remove Reply", "Delete this comment?", async () => {
      try { 
        const postRef = doc(db, "posts", postid);
        await deleteDoc(doc(db, "posts", postid, "comments", commentId)); 
        await updateDoc(postRef, { commentCount: increment(-1) });
      }
      catch (error) { showCustomAlert("Error", "Failed to delete."); }
    });
  };

  if (loading || authLoading) return <div className="min-h-screen bg-transparent" />;
  if (!post) return <div className="min-h-screen bg-transparent p-20 text-center font-lexend uppercase tracking-widest text-foreground">Post not found</div>;

  return (
    <div className="min-h-screen bg-transparent text-foreground font-jakarta pb-20">
      {alert.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2.5rem] bg-secondary p-8 shadow-2xl border border-white/10 text-center animate-in zoom-in duration-300">
            <h2 className="text-2xl font-bold font-lexend text-primary mb-2 uppercase">{alert.title}</h2>
            <p className="text-sm opacity-60 mb-8">{alert.message}</p>
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

      <Navbar backNav title="Comments" />

      <main className="mx-auto max-w-2xl px-4 pt-10 text-foreground relative z-10">
        <div className="mb-8 rounded-[2.5rem] bg-secondary/80 backdrop-blur-xl p-8 shadow-2xl border border-white/10">
          <div className="flex gap-5">
             <Link href={`/profile/${post.username}`} className="h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-primary/30 shadow-lg hover:scale-105 transition-transform">
                <img src={post.photoURL} className="h-full w-full object-cover" alt="" />
             </Link>
             <div className="flex-1 min-w-0">
                <Link href={`/profile/${post.username}`} className="group mb-4 block pb-1">
                    <p className="text-2xl font-bold text-primary font-lexend leading-tight uppercase group-hover:underline decoration-2">{post.displayName}</p>
                    <p className="text-[10px] opacity-60 uppercase font-bold tracking-[0.2em] mt-2">@{post.username}</p>
                </Link>
                <p className="text-2xl leading-relaxed opacity-100 whitespace-pre-wrap font-medium break-words">{post.content}</p>
                {post.postImage && (<div className="mt-6 rounded-3xl overflow-hidden border border-white/5 shadow-2xl"><img src={post.postImage} alt="Post content" className="w-full object-cover" /></div>)}
                
                <div className="mt-8 flex items-center gap-6 border-t border-white/5 pt-8">
                  <button onClick={handleLike} className="flex items-center gap-2 text-sm font-black transition-all hover:scale-110 active:scale-95 text-primary group">
                    <span className="text-3xl group-hover:brightness-125">{post.likes?.includes(user?.uid) ? "✨" : "⭐"}</span>
                    <span className="opacity-100">{post.likes?.length || 0}</span>
                  </button>
                  <div className="flex items-center gap-2 text-sm font-black text-primary">
                    <span className="text-3xl">💬</span>
                    <span className="opacity-100">{comments.length} Comments</span>
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* INPUT AREA - SOLID COLORS FOR VISIBILITY */}
        <div className="mb-12 px-6">
            <form onSubmit={handleAddComment} className="flex gap-4 items-end">
                <textarea 
                    value={newComment} 
                    onChange={(e) => setNewComment(e.target.value)} 
                    placeholder="Add to the conversation..." 
                    className="w-full bg-transparent border-b border-primary/40 p-2 text-xl focus:outline-none focus:border-primary transition-all resize-none placeholder:text-foreground/60 text-foreground font-medium" 
                    rows={1} 
                />
                <button 
                  type="submit" 
                  disabled={isCommenting || !newComment.trim()} 
                  className="text-primary font-black uppercase text-sm tracking-widest hover:scale-105 transition-all p-2 disabled:text-primary/40"
                >
                  Reply
                </button>
            </form>
        </div>

        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-[2rem] bg-secondary/60 backdrop-blur-md p-8 border border-white/5 animate-in slide-in-from-right-4 duration-500">
              <div className="flex items-start gap-4">
                <Link href={`/profile/${comment.username}`} className="h-12 w-12 shrink-0 rounded-full border border-primary/20 overflow-hidden shadow-sm hover:scale-105 transition-transform">
                    <img src={comment.photoURL} className="h-full w-full object-cover" alt="" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <Link href={`/profile/${comment.username}`} className="group flex items-center gap-3 pb-1">
                        <span className="font-bold text-primary text-lg font-lexend leading-tight group-hover:underline decoration-2">{comment.displayName}</span>
                        <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">@{comment.username}</span>
                    </Link>
                    {user && comment.uid === user.uid && (
                        <button onClick={() => handleDeleteComment(comment.id)} className="text-primary transition-all p-1 text-lg hover:text-red-500 hover:scale-125">🗑️</button>
                    )}
                  </div>
                  <p className="text-xl opacity-100 leading-relaxed font-medium break-words">{comment.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}