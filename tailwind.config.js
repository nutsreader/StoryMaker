/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#080b13",
        panel: "#0d1220",
        panel2: "#11182a",
        line: "#202a40",
        purpleAccent: "#a354ff",
        blueAccent: "#685cff",
        greenAccent: "#4dd6a2",
      },
    },
  },
  plugins: [],
};