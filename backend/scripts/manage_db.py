#!/usr/bin/env python
"""
Script de gestion complet de la base de données
Permet de réinitialiser, sauvegarder, restaurer et gérer les données
"""
import os
import sys
import django
import json
import shutil
from datetime import datetime
from django.core import serializers
from django.core.management import call_command
from django.conf import settings # Pour accéder à la configuration des applications et au chemin de la base de données

# Ajouter le répertoire parent au path pour que Django trouve les applications
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'plateforme_femmes_backend.settings')
django.setup()

# Importations des modèles après django.setup()
# C'est une bonne pratique pour éviter les erreurs d'importation circulaire ou les problèmes de configuration
from users.models import Participante
# Ajoutez ici d'autres modèles si vous souhaitez les sérialiser/désérialiser spécifiquement

class DatabaseManager:
    """Gestionnaire de base de données avec diverses opérations"""

    def __init__(self):
        self.backup_dir = 'backups'
        os.makedirs(self.backup_dir, exist_ok=True)
        # Obtenez le chemin de la base de données à partir des paramètres Django
        self.db_path = settings.DATABASES['default']['NAME']
        # Assurez-vous que le chemin est absolu si nécessaire
        if not os.path.isabs(self.db_path):
            self.db_path = os.path.join(settings.BASE_DIR, self.db_path)

    def _get_all_app_models(self):
        """Récupère tous les modèles enregistrés dans Django."""
        from django.apps import apps
        all_models = []
        for app_config in apps.get_app_configs():
            for model in app_config.get_models():
                # Exclure les modèles qui ne devraient pas être sérialisés/désérialisés directement
                # Par exemple, les modèles de permissions ou de sessions si vous les réinitialisez avec migrate
                # if model._meta.app_label != 'auth' and model._meta.app_label != 'admin':
                all_models.append(model)
        return all_models

    def backup_database(self, backup_name=None, include_media=True, include_json_data=True):
        """Sauvegarde complète de la base de données et des médias/données JSON."""
        if not backup_name:
            backup_name = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        backup_path = os.path.join(self.backup_dir, backup_name)
        os.makedirs(backup_path, exist_ok=True)

        print(f"\n💾 Sauvegarde de la base de données dans: {backup_path}")

        try:
            # Sauvegarde de la base de données SQLite
            if os.path.exists(self.db_path):
                shutil.copy2(self.db_path, os.path.join(backup_path, os.path.basename(self.db_path)))
                print(f"   ✅ Base de données '{os.path.basename(self.db_path)}' sauvegardée")
            else:
                print(f"   ⚠️ Le fichier de base de données '{os.path.basename(self.db_path)}' n'existe pas, il ne sera pas sauvegardé.")

            # Sauvegarde des médias
            if include_media and os.path.exists(settings.MEDIA_ROOT):
                media_backup = os.path.join(backup_path, 'media')
                if os.path.exists(media_backup):
                    shutil.rmtree(media_backup) # Supprimer l'ancienne copie si elle existe
                shutil.copytree(settings.MEDIA_ROOT, media_backup)
                print("   ✅ Fichiers média sauvegardés")
            elif include_media:
                print(f"   ⚠️ Le dossier média '{settings.MEDIA_ROOT}' n'existe pas, il ne sera pas sauvegardé.")

            # Export des données de tous les modèles en JSON
            if include_json_data:
                json_data_file = os.path.join(backup_path, 'all_data.json')
                try:
                    # Utilisez call_command pour dumpdata, c'est plus robuste
                    with open(json_data_file, 'w', encoding='utf-8') as f:
                        call_command('dumpdata', indent=2, stdout=f)
                    print("   ✅ Toutes les données des applications exportées en JSON")
                except Exception as e:
                    print(f"   ❌ Erreur lors de l'exportation des données JSON: {str(e)}")

            # Créer un fichier info
            info = {
                'date': datetime.now().isoformat(),
                'django_version': django.VERSION,
                'db_file': os.path.basename(self.db_path),
                'user_count': Participante.objects.count(),
                'validated_count': Participante.objects.filter(statut_validation='validee').count()
            }

            with open(os.path.join(backup_path, 'info.json'), 'w') as f:
                json.dump(info, f, indent=2)

            print(f"\n✅ Sauvegarde complète réalisée: {backup_name}")
            return backup_path

        except Exception as e:
            print(f"❌ Erreur lors de la sauvegarde: {str(e)}")
            return None

    def restore_database(self, backup_name):
        """Restaure une sauvegarde de la base de données et des médias."""
        backup_path = os.path.join(self.backup_dir, backup_name)

        if not os.path.exists(backup_path):
            print(f"❌ Sauvegarde introuvable: {backup_path}")
            return False

        print(f"\n🔄 Restauration depuis: {backup_path}")

        confirm = input("\n⚠️ Cette action écrasera les données actuelles de la base et les médias! Continuer? (yes/no): ").lower()
        if confirm != 'yes':
            print("❌ Restauration annulée.")
            return False

        try:
            # Restaurer la base de données SQLite
            db_backup_file = os.path.join(backup_path, os.path.basename(self.db_path))
            if os.path.exists(db_backup_file):
                # Assurez-vous que le fichier db.sqlite3 est fermé avant de le remplacer
                # Cela peut nécessiter de stopper le serveur Django ou de déconnecter les connexions
                print(f"   Info: Fermeture des connexions à la base de données avant restauration...")
                from django.db import connections
                connections['default'].close() # Ferme la connexion par défaut

                if os.path.exists(self.db_path):
                    os.remove(self.db_path) # Supprime l'ancienne DB
                shutil.copy2(db_backup_file, self.db_path)
                print(f"   ✅ Base de données '{os.path.basename(self.db_path)}' restaurée")
                # Réouvrir la connexion après restauration
                connections['default'].cursor()
            else:
                print(f"   ⚠️ Fichier de base de données '{os.path.basename(self.db_path)}' introuvable dans la sauvegarde. Base de données non restaurée.")


            # Restaurer les médias
            media_backup = os.path.join(backup_path, 'media')
            if os.path.exists(media_backup):
                if os.path.exists(settings.MEDIA_ROOT):
                    shutil.rmtree(settings.MEDIA_ROOT) # Supprime le dossier média actuel
                shutil.copytree(media_backup, settings.MEDIA_ROOT)
                print("   ✅ Fichiers média restaurés")
            else:
                print("   ⚠️ Dossier média introuvable dans la sauvegarde. Fichiers média non restaurés.")

            # Recharger les données JSON si un fichier est présent (alternative à la restauration directe de la DB)
            json_data_file = os.path.join(backup_path, 'all_data.json')
            if os.path.exists(json_data_file):
                print("   Info: Tenter de recharger les données JSON. Note: Cela peut être utile si la restauration du fichier DB échoue ou pour migrer des données.")
                try:
                    # Optionnel: Réinitialiser la DB avant de charger les données JSON si on ne restaure pas le fichier db.sqlite3
                    # self.reset_database(confirm=False) # Si vous voulez toujours un reset avant le loaddata

                    # Utiliser loaddata pour charger les données
                    call_command('loaddata', json_data_file)
                    print("   ✅ Données JSON rechargées (loaddata)")
                except Exception as e:
                    print(f"   ❌ Erreur lors du rechargement des données JSON: {str(e)}")


            print("\n✅ Restauration complète!")
            return True

        except Exception as e:
            print(f"❌ Erreur lors de la restauration: {str(e)}")
            return False

    def list_backups(self):
        """Liste toutes les sauvegardes disponibles avec des informations."""
        print("\n📂 Sauvegardes disponibles:")

        backups = []
        for backup_folder in os.listdir(self.backup_dir):
            backup_path = os.path.join(self.backup_dir, backup_folder)
            if os.path.isdir(backup_path):
                info_file = os.path.join(backup_path, 'info.json')
                info = {}
                if os.path.exists(info_file):
                    try:
                        with open(info_file, 'r', encoding='utf-8') as f:
                            info = json.load(f)
                    except json.JSONDecodeError:
                        print(f"   ⚠️ Fichier info.json corrompu dans {backup_folder}")
                        info = {} # Réinitialiser info en cas d'erreur
                
                backups.append({
                    'name': backup_folder,
                    'date': info.get('date', 'N/A'),
                    'users': info.get('user_count', 'N/A'),
                    'validated': info.get('validated_count', 'N/A')
                })

        if not backups:
            print("   Aucune sauvegarde trouvée.")
            return

        # Trier par date, du plus récent au plus ancien
        try:
            backups.sort(key=lambda x: datetime.fromisoformat(x['date']) if x['date'] != 'N/A' else datetime.min, reverse=True)
        except ValueError:
            print("   ⚠️ Erreur de format de date dans une ou plusieurs sauvegardes, tri non garanti.")
            backups.sort(key=lambda x: x['name'], reverse=True) # Fallback sur le nom

        for backup in backups:
            print(f"\n   📁 {backup['name']}")
            print(f"     Date: {backup['date']}")
            print(f"     Utilisateurs: {backup['users']}")
            print(f"     Validés: {backup['validated']}")

    def delete_backup(self, backup_name):
        """Supprime une sauvegarde spécifique."""
        backup_path = os.path.join(self.backup_dir, backup_name)

        if not os.path.exists(backup_path):
            print(f"❌ Sauvegarde '{backup_name}' introuvable.")
            return False

        confirm = input(f"⚠️ Êtes-vous sûr de vouloir supprimer la sauvegarde '{backup_name}' et tous ses contenus? (yes/no): ").lower()
        if confirm != 'yes':
            print("❌ Suppression annulée.")
            return False

        try:
            shutil.rmtree(backup_path)
            print(f"✅ Sauvegarde '{backup_name}' supprimée avec succès.")
            return True
        except Exception as e:
            print(f"❌ Erreur lors de la suppression de la sauvegarde '{backup_name}': {str(e)}")
            return False

    def reset_database(self, confirm=True):
        """
        Réinitialise la base de données en supprimant le fichier DB, les migrations et en refaisant les migrations.
        Optionnellement, peut recréer le superutilisateur par défaut.
        """
        print("\n💥 Réinitialisation complète de la base de données...")

        if confirm:
            confirmation = input("⚠️ Cette action va SUPPRIMER toutes les données et la structure de la base de données. Continuer? (yes/no): ").lower()
            if confirmation != 'yes':
                print("❌ Réinitialisation annulée.")
                return False

        try:
            # 1. Supprimer le fichier de la base de données (si SQLite)
            if os.path.exists(self.db_path):
                from django.db import connections
                connections['default'].close() # Ferme la connexion avant de supprimer le fichier
                os.remove(self.db_path)
                print(f"   ✅ Fichier de base de données '{os.path.basename(self.db_path)}' supprimé.")
            else:
                print(f"   ⚠️ Fichier de base de données '{os.path.basename(self.db_path)}' non trouvé, ignorer la suppression.")

            # 2. Supprimer les fichiers de migration pour chaque application
            base_dir = settings.BASE_DIR
            for app_config in django.apps.apps.get_app_configs():
                migrations_dir = os.path.join(app_config.path, 'migrations')
                if os.path.isdir(migrations_dir):
                    for filename in os.listdir(migrations_dir):
                        if filename != '__init__.py' and filename.endswith('.py'):
                            os.remove(os.path.join(migrations_dir, filename))
                            print(f"   🗑️ Migration supprimée: {os.path.join(app_config.label, 'migrations', filename)}")
            print("   ✅ Tous les fichiers de migration des applications supprimés.")


            # 3. Refaire les migrations
            print("   ⚙️ Création de nouvelles migrations...")
            call_command('makemigrations') # Exécute makemigrations pour toutes les apps
            print("   ⚙️ Application des migrations...")
            call_command('migrate')
            print("   ✅ Base de données réinitialisée et migrations appliquées.")

            return True

        except Exception as e:
            print(f"❌ Erreur lors de la réinitialisation: {str(e)}")
            return False

    def truncate_app_data(self, app_name, confirm=True):
        """
        Vide les données de tous les modèles d'une application spécifique sans supprimer la table.
        Garde la structure de la base de données.
        """
        print(f"\n🗑️ Vidage des données de l'application '{app_name}'...")

        try:
            app_config = django.apps.apps.get_app_config(app_name)
        except LookupError:
            print(f"❌ Application '{app_name}' introuvable.")
            return False

        models_to_truncate = app_config.get_models()
        if not models_to_truncate:
            print(f"   Aucun modèle trouvé pour l'application '{app_name}'.")
            return True

        if confirm:
            model_names = [model.__name__ for model in models_to_truncate]
            confirmation = input(
                f"⚠️ Cette action va supprimer TOUTES les données des modèles suivants dans '{app_name}': "
                f"{', '.join(model_names)}. Continuer? (yes/no): "
            ).lower()
            if confirmation != 'yes':
                print("❌ Vidage annulé.")
                return False

        try:
            from django.db import connection, transaction
            with transaction.atomic():
                for model in models_to_truncate:
                    # Supprimer les objets un par un peut déclencher des signaux ou des nettoyages personnalisés
                    # C'est souvent plus sûr que TRUNCATE TABLE sur certains DBs (PostgreSQL SEQUENCE RESET)
                    # Si la performance est critique pour de très grandes tables, considérez Model.objects.all()._raw_delete(self.db_manager.using)
                    # Mais assurez-vous de gérer les FKs et les séquences.
                    model.objects.all().delete()
                    print(f"   🗑️ Données du modèle '{model.__name__}' supprimées.")
            print(f"✅ Données de l'application '{app_name}' vidées avec succès.")
            return True
        except Exception as e:
            print(f"❌ Erreur lors du vidage des données de l'application '{app_name}': {str(e)}")
            return False


