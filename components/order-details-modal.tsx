"use client"

import { X } from "lucide-react"

interface OrderDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  customerName: string
  email: string
  onVerify?: () => void
  onReject?: () => void
}

export default function OrderDetailsModal({
  isOpen,
  onClose,
  customerName,
  email,
  onVerify,
  onReject,
}: OrderDetailsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[rgba(55,50,47,0.08)]">
          <h2 className="text-xl font-sans font-semibold text-[#37322F]">Order Details</h2>
          <button onClick={onClose} className="p-1 hover:bg-[rgba(55,50,47,0.05)] rounded-lg transition-colors">
            <X size={20} className="text-[#37322F]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-8">
          {/* Product Details Section */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[#37322F] font-sans font-semibold">Product Information</h3>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-[rgba(55,50,47,0.08)] rounded-lg flex-shrink-0"></div>
              <div className="flex flex-col gap-3 flex-1">
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans">Product Name</p>
                  <p className="text-sm text-[#37322F] font-sans font-medium">Premium Sneakers</p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans">Quantity</p>
                  <p className="text-sm text-[#37322F] font-sans font-medium">2</p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans">Price</p>
                  <p className="text-sm text-[#37322F] font-sans font-medium">$299.99</p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Details Section */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[#37322F] font-sans font-semibold">Customer Information</h3>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans">Full Name</p>
                <p className="text-sm text-[#37322F] font-sans">{customerName}</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans">Email</p>
                <p className="text-sm text-[#37322F] font-sans">{email}</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans">Shipping Address</p>
                <p className="text-sm text-[#37322F] font-sans">123 Main Street, New York, NY 10001</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 p-6 border-t border-[rgba(55,50,47,0.08)]">
          <button
            onClick={onVerify}
            className="flex-1 px-4 py-2 bg-[#37322F] text-white rounded-full font-sans font-medium text-sm hover:bg-[#2a2622] transition-colors"
          >
            Verify Order
          </button>
          <button
            onClick={onReject}
            className="flex-1 px-4 py-2 bg-white border border-[rgba(55,50,47,0.20)] text-[#37322F] rounded-full font-sans font-medium text-sm hover:bg-[rgba(55,50,47,0.02)] transition-colors"
          >
            Reject Order
          </button>
        </div>
      </div>
    </div>
  )
}
