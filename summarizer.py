# summarizer.py

import uuid
import weaviate
import os
from mistralai import Mistral
from dotenv import load_dotenv
from weaviate.classes.init import Auth

load_dotenv()


weaviate_client = weaviate.connect_to_weaviate_cloud(
    cluster_url=os.getenv("WEAVIATE_URL"),
    auth_credentials=Auth.api_key(os.getenv("WEAVIATE_API_KEY")),
)

mistral = Mistral(api_key=os.getenv("MISTRAL_API_KEY"))

# def ensure_weaviate_class():
#     class_name = "ArticleSummary"
#     if not weaviate_client.schema.contains({"class": class_name}):
#         schema = {
#             "class": class_name,
#             "properties": [
#                 {"name": "ticker", "dataType": ["text"]},
#                 {"name": "url", "dataType": ["text"]},
#                 {"name": "summary", "dataType": ["text"]},
#             ],
#             "vectorizer": "none",
#         }
#         weaviate_client.schema.create_class(schema)

# ensure_weaviate_class()
import weaviate
import weaviate.classes.config as wvcc
def ensure_weaviate_class():
    class_name = "ArticleSummary"

    try:
        existing = weaviate_client.collections.list_all()
        if class_name not in existing:
            weaviate_client.collections.create(
                name=class_name,
                properties=[
                    {"name": "ticker", "data_type": wvcc.DataType.TEXT},
                    {"name": "url", "data_type": wvcc.DataType.TEXT},
                    {"name": "summary", "data_type": wvcc.DataType.TEXT},
                ],
                vectorizer_config=wvcc.Configure.Vectorizer.none()
            )
            print(f"✅ Weaviate class '{class_name}' created.")
        else:
            print(f"ℹ️ Weaviate class '{class_name}' already exists.")

    except Exception as e:
        print(f"❌ Failed to check or create Weaviate class: {e}")

def get_or_generate_summary(article_md: str, url: str, ticker: str) -> str:
    class_name = "ArticleSummary"
    collection = weaviate_client.collections.get(class_name)
    
    url_embedding = mistral.embeddings.create(
        model="mistral-embed",
        inputs=url
    ).data[0].embedding
    
   
    results = collection.query.near_vector(
        vector=url_embedding,
        limit=1,
        return_properties=["summary", "url"]
    )
    if results.objects:
        return results.objects[0].properties["summary"]


  
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
    summary = summary_resp.choices[0].message.content.strip()
    
    embedding = mistral.embeddings.create(
    model="mistral-embed",  # 예시
    inputs=summary)
    embedding = embedding.data[0].embedding

 
    weaviate_client.data_object.create(
        data_object={
            "ticker": ticker,
            "url": url,
            "summary": summary,
        },
        vector=embedding,
        class_name=class_name,
        uuid=str(uuid.uuid4())
    )

    return summary

ensure_weaviate_class()
import atexit
atexit.register(lambda: weaviate_client.close())