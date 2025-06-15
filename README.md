
# Stockast
MVP AI application developed during a Hackathon at Karlsruhe Institute of Technology (KIT), hosted by {Tech: Europe} and supported by ACI.dev, ElevenLabs, and Mistral.

### Our Goals
We built Stockast, a platform that helps you stay informed about your investment portfolio. Using real-time news and statistics, our AI generates concise summaries and converts them into straightforward, listen-anywhere podcasts. Give it a try, and don’t forget to leave us your feedback!


## Call TTS Test
```
pytest tts/test_tts.py
```
# AI Demo Project

This project demonstrates the integration of various AI services including text-to-speech and chat functionality.

## Features

* Generate AI-driven conversations using the Mistral API
* Store and retrieve chat history via Supabase
* Convert text to natural-sounding audio using ElevenLabs

## Prerequisites

- Node.js 18.0 or higher
- npm or yarn
- API keys for:
  - ElevenLabs
  - Mistral
  - Supabase

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-demo
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory with the following variables:
```env
# ElevenLabs API Key
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Mistral API Key
MISTRAL_API_KEY=your_mistral_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Getting API Keys

1. **ElevenLabs API Key**:
   - Sign up at [ElevenLabs](https://elevenlabs.io)
   - Go to your profile settings
   - Copy your API key

2. **Mistral API Key**:
   - Sign up at [Mistral AI](https://mistral.ai)
   - Navigate to API settings
   - Generate and copy your API key

3. **Supabase Configuration**:
   - Create a project at [Supabase](https://supabase.com)
   - Go to Project Settings > API
   - Copy the Project URL and anon/public key
   - For the service role key, go to Project Settings > API > Project API keys

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   ├── save-chat/
│   │   └── tts/
│   ├── components/
│   │   └── Chat.tsx
│   ├── chat/
│   │   └── page.tsx
│   └── tts/
│       └── page.tsx
└── lib/
    └── supabase.ts
```

## Features in Detail

### Text-to-Speech
- Convert text to speech using ElevenLabs API
- Adjust voice stability and similarity
- Play audio directly in the browser

### Chat
- Chat with AI using Mistral API
- Save chat history to Supabase
- View chat history

## Backend Functionality (`scrape.py`)

This script extracts financial insights and converts them into podcast-ready summaries.

**Functions Overview:**

- `understand_tickers(input: str) -> list`: Identifies stock tickers mentioned in the input.
- `understand_sectors(input: str) -> list`: Identifies referenced sectors.
- `understand_markets(input: str) -> list`: Identifies referenced markets.
- `get_keys(ticker: str) -> str`: Returns key analytics for the specified stock.
- `get_key_note(ticker: str) -> str`: Returns bullet-point key news for the given stock.
- `get_news(ticker: str) -> str`: Summarizes news about the stock.
- `get_market_news(market: str) -> str`: Summarizes news about a specific market.
- `get_sector_news(sector: str) -> str`: Summarizes sector-specific news.
- `get_technical_summer(ticker: str) -> str`: Provides time-based financial comparisons for a stock.
- `generate_podcast(input: str) -> str`: Reformats the content into a coherent, podcast-style narrative.

See the `main` method in `scrape.py` for an example of how these functions can be chained together.


## Contributing

Contributions, issues, and feature suggestions are welcome! Feel free to open a pull request or submit feedback.

## License

This project is licensed under the MIT License.
