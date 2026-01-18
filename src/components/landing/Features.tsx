"use client";

import { MessageCircle, Palette, Code2, Users } from "lucide-react";

const features = [
  { title: "Real-time Messaging", desc: "Instantly chat with your customers from your dashboard.", icon: MessageCircle, color: "text-blue-500", bg: "bg-blue-50" },
  { title: "Deep Customization", desc: "Match your brand with custom colors, logos, and names.", icon: Palette, color: "text-purple-500", bg: "bg-purple-50" },
  { title: "Easy Installation", desc: "Just copy and paste a single script tag into your website.", icon: Code2, color: "text-emerald-500", bg: "bg-emerald-50" },
  { title: "Multi-Workspace", desc: "Manage support for multiple businesses from one account.", icon: Users, color: "text-orange-500", bg: "bg-orange-50" },
];

export function Features() {
  return (
    <section id="features" className="py-24 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl font-bold text-gray-900">Everything you need</h2>
          <p className="text-gray-500 font-medium max-w-xl mx-auto">HelpDeck is designed to be simple for you and seamless for your customers.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <div key={i} className="card p-8 group hover:border-blue-500 transition-all bg-white text-gray-900 border-gray-200">
              <div className={`${f.bg} ${f.color} w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <f.icon size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
