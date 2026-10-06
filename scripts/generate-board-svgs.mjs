#!/usr/bin/env node
// Regenerates every game SVG shipped by the website from the platform's source artwork.
//
//   node scripts/generate-board-svgs.mjs [path/to/keres-platform/assets]
//
// Inputs  (default ../keres-platform/assets): logo.svg, pieces/icons/*.svg, pieces/texts/*.svg,
//         template.svg (piece base shape + icon transform) and board.css (tile size + colours).
// Outputs (committed, so the site has no runtime/build dependency on the platform):
//   static/logo.svg                      site logo / favicon
//   static/images/pieces/<piece>.svg     monochrome icons used as CSS masks (.piece-icon)
//   static/images/movesets/<Piece>.svg   5x5 move diagrams of the rules page
//   static/images/movesets/Start.svg     starting position of the rules page
//
// Pieces are composed exactly like the platform's sprite (see template.svg), with the CSS variables
// resolved to plain colours so the files render standalone inside an <img>.

import {copyFileSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(process.argv[2] ?? resolve(root, '../keres-platform/assets'));
const out = (p) => resolve(root, p);
const read = (p) => readFileSync(resolve(src, p), 'utf-8');

// --- Board metrics and colours, read from the platform so they cannot drift -----------------------

const boardCss = read('board.css');
const cssValue = (selector, prop) => {
    const block = boardCss.match(new RegExp(`${selector.replace(/[.#]/g, '\\$&')}\\s*\\{([^}]*)\\}`));
    const value = block?.[1].match(new RegExp(`${prop}\\s*:\\s*([^;]+);`))?.[1].trim();
    if (!value) throw new Error(`board.css: ${selector} { ${prop} } not found`);
    return value;
};
const TILE_W = parseFloat(cssValue('.tile', 'width'));
const TILE_H = parseFloat(cssValue('.tile', 'height'));
const TILE_STROKE = cssValue('.tile', 'stroke');
const TILE_STROKE_W = parseFloat(cssValue('.tile', 'stroke-width'));
// board.css: the top-left tile is dark (odd row, first child) and tiles alternate.
const TILE_DARK = boardCss.match(/#board-row-odd \.tile,[^{]*\{\s*fill:\s*([^;]+);/)[1].trim();
const TILE_LIGHT = boardCss.match(/#board-row-even \.tile,[^{]*\{\s*fill:\s*([^;]+);/)[1].trim();
const WHITE = {bg: cssValue('.p-w', '--piece-bg'), fg: cssValue('.p-w', '--piece-fg')};
const BLACK = {bg: cssValue('.p-b', '--piece-bg'), fg: cssValue('.p-b', '--piece-fg')};

// Icon layer transform: single source of truth is template.svg's data-icon-transform attribute.
const template = read('template.svg');
const ICON_TRANSFORM = template.match(/data-icon-transform="([^"]*)"/)[1];
// Piece base shape (symbol "piece-base", drawn in a -45..45 box).
const baseSymbol = template.match(/<symbol id="piece-base"[^>]*>([\s\S]*?)<\/symbol>/)[1];
const ICON_ORIGIN = '45 35'; // .piece-icon transform-origin in board.css
// A piece symbol is a 90x90 viewBox shown in a 100x80 viewport ("meet"): uniform scale, centred in x.
const PIECE_SCALE = Math.min(TILE_W, TILE_H) / 90;
const PIECE_DX = (TILE_W - 90 * PIECE_SCALE) / 2;

const PIECES = ['ballista', 'rook', 'bishop', 'king', 'soldier', 'paladin', 'guard', 'knight'];
const pathData = (svg) => {
    const paths = [...svg.matchAll(/<path\b[^>]*?\sd="([^"]+)"/g)];
    if (paths.length !== 1) throw new Error(`expected exactly one <path>, got ${paths.length}`);
    return paths[0][1];
};
// Icon markup: the path plus any `<use href="#id" transform="…"/>` copies of it (the guard's mirrored axe),
// inlined as paths so the icon needs no id lookup.
const iconShapes = (svg) => {
    const d = pathData(svg);
    const copies = [...svg.matchAll(/<use\b[^>]*?\stransform="([^"]+)"[^>]*?\/>/g)].map((m) => `<path d="${d}" transform="${m[1]}"/>`);
    return `<path d="${d}"/>${copies.join('')}`;
};
const icons = Object.fromEntries(PIECES.map((p) => [p, iconShapes(read(`pieces/icons/${p}.svg`))]));
const texts = Object.fromEntries(PIECES.map((p) => [p, pathData(read(`pieces/texts/${p}.svg`))]));

const num = (n) => String(Math.round(n * 100) / 100);
const writeOut = (p, content) => {
    mkdirSync(dirname(out(p)), {recursive: true});
    writeFileSync(out(p), content);
    console.log(`wrote ${p} (${Math.round(content.length / 1024)} KiB)`);
};

// --- Logo and piece icons ---------------------------------------------------------------------------

copyFileSync(resolve(src, 'logo.svg'), out('static/logo.svg'));
console.log('wrote static/logo.svg');

for (const p of PIECES) {
    // Used as `mask-image`: only the alpha matters, the platform's CSS variable becomes plain black.
    writeOut(
        `static/images/pieces/${p}.svg`,
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-45 -45 90 90">${icons[p]}</svg>\n`,
    );
}

// --- Piece / board composition ------------------------------------------------------------------------

// Only the pieces actually placed in `body` are emitted, so each diagram stays small.
const defs = (body) => {
    const used = [...new Set([...body.matchAll(/href="#([wb]-\w+)"/g)].map((m) => m[1]))];
    let d = '';
    for (const p of new Set(used.map((key) => key.slice(2)))) {
        d += `<g id="icon-${p}">${icons[p]}</g>`;
        d += `<path id="text-${p}" d="${texts[p]}"/>`;
    }
    // One group per piece type and colour. Black pieces face down the board: their icon is turned 180°.
    for (const key of used) {
        const [prefix, p] = key.split('-');
        const [colors, rotation] = prefix === 'w' ? [WHITE, 0] : [BLACK, 180];
        const base = baseSymbol
            .replaceAll('var(--piece-bg)', colors.bg)
            .replaceAll('var(--piece-fg)', colors.fg)
            .replace(/\s+/g, ' ')
            .trim();
        d += `<g id="${prefix}-${p}">`
            + `<g transform="translate(45 45)">${base}</g>`
            + `<g transform="rotate(${rotation} ${ICON_ORIGIN})">`
            + `<use href="#icon-${p}" fill="${colors.fg}" transform="${ICON_TRANSFORM} translate(45 45)"/></g>`
            + `<use href="#text-${p}" fill="${colors.fg}" transform="translate(0 3) scale(${90 / 4000})"/>`
            + `</g>`;
    }
    return `<defs>${d}</defs>`;
};

const tiles = (cols, rows) => {
    let dark = '';
    let light = '';
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const rect = `<rect x="${c * TILE_W}" y="${r * TILE_H}" width="${TILE_W}" height="${TILE_H}"/>`;
            if ((r + c) % 2 === 0) dark += rect; else light += rect;
        }
    }
    return `<g stroke="${TILE_STROKE}" stroke-width="${TILE_STROKE_W}">`
        + `<g fill="${TILE_DARK}">${dark}</g><g fill="${TILE_LIGHT}">${light}</g></g>`;
};

