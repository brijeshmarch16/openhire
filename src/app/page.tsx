"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  const router = useRouter();

  const Logout = () => {
    authClient.signOut();
    router.push("/signin");
  };

  return <Button onClick={Logout}>logout</Button>;
}
