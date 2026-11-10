/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './app.js', './admin.html', './admin.js'],
  theme: { extend: { colors: { pearl: '#f7fafc', lagoon: '#35b9b5', midnight: '#183b4b' }, fontFamily: { sans: ['Vazirmatn', 'Tahoma', 'sans-serif'] } } },
  plugins: []
};