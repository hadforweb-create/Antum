/**
 * Figma Design Token Extractor
 * Run: node scripts/extract-figma-tokens.mjs
 * Paste the output JSON back to Claude to apply tokens precisely.
 */

const FILE_KEY = "eMs8JDJAb48gLetxFK8LAR";
const TOKEN = process.env.FIGMA_TOKEN;
if (!TOKEN) {
  console.error("Error: Set your token via:  FIGMA_TOKEN=your_token node scripts/extract-figma-tokens.mjs");
  process.exit(1);
}

async function fetchFigma(path) {
  const res = await fetch(`https://api.figma.com/v1${path}`, {
    headers: { "X-Figma-Token": TOKEN },
  });
  if (!res.ok) throw new Error(`Figma API error: ${res.status} ${await res.text()}`);
  return res.json();
}

function rgbToHex({ r, g, b }) {
  const toHex = (n) => Math.round(n * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function rgbaString({ r, g, b, a }) {
  if (a === undefined || a >= 0.99) return rgbToHex({ r, g, b });
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${Math.round(a * 100) / 100})`;
}

async function main() {
  console.error("Fetching Figma file...");

  // 1. Get all published styles
  const stylesData = await fetchFigma(`/files/${FILE_KEY}/styles`);
  const styleIds = stylesData.meta.styles.map((s) => s.node_id).join(",");

  // 2. Get node details for all style nodes
  const nodesData = await fetchFigma(`/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(styleIds)}`);
  const nodes = nodesData.nodes;

  const tokens = {
    colors: {},
    typography: {},
    effects: {},
    grids: {},
  };

  // Map style node_id → style meta
  const styleMeta = {};
  for (const s of stylesData.meta.styles) {
    styleMeta[s.node_id] = s;
  }

  for (const [nodeId, nodeWrapper] of Object.entries(nodes)) {
    const meta = styleMeta[nodeId];
    if (!meta) continue;

    const node = nodeWrapper.document;
    const name = meta.name;
    const styleType = meta.style_type;

    if (styleType === "FILL") {
      const fill = node.fills?.[0];
      if (fill?.type === "SOLID") {
        tokens.colors[name] = {
          hex: rgbaString(fill.color),
          opacity: fill.opacity ?? 1,
        };
      } else if (fill?.type === "GRADIENT_LINEAR") {
        tokens.colors[name] = { gradient: "linear", stops: fill.gradientStops };
      }
    }

    if (styleType === "TEXT") {
      const style = node.style;
      tokens.typography[name] = {
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeightPx: style.lineHeightPx,
        letterSpacing: style.letterSpacing,
        textCase: style.textCase,
      };
    }

    if (styleType === "EFFECT") {
      tokens.effects[name] = node.effects?.map((e) => ({
        type: e.type,
        radius: e.radius,
        spread: e.spread,
        color: e.color ? rgbaString(e.color) : null,
        offset: e.offset,
        visible: e.visible,
      }));
    }

    if (styleType === "GRID") {
      tokens.grids[name] = node.layoutGrids;
    }
  }

  // 3. Also extract local variables if available (Figma Variables API)
  try {
    const varsData = await fetchFigma(`/files/${FILE_KEY}/variables/local`);
    const vars = { collections: {}, variables: {} };

    for (const [, col] of Object.entries(varsData.meta.variableCollections)) {
      vars.collections[col.id] = { name: col.name, modes: col.modes };
    }

    for (const [, v] of Object.entries(varsData.meta.variables)) {
      const values = {};
      for (const [modeId, val] of Object.entries(v.valuesByMode)) {
        if (val && typeof val === "object" && "r" in val) {
          values[modeId] = rgbaString(val);
        } else {
          values[modeId] = val;
        }
      }
      vars.variables[v.name] = {
        type: v.resolvedType,
        collection: vars.collections[v.variableCollectionId]?.name,
        values,
      };
    }

    tokens.variables = vars.variables;
    tokens.variableCollections = vars.collections;
  } catch {
    // Variables API may not be available on all plans
    console.error("Note: Variables API not available (requires Enterprise/Pro plan with devmode)");
  }

  // Output clean JSON
  console.log(JSON.stringify(tokens, null, 2));
}

main().catch((e) => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
