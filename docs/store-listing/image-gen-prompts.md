# Serial Air — Image Generation Prompts

Use these prompts with Midjourney, DALL-E, Stable Diffusion, or similar tools.
For screenshot mockups, use the HTML files in `website/screenshots/` instead.

---

## App Icon Prompt

```
Minimal flat app icon, dark navy background (#1A1A2E), single orange (#FF6B35) radio wave / signal icon in the center, 3 curved lines emanating from a small dot, subtle glow effect, rounded square iOS app icon shape, no text, clean vector style, professional developer tool aesthetic
```

```
App icon for "Serial Air" - wireless serial monitor app. Dark navy (#1A1A2E) background with vibrant orange (#FF6B35) antenna/signal symbol. Minimalist, flat design. iOS rounded rectangle shape. No text. Professional, developer-focused aesthetic.
```

---

## App Store Screenshot Backgrounds

### Gradient Background (for all screenshots)
```
Dark abstract gradient background, deep navy (#1A1A2E) transitioning to near-black (#0D0D17), subtle circuit board or PCB trace pattern very faintly visible, no text, no UI elements, clean and dark, suitable as background for app store marketing screenshots
```

---

## Feature Graphics / Social Cards

### Hero Banner (for website, social)
```
Dark tech banner showing a glowing iPhone displaying a terminal/serial monitor interface with orange accent (#FF6B35). ESP32 microcontroller board visible nearby connected via WiFi waves (no cables). Dark navy background (#1A1A2E). Text: "Serial Air - Wireless Serial Monitor". Clean, minimal, developer aesthetic. 16:9 aspect ratio.
```

### Twitter/X Card
```
Dark minimal tech card, split view: left side shows a small ESP32 board with WiFi waves emanating, right side shows an iPhone with dark terminal interface glowing orange. Tagline "Debug wirelessly." Dark navy background. 1200x628px social media card format.
```

---

## Stitch Composite Prompts

### 3-Phone Stitch (Primary marketing image)
```
Three iPhone 15 Pro mockups side by side on dark navy gradient background (#0D0D17 to #1A1A2E). Left phone shows a device list with green online dots. Center phone shows a terminal with color-coded log lines (green, yellow, red text on dark background). Right phone shows a pricing screen with orange button. "Serial Air" logo above. Subtle orange glow accents. Clean, premium app store marketing image. Ultra realistic mockup render.
```

### Single Phone Hero (For website hero section)
```
Single iPhone 15 Pro floating at slight angle on dark navy background, screen showing a dark terminal interface with monospace text in multiple colors (green, blue, yellow, white on black). Orange (#FF6B35) accent on buttons. Subtle reflection below phone. Photorealistic device mockup. Premium app marketing render.
```

---

## Physical Context Photos (lifestyle shots)

### Maker Workspace
```
Top-down photo of a maker's desk: iPhone showing a dark terminal app with orange accents, next to a breadboard with an ESP32 microcontroller, jumper wires, USB cable coiled nearby (but NOT connected to the phone). LED strip partially visible. Dark wood desk. Warm ambient lighting. No laptop visible - emphasizing wireless debugging from phone only.
```

### IoT Deployment
```
A person's hand holding an iPhone showing a dark serial monitor app with green "CONNECTED" badge, in front of an electronics enclosure mounted on a wall. The enclosure has a small ESP board with blinking LED visible through a transparent section. Indoor setting, slightly dim lighting. Emphasizing remote/deployed device monitoring.
```

---

## Notes on HTML Mockup Screenshots

The HTML mockups at `website/screenshots/` are more accurate than AI-generated images
for actual App Store submission. Recommended workflow:

1. Open each HTML file in Chrome (430px viewport width)
2. Use Chrome DevTools → Device Toolbar → set to 1290x2796 (iPhone 6.7")
3. Take screenshot with Cmd+Shift+P → "Capture screenshot"
4. Or use Puppeteer/Playwright for automated capture

### Automated capture script (Node.js + Playwright):
```bash
npx playwright install chromium
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 430, height: 932 });
  const screens = ['01-home', '02-monitor', '03-codegen', '04-paywall', '05-settings'];
  for (const s of screens) {
    await page.goto('file://${process.cwd()}/website/screenshots/${s}.html');
    await page.screenshot({ path: 'screenshots/${s}.png', fullPage: true });
  }
  await browser.close();
})();
"
```

### For the Stitch:
```bash
# Open stitch.html and capture at wider viewport
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 1000 });
  await page.goto('file://${process.cwd()}/website/screenshots/stitch.html');
  await page.screenshot({ path: 'screenshots/stitch.png', fullPage: true });
  await browser.close();
})();
"
```
