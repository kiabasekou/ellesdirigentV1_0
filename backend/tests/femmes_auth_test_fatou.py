import requests

BASE_URL = "http://localhost:8000/api"

# === 1. INSCRIPTION AVEC DOCUMENT ===
register_data = {
    'username': 'fatou2025',
    'email': 'fatou.m@example.com',
    'password': 'demo1234',
    'first_name': 'Fatou',
    'last_name': 'Mbadinga',
    'nip': '987654321098',
    'region': 'Ngounié',
    'ville': 'Mouila',
    'experience': 'nationale',
}
files = {
    'document_justificatif': open('C:/Users/AHMED/Documents/nip_fatou.pdf', 'rb')  # <-- adapter ce chemin
}

print("🔄 Inscription...")
register_resp = requests.post(f"{BASE_URL}/register/", data=register_data, files=files)
print(register_resp.status_code, register_resp.json())

# === 2. CONNEXION ===
login_data = {
    'username': 'fatou2025',
    'password': 'demo1234'
}
print("\n🔐 Connexion...")
login_resp = requests.post(f"{BASE_URL}/token/", json=login_data)
print(login_resp.status_code, login_resp.json())

tokens = login_resp.json()
access_token = tokens.get("access")
refresh_token = tokens.get("refresh")

# === 3. PROFIL (protégé) ===
headers = {
    "Authorization": f"Bearer {access_token}"
}
print("\n👤 Accès au profil...")
profile_resp = requests.get(f"{BASE_URL}/profile/", headers=headers)
print(profile_resp.status_code, profile_resp.json())

# === 4. REFRESH TOKEN ===
refresh_data = {"refresh": refresh_token}
print("\n🔁 Rafraîchissement du token...")
refresh_resp = requests.post(f"{BASE_URL}/token/refresh/", json=refresh_data)
print(refresh_resp.status_code, refresh_resp.json())