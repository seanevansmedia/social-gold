import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit } from "firebase/firestore";

export type NotificationType = "like" | "comment" | "follow";

export const createNotification = async (
  toUid: string,
  fromUser: { uid: string; username: string; displayName: string },
  type: NotificationType,
  postId?: string
) => {
  // Don't notify if you are the one performing the action on your own content
  if (toUid === fromUser.uid) return;

  try {
    await addDoc(collection(db, "notifications"), {
      toUid,
      fromUid: fromUser.uid,
      fromUsername: fromUser.username,
      fromDisplayName: fromUser.displayName,
      type,
      postId: postId || null,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};