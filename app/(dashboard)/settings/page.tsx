"use client";
import { Sun, Moon, Laptop, RefreshCw, LogOut, Server, Database } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/finance";
import { useTheme } from "@/components/providers/theme-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { checkLiveness, checkReadiness } from "@/lib/api/health";
export default function SettingsPage() {
  const {theme,setTheme} = useTheme();
  const {user,logout} = useAuth();
  const live = useQuery({queryKey:["health","liveness"],queryFn:checkLiveness,retry:false});
  const ready = useQuery({queryKey:["health","readiness"],queryFn:checkReadiness,retry:false});
  const checking = live.isFetching || ready.isFetching;
  const checkedAt = Math.max(live.dataUpdatedAt, live.errorUpdatedAt, ready.dataUpdatedAt, ready.errorUpdatedAt);
  return <div className="finance-page settings-page"><PageHeader title="Pengaturan" description="Buat KashFlow terasa nyaman untukmu." />
    <section><div className="section-heading"><h2>Tampilan</h2></div><div className="surface settings-surface"><p className="muted-text">Pilih tema, atau ikuti pengaturan perangkat.</p><div className="theme-choices" role="group" aria-label="Tema tampilan">{([{value:"light",label:"Terang",icon:Sun},{value:"dark",label:"Gelap",icon:Moon},{value:"system",label:"Otomatis",icon:Laptop}] as const).map(({value,label,icon:Icon}) => <button key={value} type="button" aria-pressed={theme === value} onClick={() => setTheme(value)}><span className={`theme-preview theme-preview-${value}`} aria-hidden="true"><span/><span/><span/></span><span><Icon size={17} />{label}</span></button>)}</div></div></section>
    <section><div className="section-heading"><h2>Koneksi</h2><button className="text-action" type="button" disabled={checking} onClick={() => { void live.refetch(); void ready.refetch(); }}><RefreshCw size={16} className={checking ? "animate-spin" : ""}/>{checking ? "Memeriksa" : "Periksa lagi"}</button></div><div className="surface grouped-list">{[{name:"Layanan KashFlow",description:"Mengambil dan menyimpan transaksi",icon:Server,query:live},{name:"Penyimpanan data",description:"Ketersediaan database",icon:Database,query:ready}].map(({name,description,icon:Icon,query}) => <div key={name} className="setting-row"><span className="row-icon"><Icon size={21}/></span><div><h3>{name}</h3><p>{description}</p></div><span className={`status-label ${query.isError ? "status-danger" : ""}`}>{query.isFetching ? "Memeriksa…" : query.isError ? "Tidak terhubung" : "Terhubung"}</span></div>)}</div>{checkedAt > 0 && <p className="section-footnote">Terakhir diperiksa {new Date(checkedAt).toLocaleTimeString("id-ID")}</p>}</section>
    <section><div className="section-heading"><h2>Akun</h2></div><div className="surface grouped-list"><div className="setting-row"><span className="user-avatar">{(user?.email || "AK").slice(0,2).toUpperCase()}</span><div><h3>Akun yang digunakan</h3><p>{user?.email || "Sesi pengguna"}</p></div></div><button className="setting-logout" type="button" onClick={() => void logout()}><LogOut size={19}/>Keluar dari akun</button></div><p className="section-footnote">Kamu perlu masuk kembali untuk membuka data keuangan.</p></section>
  </div>;
}
