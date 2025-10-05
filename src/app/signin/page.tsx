'use client';

import { signIn } from 'next-auth/react';

export default function SignIn() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <button
        onClick={() => signIn('google')}
        className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500"
      >
        Sign in with Google
      </button>
    </div>
  );
}
