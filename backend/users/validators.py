"""
Validateurs personnalisés pour renforcer la sécurité des mots de passe
Exige une combinaison de caractères pour résister aux attaques
"""
import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class ComplexPasswordValidator:
    """
    Validateur qui exige des mots de passe complexes avec:
    - Au moins une lettre majuscule
    - Au moins une lettre minuscule
    - Au moins un chiffre
    - Au moins un caractère spécial
    - Pas de répétitions excessives
    - Pas de séquences évidentes (123, abc, etc.)
    """
    
    def validate(self, password, user=None):
        # Vérification de la présence des différents types de caractères
        if not re.search(r'[A-Z]', password):
            raise ValidationError(
                _("Le mot de passe doit contenir au moins une lettre majuscule."),
                code='password_no_upper',
            )
        
        if not re.search(r'[a-z]', password):
            raise ValidationError(
                _("Le mot de passe doit contenir au moins une lettre minuscule."),
                code='password_no_lower',
            )
        
        if not re.search(r'\d', password):
            raise ValidationError(
                _("Le mot de passe doit contenir au moins un chiffre."),
                code='password_no_digit',
            )
        
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]', password):
            raise ValidationError(
                _("Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*()_+-=[]{}|,.<>?)."),
                code='password_no_special',
            )
        
        # Vérification des répétitions excessives (aaa, 111, etc.)
        if re.search(r'(.)\1{2,}', password):
            raise ValidationError(
                _("Le mot de passe ne doit pas contenir plus de 2 caractères identiques consécutifs."),
                code='password_repetition',
            )
        
        # Vérification des séquences évidentes
        sequences = [
            'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi', 'hij', 'ijk',
            'jkl', 'klm', 'lmn', 'mno', 'nop', 'opq', 'pqr', 'qrs', 'rst',
            'stu', 'tuv', 'uvw', 'vwx', 'wxy', 'xyz',
            '123', '234', '345', '456', '567', '678', '789',
            'qwe', 'wer', 'ert', 'rty', 'tyu', 'yui', 'uio', 'iop',
            'asd', 'sdf', 'dfg', 'fgh', 'ghj', 'hjk', 'jkl',
            'zxc', 'xcv', 'cvb', 'vbn', 'bnm'
        ]
        
        password_lower = password.lower()
        for seq in sequences:
            if seq in password_lower or seq[::-1] in password_lower:
                raise ValidationError(
                    _("Le mot de passe ne doit pas contenir de séquences évidentes (abc, 123, etc.)."),
                    code='password_sequence',
                )
        
        # Vérification des mots courants (dictionnaire de base)
        common_passwords = [
            'password', 'motdepasse', 'gabon', 'libreville', 'femmes',
            'politique', 'admin', 'user', 'test', 'demo'
        ]
        
        for common in common_passwords:
            if common in password_lower:
                raise ValidationError(
                    _("Le mot de passe ne doit pas contenir de mots courants."),
                    code='password_common',
                )
    
    def get_help_text(self):
        return _(
            "Votre mot de passe doit contenir au moins 12 caractères, "
            "incluant des majuscules, minuscules, chiffres et caractères spéciaux, "
            "sans séquences évidentes ni répétitions excessives."
        )