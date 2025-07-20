from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from django.conf import settings
from django.core.files.base import ContentFile
import hashlib
import io
import os
from datetime import datetime

def generer_certificat(inscription):
    """Génère un certificat PDF pour une inscription"""
    
    buffer = io.BytesIO()
    
    # Créer le PDF en paysage
    p = canvas.Canvas(buffer, pagesize=landscape(A4))
    width, height = landscape(A4)
    
    # Couleurs
    bleu_gabon = (0/255, 113/255, 188/255)
    vert_gabon = (0/255, 150/255, 57/255)
    or_gabon = (255/255, 193/255, 7/255)
    
    # En-tête
    p.setFillColorRGB(*bleu_gabon)
    p.setFont("Helvetica-Bold", 24)
    p.drawCentredText(width/2, height-80, "RÉPUBLIQUE GABONAISE")
    
    p.setFillColorRGB(*vert_gabon)
    p.setFont("Helvetica", 16)
    p.drawCentredText(width/2, height-110, "Plateforme Femmes en Politique")
    
    # Titre du certificat
    p.setFillColorRGB(0, 0, 0)
    p.setFont("Helvetica-Bold", 32)
    p.drawCentredText(width/2, height-180, "CERTIFICAT DE FORMATION")
    
    # Ligne décorative
    p.setStrokeColorRGB(*or_gabon)
    p.setLineWidth(3)
    p.line(150, height-200, width-150, height-200)
    
    # Contenu principal
    p.setFont("Helvetica", 18)
    p.setFillColorRGB(0, 0, 0)
    
    texte_principal = f"Il est certifié que"
    p.drawCentredText(width/2, height-250, texte_principal)
    
    # Nom de la participante
    p.setFont("Helvetica-Bold", 24)
    p.setFillColorRGB(*bleu_gabon)
    nom_complet = inscription.participante.get_full_name().upper()
    p.drawCentredText(width/2, height-290, nom_complet)
    
    # Formation suivie
    p.setFont("Helvetica", 18)
    p.setFillColorRGB(0, 0, 0)
    p.drawCentredText(width/2, height-330, "a suivi avec succès la formation")
    
    p.setFont("Helvetica-Bold", 20)
    p.setFillColorRGB(*vert_gabon)
    p.drawCentredText(width/2, height-370, f'"{inscription.formation.titre}"')
    
    # Détails de la formation
    p.setFont("Helvetica", 14)
    p.setFillColorRGB(0, 0, 0)
    
    details = [
        f"Durée: {inscription.formation.duree_heures} heures",
        f"Niveau: {inscription.formation.get_niveau_display()}",
        f"Catégorie: {inscription.formation.get_categorie_display()}",
        f"Note obtenue: {inscription.note_finale}/100" if inscription.note_finale else ""
    ]
    
    y_pos = height-420
    for detail in details:
        if detail:
            p.drawCentredText(width/2, y_pos, detail)
            y_pos -= 25
    
    # Date et lieu
    p.setFont("Helvetica", 12)
    date_str = datetime.now().strftime("%d/%m/%Y")
    p.drawString(100, 120, f"Fait à Libreville, le {date_str}")
    
    # Numéro de certificat
    from .models import Certificat
    certificat = Certificat.objects.get(inscription=inscription)
    p.drawString(100, 100, f"Numéro: {certificat.numero_certificat}")
    
    # Signature (placeholder)
    p.drawString(width-300, 120, "Directrice de la Formation")
    p.drawString(width-300, 100, "Plateforme Femmes en Politique")
    
    # QR Code zone (placeholder)
    p.setStrokeColorRGB(0.5, 0.5, 0.5)
    p.setLineWidth(1)
    p.rect(width-150, 50, 100, 100)
    p.setFont("Helvetica", 8)
    p.drawCentredText(width-100, 95, "QR Code")
    p.drawCentredText(width-100, 85, "Vérification")
    
    p.showPage()
    p.save()
    
    buffer.seek(0)
    return buffer

def calculer_hash_certificat(inscription):
    """Calcule un hash unique pour la vérification du certificat"""
    data = f"{inscription.id}-{inscription.formation.id}-{inscription.participante.id}-{inscription.date_completion}"
    return hashlib.sha256(data.encode()).hexdigest()