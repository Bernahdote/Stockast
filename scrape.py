import os, json
from dotenv import load_dotenv
from aci import ACI
from mistralai import Mistral

load_dotenv()
aci = ACI(api_key=os.getenv("ACI_API_KEY"))
OWNER_ID = "lamas"

key = os.getenv("ACI_API_KEY")
print("▶️ Using ACI_API_KEY:", repr(key))

START_FN = "SCRAPYBARA__START_INSTANCE"
BASH_FN  = "SCRAPYBARA__RUN_BASH_ACTIONS"
STOP_FN  = "SCRAPYBARA__STOP_INSTANCE"

# 1) Start a new VM and print the raw response
start_resp = aci.handle_function_call(
    START_FN,
    {"body": {"instance_type": "ubuntu", "timeout_hours": 1}},
    linked_account_owner_id=OWNER_ID
)
print("▶️ Raw start response:", json.dumps(start_resp, indent=2))

# 2) Extract the instance ID (either snake_case or camelCase)
instance_id = start_resp.get("instance_id") 
if not instance_id:
    raise KeyError(f"Could not find instance_id in start_resp: {start_resp!r}")
print(f"✅ Using instance ID = {instance_id}")

# 3) Run the scrape via BASH_FN
bash_script = r"""
pip install --quiet requests beautifulsoup4
python3 - << 'EOF'
import requests
from bs4 import BeautifulSoup

url  = "https://finance.yahoo.com/quote/AAPL"
resp = requests.get(url, headers={"User-Agent":"aci-bot"})
soup = BeautifulSoup(resp.text, "html.parser")
price = soup.find("fin-streamer", {"data-field":"regularMarketPrice"}).text
print(price)
EOF
"""
bash_resp = aci.handle_function_call(
    BASH_FN,
    {"body": {
        # match the key you saw above; if instanceId, use that
        ("instanceId" if "instanceId" in start_resp else "instance_id"): instance_id,
        "commands": [bash_script]
    }}
)
print("🖥️  Raw bash response:", json.dumps(bash_resp, indent=2))
print("Scraped price:", bash_resp.get("output", "").strip())

# 4) Tear down the VM
stop_resp = aci.handle_function_call(
    STOP_FN,
    {"body": {
        ("instanceId" if "instanceId" in start_resp else "instance_id"): instance_id
    }}
)
print(f"⏹️ Stopped instance: {instance_id}")