def print_help():
    """Affiche le message d'aide."""
    print("\nUtilisation: python database_manager.py [commande] [options]")
    print("\nCommandes disponibles:")
    print("  backup [nom_sauvegarde] [--no-media] [--no-json] - Sauvegarde la base de données et les médias.")
    print("    Si 'nom_sauvegarde' est omis, un nom basé sur la date/heure sera utilisé.")
    print("    --no-media: Ne pas inclure les fichiers médias dans la sauvegarde.")
    print("    --no-json: Ne pas inclure l'export JSON des données dans la sauvegarde.")
    print("  restore <nom_sauvegarde> - Restaure une sauvegarde spécifique.")
    print("  list                       - Liste toutes les sauvegardes disponibles.")
    print("  delete <nom_sauvegarde>    - Supprime une sauvegarde spécifique.")
    print("  reset                      - Réinitialise complètement la base de données (supprime tout).")
    print("  truncate <nom_app>         - Vide toutes les données des modèles d'une application spécifiée.")
    print("  help                       - Affiche ce message d'aide.")
    print("\nExemples:")
    print("  python database_manager.py backup")
    print("  python database_manager.py backup my_project_snapshot --no-media")
    print("  python database_manager.py restore backup_20231026_143000")
    print("  python database_manager.py list")
    print("  python database_manager.py delete old_backup_2022")
    print("  python database_manager.py reset")
    print("  python database_manager.py truncate users")

