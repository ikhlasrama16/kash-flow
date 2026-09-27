import {
  House,
  List,
  Wallet,
  Tag,
  ChartNoAxesColumn,
  Bell,
  Settings,
} from "lucide-react";
export const navigation = [
  { name: "Ringkasan", href: "/dashboard", icon: House },
  { name: "Aktivitas", href: "/transactions", icon: List },
  { name: "Rekening", href: "/accounts", icon: Wallet },
  { name: "Kategori", href: "/categories", icon: Tag },
  { name: "Analisis", href: "/analytics", icon: ChartNoAxesColumn },
  { name: "Notifikasi", href: "/notifications", icon: Bell },
  { name: "Pengaturan", href: "/settings", icon: Settings },
];
