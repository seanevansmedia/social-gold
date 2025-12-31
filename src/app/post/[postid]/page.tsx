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
import confetti from "canvas-confetti"; // IMPORTED CONFETTI

// Sub-component for individual comments with Inline Reply and Confetti logic
function CommentItem({ comment, postid, user, userData }: any) {
  const [replies, setReplies] = useState<any[]>([]);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const hasLiked = user && comment.likes?.includes(user.uid);

  useEffect(() => {
    const repliesRef = collection(db, "posts", postid, "comments", comment.id, "replies");
    const q = query(repliesRef, orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReplies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    }, (error) => {
      if (error.code !== "permission-denied") console.error(error);
    });
    return () => unsubscribe();
  }, [postid, comment.id]);

  const handleLikeComment = async () => {
    if (!user || !userData) return;
    const commentRef = doc(db, "posts", postid, "comments", comment.id);

    // TRIGGER GOLD CONFETTI ON LIKE
    if (!hasLiked) {
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.8 },
        colors: ["#ca8a04", "#fde047", "#ffffff"]
      });
    }

    try {
      if (hasLiked) {
        await updateDoc(commentRef, { likes: arrayRemove(user.uid) });
      } else {
        await updateDoc(commentRef, { likes: arrayUnion(user.uid) });
        await createNotification(comment.uid, { uid: user.uid, username: userData.username, displayName: userData.displayName }, "like", postid);
      }
    } catch (err) { console.error(err); }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !user || !userData) return;
    setIsSubmitting(true);

    try {
      const repliesRef = collection(db, "posts", postid, "comments", comment.id, "replies");
      await addDoc(repliesRef, {
        content: replyText.trim(),
        uid: user.uid,
        username: userData.username,
        displayName: userData.displayName,
        photoURL: userData.photoURL || "",
        createdAt: serverTimestamp()
      });

      await createNotification(comment.uid, { uid: user.uid, username: userData.username, displayName: userData.displayName }, "comment", postid);
      
      setReplyText("");
      setIsReplying(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="rounded-[2rem] bg-secondary/80 backdrop-blur-xl p-5 md:p-6 border border-white/10 shadow-xl">
        <div className="flex items-start gap-4">
          <Link href={`/profile/${comment.username}`} className="h-10 w-10 shrink-0 rounded-full border-2 border-primary/20 overflow-hidden shadow-sm">
            <img src={comment.photoURL || "/default-avatar.png"} className="h-full w-full object-cover" alt="" />
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${comment.username}`} className="group flex items-center gap-2 pb-1">
              <span className="font-bold text-primary text-base md:text-lg font-lexend leading-tight group-hover:underline truncate">{comment.displayName}</span>
              <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">@{comment.username}</span>
            </Link>
            <p className="text-base md:text-lg text-foreground font-medium break-words mb-4">{comment.content}</p>
            
            <div className="flex items-center gap-6">
                <button onClick={handleLikeComment} className="flex items-center gap-2 text-xs font-black text-primary hover:scale-110 transition-all">
                    <span className="text-3xl">{hasLiked ? "✨" : "⭐"}</span>
                    <span>{comment.likes?.length || 0}</span>
                </button>
                <button onClick={() => setIsReplying(!isReplying)} className="flex items-center gap-2 text-xs font-black text-primary hover:scale-110 transition-all">
                    <span className="text-3xl">💬</span>
                    <span>{isReplying ? "Cancel" : "Reply"}</span>
                </button>
            </div>

            {isReplying && (
              <form onSubmit={handleSendReply} className="mt-6 flex gap-3 items-center animate-in zoom-in duration-300">
                <input 
                  type="text"
                  autoFocus
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to @${comment.username}...`}
                  className="flex-1 bg-background/50 border-b-2 border-primary/30 p-2 text-sm focus:outline-none focus:ring-0 focus:border-primary transition-all text-foreground placeholder:text-foreground/30"
                />
                <button 
                  type="submit" 
                  disabled={!replyText.trim() || isSubmitting}
                  className="text-primary font-black uppercase text-[10px] tracking-widest disabled:text-primary/30"
                >
                  {isSubmitting ? "..." : "Send"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {replies.length > 0 && (
        <div className="ml-8 md:ml-12 space-y-3 border-l-2 border-primary/10 pl-4 md:pl-6">
          {replies.map((reply) => (
            <div key={reply.id} className="rounded-[1.5rem] bg-secondary/40 p-4 border border-white/5 shadow-md">
              <div className="flex items-start gap-3">
                <Link href={`/profile/${reply.username}`} className="h-8 w-8 shrink-0 rounded-full border border-primary/20 overflow-hidden">
                  <img src={reply.photoURL || "/default-avatar.png"} className="h-full w-full object-cover" alt="" />
                </Link>
                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-primary text-sm font-lexend">{reply.displayName}</span>
                      <span className="text-[8px] font-bold text-foreground/40 uppercase">@{reply.username}</span>
                   </div>
                   <p className="text-sm md:text-base text-foreground font-medium break-words">{reply.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
        if (postSnap.exists()) setPost({ id: postSnap.id, ...postSnap.data() } as any);
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
        setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    }, (error) => {
      if (error.code !== "permission-denied") console.error(error);
    });
    return () => unsubscribe();
  }, [postid]);

  const handleLike = async () => {
    if (!user || !post || !userData) return;
    const postRef = doc(db, "posts", post.id);
    const hasLiked = post.likes?.includes(user.uid);

    // TRIGGER GOLD CONFETTI ON POST LIKE
    if (!hasLiked) {
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.8 },
        colors: ["#ca8a04", "#fde047", "#ffffff"]
      });
    }

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

  const handleAddTopLevelComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !userData || !post) return;
    setIsCommenting(true);
    try {
      const postRef = doc(db, "posts", postid);
      const commentsRef = collection(db, "posts", postid, "comments");
      await addDoc(commentsRef, { 
        content: newComment.trim(), 
        uid: user.uid, 
        username: userData.username, 
        displayName: userData.displayName, 
        photoURL: userData.photoURL || "", 
        likes: [],
        createdAt: serverTimestamp() 
      });
      await updateDoc(postRef, { commentCount: increment(1) });
      await createNotification(post.uid, { uid: user.uid, username: userData.username, displayName: userData.displayName }, "comment", postid);
      setNewComment("");
    } catch (error) { showCustomAlert("Error", "Could not post comment."); }
    finally { setIsCommenting(false); }
  };

  if (loading || authLoading) return <div className="min-h-screen bg-transparent" />;
  if (!post) return <div className="min-h-screen bg-transparent p-20 text-center font-lexend uppercase text-primary">Vault Empty</div>;

  return (
    <div className="min-h-screen bg-transparent text-foreground font-jakarta pb-20">
      {alert.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2.5rem] bg-secondary p-8 shadow-2xl border border-white/10 text-center animate-in zoom-in duration-300">
            <h2 className="text-2xl font-bold font-lexend text-primary mb-2 uppercase">{alert.title}</h2>
            <p className="text-sm opacity-60 mb-8">{alert.message}</p>
            <button onClick={closeAlert} className="w-full rounded-2xl py-4 font-black text-primary-foreground bg-primary shadow-lg uppercase text-xs">Okay</button>
          </div>
        </div>
      )}

      <Navbar backNav title="The Vault" />

      <main className="mx-auto max-w-2xl px-4 pt-10 text-foreground relative z-10">
        {/* MAIN POST */}
        <div className="mb-12 rounded-[2.5rem] bg-secondary/80 backdrop-blur-xl p-6 md:p-8 shadow-2xl border border-white/10">
          <div className="flex gap-5">
             <Link href={`/profile/${post.username}`} className="h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-primary/30 shadow-lg hover:scale-105 transition-transform">
                <img src={post.photoURL || "/default-avatar.png"} className="h-full w-full object-cover" alt="" />
             </Link>
             <div className="flex-1 min-w-0">
                <Link href={`/profile/${post.username}`} className="group mb-4 block pb-1">
                    <p className="text-xl md:text-2xl font-bold text-primary font-lexend leading-tight uppercase group-hover:underline truncate">{post.displayName}</p>
                    <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">@{post.username}</p>
                </Link>
                <p className="text-xl md:text-2xl text-foreground leading-relaxed font-medium break-words">{post.content}</p>
                {post.postImage && (<div className="mt-6 rounded-3xl overflow-hidden border border-white/5 shadow-2xl"><img src={post.postImage} alt="Post content" className="w-full object-cover" /></div>)}
                
                <div className="mt-8 flex items-center gap-6 border-t border-white/5 pt-8">
                  <button onClick={handleLike} className="flex items-center gap-2 text-sm font-black transition-all hover:scale-110 active:scale-95 text-primary group">
                    <span className="text-3xl group-hover:brightness-125">{post.likes?.includes(user?.uid) ? "✨" : "⭐"}</span>
                    <span className="opacity-100">{post.likes?.length || 0}</span>
                  </button>
                  <div className="flex items-center gap-2 text-sm font-black text-primary">
                    <span className="text-3xl">💬</span>
                    <span className="opacity-100">{post.commentCount || 0} Comments</span>
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* INPUT BOX */}
        <div className="mb-8 px-4 md:px-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 mb-6">Add to the Conversation</h3>
            <form onSubmit={handleAddTopLevelComment} className="flex gap-4 items-end bg-secondary/40 p-4 rounded-[1.5rem] border border-white/5">
                <textarea 
                    value={newComment} 
                    onChange={(e) => setNewComment(e.target.value)} 
                    placeholder="Share your thoughts..." 
                    className="w-full bg-transparent border-none p-2 text-lg focus:ring-0 transition-all resize-none text-foreground font-medium placeholder:text-foreground/30" 
                    rows={1} 
                />
                <button 
                  type="submit" 
                  disabled={!newComment.trim() || isCommenting} 
                  className="text-primary font-black uppercase text-xs tracking-widest hover:scale-105 transition-all p-2 disabled:text-primary/30"
                >
                  Post
                </button>
            </form>
        </div>

        {/* DIVIDER */}
        <div className="flex items-center gap-4 px-6 mb-10">
          <div className="h-px bg-white/10 flex-1"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Comments</span>
          <div className="h-px bg-white/10 flex-1"></div>
        </div>

        {/* COMMENTS LIST */}
        <div className="space-y-12">
          {comments.map((comment) => (
            <CommentItem 
              key={comment.id} 
              comment={comment} 
              postid={postid} 
              user={user} 
              userData={userData}
            />
          ))}
          {comments.length === 0 && (
            <div className="py-20 text-center animate-in fade-in duration-1000">
                <p className="text-primary/40 font-bold italic text-sm">Be the first to share thoughts in this vault.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}