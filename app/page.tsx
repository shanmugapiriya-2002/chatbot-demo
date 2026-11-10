
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import Header from "./components/Header/Header";
import Hero from "./components/Hero/Hero";

async function HomeContent() {
  const session = await auth();

  // Already logged in
  if (session) {
    redirect("/chat");
  }

  // Not logged in
  return (
    <>
      <Header />
      <Hero />
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}


