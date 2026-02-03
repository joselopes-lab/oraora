"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-4">
              {variant === "destructive" ? (
                <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-1 ring-4 ring-destructive/10">
                  <span className="material-symbols-outlined text-destructive text-3xl">error</span>
                </div>
              ) : (
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1 ring-4 ring-primary/5">
                  <span className="material-symbols-outlined text-primary text-3xl">check_circle</span>
                </div>
              )}
              <div className="grid gap-1 flex-1 pt-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
