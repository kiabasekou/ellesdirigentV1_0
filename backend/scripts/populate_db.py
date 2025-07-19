#!/usr/bin/env python
"""
Script de population de la base de données avec des données de test réalistes
Crée des utilisateurs, événements, forums, ressources, etc.
"""
import os
import sys
import django
import random
from datetime import datetime, timedelta
from django.utils import timezone
from django.core.files.base import ContentFile

# Ajouter le répertoire parent au path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'plateforme_femmes_backend.settings')
django.setup()

from users.models import Participante, UserProfile


# Données de test réalistes pour le Gabon
PRENOMS_FEMININS = [
    'Aline', 'Betty', 'Cécile', 'Diane', 'Estelle', 'Fabienne', 'Georgette', 
    'Henriette', 'Isabelle', 'Joséphine', 'Karine', 'Léonie', 'Marie', 
    'Nathalie', 'Odette', 'Pauline', 'Rosalie', 'Sylvie', 'Thérèse', 'Ursule',
    'Victoire', 'Yvette', 'Zélie', 'Adrienne', 'Béatrice', 'Christine',
    'Delphine', 'Émilie', 'Florence', 'Gisèle'
]

NOMS_FAMILLE = [
    'Mengue', 'Nzoghe', 'Obame', 'Moussounda', 'Koumba', 'Ndong', 'Ella',
    'Mba', 'Nze', 'Ondo', 'Mintsa', 'Essono', 'Nguema', 'Mboumba', 'Moussavou',
    'Bouanga', 'Mbadinga', 'Nzengue', 'Ovono', 'Bivigou', 'Mihindou', 'Ekomy',
    'Moukagni', 'Nziengui', 'Ogoula', 'Mabika', 'Meyo', 'Minko', 'Mouity', 'Nyangui'
]

VILLES = {
    'estuaire': ['Libreville', 'Owendo', 'Ntoum', 'Cocobeach', 'Cap Estérias'],
    'haut_ogooue': ['Franceville', 'Moanda', 'Mounana', 'Okondja'],
    'moyen_ogooue': ['Lambaréné', 'Ndjolé', 'Fougamou'],
    'ngounie': ['Mouila', 'Ndendé', 'Mbigou', 'Mimongo'],
    'nyanga': ['Tchibanga', 'Mayumba', 'Mabanda'],
    'ogooue_ivindo': ['Makokou', 'Ovan', 'Booué'],
    'ogooue_lolo': ['Koulamoutou', 'Lastoursville', 'Iboundji'],
    'ogooue_maritime': ['Port-Gentil', 'Omboué', 'Gamba'],
    'woleu_ntem': ['Oyem', 'Bitam', 'Minvoul', 'Mitzic']
}

ORGANISATIONS = [
    "Association des Femmes Entrepreneures du Gabon",
    "Réseau des Femmes Leaders",
    "ONG Femmes et Développement",
    "Association pour la Promotion de la Femme Gabonaise",
    "Collectif des Femmes pour la Paix",
    "Mouvement des Femmes Rurales",
    "Association des Femmes Juristes",
    "Réseau des Femmes en Politique",
    "ONG Éducation et Autonomisation",
    "Association des Femmes Commerçantes"
]

POSITIONS = [
    "Présidente d'association",
    "Coordinatrice de projet",
    "Conseillère municipale",
    "Directrice d'ONG",
    "Responsable de programme",
    "Chargée de mission",
    "Secrétaire générale",
    "Trésorière",
    "Responsable communication",
    "Formatrice"
]

COMPETENCES = [
    "Leadership", "Gestion de projet", "Communication", "Négociation",
    "Plaidoyer", "Formation", "Médiation", "Gestion financière",
    "Développement communautaire", "Mobilisation sociale", "Rédaction",
    "Organisation d'événements", "Réseautage", "Analyse politique",
    "Gestion d'équipe", "Fundraising", "Communication digitale",
    "Relations publiques", "Planification stratégique", "Résolution de conflits"
]

