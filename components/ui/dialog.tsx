"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const DialogTitleId = React.createContext<string | undefined>(undefined);

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const dialog = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();
  React.useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    if (open) {
      element?.showModal();
      document.body.style.overflow = "hidden";
    } else {
      element?.close();
    }
    return () => {
      document.body.style.overflow = previousOverflow;
      element?.close();
    };
  }, [open]);

  return (
    <DialogTitleId.Provider value={titleId}>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className="app-dialog"
        onCancel={() => onOpenChange(false)}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            onOpenChange(false);
        }}
      >
        {open ? children : null}
      </dialog>
    </DialogTitleId.Provider>
  );
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 pb-4", className)}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  children,
  onClose,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { onClose?: () => void }) {
  const titleId = React.useContext(DialogTitleId);
  return (
    <div className="flex items-center justify-between">
      <h2
        id={titleId}
        className={cn(
          "text-lg font-semibold leading-none tracking-tight",
          className,
        )}
        {...props}
      >
        {children}
      </h2>
      {onClose && (
        <button
          type="button"
          aria-label="Tutup dialog"
          onClick={onClose}
          className="icon-button"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-slate-500 dark:text-slate-400", className)}
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 gap-2",
        className,
      )}
      {...props}
    />
  );
}
