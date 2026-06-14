import type { CSSProperties } from "react";
import type { ThemeDefinition } from "@/lib/types";

const PRESETS: Record<string, Omit<ThemeDefinition, "id">> = {
  "slate-tech": {
    name: "Slate Tech",
    emoji: "◆",
    bg: "#08131c",
    fg: "#ecf7ff",
    muted: "#8fa8b8",
    accent: "#79e1ff",
    accent2: "#7c8cff",
    cardBg: "rgba(12, 28, 39, .78)",
    cardBorder: "rgba(121, 225, 255, .18)",
    headingFont: "'Space Grotesk'",
    bodyFont: "'Inter'",
  },
  "high-fashion": {
    name: "High Fashion",
    emoji: "✦",
    bg: "#160f13",
    fg: "#fff8f5",
    muted: "#bca9ae",
    accent: "#e8b7a7",
    accent2: "#bd7c92",
    cardBg: "rgba(38, 24, 30, .78)",
    cardBorder: "rgba(232, 183, 167, .2)",
    headingFont: "'Cormorant Garamond'",
    bodyFont: "'DM Sans'",
  },
  "neon-gaming": {
    name: "Neon Gaming",
    emoji: "⌁",
    bg: "#040b0b",
    fg: "#ebfff8",
    muted: "#85a79b",
    accent: "#00f5a0",
    accent2: "#00d9ff",
    cardBg: "rgba(5, 25, 22, .84)",
    cardBorder: "rgba(0, 245, 160, .2)",
    headingFont: "'Orbitron'",
    bodyFont: "'Rajdhani'",
  },
  "anime-manga": {
    name: "Anime Manga",
    emoji: "✿",
    bg: "#170e22",
    fg: "#fff6fc",
    muted: "#c0a3ba",
    accent: "#ff6ba8",
    accent2: "#9c7cff",
    cardBg: "rgba(36, 20, 48, .82)",
    cardBorder: "rgba(255, 107, 168, .22)",
    headingFont: "'Zen Dots'",
    bodyFont: "'Nunito'",
  },
  "space-cosmos": {
    name: "Space Cosmos",
    emoji: "✺",
    bg: "#050718",
    fg: "#f3f5ff",
    muted: "#969dc0",
    accent: "#9d8cff",
    accent2: "#4cc9f0",
    cardBg: "rgba(11, 13, 39, .82)",
    cardBorder: "rgba(157, 140, 255, .22)",
    headingFont: "'Exo 2'",
    bodyFont: "'Inter'",
  },
  "cricket-sports": {
    name: "Cricket Stadium",
    emoji: "◎",
    bg: "#07170f",
    fg: "#f0fff5",
    muted: "#8fb19b",
    accent: "#75e596",
    accent2: "#f4d35e",
    cardBg: "rgba(9, 37, 23, .82)",
    cardBorder: "rgba(117, 229, 150, .2)",
    headingFont: "'Barlow Condensed'",
    bodyFont: "'Inter'",
  },
  "coffee-cafe": {
    name: "Coffee House",
    emoji: "◒",
    bg: "#160f0b",
    fg: "#fff8ed",
    muted: "#b6a08f",
    accent: "#d99b65",
    accent2: "#f1c27d",
    cardBg: "rgba(42, 27, 18, .82)",
    cardBorder: "rgba(217, 155, 101, .2)",
    headingFont: "'Fraunces'",
    bodyFont: "'Lora'",
  },
  "chess-strategy": {
    name: "Chess Strategy",
    emoji: "♞",
    bg: "#0d0d0d",
    fg: "#f7f0e7",
    muted: "#aaa197",
    accent: "#d0aa70",
    accent2: "#f2e3c6",
    cardBg: "rgba(29, 28, 26, .84)",
    cardBorder: "rgba(208, 170, 112, .2)",
    headingFont: "'Cinzel'",
    bodyFont: "'Merriweather'",
  },
  "forest-nature": {
    name: "Forest Nature",
    emoji: "⌁",
    bg: "#08150d",
    fg: "#f2fff1",
    muted: "#91aa94",
    accent: "#76c77a",
    accent2: "#d4a95e",
    cardBg: "rgba(13, 37, 20, .82)",
    cardBorder: "rgba(118, 199, 122, .2)",
    headingFont: "'Bitter'",
    bodyFont: "'Nunito'",
  },
  "ocean-marine": {
    name: "Ocean Marine",
    emoji: "≈",
    bg: "#03151c",
    fg: "#effcff",
    muted: "#86adb8",
    accent: "#39d5f6",
    accent2: "#3b82f6",
    cardBg: "rgba(5, 34, 43, .8)",
    cardBorder: "rgba(57, 213, 246, .2)",
    headingFont: "'Outfit'",
    bodyFont: "'Inter'",
  },
  bollywood: {
    name: "Bollywood",
    emoji: "✺",
    bg: "#230b12",
    fg: "#fff6e6",
    muted: "#c5a79a",
    accent: "#ffb703",
    accent2: "#fb4673",
    cardBg: "rgba(55, 15, 27, .82)",
    cardBorder: "rgba(255, 183, 3, .22)",
    headingFont: "'Yatra One'",
    bodyFont: "'Poppins'",
  },
  "lofi-chill": {
    name: "Lo-fi Chill",
    emoji: "◉",
    bg: "#171329",
    fg: "#f7f1ff",
    muted: "#aaa1bf",
    accent: "#d99bd8",
    accent2: "#7cc8bf",
    cardBg: "rgba(35, 29, 56, .82)",
    cardBorder: "rgba(217, 155, 216, .2)",
    headingFont: "'Quicksand'",
    bodyFont: "'Nunito'",
  },
};

