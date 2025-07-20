# ============================================================================
# backend/events/management/commands/import_events.py
# ============================================================================
"""
Commande pour importer des événements depuis un fichier CSV
"""
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime
import csv
import os

from events.models import Event

User = get_user_model()


class Command(BaseCommand):
    help = 'Importe des événements depuis un fichier CSV'
    
    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Chemin vers le fichier CSV')
        parser.add_argument(
            '--organisateur-id',
            type=int,
            required=True,
            help='ID de l\'utilisateur organisateur par défaut'
        )
    
    def handle(self, *args, **options):
        csv_file = options['csv_file']
        organisateur_id = options['organisateur_id']
        
        if not os.path.exists(csv_file):
            raise CommandError(f'Le fichier {csv_file} n\'existe pas')
        
        try:
            organisateur = User.objects.get(id=organisateur_id)
        except User.DoesNotExist:
            raise CommandError(f'Utilisateur avec ID {organisateur_id} non trouvé')
        
        events_crees = 0
        events_erreurs = 0
        
        with open(csv_file, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                try:
                    # Parser les dates
                    date_debut = datetime.strptime(row['date_debut'], '%Y-%m-%d %H:%M')
                    date_fin = datetime.strptime(row['date_fin'], '%Y-%m-%d %H:%M')
                    
                    # Créer l'événement
                    event = Event.objects.create(
                        titre=row['titre'],
                        description=row['description'],
                        categorie=row.get('categorie', 'formation'),
                        date_debut=timezone.make_aware(date_debut),
                        date_fin=timezone.make_aware(date_fin),
                        lieu=row.get('lieu', ''),
                        est_en_ligne=row.get('est_en_ligne', '').lower() == 'true',
                        max_participants=int(row.get('max_participants', 50)),
                        organisateur=organisateur,
                        cree_par=organisateur,
                        est_publie=row.get('est_publie', '').lower() == 'true',
                        formateur_nom=row.get('formateur_nom', ''),
                    )
                    
                    events_crees += 1
                    self.stdout.write(f"✓ Créé: {event.titre}")
                    
                except Exception as e:
                    events_erreurs += 1
                    self.stdout.write(
                        self.style.ERROR(f"✗ Erreur ligne {reader.line_num}: {e}")
                    )
        
        self.stdout.write(
            self.style.SUCCESS(
                f"\nImport terminé: {events_crees} événements créés, "
                f"{events_erreurs} erreurs"
            )
        )