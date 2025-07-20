# ============================================================================
# backend/events/management/commands/send_event_reminders.py
# ============================================================================
"""
Commande de gestion pour envoyer les rappels d'événements
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from events.tasks import envoyer_rappels_programmes


class Command(BaseCommand):
    help = 'Envoie les rappels d\'événements programmés'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Affiche les rappels qui seraient envoyés sans les envoyer',
        )
    
    def handle(self, *args, **options):
        if options['dry_run']:
            from events.models import RappelEvent
            
            rappels = RappelEvent.objects.filter(
                statut='programme',
                date_programmee__lte=timezone.now()
            ).select_related('event', 'destinataire')
            
            self.stdout.write(f"Rappels qui seraient envoyés: {rappels.count()}")
            
            for rappel in rappels:
                self.stdout.write(
                    f"- {rappel.destinataire.get_full_name()} "
                    f"pour {rappel.event.titre} "
                    f"({rappel.heures_avant}h avant)"
                )
        else:
            result = envoyer_rappels_programmes()
            self.stdout.write(
                self.style.SUCCESS(
                    f"Rappels envoyés: {result['rappels_envoyes']}, "
                    f"Échecs: {result['rappels_echec']}"
                )
            )

