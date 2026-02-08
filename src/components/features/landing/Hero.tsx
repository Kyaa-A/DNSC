import Link from "next/link";
import Image from "next/image";

import { Reveal } from "@/components/ui/Reveal";
import { HERO } from "@/lib/content/landing";
import {
  ArrowRight,
  CheckCircle,
  Users,
  Clock,
  BarChart3,
  Zap,
} from "lucide-react";

export function Hero() {
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 min-h-[calc(100vh-4rem)] flex items-center"
      id="home"
    >
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-400/10 rounded-full blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center w-full">
        {/* Left Content */}
        <Reveal delayMs={80}>
          <div className="space-y-4 sm:space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 border border-primary-200 text-primary-800 text-sm font-medium">
              <Zap className="size-4" />
              <span>Trusted by Davao del Norte State College</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
              <span className="text-gray-900">Modernizing Event</span>
              <br />
              <span className="text-gray-900">Attendance, </span>
              <span className="text-primary-600">Effortlessly.</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
              Launch events, scan arrivals, and see attendance update in real‑time — all in one modern dashboard.
            </p>

            {/* Feature List - Hidden on mobile */}
            <ul className="hidden sm:grid grid-cols-1 sm:grid-cols-2 gap-3">
              <li className="flex items-center gap-3 p-3 rounded-lg bg-primary-50/50 border border-primary-100">
                <div className="size-6 rounded-full bg-primary-500 flex items-center justify-center">
                  <Clock className="size-3 text-white" />
                </div>
                <span className="text-sm text-gray-700 font-medium">
                  Real‑time attendance tracking
                </span>
              </li>
              <li className="flex items-center gap-3 p-3 rounded-lg bg-primary-50/50 border border-primary-100">
                <div className="size-6 rounded-full bg-primary-500 flex items-center justify-center">
                  <CheckCircle className="size-3 text-white" />
                </div>
                <span className="text-sm text-gray-700 font-medium">
                  QR code check‑ins
                </span>
              </li>
              <li className="flex items-center gap-3 p-3 rounded-lg bg-primary-50/50 border border-primary-100">
                <div className="size-6 rounded-full bg-primary-500 flex items-center justify-center">
                  <Users className="size-3 text-white" />
                </div>
                <span className="text-sm text-gray-700 font-medium">
                  One dashboard for every event
                </span>
              </li>
              <li className="flex items-center gap-3 p-3 rounded-lg bg-primary-50/50 border border-primary-100">
                <div className="size-6 rounded-full bg-primary-500 flex items-center justify-center">
                  <BarChart3 className="size-3 text-white" />
                </div>
                <span className="text-sm text-gray-700 font-medium">
                  Exportable reports
                </span>
              </li>
            </ul>

            {/* Simplified mobile feature list */}
            <div className="sm:hidden flex flex-wrap gap-2 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1">
                <CheckCircle className="size-3 text-primary-600" />
                QR Check-ins
              </span>
              <span className="text-gray-400">•</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3 text-primary-600" />
                Real-time
              </span>
              <span className="text-gray-400">•</span>
              <span className="inline-flex items-center gap-1">
                <BarChart3 className="size-3 text-primary-600" />
                Reports
              </span>
            </div>

            {/* CTA Button */}
            <div className="pt-2">
              <Link 
                href="/join" 
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 group bg-primary-600 text-white hover:bg-primary-700"
              >
                Get My QR Code
                <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </div>
          </div>
        </Reveal>

        {/* Right Content - Image with floating elements */}
        <Reveal direction="left" delayMs={160} className="relative">
          <div className="relative">
            {/* Preview Image */}
            <div className="relative aspect-[4/3] w-full rounded-xl border bg-neutral-50 overflow-hidden shadow-xl">
              <Image
                src={HERO.imageSrc}
                alt="Attendance dashboard preview"
                fill
                priority
                className="object-cover object-bottom"
              />
            </div>

            {/* Floating Stats Cards */}
            <div
              className="hidden sm:block absolute -top-4 -left-6 bg-white rounded-lg p-3 shadow-lg border animate-bounce z-10"
              style={{ animationDuration: "3s" }}
            >
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="size-4 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">98%</div>
                  <div className="text-xs text-gray-500">Accuracy</div>
                </div>
              </div>
            </div>

            <div
              className="hidden sm:block absolute -bottom-4 -right-6 bg-white rounded-lg p-3 shadow-lg border animate-bounce z-10"
              style={{ animationDuration: "4s", animationDelay: "1s" }}
            >
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <Clock className="size-4 text-primary-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">&lt;5s</div>
                  <div className="text-xs text-gray-500">Check-in</div>
                </div>
              </div>
            </div>

            <div className="hidden md:block absolute top-1/4 -right-8 bg-white rounded-lg p-2 shadow-lg border animate-pulse z-10">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="size-3 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">500+</div>
                  <div className="text-xs text-gray-500">Users</div>
                </div>
              </div>
            </div>

            {/* Background Floating Elements */}
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-primary-400/20 rounded-full blur-xl animate-pulse" />
            <div
              className="absolute -bottom-6 -left-6 w-12 h-12 bg-secondary-400/20 rounded-full blur-lg animate-pulse"
              style={{ animationDelay: "2s" }}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
