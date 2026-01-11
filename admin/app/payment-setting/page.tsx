"use client";

import { useEffect, useState } from "react";
import { backendBaseUrl } from "@/lib/urls";

type PaymentSetting = {
  provider: "omise" | "stripe";
};

export default function PaymentSettingPage() {
  const [setting, setSetting] = useState<PaymentSetting>({ provider: "omise" });
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSetting = async () => {
    try {
      const response = await fetch(`${backendBaseUrl}/payment-setting`);
      const data = await response.json();
      if (data.setting?.provider) {
        setSetting({ provider: data.setting.provider });
      }
    } catch (error) {
      console.error("Failed to load payment setting:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSetting();
  }, []);

  const saveSetting = async () => {
    const response = await fetch(`${backendBaseUrl}/payment-setting`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(setting),
    });
    if (response.ok) {
      setMessage("Saved");
      setTimeout(() => setMessage(null), 1200);
    }
  };

  return (
    <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Payment Gateway
          </h2>
          <p className="text-xs text-slate-400">
            Select the default payment provider for checkout.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={saveSetting}
            className="rounded-full bg-emerald-600 px-4 py-2 text-xs text-white"
            disabled={loading}
          >
            Save
          </button>
          {message && <span className="text-xs text-emerald-600">{message}</span>}
        </div>
      </header>

      <div className="mt-6 grid gap-4">
        <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div>
            <p className="text-sm font-semibold text-slate-700">Omise</p>
            <p className="text-xs text-slate-500">
              Credit/debit, PromptPay, KBank, SCB.
            </p>
          </div>
          <input
            type="radio"
            name="provider"
            value="omise"
            checked={setting.provider === "omise"}
            onChange={() => setSetting({ provider: "omise" })}
          />
        </label>

        <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div>
            <p className="text-sm font-semibold text-slate-700">Stripe</p>
            <p className="text-xs text-slate-500">
              Credit/debit and PromptPay.
            </p>
          </div>
          <input
            type="radio"
            name="provider"
            value="stripe"
            checked={setting.provider === "stripe"}
            onChange={() => setSetting({ provider: "stripe" })}
          />
        </label>
      </div>
    </div>
  );
}
