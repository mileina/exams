🟦 SPRINT 1 — Analyse & Préparation de l’hébergement

🎯 Objectif : Choisir la solution Cloud et préparer l’environnement

Tâches

Analyser les besoins de l’application (frontend, backend, gateway, microservices, MongoDB).

Comparer les hébergeurs : AWS, OVHcloud, GCP, DigitalOcean, Render, Railway.

Choisir un hébergeur en fonction de :

performances

sécurité

flexibilité

coût

compatibilité Docker & CI/CD

Rédiger le document justificatif du choix (E21).

Livrables

Document : Choix de l’hébergement Cloud

Architecture cible (schéma simple)

🟦 SPRINT 2 — Mise en place des environnements (Préprod + Prod)

🎯 Objectif : Préparer le déploiement sécurisé

Tâches

Créer 2 environnements :

préproduction

production

Mettre en place les serveurs / containers

Configurer les firewalls

Ajouter un fichier .env sécurisé pour chaque service (frontend, backend, gateway, microservices)

Sécuriser MongoDB (pas d’accès public)

Installation de Docker / Docker Compose pour la préproduction

Livrables

Environnements fonctionnels

docker-compose.yml


🟦 SPRINT 3 — DNS + Noms de domaine + Certificats SSL

🎯 Objectif : Rendre l’application accessible en HTTPS

Tâches

Acheter un nom de domaine

Créer les sous-domaines nécessaires :

Usage	Sous-domaine
Front EXAM	exam.meetly.ovh
API EXAM	api-exam.meetly.ovh
Gateway EXAM	gateway-exam.meetly.ovh
Préprod front	preprod-exam.meetly.ovh
Préprod API	preprod-api-exam.meetly.ovh

Configurer les DNS

Installer Let’s Encrypt ou Certbot

Configurer HTTPS sur les deux environnements (préprod + prod)

Livrables

Tableau récapitulatif DNS

Preuves SSL (captures d’écran)