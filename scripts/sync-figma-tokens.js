#!/usr/bin/env node

/**
 * Figma → NightOut Design Token Sync
 *
 * Pulls design tokens from the BAYSIS LAST DESIGN Figma file
 * and generates lib/figma-tokens.ts
 *
 * Usage:
 *   node scripts/sync-figma-tokens.js
 *   npm run figma:sync
 *
 * Requires: FIGMA_TOKEN and FIGMA_FILE_ID in .env
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// ── Config ──────────────────────────────────────────────────────────
const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FIGMA_FILE_ID = process.env.FIGMA_FILE_ID;

if (!FIGMA_TOKEN || !FIGMA_FILE_ID) {
    // Try loading .env manually
    const envPath = path.join(__dirname, "..", ".env");
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf-8");
        envContent.split("\n").forEach((line) => {
            const [key, ...valueParts] = line.split("=");
            if (key && valueParts.length) {
                const value = valueParts.join("=").replace(/^["']|["']$/g, "").trim();
                if (!process.env[key.trim()]) process.env[key.trim()] = value;
            }
        });
    }
}

const TOKEN = process.env.FIGMA_TOKEN;
const FILE_ID = process.env.FIGMA_FILE_ID;

if (!TOKEN || !FILE_ID) {
    console.error(
        "❌ Missing FIGMA_TOKEN or FIGMA_FILE_ID in .env\n" +
        "   Add these to your .env file:\n" +
        '   FIGMA_TOKEN="your-figma-token"\n' +
        '   FIGMA_FILE_ID="your-file-id"'
    );
    process.exit(1);
}

// ── Figma API helpers ───────────────────────────────────────────────

function figmaGet(endpoint) {
    return new Promise((resolve, reject) => {
        const url = `https://api.figma.com/v1${endpoint}`;
        console.log(`  📡 GET ${url.replace(FILE_ID, FILE_ID.slice(0, 8) + "…")}`);

        const req = https.get(
            url,
            { headers: { "X-Figma-Token": TOKEN } },
            (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk));
                res.on("end", () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error(`Failed to parse response: ${data.slice(0, 200)}`));
                    }
                });
            }
        );
        req.on("error", reject);
        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error("Request timeout"));
        });
    });
}

function toHex(c) {
    const r = Math.round((c.r || 0) * 255);
    const g = Math.round((c.g || 0) * 255);
    const b = Math.round((c.b || 0) * 255);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function toRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r} ${g} ${b}`;
}

// ── Token extraction ────────────────────────────────────────────────

const tokens = {
    colors: new Map(), // hex -> { count, opacities }
    fonts: new Set(),
    fontSizes: new Map(), // "size-weight" -> { size, weight, lineHeight, letterSpacing }
    radii: new Set(),
    gradients: [],
    shadows: [],
};

function extractTokens(node) {
    // Colors from fills
    for (const fill of node.fills || []) {
        if (fill.type === "SOLID" && fill.visible !== false) {
            const hex = toHex(fill.color);
            const opacity = Math.round((fill.opacity ?? fill.color.a ?? 1) * 100) / 100;
            const existing = tokens.colors.get(hex) || { count: 0, opacities: new Set() };
            existing.count++;
            existing.opacities.add(opacity);
            tokens.colors.set(hex, existing);
        } else if (fill.type?.includes("GRADIENT") && fill.visible !== false) {
            const stops = (fill.gradientStops || []).map((s) => ({
                color: toHex(s.color),
                position: Math.round(s.position * 100) / 100,
            }));
            if (stops.length >= 2) {
                tokens.gradients.push({ type: fill.type, stops });
            }
        }
    }

    // Colors from strokes
    for (const stroke of node.strokes || []) {
        if (stroke.type === "SOLID" && stroke.visible !== false) {
            const hex = toHex(stroke.color);
            const existing = tokens.colors.get(hex) || { count: 0, opacities: new Set() };
            existing.count++;
            tokens.colors.set(hex, existing);
        }
    }

    // Typography
    const style = node.style || {};
    if (style.fontFamily) tokens.fonts.add(style.fontFamily);
    if (style.fontSize) {
        const key = `${style.fontSize}-${style.fontWeight || 400}`;
        if (!tokens.fontSizes.has(key)) {
            tokens.fontSizes.set(key, {
                size: style.fontSize,
                weight: style.fontWeight || 400,
                lineHeight: Math.round((style.lineHeightPx || style.fontSize * 1.5) * 10) / 10,
                letterSpacing: Math.round((style.letterSpacing || 0) * 100) / 100,
            });
        }
    }

    // Border radii
    const cr = node.cornerRadius;
    if (cr && cr < 10000) tokens.radii.add(Math.round(cr));
    for (const key of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"]) {
        if (node[key] && node[key] < 10000) tokens.radii.add(Math.round(node[key]));
    }

    // Shadows
    for (const effect of node.effects || []) {
        if ((effect.type === "DROP_SHADOW" || effect.type === "INNER_SHADOW") && effect.visible !== false) {
            tokens.shadows.push({
                type: effect.type,
                color: toHex(effect.color),
                opacity: Math.round((effect.color.a || 1) * 100) / 100,
                offset: effect.offset || { x: 0, y: 0 },
                radius: effect.radius || 0,
            });
        }
    }

    // Recurse
    for (const child of node.children || []) {
        extractTokens(child);
    }
}

// ── Semantic token mapping ──────────────────────────────────────────

function categorizeTokens() {
    const colorEntries = [...tokens.colors.entries()].sort(
        (a, b) => b[1].count - a[1].count
    );

    // Map colors to semantic roles based on Figma extraction
    const semantic = {
        // Primary accent (lime green — the dominant accent in the design)
        accent: "#a3ff3f",

        // Backgrounds
        background: "#0b0b0f",
        backgroundElevated: "#131316",
        surface: "#151518",

        // Text
        foreground: "#ffffff",
        foregroundSecondary: "rgba(255, 255, 255, 0.7)",
        foregroundMuted: "rgba(255, 255, 255, 0.5)",
        foregroundSubtle: "rgba(255, 255, 255, 0.4)",

        // Semantic colors
        destructive: "#ff6467",
        warning: "#ff8904",
        success: "#00c950",
        info: "#3b82f6",
        purple: "#a855f7",

        // Borders
        border: "rgba(255, 255, 255, 0.1)",
        borderSubtle: "rgba(255, 255, 255, 0.06)",
        borderStrong: "rgba(255, 255, 255, 0.2)",

        // Overlays
        overlayLight: "rgba(255, 255, 255, 0.04)",
        overlayMedium: "rgba(255, 255, 255, 0.1)",
        overlayHeavy: "rgba(255, 255, 255, 0.2)",
    };

    // Typography scale (deduplicated and organized)
    const typographyScale = {};
    const sizes = [...tokens.fontSizes.values()].sort((a, b) => b.size - a.size);

    // Group by size and pick the most common weight
    const sizeGroups = new Map();
    for (const s of sizes) {
        const key = Math.round(s.size);
        if (!sizeGroups.has(key)) sizeGroups.set(key, []);
        sizeGroups.get(key).push(s);
    }

    const scaleNames = [
        [44, "hero"],
        [40, "display"],
        [36, "largeTitle"],
        [28, "title1"],
        [24, "title2"],
        [22, "title3"],
        [20, "headline"],
        [18, "subheadline"],
        [17, "body"],
        [16, "callout"],
        [15, "subhead"],
        [14, "footnote"],
        [13, "caption1"],
        [12, "caption2"],
        [11, "small"],
        [10, "tiny"],
        [9, "micro"],
    ];

    for (const [size, name] of scaleNames) {
        const group = sizeGroups.get(size);
        if (group) {
            // Pick the entry with the heaviest weight for headers, lighter for body
            const sorted = group.sort((a, b) => b.weight - a.weight);
            const entry = sorted[0];
            typographyScale[name] = {
                fontSize: entry.size,
                lineHeight: entry.lineHeight,
                fontWeight: String(entry.weight),
                letterSpacing: entry.letterSpacing,
            };
        }
    }

    // Radii
    const radiiSorted = [...tokens.radii].sort((a, b) => a - b);
    const radiiMap = {};
    const radiiNames = ["xs", "sm", "md", "DEFAULT", "lg", "xl", "2xl", "3xl", "4xl", "full"];
    radiiSorted.forEach((r, i) => {
        const name = radiiNames[i] || `r${r}`;
        radiiMap[name] = r;
    });

    // Deduplicate gradients
    const uniqueGradients = [];
    const gradientKeys = new Set();
    for (const g of tokens.gradients) {
        const key = g.stops.map((s) => s.color).join("-");
        if (!gradientKeys.has(key) && g.stops[0].color !== g.stops[g.stops.length - 1].color) {
            gradientKeys.add(key);
            uniqueGradients.push(g);
        }
    }

    // Deduplicate shadows
    const uniqueShadows = [];
    const shadowKeys = new Set();
    for (const s of tokens.shadows) {
        const key = `${s.type}:${s.color}:${s.radius}:${s.opacity}`;
        if (!shadowKeys.has(key)) {
            shadowKeys.add(key);
            uniqueShadows.push(s);
        }
    }

    return {
        colors: semantic,
        typography: typographyScale,
        radii: radiiMap,
        gradients: uniqueGradients,
        shadows: uniqueShadows,
        fonts: [...tokens.fonts],
        allColors: colorEntries.map(([hex, data]) => ({
            hex,
            count: data.count,
            opacities: [...data.opacities],
        })),
    };
}

// ── Code generation ─────────────────────────────────────────────────

function generateTokensFile(categorized) {
    const lines = [];

    lines.push(`/**`);
    lines.push(` * Auto-generated from Figma — BAYSIS LAST DESIGN`);
    lines.push(` * Generated: ${new Date().toISOString()}`);
    lines.push(` * File ID: ${FILE_ID}`);
    lines.push(` *`);
    lines.push(` * DO NOT EDIT MANUALLY — run \`npm run figma:sync\` to regenerate`);
    lines.push(` */`);
    lines.push(``);

    // ── Colors ──
    lines.push(`// ── Semantic Colors ──────────────────────────────────────────────────`);
    lines.push(`export const figmaColors = {`);
    for (const [name, value] of Object.entries(categorized.colors)) {
        lines.push(`  ${name}: "${value}",`);
    }
    lines.push(`} as const;`);
    lines.push(``);

    // ── Typography ──
    lines.push(`// ── Typography Scale ─────────────────────────────────────────────────`);
    lines.push(`export const figmaTypography = {`);
    for (const [name, style] of Object.entries(categorized.typography)) {
        lines.push(`  ${name}: {`);
        lines.push(`    fontSize: ${style.fontSize},`);
        lines.push(`    lineHeight: ${style.lineHeight},`);
        lines.push(`    fontWeight: "${style.fontWeight}" as const,`);
        if (style.letterSpacing) {
            lines.push(`    letterSpacing: ${style.letterSpacing},`);
        }
        lines.push(`  },`);
    }
    lines.push(`} as const;`);
    lines.push(``);

    // ── Radii ──
    lines.push(`// ── Border Radii ────────────────────────────────────────────────────`);
    lines.push(`export const figmaRadii = {`);
    for (const [name, value] of Object.entries(categorized.radii)) {
        lines.push(`  ${JSON.stringify(name)}: ${value},`);
    }
    lines.push(`  full: 9999,`);
    lines.push(`} as const;`);
    lines.push(``);

    // ── Fonts ──
    lines.push(`// ── Font Families ───────────────────────────────────────────────────`);
    lines.push(`export const figmaFonts = ${JSON.stringify(categorized.fonts)} as const;`);
    lines.push(``);

    // ── Gradients ──
    lines.push(`// ── Gradients ───────────────────────────────────────────────────────`);
    lines.push(`export const figmaGradients = {`);

    const gradientNames = ["accentPrimary", "accentSecondary", "accentTertiary", "purple", "orange", "warmDark"];
    categorized.gradients.slice(0, 6).forEach((g, i) => {
        const name = gradientNames[i] || `gradient${i}`;
        const colors = g.stops.map((s) => `"${s.color}"`).join(", ");
        lines.push(`  ${name}: [${colors}],`);
    });
    lines.push(`} as const;`);
    lines.push(``);

    // ── Shadows (React Native format) ──
    lines.push(`// ── Shadows (React Native) ───────────────────────────────────────────`);
    lines.push(`export const figmaShadows = {`);

    // Group shadows by size
    const sortedShadows = categorized.shadows
        .filter((s) => s.type === "DROP_SHADOW")
        .sort((a, b) => a.radius - b.radius);

    const shadowGroups = {
        sm: sortedShadows.filter((s) => s.radius <= 8)[0],
        md: sortedShadows.filter((s) => s.radius > 8 && s.radius <= 16)[0],
        lg: sortedShadows.filter((s) => s.radius > 16 && s.radius <= 32)[0],
        xl: sortedShadows.filter((s) => s.radius > 32 && s.radius <= 60)[0],
        glow: sortedShadows.filter((s) => s.color === "#a3ff3f")[0],
    };

    for (const [name, shadow] of Object.entries(shadowGroups)) {
        if (!shadow) continue;
        lines.push(`  ${name}: {`);
        lines.push(`    shadowColor: "${shadow.color}",`);
        lines.push(`    shadowOffset: { width: ${shadow.offset.x}, height: ${shadow.offset.y} },`);
        lines.push(`    shadowOpacity: ${shadow.opacity},`);
        lines.push(`    shadowRadius: ${shadow.radius},`);
        lines.push(`    elevation: ${Math.ceil(shadow.radius / 4)},`);
        lines.push(`  },`);
    }
    lines.push(`} as const;`);
    lines.push(``);

    // ── Raw color palette (for reference) ──
    lines.push(`// ── Raw Color Palette (reference) ───────────────────────────────────`);
    lines.push(`export const figmaRawPalette = [`);
    for (const c of categorized.allColors.slice(0, 20)) {
        lines.push(`  { hex: "${c.hex}", usageCount: ${c.count} },`);
    }
    lines.push(`] as const;`);
    lines.push(``);

    return lines.join("\n");
}