INTERETS_POLITIQUES = [
    "Gouvernance locale", "Droits des femmes", "Éducation",
    "Santé publique", "Économie et emploi", "Environnement",
    "Justice sociale", "Développement rural", "Jeunesse",
    "Culture et patrimoine", "Sécurité alimentaire", "Transport",
    "Logement social", "Entrepreneuriat féminin", "Protection de l'enfance"
]


def create_superuser():
    """Crée un superutilisateur admin"""
    print("\n👤 Création du superutilisateur...")
    
    admin_user = None
    if Participante.objects.filter(username='admin').exists():
        print("    ⚠️  Superutilisateur 'admin' existe déjà")
        admin_user = Participante.objects.get(username='admin')
    else:
        admin_user = Participante.objects.create_superuser(
            username='admin',
            email='admin@femmes-politique.ga',
            password='Admin123!@#',
            first_name='Admin',
            last_name='Système',
            nip='ADM000000001',
            region='estuaire',
            ville='Libreville',
            statut_validation='validee'
        )
        print("    ✅ Superutilisateur créé:")
        print("        - Username: admin")
        print("        - Password: Admin123!@#")
    
    # Créer le profil s'il n'existe pas déjà
    if not UserProfile.objects.filter(user=admin_user).exists():
        UserProfile.objects.create(
            user=admin_user,
            bio="Administrateur de la plateforme Femmes en Politique",
            current_position="Administrateur Système"
        )
        print("    ✅ Profil superutilisateur créé/mis à jour.")
    else:
        print("    ⚠️  Profil superutilisateur 'admin' existe déjà")

    return admin_user

def create_test_users(count=30):
    """Crée des utilisatrices de test avec des profils réalistes"""
    print(f"\n👥 Création de {count} utilisatrices de test...")
    
    users = []
    
    for i in range(count):
        # Générer des données aléatoires
        prenom = random.choice(PRENOMS_FEMININS)
        nom = random.choice(NOMS_FAMILLE)
        username = f"{prenom.lower()}.{nom.lower()}{random.randint(1, 99)}"
        email = f"{username}@example.com"
        
        # Sélectionner région et ville
        region = random.choice(list(VILLES.keys()))
        ville = random.choice(VILLES[region])
        
        # Date de naissance (25-65 ans)
        age = random.randint(25, 65)
        date_naissance = datetime.now().date() - timedelta(days=age*365)
        
        # Expérience
        experience = random.choice(['aucune', 'locale', 'regionale', 'nationale'])
        
        # Statut de validation
        statut = random.choices(
            ['validee', 'en_attente', 'rejetee'],
            weights=[70, 20, 10]  # 70% validées, 20% en attente, 10% rejetées
        )[0]
        
        # Créer l'utilisatrice
        try:
            user = Participante.objects.create_user(
                username=username,
                email=email,
                password='Test123!@#',
                first_name=prenom,
                last_name=nom,
                nip=f"GAB{str(random.randint(100000000, 999999999))}",
                phone=f"+241{random.randint(60000000, 77999999)}",
                date_of_birth=date_naissance,
                region=region,
                ville=ville,
                experience=experience,
                statut_validation=statut,
                is_mentor=random.random() < 0.3,  # 30% sont mentors
                email_notifications=random.random() < 0.8  # 80% acceptent les notifications
            )
            
            # Ajouter un document justificatif fictif
            user.document_justificatif.save(
                f'nip_{user.username}.pdf',
                ContentFile(b'Document NIP fictif pour test')
            )
            
            if statut == 'validee':
                user.validated_at = timezone.now() - timedelta(days=random.randint(1, 30))
            elif statut == 'rejetee':
                user.motif_rejet = "Document justificatif non conforme"
            
            user.save()
            
            # Créer le profil étendu
            profile = UserProfile.objects.create(
                user=user,
                bio=f"Engagée dans le développement de ma communauté à {ville}. "
                    f"Passionnée par l'autonomisation des femmes et le progrès social.",
                education_level=random.choice(['licence', 'master', 'secondaire', 'doctorat']),
                current_position=random.choice(POSITIONS),
                organization=random.choice(ORGANISATIONS),
                skills=random.sample(COMPETENCES, random.randint(3, 8)),
                languages=['Français'] + random.sample(['Fang', 'Myènè', 'Nzebi', 'Obamba', 'Téké', 'Anglais'], random.randint(1, 3)),
                political_interests=random.sample(INTERETS_POLITIQUES, random.randint(2, 5)),
                career_goals=f"Aspire à jouer un rôle actif dans la gouvernance locale de {region.title()} "
                            f"et à promouvoir les droits des femmes.",
                website=f"https://www.{username.replace('.', '-')}.ga" if random.random() < 0.3 else "",
                linkedin=f"https://linkedin.com/in/{username}" if random.random() < 0.5 else "",
                twitter=f"@{username.replace('.', '_')}" if random.random() < 0.4 else "",
                is_public=random.random() < 0.8,
                show_contact_info=random.random() < 0.5
            )
            
            if user.is_mentor:
                profile.mentorship_areas = random.sample(
                    ["Leadership politique", "Communication publique", "Gestion de campagne",
                     "Développement personnel", "Stratégie électorale", "Mobilisation communautaire"],
                    random.randint(1, 3)
                )
                profile.save()
            
            users.append(user)
            print(f"   ✅ Créé: {prenom} {nom} ({ville}, {region}) - {statut}")
            
        except Exception as e:
            print(f"   ❌ Erreur création {username}: {str(e)}")
    
    print(f"\n✅ {len(users)} utilisatrices créées avec succès!")
    return users


