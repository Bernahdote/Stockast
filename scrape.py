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

prompt = (
    "You are a helpful assistant with access to a unlimited number of tools via a meta function: "
    "ACI_SEARCH_FUNCTIONS"
    "You can use ACI_SEARCH_FUNCTIONS to find relevant functions across all apps."
    "Once you have identified the functions you need to use, you can append them to the tools list and use them in future tool calls."
)

tools_meta = [
    ACISearchFunctions.to_json_schema(FunctionDefinitionFormat.OPENAI),
]

tools_retrieved: list[dict] = []


def main() -> None:
    # Start the LLM processing loop
    chat_history: list[dict] = []

    while True:
        rprint(Panel("Waiting for LLM Output", style="bold blue"))
        response = mistral.chat.complete(
            model="mistral-large-latest",
            messages=[
                {
                    "role": "system",
                    "content": prompt,
                },
                {
                    "role": "user",
                    "content": "Navigate to https://finance.yahoo.com/quote/AAPL/. Scrape the data with FIRECRAWL__SEARCH. With the scraped data, extract ONLY: price, change in percen, bid and ask. Return a summary in free text of ONLY these keys"
                },
            ]
            + chat_history,
            tools=tools_meta + tools_retrieved,
            # tool_choice="required",  # force the model to generate a tool call
            parallel_tool_calls=False,
        )

        # Process LLM response and potential function call (there can only be at most one function call)
        content = response.choices[0].message.content
        tool_call = (
            response.choices[0].message.tool_calls[0]
            if response.choices[0].message.tool_calls
            else None
        )
        if content:
            rprint(Panel("LLM Message", style="bold green"))
            rprint(content)
            chat_history.append({"role": "assistant", "content": content})

        # Handle function call if any
        if tool_call:
            rprint(
                Panel(f"Function Call: {tool_call.function.name}", style="bold yellow")
            )
            rprint(f"arguments: {tool_call.function.arguments}")

            chat_history.append({"role": "assistant", "tool_calls": [tool_call]})
            result = aci.handle_function_call(
                tool_call.function.name,
                json.loads(tool_call.function.arguments),
                linked_account_owner_id="lamas",
                allowed_apps_only=True,
                format=FunctionDefinitionFormat.OPENAI,
            )
            # if the function call is a get, add the retrieved function definition to the tools_retrieved
            if tool_call.function.name == ACISearchFunctions.get_name():
                tools_retrieved.extend(result)

            rprint(Panel("Function Call Result", style="bold magenta"))
            rprint(result)
            # Continue loop, feeding the result back to the LLM for further instructions
            chat_history.append(
                {
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(result),
                }
            )
        else:
            # If there's no further function call, exit the loop
            rprint(Panel("Task Completed", style="bold green"))
            break





""" # 1. Scrape the Yahoo Finance page via Firecrawl (markdown output)

def get_summarize(): 
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
                    "Return these fields as JSON: "
                    "`price`, `marketCap`, and `peRatio`."
                    "Also, provide the change in percent of the price"
                ),
            },
            {"role": "user", "content": markdown},
        ],
    )

    rprint(extract_resp.choices[0].message.content) """


if __name__ == "__main__": 
    main()
