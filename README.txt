TFHS App (installable web app / PWA)
====================================
Upload ALL of these together (same folder) to your hosting:
  index.html, manifest.json, sw.js, icons/ (4 png files)
  + your existing images/ folder (school-gate.jpg, staff photos etc.)

Must be served over HTTPS (Firebase Hosting, GitHub Pages, Netlify...).
Opening the file directly from the computer (file://) will NOT install as an app.

Install:
  Android/Chrome : open the site -> "📲 অ্যাপ ইন্সটল করুন" button (or menu -> Install app)
  iPhone/Safari  : Share -> Add to Home Screen
  Windows/Chrome : address-bar install icon

After changing index.html later, change VERSION in sw.js (e.g. tfhs-v2) so users get the update.
