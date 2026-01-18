"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

const plans = [
  { name: "Free", price: "0", features: ["1 Workspace", "Standard Customization", "Basic Interface", "Email Support"], current: true },
  { name: "Pro", price: "19", features: ["Unlimited Workspaces", "Full Branding Removal", "Detailed Analytics", "Priority Support"], current: false },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl font-bold text-gray-900">Simple, fair pricing</h2>
          <p className="text-gray-500 font-medium max-w-xl mx-auto">Start for free and stay for as long as you want. Upgrade for power features.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((p, i) => (
            <div key={i} className={`card p-10 flex flex-col ${p.name === 'Pro' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900 border-gray-200'}`}>
              <h3 className="text-xl font-bold mb-1">{p.name}</h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black">${p.price}</span>
                <span className={`${p.name === 'Pro' ? 'text-gray-400' : 'text-gray-500'}`}>/month</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm font-medium">
                    <Check size={18} className="text-blue-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/admin">
                <Button className="w-full h-12 rounded-xl" variant={p.name === 'Pro' ? 'primary' : 'secondary'}>Get Started</Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