def create_sample_events():
    """Crée des événements de test"""
    print("\n📅 Création d'événements de test...")
    
    # Importer les modèles nécessaires (à créer dans votre app events)
    # from events.models import Event
    
    events_data = [
        {
            "title": "Formation Leadership Féminin en Politique",
            "description": "Formation intensive de 3 jours sur le leadership politique pour les femmes",
            "location": "Centre de Formation du Ministère, Libreville",
            "date": timezone.now() + timedelta(days=7),
            "max_participants": 50
        },
        {
            "title": "Atelier: Communication Politique Efficace",
            "description": "Techniques de communication pour les candidates aux élections",
            "location": "Hôtel Radisson, Port-Gentil",
            "date": timezone.now() + timedelta(days=14),
            "max_participants": 30
        },
        {
            "title": "Conférence: Femmes et Gouvernance Locale",
            "description": "Table ronde sur la participation des femmes dans la gouvernance locale",
            "location": "Université Omar Bongo, Libreville",
            "date": timezone.now() + timedelta(days=21),
            "max_participants": 100
        },
        {
            "title": "Séminaire: Gestion de Campagne Électorale",
            "description": "Stratégies et techniques pour mener une campagne électorale réussie",
            "location": "Centre Culturel Français, Franceville",
            "date": timezone.now() + timedelta(days=30),
            "max_participants": 40
        },
        {
            "title": "Forum: Entrepreneuriat Féminin et Politique",
            "description": "Comment concilier entrepreneuriat et engagement politique",
            "location": "En ligne via Zoom",
            "date": timezone.now() + timedelta(days=10),
            "max_participants": 200
        }
    ]
    
    # TODO: Créer les événements une fois le modèle Event disponible
    print("   ⚠️  Module events non encore implémenté")
    

