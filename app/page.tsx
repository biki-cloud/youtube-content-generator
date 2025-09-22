"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    // メインページからダッシュボードにリダイレクト
    router.replace("/dashboard");
  }, [router]);

  return (
    <main style={{ padding: 24, textAlign: "center" }}>
      <div>ダッシュボードにリダイレクト中...</div>
    </main>
  );
}
