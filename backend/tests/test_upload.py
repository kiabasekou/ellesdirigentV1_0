import requests

# Remplacer par ton vrai token JWT
TOKEN = "votre_token_ici"

# Remplacer par le chemin de votre fichier test (PDF ou image scannée)
file_path = "test_doc.pdf"

url = "http://127.0.0.1:8000/api/upload-documents/"

headers = {
    "Authorization": f"Bearer {TOKEN}"
}

files = {
    "document_justificatif": open(file_path, "rb")
}

response = requests.post(url, headers=headers, files=files)

print("Statut HTTP:", response.status_code)
print("Réponse JSON:", response.json())