export const GROUPS = [
  {
    id: "automotriz",
    title: "Automotriz",
    desc: "Autos, motos, refacciones, servicios automotrices.",
    publishSchema: [
      { name: "titulo", label: "Título", type: "text", required: true },
      { name: "marca", label: "Marca", type: "text", required: true },
      { name: "modelo", label: "Modelo", type: "text", required: true },
      { name: "anio", label: "Año", type: "number" },
      { name: "precio", label: "Precio", type: "number", required: true },
      { name: "descripcion", label: "Descripción", type: "textarea" },
      { name: "foto_url", label: "URL de imagen", type: "text" },
      { name: "estado", label: "Estado", type: "select", options: ["disponible", "apartado", "vendido"] },
    ],
  },
  {
    id: "marketplace",
    title: "Marketplace",
    desc: "Productos y servicios generales.",
    publishSchema: [
      { name: "titulo", label: "Título", type: "text", required: true },
      { name: "precio", label: "Precio", type: "number", required: true },
      { name: "categoria", label: "Categoría", type: "text" },
      { name: "descripcion", label: "Descripción", type: "textarea" },
      { name: "foto_url", label: "URL de imagen", type: "text" },
    ],
  },
  {
    id: "empresas",
    title: "Empresas",
    desc: "B2B, proveedores, servicios profesionales.",
    publishSchema: [
      { name: "nombre", label: "Nombre", type: "text", required: true },
      { name: "servicio", label: "Servicio", type: "text", required: true },
      { name: "telefono", label: "Teléfono", type: "text" },
      { name: "correo", label: "Correo", type: "text" },
      { name: "descripcion", label: "Descripción", type: "textarea" },
    ],
  },
  {
    id: "universidades",
    title: "Universidades",
    desc: "Oferta académica, becas, trámites.",
    publishSchema: [
      { name: "titulo", label: "Título", type: "text", required: true },
      { name: "tipo", label: "Tipo", type: "select", options: ["beca", "convocatoria", "tramite", "evento"] },
      { name: "fecha", label: "Fecha", type: "text" },
      { name: "descripcion", label: "Descripción", type: "textarea" },
      { name: "url", label: "URL", type: "text" },
    ],
  },
  {
    id: "instituciones",
    title: "Instituciones",
    desc: "Programas, convocatorias, eventos institucionales.",
    publishSchema: [
      { name: "titulo", label: "Título", type: "text", required: true },
      { name: "institucion", label: "Institución", type: "text" },
      { name: "descripcion", label: "Descripción", type: "textarea" },
      { name: "url", label: "URL", type: "text" },
    ],
  },
];

export function getGroupConfig(groupId) {
  return GROUPS.find((g) => g.id === groupId) || null;
}
