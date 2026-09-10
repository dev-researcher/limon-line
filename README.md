# A&A Glam Studio

Sitio web del salón **A&A Glam Studio** (La Guaria, Costa Rica) con reservas en línea y pago por SINPE móvil.

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

### ⚠️ Obligatorio: publicar reglas

Si **Confirmar reserva** falla siempre, las reglas de Firebase no están publicadas.

1. Abre [Firestore → Reglas](https://console.firebase.google.com/project/sistema-reservas-1c8ef/firestore/rules)
2. Reemplaza todo con el contenido de `firestore.rules` → **Publicar**
3. Abre [Storage → Reglas](https://console.firebase.google.com/project/sistema-reservas-1c8ef/storage/rules)
4. Reemplaza todo con el contenido de `storage.rules` → **Publicar**

Después de publicar, el cliente puede completar la cita **con o sin** imagen de comprobante. WhatsApp solo se ofrece si el servidor falla de verdad.
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
