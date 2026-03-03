#!/usr/bin/env node

/**
 * OpenGraph Image Generation Helper
 *
 * This script provides instructions for generating the PNG version
 * of the OpenGraph social sharing image from the SVG source.
 *
 * The SVG source file has been updated with OpenQase brand colors
 * (warm amber/dark navy theme) to match the site's visual identity.
 */

console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                  OpenGraph Image Generation                        ║
╚═══════════════════════════════════════════════════════════════════╝

📄 Source: public/og-image.svg (updated with brand colors)
🎨 Target: public/og-image.png (1200x630px)
🎯 Purpose: Social media sharing (Twitter, LinkedIn, Facebook, Slack)

BRAND COLORS USED:
------------------
✓ Background: Deep navy gradient (#0d0f14 → #111318)
✓ Primary accent: Warm amber (#d4a574)
✓ Light accent: Lighter amber (#dfc09a)
✓ Text: Warm grays (#c4bfbf, #918a8a)

CONVERSION OPTIONS:
-------------------

1️⃣  ONLINE CONVERTER (Easiest):
   • Go to: https://svgtopng.com/
   • Upload: public/og-image.svg
   • Set dimensions: 1200x630 pixels
   • Download and save as: public/og-image.png

2️⃣  IMAGEMAGICK (Command Line):
   Install: brew install imagemagick (Mac) or apt-get install imagemagick (Linux)

   Convert command:
   $ convert public/og-image.svg -resize 1200x630 -quality 90 public/og-image.png

3️⃣  DESIGN TOOL (Figma, Sketch, Illustrator):
   • Open public/og-image.svg
   • Export as PNG: 1200x630px, 72 DPI
   • Save as public/og-image.png

4️⃣  BROWSER SCREENSHOT:
   • Open public/og-image.svg in Chrome/Firefox
   • Set DevTools device dimensions to 1200x630
   • Take screenshot
   • Save as public/og-image.png

TESTING:
--------
After generating the PNG, test on social media validators:

• Twitter: https://cards-dev.twitter.com/validator
• LinkedIn: https://www.linkedin.com/post-inspector/
• Facebook: https://developers.facebook.com/tools/debug/

DETAILED DOCUMENTATION:
-----------------------
See: docs/content-drafts/OG-IMAGE-GENERATION-INSTRUCTIONS.md

═══════════════════════════════════════════════════════════════════

Next Steps:
1. Generate PNG using one of the options above
2. Verify dimensions (1200x630px) and file size (<300KB)
3. Test with social media validators
4. Commit: git add public/og-image.png
5. Deploy and verify on production

`);
