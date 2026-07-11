# Premiers pas

1. **Téléchargez** [l'application](https://github.com/datannur/datannur/releases/latest/download/datannur-app-latest.zip)
2. **Ouvrez** `index.html` dans votre navigateur
3. **Explorez** le catalogue de démonstration pour voir comment il fonctionne
4. **Remplacez** les métadonnées de démonstration dans `/data/db/` par les vôtres (voir ci-dessous)

L'interface de l'application est multilingue. L'anglais est la langue de repli par défaut, le français, l'allemand et l'italien sont pris en charge, et le réglage `auto` suit la langue du navigateur lorsque c'est possible. Les utilisateurs peuvent changer de langue depuis le pied de page de l'application ou depuis la page Options ; l'espagnol est prévu prochainement.

Pour une expérience plus intégrée (raccourci dans le menu Démarrer / le Dock, serveur local démarrant automatiquement à l'ouverture de session), consultez [Installation sur votre ordinateur](/fr/install).

## Remplacer les métadonnées de démonstration

Vous pouvez alimenter votre propre catalogue de plusieurs manières :

- **Modifier les fichiers sources** — maintenez vos métadonnées dans `/data/db-source/` sous forme de fichiers JSON, de documents Markdown et d'aperçus CSV, puis exécutez `python3 datannur.py build-db-source` pour reconstruire `/data/db/`. Voir [Gérer vos données](/fr/data).
- **Tout autre flux de travail** — tant que le résultat respecte les schémas définis dans `/app/schemas/`, vous pouvez générer `/data/db/` avec l'outil ou le script de votre choix.
