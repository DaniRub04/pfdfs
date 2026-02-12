export const GROUP_OPTIONS = [
  { id: "automotriz", label: "Automotriz" },
  { id: "marketplace", label: "Marketplace" },
  { id: "empresas", label: "Empresas" },
  { id: "universidades", label: "Universidades" },
  { id: "instituciones", label: "Instituciones" },
];

export function isValidGroup(id) {
  return GROUP_OPTIONS.some((g) => g.id === id);
}

export function normalizeGroup(id, fallback = "automotriz") {
  return isValidGroup(id) ? id : fallback;
}
