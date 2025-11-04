"use client"

import type React from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/auth"
import { useState } from "react"
import { EmailIcon } from "./components/emailIcon"
import { LockIcon } from "./components/LockIcon"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { ArrowRight, XIcon, Eye, EyeOff } from "lucide-react"
import { Users, Wrench, Warehouse, ClipboardList, Calendar, FileText, ShieldCheck, Package } from "lucide-react"

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={`fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 ${className || ""}`}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={`fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-2xl border p-6 shadow-lg duration-200 sm:max-w-lg bg-white data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 ${className || ""}`}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none"
          >
            <XIcon className="w-4 h-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={`flex flex-col gap-2 text-center sm:text-left ${className || ""}`}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={`text-3xl leading-none font-semibold ${className || ""}`}
      {...props}
    />
  )
}

function Signin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await signIn(email, password)
    if (success) {
      console.log("success")
      navigate("/overview")
    }
  }

  const platformFeatures = [
    {
      title: "Operations",
      items: [
        { icon: Users, label: "Operator Rounds" },
        { icon: ClipboardList, label: "Shift Handover" },
        { icon: FileText, label: "Digital Work Instructions" },
      ],
    },
    {
      title: "Maintenance",
      items: [
        { icon: Wrench, label: "Mobile Maintenance" },
        { icon: Calendar, label: "Planning & Scheduling" },
        { icon: FileText, label: "Digital Forms" },
        { icon: ShieldCheck, label: "Electronic Permitting" },
      ],
    },
    {
      title: "Warehouse",
      items: [
        { icon: Warehouse, label: "Mobile Warehouse" },
        { icon: Package, label: "Kitting & Staging" },
      ],
    },
  ]

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url(/man.jpg)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex items-start pt-12 md:pt-16 px-7 md:px-8 lg:px-8">
        <div className="w-full max-w-4xl ml-[3%]">
          {/* Semi-transparent container for header and cards */}
          <div
            className="bg-[#0A1931]/30 backdrop-blur-sm rounded-3xl p-8 md:p-10 lg:p-8 animate-fade-in-up"
            style={{ animationDelay: "0.15s", animationFillMode: "both" }}
          >
            {/* Header */}
            <div className="animate-fade-in-up text-center mb-8" style={{ animationDelay: "0.1s" }}>
              <p className="text-[#FDD835] text-xl md:text-xl font-bold tracking-wider">CONNECTED WORKER PLATFORM</p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-4">
              {platformFeatures.map((category, categoryIndex) => (
                <div
                  key={category.title}
                  className="bg-[#1A3D63]/70 backdrop-blur-md rounded-2xl p-4 border border-[#4A7FA7]/20 animate-slide-in-scale shadow-xl hover:shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-500 ease-out hover:border-[#4A7FA7]/50 hover:bg-[#1A3D63]/85 animate-float"
                  style={{
                    animationDelay: `${0.2 + categoryIndex * 0.15}s`,
                    animationFillMode: "both",
                  }}
                >
                  <p
                    className="text-[#FDD835] text-lg lg:text-2xl font-bold mb-4 animate-fade-in"
                    style={{ animationDelay: `${0.3 + categoryIndex * 0.15}s` }}
                  >
                    {category.title}
                  </p>
                  <div className="space-y-3">
                    {category.items.map((item, itemIndex) => {
                      const Icon = item.icon
                      return (
                        <div
                          key={itemIndex}
                          className="flex items-center gap-3 text-white animate-fade-in-right hover:translate-x-1 transition-transform duration-300"
                          style={{
                            animationDelay: `${0.4 + categoryIndex * 0.15 + itemIndex * 0.1}s`,
                            animationFillMode: "both",
                          }}
                        >
                          <div className="w-10 h-10 rounded-full bg-[#6B9DC4]/40 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-[#4A7FA7]/30 hover:bg-[#6B9DC4]/60 hover:scale-110 transition-all duration-300">
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                          <span className="text-xl font-medium">{item.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sign In Button */}
          <div
            className="animate-fade-in-up text-center mt-8"
            style={{ animationDelay: "0.8s", animationFillMode: "both" }}
          >
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#4A7FA7] hover:bg-[#1A3D63] text-white font-semibold py-5 px-10 rounded-2xl text-lg transition-all duration-300 inline-flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
            >
              <ArrowRight className="w-6 h-6" />
              Sign In to Platform
            </button>
          </div>
        </div>
      </div>

      {/* Sign In Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border-[#4A7FA7]/20 p-8">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-[#0A1931] text-center mb-2">Sign In</DialogTitle>
            <p className="text-sm text-gray-500 text-center">Welcome back! Please enter your credentials</p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div className="space-y-5">
              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-[#0A1931]">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <EmailIcon color="#4A7FA7" width={20} height={20} />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A7FA7] focus:border-[#4A7FA7] transition-all bg-gray-50 hover:bg-white hover:border-[#4A7FA7]/40"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-[#0A1931]">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <LockIcon color="#4A7FA7" width={20} height={20} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A7FA7] focus:border-[#4A7FA7] transition-all bg-gray-50 hover:bg-white hover:border-[#4A7FA7]/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4A7FA7] hover:text-[#1A3D63] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-[#4A7FA7] hover:text-[#1A3D63] transition-colors font-medium"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#4A7FA7] hover:bg-[#1A3D63] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              Log In
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInScale {
          from {
            opacity: 0;
            transform: translateX(-80px) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }

        .animate-slide-in-scale {
          animation: slideInScale 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
          animation-fill-mode: both;
        }

        .animate-fade-in-right {
          animation: fadeInRight 0.5s ease-out;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-float:nth-child(2) {
          animation-delay: 0.5s;
        }

        .animate-float:nth-child(3) {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  )
}

export default Signin
