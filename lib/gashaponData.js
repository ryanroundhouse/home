/**
 * Full 32-piece cyberpunk capsule catalog for the hidden gashapon machine.
 *
 * Replaces the small placeholder set used to prove the spawn/draw/persistence
 * pipeline in the tracer slice (see DECISIONS.md ADR "Hidden daily gashapon
 * machine + footer capsule collection" and its follow-up ADR for the full
 * art set).
 *
 * Shape: `{ id, name, svg }[]`, matching the existing
 * `terminalMailData.js`/`terminalBbsData.js` "data lives in lib/" convention.
 *
 * `svg` is trusted, hand-authored inline SVG markup — no user input is ever
 * interpolated into it, so callers may safely render it via `innerHTML`.
 * Every piece uses `currentColor` for strokes/fills (no baked-in colors) so
 * CSS can theme-recolor and glow/animate the artwork per ADR-0012's 12 site
 * themes without editing these SVG bodies again.
 */

export const gashaponCatalog = [
  // --- Weapons ---------------------------------------------------------
  {
    id: 'gashapon_neon_katana_v1',
    name: 'Neon Katana',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<line x1="12" y1="54" x2="46" y2="18" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>' +
      '<line x1="46" y1="18" x2="52" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.6"/>' +
      '<rect x="6" y="49" width="12" height="4" rx="2" fill="currentColor" transform="rotate(45 12 51)"/>' +
      '<circle cx="8" cy="56" r="3" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '</svg>',
  },
  {
    id: 'gashapon_plasma_blade_v1',
    name: 'Plasma Blade',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<path d="M14 50 Q28 44 46 16" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M18 46 Q28 40 42 20" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>' +
      '<rect x="6" y="48" width="10" height="4" rx="2" fill="currentColor" transform="rotate(30 11 50)"/>' +
      '</svg>',
  },
  {
    id: 'gashapon_pulse_pistol_v1',
    name: 'Pulse Pistol',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<path d="M8 36h28v8h-8v12h-8V44h-4l-8-8z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>' +
      '<rect x="36" y="32" width="16" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="3"/>' +
      '<circle cx="48" cy="36" r="2" fill="currentColor"/>' +
      '</svg>',
  },
  {
    id: 'gashapon_rail_spike_v1',
    name: 'Rail Spike',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<path d="M32 6 L38 30 L32 58 L26 30 Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>' +
      '<line x1="16" y1="20" x2="48" y2="20" stroke="currentColor" stroke-width="2" opacity="0.6"/>' +
      '<line x1="18" y1="40" x2="46" y2="40" stroke="currentColor" stroke-width="2" opacity="0.6"/>' +
      '</svg>',
  },
  // --- Corp logos / insignia --------------------------------------------
  {
    id: 'gashapon_corp_sigil_alpha_v1',
    name: 'Corp Sigil Alpha',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<polygon points="32,6 54,19 54,45 32,58 10,45 10,19" fill="none" stroke="currentColor" stroke-width="3"/>' +
      '<polygon points="32,20 44,40 20,40" fill="currentColor"/>' +
      '</svg>',
  },
  {
    id: 'gashapon_corp_sigil_beta_v1',
    name: 'Corp Sigil Beta',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<polygon points="22,8 42,8 56,22 56,42 42,56 22,56 8,42 8,22" fill="none" stroke="currentColor" stroke-width="3"/>' +
      '<circle cx="32" cy="32" r="9" fill="none" stroke="currentColor" stroke-width="3"/>' +
      '<line x1="32" y1="14" x2="32" y2="23" stroke="currentColor" stroke-width="3"/>' +
      '<line x1="32" y1="41" x2="32" y2="50" stroke="currentColor" stroke-width="3"/>' +
      '</svg>',
  },
  {
    id: 'gashapon_zaibatsu_crest_v1',
    name: 'Zaibatsu Crest',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<polygon points="32,8 44,32 32,56 20,32" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M20 32 L4 24 M44 32 L60 24" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M20 32 L4 40 M44 32 L60 40" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.6"/>' +
      '</svg>',
  },
  {
    id: 'gashapon_syndicate_mark_v1',
    name: 'Syndicate Mark',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<circle cx="32" cy="18" r="9" fill="none" stroke="currentColor" stroke-width="3"/>' +
      '<circle cx="18" cy="42" r="9" fill="none" stroke="currentColor" stroke-width="3"/>' +
      '<circle cx="46" cy="42" r="9" fill="none" stroke="currentColor" stroke-width="3"/>' +
      '<circle cx="32" cy="34" r="4" fill="currentColor"/>' +
      '</svg>',
  },
  // --- Cybernetic creatures ---------------------------------------------
  {
    id: 'gashapon_cyber_serpent_v1',
    name: 'Cyber Serpent',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<path d="M8 48 Q16 32 32 36 Q48 40 40 22 Q34 10 20 14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="18" cy="13" r="3" fill="currentColor"/>' +
      '<path d="M8 48 l-4 6 M8 48 l4 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '</svg>',
  },
  {
    id: 'gashapon_drone_wasp_v1',
    name: 'Drone Wasp',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<ellipse cx="32" cy="32" rx="8" ry="14" fill="none" stroke="currentColor" stroke-width="3"/>' +
      '<path d="M32 20 L12 10 M32 20 L52 10 M32 44 L12 54 M32 44 L52 54" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none"/>' +
      '<line x1="32" y1="18" x2="32" y2="46" stroke="currentColor" stroke-width="2" opacity="0.5"/>' +
      '</svg>',
  },
  {
    id: 'gashapon_mech_spider_v1',
    name: 'Mech Spider',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<circle cx="32" cy="30" r="10" fill="none" stroke="currentColor" stroke-width="3"/>' +
      '<path d="M24 26 L6 16 M40 26 L58 16 M22 34 L4 38 M42 34 L60 38 M26 38 L14 54 M38 38 L50 54" ' +
      'stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none"/>' +
      '<circle cx="32" cy="30" r="3" fill="currentColor"/>' +
      '</svg>',
  },
  {
    id: 'gashapon_neon_hound_v1',
    name: 'Neon Hound',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<path d="M12 46 Q10 26 26 20 L34 20 Q48 22 46 38 L44 46" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M26 20 L20 8 M34 20 L40 8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="30" cy="30" r="2.5" fill="currentColor"/>' +
      '</svg>',
  },
  // --- Glitch glyphs ------------------------------------------------------
  {
    id: 'gashapon_glitch_glyph_alpha_v1',
    name: 'Glitch Glyph Alpha',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<line x1="8" y1="18" x2="56" y2="18" stroke="currentColor" stroke-width="3"/>' +
      '<line x1="14" y1="30" x2="50" y2="30" stroke="currentColor" stroke-width="3" opacity="0.7"/>' +
      '<line x1="8" y1="42" x2="40" y2="42" stroke="currentColor" stroke-width="3"/>' +
      '<line x1="46" y1="42" x2="56" y2="42" stroke="currentColor" stroke-width="3" opacity="0.5"/>' +
      '<line x1="20" y1="54" x2="56" y2="54" stroke="currentColor" stroke-width="3" opacity="0.8"/>' +
      '</svg>',
  },
  {
    id: 'gashapon_glitch_glyph_beta_v1',
    name: 'Glitch Glyph Beta',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<rect x="8" y="8" width="14" height="14" fill="currentColor" opacity="0.8"/>' +
      '<rect x="26" y="20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<rect x="42" y="8" width="14" height="14" fill="currentColor" opacity="0.4"/>' +
      '<rect x="8" y="42" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<rect x="42" y="42" width="14" height="14" fill="currentColor" opacity="0.6"/>' +
      '</svg>',
  },
  {
    id: 'gashapon_corrupt_rune_v1',
    name: 'Corrupt Rune',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 3"/>' +
      '<path d="M20 20 L44 44 M44 20 L20 44 M32 12 L32 52" stroke="currentColor" stroke-width="2.5"/>' +
      '</svg>',
  },
  {
    id: 'gashapon_static_sigil_v1',
    name: 'Static Sigil',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<path d="M10 32 h8 l4-14 6 28 6-20 5 12 6-6h9" fill="none" stroke="currentColor" stroke-width="3" ' +
      'stroke-linejoin="round" stroke-linecap="round"/>' +
      '</svg>',
  },
  // --- Tech / hardware -----------------------------------------------------
  {
    id: 'gashapon_neural_jack_v1',
    name: 'Neural Jack',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<rect x="24" y="8" width="16" height="24" rx="3" fill="none" stroke="currentColor" stroke-width="3"/>' +
      '<line x1="28" y1="32" x2="28" y2="44" stroke="currentColor" stroke-width="3"/>' +
      '<line x1="36" y1="32" x2="36" y2="44" stroke="currentColor" stroke-width="3"/>' +
      '<circle cx="32" cy="52" r="8" fill="none" stroke="currentColor" stroke-width="3"/>' +
      '</svg>',
  },
  {
    id: 'gashapon_circuit_core_v1',
    name: 'Circuit Core',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<rect x="20" y="20" width="24" height="24" fill="none" stroke="currentColor" stroke-width="3"/>' +
      '<circle cx="32" cy="32" r="5" fill="currentColor"/>' +
      '<path d="M32 8v10M32 46v10M8 32h10M46 32h10M14 14l8 8M50 14l-8 8M14 50l8-8M50 50l-8-8" stroke="currentColor" stroke-width="2"/>' +
      '</svg>',
  },
  {
    id: 'gashapon_power_cell_v1',
    name: 'Power Cell',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<rect x="18" y="14" width="28" height="40" rx="4" fill="none" stroke="currentColor" stroke-width="3"/>' +
      '<rect x="26" y="8" width="12" height="8" rx="2" fill="currentColor"/>' +
      '<path d="M34 22 L24 36 h8 l-4 14 12-18h-8z" fill="currentColor"/>' +
      '</svg>',
  },
  {
    id: 'gashapon_optic_relay_v1',
    name: 'Optic Relay',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<path d="M6 32 Q32 12 58 32 Q32 52 6 32 Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>' +
      '<circle cx="32" cy="32" r="8" fill="currentColor"/>' +
      '<circle cx="32" cy="32" r="14" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '</svg>',
  },
  // --- Body / augment ------------------------------------------------------
  {
    id: 'gashapon_cyber_eye_v1',
    name: 'Cyber Eye',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<path d="M8 32 L20 20 h24 l12 12 -12 12 h-24 z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>' +
      '<rect x="28" y="26" width="8" height="12" fill="currentColor"/>' +
      '<line x1="4" y1="32" x2="10" y2="32" stroke="currentColor" stroke-width="2"/>' +
      '<line x1="54" y1="32" x2="60" y2="32" stroke="currentColor" stroke-width="2"/>' +
      '</svg>',
  },
  {
    id: 'gashapon_chrome_claw_v1',
    name: 'Chrome Claw',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<path d="M20 10 Q14 30 22 52" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M32 8 Q28 30 32 54" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M44 10 Q46 30 40 52" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M14 44 h36" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
      '</svg>',
  },
  {
    id: 'gashapon_neural_crown_v1',
    name: 'Neural Crown',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<path d="M10 46 L14 22 L24 34 L32 16 L40 34 L50 22 L54 46 Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>' +
      '<line x1="10" y1="46" x2="54" y2="46" stroke="currentColor" stroke-width="3"/>' +
      '<circle cx="32" cy="16" r="2.5" fill="currentColor"/>' +
      '</svg>',
  },
  {
    id: 'gashapon_spine_implant_v1',
    name: 'Spine Implant',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<path d="M32 6 Q40 20 32 32 Q24 44 32 58" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
      '<line x1="22" y1="14" x2="42" y2="14" stroke="currentColor" stroke-width="2.5"/>' +
      '<line x1="20" y1="26" x2="44" y2="26" stroke="currentColor" stroke-width="2.5"/>' +
      '<line x1="20" y1="38" x2="44" y2="38" stroke="currentColor" stroke-width="2.5"/>' +
      '<line x1="22" y1="50" x2="42" y2="50" stroke="currentColor" stroke-width="2.5"/>' +
      '</svg>',
  },
  // --- Network / data --------------------------------------------------------
  {
    id: 'gashapon_firewall_ward_v1',
    name: 'Firewall Ward',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<path d="M32 6 L54 16 V34 Q54 50 32 58 Q10 50 10 34 V16 Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M22 30 l8 8 12-16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>',
  },
  {
    id: 'gashapon_netrunner_key_v1',
    name: 'Netrunner Key',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<circle cx="20" cy="20" r="10" fill="none" stroke="currentColor" stroke-width="3"/>' +
      '<line x1="27" y1="27" x2="52" y2="52" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
      '<line x1="40" y1="40" x2="46" y2="34" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
      '<line x1="46" y1="46" x2="52" y2="40" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
      '</svg>',
  },
  {
    id: 'gashapon_data_stream_v1',
    name: 'Data Stream',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<path d="M8 16 Q32 28 56 16" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
      '<path d="M8 32 Q32 44 56 32" fill="none" stroke="currentColor" stroke-width="2.5" opacity="0.7"/>' +
      '<path d="M8 48 Q32 60 56 48" fill="none" stroke="currentColor" stroke-width="2.5" opacity="0.4"/>' +
      '</svg>',
  },
  {
    id: 'gashapon_packet_node_v1',
    name: 'Packet Node',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<rect x="26" y="26" width="12" height="12" fill="currentColor"/>' +
      '<circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
      '<circle cx="52" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
      '<circle cx="12" cy="52" r="5" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
      '<circle cx="52" cy="52" r="5" fill="none" stroke="currentColor" stroke-width="2.5"/>' +
      '<line x1="16" y1="16" x2="27" y2="27" stroke="currentColor" stroke-width="2"/>' +
      '<line x1="48" y1="16" x2="37" y2="27" stroke="currentColor" stroke-width="2"/>' +
      '<line x1="16" y1="48" x2="27" y2="37" stroke="currentColor" stroke-width="2"/>' +
      '<line x1="48" y1="48" x2="37" y2="37" stroke="currentColor" stroke-width="2"/>' +
      '</svg>',
  },
  // --- Misc cyberpunk icons ----------------------------------------------
  {
    id: 'gashapon_holo_mask_v1',
    name: 'Holo Mask',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<path d="M12 24 Q32 10 52 24 V40 Q32 54 12 40 Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>' +
      '<line x1="22" y1="30" x2="30" y2="30" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
      '<line x1="34" y1="30" x2="42" y2="30" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
      '</svg>',
  },
  {
    id: 'gashapon_skulljack_v1',
    name: 'Skulljack',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<circle cx="32" cy="26" r="16" fill="none" stroke="currentColor" stroke-width="3"/>' +
      '<circle cx="25" cy="24" r="3" fill="currentColor"/>' +
      '<circle cx="39" cy="24" r="3" fill="currentColor"/>' +
      '<path d="M26 34 h12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="32" y1="42" x2="32" y2="56" stroke="currentColor" stroke-width="3"/>' +
      '<line x1="24" y1="48" x2="40" y2="48" stroke="currentColor" stroke-width="3"/>' +
      '</svg>',
  },
  {
    id: 'gashapon_nanite_swarm_v1',
    name: 'Nanite Swarm',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<circle cx="18" cy="18" r="4" fill="currentColor"/>' +
      '<circle cx="34" cy="12" r="3" fill="currentColor" opacity="0.8"/>' +
      '<circle cx="46" cy="22" r="4" fill="currentColor"/>' +
      '<circle cx="14" cy="36" r="3" fill="currentColor" opacity="0.7"/>' +
      '<circle cx="30" cy="32" r="5" fill="currentColor"/>' +
      '<circle cx="48" cy="40" r="3" fill="currentColor" opacity="0.6"/>' +
      '<circle cx="22" cy="50" r="4" fill="currentColor"/>' +
      '<circle cx="40" cy="52" r="3" fill="currentColor" opacity="0.8"/>' +
      '</svg>',
  },
  {
    id: 'gashapon_grid_compass_v1',
    name: 'Grid Compass',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<circle cx="32" cy="32" r="24" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<line x1="32" y1="8" x2="32" y2="56" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>' +
      '<line x1="8" y1="32" x2="56" y2="32" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>' +
      '<polygon points="32,14 38,32 32,50 26,32" fill="currentColor"/>' +
      '</svg>',
  },
];

export const GASHAPON_CATALOG_IDS = gashaponCatalog.map((c) => c.id);

export function getCapsuleById(id) {
  return gashaponCatalog.find((c) => c.id === id) || null;
}
