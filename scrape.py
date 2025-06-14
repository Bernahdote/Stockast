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


def get_keys(ticker) -> str:

    scrape_result = aci.functions.execute(
        "FIRECRAWL__SCRAPE",
        {
            "body": {
                "url": f"https://finance.yahoo.com/quote/{ticker}", 
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
                    "Write a free flow text summary of these key numbers. Start directly, you do not need an introducing sentence."
                ),
            },
            {"role": "user", "content": markdown},
        ],
    )

    return extract_resp.choices[0].message.content 


def get_news(ticker) -> str:

        news_scrape = aci.functions.execute(
            "FIRECRAWL__SCRAPE",
            {
                "body": {
                    "url": f"https://finance.yahoo.com/quote/{ticker}/news",
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
                        "You receive the Yahoo Finance News page for a specific stock. "
                        "Write three paragraphs about the most stressing news about this stock in free text, not bullet points."
                    ),
                },
                {"role": "user", "content": news_md},
            ],
        )


        return news_resp.choices[0].message.content




if __name__ == "__main__": 
    keys = get_keys("VEON") 
    news = get_news("VEON")

    sum = "".join([keys, news])

    print(sum)
