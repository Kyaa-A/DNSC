"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { FAQ } from "@/lib/content/landing"
import { HelpCircle, MessageCircle } from "lucide-react"
import { Reveal } from "@/components/ui/Reveal"
import { cn } from "@/lib/utils"

export function Faq() {
  return (
    <section id="faq" className="bg-gradient-to-b from-white to-gray-50 py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Reveal delayMs={80}>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 border border-primary-200 text-primary-800 text-sm font-medium mb-4">
              <MessageCircle className="size-4" />
              <span>FAQ</span>
            </div>
            <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Frequently Asked Questions</h3>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Quick answers to common questions about the DNSC attendance platform.</p>
          </div>
        </Reveal>
        
        <Reveal delayMs={200}>
          <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50 p-6 sm:p-8">
            <Accordion type="single" collapsible className="space-y-4">
              {FAQ.map((item, idx) => (
                <AccordionItem 
                  key={idx} 
                  value={`item-${idx + 1}`} 
                  className="border border-gray-100 rounded-xl overflow-hidden data-[state=open]:border-primary-200 data-[state=open]:bg-primary-50/30 transition-all duration-200"
                >
                  <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-gray-50/80 transition-colors">
                    <div className="flex items-start gap-4 text-left">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="size-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                          <HelpCircle className="size-4" />
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900 text-lg">{item.q}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0 text-base text-gray-600 leading-relaxed ml-12">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
