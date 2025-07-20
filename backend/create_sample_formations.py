#!/usr/bin/env python
"""
Script pour créer des formations de démonstration
À exécuter depuis le dossier backend : python create_sample_formations.py
"""

import os
import sys
import django
from datetime import datetime, timedelta

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'plateforme_femmes_backend.settings')
django.setup()

from training.models import Formation, Module
from users.models import Participante

def create_sample_formations():
    """Crée des formations d'exemple"""
    
    print("🎓 Création des formations de démonstration...")
    
    # Récupérer un utilisateur admin pour créer les formations
    try:
        admin_user = Participante.objects.filter(is_staff=True).first()
        if not admin_user:
            print("❌ Aucun utilisateur admin trouvé. Créez d'abord un superuser.")
            return
    except Exception as e:
        print(f"❌ Erreur lors de la récupération de l'admin: {e}")
        return
    
    formations_data = [
        {
            'titre': 'Leadership Féminin en Politique',
            'slug': 'leadership-feminin-politique',
            'description': 'Formation complète sur les techniques de leadership spécifiquement adaptées aux femmes en politique. Développez votre charisme, votre capacité à influencer et à diriger efficacement.',
            'objectifs': [
                'Développer son style de leadership authentique',
                'Maîtriser les techniques de communication persuasive',
                'Gérer les équipes et les conflits',
                'Construire sa légitimité politique'
            ],
            'categorie': 'leadership',
            'niveau': 'intermediaire',
            'duree_heures': 24,
            'date_debut': datetime.now() + timedelta(days=30),
            'date_fin': datetime.now() + timedelta(days=35),
            'lieu': 'Centre de Formation Excellence, Libreville',
            'est_en_ligne': False,
            'max_participants': 25,
            'formateur': 'Dr. Marie-Claire Okenve, Experte en Leadership',
            'formateur_bio': 'Docteure en Sciences Politiques, 15 ans d\'expérience en formation de leaders politiques au Gabon.',
            'cout': 0,
            'certificat_delivre': True,
            'quiz_requis': True,
            'note_minimale': 75,
            'status': 'published'
        },
        {
            'titre': 'Communication Politique Moderne',
            'slug': 'communication-politique-moderne',
            'description': 'Apprenez les techniques modernes de communication politique, y compris les réseaux sociaux, les relations presse et la prise de parole en public.',
            'objectifs': [
                'Maîtriser la prise de parole en public',
                'Utiliser efficacement les réseaux sociaux',
                'Gérer les relations avec les médias',
                'Développer ses messages politiques'
            ],
            'categorie': 'communication',
            'niveau': 'debutant',
            'duree_heures': 16,
            'date_debut': datetime.now() + timedelta(days=45),
            'date_fin': datetime.now() + timedelta(days=47),
            'lieu': 'En ligne via Zoom',
            'est_en_ligne': True,
            'lien_visio': 'https://zoom.us/j/formation-comm-politique',
            'max_participants': 50,
            'formateur': 'Sylvie Bayang, Consultante en Communication',
            'formateur_bio': 'Spécialiste en communication politique avec 10 ans d\'expérience auprès de personnalités politiques gabonaises.',
            'cout': 0,
            'certificat_delivre': True,
            'quiz_requis': False,
            'status': 'published'
        },
        {
            'titre': 'Gouvernance Locale et Participation Citoyenne',
            'slug': 'gouvernance-locale-participation-citoyenne',
            'description': 'Formation sur les enjeux de la gouvernance locale, le rôle des collectivités territoriales et les mécanismes de participation citoyenne au Gabon.',
            'objectifs': [
                'Comprendre le système de gouvernance locale gabonais',
                'Organiser la participation citoyenne',
                'Gérer les budgets participatifs',
                'Développer des projets communautaires'
            ],
            'categorie': 'gouvernance',
            'niveau': 'intermediaire',
            'duree_heures': 32,
            'date_debut': datetime.now() + timedelta(days=60),
            'date_fin': datetime.now() + timedelta(days=67),
            'lieu': 'Mairie de Libreville, Salle de Conférence',
            'est_en_ligne': False,
            'max_participants': 30,
            'formateur': 'Honorable Albertine Mba, Ancienne Maire',
            'formateur_bio': 'Ancienne maire avec 12 ans d\'expérience en gouvernance locale et développement communautaire.',
            'cout': 0,
            'certificat_delivre': True,
            'quiz_requis': True,
            'note_minimale': 70,
            'status': 'published'
        },
        {
            'titre': 'Campagne Électorale Efficace',
            'slug': 'campagne-electorale-efficace',
            'description': 'Techniques et stratégies pour mener une campagne électorale réussie : organisation, financement, mobilisation, et communication de campagne.',
            'objectifs': [
                'Structurer une campagne électorale',
                'Gérer le financement de campagne',
                'Mobiliser les électeurs',
                'Analyser les résultats électoraux'
            ],
            'categorie': 'campagne',
            'niveau': 'avance',
            'duree_heures': 40,
            'date_debut': datetime.now() + timedelta(days=90),
            'date_fin': datetime.now() + timedelta(days=100),
            'lieu': 'Formation hybride (présentiel + en ligne)',
            'est_en_ligne': False,
            'max_participants': 20,
            'formateur': 'Me. Patrick Moussounda, Consultant Électoral',
            'formateur_bio': 'Expert en stratégies électorales, a accompagné plus de 50 candidates aux élections locales et nationales.',
            'cout': 50000,  # 50,000 FCFA
            'certificat_delivre': True,
            'quiz_requis': True,
            'note_minimale': 80,
            'status': 'published'
        },
        {
            'titre': 'Droits des Femmes et Advocacy',
            'slug': 'droits-femmes-advocacy',
            'description': 'Formation sur les droits des femmes, les techniques de plaidoyer et l\'advocacy pour promouvoir l\'égalité des genres en politique.',
            'objectifs': [
                'Connaître le cadre juridique des droits des femmes',
                'Maîtriser les techniques de plaidoyer',
                'Organiser des campagnes de sensibilisation',
                'Collaborer avec les organisations internationales'
            ],
            'categorie': 'droits_femmes',
            'niveau': 'debutant',
            'duree_heures': 20,
            'date_debut': datetime.now() + timedelta(days=75),
            'date_fin': datetime.now() + timedelta(days=79),
            'lieu': 'ONG Femmes Dirigeantes, Libreville',
            'est_en_ligne': False,
            'max_participants': 35,
            'formateur': 'Maître Georgette Kombe, Avocate',
            'formateur_bio': 'Avocate spécialisée en droits des femmes, présidente de l\'Association des Femmes Juristes du Gabon.',
            'cout': 0,
            'certificat_delivre': True,
            'quiz_requis': False,
            'status': 'published'
        }
    ]
    
    formations_created = []
    
    for formation_data in formations_data:
        try:
            # Vérifier si la formation existe déjà
            if Formation.objects.filter(slug=formation_data['slug']).exists():
                print(f"⚠️  Formation '{formation_data['titre']}' existe déjà, ignorée.")
                continue
            
            # Ajouter l'utilisateur créateur
            formation_data['created_by'] = admin_user
            
            # Créer la formation
            formation = Formation.objects.create(**formation_data)
            formations_created.append(formation)
            
            print(f"✅ Formation créée: {formation.titre}")
            
            # Créer des modules pour chaque formation
            create_modules_for_formation(formation)
            
        except Exception as e:
            print(f"❌ Erreur lors de la création de '{formation_data['titre']}': {e}")
    
    print(f"\n🎉 {len(formations_created)} formations créées avec succès!")
    return formations_created

