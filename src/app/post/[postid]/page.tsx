"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, arrayUnion, arrayRemove, deleteDoc } from "firebase/firestore";
import Link from "next/link";
import { createNotification } from "@/lib/notificationUtils";
import NotificationBell from "@/components/NotificationBell";

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
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComments(commentsData);
    });
    return () => unsubscribe();
  }, [postid]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !userData || !post) return;
    setIsCommenting(true);
    try {
      const commentsRef = collection(db, "posts", postid, "comments");
      await addDoc(commentsRef, { content: newComment, uid: user?.uid, username: userData.username, displayName: userData.displayName, photoURL: userData.photoURL || "", createdAt: serverTimestamp() });
      await createNotification(post.uid, { uid: user?.uid!, username: userData.username, displayName: userData.displayName }, "comment", postid);
      setNewComment("");
    } catch (error) { showCustomAlert("Error", "Could not reply."); }
    finally { setIsCommenting(false); }
  };

  if (loading || authLoading) return <div className="min-h-screen bg-background" />;
  if (!post) return <div className="min-h-screen bg-background p-20 text-center opacity-50 font-lexend uppercase tracking-widest text-foreground">Post not found</div>;

  return (
    <div className="min-h-screen bg-background text-foreground font-jakarta pb-20">
      <nav className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-primary text-3xl p-2 hover:scale-110 transition-transform">←</button>
            <h1 className="text-xl font-black font-lexend uppercase tracking-tighter text-foreground">Comments</h1>
          </div>
          <NotificationBell />
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 pt-10 text-foreground">
        <div className="mb-8 rounded-[2.5rem] bg-secondary p-8 shadow-2xl border border-white/10">
          <div className="flex items-start gap-5 mb-6">
             <img src={post.photoURL} className="h-14 w-14 rounded-full border-2 border-primary/30 object-cover shadow-lg" alt="" />
             <div><p className="text-2xl font-bold text-primary font-lexend leading-none uppercase">{post.displayName}</p><p className="text-[10px] opacity-30 uppercase font-bold tracking-[0.2em] mt-2">@{post.username}</p></div>
          </div>
          <p className="text-2xl leading-relaxed opacity-95 whitespace-pre-wrap font-medium">{post.content}</p>
          {post.postImage && (<div className="mt-6 rounded-3xl overflow-hidden border border-white/5 shadow-2xl"><img src={post.postImage} alt="Post content" className="w-full object-cover" /></div>)}
        </div>
        
        {/* Rest of Comment List Code remains same as previous step */}
        <div className="mb-12 px-6"><form onSubmit={handleAddComment} className="flex gap-4 items-end"><textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add to the conversation..." className="w-full bg-transparent border-b border-white/10 p-2 text-xl focus:outline-none focus:border-primary transition-all resize-none placeholder:opacity-20 text-foreground" rows={1} /><button type="submit" disabled={isCommenting || !newComment.trim()} className="text-primary font-black uppercase text-sm tracking-widest disabled:opacity-10 hover:scale-105 transition-all p-2">Reply</button></form></div>
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-[2rem] bg-secondary/50 p-8 border border-white/5">
              <div className="flex items-start gap-4">
                <img src={comment.photoURL} className="h-12 w-12 rounded-full border border-primary/20 object-cover shadow-sm" alt="" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2"><span className="font-bold text-primary text-lg font-lexend leading-none">{comment.displayName}</span><span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">@{comment.username}</span></div>
                  <p className="text-xl opacity-80 leading-relaxed font-medium">{comment.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}