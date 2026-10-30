// Embeddable SVG badges: live Base yields that anyone can drop into a
// README, docs page or dashboard.
//
// Distribution, not decoration — every embed is a permanent link back and a
// reason for the embedder to care that this stays up. Shields-style so it
// sits naturally beside the badges people already use.
//
//   /badge/aave-usdc.svg          -> "Aave USDC | 9.42% APY"
//   /badge/sparkusdc.svg?label=Spark
//   /badge/vault-0x7bfa....svg
//   /badge/stats.svg              -> settled x402 payments
import { fetchBaseYields, fetchBaseVaults } from "./data.js";

// Box width comes from per-character metrics rather than an average:
// pinning the text with textLength is unreliable across renderers (and
// silently spills past the coloured plate when it fails), while a width
// that is a little generous only ever looks slightly roomy.
const PAD = 9;
const NARROW = "ijltfrI.,:;'·!|()[]/-";
const WIDE = "MWmw%@";
const charWidth = (c) => {
  if (c === " ") return 3.6;
  if (NARROW.includes(c)) return 4.0;
  if (WIDE.includes(c)) return 10.5;
  if (c >= "A" && c <= "Z") return 8.0;
  if (c >= "0" && c <= "9") return 7.0;
  return 6.6;
};
const textWidth = (s) =>
  Math.ceil([...String(s)].reduce((w, c) => w + charWidth(c), 0));

const esc = (s) =>
  String(s).replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);

function render(label, value, color = "#3fb950") {
  const lw = textWidth(label) + PAD * 2;
  const vw = textWidth(value) + PAD * 2;
  const w = lw + vw;
  const h = 20;
  const alt = `${label}: ${value}`;
  // Inline SVGs share one id namespace with the page around them, so a
  // README holding several badges would resolve every url(#…) to whichever
  // came first — clipping each badge to its neighbour's width. Unique ids
  // per render keep them independent.
  const uid = `b${(textWidth(alt) * 131 + alt.length).toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" role="img" aria-label="${esc(alt)}">
<title>${esc(alt)}</title>
<linearGradient id="g${uid}" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
<clipPath id="c${uid}"><rect width="${w}" height="${h}" rx="3" fill="#fff"/></clipPath>
<g clip-path="url(#c${uid})">
  <rect width="${lw}" height="${h}" fill="#24292f"/>
  <rect x="${lw}" width="${vw}" height="${h}" fill="${color}"/>
  <rect width="${w}" height="${h}" fill="url(#g${uid})"/>
</g>
<g fill="#fff" text-anchor="start" font-family="Verdana,DejaVu Sans,Geneva,sans-serif" font-size="11">
  <text x="${PAD}" y="15" fill="#010101" fill-opacity=".3">${esc(label)}</text>
  <text x="${PAD}" y="14">${esc(label)}</text>
  <text x="${lw + PAD}" y="15" fill="#010101" fill-opacity=".3">${esc(value)}</text>
  <text x="${lw + PAD}" y="14">${esc(value)}</text>
</g>
</svg>`;
}

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Resolves a slug to a market. Accepts the market's own id, a vault
 * address (with or without the `vault-`/`vault:` prefix), a symbol, or
 * `<project>-<symbol>` — whatever someone would guess from the table.
 */
export async function resolveMarket(slug) {
  const want = norm(slug.replace(/^vault[-:]/i, ""));
  const [pools, vaults] = await Promise.all([fetchBaseYields(), fetchBaseVaults()]);

  for (const v of vaults) {
    if (
      norm(v.address) === want ||
      norm(v.symbol) === want ||
      norm(`${v.protocol}${v.asset.symbol}`) === want ||
      norm(v.name) === want
    ) {
      return { label: v.name || v.symbol, apy: v.apy, tvlUsd: v.tvlUsd };
    }
  }
  for (const p of pools) {
    if (
      norm(p.pool) === want ||
      norm(`${p.project}${p.symbol}`) === want ||
      norm(p.symbol) === want
    ) {
      return { label: `${p.project} ${p.symbol}`, apy: p.apy, tvlUsd: p.tvlUsd };
    }
  }
  return null;
}

const titleCase = (s) =>
  s.replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/-/g, " ");

export async function marketBadge(slug, { label, kind = "apy" } = {}) {
  const market = await resolveMarket(slug);
  if (!market) return render("stakechain", "market not found", "#8b949e");

  const left = label || titleCase(market.label).slice(0, 40);
  if (kind === "tvl") {
    const tvl =
      market.tvlUsd >= 1e9
        ? `$${(market.tvlUsd / 1e9).toFixed(2)}B`
        : `$${(market.tvlUsd / 1e6).toFixed(1)}M`;
    return render(left, `${tvl} TVL`, "#1f6feb");
  }
  // green when the rate is worth looking at, muted when it is not
  const color = market.apy >= 4 ? "#3fb950" : "#8b949e";
  return render(left, `${market.apy}% APY`, color);
}

export function statsBadge({ payments, external }) {
  // Always name the external share: a bare count would read as demand while
  // every payment is still our own agent's.
  return render(
    "x402 payments",
    external > 0 ? `${payments} · ${external} external` : `${payments} · all internal`,
    external > 0 ? "#3fb950" : "#8b949e"
  );
}
