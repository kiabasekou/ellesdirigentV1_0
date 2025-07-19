
✅ Plateforme Femmes Backend v1.1 (Django)

Modules :
- Authentification JWT
- Vérification NIP via CSV
- Upload document (CNI, Passeport, récépissé)
- Statut validation admin : en_attente, validée, rejetée

Installation :
1. cd plateforme_femmes_backend_v1_1_clean
2. python -m venv env && source env/bin/activate
3. pip install -r requirements.txt
4. python manage.py migrate
5. python manage.py createsuperuser
6. python manage.py runserver
