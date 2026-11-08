"use client";

import { useState } from "react";
import { AuthForm } from "./AuthForm";

export function LoginPage({ redirect }: { redirect?: string }) {
  const [tab, setTab] = useState<"login" | "register">("login");
  return (
    <main id="main-content" className="pt-28 pb-20 px-6 flex justify-center">
      <div className="modal-card bg-px-surface rounded-[20px] w-full max-w-[440px]" style={{ border: "1px solid rgb(var(--c-fg) / calc(0.07 * var(--k)))", boxShadow: "0 24px 64px rgb(var(--c-scrim) / calc(0.85 * var(--ks)))" }}>
        <AuthForm tab={tab} onTab={setTab} onListo={() => {}} redirect={redirect ?? "/cuenta/pedidos"} />
      </div>
    </main>
  );
}
