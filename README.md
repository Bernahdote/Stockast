
# Stockast
AI-application MVP project at Hackathon in Karlsruhe (KIT) hosted by {Tech: Europe}, supported by ACI.dev, ElevenLabs and Mistral. 


## Call TTS Test
```
pytest tts/test_tts.py
```
# AI Demo Project

This project demonstrates the integration of various AI services including text-to-speech and chat functionality.

## Features

- Text-to-Speech conversion using ElevenLabs API
- Chat functionality using Mistral API
- Chat history storage using Supabase

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

### Backend (scrape.py) 



* The functions understand_tickers(), understand_sectors() and understand_markets() all take a string as in input and analyzes which tickers, sectors and markets respectively that the user is interested in in an array []. 
* The function get_keys() takes a string ticker input and returns a string of brief key analytics of the stock.
* The function get_key_note() takes a string ticker input at returns a bullet points list of key news on the stock.
* The function get_news() takes a string as a ticker and returns a string of brief news about this stock. 
* The function get_market_news() and get_sector_news() takes a string as market/sector (as given from understand_sectors() or understand_markets()) and returns a string that describes important news of this market/sector.
* The function get_technical_summer() takes a string ticker as in put and returns financial data with comparisons in time for this stock
* The function generate_podcast() takes a string as input and rewrites it in a "podcast"- manner. It also tries to balance out imbalances between sections.
  
* See main method in scrape.py for example of usage with an example input. 


## Contributing

Feel free to submit issues and enhancement requests.

## License

This project is licensed under the MIT License.
