import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const en = {
  tagline: 'Found a city on the shores of the Republic.',
  auth: {
    login: 'Log in', register: 'Create account', username: 'Username', email: 'Email', password: 'Password',
    identifier: 'Username or email', toRegister: 'No account yet? Create one', toLogin: 'Already have an account? Log in',
    usernameHint: '3–20 letters, digits, _ or -', passwordHint: 'At least 8 characters', logout: 'Log out',
  },
  join: { title: 'A new round is open', body: 'World {{slug}} · speed ×{{speed}} · ends in {{left}}', action: 'Found my city' },
  top: { roundEnds: 'Round ends in', city: 'City', map: 'Map' },
  res: { timber: 'Timber', stone: 'Stone', iron: 'Iron', population: 'Population', storage: 'Storage', perHour: '/h' },
  city: {
    buildings: 'Buildings', queue: 'Construction', queueEmpty: 'Nothing under construction.', slots: '{{used}} / {{max}} slots',
    level: 'Level {{n}}', toLevel: 'to level {{n}}', build: 'Build', cancel: 'Cancel', waiting: 'Queued', maxed: 'Maximum level',
    points: '{{n}} Gloria',
  },
  site: {
    free: 'Free site', freeBody: 'Nobody has settled here yet.', native: 'Native settlement',
    nativeBody: 'Tribute and raids arrive with the armies update.', owner: 'Owner', mine: 'Your city', open: 'Open city', neutral: 'Abandoned',
  },
  building: {
    forum: 'Speeds up all construction', lignarium: 'Produces timber', lapicidina: 'Produces stone', ferraria: 'Produces iron',
    fundus: 'Raises the population limit', horreum: 'Raises storage capacity', castra: 'Trains soldiers', murus: 'Protects the city', portus: 'Builds ships',
  },
  error: {
    unknown_building: 'Unknown building.', not_available: 'Not available yet.', queue_full: 'The construction queue is full.',
    max_level: 'Already at maximum level.', prerequisite: 'A required building is missing.', resources: 'Not enough resources.',
    population: 'Not enough free population. Upgrade the Fundus.', order_has_dependents: 'A later order depends on this one.',
    invalid_credentials: 'Wrong username or password.', username_taken: 'That username is taken.', email_taken: 'That email is already registered.',
    invalid_input: 'Please check the fields.', rate_limited: 'Too many attempts. Try again in a minute.', round_over: 'The round is over.',
    no_world: 'No world is open right now.', world_closed: 'This world is closed.', world_full: 'This world is full.',
    internal: 'Something went wrong. Please try again.', unauthenticated: 'Please log in again.',
  },
};

const fr: typeof en = {
  tagline: 'Fondez une cité sur les rivages de la République.',
  auth: {
    login: 'Se connecter', register: 'Créer un compte', username: 'Nom d’utilisateur', email: 'E-mail', password: 'Mot de passe',
    identifier: 'Nom d’utilisateur ou e-mail', toRegister: 'Pas encore de compte ? Créez-en un', toLogin: 'Déjà un compte ? Connectez-vous',
    usernameHint: '3 à 20 lettres, chiffres, _ ou -', passwordHint: 'Au moins 8 caractères', logout: 'Se déconnecter',
  },
  join: { title: 'Une nouvelle manche est ouverte', body: 'Monde {{slug}} · vitesse ×{{speed}} · fin dans {{left}}', action: 'Fonder ma cité' },
  top: { roundEnds: 'Fin de la manche dans', city: 'Cité', map: 'Carte' },
  res: { timber: 'Bois', stone: 'Pierre', iron: 'Fer', population: 'Population', storage: 'Stockage', perHour: '/h' },
  city: {
    buildings: 'Bâtiments', queue: 'Construction', queueEmpty: 'Aucune construction en cours.', slots: '{{used}} / {{max}} emplacements',
    level: 'Niveau {{n}}', toLevel: 'vers le niveau {{n}}', build: 'Construire', cancel: 'Annuler', waiting: 'En attente', maxed: 'Niveau maximum',
    points: '{{n}} Gloria',
  },
  site: {
    free: 'Site libre', freeBody: 'Personne ne s’est encore installé ici.', native: 'Village indigène',
    nativeBody: 'Tributs et raids arriveront avec la mise à jour des armées.', owner: 'Propriétaire', mine: 'Votre cité', open: 'Ouvrir la cité', neutral: 'Abandonnée',
  },
  building: {
    forum: 'Accélère toutes les constructions', lignarium: 'Produit du bois', lapicidina: 'Produit de la pierre', ferraria: 'Produit du fer',
    fundus: 'Augmente la limite de population', horreum: 'Augmente la capacité de stockage', castra: 'Forme des soldats', murus: 'Protège la cité', portus: 'Construit des navires',
  },
  error: {
    unknown_building: 'Bâtiment inconnu.', not_available: 'Pas encore disponible.', queue_full: 'La file de construction est pleine.',
    max_level: 'Niveau maximum déjà atteint.', prerequisite: 'Un bâtiment requis manque.', resources: 'Ressources insuffisantes.',
    population: 'Population libre insuffisante. Améliorez le Fundus.', order_has_dependents: 'Un ordre suivant dépend de celui-ci.',
    invalid_credentials: 'Identifiant ou mot de passe incorrect.', username_taken: 'Ce nom d’utilisateur est pris.', email_taken: 'Cet e-mail est déjà enregistré.',
    invalid_input: 'Vérifiez les champs.', rate_limited: 'Trop de tentatives. Réessayez dans une minute.', round_over: 'La manche est terminée.',
    no_world: 'Aucun monde n’est ouvert pour le moment.', world_closed: 'Ce monde est fermé.', world_full: 'Ce monde est plein.',
    internal: 'Une erreur est survenue. Réessayez.', unauthenticated: 'Veuillez vous reconnecter.',
  },
};

const stored = localStorage.getItem('rv_lang');
const initial = stored === 'fr' || stored === 'en' ? stored : navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en';

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, fr: { translation: fr } },
  lng: initial,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export function setLanguage(lng: 'en' | 'fr'): void {
  localStorage.setItem('rv_lang', lng);
  document.documentElement.lang = lng;
  void i18n.changeLanguage(lng);
}
document.documentElement.lang = initial;

export default i18n;
