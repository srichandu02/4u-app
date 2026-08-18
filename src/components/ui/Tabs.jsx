import React from "react";

export function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex border-b border-[#38316E] w-full">
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 py-3 text-xs font-semibold f-body transition-colors relative cursor-pointer text-center ${
              active ? "text-[#FF6B4A]" : "text-[#A6A1CC] hover:text-[#F5F3FF]"
            }`}
          >
            {tab.label}
            {active && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B4A] rounded-t-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
