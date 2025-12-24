# Walsh Law Site (Folsom + Sacramento)

This is a fully static, responsive, accessible website scaffold for a criminal defense firm.

## How to run locally
1. Download the project folder.
2. Open `index.html` in a browser, or run a local server:
   - Python: `python3 -m http.server 8000`
   - Then open `http://localhost:8000`

## Replace media and images
- `assets/media/home_hero.mp4` is a placeholder loop. Replace it with a licensed video of the firm exterior and attorney interactions.
- Other loops:
  - `assets/media/courthouse_loop.mp4`
  - `assets/media/police_lights_loop.mp4`
- Replace placeholder hero images in `assets/img/hero_*.webp` with licensed photos.

## Update firm details
- Phone number is set to 916 610 3558.
- Footer addresses include placeholders. Replace with verified office addresses before publishing.

## Forms
The consultation form is static and uses a demo submit handler in `assets/js/main.js`.
To make it live, connect the form submit to:
- A server endpoint, or
- A form provider (Netlify Forms, Formspree, etc.)

## Content data
- Case results: `assets/js/data.js` (CASE_RESULTS)
- Reviews: `assets/js/data.js` (REVIEWS)
- Blog list: `assets/js/data.js` (BLOG_POSTS)
