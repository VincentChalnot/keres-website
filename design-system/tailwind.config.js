/** Config used to build the style guide and dist/keres.css. */
module.exports = {
  presets: [require('./tailwind.preset')],
  content: ['./styleguide/**/*.html', './src/**/*.css'],
  // The CSS ships every component; utilities are only generated for what the
  // consumers' own templates use.
  safelist: [],
};
