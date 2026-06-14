import requests

API_KEY = "YOUR_API_KEY_HERE"
MODEL = "gemini-2.0-flash"
PROMPT = "Say hello in one sentence."

url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"

payload = {
    "contents": [{"parts": [{"text": PROMPT}]}]
}

try:
    response = requests.post(url, json=payload)
    data = response.json()

    if response.ok:
        reply = data["candidates"][0]["content"]["parts"][0]["text"]
        print("✅ API is working!")
        print(f"Model: {MODEL}")
        print(f"Response: {reply}")
    else:
        print(f"❌ Error {response.status_code}: {data['error']['message']}")

except Exception as e:
    print(f"❌ Exception: {e}")