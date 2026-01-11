"use client";

import { useEffect, useState } from "react";
import { backendBaseUrl } from "@/lib/urls";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("customer123@gmail.com");
  const [password, setPassword] = useState("258369");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const status = params.get("status");
    const error = params.get("error");
    if (token) {
      window.localStorage.setItem("adminToken", token);
      window.location.href = "/";
      return;
    }
    if (status === "pending") {
      setMessage("บัญชีของคุณกำลังรอการอนุมัติจากเจ้าของระบบ");
    }
    if (error) {
      setMessage("เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่");
    }
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setMessage(null);
    const response = await fetch(`${backendBaseUrl}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    setLoading(false);
    if (response.ok && data.token) {
      window.localStorage.setItem("adminToken", data.token);
      window.location.href = "/";
      return;
    }
    if (data.status === "pending") {
      setMessage("บัญชีของคุณกำลังรอการอนุมัติจากเจ้าของระบบ");
      return;
    }
    setMessage(data.error || "เข้าสู่ระบบไม่สำเร็จ");
  };

  const handleOAuth = (provider: string) => {
    setMessage(null);
    const target =
      provider === "google"
        ? `${backendBaseUrl}/api/auth/google`
        : `${backendBaseUrl}/api/auth/line`;
    window.location.href = target;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="text-xl font-semibold text-slate-800">Admin Login</h1>
        <p className="mt-1 text-xs text-slate-400">
          ใช้บัญชีที่ได้รับอนุมัติจาก Owner
        </p>
        <div className="mt-6 grid gap-3">
          <label className="text-xs text-slate-500">Email</label>
          <input
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <label className="text-xs text-slate-500">Password</label>
          <input
            type="password"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            onClick={handleLogin}
            disabled={loading}
            className="rounded-xl bg-[var(--admin-navy)] px-4 py-2 text-sm font-semibold text-white"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
          {message && <p className="text-xs text-rose-500">{message}</p>}
        </div>

        <div className="my-6 h-px bg-slate-100" />
        <p className="text-xs text-slate-400">Login with</p>
        <div className="mt-3 flex gap-3">
          <button
            onClick={() => handleOAuth("google")}
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs"
          >
            Google
          </button>
          <button
            onClick={() => handleOAuth("line")}
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs"
          >
            LINE
          </button>
        </div>
        <p className="mt-4 text-[10px] text-slate-400 bg-yellow-50 p-2 rounded-lg">
          Test login: customer123@gmail.com / 258369
        </p>
      </div>
    </div>
  );
}
