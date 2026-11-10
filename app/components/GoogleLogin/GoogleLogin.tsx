"use client";

import { signIn } from "next-auth/react";

export default function GoogleLogin() {
  return (
    <button
      className="start-button"
      onClick={() =>
        signIn("google", {
          redirectTo: "/chat",
        })
      }
    >
      Continue with Google
    </button>
  );
}
