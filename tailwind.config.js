/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@vchalnot/keres-design-system/tailwind.preset")],
  content: [
    "./layouts/**/*.html",
    "./i18n/**/*.toml",
    // Keeps every component class the design system defines (they are @apply-ed there).
    "./node_modules/@vchalnot/keres-design-system/src/**/*.css",
  ],
};
