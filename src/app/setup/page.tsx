"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [form, setForm] = useState({ secret: "", name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/setup")
      .then((r) => r.json())
      .then((data) => {
        setAlreadyDone(!data.needsSetup);
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ? JSON.stringify(data.error) : "Erro ao configurar.");
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-[#6B7086]">Verificando...</div>;
  }

  if (alreadyDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F4F9] px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-bold text-[#171A2B] mb-2">Configuração já concluída</h1>
          <p className="text-sm text-[#6B7086] mb-4">
            Já existe um administrador cadastrado neste sistema. Peça a ele para criar seu usuário em Configurações,
            ou acesse a tela de login.
          </p>
          <a href="/login" className="text-sm font-semibold text-[#0F9D8B]">
            Ir para o login →
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F4F9] px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-bold text-[#171A2B] mb-2">Tudo pronto! 🎉</h1>
          <p className="text-sm text-[#6B7086]">Administrador criado. Redirecionando para o login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F4F9] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-[#171A2B]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Configuração inicial
          </h1>
          <p className="text-sm text-[#6B7086] mt-1">
            Crie a primeira conta de Administrador do CRM. Isso só pode ser feito uma vez.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-[#E4E5F1] p-6 flex flex-col gap-4">
          {error && <div className="text-xs rounded-lg px-3 py-2 bg-[#E5484D14] text-[#E5484D]">{error}</div>}
          <div>
            <label className="text-xs font-medium text-[#6B7086] block mb-1">
              Código de configuração (o mesmo valor da variável SETUP_SECRET)
            </label>
            <input
              required
              value={form.secret}
              onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))}
              className="w-full text-sm rounded-lg px-3 py-2 border border-[#E4E5F1] outline-none focus:border-[#0F9D8B]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B7086] block mb-1">Seu nome</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full text-sm rounded-lg px-3 py-2 border border-[#E4E5F1] outline-none focus:border-[#0F9D8B]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B7086] block mb-1">Seu e-mail</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full text-sm rounded-lg px-3 py-2 border border-[#E4E5F1] outline-none focus:border-[#0F9D8B]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B7086] block mb-1">Senha (mín. 6 caracteres)</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full text-sm rounded-lg px-3 py-2 border border-[#E4E5F1] outline-none focus:border-[#0F9D8B]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full text-sm font-semibold text-white rounded-lg py-2.5 bg-[#0F9D8B] disabled:opacity-60"
          >
            {loading ? "Criando..." : "Criar conta de Administrador"}
          </button>
        </form>
      </div>
    </div>
  );
}