def create_modules_for_formation(formation):
    """Crée des modules pour une formation"""
    
    modules_templates = {
        'leadership': [
            {'titre': 'Introduction au Leadership Féminin', 'duree_minutes': 120},
            {'titre': 'Styles de Leadership et Authenticité', 'duree_minutes': 180},
            {'titre': 'Communication et Influence', 'duree_minutes': 150},
            {'titre': 'Gestion d\'Équipe et Délégation', 'duree_minutes': 160},
            {'titre': 'Résolution de Conflits', 'duree_minutes': 140},
            {'titre': 'Leadership Transformationnel', 'duree_minutes': 170}
        ],
        'communication': [
            {'titre': 'Fondamentaux de la Communication Politique', 'duree_minutes': 90},
            {'titre': 'Prise de Parole en Public', 'duree_minutes': 120},
            {'titre': 'Communication Digitale et Réseaux Sociaux', 'duree_minutes': 100},
            {'titre': 'Relations Presse et Médias', 'duree_minutes': 110},
            {'titre': 'Gestion de Crise Communication', 'duree_minutes': 80}
        ],
        'gouvernance': [
            {'titre': 'Système Institutionnel Gabonais', 'duree_minutes': 150},
            {'titre': 'Gouvernance Locale et Décentralisation', 'duree_minutes': 180},
            {'titre': 'Participation Citoyenne', 'duree_minutes': 160},
            {'titre': 'Gestion des Budgets Publics', 'duree_minutes': 140},
            {'titre': 'Transparence et Redevabilité', 'duree_minutes': 130},
            {'titre': 'Projets de Développement Local', 'duree_minutes': 170}
        ],
        'campagne': [
            {'titre': 'Stratégie de Campagne', 'duree_minutes': 200},
            {'titre': 'Organisation et Logistique', 'duree_minutes': 180},
            {'titre': 'Financement de Campagne', 'duree_minutes': 160},
            {'titre': 'Communication de Campagne', 'duree_minutes': 150},
            {'titre': 'Mobilisation des Électeurs', 'duree_minutes': 170},
            {'titre': 'Analyse Post-Électorale', 'duree_minutes': 140}
        ],
        'droits_femmes': [
            {'titre': 'Cadre Juridique des Droits des Femmes', 'duree_minutes': 120},
            {'titre': 'Techniques de Plaidoyer', 'duree_minutes': 140},
            {'titre': 'Mobilisation et Sensibilisation', 'duree_minutes': 110},
            {'titre': 'Partenariats Stratégiques', 'duree_minutes': 100},
            {'titre': 'Advocacy Internationale', 'duree_minutes': 130}
        ]
    }
    
    modules_data = modules_templates.get(formation.categorie, [])
    
    for i, module_data in enumerate(modules_data, 1):
        try:
            Module.objects.create(
                formation=formation,
                titre=module_data['titre'],
                description=f"Module {i} de la formation {formation.titre}",
                ordre=i,
                duree_minutes=module_data['duree_minutes'],
                contenu=f"Contenu détaillé du module {module_data['titre']} sera ajouté ultérieurement."
            )
            print(f"  ✅ Module créé: {module_data['titre']}")
        except Exception as e:
            print(f"  ❌ Erreur module '{module_data['titre']}': {e}")

if __name__ == '__main__':
    create_sample_formations()