import React, { useState, useEffect } from "react";

const getTheme = () => {
  if (typeof window === "undefined") return "light";
  const storedTheme = localStorage.getItem("theme");
  if (storedTheme) return storedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

function AppearanceTab() {
  const [theme, setTheme] = useState("light"); // State to hold current theme

  // Set theme on initial load
  useEffect(() => {
    setTheme(getTheme());
  }, []);

  // Update DOM and localStorage when theme changes
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <div className="max-w-3xl p-5 border border-gray-200 rounded-lg">
      <h3 className="text-xl font-semibold mb-6">Theme</h3>
      
      <p className="text-gray-600 mb-4">
        Choose how your Sahakari dashboard looks.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        {["Light", "Dark", "System"].map((mode) => (
          <button
            key={mode}
            onClick={() => setTheme(mode.toLowerCase())}
            className={`
              flex-1 p-4 border-2 rounded-lg text-left transition-all
              ${
                theme === mode.toLowerCase()
                  ? "border-teal-500 bg-teal-50"
                  : "border-gray-300 hover:border-gray-400"
              }
            `}
          >
            <span className="font-semibold block">{mode}</span>
            <span className="text-sm text-gray-500">
              {mode === "System" 
                ? "Follow your device's theme." 
                : `Use ${mode.toLowerCase()} mode.`
              }
            </span>
          </button>
        ))}
      </div>

    </div>
  );
}

export default AppearanceTab;