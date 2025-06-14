import os, json
from dotenv import load_dotenv
from aci import ACI
from mistralai import Mistral
from rich import print as rprint

load_dotenv()                                  # needs ACI_API_KEY & MISTRAL_API_KEY

aci     = ACI(api_key=os.getenv("ACI_API_KEY"))
mistral = Mistral("WPu0KpNOAUFviCzNgnbWQuRbz7Zpwyde")

# 1. Scrape the Yahoo Finance page via Firecrawl (markdown output)
scrape_result = aci.functions.execute(
    "FIRECRAWL__SCRAPE",
    {
        "body": {
            "url": "https://finance.yahoo.com/quote/AAPL",
            "formats": ["markdown"],
            "onlyMainContent": True,
            "blockAds": True,
        }
    },
    "lamas"  # Firecrawl account name in ACI
)

if not scrape_result.success or scrape_result.data is None:
    rprint(f"[red]Scrape failed:[/red] {scrape_result.error}")
    raise SystemExit

markdown = scrape_result.data["data"]["markdown"]  # ← actual page text

# 2. Let Mistral extract price, market-cap, and P/E
extract_resp = mistral.chat.complete(
    model="mistral-large-2411",
    messages=[
        {
            "role": "system",
            "content": (
                "You are given Yahoo Finance page content in Markdown. "
                "Return exactly three fields as JSON: "
                "`price`, `marketCap`, and `peRatio`."
            ),
        },
        {"role": "user", "content": markdown},
    ],
)

rprint(extract_resp.choices[0].message.content)