var S = 3;
function px(n) { return (Math.round(n * S * 10) / 10) + 'px'; }
var ICONS = {
  calendar: 'M6 4.5h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-10a3 3 0 0 1 3-3zM8 2.5v4M16 2.5v4M3 10h18',
  chat: 'M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z',
  phone: 'M5 3.5h3l1.5 4.5-2 1.5a12 12 0 0 0 7 7l1.5-2 4.5 1.5v3a2 2 0 0 1-2 2A17 17 0 0 1 3 5.5a2 2 0 0 1 2-2z',
  pin: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM9.5 9.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0',
  mail: 'M6 5h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3zM3.5 7l8.5 6 8.5-6',
  tag: 'M3 12V4.5A1.5 1.5 0 0 1 4.5 3H12l9 9-9 9zM7.5 7.5h.01',
  clock: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M12 7v5l3 2',
  dumbbell: 'M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11',
  pulse: 'M3 12h4l2-5 4 10 2-5h6',
  shield: 'M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6zM8.5 12l2.5 2.5 4.5-5',
  doc: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
  video: 'M6.5 5h11a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4h-11a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4zM10 9.5v5l4.5-2.5z',
  briefcase: 'M4 8h16v11H4zM9 8V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V8M4 13h16',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  globe: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18',
  bag: 'M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2',
  truck: 'M3 6h11v10H3zM14 10h4l3 3v3h-7M6 18.5a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0M16 18.5a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0',
  camera: 'M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5zM8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',
  arrow: 'M7 17 17 7M8 7h9v9',
  userplus: 'M5 8a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M2.5 20a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6',
  share: 'M15.5 5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0M3.5 12a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0M15.5 19a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0M8.2 10.8l7.6-4.6M8.2 13.2l7.6 4.6',
  qr: 'M4.5 3h4A1.5 1.5 0 0 1 10 4.5v4A1.5 1.5 0 0 1 8.5 10h-4A1.5 1.5 0 0 1 3 8.5v-4A1.5 1.5 0 0 1 4.5 3zM15.5 3h4A1.5 1.5 0 0 1 21 4.5v4a1.5 1.5 0 0 1-1.5 1.5h-4A1.5 1.5 0 0 1 14 8.5v-4A1.5 1.5 0 0 1 15.5 3zM4.5 14h4a1.5 1.5 0 0 1 1.5 1.5v4A1.5 1.5 0 0 1 8.5 21h-4A1.5 1.5 0 0 1 3 19.5v-4A1.5 1.5 0 0 1 4.5 14zM14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3',
  check: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M8.5 12l2.5 2.5 4.5-5'
};
var SEGS = {
  fitness: { font: 'Space Grotesk', name: 'Studio Força', kind: 'Academia · Treino funcional', initials: 'SF', bio: 'Treinos em grupo e personal. A primeira aula é por nossa conta.', status: 'Aberto agora · até 22h', place: '[Bairro, Cidade]', cta: 'Agendar aula experimental', ctaShort: 'Agendar aula', ctaSub: 'Escolha o dia e o horário', ctaIcon: 'calendar', slots: ['Hoje 18h', 'Hoje 19h', 'Amanhã 7h'],
    links: [['Planos e preços', 'Mensal, trimestral e anual', 'tag'], ['Grade de aulas', 'Horários da semana', 'clock'], ['Programas de treino', 'Força, mobilidade e HIIT', 'dumbbell'], ['Avaliação física', 'Com um professor da casa', 'pulse'], ['Instagram', '@studioforca', 'camera']],
    pal: { bg: '#0F1012', surface: '#1B1C20', ink: '#F4F4F5', muted: '#A1A1AA', accent: '#C8F25A', onAccent: '#0F1012', line: '#2E2F35', soft: '#26272C' } },
  clinica: { font: 'Plus Jakarta Sans', name: 'Clínica Vida', kind: 'Clínica · Saúde integrada', initials: 'CV', bio: 'Consultas, exames e acompanhamento com equipe multidisciplinar.', status: 'Aberto agora · até 19h', place: '[Bairro, Cidade]', cta: 'Agendar consulta', ctaShort: 'Agendar consulta', ctaSub: 'Presencial ou por vídeo', ctaIcon: 'calendar', slots: ['Seg 9h', 'Seg 14h', 'Ter 10h'],
    links: [['Especialidades', 'Cardiologia, dermatologia e mais', 'pulse'], ['Convênios aceitos', 'Confira se o seu está na lista', 'shield'], ['Resultados de exames', 'Acesso com seu CPF', 'doc'], ['Teleconsulta', 'Atendimento por vídeo', 'video'], ['Como chegar', 'Estacionamento no local', 'pin']],
    pal: { bg: '#F2F5F9', surface: '#FFFFFF', ink: '#0E2148', muted: '#55607A', accent: '#2563EB', onAccent: '#FFFFFF', line: '#DCE3EE', soft: '#E8EEF8' } },
  profissional: { font: 'Fraunces', name: 'Ana Duarte', kind: 'Advogada · Direito empresarial', initials: 'AD', bio: 'Consultoria jurídica para pequenas e médias empresas.', status: 'Atendendo · seg a sex', place: 'Online e [Cidade]', cta: 'Marcar uma reunião', ctaShort: 'Marcar reunião', ctaSub: '30 minutos, por vídeo', ctaIcon: 'calendar', slots: ['Qua 10h', 'Qua 15h', 'Qui 11h'],
    links: [['Serviços', 'Contratos, societário e compliance', 'briefcase'], ['Artigos', 'Um texto novo por semana', 'doc'], ['Depoimentos', 'O que dizem os clientes', 'star'], ['LinkedIn', 'Perfil profissional', 'globe'], ['Site', '[seudominio].com.br', 'globe']],
    pal: { bg: '#F6F4EF', surface: '#FFFFFF', ink: '#1C1C1A', muted: '#5F5A52', accent: '#2D4A3E', onAccent: '#FFFFFF', line: '#E2DDD3', soft: '#EFEBE3' } },
  loja: { font: 'Sora', name: 'Casa Arruda', kind: 'Loja · Casa e decoração', initials: 'CA', bio: 'Peças autorais para a sua casa, com envio para todo o Brasil.', status: 'Loja online · 24h', place: 'Showroom em [Cidade]', cta: 'Ver catálogo', ctaShort: 'Ver catálogo', ctaSub: 'Novidades toda semana', ctaIcon: 'bag', slots: ['Mesa', 'Iluminação', 'Têxteis'],
    links: [['Promoções da semana', 'Peças selecionadas', 'tag'], ['Acompanhar pedido', 'Código de rastreio', 'truck'], ['Trocas e devoluções', 'Como funciona', 'doc'], ['Loja física', 'Visite o showroom', 'pin'], ['Instagram', '@casaarruda', 'camera']],
    pal: { bg: '#FFF6EE', surface: '#FFFFFF', ink: '#1A1A1A', muted: '#5E5650', accent: '#FF6A3D', onAccent: '#1A1A1A', line: '#F1E1D3', soft: '#FCEADC' } }
};
SEGS.bold = Object.assign({}, SEGS.loja, { font: 'Space Grotesk', pal: { bg: '#FFFFFF', surface: '#F2F2F2', ink: '#111111', muted: '#5E5E5E', accent: '#FF6B00', onAccent: '#111111', line: '#EBEBEB', soft: '#ECECEC' } });
SEGS.fresh = Object.assign({}, SEGS.fitness, { font: 'DM Sans', pal: { bg: '#EEF0F3', surface: '#FFFFFF', ink: '#111111', muted: '#5E5E5E', accent: '#D9F24F', onAccent: '#111111', line: '#DADDE2', soft: '#E4E7EB' } });
SEGS.zen = Object.assign({}, SEGS.clinica, { font: 'DM Sans', pal: { bg: '#F4F2EC', surface: '#FFFFFF', ink: '#1C1C1A', muted: '#6B645B', accent: '#C9DB9F', onAccent: '#1C1C1A', line: '#E2DDD3', soft: '#ECE8E0' } });
SEGS.dark = Object.assign({}, SEGS.profissional, { font: 'Sora', pal: { bg: '#111214', surface: '#1C1D21', ink: '#F2F2F2', muted: '#A1A1AA', accent: '#A78BFA', onAccent: '#111214', line: '#2E2F35', soft: '#26272C' } });
var SEG_KEYS = { 'Sport': 'fitness', 'Calm': 'clinica', 'Classic': 'profissional', 'Pop': 'loja', 'Bold': 'bold', 'Fresh': 'fresh', 'Zen': 'zen', 'Dark': 'dark' };
var SIZES = {
  'Compacto': { py: 10, padX: 14, icon: 36, t: 14, s: 12, gap: 8, tile: 104 },
  'Regular': { py: 14, padX: 16, icon: 44, t: 16, s: 13, gap: 10, tile: 128 },
  'Grande': { py: 20, padX: 18, icon: 56, t: 18, s: 14, gap: 12, tile: 160 }
};
function isHex(v) { return typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v); }
function rgb(h) { h = h.replace('#', ''); if (h.length === 3) { h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; } return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function hex(c) { return '#' + c.map(function (v) { var s = Math.round(Math.max(0, Math.min(255, v))).toString(16); return s.length < 2 ? '0' + s : s; }).join(''); }
function mix(a, b, t) { var x = rgb(a), y = rgb(b); return hex([0, 1, 2].map(function (i) { return x[i] + (y[i] - x[i]) * t; })); }
function lum(h) { var c = rgb(h).map(function (v) { v = v / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

function buildTheme(p) {
  var key = SEG_KEYS[p.estilo] || 'fitness';
  var seg = SEGS[key];
  var pal = seg.pal;
  if (p.paleta === 'Personalizada') {
    var bg = isHex(p.fundo) ? p.fundo : '#FFFFFF';
    var ac = isHex(p.acento) ? p.acento : '#5B3FFF';
    var dark = lum(bg) < 0.18;
    pal = {
      bg: bg, accent: ac,
      onAccent: contrast(ac, '#FFFFFF') >= contrast(ac, '#111111') ? '#FFFFFF' : '#111111',
      surface: dark ? mix(bg, '#FFFFFF', 0.08) : (lum(bg) > 0.92 ? '#FFFFFF' : mix(bg, '#FFFFFF', 0.65)),
      ink: dark ? '#F4F4F5' : '#151515', muted: dark ? '#B4B4BC' : '#55555A',
      line: dark ? mix(bg, '#FFFFFF', 0.16) : mix(bg, '#000000', 0.12),
      soft: dark ? mix(bg, '#FFFFFF', 0.12) : mix(bg, '#000000', 0.06)
    };
  }
  var fontName = (p.fonte && p.fonte !== 'Do estilo') ? p.fonte : seg.font;
  var sz = SIZES[p.tamanhoCard] || SIZES['Regular'];
  var r = Number(p.cantos); if (!(r >= 0)) { r = 20; }
  var mode = p.fundoCard || 'Sólido';
  var c;
  if (mode === 'Contorno') { c = { bg: 'transparent', border: pal.line, ink: pal.ink, muted: pal.muted, iconBg: pal.soft, iconInk: pal.ink }; }
  else if (mode === 'Tinta') { c = { bg: mix(pal.bg, pal.accent, 0.14), border: 'transparent', ink: pal.ink, muted: pal.muted, iconBg: mix(pal.bg, pal.accent, 0.3), iconInk: pal.ink }; }
  else if (mode === 'Destaque') { c = { bg: pal.accent, border: 'transparent', ink: pal.onAccent, muted: pal.onAccent, iconBg: mix(pal.accent, pal.onAccent, 0.14), iconInk: pal.onAccent }; }
  else { c = { bg: pal.surface, border: contrast(pal.surface, pal.bg) < 1.08 ? pal.line : 'transparent', ink: pal.ink, muted: pal.muted, iconBg: pal.soft, iconInk: pal.ink }; }
  var base = 'background: ' + c.bg + '; border: ' + px(1) + ' solid ' + c.border + '; border-radius: ' + px(r) + '; color: ' + c.ink + '; text-decoration: none;';
  var t = {
    bg: pal.bg, surface: pal.surface, ink: pal.ink, muted: pal.muted, accent: pal.accent, onAccent: pal.onAccent, line: pal.line, soft: pal.soft,
    accentOnBg: contrast(pal.accent, pal.bg) >= 3 ? pal.accent : pal.ink,
    chipOnAccent: pal.onAccent === '#FFFFFF' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
    font: "'" + fontName + "', " + (fontName === 'Fraunces' ? 'serif' : 'sans-serif'),
    r: px(r), rBig: px(r + 6), rLogo: px(Math.min(r + 4, 32)),
    listGap: px(sz.gap),
    cardStyle: 'display: flex; align-items: center; gap: ' + px(12) + '; padding: ' + px(sz.py) + ' ' + px(sz.padX) + '; ' + base,
    tileStyle: 'display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; height: ' + px(sz.tile) + '; padding: ' + px(sz.padX) + '; ' + base,
    quickStyle: 'height: ' + px(76) + '; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: ' + px(6) + '; ' + base,
    iconBox: 'width: ' + px(sz.icon) + '; height: ' + px(sz.icon) + '; flex-shrink: 0; border-radius: ' + px(Math.min(r * 0.7, sz.icon / 2)) + '; background: ' + c.iconBg + '; color: ' + c.iconInk + '; display: flex; align-items: center; justify-content: center',
    iconSvg: String(Math.round(sz.icon * 0.46) * S),
    titleStyle: 'font-size: ' + px(sz.t) + '; font-weight: 600; line-height: 1.25',
    subStyle: 'font-size: ' + px(sz.s) + '; color: ' + c.muted + '; line-height: 1.35'
  };
  var links = seg.links.map(function (l) { return { title: l[0], sub: l[1], d: ICONS[l[2]] }; });
  return {
    t: t, ic: ICONS,
    seg: { name: seg.name, kind: seg.kind, initials: seg.initials, bio: seg.bio, status: seg.status, place: seg.place, cta: seg.cta, ctaShort: seg.ctaShort, ctaSub: seg.ctaSub, ctaD: ICONS[seg.ctaIcon], count: links.length + ' links' },
    slots: seg.slots, links: links, tiles: links.slice(0, 4),
    quick: [{ label: 'WhatsApp', d: ICONS.chat }, { label: 'Ligar', d: ICONS.phone }, { label: 'Como chegar', d: ICONS.pin }]
  };
}
class Component extends DCLogic {
  renderVals() { return buildTheme(this.props); }
}
