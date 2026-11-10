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
    nativeBody: 'Pays tribute to players on this landmass. Can be raided.', owner: 'Owner', mine: 'Your city', open: 'Open city', neutral: 'Abandoned',
  },
  tab: { city: 'City', army: 'Army', reports: 'Reports' },
  unit: {
    hastatus: 'Hastatus', triarius: 'Triarius', sagittarius: 'Sagittarius', eques: 'Eques', oneraria: 'Navis oneraria',
    hastatusInfo: 'Balanced line infantry', triariusInfo: 'Spearman, strong against cavalry', sagittariusInfo: 'Archer, strong against archers',
    equesInfo: 'Fast raider with a large carry', onerariaInfo: 'Transport ship for 25 population', needs: 'Needs {{building}} {{level}}',
  },
  army: {
    home: 'Troops in the city', none: 'No troops here.', support: 'Support from allies', away: 'Your troops elsewhere', sendHome: 'Send home', recallHome: 'Call back',
    recruit: 'Recruit', slotsPerBuilding: 'up to {{max}} batches per building', training: 'Training', trainingEmpty: 'Nobody in training.', count: 'How many', max: 'Max',
    movements: 'On the move', noMovements: 'No troops on the move.', incoming: 'Incoming', recall: 'Recall',
    attack: 'Attack', support_: 'Support', raid: 'Raid', return: 'Returning', arrives: 'arrives in',
    tribute: 'Native tribute', tributeBody: '{{n}} of each resource waiting. Standing {{standing}} / 100.', collect: 'Collect',
    nightWatch: 'Night watch', nightWatchBody: 'Pick the 8 hours when you sleep. Your cities defend at double strength then. This cannot be changed during the round.',
    nightWatchSet: 'Your cities defend at double strength from {{from}} to {{to}}.', nightWatchStart: 'Starts at', save: 'Set',
    protected: 'Beginner protection: nobody can attack you for {{left}}. It ends if you attack another player.',
    incomingAlert: '{{n}} attack(s) incoming, first in {{left}}',
  },
  send: {
    title: 'Send troops', travel: 'Travel time', bySea: 'by sea', byLand: 'by land', go: 'Send', close: 'Cancel',
    attackTitle: 'Attack {{name}}', supportTitle: 'Support {{name}}', raidTitle: 'Raid the native settlement', noTroops: 'You have no troops in the city.',
  },
  report: {
    empty: 'No reports yet.', attack: 'Attack on {{name}}', defense: 'Defence of {{name}}', raid: 'Raid on natives', won: 'Victory', lost: 'Defeat',
    attackers: 'Attackers', defenders: 'Defenders', sent: 'Sent', losses: 'Lost', loot: 'Loot', none: 'none',
    details: 'Attack {{attack}} against defence {{defense}} · luck {{luck}}%', nightWatch: 'night watch active', wall: 'Murus {{n}}',
  },
  sim: { title: 'Battle simulator', run: 'Result with luck from −10% to +10%', attackerLoses: 'Attacker loses', defenderLoses: 'Defender loses', wins: 'Attacker wins', fails: 'Attack fails', wall: 'Murus level', nightWatch: 'Night watch' },
  building: {
    forum: 'Speeds up all construction', lignarium: 'Produces timber', lapicidina: 'Produces stone', ferraria: 'Produces iron',
    fundus: 'Raises the population limit', horreum: 'Raises storage capacity', castra: 'Trains soldiers', murus: 'Protects the city', portus: 'Builds ships',
  },
  error: {
    unknown_unit: 'Unknown unit.', not_enough_units: 'You do not have that many troops in the city.', no_units: 'Choose some troops.',
    no_combat_units: 'This mission needs fighting troops.', ships_not_needed: 'Ships are not needed on the same landmass.',
    not_enough_ships: 'Not enough transport ships to cross the sea (25 population each).', target_protected: 'This player is under beginner protection.',
    own_target: 'You cannot attack your own city.', invalid_target: 'That target cannot be used for this mission.', recall_too_late: 'Too late to recall.',
    night_watch_set: 'The night watch is already set for this round.', movement_not_found: 'That movement no longer exists.',
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
    nativeBody: 'Verse un tribut aux joueurs de cette terre. Peut être pillé.', owner: 'Propriétaire', mine: 'Votre cité', open: 'Ouvrir la cité', neutral: 'Abandonnée',
  },
  tab: { city: 'Cité', army: 'Armée', reports: 'Rapports' },
  unit: {
    hastatus: 'Hastatus', triarius: 'Triarius', sagittarius: 'Sagittarius', eques: 'Eques', oneraria: 'Navis oneraria',
    hastatusInfo: 'Infanterie de ligne polyvalente', triariusInfo: 'Lancier, fort contre la cavalerie', sagittariusInfo: 'Archer, fort contre les archers',
    equesInfo: 'Pillard rapide à grande capacité', onerariaInfo: 'Navire de transport pour 25 de population', needs: 'Nécessite {{building}} {{level}}',
  },
  army: {
    home: 'Troupes dans la cité', none: 'Aucune troupe ici.', support: 'Renforts alliés', away: 'Vos troupes ailleurs', sendHome: 'Renvoyer', recallHome: 'Rappeler',
    recruit: 'Recruter', slotsPerBuilding: 'jusqu’à {{max}} lots par bâtiment', training: 'Entraînement', trainingEmpty: 'Personne à l’entraînement.', count: 'Combien', max: 'Max',
    movements: 'En déplacement', noMovements: 'Aucune troupe en déplacement.', incoming: 'En approche', recall: 'Rappeler',
    attack: 'Attaque', support_: 'Renfort', raid: 'Raid', return: 'Retour', arrives: 'arrive dans',
    tribute: 'Tribut indigène', tributeBody: '{{n}} de chaque ressource en attente. Relations {{standing}} / 100.', collect: 'Collecter',
    nightWatch: 'Garde de nuit', nightWatchBody: 'Choisissez les 8 heures où vous dormez. Vos cités se défendent alors à force double. Ce choix est définitif pour la manche.',
    nightWatchSet: 'Vos cités se défendent à force double de {{from}} à {{to}}.', nightWatchStart: 'Début', save: 'Valider',
    protected: 'Protection du débutant : personne ne peut vous attaquer pendant {{left}}. Elle prend fin si vous attaquez un autre joueur.',
    incomingAlert: '{{n}} attaque(s) en approche, la première dans {{left}}',
  },
  send: {
    title: 'Envoyer des troupes', travel: 'Temps de trajet', bySea: 'par mer', byLand: 'par terre', go: 'Envoyer', close: 'Annuler',
    attackTitle: 'Attaquer {{name}}', supportTitle: 'Renforcer {{name}}', raidTitle: 'Piller le village indigène', noTroops: 'Vous n’avez aucune troupe dans la cité.',
  },
  report: {
    empty: 'Aucun rapport.', attack: 'Attaque de {{name}}', defense: 'Défense de {{name}}', raid: 'Raid sur les indigènes', won: 'Victoire', lost: 'Défaite',
    attackers: 'Attaquants', defenders: 'Défenseurs', sent: 'Envoyés', losses: 'Perdus', loot: 'Butin', none: 'aucun',
    details: 'Attaque {{attack}} contre défense {{defense}} · chance {{luck}} %', nightWatch: 'garde de nuit active', wall: 'Murus {{n}}',
  },
  sim: { title: 'Simulateur de bataille', run: 'Résultat avec une chance de −10 % à +10 %', attackerLoses: 'Pertes de l’attaquant', defenderLoses: 'Pertes du défenseur', wins: 'L’attaquant gagne', fails: 'L’attaque échoue', wall: 'Niveau du Murus', nightWatch: 'Garde de nuit' },
  building: {
    forum: 'Accélère toutes les constructions', lignarium: 'Produit du bois', lapicidina: 'Produit de la pierre', ferraria: 'Produit du fer',
    fundus: 'Augmente la limite de population', horreum: 'Augmente la capacité de stockage', castra: 'Forme des soldats', murus: 'Protège la cité', portus: 'Construit des navires',
  },
  error: {
    unknown_unit: 'Unité inconnue.', not_enough_units: 'Vous n’avez pas autant de troupes dans la cité.', no_units: 'Choisissez des troupes.',
    no_combat_units: 'Cette mission exige des troupes combattantes.', ships_not_needed: 'Les navires sont inutiles sur la même terre.',
    not_enough_ships: 'Pas assez de navires de transport pour traverser la mer (25 de population chacun).', target_protected: 'Ce joueur est sous protection du débutant.',
    own_target: 'Vous ne pouvez pas attaquer votre propre cité.', invalid_target: 'Cette cible ne convient pas à cette mission.', recall_too_late: 'Trop tard pour rappeler.',
    night_watch_set: 'La garde de nuit est déjà fixée pour cette manche.', movement_not_found: 'Ce déplacement n’existe plus.',
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
