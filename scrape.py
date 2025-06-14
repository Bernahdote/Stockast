import os, json
from dotenv import load_dotenv
from aci import ACI
from aci.meta_functions import ACISearchFunctions
from aci.types.functions import FunctionDefinitionFormat
from mistralai import Mistral
from rich import print as rprint
from rich.panel import Panel

load_dotenv()                                 

aci     = ACI(api_key=os.getenv("ACI_API_KEY"))
mistral = Mistral("WPu0KpNOAUFviCzNgnbWQuRbz7Zpwyde")


def get_keys(): 
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

    markdown = scrape_result.data["data"]["markdown"]  # ← actual page text

    # 2. Let Mistral extract price, market-cap, and P/E
    extract_resp = mistral.chat.complete(
        model="mistral-large-2411",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are given Yahoo Finance page content in Markdown. "
                    "Write a summary of the following key numbers: "
                    "price, bid, ask, change today in percent of price"
                    "Write a free flow text summary of these key numbers."
                ),
            },
            {"role": "user", "content": markdown},
        ],
    )

    rprint(extract_resp.choices[0].message.content) 


def get_news():
        news_scrape = aci.functions.execute(
            "FIRECRAWL__SCRAPE",
            {
                "body": {
                    "url": "https://finance.yahoo.com/quote/AAPL/news",
                    "formats": ["markdown"],
                    "onlyMainContent": True,
                    "blockAds": True,
                }
            },
            "lamas",
        )

        news_md = news_scrape.data["data"]["markdown"]



        news_resp = mistral.chat.complete(
            model="mistral-large-2411",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You receive Markdown for the AAPL news page. "
                        "Return a JSON array called `articles`, each element having "
                        "`headline`, `url`, and `published`. Write a short summary of the most stressing news in free text."
                    ),
                },
                {"role": "user", "content": news_md},
            ],
        )


        rprint(news_resp.choices[0].message.content)




if __name__ == "__main__": 
    get_keys() 
    get_news() 
