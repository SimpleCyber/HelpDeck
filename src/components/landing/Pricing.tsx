"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

const plans = [
  { name: "Free", price: "0", features: ["2 Workspaces", "1 Member / Workspace", "20 Customers", "Community Support"], current: true },
  { name: "Basic", price: "12", features: ["5 Workspaces", "2 Members / Workspace", "100 Customers", "Email Support", "Image Uploads"], current: false },
  { name: "Premium", price: "21", features: ["15 Workspaces", "5 Members / Workspace", "1,000 Customers", "Priority Support", "Image Uploads", "Analytics"], current: false },
  { name: "Enterprise", price: "Custom", features: ["Unlimited Workspaces", "Unlimited Members", "Unlimited Customers", "Dedicated Support", "SLA & SSO"], current: false },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl font-bold text-gray-900">Simple, fair pricing</h2>
          <p className="text-gray-500 font-medium max-w-xl mx-auto">Start for free and stay for as long as you want. Upgrade for power features.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((p, i) => (
            <div key={i} className={`card p-8 flex flex-col ${p.name === 'Premium' ? 'bg-gray-900 text-white border-gray-900 ring-4 ring-blue-500/20' : 'bg-white text-gray-900 border-gray-200'} transition-all hover:scale-105 duration-300`}>
              <h3 className="text-xl font-bold mb-1">{p.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                {p.price !== "Custom" && <span className="text-3xl font-black">$</span>}
                <span className="text-4xl font-black">{p.price}</span>
                {p.price !== "Custom" && <span className={`${p.name === 'Premium' ? 'text-gray-400' : 'text-gray-500'}`}>/mo</span>}
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm font-medium">
                    <Check size={18} className="text-blue-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={p.name === 'Enterprise' ? "mailto:sales@helpdeck.com" : "/admin"}>
                <Button className="w-full h-12 rounded-xl" variant={p.name === 'Premium' ? 'primary' : 'secondary'}>
                  {p.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
