import os, json
from dotenv import load_dotenv
from aci import ACI
from aci.meta_functions import ACISearchFunctions
from aci.types.functions import FunctionDefinitionFormat
from mistralai import Mistral
from rich import print as rprint
from rich.panel import Panel
import yfinance as yf
import pandas as pd
import numpy as np
import pandas_ta as ta
import ast 
import time
import logging

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('scrape.log')
    ]
)
logger = logging.getLogger(__name__)

load_dotenv()                                 

aci     = ACI(api_key=os.getenv("ACI_API_KEY"))
mistral = Mistral(api_key=os.getenv("MISTRAL_API_KEY"))


def get_keyfacts(ticker: str) -> str:
    try:
        logger.info(f"Fetching key facts for {ticker}")
        start_time = time.time()
        
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
        
        elapsed_time = time.time() - start_time
        logger.info(f"Key facts fetch completed for {ticker} in {elapsed_time:.2f} seconds")
        
        markdown = scrape_result.data["data"]["markdown"]  # ← actual page text
        extract_resp = mistral.chat.complete(
            model="mistral-large-2411",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are given Yahoo Finance page content in Markdown of a specific ticker. "
                        "Key numbers of interest of the stock is"
                        "price, bid, ask, change today in percent of price"
                        "Write a free flow text summary of these key numbers."
                        "Start with a podcast introduction, welcoming the listener. "
                    ),
                },
                {"role": "user", "content": markdown},
            ],
        )

        logger.info(f"Key facts summary generated for {ticker}")
        return extract_resp.choices[0].message.content 

    except Exception as e:
        logger.error(f"Error in get_keyfacts for {ticker}: {str(e)}")
        return f"Error fetching key facts for {ticker}: {str(e)}"

def get_news_bullets(ticker: str) -> str:
    try:
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
                        f"You are given the Yahoo Finance news page of the stock '{ticker}' in Markdown format.\n"
                        "Your task is to extract and summarize the key takeaways from the most recent articles.\n"
                        "Return 5–7 concise bullet points summarizing the major updates or themes regarding this stock.\n"
                        "Use plain English, keep each bullet point brief (max 2 lines). No intro or conclusion, only the bullet points."
                    ),
                },
                {"role": "user", "content": news_md},
            ],
        )

        return news_resp.choices[0].message.content.strip()

    except Exception as e:
        return f"Failed to retrieve key notes for {ticker}: {e}"

def get_news(ticker: str) -> str:
    try:
        logger.info(f"Fetching news for {ticker}")
        start_time = time.time()
        
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
        
        elapsed_time = time.time() - start_time
        logger.info(f"News fetch completed for {ticker} in {elapsed_time:.2f} seconds")
        
        if not news_scrape.data or "data" not in news_scrape.data or "markdown" not in news_scrape.data["data"]:
            logger.error(f"No valid data structure for {ticker} news")
            return f"Error fetching news for {ticker}: No valid data structure"
            
        news_md = news_scrape.data["data"]["markdown"]
        
        if not news_md:
            logger.error(f"No markdown content found for {ticker} news")
            return f"Error fetching news for {ticker}: No markdown content"
            
        news_resp = mistral.chat.complete(
            model="mistral-large-latest",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You receive the Yahoo Finance News page for a specific ticker. "
                        "Write three paragraphs about the most stressing news about this stock in free text, not bullet points."
                    ),
                },
                {"role": "user", "content": news_md},
            ],
        )
        
        logger.info(f"News summary generated for {ticker}")
        return news_resp.choices[0].message.content

    except Exception as e:
        logger.error(f"Error in get_news for {ticker}: {str(e)}")
        return f"Error fetching news for {ticker}: {str(e)}"

def get_longer_news(ticker: str) -> str:


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

        main_news_md = main_news_data["data"]["markdown"]
        
            
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

