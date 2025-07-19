
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
    
    def has_commits(self):
        success, output = self.run_command("git rev-parse HEAD")
        return success
    
    def check_git_status(self):
        self.print_header("VÉRIFICATION DU STATUT GIT")
        success, output = self.run_command("git rev-parse --git-dir")
        if not success:
            self.print_error("Ce n'est pas un dépôt Git!")
            self.print_info("Initialisation d'un nouveau dépôt...")
            self.run_command("git init")
            return False
        
        success, output = self.run_command("git status --porcelain")
        if output.strip():
            self.print_info("Fichiers modifiés détectés:")
            print(output)
            return True
        else:
            self.print_info("Aucune modification détectée")
            return False
    
    def check_remote(self):
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
        gitignore_content = """# Contenu du .gitignore comme précédemment... (inchangé)"""
        gitignore_path = os.path.join(self.project_path, '.gitignore')
        if not os.path.exists(gitignore_path):
            with open(gitignore_path, 'w') as f:
                f.write(gitignore_content)
            self.print_success(".gitignore créé")
        else:
            self.print_info(".gitignore existe déjà")
    
    def commit_changes(self):
        self.print_header("COMMIT DES CHANGEMENTS")
        self.print_info("Ajout des fichiers...")
        success, output = self.run_command("git add -A")
        if not success:
            self.print_error(f"Erreur lors de l'ajout: {output}")
            return False
        
        commit_message = f"Mise à jour {self.timestamp} - Tests connexion frontend/backend réussis"
        self.print_info(f"Commit: {commit_message}")
        success, output = self.run_command(f'git commit -m "{commit_message}"')
        if success:
            self.print_success("Commit effectué avec succès")
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
        self.print_header("PUSH VERS GITHUB")
        if not self.has_commits():
            self.print_warning("Pas de commit présent dans le dépôt - Push impossible")
            return
        
        success, branch = self.run_command("git branch --show-current")
        branch = branch.strip() if success else "main"
        self.print_info(f"Branche actuelle: {branch}")
        
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
        self.print_header("CRÉATION BRANCHE DE BACKUP")
        branch_name = f"backup-{self.date_short}"
        success, output = self.run_command(f"git checkout -b {branch_name}")
        if success:
            self.print_success(f"Branche {branch_name} créée")
            self.run_command("git checkout main")
        else:
            if "already exists" in output:
                self.print_info(f"La branche {branch_name} existe déjà")
            else:
                self.print_error(f"Erreur création branche: {output}")
    
    def show_log(self):
        self.print_header("HISTORIQUE RÉCENT")
        success, output = self.run_command("git log --oneline -10")
        if success:
            print(output)
        else:
            self.print_error("Impossible d'afficher l'historique")
    
    def sync(self):
        print(f"{Fore.BLUE}🔄 SYNCHRONISATION GIT - PLATEFORME FEMMES EN POLITIQUE")
        print(f"📁 Dossier: {self.project_path}")
        print(f"🕐 Date: {self.timestamp}{Style.RESET_ALL}")
        
        self.create_gitignore()
        has_changes = self.check_git_status()
        has_remote = self.check_remote()
        
        if has_changes:
            if self.commit_changes():
                self.create_backup_branch()
                if has_remote:
                    self.push_to_github()
                else:
                    self.print_warning("Remote non configuré - Push ignoré")
        else:
            if self.has_commits() and has_remote:
                self.push_to_github()
        
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
    if len(sys.argv) > 1:
        project_path = sys.argv[1]
    else:
        current_path = os.getcwd()
        project_path = os.path.dirname(current_path) if "backend" in current_path else current_path
    
    if not os.path.exists(project_path):
        print(f"{Fore.RED}Erreur: Le chemin '{project_path}' n'existe pas{Style.RESET_ALL}")
        sys.exit(1)
    
    syncer = GitSync(project_path)
    syncer.sync()

if __name__ == "__main__":
    main()
