# ============================================================================
# backend/events/views.py - VERSION COMPLÈTE ET COHÉRENTE
# ============================================================================
"""
Vues pour le module événements
Gestion complète des événements, inscriptions et notifications
"""
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.db.models import Count, Avg, Q, F
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from datetime import datetime, timedelta
import uuid

from .models import Event, InscriptionEvent, RappelEvent
from .serializers import (
    EventSerializer, 
    EventDetailSerializer,
    InscriptionEventSerializer, 
    RappelEventSerializer,
    EventStatsSerializer
)
from .permissions import EventPermissions, InscriptionPermissions
from .utils import generer_fichier_ics, envoyer_confirmation_inscription


class EventViewSet(viewsets.ModelViewSet):
    """ViewSet principal pour la gestion des événements"""
    
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated, EventPermissions]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categorie', 'statut', 'est_en_ligne', 'est_featured']
    search_fields = ['titre', 'description', 'formateur_nom', 'lieu']
    ordering_fields = ['date_debut', 'date_creation', 'titre']
    ordering = ['-date_debut']
    
    def get_queryset(self):
        """Optimise les requêtes selon le contexte"""
        queryset = Event.objects.select_related('cree_par').prefetch_related(
            'inscriptions', 'rappels'
        )
        
        # Filtrer selon les permissions
        if not self.request.user.is_staff:
            queryset = queryset.filter(est_publie=True)
        
        # Filtres personnalisés
        date_debut = self.request.query_params.get('date_debut')
        date_fin = self.request.query_params.get('date_fin')
        a_venir = self.request.query_params.get('a_venir')
        
        if date_debut:
            queryset = queryset.filter(date_debut__gte=date_debut)
        if date_fin:
            queryset = queryset.filter(date_fin__lte=date_fin)
        if a_venir:
            queryset = queryset.filter(date_debut__gt=timezone.now())
        
        return queryset
    
    def get_serializer_class(self):
        """Utilise des serializers différents selon l'action"""
        if self.action == 'retrieve':
            return EventDetailSerializer
        return EventSerializer
    
    def perform_create(self, serializer):
        """Définit automatiquement le créateur"""
        serializer.save(cree_par=self.request.user)
    
    @action(detail=True, methods=['post'])
    def inscrire(self, request, pk=None):
        """Inscription d'un utilisateur à un événement"""
        event = self.get_object()
        
        # Vérifications préliminaires
        if not event.inscription_ouverte:
            return Response(
                {'error': 'Les inscriptions sont fermées'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if event.date_limite_inscription and timezone.now() > event.date_limite_inscription:
            return Response(
                {'error': 'Date limite d\'inscription dépassée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier si déjà inscrit
        if InscriptionEvent.objects.filter(event=event, participante=request.user).exists():
            return Response(
                {'error': 'Vous êtes déjà inscrite à cet événement'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier la capacité
        inscriptions_confirmees = InscriptionEvent.objects.filter(
            event=event, 
            statut__in=['confirmee', 'presente']
        ).count()
        
        if inscriptions_confirmees >= event.max_participants:
            # Ajouter à la liste d'attente si possible
            if event.liste_attente_activee:
                inscription = InscriptionEvent.objects.create(
                    event=event,
                    participante=request.user,
                    statut='en_attente'
                )
                return Response({
                    'message': 'Ajoutée à la liste d\'attente',
                    'inscription': InscriptionEventSerializer(inscription).data
                })
            else:
                return Response(
                    {'error': 'Événement complet'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Créer l'inscription
        inscription = InscriptionEvent.objects.create(
            event=event,
            participante=request.user,
            statut='confirmee' if not event.validation_requise else 'en_attente_validation'
        )
        
        # Envoyer confirmation si configuré
        if event.notifications_activees:
            envoyer_confirmation_inscription(inscription)
        
        return Response({
            'message': 'Inscription réussie',
            'inscription': InscriptionEventSerializer(inscription).data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['delete'])
    def desinscrire(self, request, pk=None):
        """Désinscription d'un événement"""
        event = self.get_object()
        
        try:
            inscription = InscriptionEvent.objects.get(
                event=event, 
                participante=request.user,
                statut__in=['confirmee', 'en_attente', 'en_attente_validation']
            )
            inscription.delete()
            
            # Traiter la liste d'attente si applicable
            if event.liste_attente_activee:
                prochaine_inscription = InscriptionEvent.objects.filter(
                    event=event,
                    statut='en_attente'
                ).order_by('date_inscription').first()
                
                if prochaine_inscription:
                    prochaine_inscription.statut = 'confirmee'
                    prochaine_inscription.save()
                    
                    # Notifier l'utilisateur
                    if event.notifications_activees:
                        # Logique de notification à implémenter
                        pass
            
            return Response({'message': 'Désinscription réussie'})
            
        except InscriptionEvent.DoesNotExist:
            return Response(
                {'error': 'Inscription non trouvée'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'])
    def calendrier_ics(self, request, pk=None):
        """Génère un fichier ICS pour l'événement"""
        event = self.get_object()
        ics_content = generer_fichier_ics(event)
        
        response = Response(ics_content, content_type='text/calendar')
        response['Content-Disposition'] = f'attachment; filename="{event.slug}.ics"'
        return response
    
    @action(detail=True, methods=['get'])
    def participants(self, request, pk=None):
        """Liste des participants (réservé aux organisateurs)"""
        event = self.get_object()
        
        # Vérifier les permissions
        if not (request.user.is_staff or event.cree_par == request.user):
            raise PermissionDenied("Accès non autorisé aux analytiques")
        
        # Statistiques d'inscription
        inscriptions = InscriptionEvent.objects.filter(event=event)
        
        analytics = {
            'event_info': EventSerializer(event).data,
            'inscriptions': {
                'total': inscriptions.count(),
                'confirmees': inscriptions.filter(statut='confirmee').count(),
                'presentes': inscriptions.filter(statut='presente').count(),
                'absentes': inscriptions.filter(statut='absente').count(),
                'en_attente': inscriptions.filter(statut='en_attente').count(),
                'annulees': inscriptions.filter(statut='annulee').count(),
            },
            'taux_presence': 0,
            'evaluation_moyenne': 0,
            'repartition_temporelle': {},
            'satisfaction': {}
        }
        
        # Calcul du taux de présence
        total_attendu = inscriptions.filter(statut__in=['confirmee', 'presente', 'absente']).count()
        presents = inscriptions.filter(statut='presente').count()
        
        if total_attendu > 0:
            analytics['taux_presence'] = round((presents / total_attendu) * 100, 2)
        
        # Évaluation moyenne
        evaluations = inscriptions.filter(evaluation_event__isnull=False)
        if evaluations.exists():
            analytics['evaluation_moyenne'] = round(
                evaluations.aggregate(moyenne=Avg('evaluation_event'))['moyenne'], 2
            )
        
        # Répartition des inscriptions dans le temps (7 derniers jours)
        for i in range(7):
            jour = timezone.now().date() - timedelta(days=i)
            jour_suivant = jour + timedelta(days=1)
            
            count = inscriptions.filter(
                date_inscription__date=jour
            ).count()
            
            analytics['repartition_temporelle'][jour.strftime('%Y-%m-%d')] = count
        
        # Analyse de satisfaction
        if evaluations.exists():
            satisfaction_data = evaluations.values('evaluation_event').annotate(
                count=Count('id')
            ).order_by('evaluation_event')
            
            analytics['satisfaction'] = {
                str(item['evaluation_event']): item['count'] 
                for item in satisfaction_data
            }
        
        return Response(analytics)


class InscriptionEventViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des inscriptions"""
    
    serializer_class = InscriptionEventSerializer
    permission_classes = [IsAuthenticated, InscriptionPermissions]
    
    def get_queryset(self):
        """Filtre les inscriptions selon l'utilisateur"""
        if self.request.user.is_staff:
            return InscriptionEvent.objects.select_related('event', 'participante').all()
        
        return InscriptionEvent.objects.select_related('event', 'participante').filter(
            participante=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def evaluer(self, request, pk=None):
        """Évaluer un événement après participation"""
        inscription = self.get_object()
        
        # Vérifier que l'utilisateur peut évaluer
        if inscription.participante != request.user:
            raise PermissionDenied()
        
        if inscription.statut != 'presente':
            return Response(
                {'error': 'Vous devez avoir été présente pour évaluer'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if inscription.event.est_en_cours or not inscription.event.est_passe:
            return Response(
                {'error': 'Vous ne pouvez évaluer qu\'après la fin de l\'événement'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        evaluation = request.data.get('evaluation')
        commentaire = request.data.get('commentaire', '')
        
        if not evaluation or not (1 <= int(evaluation) <= 5):
            return Response(
                {'error': 'Évaluation invalide (1-5)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        inscription.evaluation_event = int(evaluation)
        inscription.commentaire_evaluation = commentaire
        inscription.save()
        
        return Response({
            'message': 'Évaluation enregistrée',
            'inscription': InscriptionEventSerializer(inscription).data
        })
    
    @action(detail=True, methods=['post'])
    def confirmer_presence(self, request, pk=None):
        """Confirmer la présence à un événement (pour les organisateurs)"""
        inscription = self.get_object()
        
        # Vérifier les permissions
        if not (request.user.is_staff or inscription.event.cree_par == request.user):
            raise PermissionDenied()
        
        inscription.statut = 'presente'
        inscription.save()
        
        return Response({
            'message': 'Présence confirmée',
            'inscription': InscriptionEventSerializer(inscription).data
        })
    
    @action(detail=True, methods=['post'])
    def marquer_absente(self, request, pk=None):
        """Marquer comme absente (pour les organisateurs)"""
        inscription = self.get_object()
        
        # Vérifier les permissions
        if not (request.user.is_staff or inscription.event.cree_par == request.user):
            raise PermissionDenied()
        
        inscription.statut = 'absente'
        inscription.save()
        
        return Response({
            'message': 'Marquée comme absente',
            'inscription': InscriptionEventSerializer(inscription).data
        })


class RappelEventViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des rappels"""
    
    serializer_class = RappelEventSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtre les rappels selon l'utilisateur"""
        if self.request.user.is_staff:
            return RappelEvent.objects.select_related('event', 'destinataire').all()
        
        return RappelEvent.objects.select_related('event', 'destinataire').filter(
            destinataire=self.request.user
        )
    
    def perform_create(self, serializer):
        """Associe automatiquement l'utilisateur connecté"""
        serializer.save(destinataire=self.request.user)
    
    @action(detail=True, methods=['post'])
    def marquer_envoye(self, request, pk=None):
        """Marque un rappel comme envoyé (pour le système)"""
        rappel = self.get_object()
        
        # Seuls les admins peuvent marquer manuellement
        if not request.user.is_staff:
            raise PermissionDenied()
        
        rappel.statut = 'envoye'
        rappel.date_envoi = timezone.now()
        rappel.save()
        
        return Response({
            'message': 'Rappel marqué comme envoyé',
            'rappel': RappelEventSerializer(rappel).data
        })
    
    @action(detail=False, methods=['get'])
    def a_envoyer(self, request):
        """Liste des rappels à envoyer (pour les tâches automatiques)"""
        if not request.user.is_staff:
            raise PermissionDenied()
        
        rappels = RappelEvent.objects.filter(
            statut='programme',
            date_programmee__lte=timezone.now()
        ).select_related('event', 'destinataire')
        
        serializer = RappelEventSerializer(rappels, many=True)
        return Response(serializer.data)


# Vues additionnelles pour fonctionnalités avancées

class EventCalendrierView(APIView):
    """Vue pour l'affichage calendrier des événements"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Retourne les événements formatés pour un calendrier"""
        # Paramètres de date
        date_debut = request.query_params.get('start')
        date_fin = request.query_params.get('end')
        
        queryset = Event.objects.filter(est_publie=True)
        
        if date_debut:
            queryset = queryset.filter(date_debut__gte=date_debut)
        if date_fin:
            queryset = queryset.filter(date_fin__lte=date_fin)
        
        # Format spécial pour calendrier
        events_calendrier = []
        for event in queryset:
            events_calendrier.append({
                'id': str(event.id),
                'title': event.titre,
                'start': event.date_debut.isoformat(),
                'end': event.date_fin.isoformat(),
                'backgroundColor': self._get_color_by_category(event.categorie),
                'borderColor': self._get_color_by_category(event.categorie),
                'url': f'/events/{event.slug}/',
                'extendedProps': {
                    'categorie': event.categorie,
                    'lieu': event.lieu if not event.est_en_ligne else 'En ligne',
                    'participants': event.inscriptions.filter(statut='confirmee').count(),
                    'max_participants': event.max_participants,
                    'est_featured': event.est_featured
                }
            })
        
        return Response(events_calendrier)
    
    def _get_color_by_category(self, categorie):
        """Retourne une couleur selon la catégorie"""
        colors = {
            'formation': '#3498db',
            'conference': '#e74c3c',
            'atelier': '#2ecc71',
            'networking': '#f39c12',
            'webinaire': '#9b59b6',
            'autre': '#95a5a6'
        }
        return colors.get(categorie, '#95a5a6')


class EventExportView(APIView):
    """Vue pour l'export des données d'événements"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, event_id=None):
        """Exporte les données d'un ou plusieurs événements"""
        from django.http import HttpResponse
        import csv
        import json
        
        # Vérifier les permissions
        if event_id:
            event = get_object_or_404(Event, pk=event_id)
            if not (request.user.is_staff or event.cree_par == request.user):
                raise PermissionDenied("Accès non autorisé")
            events = [event]
        else:
            if not request.user.is_staff:
                events = Event.objects.filter(cree_par=request.user)
            else:
                events = Event.objects.all()
        
        # Format d'export
        format_export = request.query_params.get('format', 'csv')
        
        if format_export == 'csv':
            return self._export_csv(events)
        elif format_export == 'json':
            return self._export_json(events)
        else:
            return Response(
                {'error': 'Format non supporté'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _export_csv(self, events):
        """Export en format CSV"""
        from django.http import HttpResponse
        import csv
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="events_export.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'ID', 'Titre', 'Catégorie', 'Date début', 'Date fin',
            'Lieu', 'En ligne', 'Max participants', 'Inscrits',
            'Statut', 'Publié', 'Créé par', 'Date création'
        ])
        
        for event in events:
            writer.writerow([
                str(event.id),
                event.titre,
                event.get_categorie_display(),
                event.date_debut.strftime('%Y-%m-%d %H:%M'),
                event.date_fin.strftime('%Y-%m-%d %H:%M'),
                event.lieu if not event.est_en_ligne else 'En ligne',
                'Oui' if event.est_en_ligne else 'Non',
                event.max_participants,
                event.inscriptions.filter(statut='confirmee').count(),
                event.get_statut_display(),
                'Oui' if event.est_publie else 'Non',
                event.cree_par.get_full_name(),
                event.date_creation.strftime('%Y-%m-%d %H:%M')
            ])
        
        return response
    
    def _export_json(self, events):
        """Export en format JSON"""
        from django.http import JsonResponse
        
        data = []
        for event in events:
            data.append({
                'id': str(event.id),
                'titre': event.titre,
                'categorie': event.categorie,
                'date_debut': event.date_debut.isoformat(),
                'date_fin': event.date_fin.isoformat(),
                'lieu': event.lieu,
                'est_en_ligne': event.est_en_ligne,
                'max_participants': event.max_participants,
                'nb_inscrits': event.inscriptions.filter(statut='confirmee').count(),
                'statut': event.statut,
                'est_publie': event.est_publie,
                'cree_par': event.cree_par.get_full_name(),
                'inscriptions': [
                    {
                        'participante': inscription.participante.get_full_name(),
                        'email': inscription.participante.email,
                        'statut': inscription.statut,
                        'date_inscription': inscription.date_inscription.isoformat(),
                        'evaluation': inscription.evaluation_event
                    }
                    for inscription in event.inscriptions.select_related('participante')
                ]
            })
        
        response = JsonResponse({'events': data}, safe=False)
        response['Content-Disposition'] = 'attachment; filename="events_export.json"'
        return response


class EventDuplicationView(APIView):
    """Vue pour dupliquer un événement"""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request, event_id):
        """Duplique un événement existant"""
        source_event = get_object_or_404(Event, pk=event_id)
        
        # Vérifier les permissions
        if not (request.user.is_staff or source_event.cree_par == request.user):
            raise PermissionDenied("Accès non autorisé")
        
        # Données de duplication
        nouvelles_dates = request.data.get('nouvelles_dates', {})
        nouveau_titre = request.data.get('titre', f"{source_event.titre} (Copie)")
        
        # Créer la copie
        nouvel_event = Event.objects.create(
            titre=nouveau_titre,
            description=source_event.description,
            description_courte=source_event.description_courte,
            categorie=source_event.categorie,
            tags=source_event.tags.copy(),
            date_debut=nouvelles_dates.get('date_debut', source_event.date_debut),
            date_fin=nouvelles_dates.get('date_fin', source_event.date_fin),
            fuseau_horaire=source_event.fuseau_horaire,
            est_en_ligne=source_event.est_en_ligne,
            lieu=source_event.lieu,
            adresse_complete=source_event.adresse_complete,
            lien_visioconference=source_event.lien_visioconference,
            max_participants=source_event.max_participants,
            inscription_requise=source_event.inscription_requise,
            validation_requise=source_event.validation_requise,
            liste_attente_activee=source_event.liste_attente_activee,
            formateur_nom=source_event.formateur_nom,
            formateur_bio=source_event.formateur_bio,
            programme_detaille=source_event.programme_detaille,
            objectifs=source_event.objectifs,
            prerequis=source_event.prerequis,
            materiel_requis=source_event.materiel_requis,
            statut='brouillon',  # Toujours créer en brouillon
            est_publie=False,    # Toujours créer non publié
            cree_par=request.user,
            notifications_activees=source_event.notifications_activees,
            rappels_automatiques=source_event.rappels_automatiques.copy()
        )
        
        serializer = EventDetailSerializer(nouvel_event)
        return Response({
            'message': 'Événement dupliqué avec succès',
            'event': serializer.data
        }, status=status.HTTP_201_CREATED)


class EventBulkActionsView(APIView):
    """Vue pour les actions en lot sur les événements"""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Effectue des actions en lot"""
        # Seuls les admins peuvent faire des actions en lot
        if not request.user.is_staff:
            raise PermissionDenied("Accès non autorisé")
        
        action = request.data.get('action')
        event_ids = request.data.get('event_ids', [])
        
        if not action or not event_ids:
            return Response(
                {'error': 'Action et IDs requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        events = Event.objects.filter(id__in=event_ids)
        count = 0
        
        if action == 'publier':
            count = events.update(est_publie=True)
        elif action == 'depublier':
            count = events.update(est_publie=False)
        elif action == 'feature':
            count = events.update(est_featured=True)
        elif action == 'unfeature':
            count = events.update(est_featured=False)
        elif action == 'annuler':
            count = events.update(statut='annule')
        elif action == 'supprimer':
            count = events.count()
            events.delete()
        else:
            return Response(
                {'error': 'Action non reconnue'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'message': f'Action "{action}" effectuée sur {count} événement(s)',
            'count': count
        })


class EventStatistiquesAvanceesView(APIView):
    """Vue pour les statistiques avancées"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Retourne des statistiques avancées"""
        if not request.user.is_staff:
            raise PermissionDenied("Accès non autorisé")
        
        # Période d'analyse
        periode = request.query_params.get('periode', '30')  # jours
        date_limite = timezone.now() - timedelta(days=int(periode))
        
        # Statistiques globales
        stats = {
            'periode_jours': int(periode),
            'events_par_statut': {},
            'events_par_categorie': {},
            'inscriptions_par_mois': {},
            'taux_participation_moyen': 0,
            'evaluation_moyenne_globale': 0,
            'top_organisateurs': [],
            'events_populaires': [],
            'tendances': {}
        }
        
        # Events par statut
        for statut_code, statut_label in Event.STATUTS:
            count = Event.objects.filter(
                date_creation__gte=date_limite,
                statut=statut_code
            ).count()
            stats['events_par_statut'][statut_label] = count
        
        # Events par catégorie
        for cat_code, cat_label in Event.CATEGORIES:
            count = Event.objects.filter(
                date_creation__gte=date_limite,
                categorie=cat_code
            ).count()
            stats['events_par_categorie'][cat_label] = count
        
        # Inscriptions par mois (12 derniers mois)
        for i in range(12):
            mois = timezone.now().replace(day=1) - timedelta(days=30*i)
            mois_suivant = (mois + timedelta(days=32)).replace(day=1)
            
            count = InscriptionEvent.objects.filter(
                date_inscription__gte=mois,
                date_inscription__lt=mois_suivant
            ).count()
            
            stats['inscriptions_par_mois'][mois.strftime('%Y-%m')] = count
        
        # Taux de participation moyen
        events_termines = Event.objects.filter(
            statut='termine',
            date_fin__gte=date_limite
        )
        
        if events_termines.exists():
            total_presents = 0
            total_inscrits = 0
            
            for event in events_termines:
                presents = event.inscriptions.filter(statut='presente').count()
                inscrits = event.inscriptions.filter(
                    statut__in=['confirmee', 'presente', 'absente']
                ).count()
                
                total_presents += presents
                total_inscrits += inscrits
            
            if total_inscrits > 0:
                stats['taux_participation_moyen'] = round(
                    (total_presents / total_inscrits) * 100, 2
                )
        
        # Évaluation moyenne globale
        evaluations = InscriptionEvent.objects.filter(
            event__date_fin__gte=date_limite,
            evaluation_event__isnull=False
        )
        
        if evaluations.exists():
            stats['evaluation_moyenne_globale'] = round(
                evaluations.aggregate(
                    moyenne=Avg('evaluation_event')
                )['moyenne'], 2
            )
        
        # Top organisateurs
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        top_organisateurs = User.objects.annotate(
            nb_events=Count('evenements_crees', filter=Q(
                evenements_crees__date_creation__gte=date_limite
            ))
        ).filter(nb_events__gt=0).order_by('-nb_events')[:5]
        
        stats['top_organisateurs'] = [
            {
                'nom': org.get_full_name(),
                'nb_events': org.nb_events
            }
            for org in top_organisateurs
        ]
        
        # Events populaires (plus d'inscriptions)
        events_populaires = Event.objects.annotate(
            nb_inscriptions=Count('inscriptions')
        ).filter(
            date_creation__gte=date_limite
        ).order_by('-nb_inscriptions')[:5]
        
        stats['events_populaires'] = [
            {
                'titre': event.titre,
                'nb_inscriptions': event.nb_inscriptions,
                'categorie': event.get_categorie_display()
            }
            for event in events_populaires
        ]
        
        return Response(stats)Accès non autorisé")
        
        inscriptions = InscriptionEvent.objects.filter(event=event).select_related('participante')
        serializer = InscriptionEventSerializer(inscriptions, many=True)
        
        return Response({
            'total': inscriptions.count(),
            'confirmees': inscriptions.filter(statut='confirmee').count(),
            'presentes': inscriptions.filter(statut='presente').count(),
            'en_attente': inscriptions.filter(statut='en_attente').count(),
            'participants': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def mes_events(self, request):
        """Événements auxquels l'utilisateur est inscrit"""
        inscriptions = InscriptionEvent.objects.filter(
            participante=request.user
        ).select_related('event')
        
        events_data = []
        for inscription in inscriptions:
            event_data = EventSerializer(inscription.event).data
            event_data['inscription'] = {
                'statut': inscription.statut,
                'date_inscription': inscription.date_inscription,
                'evaluation': inscription.evaluation_event
            }
            events_data.append(event_data)
        
        return Response(events_data)
    
    @action(detail=False, methods=['get'])
    def recommandations(self, request):
        """Recommandations d'événements personnalisées"""
        # Logique de recommandation basée sur l'historique
        user_categories = InscriptionEvent.objects.filter(
            participante=request.user
        ).values_list('event__categorie', flat=True).distinct()
        
        recommandations = Event.objects.filter(
            est_publie=True,
            date_debut__gt=timezone.now(),
            categorie__in=user_categories
        ).exclude(
            inscriptions__participante=request.user
        )[:5]
        
        serializer = EventSerializer(recommandations, many=True)
        return Response(serializer.data)


class EventDashboardView(APIView):
    """Vue tableau de bord pour les statistiques d'événements"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Retourne les statistiques du dashboard"""
        now = timezone.now()
        
        # Statistiques générales
        stats = {
            'total_events': Event.objects.filter(est_publie=True).count(),
            'events_a_venir': Event.objects.filter(
                est_publie=True, 
                date_debut__gt=now
            ).count(),
            'mes_inscriptions': InscriptionEvent.objects.filter(
                participante=request.user
            ).count(),
            'events_passes': Event.objects.filter(
                est_publie=True,
                date_fin__lt=now
            ).count()
        }
        
        # Événements à venir pour l'utilisateur
        prochains_events = Event.objects.filter(
            inscriptions__participante=request.user,
            date_debut__gt=now
        ).order_by('date_debut')[:3]
        
        stats['prochains_events'] = EventSerializer(prochains_events, many=True).data
        
        # Statistiques par catégorie
        categories_stats = Event.objects.filter(
            est_publie=True
        ).values('categorie').annotate(
            count=Count('id')
        ).order_by('-count')
        
        stats['categories'] = list(categories_stats)
        
        # Évolution des inscriptions (6 derniers mois)
        inscriptions_par_mois = {}
        for i in range(6):
            mois = now.replace(day=1) - timedelta(days=30*i)
            mois_suivant = (mois + timedelta(days=32)).replace(day=1)
            
            count = InscriptionEvent.objects.filter(
                date_inscription__gte=mois,
                date_inscription__lt=mois_suivant
            ).count()
            
            inscriptions_par_mois[mois.strftime('%Y-%m')] = count
        
        stats['inscriptions_par_mois'] = inscriptions_par_mois
        
        return Response(stats)


class EventSearchView(APIView):
    """Vue de recherche avancée d'événements"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Recherche avancée avec filtres multiples"""
        queryset = Event.objects.filter(est_publie=True)
        
        # Paramètres de recherche
        terme = request.query_params.get('q', '')
        categorie = request.query_params.get('categorie')
        date_debut = request.query_params.get('date_debut')
        date_fin = request.query_params.get('date_fin')
        en_ligne = request.query_params.get('en_ligne')
        places_dispo = request.query_params.get('places_disponibles')
        
        # Application des filtres
        if terme:
            queryset = queryset.filter(
                Q(titre__icontains=terme) |
                Q(description__icontains=terme) |
                Q(formateur_nom__icontains=terme)
            )
        
        if categorie:
            queryset = queryset.filter(categorie=categorie)
        
        if date_debut:
            queryset = queryset.filter(date_debut__gte=date_debut)
        
        if date_fin:
            queryset = queryset.filter(date_fin__lte=date_fin)
        
        if en_ligne is not None:
            queryset = queryset.filter(est_en_ligne=en_ligne.lower() == 'true')
        
        if places_dispo:
            queryset = queryset.annotate(
                places_prises=Count('inscriptions', filter=Q(inscriptions__statut='confirmee'))
            ).filter(places_prises__lt=F('max_participants'))
        
        # Pagination et tri
        page_size = min(int(request.query_params.get('page_size', 20)), 100)
        page = int(request.query_params.get('page', 1))
        
        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        
        events = queryset[start:end]
        serializer = EventSerializer(events, many=True)
        
        return Response({
            'results': serializer.data,
            'pagination': {
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size
            }
        })


class EventRecommendationView(APIView):
    """Vue pour les recommandations personnalisées"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Génère des recommandations basées sur l'activité utilisateur"""
        user = request.user
        
        # Analyser les préférences utilisateur
        categories_preferees = list(InscriptionEvent.objects.filter(
            participante=user
        ).values_list('event__categorie', flat=True).distinct())
        
        # Événements similaires
        events_similaires = Event.objects.filter(
            est_publie=True,
            date_debut__gt=timezone.now(),
            categorie__in=categories_preferees
        ).exclude(
            inscriptions__participante=user
        ).order_by('-est_featured', 'date_debut')[:5]
        
        # Événements populaires
        events_populaires = Event.objects.filter(
            est_publie=True,
            date_debut__gt=timezone.now()
        ).annotate(
            nb_inscriptions=Count('inscriptions')
        ).exclude(
            inscriptions__participante=user
        ).order_by('-nb_inscriptions', '-est_featured')[:3]
        
        # Nouveaux événements
        nouveaux_events = Event.objects.filter(
            est_publie=True,
            date_debut__gt=timezone.now(),
            date_creation__gte=timezone.now() - timedelta(days=7)
        ).exclude(
            inscriptions__participante=user
        ).order_by('-date_creation')[:3]
        
        return Response({
            'similaires': EventSerializer(events_similaires, many=True).data,
            'populaires': EventSerializer(events_populaires, many=True).data,
            'nouveaux': EventSerializer(nouveaux_events, many=True).data
        })


class EventAnalyticsView(APIView):
    """Vue d'analytiques pour un événement spécifique"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, event_id):
        """Retourne les analytiques d'un événement"""
        event = get_object_or_404(Event, pk=event_id)
        
        # Vérifier les permissions
        if not (request.user.is_staff or event.cree_par == request.user):
            raise PermissionDenied("