const piece = (key, col, row) =>
    `<use href="#${key}" transform="translate(${num(col * TILE_W + PIECE_DX)} ${num(row * TILE_H)}) scale(${num(PIECE_SCALE)})"/>`;

const svgDoc = (cols, rows, body, title) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cols * TILE_W} ${rows * TILE_H}">`
    + `<title>${title}</title>${defs(body)}${tiles(cols, rows)}${body}</svg>\n`;

// --- Starting position (mirrors keres/src/board.rs Board::new) -----------------------------------------

const BACK_RANK = ['ballista', 'knight', 'paladin', 'guard', 'king', 'guard', 'paladin', 'knight', 'ballista'];
{
    let body = '';
    for (let x = 0; x < 9; x++) {
        body += piece(`b-${BACK_RANK[x]}`, x, 0) + piece('b-soldier', x, 2);
        body += piece('w-soldier', x, 6) + piece(`w-${BACK_RANK[x]}`, x, 8);
    }
    // The white half is the black one rotated by 180°, so its rook and bishop swap columns.
    body += piece('b-rook', 2, 1) + piece('b-bishop', 6, 1);
    body += piece('w-bishop', 2, 7) + piece('w-rook', 6, 7);
    writeOut('static/images/movesets/Start.svg', svgDoc(9, 9, body, 'Keres starting position'));
}

// --- Move diagrams -------------------------------------------------------------------------------------

const ARROW_LIGHT = '#f8f0e6';
const ARROW_OUTLINE = '#1d1610';
const HEAD = 22; // chevron arm length, px
const HEAD_ANGLE = (36 * Math.PI) / 180;

/**
 * Arrow along the tile vector (dx, dy) from `from` to `to`, both expressed in tiles from the piece
 * (fractions allowed). Drawn twice (dark outline, light core) so it reads on both tile colours.
 */
