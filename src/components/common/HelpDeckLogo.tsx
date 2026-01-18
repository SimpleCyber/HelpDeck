import React from "react";

export const HelpDeckLogo = ({ className = "w-8 h-8", textClassName = "text-xl" }: { className?: string, textClassName?: string }) => {
  return (
    <div className="flex items-center gap-2">
      <div className={`${className} bg-white rounded-full flex items-center justify-center font-bold overflow-hidden border border-gray-200 dark:border-gray-700`}>
        <img src="/helpdeck.png" alt="HelpDeck Logo" className="w-full h-full object-cover" />
      </div>
      <span className={`font-black  ${textClassName} text-blue-900 tracking-tight`}>HelpDeck</span>
    </div>
  );
};
