#!/usr/bin/env python
"""
Script de réinitialisation complète de la base de données
Supprime toutes les données et recrée les tables
"""
import os
import sys
import django
from django.core.management import call_command
from django.db import connection # This is the correct connection object to use

# Ajouter le répertoire parent au path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'plateforme_femmes_backend.settings')
django.setup()


def reset_database():
    """Réinitialise complètement la base de données"""
    print("🔄 Réinitialisation de la base de données...")

    # Confirmation de sécurité
    if input("\n⚠️  ATTENTION: Cette action supprimera TOUTES les données! Continuer? (yes/no): ").lower() != 'yes':
        print("❌ Opération annulée.")
        return

    try:
        # Fermer toutes les connexions
        connection.close()

        # Supprimer les migrations
        print("\n📁 Suppression des fichiers de migration...")
        # Start from the project root to find migration files correctly
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        for root, dirs, files in os.walk(project_root):
            if 'migrations' in dirs and not root.endswith('__pycache__'):
                migrations_dir = os.path.join(root, 'migrations')
                for file in os.listdir(migrations_dir):
                    if file.endswith('.py') and file != '__init__.py':
                        file_path = os.path.join(migrations_dir, file)
                        os.remove(file_path)
                        print(f"   ✓ Supprimé: {file_path}")

        # Supprimer la base de données SQLite (si utilisée)
        # Assuming db.sqlite3 is in the project root
        db_path = os.path.join(project_root, 'db.sqlite3')
        if os.path.exists(db_path):
            os.remove(db_path)
            print(f"\n🗑️  Base de données SQLite supprimée: {db_path}")

        # Pour PostgreSQL, supprimer et recréer les tables
        # The 'connection' object from django.db is already available here.
        if 'postgresql' in connection.settings_dict['ENGINE']:
            print("\n🐘 Réinitialisation PostgreSQL...")
            with connection.cursor() as cursor:
                # Obtenir toutes les tables
                cursor.execute("""
                    SELECT tablename FROM pg_tables
                    WHERE schemaname = 'public'
                """)
                tables = cursor.fetchall()

                # Supprimer toutes les tables avec CASCADE pour gérer les dépendances
                for table in tables:
                    cursor.execute(f'DROP TABLE IF EXISTS "{table[0]}" CASCADE') # Added quotes for case-sensitive table names
                    print(f"   ✓ Table supprimée: {table[0]}")

        # Créer les nouvelles migrations
        print("\n🔨 Création des nouvelles migrations...")
        apps = ['users', 'nip_verification', 'document_upload']

        for app in apps:
            try:
                call_command('makemigrations', app, verbosity=0)
                print(f"   ✓ Migrations créées pour: {app}")
            except Exception as e:
                print(f"   ⚠️  Erreur pour {app}: {str(e)}")

        # Appliquer les migrations
        print("\n🚀 Application des migrations...")
        call_command('migrate', verbosity=0)
        print("   ✓ Toutes les migrations appliquées")

        # Créer les répertoires media
        # Ensure media directories are created relative to the project root
        media_root = os.path.join(project_root, 'media')
        media_dirs = ['uploads', 'documents', 'avatars']
        for dir_name in media_dirs:
            dir_path = os.path.join(media_root, dir_name)
            os.makedirs(dir_path, exist_ok=True)
            print(f"   ✓ Répertoire créé: {dir_path}")

        print("\n✅ Base de données réinitialisée avec succès!")
        print("\n💡 Conseil: Exécutez 'python scripts/populate_db.py' pour ajouter des données de test.")

    except Exception as e:
        print(f"\n❌ Erreur lors de la réinitialisation: {str(e)}")
        sys.exit(1)


if __name__ == '__main__':
    reset_database()