"use client"

import { useState } from "react"
import { HOW_IT_WORKS_ADMIN } from "@/lib/content/landing"
import { Calendar, ScanLine, BarChart3, CheckCircle2, Shield } from "lucide-react"
import { Reveal } from "@/components/ui/Reveal"

export function HowItWorks() {
  const icons = [Calendar, ScanLine, BarChart3]
  const videos = ["/mp4/type.mp4", "/mp4/scan.mp4", "/mp4/analytics.mp4"]
  const [activeIdx, setActiveIdx] = useState<number>(0)

  return (
    <section id="how-it-works-admin" className="relative bg-gradient-to-b from-white to-gray-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.03),transparent_60%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Header + Timeline (left column) */}
        <Reveal delayMs={80} className="lg:col-span-1 order-2 lg:order-1">
          <div className="mb-4 sm:mb-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 border border-primary-200 text-primary-800 text-sm font-medium mb-3">
              <Shield className="size-3" />
              <span>For Event Organizers</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Manage events effortlessly in 3 steps</h2>
          </div>
          <ol className="relative ml-1 pl-5 sm:ml-2 sm:pl-6 border-l border-gray-200 space-y-2 sm:space-y-3">
            {HOW_IT_WORKS_ADMIN.map((s, idx) => {
              const Icon = icons[idx] ?? CheckCircle2
              return (
                <li key={s.title} className="relative select-none">
                  <span className={`absolute -left-[11px] sm:-left-[13px] mt-2 sm:mt-3 inline-flex items-center justify-center size-5 sm:size-6 rounded-full text-[10px] sm:text-xs font-bold ring-8 ring-white shadow-sm transition-all duration-200 ${activeIdx === idx ? "bg-primary-500 text-white" : "bg-gray-300 text-gray-600"}`}>{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => setActiveIdx(idx)}
                    aria-pressed={activeIdx === idx}
                    className={`w-full text-left flex items-center gap-3 rounded-xl p-2 sm:p-3 transition-all duration-200 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/50 ${activeIdx === idx ? "bg-primary-50 border border-primary-200" : "bg-transparent"}`}
                  >
                    <span className={`mt-0.5 inline-flex items-center justify-center size-7 sm:size-8 rounded-xl transition-all duration-200 ${activeIdx === idx ? "bg-primary-500 text-white shadow-sm" : "bg-primary-100 text-primary-600"}`}>
                      <Icon className="size-4" />
                    </span>
                    <h4 className="font-bold text-sm sm:text-base text-gray-900">{s.title}</h4>
                  </button>
                </li>
              )
            })}
          </ol>
        </Reveal>

        {/* Device mock */}
        <Reveal direction="left" delayMs={200} className="lg:col-span-2 order-1 lg:order-2">
          {/* Desktop/Tablet View */}
          <div className="hidden sm:block aspect-[16/9] w-full rounded-2xl border bg-white shadow-lg p-4 sm:p-6 overflow-hidden">
            <div className="h-full w-full rounded-xl bg-gray-50 border p-4 grid grid-rows-[auto_1fr] overflow-hidden">
              {/* Top bar */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-red-400 shadow-sm" />
                  <span className="size-2 rounded-full bg-yellow-400 shadow-sm" />
                  <span className="size-2 rounded-full bg-green-400 shadow-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2 bg-primary-500 rounded-full animate-pulse" />
                  <div className="text-xs text-gray-500 font-medium">Admin View</div>
                </div>
              </div>
              {/* Screen */}
              <div className="mt-4 grid grid-cols-2 gap-4 min-h-0">
                <div className="space-y-3 min-h-0">
                  {HOW_IT_WORKS_ADMIN.map((s, idx) => (
                    <div
                      key={s.title}
                      className={`rounded-xl border p-2 sm:p-3 transition-all duration-200 ${activeIdx === idx ? "bg-primary-50 border-primary-200 shadow-sm" : "bg-white border-gray-200"}`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`size-4 transition-colors ${activeIdx === idx ? "text-primary-600" : "text-green-500"}`} />
                        <p className="text-xs sm:text-sm font-bold text-gray-900">{idx + 1}. {s.title}</p>
                      </div>
                      <p className="text-[11px] sm:text-xs text-gray-600 mt-1">{s.body}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center min-h-0">
                  <div className="relative w-full max-w-sm aspect-[4/3] rounded-xl border bg-white shadow-md overflow-hidden mx-auto">
                    <video 
                      key={videos[activeIdx]} 
                      src={videos[activeIdx]} 
                      autoPlay 
                      loop 
                      muted 
                      playsInline 
                      className="object-contain absolute inset-0 h-full w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile View - Simplified */}
          <div className="sm:hidden">
            <div className="relative w-full max-w-sm mx-auto aspect-[3/4] rounded-2xl border bg-white shadow-lg overflow-hidden">
              <video 
                key={videos[activeIdx]} 
                src={videos[activeIdx]} 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="object-cover absolute inset-0 h-full w-full"
              />
              {/* Mobile overlay with step info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <div className="text-white">
                  <div className="text-sm font-bold mb-1">{HOW_IT_WORKS_ADMIN[activeIdx]?.title}</div>
                  <div className="text-xs opacity-90">{HOW_IT_WORKS_ADMIN[activeIdx]?.body}</div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
        </div>
      </div>
    </section>
  )
}