export const THEME_IDS = [
  "high-fashion", "neon-gaming", "slate-tech", "anime-manga", "synthwave-80s",
  "lofi-chill", "forest-nature", "ocean-marine", "space-cosmos", "hip-hop-street",
  "cottagecore", "kpop-idol", "jazz-blues", "metal-rock", "bollywood", "zen-minimalist",
  "cricket-sports", "basketball-nba", "football-soccer", "formula1-racing",
  "photography-film", "architecture", "culinary-chef", "coffee-cafe", "skateboarding",
  "ballet-dance", "film-noir", "fantasy-medieval", "steampunk", "gothic-horror",
  "pop-art", "tropical-summer", "arctic-ice", "surf-beach", "hiking-adventure",
  "music-studio", "poetry-literary", "mythology-greek", "superhero-comics", "neon-tokyo",
  "wilderness-safari", "classical-music", "street-food", "astronomy-telescope",
  "vintage-retro", "travel-wanderlust", "wrestling-mma", "luxury-watch", "k-drama",
  "chess-strategy", "yoga-wellness", "astrology-zodiac", "sneaker-hype",
  "minecraft-pixel", "baking-pastry", "true-crime", "bookworm-library", "rock-climbing",
  "veganism-eco", "tattoo-ink", "martial-arts", "cycling-velodrome",
  "swimming-aquatics", "tennis-wimbledon", "badminton", "boxing-fight",
  "marathon-running", "gym-bodybuilding", "meditation-mindfulness", "tarot-mystical",
  "stand-up-comedy", "podcasting", "youtube-creator", "twitch-streaming", "origami-paper",
  "knitting-crochet", "pottery-ceramics", "woodworking", "watercolor-painting",
  "calligraphy-art", "birdwatching", "fishing-angling", "gardening-plants",
  "aquarium-fishkeeping", "cosplay-convention", "tabletop-rpg-dnd", "card-games-poker",
  "puzzle-solving", "philosophy-stoic", "investing-stocks", "cryptocurrency-web3",
  "startup-hustle", "psychology-mind", "military-history", "ancient-egypt",
  "horror-movies", "disney-animation", "studio-ghibli", "edm-rave", "country-music",
  "reggae-culture", "latin-salsa-dance", "folk-indie-music", "opera-grand",
  "theater-broadway", "slam-poetry", "wine-sommelier", "whiskey-bourbon",
  "cocktail-mixology", "luxury-cars", "motorcycles-biker", "aviation-pilot",
  "sailing-yacht", "scuba-diving", "extreme-sports", "snowboarding-alpine",
  "equestrian-horse", "archery-precision", "gymnastics-artistic", "figure-skating",
  "esports-pro", "mobile-gaming", "retro-gaming-8bit", "vr-metaverse", "lego-building",
  "drones-photography", "robotics-maker", "data-science", "environmental-activism",
  "cooking-indian-spice", "cooking-italian", "sushi-japanese-food",
  "streetwear-fashion", "vinyl-records", "detective-mystery", "gaming-speedrun",
  "interior-design", "pet-lover-dogs", "cat-aesthetic", "camping-survival",
  "minimalism-lifestyle", "luxury-travel", "anime-isekai", "economics-finance",
  "oil-painting-art", "social-media-influencer", "neuroscience-brain", "streetball-urban",
] as const;

function titleCase(value: string): string {
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function fallbackTheme(id: string): ThemeDefinition {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const hue = hash % 360;
  const accentHue = (hue + 48) % 360;
  const emoji =
    id.includes("music") ? "♫" :
    id.includes("gaming") ? "⌁" :
    id.includes("art") || id.includes("painting") ? "✦" :
    id.includes("sport") || id.includes("ball") ? "◎" :
    id.includes("nature") || id.includes("eco") ? "⌁" : "◆";
  return {
    id,
    name: titleCase(id),
    emoji,
    bg: `hsl(${hue} 34% 7%)`,
    fg: `hsl(${hue} 24% 96%)`,
    muted: `hsl(${hue} 12% 65%)`,
    accent: `hsl(${accentHue} 78% 66%)`,
    accent2: `hsl(${(accentHue + 65) % 360} 72% 65%)`,
    cardBg: `hsl(${hue} 30% 12% / .82)`,
    cardBorder: `hsl(${accentHue} 70% 65% / .2)`,
    headingFont: "'Space Grotesk'",
    bodyFont: "'Inter'",
  };
}

export function getTheme(id: string): ThemeDefinition {
  const preset = PRESETS[id];
  return preset ? { id, ...preset } : fallbackTheme(id);
}

export function themeStyle(theme: ThemeDefinition): CSSProperties {
  return {
    "--bg": theme.bg,
    "--fg": theme.fg,
    "--muted": theme.muted,
    "--accent": theme.accent,
    "--accent-2": theme.accent2,
    "--card-bg": theme.cardBg,
    "--card-border": theme.cardBorder,
    "--font-heading": theme.headingFont,
    "--font-body": theme.bodyFont,
  } as CSSProperties;
}

