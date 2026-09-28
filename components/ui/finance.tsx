import { Plus, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description: ReactNode; actions?: ReactNode }) {
  return <header className="finance-header"><div><p className="finance-eyebrow">Keuangan pribadi</p><h1>{title}</h1><p className="finance-description">{description}</p></div>{actions && <div className="finance-actions">{actions}</div>}</header>;
}
export function AddAction({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button type="button" className="text-action create-action" onClick={onClick} disabled={disabled}><span className="plus-circle"><Plus size={21} /></span>{children}</button>;
}
export function SegmentedControl<T extends string>({ value, onChange, options, label, disabled }: { value: T; onChange: (value: T) => void; options: { value: T; label: string }[]; label: string; disabled?: boolean }) {
  return <div className="segmented-control" role="group" aria-label={label}>{options.map(option => <button key={option.value} type="button" disabled={disabled} aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}</div>;
}
export function LoadError({ children = "Data belum berhasil dimuat.", onRetry }: { children?: ReactNode; onRetry: () => void }) {
  return <div className="load-error" role="alert"><p>{children}</p><button className="text-action" type="button" onClick={onRetry}><RefreshCw size={16} />Coba lagi</button></div>;
}
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="finance-empty"><h3>{title}</h3>{children && <p>{children}</p>}</div>;
}
export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return <div className="list-skeleton" role="status" aria-label="Memuat data">{Array.from({length: rows}, (_, i) => <div key={i} className="skeleton-block" />)}</div>;
}
