const BASE = import.meta.env.VITE_API_URL ?? "";

export async function sendOtp(email: string): Promise<{ sessionId: string }> {
  const res = await fetch(`${BASE}/api/admin/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? "Failed to send OTP");
  }
  return res.json();
}

export async function verifyOtp(sessionId: string, otp: string): Promise<{ success: boolean }> {
  const res = await fetch(`${BASE}/api/admin/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, otp }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? "OTP verification failed");
  }
  return res.json();
}
