from openai import OpenAI
from .config import openai_config

openai_api_key = openai_config['api_key']
client = OpenAI(api_key=openai_api_key)

def get_category(vendor, categories):
    response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {
        "role": "system",
        "content": [
            {
            "type": "text",
            "text": "You are a receipt categorizer. Return me the category that matches the vendor the most. I just want the category name in the response. If it matches more than one or does not have a match, pick the one that is most likely."
            }
        ]
        },
        {
        "role": "user",
        "content": [
            {
            "type": "text",
            "text": f"Vendor: {vendor}"
            }
        ]
        },
        {
        "role": "user",
        "content": [
            {
            "type": "text",
            "text": f"Categories: {categories}"
            }
        ]
        }
    ],
    temperature=1,
    max_tokens=2048,
    top_p=1,
    frequency_penalty=0,
    presence_penalty=0,
    response_format={
        "type": "text"
    }
    )

    return response.choices[0].message.content

