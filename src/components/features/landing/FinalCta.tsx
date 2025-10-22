import { Button } from "@/components/ui/button"
import { FINAL_CTA } from "@/lib/content/landing"
import { Reveal } from "@/components/ui/Reveal"
import { CheckCircle2, ArrowRight } from "lucide-react"

export function FinalCta() {
  return (
    <section id="get-started" className="bg-gradient-to-b from-gray-50 to-white border-y">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-center">
          <Reveal delayMs={80} className="md:col-span-2">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">{FINAL_CTA.headline}</h3>
            <p className="mt-3 text-lg text-gray-600 leading-relaxed">{FINAL_CTA.subheadline}</p>
            <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FINAL_CTA.points?.map((p) => (
                <li key={p} className="flex items-center gap-3">
                  <div className="size-5 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="size-3 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{p}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal direction="left" delayMs={200} className="text-center">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <p className="text-sm font-medium text-gray-600 mb-1">Experience the platform</p>
              <div className="text-2xl font-bold text-gray-900 mb-4">Start Free Today</div>
              <Button className="mt-2 h-12 w-full px-6 text-base bg-yellow-400 text-black hover:bg-yellow-500 shadow-md hover:shadow-lg transition-all duration-200 group">
                <span className="flex items-center justify-center">
                  {FINAL_CTA.ctaText}
                  <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
              <p className="mt-3 text-xs text-gray-500">No commitment required</p>
              
              {/* Trust indicators */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="size-2 bg-green-500 rounded-full" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="size-2 bg-blue-500 rounded-full" />
                    <span>Verified</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="size-2 bg-yellow-500 rounded-full" />
                    <span>Trusted</span>
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


