"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Sun,
  Moon,
  Laptop,
  Activity,
  Database,
  Shield,
  LogOut,
  RefreshCw,
  Server,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/react-bits/page-transition";
import { useTheme } from "@/components/providers/theme-provider";
import { checkLiveness, checkReadiness } from "@/lib/api/health";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [liveness, setLiveness] = useState<"checking" | "ok" | "error">("checking");
  const [readiness, setReadiness] = useState<"checking" | "ready" | "error">("checking");
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [isChecking, setIsChecking] = useState(false);

  const runHealthChecks = async () => {
    setIsChecking(true);
    setLiveness("checking");
    setReadiness("checking");

    try {
      await checkLiveness();
      setLiveness("ok");
    } catch {
      setLiveness("error");
    }

    try {
      await checkReadiness();
      setReadiness("ready");
    } catch {
      setReadiness("error");
    }

    setLastCheck(new Date());
    setIsChecking(false);
  };

  useEffect(() => {
    let isMounted = true;
    checkLiveness()
      .then(() => isMounted && setLiveness("ok"))
      .catch(() => isMounted && setLiveness("error"));
    checkReadiness()
      .then(() => isMounted && setReadiness("ready"))
      .catch(() => isMounted && setReadiness("error"));
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  return (
    <PageTransition>
      <div className="max-w-3xl space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Settings className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Pengaturan Sistem
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Preferensi tampilan, diagnosa server backend Go, dan keamanan sesi.
          </p>
        </div>

        {/* 1. Appearance / Theme */}
        <Card className="border-slate-200/80 dark:border-white/10">
          <CardHeader>
            <CardTitle className="text-base">Tema & Tampilan</CardTitle>
            <CardDescription>Pilih tema antarmuka yang paling nyaman untuk Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  theme === "dark"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 font-semibold"
                    : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                <Moon className="w-5 h-5" />
                <span className="text-xs">Mode Gelap (Dark)</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  theme === "light"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 font-semibold"
                    : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                <Sun className="w-5 h-5" />
                <span className="text-xs">Mode Terang (Light)</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                  theme === "system"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 font-semibold"
                    : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                <Laptop className="w-5 h-5" />
                <span className="text-xs">Sistem (Otomatis)</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* 2. System Health & Diagnostics */}
        <Card className="border-slate-200/80 dark:border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Konektivitas & Kesehatan Server</CardTitle>
              <CardDescription>Status layanan backend Go dan database PostgreSQL</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={runHealthChecks}
              isLoading={isChecking}
              className="text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              <span>Tes Koneksi</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
              {/* Go API Health */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5">
                    <Activity className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      Go REST API Liveness
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">GET /api/v1/health</div>
                  </div>
                </div>
                <div>
                  {liveness === "ok" ? (
                    <Badge variant="success">Online & Responsif</Badge>
                  ) : liveness === "checking" ? (
                    <Badge variant="warning">Memeriksa...</Badge>
                  ) : (
                    <Badge variant="danger">Offline / Tidak Terjangkau</Badge>
                  )}
                </div>
              </div>

              {/* PostgreSQL Readiness */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5">
                    <Database className="w-4 h-4 text-sky-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      PostgreSQL Connection Pool
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">GET /api/v1/ready (Ping)</div>
                  </div>
                </div>
                <div>
                  {readiness === "ready" ? (
                    <Badge variant="success">Terhubung (pgx/v5)</Badge>
                  ) : readiness === "checking" ? (
                    <Badge variant="warning">Memeriksa...</Badge>
                  ) : (
                    <Badge variant="danger">Gagal Terhubung</Badge>
                  )}
                </div>
              </div>

              {/* Deployment Info */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5">
                    <Server className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      Target Deployment
                    </div>
                    <div className="text-[11px] text-slate-400">Tencent Cloud Lighthouse (2 vCPU / 2GB)</div>
                  </div>
                </div>
                <Badge variant="outline">finance.mikra.my.id</Badge>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 pt-1">
              Pengecekan terakhir: {lastCheck.toLocaleTimeString("id-ID")}
            </div>
          </CardContent>
        </Card>

        {/* 3. Account & Security */}
        <Card className="border-slate-200/80 dark:border-white/10">
          <CardHeader>
            <CardTitle className="text-base">Sesi & Keamanan</CardTitle>
            <CardDescription>Sesi autentikasi tersimpan aman dalam HTTP-only cookie</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-emerald-500" />
                <div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-white">
                    Status Sesi Terproteksi
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Cookie HTTP-only (JWT HS256) dengan masa berlaku 7 hari.
                  </div>
                </div>
              </div>

              <Button
                variant="danger"
                size="sm"
                onClick={handleLogout}
                className="text-xs"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" />
                <span>Keluar (Logout)</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
