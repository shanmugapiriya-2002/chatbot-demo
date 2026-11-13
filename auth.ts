
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { supabase } from "@/lib/supabase";

export const {
  handlers,
  signIn,
  signOut,
  auth,
} = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],

  events: {
    async signIn({ user }) {
      try {
        if (!user.email) {
          console.error("User email is missing");
          return;
        }

       const result = await supabase
  .from("users")
  .upsert({
    email: user.email,
    name: user.name,
  });

const error = result.error;

        if (error) {
          console.error("User save error:", error);
          return;
        }

        console.log("User saved successfully:", user.email);

      } catch (error) {
        console.error("Supabase error:", error);
      }
    },
  },
});
