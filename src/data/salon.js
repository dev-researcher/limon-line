import gallery01 from "../assets/gallery/gallery-01-styling.jpg";
import gallery02 from "../assets/gallery/gallery-02-treatment.jpg";
import gallery03 from "../assets/gallery/gallery-03-cut.jpg";
import gallery05 from "../assets/gallery/gallery-05-shine.jpg";
import gallery06 from "../assets/gallery/gallery-06-lashes.jpg";

import imgCorte from "../assets/services/service-corte.jpg";
import imgLavado from "../assets/services/service-lavado-planchado.jpg";
import imgAmpolla from "../assets/services/service-ampolla.jpg";
import imgBotox from "../assets/services/service-botox.jpg";
import imgCelulas from "../assets/services/service-celulas.jpg";
import imgCoctel from "../assets/services/service-coctel.jpg";
import imgDetox from "../assets/services/service-detox.jpg";
import imgBrillo from "../assets/services/service-brillo.jpg";
import imgLiso from "../assets/services/service-liso.jpg";
import imgPestanas from "../assets/services/service-pestanas.jpg";

const LOGO =
  "https://i.ibb.co/8LSsdFsg/491495349-17927106954064316-9015866029037206504-n.jpg";

export const GALLERY = [
  { src: gallery01, alt: "Peinado y styling profesional", caption: "Styling" },
  { src: gallery02, alt: "Tratamiento capilar nutritivo", caption: "Tratamientos" },
  { src: gallery03, alt: "Corte de cabello de precisión", caption: "Cortes" },
  { src: gallery05, alt: "Acabado con brillo y suavidad", caption: "Acabados" },
  { src: gallery06, alt: "Lifting de pestañas", caption: "Pestañas" },
  { src: imgLavado, alt: "Lavado y planchado profesional", caption: "Planchado" },
];

export const SALON = {
  id: "aaglamstudio",
  name: "A&A Glam Studio",
  tagline: "Renueva tu look, realza tu esencia.",
  description:
    "A&A Glam Studio es mucho más que un salón de belleza: es un espacio donde el estilo, el cuidado personal y la atención de calidad se encuentran para transformar tu imagen. Especializados en cortes de cabello modernos, tratamientos capilares personalizados y asesoría de estilo, trabajamos con pasión para resaltar lo mejor de ti.",
  direction: "Valle la Estrella, La Guaria, Costa Rica",
  schedule: "Lunes a domingo · 9:00 a. m. – 7:00 p. m.",
  sinpePhone: "+506 8348 0179",
  sinpePhoneRaw: "50683480179",
  sinpeName: "Allison Fabiola Portuguez Mora",
  whatsapp: "+506 83480179",
  whatsappRaw: "50683480179",
  instagram: "https://www.instagram.com/aa_glamstudio/",
  image: LOGO,
  heroImage: LOGO,
  deposit: 5000,
  categories: [
    "Belleza",
    "Tratamientos de cabello",
    "Coloración",
    "Maquillaje",
    "Extensiones",
    "Peinados para eventos",
  ],
  operationSchedule: {
    monday: { open: "09:00", close: "19:00" },
    tuesday: { open: "09:00", close: "19:00" },
    wednesday: { open: "09:00", close: "19:00" },
    thursday: { open: "09:00", close: "19:00" },
    friday: { open: "09:00", close: "19:00" },
    saturday: { open: "09:00", close: "19:00" },
    sunday: { open: "09:00", close: "19:00" },
  },
  services: [
    {
      name: "Corte de Cabello",
      description:
        "Corte personalizado según estilo, tipo de rostro y textura del cabello.",
      duration: 1,
      image: imgCorte,
    },
    {
      name: "Lavado y Planchado",
      description:
        "Lavado hidratante seguido de planchado profesional para un acabado liso.",
      duration: 1.5,
      image: imgLavado,
    },
    {
      name: "Ampolla + Lavado + Planchado",
      description:
        "Tratamiento nutritivo con lavado profundo y planchado para un acabado brillante.",
      duration: 2,
      image: imgAmpolla,
    },
    {
      name: "Tratamientos Capilares",
      description:
        "Terapias personalizadas para reparar, hidratar o fortalecer el cabello.",
      duration: 2,
      image: imgBotox,
    },
    {
      name: "Botox Floractive Mandioca",
      description:
        "Rellena la fibra capilar con extracto de mandioca, ideal para controlar el frizz.",
      duration: 2.5,
      image: imgBotox,
    },
    {
      name: "Botox Protein Aguacate",
      description:
        "Tratamiento capilar a base de proteína de aguacate que suaviza y nutre.",
      duration: 2,
      image: imgBotox,
    },
    {
      name: "Células Madre Capilares",
      description:
        "Reestructura el cabello desde la raíz con células madre vegetales.",
      duration: 2.5,
      image: imgCelulas,
    },
    {
      name: "Cóctel Capilar",
      description:
        "Combinación de vitaminas y proteínas para restaurar la vitalidad del cabello.",
      duration: 1.5,
      image: imgCoctel,
    },
    {
      name: "Detox Capilar",
      description:
        "Limpieza profunda para eliminar impurezas y residuos químicos del cuero cabelludo.",
      duration: 1,
      image: imgDetox,
    },
    {
      name: "Velo de Brillo",
      description:
        "Tratamiento express que aporta brillo instantáneo y suavidad al cabello.",
      duration: 1,
      image: imgBrillo,
    },
    {
      name: "Liso Extremo",
      description:
        "Alisado intensivo para cabello rebelde que busca un look totalmente liso.",
      duration: 3,
      image: imgLiso,
    },
    {
      name: "Nanoplastía Floractive",
      description:
        "Alisado orgánico sin formol que fortalece y da brillo al cabello.",
      duration: 3,
      image: imgLiso,
    },
    {
      name: "Nanoplastía Nutreliss",
      description:
        "Tratamiento alisador con efecto nutritivo profundo para todo tipo de cabello.",
      duration: 3.5,
      image: imgLiso,
    },
    {
      name: "Lifting de Pestañas",
      description:
        "Eleva y curva tus pestañas naturales para un efecto más largo y definido.",
      duration: 1,
      image: imgPestanas,
    },
  ],
};

export function formatColon(amount) {
  return `₡${Number(amount).toLocaleString("es-CR")}`;
}

export function formatDuration(hours) {
  if (hours === 1) return "1 hora";
  if (Number.isInteger(hours)) return `${hours} horas`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m} min`;
  return `${h} h ${m} min`;
}
