import requests
import base64
import json

# Connexion au backend
url = "http://localhost:8000/api/token/"
credentials = {
    "username": "fatou2025",
    "password": "demo1234"
}

response = requests.post(url, data=credentials)

if response.status_code == 200:
    tokens = response.json()
    access_token = tokens["access"]
    print("✅ Connexion réussie. Décodage du token...\n")

    payload = access_token.split(".")[1]
    padded = payload + "=" * ((4 - len(payload) % 4) % 4)
    decoded_bytes = base64.urlsafe_b64decode(padded)
    decoded = json.loads(decoded_bytes.decode("utf-8"))

    print("🧾 Contenu du token :\n")
    print(json.dumps(decoded, indent=2))
else:
    print(f"❌ Erreur {response.status_code}")
    print(response.text)
