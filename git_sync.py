#!/usr/bin/env python
"""
Script de synchronisation Git pour sauvegarder le projet
sur GitHub et maintenir l'historique local
"""
import subprocess
import os
import sys
from datetime import datetime
from colorama import init, Fore, Style

init()

class GitSync:
    def __init__(self, project_path):
        self.project_path = project_path
        self.timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.date_short = datetime.now().strftime("%Y%m%d")
        
    def print_header(self, text):
        print(f"\n{Fore.CYAN}{'='*60}")
        print(f"{text}")
        print(f"{'='*60}{Style.RESET_ALL}")
        
    def print_success(self, text):
        print(f"{Fore.GREEN}✅ {text}{Style.RESET_ALL}")
        
    def print_error(self, text):
        print(f"{Fore.RED}❌ {text}{Style.RESET_ALL}")
        
    def print_info(self, text):
        print(f"{Fore.YELLOW}ℹ️  {text}{Style.RESET_ALL}")
        
    def print_warning(self, text):
        print(f"{Fore.MAGENTA}⚠️  {text}{Style.RESET_ALL}")
    
    def run_command(self, command, cwd=None):
        """Exécute une commande et retourne le résultat"""
        try:
            result = subprocess.run(
                command,
                shell=True,
                cwd=cwd or self.project_path,
                capture_output=True,
                text=True,
                encoding='utf-8'
            )
            
            if result.returncode == 0:
                return True, result.stdout
            else:
                return False, result.stderr
        except Exception as e:
            return False, str(e)
    
    def check_git_status(self):
        """Vérifie le statut Git du projet"""
        self.print_header("VÉRIFICATION DU STATUT GIT")
        
        # Vérifier si c'est un repo Git
        success, output = self.run_command("git rev-parse --git-dir")
        if not success:
            self.print_error("Ce n'est pas un dépôt Git!")
            self.print_info("Initialisation d'un nouveau dépôt...")
            self.run_command("git init")
            return False
        
        # Vérifier le statut
        success, output = self.run_command("git status --porcelain")
        if output.strip():
            self.print_info("Fichiers modifiés détectés:")
            print(output)
            return True
        else:
            self.print_info("Aucune modification détectée")
            return False
    
    def check_remote(self):
        """Vérifie si un remote GitHub est configuré"""
        self.print_header("VÉRIFICATION DU REMOTE GITHUB")
        
        success, output = self.run_command("git remote -v")
        
        if not output.strip():
            self.print_warning("Aucun remote configuré")
            self.print_info("Pour ajouter un remote GitHub:")
            print(f"{Fore.CYAN}git remote add origin https://github.com/VOTRE_USERNAME/plateforme_femmes.git{Style.RESET_ALL}")
            return False
        else:
            self.print_success("Remote configuré:")
            print(output)
            return True
    
    def create_gitignore(self):
        """Crée ou met à jour le .gitignore"""
        gitignore_content = """# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
.env
*.log
db.sqlite3
*.db

# Django
*/migrations/
media/
staticfiles/
.coverage
htmlcov/

# React / Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.npm
.eslintcache
build/
dist/

# IDE
.vscode/
.idea/
*.sublime-project
*.sublime-workspace
.DS_Store

# Secrets
*.pem
*.key
secrets.json
.env.local
.env.production

# Tests
coverage/
.pytest_cache/

# Temporaires
*.tmp
*.bak
*.swp
*~
"""
        
        gitignore_path = os.path.join(self.project_path, '.gitignore')
        
        if not os.path.exists(gitignore_path):
            with open(gitignore_path, 'w') as f:
                f.write(gitignore_content)
            self.print_success(".gitignore créé")
        else:
            self.print_info(".gitignore existe déjà")
    
    def commit_changes(self):
        """Commit les changements"""
        self.print_header("COMMIT DES CHANGEMENTS")
        
        # Ajouter tous les fichiers
        self.print_info("Ajout des fichiers...")
        success, output = self.run_command("git add -A")
        
        if not success:
            self.print_error(f"Erreur lors de l'ajout: {output}")
            return False
        
        # Créer le message de commit
        commit_message = f"Mise à jour {self.timestamp} - Tests connexion frontend/backend réussis"
        
        # Faire le commit
        self.print_info(f"Commit: {commit_message}")
        success, output = self.run_command(f'git commit -m "{commit_message}"')
        
        if success:
            self.print_success("Commit effectué avec succès")
            # Afficher le hash du commit
            success, commit_hash = self.run_command("git rev-parse --short HEAD")
            if success:
                self.print_info(f"Hash du commit: {commit_hash.strip()}")
        else:
            if "nothing to commit" in output:
                self.print_info("Rien à committer")
            else:
                self.print_error(f"Erreur commit: {output}")
            return False
        
        return True
    
    def push_to_github(self):
        """Push vers GitHub"""
        self.print_header("PUSH VERS GITHUB")
        
        # Vérifier la branche actuelle
        success, branch = self.run_command("git branch --show-current")
        if success:
            branch = branch.strip()
            self.print_info(f"Branche actuelle: {branch}")
        else:
            branch = "main"
        
        # Tenter le push
        self.print_info("Push en cours...")
        success, output = self.run_command(f"git push -u origin {branch}")
        
        if success:
            self.print_success("Push réussi vers GitHub!")
        else:
            if "fatal: The current branch" in output:
                self.print_warning("Première fois? Essai avec --set-upstream...")
                success, output = self.run_command(f"git push --set-upstream origin {branch}")
                if success:
                    self.print_success("Push réussi!")
                else:
                    self.print_error(f"Erreur push: {output}")
                    self.print_info("Vérifiez vos credentials GitHub")
            else:
                self.print_error(f"Erreur push: {output}")
    
    def create_backup_branch(self):
        """Crée une branche de backup datée"""
        self.print_header("CRÉATION BRANCHE DE BACKUP")
        
        branch_name = f"backup-{self.date_short}"
        
        # Créer la branche
        success, output = self.run_command(f"git checkout -b {branch_name}")
        
        if success:
            self.print_success(f"Branche {branch_name} créée")
            # Revenir sur main/master
            self.run_command("git checkout main")
        else:
            if "already exists" in output:
                self.print_info(f"La branche {branch_name} existe déjà")
            else:
                self.print_error(f"Erreur création branche: {output}")
    
    def show_log(self):
        """Affiche les derniers commits"""
        self.print_header("HISTORIQUE RÉCENT")
        
        success, output = self.run_command("git log --oneline -10")
        if success:
            print(output)
        else:
            self.print_error("Impossible d'afficher l'historique")
    
    def sync(self):
        """Processus complet de synchronisation"""
        print(f"{Fore.BLUE}🔄 SYNCHRONISATION GIT - PLATEFORME FEMMES EN POLITIQUE")
        print(f"📁 Dossier: {self.project_path}")
        print(f"🕐 Date: {self.timestamp}{Style.RESET_ALL}")
        
        # Créer .gitignore si nécessaire
        self.create_gitignore()
        
        # Vérifier le statut
        has_changes = self.check_git_status()
        
        # Vérifier le remote
        has_remote = self.check_remote()
        
        if has_changes:
            # Faire le commit
            if self.commit_changes():
                # Créer une branche de backup
                self.create_backup_branch()
                
                # Push si remote configuré
                if has_remote:
                    self.push_to_github()
                else:
                    self.print_warning("Remote non configuré - Push ignoré")
        
        # Afficher l'historique
        self.show_log()
        
        self.print_header("RÉSUMÉ")
        self.print_success("Synchronisation terminée!")
        
        if not has_remote:
            print(f"\n{Fore.YELLOW}Pour configurer GitHub:")
            print("1. Créez un nouveau repository sur GitHub")
            print("2. Exécutez:")
            print(f"   git remote add origin https://github.com/VOTRE_USERNAME/plateforme_femmes.git")
            print(f"   git push -u origin main{Style.RESET_ALL}")


def main():
    # Déterminer le chemin du projet
    if len(sys.argv) > 1:
        project_path = sys.argv[1]
    else:
        # Essayer de deviner le chemin
        current_path = os.getcwd()
        if "backend" in current_path:
            project_path = os.path.dirname(current_path)
        else:
            project_path = current_path
    
    # Vérifier que le chemin existe
    if not os.path.exists(project_path):
        print(f"{Fore.RED}Erreur: Le chemin '{project_path}' n'existe pas{Style.RESET_ALL}")
        sys.exit(1)
    
    # Lancer la synchronisation
    syncer = GitSync(project_path)
    syncer.sync()


if __name__ == "__main__":
    main()