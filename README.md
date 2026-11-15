# Fedan website

The source of fedangroup.com. Plain HTML, one stylesheet, one script, and a small build script with no dependencies.

## Where things are

- `src/en/` the English pages. One file per page. The first line holds the page's address (`slug`), title and description; the rest is the page content.
- `src/he/`, `src/ru/` the Hebrew and Russian pages (one page each for now, plus a thank-you page).
- `src/parts/` the enquiry form, one per language. Pages pull it in with `{{enquiry}}`.
- `static/` the stylesheet, the script, images and icons. Copied as they are.
- `build.mjs` puts the header, footer and head tags around every page and writes the finished site to `dist/`. It also writes the sitemap, robots file and redirects, and checks every internal link.
- `dist/` the finished site. Generated; never edit it by hand.

## Change something

1. Edit the page in `src/`.
2. Run `node build.mjs`. It must end with "checks passed".
3. Look at it: `node ../preview-server.mjs site/dist 4175` and open http://localhost:4175.

## Publish

- **With GitHub linked to Netlify:** push to the `main` branch and Netlify builds and publishes. Any other branch gets its own preview address first.
- **By hand:** run the build, then drag the `dist` folder onto Netlify > Deploys.

## Settings worth knowing (top of `build.mjs`)

- `LISTED`: a language is linked and open to Google only when it is `true`. Russian is `false` until a native speaker has read the page.
- `EMAIL`, the footer text, the menus and the redirects are all in the same block.
- The phone and WhatsApp numbers are at the top of `static/script.js`. While the WhatsApp number is empty, WhatsApp links stay hidden.

## Rules

- Nothing is published without Dan.
- British spelling. No spaced hyphens and no em dashes: the build fails if it finds one in the English text.
- No client is named or shown in a way that identifies them.