def main():
    """Fonction principale pour l'exécution du script."""
    manager = DatabaseManager()
    args = sys.argv[1:] # Récupère les arguments après le nom du script

    if not args:
        print_help()
        sys.exit(1)

    command = args[0]

    if command == 'backup':
        backup_name = None
        include_media = True
        include_json_data = True
        if len(args) > 1 and not args[1].startswith('--'):
            backup_name = args[1]
            remaining_args = args[2:]
        else:
            remaining_args = args[1:]
        
        if '--no-media' in remaining_args:
            include_media = False
            remaining_args.remove('--no-media')
        if '--no-json' in remaining_args:
            include_json_data = False
            remaining_args.remove('--no-json')
        
        if remaining_args: # Si des arguments inconnus restent
            print(f"❌ Arguments inconnus pour la commande 'backup': {remaining_args}")
            print_help()
            sys.exit(1)

        manager.backup_database(backup_name, include_media, include_json_data)

    elif command == 'restore':
        if len(args) < 2:
            print("❌ Commande 'restore' nécessite un nom de sauvegarde.")
            print_help()
            sys.exit(1)
        manager.restore_database(args[1])

    elif command == 'list':
        manager.list_backups()

    elif command == 'delete':
        if len(args) < 2:
            print("❌ Commande 'delete' nécessite un nom de sauvegarde.")
            print_help()
            sys.exit(1)
        manager.delete_backup(args[1])

    elif command == 'reset':
        if len(args) > 1:
            print("❌ Commande 'reset' ne prend pas d'arguments.")
            print_help()
            sys.exit(1)
        manager.reset_database()
    
    elif command == 'truncate':
        if len(args) < 2:
            print("❌ Commande 'truncate' nécessite le nom d'une application.")
            print_help()
            sys.exit(1)
        manager.truncate_app_data(args[1])

    elif command == 'help':
        print_help()

    else:
        print(f"❌ Commande inconnue: {command}")
        print_help()
        sys.exit(1)

if __name__ == '__main__':
    main()