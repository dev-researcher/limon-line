# A&A Glam Studio

Sitio web del salón **A&A Glam Studio** (Limón, Costa Rica) con reservas en línea y pago por SINPE móvil.

## Stack

- React + Vite
- Tailwind CSS
- Firebase (Auth, Firestore, Storage)

## Desarrollo

```bash
npm install
npm run dev
```

## Producción

```bash
npm run build
```

Despliega la carpeta `dist` (Vercel listo con `vercel.json`).

## Firebase (necesario para reservas)

El sitio público muestra la info del salón sin base de datos. **Reservas, comprobantes SINPE y reportes** usan el proyecto Firebase `sistema-reservas-1c8ef`.

### Desplegar reglas

En la [consola de Firebase](https://console.firebase.google.com/) del proyecto:

1. **Firestore → Reglas**: pega el contenido de `firestore.rules` → Publicar
2. **Storage → Reglas**: pega el contenido de `storage.rules` → Publicar

O con CLI:

```bash
npm i -g firebase-tools
firebase login
firebase use sistema-reservas-1c8ef
firebase deploy --only firestore:rules,storage
```

### Auth admin

Crea un usuario en **Authentication → Email/password** para entrar a `/login` y usar `/admin` + `/admin/reportes`.

### Colecciones

| Colección | Uso |
|-----------|-----|
| `reservations_db` | Reservas y pagos SINPE |
| `monthly_reports` | Snapshots por mes (consultables en cualquier momento) |
| `business_db` | Datos legacy del salón (el sitio usa `src/data/salon.js`) |

## Rutas

- `/` — Sitio del salón
- `/reservar` — Reserva con horarios, SINPE y comprobante
- `/login` — Acceso administración
- `/admin` — Panel de reservas (protegido)
- `/admin/reportes` — Reportes mensuales guardados (protegido)
