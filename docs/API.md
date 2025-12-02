# Documentation API (générée depuis le code)

Sources : `backend/routes/*.js`, `microservices/notifications/index.js`, `microservices/stock-management/index.js`, `gateway/server.js`.

## Auth
- `POST /api/auth/login` — Body `{ username, password }` → `{ token, role, username }`.
- `POST /api/auth/register` — Body `{ username, email, password }` → `201 Created` si succès.

## Produits
- `GET /api/products` — Liste des produits.
- `PUT /api/products/:productId/stock` — Auth + admin. Body `{ stock }` (>=0). Met à jour le stock.

## Commandes
- `GET /api/orders` — Auth + admin. Récupère toutes les commandes.
- `POST /api/orders` — Auth. Body `{ items: [{productId, quantity, price}], shippingAddress, paymentMethod, shippingMethod }`. Crée la commande et déclenche notification.
- `DELETE /api/orders/:id` — Auth + admin. Suppression d’une commande.
- `PUT /api/orders/:id/validate` — Auth + admin. Valide une commande.
- `PUT /api/orders/:orderId/status` — Auth + admin. Mise à jour du statut.

## Notifications
- `POST /notify` (microservice) — Body `{ to, subject, text }`. Envoi email via SMTP (Gmail).

## Stock management
- `POST /update-stock` (microservice) — Body `{ productId, quantity }`. Met à jour le stock (log uniquement).

## Gateway
- Expose `/notify` et `/update-stock` en proxy sur le port défini par `GATEWAY_PORT`.

## Sécurité / Auth
- Authentification via JWT (header `Authorization: Bearer <token>`), secret `JWT_SECRET`.
- Rôle admin requis sur les routes marquées (middleware `isAdmin`).

## CORS
- Origines autorisées configurables via `ALLOWED_ORIGINS` (liste séparée par virgules). Défaut dev : `http://localhost:3000`.
