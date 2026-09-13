import { list, put } from "@vercel/blob";

const PATH = "bookings/aaglamstudio.json";

async function readBookings() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return [];

  const { blobs } = await list({ prefix: "bookings/", token });
  const file = blobs.find((b) => b.pathname === PATH);
  if (!file) return [];

  const res = await fetch(file.url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data?.bookings) ? data.bookings : [];
}

async function writeBookings(bookings) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN missing");

  await put(
    PATH,
    JSON.stringify({ bookings, updatedAt: new Date().toISOString() }),
    {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      token,
    }
  );
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return json(res, 204, {});
  }

  try {
    if (req.method === "GET") {
      const bookings = await readBookings();
      bookings.sort((a, b) => {
        const da = `${a.date || ""} ${a.hour || a.time || ""}`;
        const dbv = `${b.date || ""} ${b.hour || b.time || ""}`;
        return dbv.localeCompare(da);
      });
      return json(res, 200, { bookings });
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      if (!body?.date || !body?.service) {
        return json(res, 400, { error: "Faltan datos de la reserva" });
      }
      const bookings = await readBookings();
      const entry = {
        id: body.id || `local_${Date.now()}`,
        businessId: "aaglamstudio",
        amount: Number(body.amount) || 5000,
        date: body.date,
        service: body.service,
        hour: body.hour || body.time || "",
        time: body.hour || body.time || "",
        duration: body.duration || 1,
        customerName: body.customerName || body.name || "",
        name: body.name || body.customerName || "",
        phone: body.phone || "",
        hasProof: Boolean(body.hasProof),
        createdAt: body.createdAt || new Date().toISOString(),
        payment: body.payment || { status: "pending", provider: "sinpe" },
        pending_confirmation: body.pending_confirmation !== false,
      };
      // Avoid exact duplicates (same phone+date+hour+service)
      const dup = bookings.find(
        (b) =>
          b.date === entry.date &&
          (b.hour || b.time) === entry.hour &&
          b.phone === entry.phone &&
          b.service === entry.service
      );
      if (!dup) bookings.unshift(entry);
      await writeBookings(bookings);
      return json(res, 201, { booking: entry });
    }

    if (req.method === "PATCH") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      if (!body?.id) return json(res, 400, { error: "Falta id" });
      const bookings = await readBookings();
      const idx = bookings.findIndex((b) => b.id === body.id);
      if (idx < 0) return json(res, 404, { error: "No encontrada" });
      bookings[idx] = {
        ...bookings[idx],
        ...body,
        payment: { ...bookings[idx].payment, ...(body.payment || {}) },
      };
      await writeBookings(bookings);
      return json(res, 200, { booking: bookings[idx] });
    }

    return json(res, 405, { error: "Método no permitido" });
  } catch (err) {
    console.error(err);
    return json(res, 500, { error: err?.message || "Error del servidor" });
  }
}