def create_sample_forums():
    """Crée des discussions de forum de test"""
    print("\n💬 Création de discussions de forum...")
    
    # Importer les modèles nécessaires (à créer dans votre app forums)
    # from forums.models import ForumCategory, ForumTopic, ForumPost
    
    categories = [
        {
            "name": "Gouvernance et Institutions",
            "description": "Discussions sur les réformes institutionnelles et la gouvernance"
        },
        {
            "name": "Développement Local",
            "description": "Échanges sur le développement des communautés locales"
        },
        {
            "name": "Droits des Femmes",
            "description": "Débats sur l'égalité des genres et les droits des femmes"
        },
        {
            "name": "Éducation et Formation",
            "description": "Partage d'expériences sur l'éducation et la formation"
        }
    ]
    
    # TODO: Créer les catégories et discussions une fois les modèles disponibles
    print("   ⚠️  Module forums non encore implémenté")


def create_sample_resources():
    """Crée des ressources documentaires de test"""
    print("\n📚 Création de ressources documentaires...")
    
    # Importer les modèles nécessaires (à créer dans votre app resources)
    # from resources.models import Resource
    
    resources_data = [
        {
            "title": "Guide Pratique: Se Présenter aux Élections Locales",
            "description": "Guide complet pour les candidates aux élections municipales",
            "type": "guide",
            "file_type": "pdf"
        },
        {
            "title": "Manuel de Communication Politique",
            "description": "Techniques et stratégies de communication pour les femmes en politique",
            "type": "manuel",
            "file_type": "pdf"
        },
        {
            "title": "Étude: Participation des Femmes en Politique au Gabon",
            "description": "Analyse de la représentation féminine dans les institutions gabonaises",
            "type": "etude",
            "file_type": "pdf"
        },
        {
            "title": "Kit de Formation: Leadership Féminin",
            "description": "Supports de formation pour développer le leadership",
            "type": "formation",
            "file_type": "zip"
        },
        {
            "title": "Vidéo: Témoignages de Femmes Élues",
            "description": "Interviews de femmes occupant des postes électifs",
            "type": "video",
            "file_type": "mp4"
        }
    ]
    
    # TODO: Créer les ressources une fois le modèle disponible
    print("   ⚠️  Module resources non encore implémenté")


def display_summary():
    """Affiche un résumé des données créées"""
    print("\n📊 RÉSUMÉ DES DONNÉES CRÉÉES:")
    print("=" * 50)
    
    total_users = Participante.objects.count()
    validated_users = Participante.objects.filter(statut_validation='validee').count()
    pending_users = Participante.objects.filter(statut_validation='en_attente').count()
    rejected_users = Participante.objects.filter(statut_validation='rejetee').count()
    mentors = Participante.objects.filter(is_mentor=True).count()
    
    print(f"👥 Utilisatrices:")
    print(f"   - Total: {total_users}")
    print(f"   - Validées: {validated_users}")
    print(f"   - En attente: {pending_users}")
    print(f"   - Rejetées: {rejected_users}")
    print(f"   - Mentors: {mentors}")
    
    print(f"\n🌍 Répartition par région:")
    for region in VILLES.keys():
        count = Participante.objects.filter(region=region).count()
        print(f"   - {region.title()}: {count}")
    
    print(f"\n📈 Répartition par expérience:")
    for exp in ['aucune', 'locale', 'regionale', 'nationale']:
        count = Participante.objects.filter(experience=exp).count()
        print(f"   - {exp.title()}: {count}")


def main():
    """Fonction principale"""
    print("🚀 POPULATION DE LA BASE DE DONNÉES")
    print("=" * 50)
    
    try:
        # Créer le superuser
        admin = create_superuser()
        
        # Créer les utilisatrices de test
        users = create_test_users(30)
        
        # Créer les événements
        create_sample_events()
        
        # Créer les forums
        create_sample_forums()
        
        # Créer les ressources
        create_sample_resources()
        
        # Afficher le résumé
        display_summary()
        
        print("\n✅ Population de la base de données terminée avec succès!")
        
    except Exception as e:
        print(f"\n❌ Erreur lors de la population: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()