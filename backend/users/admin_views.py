# users/admin_views.py

from users.models import Participante
from django.contrib.auth.decorators import login_required, user_passes_test
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator # Non utilisé ici, peut être supprimé
from django.http import JsonResponse
import json
from django.utils import timezone # Nécessaire pour timezone.now()

def is_admin(user):
    """Vérifie si l'utilisateur est authentifié et est staff (administrateur)."""
    return user.is_authenticated and user.is_staff # is_staff pour les admins

@login_required
@user_passes_test(is_admin)
def pending_participants(request):
    """Affiche la liste des participantes en attente de validation."""
    # Utilisation du manager personnalisé si pertinent, sinon filter() direct
    # participantes = Participante.objects.pending() # Si ParticipanteManager a la méthode pending()
    participantes = Participante.objects.filter(statut_validation='en_attente').order_by('date_joined')
    return render(request, 'admin_dashboard/pending_participants.html', {
        'participantes': participantes
    })

@login_required
@user_passes_test(is_admin)
def validate_participant(request, pk):
    """Valide une participante et met à jour son statut."""
    participante = get_object_or_404(Participante, pk=pk)
    if participante.statut_validation != 'validee': # Évite les re-validations inutiles
        participante.statut_validation = 'validee'
        participante.motif_rejet = '' # Efface le motif de rejet si elle est validée
        participante.validated_at = timezone.now() # Enregistre la date de validation
        participante.validated_by = request.user # Enregistre l'admin qui a validé
        participante.save()
        messages.success(request, f"{participante.get_full_name()} (NIP: {participante.nip}) a été validée avec succès.")
    else:
        messages.info(request, f"{participante.get_full_name()} est déjà validée.")
    return redirect('pending_participants')

@login_required
@user_passes_test(is_admin)
@csrf_exempt # Attention: L'utilisation de csrf_exempt est dangereuse sans vérification CSRF. Préférez @require_POST ou un formulaire Django avec {% csrf_token %}
def reject_participant(request, pk):
    """Rejette une participante avec un motif."""
    if request.method == 'POST':
        participante = get_object_or_404(Participante, pk=pk)
        try:
            # S'attendre à du JSON pour le motif, comme dans votre code
            data = json.loads(request.body)
            motif = data.get('motif', '').strip()
            if not motif:
                return JsonResponse({'error': 'Motif de rejet requis.'}, status=400)

            if participante.statut_validation != 'rejetee': # Évite les re-rejets inutiles
                participante.statut_validation = 'rejetee'
                participante.motif_rejet = motif
                participante.validated_at = timezone.now() # Optionnel: enregistrer la date de rejet
                participante.validated_by = request.user # Enregistrer l'admin qui a rejeté
                participante.save()
                return JsonResponse({'success': True, 'message': f"Participante {participante.get_full_name()} rejetée avec motif."})
            else:
                return JsonResponse({'success': False, 'message': f"Participante {participante.get_full_name()} est déjà rejetée."})

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Requête JSON invalide'}, status=400)
    return JsonResponse({'error': 'Méthode non autorisée'}, status=405) # Gérer les requêtes non-POST