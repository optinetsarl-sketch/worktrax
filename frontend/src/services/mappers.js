const palette = ['#2563a8', '#16a34a', '#f97316', '#7c3aed', '#0284c7', '#b91c1c', '#64748b'];

export function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export function buildLookup(items, labelKey = 'name') {
  return normalizeList(items).reduce((acc, item) => {
    acc[item.id] = item[labelKey] || item.nom || item.username || item.email || item.id;
    return acc;
  }, {});
}

export function initialsFromName(name = 'NA') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'NA';
}

export function mapWorker(worker, lookups = {}) {
  const name = worker.nom_complet || worker.name || worker.username || 'Ouvrier';
  const status = worker.is_active === false ? 'absent' : 'present';
  return {
    raw: worker,
    id: worker.id,
    initials: initialsFromName(name),
    color: palette[Number(worker.id) % palette.length] || palette[0],
    name,
    phone: worker.phone || '—',
    category: lookups.typeWorkers?.[worker.type_worker] || worker.type_worker_label || 'Non classé',
    site: lookups.sites?.[worker.site] || worker.site_label || '—',
    structure: lookups.societes?.[worker.societe] || worker.societe_label || '—',
    contract: lookups.typeContrats?.[worker.type_contrat] || worker.type_contrat_label || '—',
    hours: worker.hours || 0,
    status,
  };
}

export function mapMachine(machine) {
  const statusMap = { available: 'service', assigned: 'service', maintenance: 'maintenance' };
  const status = statusMap[machine.status] || 'out';
  return {
    raw: machine,
    id: machine.id,
    type: machine.name || 'Engin',
    reference: machine.plate_number || machine.serial_number || `#${machine.id}`,
    brandModel: [machine.brand, machine.model].filter(Boolean).join(' ') || machine.serial_number || '—',
    site: machine.site || '—',
    operator: machine.operator || '—',
    hours: machine.hours ? `${machine.hours}h` : '0h',
    maintenanceDate: machine.purchase_date || '—',
    status,
    isTruck: /camion|truck|benne|plateau|toupie|remorque/i.test(machine.name || ''),
  };
}

export function mapUser(user, roleLookup = {}) {
  const username = user.username || user.email || 'Utilisateur';
  return {
    raw: user,
    id: user.id,
    initials: initialsFromName(username.replace(/[._-]/g, ' ')),
    name: username,
    email: user.email || '—',
    role: roleLookup[user.role] || user.role || '—',
    site: '—',
    createdAt: user.created_at || '—',
  };
}
