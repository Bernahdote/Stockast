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


def get_longer_news(ticker) -> str:

    try:
        main_news_page_scrape = aci.functions.execute(
            "FIRECRAWL__SCRAPE",
            {
                "body": {
                    "url": f"https://finance.yahoo.com/quote/{ticker}/news",
                    "formats": ["markdown"], 
                    "onlyMainContent": True, 
                    "blockAds": True,
                }
            },
            "lamas"
        )
        main_news_data = main_news_page_scrape.data
        if not main_news_data or "data" not in main_news_data or "markdown" not in main_news_data["data"]:
            rprint(Panel("Failed to retrieve valid data structure from main news page scrape.", style="bold red"))
            error_details = main_news_data.get("error") if main_news_data else None
            if not error_details and hasattr(main_news_page_scrape, 'error') and main_news_page_scrape.error:
                 error_details = main_news_page_scrape.error
            if error_details:
                 rprint(f"Error details: {error_details}")
            return
        main_news_md = main_news_data["data"]["markdown"]
        if not main_news_md: # Check if markdown content itself is empty
            rprint(Panel("Markdown content is empty for main news page.", style="bold red"))
            return
            
    except Exception as e:
        rprint(Panel(f"Failed to scrape main news page: {e}", style="bold red"))
        return

    rprint(Panel("Extracting article links using Mistral", style="bold blue"))
    article_links = []
    try:
        links_extraction_resp = mistral.chat.complete(
            model="mistral-large-latest", 
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"You are given Markdown content from the Yahoo Finance news page for {ticker}. "
                        "Extract all unique URLs that appear to be links to individual news articles. "
                        "Many links on Yahoo Finance might be relative (e.g., /news/some-article-12345.html or /video/some-video-1234.html). "
                        "Convert these to absolute URLs by prepending 'https://finance.yahoo.com'. "
                        "Return a JSON object with a single key 'article_urls', where the value is a list of these absolute URLs. "
                        "Example: {'article_urls': ["'https://finance.yahoo.com/news/article1.html'"]}. "
                        "Focus on links that are clearly news articles or news-related videos. Ensure all URLs in the list are strings."
                        "Use only the first 10 articles. "
                    ),
                },
                {"role": "user", "content": main_news_md},
            ],
            response_format={"type": "json_object"} 
        )
        
        extracted_content_str = links_extraction_resp.choices[0].message.content
        extracted_data = json.loads(extracted_content_str)
        article_links_raw = extracted_data.get("article_urls", [])

        if not isinstance(article_links_raw, list):
            rprint(Panel("Mistral did not return a list for 'article_urls'.", style="bold red"))
            rprint(f"Mistral's response: {extracted_content_str}")
            return
        
        # Ensure all links are strings and filter for absolute URLs
        article_links = [str(link) for link in article_links_raw if isinstance(link, (str, bytes))] 
        article_links = [link for link in article_links if link.startswith("http")] 

            
    except json.JSONDecodeError as e:
        rprint(Panel(f"Failed to parse JSON from Mistral's link extraction response: {e}", style="bold red"))
        if 'links_extraction_resp' in locals() and hasattr(links_extraction_resp, 'choices') and links_extraction_resp.choices:
             rprint(f"Mistral's raw response: {links_extraction_resp.choices[0].message.content}")
        return
    except Exception as e:
        rprint(Panel(f"Failed to extract links using Mistral: {e}", style="bold red"))
        if 'links_extraction_resp' in locals() and hasattr(links_extraction_resp, 'choices') and links_extraction_resp.choices:
             rprint(f"Mistral's raw response: {links_extraction_resp.choices[0].message.content}")
        return
    summaries = ""
    for i, link_url in enumerate(article_links):

        try:
            article_scrape_result = aci.functions.execute(
                "FIRECRAWL__SCRAPE",
                {
                    "body": {
                        "url": link_url,
                        "formats": ["markdown"],
                        "onlyMainContent": True,
                        "blockAds": True,
                    }
                },
                "lamas"
            )
            article_data = article_scrape_result.data
            if not article_data or "data" not in article_data or "markdown" not in article_data["data"]:
                rprint(Panel(f"No valid data structure for {link_url}. Skipping.", style="bold yellow"))
                error_details = article_data.get("error") if article_data else None
                if not error_details and hasattr(article_scrape_result, 'error') and article_scrape_result.error:
                    error_details = article_scrape_result.error
                if error_details:
                    rprint(f"Scraping error details: {error_details}")
                continue
            article_md = article_data["data"]["markdown"]

            if not article_md:
                rprint(Panel(f"No markdown content found for {link_url}. Skipping.", style="bold yellow"))
                continue

            summary_resp = mistral.chat.complete(
                model="mistral-large-latest",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are given the Markdown content of a news article. "
                            "Provide a concise summary of this article in free text. Focus on the key information and main points."
                        ),
                    },
                    {"role": "user", "content": article_md},
                ],
            )
            summary_content = summary_resp.choices[0].message.content
            summaries = summaries + summary_content
    
            rprint(summary_content)

        except Exception as e:
            rprint(Panel(f"Failed to process article {link_url}: {e}", style="bold red"))
        
    return summaries


def understand_input(text: str) -> list[str]: 

    resp = mistral.chat.complete(
        model="mistral-large-2411",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are given a string, with stocks that wants to be examined."
                    "Return ONLY a array of the stock tickers (all CAPS, no duplicates, comma separated)"
                    "As an example, if the user writes that they are interested in Google and Apple, you should return [AAPl, GOOGL]."
                ),
            },
            {"role": "user", "content": text},
        ],
    )
    raw = resp.choices[0].message.content          
    tokens = [t.strip("[] ")                       
              for t in raw.split(",")             
              if t.strip(" []")]                  
    return tokens


if __name__ == "__main__": 

    keys = understand_input("I'm interested in Google, Nividia and Apple stocks") 

    print(keys) 
    sum = ""
    for key in keys: 
        keyfacts = get_keys(key) 
        news = get_news(key)
        sum = sum.join([keyfacts, news])

    print(sum)