import { auth } from "@/lib/firebase";

export async function authedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated.");
  const idToken = await user.getIdToken();
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
      ...(options.headers ?? {}),
    },
  });
}
