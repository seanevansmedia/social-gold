"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { createNotification } from "@/lib/notificationUtils";
import NotificationBell from "@/components/NotificationBell";

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
          const uData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
          setProfileUser(uData);
          setLoading(false);
          if (user && uData.followers?.includes(user.uid)) setIsFollowing(true);
          const postsQuery = query(collection(db, "posts"), where("uid", "==", uData.uid), orderBy("createdAt", "desc"));
          const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
            const userPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPosts(userPosts);
            setPostsLoading(false);
          });
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

  if (loading || authLoading) return <div className="min-h-screen bg-background" />;
  if (!profileUser) return <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center font-lexend"><h1 className="text-4xl font-black text-primary mb-4 uppercase">Not Found</h1><Link href="/feed" className="text-sm font-bold uppercase tracking-widest opacity-50">Back</Link></div>;

  return (
    <div className="min-h-screen bg-background text-foreground font-jakarta pb-20">
      <nav className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-6">
          <Link href="/feed" className="text-3xl font-black font-lexend uppercase tracking-tighter">Social <span className="text-primary">Gold</span></Link>
          <div className="flex items-center gap-6">
            <NotificationBell />
            <Link href="/feed" className="text-sm font-bold uppercase tracking-widest text-primary border-2 border-primary/20 px-5 py-2.5 rounded-2xl bg-primary/5">Feed</Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 pt-10 text-foreground">
        <div className="mb-12 rounded-[2.5rem] bg-secondary p-10 shadow-2xl border border-white/5 text-center flex flex-col items-center">
          <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-primary/50 shadow-2xl mb-6 ring-4 ring-primary/10">
            {profileUser.photoURL ? (<img src={profileUser.photoURL} alt={profileUser.username} className="h-full w-full object-cover" />) : (<div className="flex h-full w-full items-center justify-center bg-background text-5xl opacity-20">👤</div>)}
          </div>
          <h2 className="text-4xl font-bold font-lexend text-primary mb-1 uppercase tracking-tight">{profileUser.displayName}</h2>
          <p className="text-[12px] font-bold opacity-30 uppercase tracking-[0.4em] mb-4">@{profileUser.username}</p>
          
          <p className="max-w-md text-xl opacity-80 leading-relaxed font-medium mb-4">{profileUser.bio || "A quiet gold member."}</p>
          
          {/* DISPLAY BIO LINK */}
          {profileUser.website && (
            <a 
              href={profileUser.website.startsWith('http') ? profileUser.website : `https://${profileUser.website}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="mb-8 flex items-center gap-2 text-primary font-bold hover:underline underline-offset-4 transition-all"
            >
              <span className="text-xl">🔗</span>
              <span className="text-sm uppercase tracking-widest">The Link</span>
            </a>
          )}

          {user && user.uid !== profileUser.id && (
             <button onClick={handleFollow} disabled={isUpdatingFollow} style={!isFollowing ? { background: "linear-gradient(to right, var(--gradient-from), var(--gradient-to))" } : {}} className={`mb-10 rounded-2xl px-12 py-3 text-sm font-black uppercase tracking-widest transition-all ${isFollowing ? "border-2 border-primary/30 text-primary bg-transparent" : "text-primary-foreground hover:brightness-110"}`}>{isFollowing ? "Unfollow" : "Follow"}</button>
          )}
          
          <div className="flex gap-8 md:gap-12 border-t border-white/5 pt-8 w-full justify-center">
            <div className="flex flex-col"><span className="text-3xl font-black text-primary leading-none">{posts.length}</span><span className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-1">Posts</span></div>
            <div className="flex flex-col"><span className="text-3xl font-black text-primary leading-none">{profileUser.followers?.length || 0}</span><span className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-1">Followers</span></div>
            <div className="flex flex-col"><span className="text-3xl font-black text-primary leading-none">{profileUser.following?.length || 0}</span><span className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-1">Following</span></div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-12 mb-10 border-b border-white/5 pb-6">
          <button onClick={() => setViewMode("list")} className={`flex items-center gap-3 transition-all ${viewMode === "list" ? "text-primary scale-110" : "opacity-20 hover:opacity-50"}`}><span className="text-2xl">📜</span><span className="text-[10px] font-black uppercase tracking-widest">Feed</span></button>
          <button onClick={() => setViewMode("grid")} className={`flex items-center gap-3 transition-all ${viewMode === "grid" ? "text-primary scale-110" : "opacity-20 hover:opacity-50"}`}><span className="text-2xl">💎</span><span className="text-[10px] font-black uppercase tracking-widest">The Vault</span></button>
        </div>

        {postsLoading ? (<div className="py-10 text-center opacity-30 animate-pulse uppercase tracking-widest text-xs">Loading collection...</div>) : (
          <>
            {viewMode === "list" ? (
              <div className="space-y-10">
                {posts.map((post) => (
                    <div key={post.id} className="rounded-[2.5rem] bg-secondary p-8 shadow-xl border border-white/5 animate-in fade-in slide-in-from-bottom-8 duration-700">
                      <p className="text-2xl leading-relaxed opacity-90 whitespace-pre-wrap font-medium">{post.content}</p>
                      {post.postImage && (<div className="mt-6 rounded-3xl overflow-hidden border border-white/5 shadow-2xl"><img src={post.postImage} alt="Post content" className="w-full max-h-[500px] object-cover" /></div>)}
                    </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 md:gap-4 animate-in zoom-in duration-500">
                {posts.map((post) => (
                  <Link key={post.id} href={`/post/${post.id}`} className="aspect-square relative group overflow-hidden rounded-2xl md:rounded-[2rem] bg-secondary border border-white/5">
                    {post.postImage ? (<img src={post.postImage} className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110" alt="" />) : (<div className="flex h-full w-full items-center justify-center p-4 text-center"><p className="text-[10px] font-bold opacity-20 uppercase tracking-tighter line-clamp-3">{post.content}</p></div>)}
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><span className="text-2xl drop-shadow-lg">✨</span></div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}