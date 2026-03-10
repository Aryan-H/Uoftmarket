
// This file is kept for backward compatibility
// It re-exports the toast from @/components/ui/use-toast
import { toast } from "@/components/ui/use-toast";
export { toast };

// Maintaining the original useToast hook for any components that might still be using it
import { useState, useCallback } from 'react'
import { type ToastT } from 'sonner'

type ToasterToast = ToastT & {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

const useToast = () => {
  const [toasts, setToasts] = useState<ToasterToast[]>([])

  const _toast = useCallback(
    function ({
      ...props
    }: Omit<ToasterToast, "id">) {
      const id = Math.random().toString(36).substring(2, 9)
      setToasts((toasts) => [
        ...toasts,
        { id, ...props },
      ])
      return id
    },
    [setToasts]
  )

  return {
    toast: _toast,
    toasts,
    setToasts,
  }
}

export { useToast }
