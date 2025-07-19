@echo off
REM Script de synchronisation Git pour Windows
REM Sauvegarde automatique sur GitHub

echo =====================================
echo SYNCHRONISATION GIT
echo =====================================
echo.

REM Obtenir la date et l'heure
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~0,4%"
set "MM=%dt:~4,2%"
set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%"
set "Min=%dt:~10,2%"
set "timestamp=%YY%-%MM%-%DD% %HH%:%Min%"

echo Date: %timestamp%
echo.

REM Vérifier si on est dans un repo Git
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Ce n'est pas un depot Git!
    echo Initialisation d'un nouveau depot...
    git init
)

REM Afficher le statut
echo Verification du statut...
git status --short

REM Ajouter tous les fichiers
echo.
echo Ajout des fichiers...
git add -A

REM Faire le commit
echo.
echo Creation du commit...
git commit -m "Mise a jour %timestamp% - Tests connexion frontend/backend reussis"

REM Vérifier si un remote existe
git remote -v | find "origin" >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ATTENTION] Aucun remote GitHub configure!
    echo Pour ajouter un remote:
    echo git remote add origin https://github.com/VOTRE_USERNAME/plateforme_femmes.git
    goto :showlog
)

REM Push vers GitHub
echo.
echo Push vers GitHub...
git push -u origin main
if errorlevel 1 (
    echo Tentative sur la branche master...
    git push -u origin master
)

:showlog
REM Afficher les derniers commits
echo.
echo =====================================
echo HISTORIQUE RECENT
echo =====================================
git log --oneline -5

echo.
echo =====================================
echo SYNCHRONISATION TERMINEE!
echo =====================================
pause