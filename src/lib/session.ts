import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function getSessionOrDev() {
  const session = await auth();
  if (session?.user) return session;

  if (
    process.env.NODE_ENV === "development" &&
    process.env.DEV_AUTH_BYPASS === "1"
  ) {
    return {
      user: {
        id: process.env.DEV_USER_ID!,
        email: process.env.DEV_USER_EMAIL ?? "dev@example.com",
        name: "Dev User",
      },
    } as any;
  }
  return null;
}
