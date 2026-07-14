"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("E-mail ou senha inválidos.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F4F9] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#0F9D8B] text-white font-bold flex items-center justify-center mx-auto mb-3 text-xl">
            V
          </div>
          <h1 className="text-xl font-bold text-[#171A2B]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            CRM Veron &amp; Arena 360
          </h1>
          <p className="text-sm text-[#6B7086] mt-1">Entre com suas credenciais</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-[#E4E5F1] p-6 flex flex-col gap-4">
          {error && <div className="text-xs rounded-lg px-3 py-2 bg-[#E5484D14] text-[#E5484D]">{error}</div>}
          <div>
            <label className="text-xs font-medium text-[#6B7086] block mb-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm rounded-lg px-3 py-2 border border-[#E4E5F1] outline-none focus:border-[#0F9D8B]"
              placeholder="voce@empresa.com"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B7086] block mb-1">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-sm rounded-lg px-3 py-2 border border-[#E4E5F1] outline-none focus:border-[#0F9D8B]"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full text-sm font-semibold text-white rounded-lg py-2.5 bg-[#0F9D8B] disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p className="text-xs text-center text-[#6B7086] mt-4">
          Usuário de teste (após rodar o seed): marina@veronproducoes.com.br / veron@2026
        </p>
      </div>
    </div>
  );
}
