"""
Module Événement - Vues API REST
Gestion des événements, inscriptions et rappels
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.db.models import Q, Count, Avg, F, Case, When, IntegerField
from django.utils import timezone
from django.http import HttpResponse
from django.core.exceptions import PermissionDenied
from datetime import datetime, timedelta
import json
import csv

from .models import Event, InscriptionEvent, RappelEvent
from .serializers import (
    EventListSerializer, EventDetailSerializer, EventCreateUpdateSerializer,
    InscriptionEventSerializer, InscriptionEventCreateSerializer,
    RappelEventSerializer, EventStatisticsSerializer, EventExportSerializer,
    ParticipantExportSerializer, EventFilterSerializer, EventCalendarSerializer
)
from .permissions import EventPermissions, InscriptionPermissions
from .filters import EventFilter
from .utils import (
    generer_fichier_ics, envoyer_confirmation_inscription,
    generer_rapport_participation, planifier_rappels_automatiques
)


class EventViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des événements"""
    
    queryset = Event.objects.select_related('organisateur', 'cree_par').prefetch_related('inscriptions')
    permission_classes = [IsAuthenticatedOrReadOnly, EventPermissions]
    filterset_class = EventFilter
    search_fields = ['titre', 'description', 'formateur_nom', 'lieu']
    ordering_fields = ['date_debut', 'date_creation', 'titre', 'max_participants']
    ordering = ['-date_debut']
    
    def get_serializer_class(self):
        """Retourne le bon serializer selon l'action"""
        if self.action == 'list':
            return EventListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return EventCreateUpdateSerializer
        elif self.action == 'calendar':
            return EventCalendarSerializer
        return EventDetailSerializer
    
    def get_queryset(self):
        """Filtre les événements selon les permissions"""
        queryset = super().get_queryset()
        
        # Seuls les événements publiés sont visibles par défaut
        if not self.request.user.is_authenticated or not self.request.user.is_staff:
            queryset = queryset.filter(est_publie=True)
        
        # Filtres spéciaux via query params
        params = self.request.query_params
        
        # Filtre par statut
        if params.get('statut'):
            queryset = queryset.filter(statut=params.get('statut'))
        
        # Filtre par période
        periode = params.get('periode')
        if periode == 'a_venir':
            queryset = queryset.filter(date_debut__gt=timezone.now())
        elif periode == 'en_cours':
            now = timezone.now()
            queryset = queryset.filter(date_debut__lte=now, date_fin__gte=now)
        elif periode == 'passes':
            queryset = queryset.filter(date_fin__lt=timezone.now())
        elif periode == 'ce_mois':
            now = timezone.now()
            debut_mois = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            fin_mois = (debut_mois + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            queryset = queryset.filter(date_debut__range=[debut_mois, fin_mois])
        
        # Filtre par disponibilité
        if params.get('places_disponibles') == 'true':
            queryset = queryset.annotate(
                nb_inscrits=Count('inscriptions', filter=Q(inscriptions__statut='confirmee'))
            ).filter(nb_inscrits__lt=F('max_participants'))
        
        # Filtre mes événements
        if params.get('mes_events') == 'true' and self.request.user.is_authenticated:
            queryset = queryset.filter(
                Q(organisateur=self.request.user) |
                Q(inscriptions__participante=self.request.user)
            ).distinct()
        
        return queryset
    
    def perform_create(self, serializer):
        """Personnalise la création d'événements"""
        event = serializer.save(
            cree_par=self.request.user,
            organisateur=self.request.user
        )
        
        # Planifier les rappels automatiques si configurés
        if event.rappels_automatiques and event.notifications_activees:
            planifier_rappels_automatiques(event)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def inscrire(self, request, pk=None):
        """Inscription à un événement"""
        event = self.get_object()
        
        # Vérifier si l'utilisateur n'est pas déjà inscrit
        if InscriptionEvent.objects.filter(event=event, participante=request.user).exists():
            return Response(
                {'error': 'Vous êtes déjà inscrit(e) à cet événement'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Créer l'inscription
        serializer = InscriptionEventCreateSerializer(
            data=request.data,
            context={'request': request, 'event': event}
        )
        
        if serializer.is_valid():
            inscription = serializer.save()
            
            # Envoyer email de confirmation
            try:
                envoyer_confirmation_inscription(inscription)
            except Exception as e:
                # Log l'erreur mais ne pas faire échouer l'inscription
                pass
            
            return Response({
                'message': 'Inscription réussie',
                'inscription': InscriptionEventSerializer(inscription).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def desinscrire(self, request, pk=None):
        """Désinscription d'un événement"""
        event = self.get_object()
        
        try:
            inscription = InscriptionEvent.objects.get(
                event=event,
                participante=request.user
            )
            
            # Vérifier si la désinscription est possible
            if event.est_en_cours or event.est_passe:
                return Response(
                    {'error': 'Impossible de se désinscrire d\'un événement en cours ou passé'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Supprimer l'inscription
            inscription.delete()
            
            return Response({'message': 'Désinscription réussie'})
        
        except InscriptionEvent.DoesNotExist:
            return Response(
                {'error': 'Vous n\'êtes pas inscrit(e) à cet événement'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'])
    def participants(self, request, pk=None):
        """Liste des participants à un événement"""
        event = self.get_object()
        
        # Vérifier les permissions
        if not (request.user.is_staff or event.organisateur == request.user):
            raise PermissionDenied("Accès refusé aux informations des participants")
        
        inscriptions = event.inscriptions.select_related('participante').order_by('-date_inscription')
        
        # Filtrer par statut si demandé
        statut = request.query_params.get('statut')
        if statut:
            inscriptions = inscriptions.filter(statut=statut)
        
        serializer = InscriptionEventSerializer(inscriptions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def valider_inscription(self, request, pk=None):
        """Valider ou refuser une inscription (organisateurs/staff seulement)"""
        event = self.get_object()
        
        # Vérifier les permissions
        if not (request.user.is_staff or event.organisateur == request.user):
            raise PermissionDenied()
        
        inscription_id = request.data.get('inscription_id')
        action_type = request.data.get('action')  # 'confirmer' ou 'refuser'
        commentaire = request.data.get('commentaire', '')
        
        try:
            inscription = InscriptionEvent.objects.get(
                id=inscription_id,
                event=event
            )
            
            if action_type == 'confirmer':
                inscription.confirmer(validateur=request.user)
                message = 'Inscription confirmée'
            elif action_type == 'refuser':
                inscription.refuser(
                    validateur=request.user,
                    commentaire=commentaire
                )
                message = 'Inscription refusée'
            else:
                return Response(
                    {'error': 'Action invalide'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response({
                'message': message,
                'inscription': InscriptionEventSerializer(inscription).data
            })
        
        except InscriptionEvent.DoesNotExist:
            return Response(
                {'error': 'Inscription non trouvée'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def marquer_presence(self, request, pk=None):
        """Marquer la présence des participants"""
        event = self.get_object()
        
        # Vérifier les permissions
        if not (request.user.is_staff or event.organisateur == request.user):
            raise PermissionDenied()
        
        participant_ids = request.data.get('participant_ids', [])
        action_type = request.data.get('action', 'presente')  # 'presente' ou 'absente'
        
        if not participant_ids:
            return Response(
                {'error': 'Aucun participant spécifié'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        inscriptions = InscriptionEvent.objects.filter(
            event=event,
            id__in=participant_ids
        )
        
        updated_count = 0
        for inscription in inscriptions:
            if action_type == 'presente':
                inscription.marquer_presente()
            else:
                inscription.marquer_absente()
            updated_count += 1
        
        return Response({
            'message': f'{updated_count} participant(s) marqué(s) comme {action_type}',
            'updated_count': updated_count
        })
    
    @action(detail=True, methods=['get'])
    def export_participants(self, request, pk=None):
        """Exporter la liste des participants en CSV"""
        event = self.get_object()
        
        # Vérifier les permissions
        if not (request.user.is_staff or event.organisateur == request.user):
            raise PermissionDenied()
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="participants_{event.slug}.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Nom', 'Email', 'Région', 'Date inscription', 'Statut',
            'Présente', 'Évaluation', 'Commentaires'
        ])
        
        inscriptions = event.inscriptions.select_related('participante').order_by('participante__last_name')
        for inscription in inscriptions:
            writer.writerow([
                inscription.participante.get_full_name(),
                inscription.participante.email,
                inscription.participante.region,
                inscription.date_inscription.strftime('%d/%m/%Y %H:%M'),
                inscription.get_statut_display(),
                'Oui' if inscription.statut == 'presente' else 'Non',
                inscription.evaluation_event or '',
                inscription.commentaire_evaluation or ''
            ])
        
        return response
    
    @action(detail=True, methods=['get'])
    def export_calendar(self, request, pk=None):
        """Exporter l'événement au format ICS (calendrier)"""
        event = self.get_object()
        
        ics_content = generer_fichier_ics(event)
        
        response = HttpResponse(ics_content, content_type='text/calendar')
        response['Content-Disposition'] = f'attachment; filename="{event.slug}.ics"'
        
        return response
    
    @action(detail=False, methods=['get'])
    def calendar(self, request):
        """API pour le calendrier (format optimisé)"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Filtre par plage de dates pour le calendrier
        date_debut = request.query_params.get('start')
        date_fin = request.query_params.get('end')
        
        if date_debut and date_fin:
            try:
                debut = datetime.fromisoformat(date_debut.replace('Z', '+00:00'))
                fin = datetime.fromisoformat(date_fin.replace('Z', '+00:00'))
                queryset = queryset.filter(
                    date_debut__lte=fin,
                    date_fin__gte=debut
                )
            except ValueError:
                pass
        
        serializer = EventCalendarSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def statistiques(self, request):
        """Statistiques globales des événements"""
        if not request.user.is_staff:
            raise PermissionDenied()
        
        now = timezone.now()
        
        # Statistiques de base
        stats = {
            'total_events': Event.objects.count(),
            'events_a_venir': Event.objects.filter(date_debut__gt=now).count(),
            'events_en_cours': Event.objects.filter(
                date_debut__lte=now, date_fin__gte=now
            ).count(),
            'events_passes': Event.objects.filter(date_fin__lt=now).count(),
            'total_participants': InscriptionEvent.objects.filter(
                statut='confirmee'
            ).count(),
        }
        
        # Taux de participation moyen
        events_passes = Event.objects.filter(date_fin__lt=now)
        taux_participation = []
        
        for event in events_passes:
            confirmees = event.inscriptions.filter(statut='confirmee').count()
            presentes = event.inscriptions.filter(statut='presente').count()
            if confirmees > 0:
                taux_participation.append((presentes / confirmees) * 100)
        
        stats['taux_participation_moyen'] = (
            sum(taux_participation) / len(taux_participation)
            if taux_participation else 0
        )
        
        # Statistiques par catégorie
        stats['par_categorie'] = {}
        for categorie, label in Event.CATEGORIES:
            stats['par_categorie'][categorie] = Event.objects.filter(
                categorie=categorie
            ).count()
        
        # Événements populaires (plus de participants)
        events_populaires = Event.objects.annotate(
            nb_participants=Count('inscriptions', filter=Q(inscriptions__statut='confirmee'))
        ).order_by('-nb_participants')[:5]
        
        stats['events_populaires'] = EventListSerializer(
            events_populaires, many=True, context={'request': request}
        ).data
        
        # Inscriptions par mois (12 derniers mois)
        inscriptions_par_mois = {}
        for i in range(12):
            mois = (now - timedelta(days=30 * i)).replace(day=1)
            mois_suivant = (mois + timedelta(days=32)).replace(day=1)
            
            count = InscriptionEvent.objects.filter(
                date_inscription__gte=mois,
                date_inscription__lt=mois_suivant
            ).count()
            
            inscriptions_par_mois[mois.strftime('%Y-%m')] = count
        
        stats['inscriptions_par_mois'] = inscriptions_par_mois
        
        return Response(stats)


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
    
    @action(detail=False, methods=['post'])
    def programmer_rappel(self, request):
        """Programmer un rappel personnalisé"""
        event_id = request.data.get('event_id')
        heures_avant = request.data.get('heures_avant')
        type_rappel = request.data.get('type_rappel', 'email')
        
        try:
            event = Event.objects.get(id=event_id)
            
            # Vérifier que l'utilisateur est inscrit à l'événement
            if not InscriptionEvent.objects.filter(
                event=event,
                participante=request.user,
                statut__in=['confirmee', 'en_attente']
            ).exists():
                return Response(
                    {'error': 'Vous devez être inscrit(e) à cet événement'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Calculer la date programmée
            from datetime import timedelta
            date_programmee = event.date_debut - timedelta(hours=int(heures_avant))
            
            if date_programmee <= timezone.now():
                return Response(
                    {'error': 'La date programmée est dans le passé'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Créer le rappel
            rappel = RappelEvent.objects.create(
                event=event,
                destinataire=request.user,
                type_rappel=type_rappel,
                heures_avant=int(heures_avant),
                date_programmee=date_programmee,
                objet_personnalise=request.data.get('objet_personnalise', ''),
                message_personnalise=request.data.get('message_personnalise', '')
            )
            
            return Response({
                'message': 'Rappel programmé avec succès',
                'rappel': RappelEventSerializer(rappel).data
            }, status=status.HTTP_201_CREATED)
        
        except Event.DoesNotExist:
            return Response(
                {'error': 'Événement non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError:
            return Response(
                {'error': 'Données invalides'},
                status=status.HTTP_400_BAD_REQUEST
            )


# Vues supplémentaires pour des fonctionnalités spécifiques
from rest_framework.views import APIView
from django.db.models import Min, Max


class EventDashboardView(APIView):
    """Vue tableau de bord pour les organisateurs"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Tableau de bord personnalisé"""
        user = request.user
        now = timezone.now()
        
        # Événements organisés par l'utilisateur
        mes_events = Event.objects.filter(organisateur=user)
        
        # Mes inscriptions
        mes_inscriptions = InscriptionEvent.objects.filter(
            participante=user
        ).select_related('event')
        
        dashboard_data = {
            # Événements que j'organise
            'mes_events': {
                'total': mes_events.count(),
                'a_venir': mes_events.filter(date_debut__gt=now).count(),
                'en_cours': mes_events.filter(
                    date_debut__lte=now, date_fin__gte=now
                ).count(),
                'passes': mes_events.filter(date_fin__lt=now).count(),
                'brouillons': mes_events.filter(statut='brouillon').count(),
            },
            
            # Mes inscriptions
            'mes_inscriptions': {
                'total': mes_inscriptions.count(),
                'confirmees': mes_inscriptions.filter(statut='confirmee').count(),
                'en_attente': mes_inscriptions.filter(statut='en_attente').count(),
                'a_venir': mes_inscriptions.filter(
                    event__date_debut__gt=now,
                    statut__in=['confirmee', 'en_attente']
                ).count(),
            },
            
            # Prochains événements
            'prochains_events': EventListSerializer(
                Event.objects.filter(
                    Q(organisateur=user) | Q(inscriptions__participante=user),
                    date_debut__gt=now
                ).distinct().order_by('date_debut')[:5],
                many=True,
                context={'request': request}
            ).data,
            
            # Notifications et rappels
            'rappels_actifs': RappelEvent.objects.filter(
                destinataire=user,
                statut='programme',
                date_programmee__gt=now
            ).count(),
            
            # Évaluations en attente
            'evaluations_en_attente': mes_inscriptions.filter(
                statut='presente',
                evaluation_event__isnull=True,
                event__date_fin__lt=now
            ).count(),
        }
        
        return Response(dashboard_data)


class EventSearchView(APIView):
    """Vue de recherche avancée d'événements"""
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def post(self, request):
        """Recherche avancée avec filtres complexes"""
        filter_serializer = EventFilterSerializer(data=request.data)
        
        if not filter_serializer.is_valid():
            return Response(
                filter_serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        filters = filter_serializer.validated_data
        queryset = Event.objects.filter(est_publie=True)
        
        # Appliquer les filtres
        if filters.get('categorie'):
            queryset = queryset.filter(categorie=filters['categorie'])
        
        if filters.get('date_debut_min'):
            queryset = queryset.filter(date_debut__gte=filters['date_debut_min'])
        
        if filters.get('date_debut_max'):
            queryset = queryset.filter(date_debut__lte=filters['date_debut_max'])
        
        if filters.get('est_en_ligne') is not None:
            queryset = queryset.filter(est_en_ligne=filters['est_en_ligne'])
        
        if filters.get('places_disponibles'):
            queryset = queryset.annotate(
                nb_inscrits=Count('inscriptions', filter=Q(inscriptions__statut='confirmee'))
            ).filter(nb_inscrits__lt=F('max_participants'))
        
        if filters.get('organisateur'):
            queryset = queryset.filter(organisateur_id=filters['organisateur'])
        
        if filters.get('tags'):
            for tag in filters['tags']:
                queryset = queryset.filter(tags__contains=[tag])
        
        if filters.get('recherche'):
            terme = filters['recherche']
            queryset = queryset.filter(
                Q(titre__icontains=terme) |
                Q(description__icontains=terme) |
                Q(formateur_nom__icontains=terme) |
                Q(lieu__icontains=terme)
            )
        
        # Pagination
        page_size = min(int(request.data.get('page_size', 20)), 100)
        page = int(request.data.get('page', 1))
        
        start = (page - 1) * page_size
        end = start + page_size
        
        total_count = queryset.count()
        events = queryset[start:end]
        
        return Response({
            'results': EventListSerializer(
                events,
                many=True,
                context={'request': request}
            ).data,
            'total_count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size
        })


class EventRecommendationView(APIView):
    """Vue pour les recommandations d'événements"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Recommandations personnalisées d'événements"""
        user = request.user
        now = timezone.now()
        
        # Analyser les préférences de l'utilisateur
        inscriptions_passees = InscriptionEvent.objects.filter(
            participante=user,
            event__date_fin__lt=now
        ).select_related('event')
        
        # Catégories préférées (basées sur l'historique)
        categories_preferees = {}
        for inscription in inscriptions_passees:
            cat = inscription.event.categorie
            categories_preferees[cat] = categories_preferees.get(cat, 0) + 1
        
        # Trier par préférence
        categories_preferees = sorted(
            categories_preferees.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        recommendations = []
        
        # Événements similaires aux préférences
        if categories_preferees:
            for categorie, _ in categories_preferees[:3]:
                events_similaires = Event.objects.filter(
                    categorie=categorie,
                    date_debut__gt=now,
                    est_publie=True
                ).exclude(
                    inscriptions__participante=user
                ).order_by('date_debut')[:2]
                
                recommendations.extend(events_similaires)
        
        # Événements populaires
        events_populaires = Event.objects.filter(
            date_debut__gt=now,
            est_publie=True
        ).exclude(
            inscriptions__participante=user
        ).annotate(
            nb_inscrits=Count('inscriptions')
        ).order_by('-nb_inscrits')[:3]
        
        recommendations.extend(events_populaires)
        
        # Événements récemment ajoutés
        events_recents = Event.objects.filter(
            date_debut__gt=now,
            est_publie=True,
            date_creation__gte=now - timedelta(days=7)
        ).exclude(
            inscriptions__participante=user
        ).order_by('-date_creation')[:2]
        
        recommendations.extend(events_recents)
        
        # Supprimer les doublons et limiter
        seen = set()
        unique_recommendations = []
        for event in recommendations:
            if event.id not in seen:
                seen.add(event.id)
                unique_recommendations.append(event)
                if len(unique_recommendations) >= 10:
                    break
        
        return Response({
            'recommendations': EventListSerializer(
                unique_recommendations,
                many=True,
                context={'request': request}
            ).data,
            'raisons': {
                'categories_preferees': [cat for cat, _ in categories_preferees[:3]],
                'nb_inscriptions_passees': len(inscriptions_passees)
            }
        })


class EventAnalyticsView(APIView):
    """Vue pour les analytics d'événements"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, event_id):
        """Analytics détaillées pour un événement"""
        try:
            event = Event.objects.get(id=event_id)
            
            # Vérifier les permissions
            if not (request.user.is_staff or event.organisateur == request.user):
                raise PermissionDenied()
            
            inscriptions = event.inscriptions.all()
            
            analytics = {
                'event_info': EventDetailSerializer(event, context={'request': request}).data,
                
                # Statistiques des inscriptions
                'inscriptions': {
                    'total': inscriptions.count(),
                    'par_statut': {
                        statut: inscriptions.filter(statut=statut).count()
                        for statut, _ in InscriptionEvent.STATUTS_INSCRIPTION
                    },
                    'evolution_par_jour': self._get_evolution_inscriptions(event),
                },
                
                # Données démographiques
                'demographics': self._get_demographics(inscriptions),
                
                # Évaluations
                'evaluations': self._get_evaluations_stats(inscriptions),
                
                # Taux de participation
                'participation': self._get_participation_stats(event),
            }
            
            return Response(analytics)
        
        except Event.DoesNotExist:
            return Response(
                {'error': 'Événement non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def _get_evolution_inscriptions(self, event):
        """Evolution des inscriptions par jour"""
        inscriptions = event.inscriptions.order_by('date_inscription')
        
        if not inscriptions:
            return {}
        
        first_date = inscriptions.first().date_inscription.date()
        last_date = timezone.now().date()
        
        evolution = {}
        current_count = 0
        
        current_date = first_date
        while current_date <= last_date:
            day_inscriptions = inscriptions.filter(
                date_inscription__date=current_date
            ).count()
            current_count += day_inscriptions
            evolution[current_date.isoformat()] = current_count
            current_date += timedelta(days=1)
        
        return evolution
    
    def _get_demographics(self, inscriptions):
        """Analyse démographique des participants"""
        inscriptions_confirmees = inscriptions.filter(statut='confirmee')
        
        # Par région
        par_region = {}
        for inscription in inscriptions_confirmees:
            region = inscription.participante.region
            par_region[region] = par_region.get(region, 0) + 1
        
        # Par expérience
        par_experience = {}
        for inscription in inscriptions_confirmees:
            exp = inscription.participante.experience
            par_experience[exp] = par_experience.get(exp, 0) + 1
        
        return {
            'par_region': par_region,
            'par_experience': par_experience,
            'total_confirmees': inscriptions_confirmees.count()
        }
    
    def _get_evaluations_stats(self, inscriptions):
        """Statistiques des évaluations"""
        evaluations = inscriptions.filter(
            evaluation_event__isnull=False
        )
        
        if not evaluations:
            return {}
        
        notes = [i.evaluation_event for i in evaluations]
        
        return {
            'nombre_evaluations': len(notes),
            'note_moyenne': sum(notes) / len(notes),
            'distribution': {
                str(i): notes.count(i) for i in range(1, 6)
            },
            'commentaires': [
                i.commentaire_evaluation
                for i in evaluations
                if i.commentaire_evaluation
            ]
        }
    
    def _get_participation_stats(self, event):
        """Statistiques de participation"""
        if not event.est_passe:
            return {'message': 'Événement non terminé'}
        
        confirmees = event.inscriptions.filter(statut='confirmee').count()
        presentes = event.inscriptions.filter(statut='presente').count()
        
        taux_participation = (presentes / confirmees * 100) if confirmees > 0 else 0
        
        return {
            'inscriptions_confirmees': confirmees,
            'participants_presents': presentes,
            'taux_participation': round(taux_participation, 2),
            'places_utilisees': round((presentes / event.max_participants * 100), 2)
        }