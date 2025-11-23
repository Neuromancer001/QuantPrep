import React from 'react';

interface SelectorProps<T> {
  title: string;
  options: T[];
  selected: T;
  onChange: (val: T) => void;
}

// Generic component for selecting options
const Selector = <T extends string>({ title, options, selected, onChange }: SelectorProps<T>) => {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
              ${
                selected === option
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
              }
            `}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Selector;
