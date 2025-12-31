"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, getDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { createNotification } from "@/lib/notificationUtils";
import Navbar from "@/components/Navbar";

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profileUser, setProfileUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  useEffect(() => {
    if (user) {
        const userRef = doc(db, "users", user.uid);
        getDoc(userRef).then(snap => snap.exists() && setUserData(snap.data()));
    }
  }, [user]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "users"), where("username", "==", username.toLowerCase()));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) { setProfileUser(null); setLoading(false); }
        else {
          const uData: any = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
          setProfileUser(uData);
          setLoading(false);
          if (user && uData.followers?.includes(user.uid)) setIsFollowing(true);
          const postsQuery = query(collection(db, "posts"), where("uid", "==", uData.uid), orderBy("createdAt", "desc"));
          const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
            const userPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPosts(userPosts);
            setPostsLoading(false);
          }, (error) => { if (error.code !== "permission-denied") console.error(error); });
          return () => unsubscribe();
        }
      } catch (error) { console.error(error); setLoading(false); }
    };
    if (username) fetchProfile();
  }, [username, user]);

  const handleFollow = async () => {
    if (!user || !profileUser || !userData || isUpdatingFollow) return;
    setIsUpdatingFollow(true);
    const currentUserRef = doc(db, "users", user.uid);
    const targetUserRef = doc(db, "users", profileUser.id);
    try {
      if (isFollowing) {
        await updateDoc(currentUserRef, { following: arrayRemove(profileUser.id) });
        await updateDoc(targetUserRef, { followers: arrayRemove(user.uid) });
        setIsFollowing(false);
      } else {
        await updateDoc(currentUserRef, { following: arrayUnion(profileUser.id) });
        await updateDoc(targetUserRef, { followers: arrayUnion(user.uid) });
        setIsFollowing(true);
        await createNotification(profileUser.id, { uid: user.uid, username: userData.username, displayName: userData.displayName }, "follow");
      }
      const updatedSnap = await getDoc(targetUserRef);
      setProfileUser({ id: updatedSnap.id, ...updatedSnap.data() });
    } catch (error) { console.error(error); }
    finally { setIsUpdatingFollow(false); }
  };

  const handleStartMessage = () => {
    if (!user || !profileUser) return;
    const uids = [user.uid, profileUser.id].sort();
    const chatid = uids.join("_");
    router.push(`/messages/${chatid}`);
  };

  const handleLike = async (postId: string, postLikes: string[]) => {
    if (!user) return;
    const postRef = doc(db, "posts", postId);
    try {
      if (postLikes.includes(user.uid)) await updateDoc(postRef, { likes: arrayRemove(user.uid) });
      else await updateDoc(postRef, { likes: arrayUnion(user.uid) });
    } catch (error) { console.error(error); }
  };

  if (loading || authLoading) return <div className="min-h-screen bg-transparent" />;
  if (!profileUser) return <div className="flex min-h-screen flex-col items-center justify-center bg-transparent text-foreground p-6 text-center font-lexend"><h1 className="text-3xl md:text-4xl font-black text-primary mb-4 uppercase">Not Found</h1><Link href="/feed" className="text-xs font-bold uppercase tracking-widest text-primary">Return to Vault</Link></div>;

  const isMyProfile = user?.uid === profileUser.id;

  return (
    <div className="min-h-screen bg-transparent text-foreground font-jakarta pb-20">
      <Navbar isProfile={true} />

      <main className="mx-auto max-w-2xl px-4 pt-6 md:pt-10 text-foreground relative z-10">
        <div className="mb-8 md:mb-12 rounded-[2rem] md:rounded-[2.5rem] bg-secondary/80 backdrop-blur-xl p-6 md:p-10 shadow-2xl border border-white/5 text-center flex flex-col items-center relative">
          {isMyProfile && (
            <Link href="/settings" className="absolute top-6 right-6 md:top-8 md:right-8 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 border border-primary/20 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl hover:bg-primary/10 transition-all">Edit</Link>
          )}
          <div className="h-24 w-24 md:h-32 md:w-32 overflow-hidden rounded-full border-4 border-primary/50 shadow-2xl mb-4 md:mb-6 ring-4 ring-primary/10">
            {profileUser.photoURL ? (<img src={profileUser.photoURL} alt="" className="h-full w-full object-cover" />) : (<div className="flex h-full w-full items-center justify-center bg-background text-4xl md:text-5xl opacity-20">👤</div>)}
          </div>
          <h2 className="text-2xl md:text-4xl font-bold font-lexend text-primary mb-1 uppercase tracking-tight">{profileUser.displayName}</h2>
          <p className="text-[10px] md:text-[12px] font-bold opacity-60 uppercase tracking-[0.4em] mb-4">@{profileUser.username}</p>
          <p className="max-w-md text-base md:text-xl opacity-100 leading-relaxed font-medium mb-6 px-2">{profileUser.bio || "A quiet gold member."}</p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-8 md:mb-10 w-full max-w-xs md:max-w-sm">
              {!isMyProfile && (
                 <>
                    <button onClick={handleFollow} disabled={isUpdatingFollow} style={!isFollowing ? { background: "linear-gradient(to right, var(--gradient-from), var(--gradient-to))" } : {}} className={`flex-1 rounded-xl md:rounded-2xl py-3 md:py-4 text-[10px] md:text-sm font-black uppercase tracking-widest transition-all ${isFollowing ? "border-2 border-primary/30 text-primary bg-transparent" : "text-primary-foreground shadow-lg hover:brightness-110"}`}>{isFollowing ? "Unfollow" : "Follow"}</button>
                    <button onClick={handleStartMessage} className="flex-1 rounded-xl md:rounded-2xl py-3 md:py-4 text-[10px] md:text-sm font-black uppercase tracking-widest bg-white/5 border border-white/10 text-primary hover:bg-white/10 transition-all">Message</button>
                 </>
              )}
          </div>
          
          <div className="flex gap-6 md:gap-12 border-t border-white/5 pt-6 md:pt-8 w-full justify-center">
            <div className="flex flex-col"><span className="text-xl md:text-3xl font-black text-primary leading-none">{posts.length}</span><span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest opacity-60 mt-1">Posts</span></div>
            <div className="flex flex-col"><span className="text-xl md:text-3xl font-black text-primary leading-none">{profileUser.followers?.length || 0}</span><span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest opacity-60 mt-1">Followers</span></div>
            <div className="flex flex-col"><span className="text-xl md:text-3xl font-black text-primary leading-none">{profileUser.following?.length || 0}</span><span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest opacity-60 mt-1">Following</span></div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-8 md:gap-12 mb-8 md:mb-10 border-b border-white/5 pb-4 md:pb-6">
          <button onClick={() => setViewMode("list")} className={`flex items-center gap-2 md:gap-3 transition-all ${viewMode === "list" ? "text-primary scale-110" : "opacity-40 hover:opacity-100"}`}><span className="text-xl md:text-2xl">📜</span><span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Feed</span></button>
          <button onClick={() => setViewMode("grid")} className={`flex items-center gap-2 md:gap-3 transition-all ${viewMode === "grid" ? "text-primary scale-110" : "opacity-40 hover:opacity-100"}`}><span className="text-xl md:text-2xl">💎</span><span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Vault</span></button>
        </div>

        {postsLoading ? (<div className="py-10 text-center opacity-30 animate-pulse uppercase tracking-widest text-[10px]">Loading vault...</div>) : (
          <div className={viewMode === "list" ? "space-y-6 md:space-y-10" : "grid grid-cols-3 gap-1 md:gap-4 animate-in zoom-in duration-500"}>
            {posts.map((post) => (
                viewMode === "list" ? (
                    <div key={post.id} className="rounded-[1.5rem] md:rounded-[2.5rem] bg-secondary/80 backdrop-blur-xl p-5 md:p-8 shadow-xl border border-white/5 animate-in fade-in slide-in-from-bottom-8">
                      <div className="flex gap-4 md:gap-5">
                          <div className="h-10 w-10 md:h-14 md:w-14 shrink-0 overflow-hidden rounded-full border-2 border-primary/30 shadow-md">
                             {profileUser.photoURL ? (<img src={profileUser.photoURL} alt="" className="h-full w-full object-cover" />) : (<div className="flex h-full w-full items-center justify-center bg-background text-sm">👤</div>)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base md:text-2xl leading-tight opacity-100 whitespace-pre-wrap font-medium break-words pb-1">{post.content}</p>
                            {post.postImage && (<div className="mt-4 md:mt-6 rounded-2xl md:rounded-3xl overflow-hidden border border-white/5 shadow-2xl"><img src={post.postImage} alt="" className="w-full max-h-[400px] md:max-h-[500px] object-cover" /></div>)}
                            <div className="mt-6 md:mt-8 flex items-center gap-4 md:gap-6 border-t border-white/5 pt-6 md:pt-8">
                              <button onClick={() => handleLike(post.id, post.likes || [])} className="flex items-center gap-2 text-[10px] md:text-sm font-black transition-all hover:scale-110 active:scale-95 text-primary group"><span className="text-2xl md:text-3xl group-hover:brightness-125">{user && post.likes?.includes(user.uid) ? "✨" : "⭐"}</span><span className="opacity-100">{post.likes?.length || 0}</span></button>
                              <Link href={`/post/${post.id}`} className="flex items-center gap-2 text-[10px] md:text-sm font-black text-primary transition-all group hover:scale-110"><span className="text-2xl md:text-3xl group-hover:brightness-125 transition-transform">💬</span><span className="opacity-100">{post.commentCount || 0} <span className="hidden md:inline">Comments</span></span></Link>
                            </div>
                          </div>
                      </div>
                    </div>
                ) : (
                    <Link key={post.id} href={`/post/${post.id}`} className="aspect-square relative group overflow-hidden rounded-xl md:rounded-[2rem] bg-secondary/80 backdrop-blur-xl border border-white/5 shadow-lg">
                      {post.postImage ? (<img src={post.postImage} className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110" alt="" />) : (<div className="flex h-full w-full items-center justify-center p-2 md:p-4 text-center"><p className="text-[8px] md:text-[10px] font-bold opacity-60 uppercase tracking-tighter line-clamp-3 break-words">{post.content}</p></div>)}
                      <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><span className="text-xl md:text-2xl drop-shadow-lg">✨</span></div>
                    </Link>
                )
            ))}
          </div>
        )}
      </main>
    </div>
  );
}