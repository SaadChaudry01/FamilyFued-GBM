# MSA Family Feud 🌙

A web-based Family Feud game designed for MSA (Muslim Student Association) GBMs and events. Features fun Islamic/Ramadan-themed questions and a beautiful, host-friendly interface.

## Features

- ⚔️ **Face-off Mode**: Classic face-off to determine board control
- 🎮 **Host Controls**: Easy-to-use interface for live game hosting
- 🎯 **Steal Mode**: Automatic steal handling after 3 strikes
- 💯 **Score Multipliers**: Configurable round multipliers (x1, x2, x3)
- 🔄 **Undo System**: Full undo support for mistakes
- 💾 **Auto-Save**: Game state persists in localStorage
- ⌨️ **Keyboard Shortcuts**: Quick host controls
- 🎨 **Beautiful UI**: Dark theme with gold accents, animations

## Installation

```bash
# Clone or navigate to the project
cd msa-family-feud

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Quick Start

1. Start the app with `npm run dev`
2. Open http://localhost:5173 in your browser
3. Click "Load Sample Questions" to use the included MSA-themed questions
4. Configure team names and number of rounds
5. Click "Start Game"
6. Press F11 for fullscreen projection mode

## Game Flow

### Setup Phase
1. Set team names
2. Choose number of rounds
3. Configure round multipliers
4. Load question pack (JSON file or paste)

### Face-off Phase
1. Each team gives one guess
2. Host marks if guesses match any answers
3. Team with higher-ranked answer wins control
4. Winning team can PLAY or PASS

### Play Phase
1. Controlling team guesses answers
2. Host marks correct guesses (reveals on board)
3. Wrong guesses = strikes
4. After 3 strikes → Steal Mode

### Steal Mode
1. Opposing team gets ONE guess
2. If correct → They steal ALL round points
3. If wrong → Controlling team keeps points

### Scoring
- Points = Sum of revealed answers × Round multiplier
- Final round typically has x3 multiplier for excitement!

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `S` | Add Strike |
| `U` | Undo Last Action |
| `N` | Next Round (when round ended) |
| `Ctrl+R` | Reveal All Answers (with confirmation) |
| `1-8` | Reveal specific answer by number |

## Question Pack Format (JSON)

```json
{
  "title": "Your Question Pack Name",
  "rounds": [
    {
      "id": "r1",
      "question": "Name something you bring to a picnic.",
      "answers": [
        { "text": "Food", "points": 40, "aliases": ["snacks", "meal"] },
        { "text": "Blanket", "points": 20, "aliases": ["mat"] },
        { "text": "Drinks", "points": 15, "aliases": ["water", "juice"] },
        { "text": "Basket", "points": 10, "aliases": ["bag"] },
        { "text": "Games", "points": 8, "aliases": ["frisbee", "football"] }
      ]
    }
  ]
}
```

### Validation Rules
- `question`: Non-empty string (required)
- `answers`: Array of 3-10 answers (required)
- Each answer needs `text` (string) and `points` (positive number)
- `aliases`: Optional array of alternate accepted answers
- Answers are auto-sorted by points (highest first)

## Included Sample Questions

The included `sample.familyfeud.json` has 12 MSA-themed rounds including:
- "Name something people do right after Iftar"
- "Name something that makes you late to Fajr"
- "Name a popular Iftar food"
- "Name something you hear at every MSA event"
- "Name something that happens during Taraweeh"
- And more fun questions!

## Host Tips

1. **Projection Setup**: Use F11 for fullscreen, connect to projector
2. **Face-off**: Have contestants buzz in verbally, type their answers
3. **Matching**: The app suggests matches based on fuzzy matching
4. **Mistakes**: Use Undo button or `U` key immediately
5. **Score Adjustments**: Admin controls available under "Show Admin Controls"
6. **End Round Early**: Use "End Round" buttons if needed

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- localStorage (persistence)
- Web Audio API (sound effects)

## Project Structure

```
msa-family-feud/
├── public/
│   └── sample.familyfeud.json   # Sample question pack
├── src/
│   ├── components/              # UI components
│   │   ├── AnswerBoard.tsx
│   │   ├── AnswerCard.tsx
│   │   ├── FaceoffPanel.tsx
│   │   ├── HostControls.tsx
│   │   ├── Modal.tsx
│   │   ├── RoundEndModal.tsx
│   │   ├── StrikeDisplay.tsx
│   │   ├── TeamScore.tsx
│   │   └── TopBar.tsx
│   ├── context/
│   │   └── GameContext.tsx      # State management
│   ├── pages/
│   │   ├── GameOverPage.tsx
│   │   ├── GamePage.tsx
│   │   └── SetupPage.tsx
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── utils/
│   │   ├── matching.ts          # Fuzzy matching logic
│   │   ├── sounds.ts            # Sound effects
│   │   ├── storage.ts           # localStorage helpers
│   │   └── validation.ts        # JSON validation
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── tailwind.config.js
└── README.md
```

## Creating Your Own Questions

1. Create a JSON file following the format above
2. Think of survey-style questions (opinions, not facts)
3. Assign points based on how popular/common each answer is
4. Add aliases for alternate phrasings
5. Aim for 5-8 answers per question
6. Upload or paste in the Setup screen

## License

MIT - Free to use for your MSA events!

---

Made with ❤️ for the Muslim Student Association community. 

JazakAllah Khair! 🌙