const arrow = (cx, cy, [fx, fy], [tx, ty], dotted = false) => {
    const x0 = cx + fx * TILE_W, y0 = cy + fy * TILE_H;
    const x1 = cx + tx * TILE_W, y1 = cy + ty * TILE_H;
    const a = Math.atan2(y1 - y0, x1 - x0);
    const wing = (s) => `${num(x1 - HEAD * Math.cos(a + s * HEAD_ANGLE))} ${num(y1 - HEAD * Math.sin(a + s * HEAD_ANGLE))}`;
    const shaft = `M${num(x0)} ${num(y0)}L${num(x1)} ${num(y1)}`;
    const head = `M${wing(1)}L${num(x1)} ${num(y1)}L${wing(-1)}`;
    const dots = dotted ? ' stroke-dasharray="0 11"' : '';
    const layer = (stroke, width) =>
        `<path d="${shaft}" stroke="${stroke}" stroke-width="${width}"${dots}/>`
        + `<path d="${head}" stroke="${stroke}" stroke-width="${width}"/>`;
    return `<g fill="none" stroke-linecap="round" stroke-linejoin="round">${layer(ARROW_OUTLINE, 11)}${layer(ARROW_LIGHT, 5)}</g>`;
};

/** Elbow used by the knight: a stem of 2 tiles, then a bar of 1 tile on each side ending in an arrowhead. */
const knightArrows = (cx, cy) => {
    let out = '';
    for (const [sx, sy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
        const [px, py] = [sy !== 0 ? 1 : 0, sx !== 0 ? 1 : 0]; // perpendicular unit tile vector
        const corner = [sx * 2, sy * 2];
        // Stem, drawn as a plain (headless) line by pointing the head back at the corner.
        const stem = `M${num(cx + sx * 0.45 * TILE_W)} ${num(cy + sy * 0.45 * TILE_H)}`
            + `L${num(cx + corner[0] * TILE_W)} ${num(cy + corner[1] * TILE_H)}`;
        const bar = `M${num(cx + (corner[0] - px) * TILE_W)} ${num(cy + (corner[1] - py) * TILE_H)}`
            + `L${num(cx + (corner[0] + px) * TILE_W)} ${num(cy + (corner[1] + py) * TILE_H)}`;
        const line = (stroke, width) => `<path d="${stem}${bar}" stroke="${stroke}" stroke-width="${width}"/>`;
        out += `<g fill="none" stroke-linecap="round" stroke-linejoin="round">${line(ARROW_OUTLINE, 11)}${line(ARROW_LIGHT, 5)}</g>`;
    }
    return out;
};

const ORTHO = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const DIAG = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
const ALL = [...ORTHO, ...DIAG];
/** Arrow reaching tile `k` along direction d: starts 0.45 tile out for k = 1, else just after tile k-1. */
const step = (cx, cy, [dx, dy], k, dotted = false) =>
    arrow(cx, cy, [dx * (k - 0.55), dy * (k - 0.55)], [dx * (k + 0.15), dy * (k + 0.15)], dotted);

const MOVESETS = {
    Ballista: (cx, cy) => step(cx, cy, [0, -1], 1) + step(cx, cy, [0, -1], 2, true),
    Rook: (cx, cy) => ORTHO.map((d) => step(cx, cy, d, 1) + step(cx, cy, d, 2, true)).join(''),
    Bishop: (cx, cy) => DIAG.map((d) => step(cx, cy, d, 1) + step(cx, cy, d, 2, true)).join(''),
    King: (cx, cy) => ALL.map((d) => step(cx, cy, d, 1)).join(''),
    Soldier: (cx, cy) => [[-1, -1], [1, -1]].map((d) => step(cx, cy, d, 1)).join(''),
    Paladin: (cx, cy) => ORTHO.map((d) => step(cx, cy, d, 1) + step(cx, cy, d, 2)).join(''),
    Guard: (cx, cy) => DIAG.map((d) => step(cx, cy, d, 1) + step(cx, cy, d, 2)).join(''),
    Knight: (cx, cy) => knightArrows(cx, cy),
};

for (const [name, arrows] of Object.entries(MOVESETS)) {
    const cx = 2.5 * TILE_W, cy = 2.5 * TILE_H;
    // Knight: arrowheads are added to the bar ends here to keep the stem/bar path simple above.
    let extra = '';
    if (name === 'Knight') {
        for (const [sx, sy] of ORTHO) {
            const [px, py] = [sy !== 0 ? 1 : 0, sx !== 0 ? 1 : 0];
            for (const s of [-1, 1]) {
                const tip = [sx * 2 + s * px, sy * 2 + s * py];
                const from = [sx * 2 + s * px * 0.6, sy * 2 + s * py * 0.6];
                extra += arrow(cx, cy, from, tip);
            }
        }
    }
    writeOut(
        `static/images/movesets/${name}.svg`,
        svgDoc(5, 5, arrows(cx, cy) + extra + piece(`w-${name.toLowerCase()}`, 2, 2), `${name} moves`),
    );
}
