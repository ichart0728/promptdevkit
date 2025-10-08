import { auth } from "@/app/api/auth/[...nextauth]/route";
import type { Session } from "next-auth";

type MinimalSession = Pick<Session, "user">;

export async function getSessionOrDev(): Promise<MinimalSession | null> {
  const session = await auth();
  if (session?.user) {
    return { user: session.user };
  }

  if (
    process.env.NODE_ENV === "development" &&
    process.env.DEV_AUTH_BYPASS === "1"
  ) {
    const mockSession: MinimalSession = {
      user: {
        id: process.env.DEV_USER_ID!,
        email: process.env.DEV_USER_EMAIL ?? "dev@example.com",
        name: "Dev User",
      },
    };
    return mockSession;
  }
  return null;
}
