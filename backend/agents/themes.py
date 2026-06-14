from __future__ import annotations

import re

from backend.agents.client import generate_text


THEME_IDS = [
    "high-fashion", "neon-gaming", "slate-tech", "anime-manga", "synthwave-80s",
    "lofi-chill", "forest-nature", "ocean-marine", "space-cosmos", "hip-hop-street",
    "cottagecore", "kpop-idol", "jazz-blues", "metal-rock", "bollywood",
    "zen-minimalist", "cricket-sports", "basketball-nba", "football-soccer",
    "formula1-racing", "photography-film", "architecture", "culinary-chef",
    "coffee-cafe", "skateboarding", "ballet-dance", "film-noir", "fantasy-medieval",
    "steampunk", "gothic-horror", "pop-art", "tropical-summer", "arctic-ice",
    "surf-beach", "hiking-adventure", "music-studio", "poetry-literary",
    "mythology-greek", "superhero-comics", "neon-tokyo", "wilderness-safari",
    "classical-music", "street-food", "astronomy-telescope", "vintage-retro",
    "travel-wanderlust", "wrestling-mma", "luxury-watch", "k-drama",
    "chess-strategy", "yoga-wellness", "astrology-zodiac", "sneaker-hype",
    "minecraft-pixel", "baking-pastry", "true-crime", "bookworm-library",
    "rock-climbing", "veganism-eco", "tattoo-ink", "martial-arts",
    "cycling-velodrome", "swimming-aquatics", "tennis-wimbledon", "badminton",
    "boxing-fight", "marathon-running", "gym-bodybuilding", "meditation-mindfulness",
    "tarot-mystical", "stand-up-comedy", "podcasting", "youtube-creator",
    "twitch-streaming", "origami-paper", "knitting-crochet", "pottery-ceramics",
    "woodworking", "watercolor-painting", "calligraphy-art", "birdwatching",
    "fishing-angling", "gardening-plants", "aquarium-fishkeeping",
    "cosplay-convention", "tabletop-rpg-dnd", "card-games-poker", "puzzle-solving",
    "philosophy-stoic", "investing-stocks", "cryptocurrency-web3", "startup-hustle",
    "psychology-mind", "military-history", "ancient-egypt", "horror-movies",
    "disney-animation", "studio-ghibli", "edm-rave", "country-music",
    "reggae-culture", "latin-salsa-dance", "folk-indie-music", "opera-grand",
    "theater-broadway", "slam-poetry", "wine-sommelier", "whiskey-bourbon",
    "cocktail-mixology", "luxury-cars", "motorcycles-biker", "aviation-pilot",
    "sailing-yacht", "scuba-diving", "extreme-sports", "snowboarding-alpine",
    "equestrian-horse", "archery-precision", "gymnastics-artistic", "figure-skating",
    "esports-pro", "mobile-gaming", "retro-gaming-8bit", "vr-metaverse",
    "lego-building", "drones-photography", "robotics-maker", "data-science",
    "environmental-activism", "cooking-indian-spice", "cooking-italian",
    "sushi-japanese-food", "streetwear-fashion", "vinyl-records",
    "detective-mystery", "gaming-speedrun", "interior-design", "pet-lover-dogs",
    "cat-aesthetic", "camping-survival", "minimalism-lifestyle", "luxury-travel",
    "anime-isekai", "economics-finance", "oil-painting-art",
    "social-media-influencer", "neuroscience-brain", "streetball-urban",
]

KEYWORD_THEMES = {
    "fashion": "high-fashion",
    "style": "high-fashion",
    "gaming": "neon-gaming",
    "game": "neon-gaming",
    "coding": "slate-tech",
    "programming": "slate-tech",
    "anime": "anime-manga",
    "manga": "anime-manga",
    "space": "space-cosmos",
    "astronomy": "astronomy-telescope",
    "cricket": "cricket-sports",
    "football": "football-soccer",
    "soccer": "football-soccer",
    "basketball": "basketball-nba",
    "coffee": "coffee-cafe",
    "chess": "chess-strategy",
    "jazz": "jazz-blues",
    "nature": "forest-nature",
    "forest": "forest-nature",
    "ocean": "ocean-marine",
    "swimming": "swimming-aquatics",
    "kpop": "kpop-idol",
    "k-pop": "kpop-idol",
    "kdrama": "k-drama",
    "k-drama": "k-drama",
    "bollywood": "bollywood",
    "yoga": "yoga-wellness",
    "books": "bookworm-library",
    "reading": "bookworm-library",
    "cooking": "culinary-chef",
    "music": "music-studio",
    "photography": "photography-film",
    "gym": "gym-bodybuilding",
    "fitness": "gym-bodybuilding",
    "dogs": "pet-lover-dogs",
    "cats": "cat-aesthetic",
    "finance": "economics-finance",
    "stocks": "investing-stocks",
    "brain": "neuroscience-brain",
}


def local_theme_for(interest: str) -> str:
    normalized = re.sub(r"[^a-z0-9+\-\s]", " ", interest.lower())
    for keyword, theme_id in KEYWORD_THEMES.items():
        if keyword in normalized:
            return theme_id
    return "slate-tech"


async def select_theme(interest: str, api_key: str | None = None) -> str:
    if not api_key:
        return local_theme_for(interest)
    system = (
        "You select one visual theme for an educational app. Return only one exact theme ID "
        "from the supplied catalog, with no punctuation or explanation."
    )
    prompt = f"THEME CATALOG:\n{', '.join(THEME_IDS)}\n\nUSER INTEREST:\n{interest}"
    try:
        result = (await generate_text(
            api_key,
            prompt=prompt,
            system_instruction=system,
            temperature=0.1,
        )).strip().lower()
        return result if result in THEME_IDS else local_theme_for(interest)
    except Exception:
        return local_theme_for(interest)

