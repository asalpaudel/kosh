import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
const THEMES: ReadonlyArray<{ value: Theme; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

function storedTheme(): Theme {
  const stored = localStorage.getItem("theme");
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

export default function AppearanceTab() {
  const [theme, setTheme] = useState<Theme>(storedTheme);

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", theme === "dark" || (theme === "system" && prefersDark));
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="max-w-3xl p-5 border border-gray-200 rounded-lg">
      <h3 className="text-xl font-semibold mb-6">Theme</h3>
      <p className="text-gray-600 mb-4">Choose how your Sahakari dashboard looks.</p>
      <div className="flex flex-col sm:flex-row gap-4">
        {THEMES.map((option) => (
          <button
            type="button"
            key={option.value}
            onClick={() => { setTheme(option.value); }}
            className={`flex-1 p-4 border-2 rounded-lg text-left transition-all ${theme === option.value ? "border-teal-500 bg-teal-50" : "border-gray-300 hover:border-gray-400"}`}
          >
            <span className="font-semibold block">{option.label}</span>
            <span className="text-sm text-gray-500">
              {option.value === "system" ? "Follow your device's theme." : `Use ${option.value} mode.`}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
