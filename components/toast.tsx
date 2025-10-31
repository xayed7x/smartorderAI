"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, AlertCircle, X } from "lucide-react"

interface ToastProps {
  variant: "success" | "error"
  message: string
  onClose: () => void
}

export function Toast({ variant, message, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose()
    }, 4000)

    return () => clearTimeout(timer)
  }, [onClose])

  if (!isVisible) return null

  const isSuccess = variant === "success"
  const bgColor = isSuccess ? "bg-[#E8F5E9]" : "bg-[#FFEBEE]"
  const borderColor = isSuccess ? "border-[#4CAF50]" : "border-[#F44336]"
  const textColor = isSuccess ? "text-[#1B5E20]" : "text-[#B71C1C]"
  const iconColor = isSuccess ? "text-[#4CAF50]" : "text-[#F44336]"

  return (
    <div
      className={`fixed top-6 right-6 z-50 ${bgColor} ${borderColor} border rounded-xl shadow-lg p-4 flex items-center gap-3 max-w-sm animate-slide-in`}
    >
      {isSuccess ? <CheckCircle2 size={20} className={iconColor} /> : <AlertCircle size={20} className={iconColor} />}

      <p className={`${textColor} text-sm font-sans font-medium flex-1`}>{message}</p>

      <button
        onClick={() => {
          setIsVisible(false)
          onClose()
        }}
        className={`${textColor} hover:opacity-70 transition-opacity`}
      >
        <X size={16} />
      </button>
    </div>
  )
}

export function ToastContainer({
  toasts,
  onRemove,
}: { toasts: Array<{ id: string; variant: "success" | "error"; message: string }>; onRemove: (id: string) => void }) {
  return (
    <>
      {toasts.map((toast) => (
        <Toast key={toast.id} variant={toast.variant} message={toast.message} onClose={() => onRemove(toast.id)} />
      ))}
    </>
  )
}
