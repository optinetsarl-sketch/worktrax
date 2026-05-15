export const trucks = [
  ['01', '🚛 Camion benne', 'TG-2024-001', 'Lomé-Agoè', 'Koffi Mensah', 420, '15/04/2026', 'service'],
  ['02', '🏗️ Camion grue', 'TG-2024-002', 'Kégué', 'Yao Akakpo', 380, '10/04/2026', 'service'],
  ['03', '🍌 Camion remorque banane (ciment)', 'TG-2024-003', 'Lomé-Agoè', 'Kodjo Aziato', 510, '08/04/2026', 'maintenance'],
  ['04', '🪨 Camion Klein clair (graviers)', 'TG-2024-004', 'Baguida', 'Kossi Adou', 460, '20/04/2026', 'service'],
  ['05', '🛣️ Camion de bitume', 'TG-2024-005', 'Adéwui', 'Felix Amega', 490, '25/04/2026', 'service'],
  ['06', '🚛 Camion plateau', 'TG-2024-006', 'Tsévié', 'Mawuli Nuko', 350, '18/04/2026', 'service'],
  ['07', '🌀 Camion béton toupie', 'TG-2024-007', 'Lomé-Agoè', 'Jean Dupont', 440, '05/05/2026', 'service'],
  ['08', '⛽ Camion grand citerne gazole', 'TG-2024-008', 'Kégué', 'Ama Sodzi', 0, '01/04/2026', 'service'],
  ['09', '⛽ Camion petit citerne gazole', 'TG-2024-009', 'Baguida', 'Akpene Bawa', 0, '12/04/2026', 'service'],
  ['10', '💧 Camion citerne à eau', 'TG-2024-010', 'Adéwui', 'Sena Agbo', 280, '22/04/2026', 'service'],
  ['11', '🧱 Camion Sol ciment', 'TG-2024-011', 'Tsévié', '—', 0, '28/04/2026', 'out'],
  ['12', '🚙 Voiture pick-up', 'TG-2024-012', 'Tous sites', 'Superviseur', 120, '02/05/2026', 'service'],
];

export const machines = [
  ['01', '🏔️ Bulldozer', 'CAT D6T', 'Lomé-Agoè', 'Agbeko Tetteh', '280h', '20/06/2026', 'service'],
  ['02', '🔄 Chargeuse', 'Volvo L90H', 'Kégué', 'Biossey Komi', '248h', '15/06/2026', 'service'],
  ['03', '📐 Grader (Niveleuse)', 'Komatsu GD655', 'Adéwui', 'Yao Akakpo', '312h', '10/06/2026', 'service'],
  ['04', '🔨 Compacteur', 'Bomag BW213', 'Baguida', '—', '0h', '—', 'maintenance'],
  ['05', '🛞 Rouleau lisse', 'Dynapac CA250', 'Lomé-Agoè', 'Esso Koffi', '196h', '18/06/2026', 'service'],
  ['06', '🛣️ Finisseur', 'Volvo P7820C', 'Tsévié', 'Dodzi Agbeko', '224h', '25/06/2026', 'service'],
  ['07', '♻️ Recycleuse', 'Wirtgen WR2400', 'Adéwui', 'Kafui Amega', '160h', '30/06/2026', 'service'],
  ['08', '⛏️ Pelle (Excavatrice)', 'CAT 320', 'Lomé-Agoè', 'Koffi Mensah', '336h', '08/06/2026', 'service'],
  ['09', '🪨 Concasseur', 'Metso C110', 'Baguida', 'Selom Dossou', '288h', '12/06/2026', 'service'],
  ['10', '🔩 Foreuse', 'Atlas Copco T45', 'Kégué', 'Komi Agbo', '144h', '22/06/2026', 'service'],
  ['11', '🏗️ PPM Élévateur (Grue mobile)', 'Liebherr LTM1060', 'Lomé-Agoè', 'Felix Dede', '208h', '05/06/2026', 'service'],
  ['12', "🌑 Machine d'enrobé", 'Ammann ABP120', 'Tsévié', 'Nana Agbeko', '176h', '28/06/2026', 'service'],
  ['13', '🏭 Centrale à Béton', 'Liebherr Mobilmix', 'Lomé-Agoè', 'Togbe Atcholi', '320h', '02/06/2026', 'service'],
  ['14', '⚡ Groupe électrogène', 'Cummins C550D5', 'Tous sites', '—', '0h', '14/06/2026', 'service'],
  ['15', '🚜 Tractopelle', 'JCB 3CX', 'Kégué', 'Amewu Koffi', '264h', '16/06/2026', 'maintenance'],
  ['16', '🪨 Tombereau (Dumper)', 'Caterpillar 740', 'Baguida', 'Kpabi Messan', '240h', '19/06/2026', 'out'],
];

export const fuelLog = [
  ['13:35', 'Pascal Petevi', 'Finisseur', 'Volvo P7820C', 'Dodzi Agbeko', 70, 'Tsévié'],
  ['13:00', 'Komi Dossou', 'Rouleau lisse', 'Dynapac CA250', 'Esso Koffi', 85, 'Lomé-Agoè'],
  ['12:25', 'Akpene Bawa', 'Grader (Niveleuse)', 'Komatsu GD655', 'Yao Akakpo', 100, 'Adéwui'],
  ['11:50', 'Ama Sodzi', 'Chargeuse', 'Volvo L90H', 'Biossey Komi', 65, 'Kégué'],
  ['11:15', 'Akpene Zankli', 'Bulldozer', 'CAT D6T', 'Agbeko Tetteh', 90, 'Lomé-Agoè'],
  ['10:40', 'Pascal Petevi', 'Camion béton toupie', 'TG-2024-007', 'Jean Dupont', 120, 'Lomé-Agoè'],
  ['10:05', 'Komi Dossou', 'Camion plateau', 'TG-2024-006', 'Mawuli Nuko', 110, 'Tsévié'],
  ['09:30', 'Akpene Bawa', 'Camion de bitume', 'TG-2024-005', 'Felix Amega', 75, 'Adéwui'],
  ['08:55', 'Ama Sodzi', 'Camion Klein clair', 'TG-2024-004', 'Kossi Adou', 95, 'Baguida'],
];

export const engineLookup = {
  'TG-2024-001': { type: 'Camion benne', driver: 'Koffi Mensah', site: 'Lomé-Agoè' },
  'TG-2024-002': { type: 'Camion grue', driver: 'Yao Akakpo', site: 'Kégué' },
  'TG-2024-003': { type: 'Camion remorque banane', driver: 'Kodjo Aziato', site: 'Lomé-Agoè' },
  'TG-2024-004': { type: 'Camion Klein clair', driver: 'Kossi Adou', site: 'Baguida' },
  'TG-2024-005': { type: 'Camion de bitume', driver: 'Felix Amega', site: 'Adéwui' },
  'TG-2024-006': { type: 'Camion plateau', driver: 'Mawuli Nuko', site: 'Tsévié' },
  'TG-2024-007': { type: 'Camion béton toupie', driver: 'Jean Dupont', site: 'Lomé-Agoè' },
  'CAT D6T': { type: 'Bulldozer', driver: 'Agbeko Tetteh', site: 'Lomé-Agoè' },
  'Volvo L90H': { type: 'Chargeuse', driver: 'Biossey Komi', site: 'Kégué' },
  'Komatsu GD655': { type: 'Grader', driver: 'Yao Akakpo', site: 'Adéwui' },
};
