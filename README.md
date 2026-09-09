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

## Rutas

- `/` — Sitio del salón
- `/reservar` — Reserva con horarios, SINPE y comprobante
- `/login` — Acceso administración
- `/admin` — Panel de reservas (protegido)