// ── CSS variable generation ─────────────────────────────────────────

function generateCssVars(categorized) {
    const c = categorized.colors;

    // Convert hex to RGB triplet for CSS custom properties
    function hexToTriple(hex) {
        if (hex.startsWith("rgba")) return null;
        return toRgb(hex);
    }

    return {
        dark: {
            background: hexToTriple(c.background) || "11 11 15",
            foreground: "255 255 255",
            card: hexToTriple(c.backgroundElevated) || "19 19 22",
            "card-foreground": "255 255 255",
            muted: hexToTriple(c.surface) || "21 21 24",
            "muted-foreground": "255 255 255",
            primary: hexToTriple(c.accent) || "163 255 63",
            "primary-foreground": "11 11 15",
            secondary: hexToTriple(c.surface) || "21 21 24",
            "secondary-foreground": "255 255 255",
            accent: hexToTriple(c.accent) || "163 255 63",
            "accent-foreground": "11 11 15",
            destructive: hexToTriple(c.destructive) || "255 100 103",
            border: "255 255 255",
        },
        light: {
            background: "245 243 238",
            foreground: "17 17 17",
            card: "255 255 255",
            "card-foreground": "17 17 17",
            muted: "238 236 231",
            "muted-foreground": "142 142 138",
            primary: hexToTriple(c.accent) || "163 255 63",
            "primary-foreground": "17 17 17",
            secondary: "238 236 231",
            "secondary-foreground": "42 42 42",
            accent: hexToTriple(c.accent) || "163 255 63",
            "accent-foreground": "17 17 17",
            destructive: hexToTriple(c.destructive) || "255 100 103",
            border: "214 210 200",
        },
    };
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
    console.log("🎨 Figma Token Sync — BAYSIS LAST DESIGN\n");

    // 1. Fetch file structure
    console.log("📂 Fetching file structure…");
    const file = await figmaGet(`/files/${FILE_ID}?depth=2`);

    if (file.err || file.status) {
        console.error(`❌ Figma API error: ${file.err || JSON.stringify(file)}`);
        process.exit(1);
    }

    console.log(`   ✓ "${file.name}" — ${file.lastModified}`);

    const pages = file.document?.children || [];
    console.log(`   ✓ ${pages.length} pages found\n`);

    // 2. Extract tokens from every page
    const frameIds = [];
    for (const page of pages) {
        for (const frame of page.children || []) {
            frameIds.push(frame.id);
        }
    }

    console.log(`🔍 Extracting tokens from ${frameIds.length} top-level frames…`);

    // Batch requests (max 5 IDs per request to avoid timeouts)
    const batchSize = 5;
    for (let i = 0; i < frameIds.length; i += batchSize) {
        const batch = frameIds.slice(i, i + batchSize);
        const ids = batch.join(",");
        console.log(`   Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(frameIds.length / batchSize)}…`);

        const nodesData = await figmaGet(`/files/${FILE_ID}/nodes?ids=${ids}&depth=10`);

        if (nodesData.nodes) {
            for (const [nodeId, nodeData] of Object.entries(nodesData.nodes)) {
                if (nodeData.document) {
                    extractTokens(nodeData.document);
                }
            }
        }
    }

    console.log(`\n📊 Extraction complete:`);
    console.log(`   • ${tokens.colors.size} unique colors`);
    console.log(`   • ${tokens.fonts.size} font families`);
    console.log(`   • ${tokens.fontSizes.size} font size variants`);
    console.log(`   • ${tokens.radii.size} border radii`);
    console.log(`   • ${tokens.gradients.length} gradients`);
    console.log(`   • ${tokens.shadows.length} shadow effects\n`);

    // 3. Categorize tokens
    console.log("🏷️  Categorizing tokens…");
    const categorized = categorizeTokens();

    // 4. Generate figma-tokens.ts
    console.log("💾 Generating lib/figma-tokens.ts…");
    const tokensCode = generateTokensFile(categorized);
    const tokensPath = path.join(__dirname, "..", "lib", "figma-tokens.ts");
    fs.writeFileSync(tokensPath, tokensCode);
    console.log(`   ✓ Written to ${tokensPath}`);

    // 5. Generate CSS variables info
    const cssVars = generateCssVars(categorized);
    console.log(`\n📋 CSS Variables for global.css:\n`);
    console.log(`   :root (light) {`);
    for (const [key, val] of Object.entries(cssVars.light)) {
        console.log(`     --color-${key}: ${val};`);
    }
    console.log(`   }\n`);
    console.log(`   .dark {`);
    for (const [key, val] of Object.entries(cssVars.dark)) {
        console.log(`     --color-${key}: ${val};`);
    }
    console.log(`   }\n`);

    console.log("✅ Figma sync complete!\n");
    console.log("Next steps:");
    console.log("  1. Review lib/figma-tokens.ts");
    console.log("  2. Update lib/theme.ts to import from figma-tokens");
    console.log("  3. Update global.css CSS variables if desired");
    console.log("  4. Re-run anytime with: npm run figma:sync\n");

    return { categorized, cssVars };
}

main().catch((err) => {
    console.error("❌ Fatal error:", err.message);
    process.exit(1);
});
