const plugins = {
  '@tailwindcss/postcss': {},
};

// Autoprefixer optional hinzufügen, falls installiert
try {
  require.resolve('autoprefixer');
  plugins.autoprefixer = {};
} catch (e) {
  // autoprefixer nicht gefunden - wird übersprungen
}

module.exports = {
  plugins,
};



