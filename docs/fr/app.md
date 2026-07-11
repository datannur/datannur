# Gérer l'application

## Structure du paquet

Cette page décrit le **paquet distribué** que vous téléchargez, copiez, mettez à jour ou déployez. Les sources de développement se trouvent dans le dépôt Git ; les utilisateurs finaux travaillent normalement uniquement à l'intérieur du paquet distribué.

Dans le paquet, le dossier `app/` contient les fichiers d'exécution appartenant à l'application :

```
├── assets/                     # Static assets (JS, images, etc.)
├── data-template/              # Templates to copy into data/
├── scripts/                    # Python and Windows scripts
├── schemas/                    # JSON schemas
├── api/                        # API adapters
├── CHANGELOG.md                # Application changelog
├── LICENSE                     # License information
├── manifest.json               # PWA configuration
├── index.html                  # Application entry point
├── README.md                   # Application documentation
```

À la racine du paquet, à côté de `app/` :

```
├── app/                        # Application files, not user-edited
├── data/                       # ⚠️ YOUR DATA - Only folder to modify
├── datannur.py                 # Command launcher for app scripts
├── index.html                  # Root browser entry point for clean URLs
├── start.bat                   # Windows launcher
├── .htaccess                   # Apache configuration (clean URLs, cache)
```

> **⚠️ Important :** seul le dossier `/data/` doit être modifié par l'utilisateur (ajout/modification de vos métadonnées). Tous les autres fichiers constituent l'application et ne doivent pas être modifiés, sauf cas exceptionnel ou pour une configuration avancée.

Lorsque le paquet est servi via HTTP, datannur utilise des URL propres telles que `/dataset/accident_route`. Lorsque `index.html` est ouvert directement comme fichier local, datannur utilise des URL à hash telles que `#/dataset/accident_route`, car aucun serveur web n'est disponible pour réécrire les chemins propres.

## Mettre à jour l'application

### Mise à jour automatique (recommandée)

Si Python est installé, vous pouvez mettre à jour automatiquement :

```bash
python3 datannur.py update
```

> **💡 Remarque :** le script de mise à jour n'utilise que la bibliothèque standard de Python — aucune dépendance supplémentaire requise ! Exécutez-le directement avec n'importe quelle installation de Python 3.8+.

**Options de configuration** dans `data/update_app.json` :

- **targetVersion** : choisissez `"latest"` (stable), `"pre-release"` (la plus récente) ou une version spécifique `"x.x.x"`
- **proxyUrl** : proxy optionnel pour le téléchargement des fichiers
- **include** : liste des fichiers/dossiers à mettre à jour

### Mise à jour manuelle

Si vous n'avez pas Python, vous pouvez :

1. Télécharger la dernière version depuis [Latest release](https://github.com/datannur/datannur/releases/latest/download/datannur-app-latest.zip)
2. Remplacer les anciens fichiers par les nouveaux
3. Conserver votre dossier `/data/` pour préserver vos données
