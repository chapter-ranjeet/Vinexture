"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchJson } from "@/lib/api";
type Certificate = { title: string; candidate_name: string; candidate_email: string; issued_date: string; status: string; verification_code: string };
export default function VerifyCertificatePage() {
  const { code } = useParams<{ code: string }>(); const [item, setItem] = useState<Certificate | null>(null); const [error, setError] = useState("");
  useEffect(() => { fetchJson<Certificate>(`/certificates/verify/${code}/`).then(setItem).catch(() => setError("This certificate could not be verified.")); }, [code]);
  return <main className="container-shell flex min-h-screen items-center justify-center py-16"><div className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8"><p className="text-xs uppercase tracking-[0.2em] text-blue-600">VINEXTURE verification</p><h1 className="mt-3 text-3xl font-semibold text-slate-950">Certificate verification</h1>{error ? <p className="mt-8 rounded-2xl bg-red-50 p-4 text-red-700">{error}</p> : item ? <div className="mt-8 space-y-4 text-sm"><p className="text-xl font-medium">{item.title}</p><p>Candidate: {item.candidate_name} ({item.candidate_email})</p><p>Issued: {item.issued_date}</p><p>Status: <span className="capitalize text-emerald-700">{item.status}</span></p><p className="break-all text-xs text-slate-500">Code: {item.verification_code}</p></div> : <p className="mt-8 text-slate-500">Checking certificate...</p>}</div></main>;
}
