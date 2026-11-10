"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  return (
    <button
      type="button"
      className="logout-button"
      onClick={() => signOut({ redirectTo: "/" })}
    >
      <LogOut size={18} />
      <span>Logout</span>
    </button>
  );
}
