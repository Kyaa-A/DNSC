import Image from "next/image"
import { FEATURES } from "@/lib/content/landing"
import { Check } from "lucide-react"
import { Reveal } from "@/components/ui/Reveal"

export function Features() {
  return (
    <section id="features" className="relative bg-gradient-to-b from-primary-50/50 to-white border-y">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.03),transparent_60%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="text-center md:text-left">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">Common Problems Students & Event Organizers Face</h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto md:mx-0">Traditional attendance methods create unnecessary challenges that waste time and compromise accuracy.</p>
        </div>
        <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delayMs={120 + i * 120}>
            <div className="group relative overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col">
              <div className="absolute -right-10 -top-10 size-24 rounded-full bg-primary-400/10 blur-xl group-hover:bg-primary-400/15 transition-colors" />
              <div className="p-6 flex-1 flex flex-col">
                <div className="h-36 w-full rounded-xl bg-gradient-to-br from-primary-50 to-neutral-100 mb-4 flex items-center justify-center border transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-md">
                  <Image src={f.iconSrc} alt={f.iconAlt ?? f.title} width={96} height={96} className="transition-transform group-hover:scale-105" />
                </div>
                <div className="flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-gray-800 transition-colors">{f.title}</h3>
                  <p className="mt-2 text-gray-600 text-sm leading-relaxed flex-1">{f.description}</p>
                  {f.bullets && (
                    <ul className="mt-4 space-y-2">
                      {f.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-3 text-sm text-gray-700">
                          <div className="size-5 rounded-full bg-primary-100 flex items-center justify-center">
                            <Check className="size-3 text-primary-600" />
                          </div>
                          <span className="font-medium">{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="h-1 w-0 bg-gradient-to-r from-primary-400 to-primary-500 transition-all duration-500 group-hover:w-full" />
            </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
