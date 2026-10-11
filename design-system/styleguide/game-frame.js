// Behaviour of the game-view demo frame. The parent (game.html) drives it through postMessage;
// the page also works on its own (open game-frame.html directly, or add #state=<json>).
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const root = document.documentElement;
  const layout = $('#game-layout'), banner = $('#game-status-banner'), board = $('#board-container');
  const evalBar = $('#eval-bar'), boardWrap = $('#board-with-eval'), container = $('#game-container');
  const initialPiece = $('#piece-info-body').innerHTML;

  const piece = (name, dark) => `<svg class="material-piece" viewBox="-5 -15 100 85" aria-hidden="true"><ellipse cx="45" cy="35" rx="42" ry="30" fill="rgb(var(--k-piece-${dark ? 'dark' : 'light'}))" stroke="rgb(var(--k-tile-stroke))" stroke-width="3"/><image${dark ? ' class="inv"' : ''} href="/images/pieces/${name}.svg" x="15" y="5" width="60" height="60"/></svg>`;
  const MATERIAL = { none: [], few: ['soldier', 'soldier', 'knight'], many: ['soldier', 'soldier', 'soldier', 'soldier', 'guard', 'guard', 'bishop', 'knight', 'rook', 'paladin', 'ballista'] };
  const NAMES = { short: ['Engine L3', 'Magnus'], long: ['Alexandrina-Wilhelmina_von_Hohenzollern-Sigmaringen', 'Bartholomew_Featherstonehaugh'] };
  const BANNERS = {
    'your-turn': ['is-your-turn', 'Your turn'], muted: ['is-muted', "Opponent's turn"],
    won: ['is-won', 'You won by checkmate'], lost: ['is-lost', 'You lost on time'],
    drawn: ['is-drawn', 'Draw by agreement'], neutral: ['is-neutral-result', 'Game aborted'],
  };
  const OVER = new Set(['won', 'lost', 'drawn', 'neutral']);
  const MOVES_FULL = $('#move-rows').innerHTML;

  const state = {
    toMove: 'white', flipped: false, evalBar: true, status: 'your-turn', material: 'few', clocks: 'normal',
    names: 'short', ratings: true, badges: 'normal', feedback: true, fullscreen: false, pieceInfo: 'stack',
    moves: 'many', settingsOpen: false, spectator: false, menuOpen: false,
  };

  function apply() {
    const over = OVER.has(state.status);
    layout.classList.toggle('is-flipped', state.flipped);
    $('#board-img').style.transform = state.flipped ? 'rotate(180deg)' : '';
    evalBar.hidden = !state.evalBar;
    evalBar.classList.toggle('is-flipped', state.flipped);
    boardWrap.classList.toggle('has-eval-bar', state.evalBar);

    const [cls, text] = BANNERS[state.status];
    banner.className = 'status-banner ' + cls; banner.textContent = text;
    board.classList.toggle('game-over', over);

    for (const color of ['black', 'white']) {
      const card = $('#player-card-' + color);
      card.classList.toggle('is-to-move', !over && state.toMove === color);
      const clock = $('#clock-' + color);
      clock.hidden = state.clocks === 'hidden';
      clock.classList.toggle('is-active', !over && state.toMove === color);
      clock.classList.toggle('is-low', state.clocks === 'low' && state.toMove === color && !over);
      $('.player-card__rating, .player-card__delta', card);
      card.querySelectorAll('.player-card__rating, .player-card__delta').forEach(e => e.hidden = !state.ratings);
      const nm = $('[data-name]', card); nm.textContent = NAMES[state.names][color === 'black' ? 0 : 1];
      // The side that is ahead keeps the pieces it captured: white's card shows black pieces and vice versa.
      $('#material-' + color).innerHTML = MATERIAL[state.material].map(p => piece(p, color === 'white')).join('')
        + (MATERIAL[state.material].length ? '<span class="material-score">+' + MATERIAL[state.material].length + '</span>' : '');
    }

    const badges = { normal: ['Rated|tag--soft tag--info', '3+2', 'Real time'], none: [], many: ['Rated|tag--soft tag--info', '3+2', 'Real time', 'Engine L3', 'Live evaluation', 'Correspondence 24h'] }[state.badges];
    $('#badges').innerHTML = badges.map(b => { const [t, c] = b.split('|'); return `<span class="tag ${c || ''}">${t}</span>`; }).join('');
    $('#badges').hidden = !badges.length;

    $('#move-rows').innerHTML = state.moves === 'none' ? '<li class="move-list__empty">No moves yet.</li>' : state.moves === 'few' ? MOVES_FULL.split('</li>').slice(0, 2).join('</li>') + '</li>' : MOVES_FULL;
    $('#game-actions').classList.toggle('is-hidden', over || state.spectator);
    $('#feedback-banner').hidden = !state.feedback;

    $('#piece-info-body').innerHTML = state.pieceInfo === 'hint' ? '<p class="piece-info__hint">Hover a piece, or long-press on a phone, to see how it moves.</p>' : state.pieceInfo === 'piece' ? initialPiece.replace(/<ellipse cx="45" cy="15"[\s\S]*?paladin\.svg"[^>]*\/>/, '').replace(/<p class="piece-info__name">Paladin[\s\S]*?<\/ul>\s*/, '') : initialPiece;

    $('#settings-menu').hidden = !state.settingsOpen;
    $('#settings-btn').setAttribute('aria-expanded', state.settingsOpen);
    root.classList.toggle('is-game-fullscreen', state.fullscreen);
    $('#menu').classList.toggle('is-active', state.menuOpen);
    $('#burger').classList.toggle('is-active', state.menuOpen);
    metrics();
  }

  function metrics() {
    const cs = getComputedStyle(container), rem = parseFloat(getComputedStyle(root).fontSize);
    const cw = container.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const mode = cw >= 94 * rem ? 'wide' : cw >= 68 * rem ? 'mid' : 'stacked';
    const b = board.getBoundingClientRect();
    parent.postMessage({ type: 'keres-metrics', viewport: [innerWidth, innerHeight], container: Math.round(cw), mode, board: [Math.round(b.width), Math.round(b.height)], scrollH: document.documentElement.scrollHeight, overflowX: document.documentElement.scrollWidth > innerWidth }, '*');
  }

  window.addEventListener('message', e => { if (e.data && e.data.type === 'keres-state') { Object.assign(state, e.data.state); apply(); } });
  addEventListener('resize', metrics); new ResizeObserver(metrics).observe(container);

  // Stand-alone interactivity.
  $('#burger').addEventListener('click', () => { state.menuOpen = !state.menuOpen; apply(); });
  $('#flip-btn').addEventListener('click', () => { state.flipped = !state.flipped; apply(); parent.postMessage({ type: 'keres-state-changed', state: { flipped: state.flipped } }, '*'); });
  $('#fs-btn').addEventListener('click', () => { state.fullscreen = !state.fullscreen; apply(); parent.postMessage({ type: 'keres-state-changed', state: { fullscreen: state.fullscreen } }, '*'); });
  $('#settings-btn').addEventListener('click', () => { state.settingsOpen = !state.settingsOpen; apply(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && state.fullscreen) { state.fullscreen = false; apply(); parent.postMessage({ type: 'keres-state-changed', state: { fullscreen: false } }, '*'); } });

  const hash = decodeURIComponent(location.hash.replace(/^#state=/, ''));
  if (hash) try { Object.assign(state, JSON.parse(hash)); } catch {}
  apply();
})();
