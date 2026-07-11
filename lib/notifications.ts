import { collection, query, orderBy, onSnapshot, doc, updateDoc, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Notification } from "@/types/user";

/** Subscribes to a user's most recent notifications in real time. Returns an unsubscribe function. */
export function subscribeToNotifications(
  uid: string,
  callback: (items: Notification[]) => void
): () => void {
  const q = query(collection(db, "notifications", uid, "items"), orderBy("createdAt", "desc"), limit(20));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Notification, "id">) }));
    callback(items);
  });
}

export async function markNotificationRead(uid: string, notifId: string): Promise<void> {
  await updateDoc(doc(db, "notifications", uid, "items", notifId), { read: true });
}
