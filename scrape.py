import os, json
from dotenv import load_dotenv
from aci import ACI
from mistralai import Mistral
from rich import print as rprint
from rich.panel import Panel

load_dotenv()
OWNER_ID = "lamas"
MISTRAL_API_KEY="WPu0KpNOAUFviCzNgnbWQuRbz7Zpwyde"

key = os.getenv("ACI_API_KEY")

mistral = Mistral(MISTRAL_API_KEY)
aci = ACI(api_key=os.getenv("ACI_API_KEY"))

def main() -> None: 

    functions = aci.functions.get_definition(
        "BRAVE_SEARCH__WEB_SEARCH"
    )
    
    rprint(Panel("Brave search function definition", style="bold blue"))
    rprint(functions)

    response = mistral.chat.complete(
        model="mistral-large-2411",
        messages=[
            {
                "role": "system",
                "content": "You are a helpful assistant with access to a variety of tools.",
            },
            {
                "role": "user",
                "content": "What is the Google link?",
            },
        ],
        tools=[functions],
        tool_choice="required",  # force the model to generate a tool call for demo purposes
    )

    tool_call = (
        response.choices[0].message.tool_calls[0]
        if response.choices[0].message.tool_calls
        else None
    )

    if tool_call:
        rprint(Panel(f"Tool call: {tool_call.function.name}", style="bold green"))
        rprint(f"arguments: {tool_call.function.arguments}")

        result = aci.functions.execute(
            tool_call.function.name,
            json.loads(tool_call.function.arguments),
            linked_account_owner_id=OWNER_ID,
        )
        rprint(Panel("Function Call Result", style="bold yellow"))
        rprint(result)

main()