def get_sector_news(sector: str) -> str:
    try:
        logger.info(f"Fetching news for sector: {sector}")
        start_time = time.time()
        
        news_scrape = aci.functions.execute(
            "FIRECRAWL__SCRAPE",
            {
                "body": {
                    "url": f"https://finance.yahoo.com/sectors/{sector}/news",
                    "formats": ["markdown"],
                    "onlyMainContent": True,
                    "blockAds": True,
                }
            },
            "lamas",
        )
        
        elapsed_time = time.time() - start_time
        logger.info(f"Sector news fetch completed for {sector} in {elapsed_time:.2f} seconds")
        
        if not news_scrape.data or "data" not in news_scrape.data or "markdown" not in news_scrape.data["data"]:
            logger.error(f"No valid data structure for sector {sector} news")
            return f"Error fetching sector news for {sector}: No valid data structure"
            
        news_md = news_scrape.data["data"]["markdown"]
        
        if not news_md:
            logger.error(f"No markdown content found for sector {sector} news")
            return f"Error fetching sector news for {sector}: No markdown content"
            
        news_resp = mistral.chat.complete(
            model="mistral-large-latest",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You receive the markdown content from Yahoo Finance page for a specifc SECTOR."
                        "Please write a brief summary on how the SECTOR is performing recently, fluent text no bullet points"
                    ),
                },
                {"role": "user", "content": news_md},
            ],
        )
        
        logger.info(f"Sector news summary generated for {sector}")
        return news_resp.choices[0].message.content

    except Exception as e:
        logger.error(f"Error in get_sector_news for {sector}: {str(e)}")
        return f"Error fetching sector news for {sector}: {str(e)}"

def get_market_news(market: str) -> str:
    try:
        logger.info(f"Fetching news for market: {market}")
        start_time = time.time()
        
        news_scrape = aci.functions.execute(
            "FIRECRAWL__SCRAPE",
            {
                "body": {
                    "url": f"https://finance.yahoo.com/markets/{market}",
                    "formats": ["markdown"],
                    "onlyMainContent": True,
                    "blockAds": True,
                }
            },
            "lamas",
        )
        
        elapsed_time = time.time() - start_time
        logger.info(f"Market news fetch completed for {market} in {elapsed_time:.2f} seconds")
        
        if not news_scrape.data or "data" not in news_scrape.data or "markdown" not in news_scrape.data["data"]:
            logger.error(f"No valid data structure for market {market} news")
            return f"Error fetching market news for {market}: No valid data structure"
            
        news_md = news_scrape.data["data"]["markdown"]
        
        if not news_md:
            logger.error(f"No markdown content found for market {market} news")
            return f"Error fetching market news for {market}: No markdown content"
            
        news_resp = mistral.chat.complete(
            model="mistral-large-latest",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You receive the markdown content from Yahoo Finance page for a specific MARKET."
                        "Please scrape this page and write brief summary on the news in thiss specific MARKET recently in free text, not bullet points. "
                    ),
                },
                {"role": "user", "content": news_md},
            ],
        )
        
        logger.info(f"Market news summary generated for {market}")
        return news_resp.choices[0].message.content

    except Exception as e:
        logger.error(f"Error in get_market_news for {market}: {str(e)}")
        return f"Error fetching market news for {market}: {str(e)}"

def understand_tickrs(text: str) -> list[str]: 

    resp = mistral.chat.complete(
        model="mistral-large-2411",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are given a string, with stocks that wants to be examined."
                    "Return ONLY a array of the stock tickers (all CAPS, no duplicates, comma separated). Do not return ANYTHING else. "
                    "As an example, if the user writes that they are interested in Apple and Google, you should return [AAPl, GOOGL]."
                    "It can also be the case that the user asks for the three biggest tech companies, in which case you should return them."
                    "NOTE: If no companies what so ever are mentioned, it should be left empty. "
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

def understand_sectors(text: str) -> list[str]:

    resp = mistral.chat.complete(
        model="mistral-large-2411",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are given a string, with stocks and sectors of interest"
                    "Return ONLY a array of the interesting sectors, according to categories below. Do not return ANYTHING else. "
                    "Sectors are: ['technology', 'energy', 'healthcare', 'financial-services', 'consumer-cyclical', 'communication-services', 'consumer-defensive', 'industrials', 'utilities', 'real-estate', 'basic-materials']"
                    "As an example, if the user writes that they are interested in energy sector, you should return ['energy']."
                    "NOTE: This is not a ticker. It can also be empty, if there is not a apparent interest in a sector."

                ),
            },
            {"role": "user", "content": text},
        ],
    )
    return resp.choices[0].message.content        
   
def understand_markets(text: str) -> list[str]: 

    resp = mistral.chat.complete(
        model="mistral-large-2411",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are given a string, with stocks, sectors and markets of interest"
                    "Return ONLY a array of the interesting MARKETS, according to categories below. Do not return ANYTHING else. "
                    "Markets are: ['world-indices', 'futures', 'bonds', 'currencies', 'options', 'stocks', 'crypto', 'private-companies', 'efts', 'mutual-funds']"
                    "As an example, if the user writes that they are interested in currencies, you should return ['currencies']."
                    "NOTE: This is not a ticker. It can also be empty, if there is not a apparent interest in a sector."

                ),
            },
            {"role": "user", "content": text},
        ],
    )
    return resp.choices[0].message.content

def generate_podcast(text: str) -> str:
    """
    Generate a podcast script from the supplied news-summary text.
    """
    try:
        logger.info("Generating podcast script")
        start_time = time.time()
        
        podcast_resp = mistral.chat.complete(
            model="mistral-large-latest",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are given a content text that summarizes the latest news about specific stocks, markets and sectors. "
                        "Generate a podcast script based on this text, making it engaging and suitable for audio format. "
                        "DO NOT USE ANY THINKING OR REASONING IN THE ANSWER, JUST GENERATE THE PODCAST SCRIPT. "
                        "Start with a catchy introduction"
                        "Keep the information of the stock, sector and market similar in length, so that the podcast is balanced. "
                        "Do absolutely not make the text longer than 8000 charachters!"
                        "Use a friendly tone, speak directly to the listener, no bullet points—free text only. "
                        "Keep it concise but informative (about 5 minutes when read aloud). "
                        "Avoid repeating information." 
                        "Only return the final podcast script."
                        "No more delimiters like [Outro] or [Intro]. "
                        "no Host:"
                        "no [Closing music] or ### Final Podcast Script"
                        "return the thinking process in <thinking> and </thinking>"
                        "return the final podcast script after [Final Podcast Script]"
                    ),
                },
                {"role": "user", "content": text},
            ],
        )
        
        elapsed_time = time.time() - start_time
        logger.info(f"Podcast script generated in {elapsed_time:.2f} seconds")
        
        return podcast_resp.choices[0].message.content
        
    except Exception as e:
        logger.error(f"Error in generate_podcast: {str(e)}")
        return f"Error generating podcast: {str(e)}"

def get_technical_summary(ticker: str) -> str:
    try:
        logger.info(f"Fetching technical analysis for {ticker}")
        start_time = time.time()
        
        stock = yf.Ticker(ticker)
        hist = stock.history(period="1mo")
        
        if hist.empty:
            logger.error(f"No historical data found for {ticker}")
            return f"Error analyzing {ticker}: No historical data"
            
        # 기술적 지표 계산
        hist['SMA_20'] = hist['Close'].rolling(window=20).mean()
        hist['RSI'] = ta.rsi(hist['Close'])
        macd = ta.macd(hist['Close'])
        hist['MACD'] = macd['MACD_12_26_9']
        hist['MACD_Signal'] = macd['MACDs_12_26_9']
        
        latest = hist.iloc[-1]
        summary_lines = []
        
        # 이동평균선 분석
        if latest['Close'] > latest['SMA_20']:
            summary_lines.append("Price is above 20-day moving average, indicating bullish trend.")
        else:
            summary_lines.append("Price is below 20-day moving average, indicating bearish trend.")
            
        # RSI 분석
        if latest['RSI'] > 70:
            summary_lines.append("RSI indicates overbought conditions.")
        elif latest['RSI'] < 30:
            summary_lines.append("RSI indicates oversold conditions.")
        else:
            summary_lines.append("RSI is in neutral territory.")
            
        # MACD 분석
        if latest['MACD'] > latest['MACD_Signal']:
            momentum = "bullish"
        else:
            momentum = "bearish"
        summary_lines.append(f"MACD indicates {momentum} momentum.")
        
        elapsed_time = time.time() - start_time
        logger.info(f"Technical analysis completed for {ticker} in {elapsed_time:.2f} seconds")
        
        # Format output
        date_str = latest.name.date() if hasattr(latest.name, 'date') else "latest"
        output = f"Technical Summary for {ticker} ({date_str}):\n"
        output += f"\n Closing Price: ${latest['Close']:.2f}\n"
        output += "\n".join(f"- {line}" for line in summary_lines)
        
        return output
        
    except Exception as e:
        logger.error(f"Error in get_technical_summary for {ticker}: {str(e)}")
        return f"Error analyzing {ticker}: {str(e)}"

if __name__ == "__main__": 

    input = "I'm interested in tesla, crypto and currencies. Can you hold a less formal tone?"  
    keys = understand_tickrs(input) 
    sectors = understand_sectors(input) 
    markets = understand_markets(input)

    #print(keys) 
    #print(sectors)
    #print(markets)

    summary = "" 

    for key in keys:
        summary += get_keyfacts(key) 
        summary += get_technical_summary(key)
        summary += get_news(key) 


    sectors  = ast.literal_eval(sectors)   
    markets  = ast.literal_eval(markets)  

    for sec in sectors:
        summary += get_sector_news(sec) 
    
    for market in markets:
        summary += get_market_news(market)

    print(summary)

    #print(generate_podcast(summary))

