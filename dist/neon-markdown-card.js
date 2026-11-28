/* ── neon-markdown-card v5.1.2 ──
 * Header néon (repris de neon-header-card-v2) + BODY full HTML/Markdown/Jinja.
 *
 *   type: custom:neon-markdown-card
 *   mode: both            # title | body | both
 *   title: { … }          # identique à neon-header-card-v2 (glow/gradient/scanline/…)
 *   body:
 *     format: html        # html | markdown
 *     content: >-         # texte templaté (set/if/for/loop/filtres) — voir moteur ci-dessous
 *       {% for a in state_attr('sensor.x','attackers')|sort(attribute='score',reverse=true) %}
 *         {% if loop.index<=5 %}<div>{{loop.index}}. {{a.ip}} ({{a.score}})</div>{% endif %}
 *       {% endfor %}
 *   shared: { … }         # padding/bg/border/tap_action — identique v2
 *
 * ── MOTEUR DE TEMPLATE (client-side, pas de round-trip serveur) ──
 *   {% set x = expr %}                variables
 *   {% if C %}…{% elif C %}…{% else %}…{% endif %}
 *   {% for x in LISTE %}…{% endfor %} LISTE = littéral [..], objets [{..},{..}],
 *                                      range(...) ou state_attr(...) renvoyant un array
 *   {% macro nom(a, b='def') %}…{% endmacro %}  puis {{ nom(x) }} — v4.8
 *                                      positionnels + valeurs par défaut ; le HTML rendu
 *                                      est sanitisé comme le reste ; récursion coupée à 32
 *                                      kwargs nom=valeur à l'appel — v4.17
 *   {% call m(a) %}…{% endcall %}      le corps = caller() dans m ; {% call(x) m() %} → caller(x)
 *   x[a:b] / x[::-1]                  découpage liste/chaîne — v4.17
 *   x.champ / x.0.champ               notation pointée (objets/index)
 *   loop.index / index0 / first / last / length
 *   {{ expr }}                        + - * / ( ), == != > < >= <=, and/or/not, in,
 *                                      ternaire "A if C else B", ~ (concat)
 *   filtres : round float int abs upper lower title capitalize trim replace truncate
 *             default length thousands first last join reverse sum min max sort map
 *             selectattr list clamp format zfill indent slice
 *             (sort/map/sum/min/max/selectattr acceptent attribute='champ')
 *
 * ── BODY : HTML autorisé ──
 *   DIV SPAN B STRONG I EM U SMALL MARK CODE BR HA-ICON DEL A IMG P HR BLOCKQUOTE
 *   H1-H4 UL OL LI TABLE THEAD TBODY TR TD TH  + SVG (géométrie/présentation)
 *   attrs : style class title aria-label role ; A→href/target/rel ; IMG→src/alt/…
 *   href/src bordés : https:// externe (target=_blank rel=noopener forcés),
 *                     /… interne (nav HA), /local//api//www/ pour IMG. Bloqué :
 *                     javascript:/data:/vbscript:/http nu/protocol-relative.
 *   style : conic/linear/radial-gradient, box-shadow, filter, clip-path, mask,
 *           mix-blend-mode, animation, clamp/calc, cqi, container-type… OK.
 *           url() local (/local, /api, /www, /media, /brand) autorise ;
 *           URLs externes, @import, expression(), javascript:, behavior, binding interdits.
 *
 * Keyframes réutilisables (via animation: inline) :
 *   nmc-flicker nmc-scan-scroll nmc-scan-flicker nmc-card-glitch nmc-icon-glitch
 *   nmc-text-glitch nmc-core-pulse nmc-core-glow nmc-ring-spin nmc-ring-spin-rev
 *   nmc-data-flow nmc-thermo-wave nmc-cell-charge nmc-shimmer nmc-stream-x
 *   nmc-stream-x-rev nmc-pulse-travel nmc-pulse-travel-rev nmc-fiber-glow
 *   nmc-filter-scan nmc-filter-glow nmc-block-flash nmc-pew-flow nmc-blip-pulse
 *   nmc-dash-crawl (défilement de pointillés — SEULE anim sûre sur du SVG : Safari
 *   ignore transform-origin sur les éléments SVG → jamais de rotate/scale sur eux)
 *
 * ── v4.0 ──
 *   <style> COMPLET dans le body (classes, @container, @media) — scopé au shadow DOM.
 *     Ressources CSS locales autorisées ; fallback @keyframes only si URL externe,
 *     @import ou @font-face détecté.
 *   data-entity="sensor.x" sur tout élément HTML/SVG → tap = popup more-info (historique natif).
 *   debug: true (top-level) → les erreurs de template s'affichent sous le body.
 *   history: [{entity, hours}] (top-level) → var `hist['sensor.x']` = {pts,ticks,end,min,max,first,last,n}
 *     pts = polyline normalisée x:0-100 y:0-30, rafraîchie ~5 min via /api/history.
 *     Ex : <svg viewBox="0 0 100 30"><polyline points="{{ hist['sensor.x'].pts }}" …/></svg>
 *   Filtres + : clamp(min,max) · format (mini-printf, args littéraux OU variables) · zfill(n)
 *   Fix moteur : filtres appliqués dans les branches de ternaire, opérandes and/or/not/in/is
 *     et côtés de ~ (avant : silencieusement perdus).
 *   Fix fonts : css2 tente wght@400;500;700 puis famille nue (le 900 manquant cassait tout).
 *
 * ── Maintenance v4.2 ──
 *   Garde-fous template : sortie <= 100000 caracteres, <= 1000 iterations,
 *     profondeur <= 32 pour eviter les rendus trop lourds.
 *   Jinja : constantes true/false/none/null et operateur in avec listes,
 *     chaines, objets et alias d'entites definis par {% set %}.
 *   Performance : les cards ne rerendent plus sur un changement hass sans
 *     rapport avec leurs entites; les expressions dynamiques restent suivies.
 *   Cycle de vie : reconnexion robuste et invalidation des reponses history
 *     devenues obsoletes apres un changement de configuration.
 *   Securite : sources IMG limitees a /local, /api, /www, /media et /brand.
 *
 * ── v4.3 ──
 *   Template : now().hour/minute/second, range() et else dans les boucles for.
 *   Sanitizer : declarations CSS filtrees individuellement et url() locales autorisees.
 *     Balises HTML inconnues deballees pour conserver leurs enfants autorises.
 *
 * ── v4.4 ──
 *   Expressions Home Assistant : acces states.domain.entity.attribut et as_timestamp().
 *
 * ── v4.5 ──
 *   Correctif sanitizer : les proprietes CSS inline standard sont conservees.
 *
 * ── v4.6 ──
 *   Polish : validation des noms de proprietes CSS et garde-fous media responsifs.
 *   Tests : suite navigateur dans neon-markdown-card.test.html.
 *
 * ── v4.9 ──
 *   Macros PARTAGEES entre cards (NMC_SHARED_MACROS_SRC, pres des constantes en tete de
 *   fichier) : disponibles dans le body/title de TOUTES les cards sans redefinition locale.
 *   Fusionnees en own-properties de vars (pas de chaine de prototypes) -> une macro locale
 *   de meme nom l'ecrase sans impacter les autres cards ; aucune fuite inverse possible.
 *   Ajouter une macro partagee = editer NMC_SHARED_MACROS_SRC dans le moteur (pas la config
 *   JSON du dashboard) + bumper NMC_VERSION + pousser un hacstag.
 *
 * ── v4.9.1 (patch, 08/09/2026) ──
 *   fmt_eta (premiere macro partagee, deployee sans test sur le vrai moteur) rendait du
 *   texte litteral en prod. Deux vrais manques moteur corriges : (1) le routage vers
 *   nmcEvalArith exigeait un operateur binaire (plus, moins, fois ou division) dans
 *   l'expression, un "%" isole (ex. "x % 24") ne passait jamais l'evaluateur arithmetique ;
 *   (2) l'appel de macro evaluait ses arguments via nmcEval au lieu de nmcEvalF, donc un
 *   argument filtre chaine (ex. "rd, round(0), int") n'etait jamais applique. 15 cas
 *   mesures sur harnais node (le caractere pipe reste NON supporte dans une expression
 *   arithmetique composee : utiliser floor() plutot que le filtre int dans ce contexte).
 *
 * ── v4.9.2 (08/09/2026) ──
 *   Macro partagee hp_style() : bloc <style> commun aux 12 cards de la vue Heat Plant
 *   (8 regles CSS identiques). Verifie au harnais node qu'un <style> emis par une macro
 *   traverse nmcSanitizeBody intact, et que deux <style> dans un meme body (ce bloc +
 *   un @keyframes local, cas BIAS_SOLVER) coexistent sans conflit.
 *
 * ── v4.9.3 (08/09/2026) ──
 *   Macro partagee tuile(l, v, u, c, e) : motif de tuile (label/valeur/unite/couleur/
 *   entite) identique octet-pour-octet dans 6 cards Heat Plant. Verifie au harnais node :
 *   appel simple hors boucle, appel dans un {% for %} sur une liste de dicts, coexistence
 *   avec hp_style().
 *
 * ── v4.10.1 (07/10/2026) ──
 *   - Éditeur : les carrés de couleur vides montrent la couleur RÉELLEMENT rendue
 *     (défauts CSS résolus), plus #ffffff / #00fff9 en dur.
 *   - letter_spacing : un nombre nu reste en px, une valeur avec unité ou un clamp()
 *     passe tel quel (le parseFloat le cassait) ; champ texte dans l'éditeur.
 *
 * ── v4.9.4 (08/09/2026) ──
 *   Macro partagee spark(hh, ent, label, hex, rgba) : motif de sparkline 24h (legende
 *   min/max/n pts + <svg> a 2 <polyline>) identique octet-pour-octet dans 4 cards Heat
 *   Plant (BIAS_SOLVER, INNER_GRID, MESURES_LIVE, SOLAR_FARM). hh = l'objet deja construit
 *   par la card (hist['entity_id'], expose .min/.max/.n/.pts) : pas eclate en 4 parametres
 *   separes, deja disponible tel quel dans chaque template appelant. Troisieme et derniere
 *   macro du lot Heat Plant.
 *
 * ── v4.12.0 (08/10/2026) ──
 *   data-script="script.x" sur tout élément HTML/SVG → tap = script.turn_on, prioritaire
 *   sur data-entity et le tap_action global. Limité au domaine script : un template ne
 *   peut appeler aucun autre service.
 *
 * ── v4.15.0 (19/10/2026) ──
 *   hist['x'].ticks = [{x, l, m, lab}] : repères horaires toutes les 6 h calés sur l'heure
 *   locale (m = minuit, lab = étiquette affichable, loin du bord droit) ; hist['x'].end = HH:MM
 *   de fin de fenêtre. Calculés avec le même t0/t1 que pts. Macro spark() : pointillés + axe.
 *
 * ── v4.16.0 (26/10/2026) ──
 *   now().strftime('%H:%M') : directives %H %I %M %S %p %d %e %m %y %Y %j %a %A %b %B %u %w %%.
 *   Avant, l'expression sortait en texte brut. Noms de jours/mois dans la langue de hass.
 *
 * ── v4.17.0 (14/11/2026) ──
 *   Macros : kwargs à l'appel (m(1, c=9)) ; argument inconnu signalé en debug.
 *   {% call m(args) %}…{% endcall %} et {% call(x) m(args) %} : le corps devient caller() /
 *     caller(x) dans la macro, évalué dans le scope du site d'appel.
 *   x[a:b] / x[a:b:pas] : découpage Python sur liste ou chaîne (bornes négatives, pas -1).
 *   Filtres : indent(width=4, first=false, blank=false) ; slice(n, fill_with) = Jinja,
 *     découpe en n COLONNES (pour « les n premiers » : x[:n]).
 *
 * ── v4.17.1 (22/11/2026) ──
 *   Bandeau d'en-tête aligné sur NMC_VERSION (posé par stamp_version.py).
 *
 * ── v4.17.2 (22/11/2026) ──
 *   Éditeur : valeurs de config échappées dans value="…" et <textarea> (un corps contenant
 *   </textarea> ou une entité &lt; ne casse plus le formulaire ni ne se décode à la réouverture).
 *
 * ── v4.17.3 (23/11/2026) ──
 *   history : option `step: true` (valeur tenue en marches, prolongée jusqu'à maintenant).
 *
 * ── v4.19.0 (23/11/2026) ──
 *   data-step="<entity_id>|<delta>" : un tap règle un number/input_number de ±delta (set_value,
 *   borné min/max, arrondi au pas de l'entité). Prioritaire sur data-toggle et data-entity.
 * ── v4.18.0 (23/11/2026) ──
 *   data-toggle="<entity_id>" : un tap appelle homeassistant.toggle (prioritaire sur data-entity).
 *
 * ── v4.19.1 (27/11/2026) ──
 *   data-toggle / data-step passent enfin le sanitizer (ils étaient retirés : taps sans effet).
 *   Un tap ne commande que des entités écrites en clair dans body.content (un id venu de l'état
 *   d'une entité est ignoré) ; data-step limité à number/input_number.
 *
 * ── v5.0.0 (27/11/2026) ── CHANGEMENT CASSANT
 *   {{ expr }} est échappé par défaut : un état, un attribut ou une variable qui contient du
 *   HTML s'affiche en texte. Pour du HTML voulu : filtre |safe, ou une macro (sa sortie reste
 *   du HTML, ses {{ }} internes restent échappés).
 *   Le body nettoyé est inséré en nœuds DOM, sans re-sérialiser puis re-parser (mutation XSS).
 *   <style>, <script> et <foreignObject> dans un SVG, et tout élément hors HTML/SVG (MathML),
 *   sont retirés avec leur contenu au lieu d'être dépliés.
 *
 * ── v5.0.1 (27/11/2026) ──
 *   Titre rendu sans échappement (il est posé par textContent) : « Tom & Jerry » ou une
 *   apostrophe ne s'affichent plus en &amp; / &#39; dans le header.
 *
 * ── v5.1.0 (28/11/2026) ── moteur Jinja réécrit (lexer → AST → évaluateur)
 *   Sorties alignées sur le Jinja de HA (vérifiées sur /api/template) :
 *   - booléens réels, affichés True / False (avant : 1 / 0) ; l'arithmétique reste 1 / 0 ;
 *   - round : valeur de Python (égalité exacte → chiffre pair : 85.25 → 85.2), n décimales fixes
 *     conservées à l'affichage (1.20, 0.00) ; round() en fonction suit la même règle ;
 *   - tuples affichés (a, b) (items(), dictsort) ; none|string → None ; 'fmt' % x en printf ;
 *   - truncate à la Jinja (length 255, killwords, end '...', leeway 5).
 *   Chaîne "False" fausse en condition (booléen sorti en texte par une macro ou un set-bloc).
 *   Dépendances : is_state_attr, has_value et les ids passés par variable déclenchent le rendu.
 *   Tolérances gardées : opérations invalides et entités absentes rendent une valeur au lieu
 *   d'une erreur ; none et undefined s'affichent vide ; 6/3 → 2.
 *
 * ── v5.1.1 (28/11/2026) ──
 *   append / extend / insert / pop / update ne modifient que les listes et dicts créés par le
 *   template : ceux d'une entité sont les objets de hass.states, partagés par tout le frontend
 *   (la modification se cumulait à chaque rendu). Copie d'abord avec |list ou dict(x).
 *   {% filter %} s'applique au texte et non à ses entités HTML (truncate coupait « &lt; » en « &l »).
 *   « macro is callable » → True.
 *
 * ── v5.1.2 (28/11/2026) ──
 *   Les listes neuves rendues par un filtre (sort, select, map…), une méthode (split, keys…) ou
 *   range/expand/zip redeviennent modifiables : la 5.1.1 n'en marquait que trois sortes.
 */

const NMC_VERSION = "5.1.2";

// Valeur de config remise dans le HTML de l'éditeur (attribut ou <textarea>) : échappée pour qu'elle ressorte à l'identique.
function nmcEscAttr(v) { return String(v ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
const NMC_MAX_TEMPLATE_OUTPUT = 100000;
const NMC_MAX_TEMPLATE_ITERATIONS = 1000;
const NMC_MAX_TEMPLATE_DEPTH = 32;

// ── Macros partagees entre cards (v4.9) ──────────────────────────
// Bibliotheque de {% macro %} disponibles dans TOUTES les cards, sans avoir a les
// redefinir dans chaque body/title. Definie ici (code du moteur), pas dans la config
// JSON du dashboard, sinon on retombe sur "dupliquer le texte dans chaque card".
// Ajouter une macro partagee = editer NMC_SHARED_MACROS_SRC + bumper NMC_VERSION +
// pousser un hacstag (edition du .js, pas juste de la config).
// fmt_eta : floor() et "%" suivent Python (reste du signe du diviseur), comme HA.
// hp_style : bloc <style> commun aux 12 cards de la vue Heat Plant (8 regles CSS
// identiques : .tb .hz .tb-l .sec .tile .lbl .tv .tu). Un <style> emis par une macro
// traverse nmcSanitizeBody intact, et deux <style> dans un meme body (ce bloc + un
// @keyframes local) coexistent sans conflit. Zero parametre, pure emission de texte, zero risque arithmetique.
// tuile(l, v, u, c, e, p=none) : tuile holo (grille teintee, 4 equerres) label/valeur/unite/couleur/entite. p optionnel (0-100) = barre de niveau,
// a borner par l'appelant ; absent = pas de barre. Pure emission de texte.
// spark(hh, ent, label, hex, rgba) : motif de sparkline 24h (legende min/max/n pts +
// <svg> a 2 <polyline>, aire + trait). hh = l'objet hist['entity_id'] deja construit par
// la card (expose .min/.max/.n/.pts), disponible tel quel via {% set hh = hist['x'] %}.
// hex et rgba restent deux parametres distincts : le moteur n'expose aucune conversion
// hex->rgb native, donc rgba doit etre fourni separement. A appeler TOUJOURS a
// l'interieur d'un {% if hist['x'] is defined %} (historique pas encore charge).
const NMC_SHARED_MACROS_SRC = `
{% macro fmt_eta(base_min, minutes) %}{% set total = base_min + minutes %}{% set h = floor(total / 60) % 24 %}{% set m = total % 60 %}{{ h|zfill(2) }}:{{ m|zfill(2) }}{% endmacro %}
{% macro hp_style() %}<style>.tb{display:flex;align-items:center;gap:8px;margin:2px 0 10px;}.hz{height:7px;flex:0 0 44px;background:repeating-linear-gradient(-45deg,rgba(255,179,0,.8) 0 6px,transparent 6px 12px);}.tb-l{font-size:10px;letter-spacing:2.5px;color:rgba(184,197,214,.66);}.sec{font-size:10px;letter-spacing:2px;color:rgba(184,197,214,.66);margin:0 0 5px;}.tile{background:rgba(13,18,30,.55);border:1px solid rgba(140,170,200,.16);padding:7px 4px;text-align:center;}.lbl{font-size:10px;letter-spacing:1px;color:rgba(184,197,214,.66);white-space:nowrap;overflow:hidden;}.tv{font-size:16px;font-weight:700;font-family:Consolas,monospace;color:#fff;}.tu{font-size:11px;color:rgba(184,197,214,.66);}</style>{% endmacro %}
{% macro tuile(l, v, u, c, e, p=none) %}<div class="nmc-tile" data-entity="{{ e }}" style="position:relative;overflow:hidden;padding:6px 4px 7px;text-align:center;background:linear-gradient(color-mix(in srgb, {{ c }} 9%, transparent) 1px,transparent 1px) 0 0/100% 8px,linear-gradient(90deg,color-mix(in srgb, {{ c }} 9%, transparent) 1px,transparent 1px) 0 0/8px 100%,radial-gradient(100% 90% at 50% 100%, color-mix(in srgb, {{ c }} 18%, transparent), rgba(6,8,16,.85) 75%);border:1px solid color-mix(in srgb, {{ c }} 25%, transparent);box-shadow:inset 0 0 18px -6px {{ c }};">
      <span style="position:absolute;top:2px;left:2px;width:8px;height:8px;border-top:1.5px solid {{ c }};border-left:1.5px solid {{ c }};"></span><span style="position:absolute;top:2px;right:2px;width:8px;height:8px;border-top:1.5px solid {{ c }};border-right:1.5px solid {{ c }};"></span>
      <span style="position:absolute;bottom:2px;left:2px;width:8px;height:8px;border-bottom:1.5px solid {{ c }};border-left:1.5px solid {{ c }};"></span><span style="position:absolute;bottom:2px;right:2px;width:8px;height:8px;border-bottom:1.5px solid {{ c }};border-right:1.5px solid {{ c }};"></span>
      <div class="lbl" style="color:{{ c }};opacity:.8;letter-spacing:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ l }}</div>
      <div class="tv" style="font-size:20px;white-space:nowrap;color:{{ c }};text-shadow:0 0 6px {{ c }},0 0 16px color-mix(in srgb, {{ c }} 60%, transparent);">{{ v }}<span class="tu" style="margin-left:3px;font-size:10px;">{{ u }}</span></div>
      {% if p is not none %}<div style="margin:5px 6px 0;height:3px;background:rgba(140,170,200,.12);"><div style="width:{{ p }}%;height:100%;background:linear-gradient(90deg,color-mix(in srgb, {{ c }} 30%, transparent),{{ c }});box-shadow:0 0 6px {{ c }};"></div></div>{% endif %}
    </div>{% endmacro %}
{% macro spark(hh, ent, label, hex, rgba) %}<div class="sec" style="margin-top:12px;">{{ label }} — 24H — min {{ hh.min|round(1) }} · max {{ hh.max|round(1) }} · {{ hh.n }} pts</div>
  <svg viewBox="0 0 100 30" preserveAspectRatio="none" style="width:100%;height:36px;display:block;" data-entity="{{ ent }}">
    {% for t in hh.ticks %}{% if t.m %}<line x1="{{ t.x }}" y1="0" x2="{{ t.x }}" y2="30" stroke="rgba(160,180,200,.35)" stroke-width="1" vector-effect="non-scaling-stroke"/>{% else %}<line x1="{{ t.x }}" y1="0" x2="{{ t.x }}" y2="30" stroke="rgba(160,180,200,.18)" stroke-width="1" stroke-dasharray="2 2" vector-effect="non-scaling-stroke"/>{% endif %}{% endfor %}
    <polyline points="0,30 {{ hh.pts }} 100,30" fill="rgba({{ rgba }},.09)" stroke="none"/>
    <polyline points="{{ hh.pts }}" fill="none" stroke="{{ hex }}" stroke-width="1" vector-effect="non-scaling-stroke" style="filter:drop-shadow(0 0 3px {{ hex }});"/>
  </svg>
  <div style="position:relative;height:11px;margin-top:2px;font-size:8px;line-height:11px;letter-spacing:1px;color:rgba(160,180,200,.6);">{% for t in hh.ticks %}{% if t.lab %}<span style="position:absolute;left:{{ t.x }}%;transform:translateX(-50%);{% if t.m %}color:rgba(200,215,230,.85);{% endif %}">{{ t.l }}</span>{% endif %}{% endfor %}<span style="position:absolute;right:0;color:{{ hex }};">{{ hh.end }}</span></div>{% endmacro %}
`;

// ── Device detection ─────────────────────────────────────────────
const NMC_IS_IPAD =
  /iPad/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const NMC_IS_LOW_POWER =
  NMC_IS_IPAD || /iPhone|iPad|iPod|Android|Mobile|HomeAssistant/i.test(navigator.userAgent);

// ── Google Fonts ─────────────────────────────────────────────────
const NMC_FONTS = [
  "Rajdhani",
  "Orbitron",
  "Share Tech Mono",
  "Exo 2",
  "Roboto",
  "Montserrat",
  "Oswald",
  "Bebas Neue",
  "Inter",
  "Poppins",
  "Space Grotesk",
  "Syne",
  "DM Sans",
  "Playfair Display",
  "Cinzel",
];
const _nmcFontLoaded = new Set();
function nmcLoadFont(family) {
  if (!family || _nmcFontLoaded.has(family)) return;
  const id = `nmc-font-${family.replace(/\s/g, "-")}`;
  if (document.getElementById(id)) {
    _nmcFontLoaded.add(family);
    return;
  }
  ["https://fonts.googleapis.com", "https://fonts.gstatic.com"].forEach((href) => {
    if (!document.querySelector(`link[rel=preconnect][href="${href}"]`)) {
      const l = document.createElement("link");
      l.rel = "preconnect";
      l.href = href;
      if (href.includes("gstatic")) l.crossOrigin = "anonymous";
      document.head.appendChild(l);
    }
  });
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  // css2 renvoie une 400 si UNE graisse manque (Rajdhani/Chakra Petch sans 900) →
  // set raisonnable d'abord, famille nue (400) en secours.
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;500;700&display=swap`;
  link.onerror = () => {
    link.onerror = null;
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&display=swap`;
  };
  document.head.appendChild(link);
  _nmcFontLoaded.add(family);
}

/* ══════════════════════════════════════════════════════════════════
 *  MOTEUR DE TEMPLATE — lexer → parseur (AST) → évaluateur, sémantique Jinja2
 * ════════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════════
 *  MOTEUR DE TEMPLATE — lexer → arbre syntaxique → évaluateur
 *  Grammaire et priorités calquées sur Jinja2 ; valeurs adaptées au navigateur.
 * ════════════════════════════════════════════════════════════════ */

// Sortie {{ }} échappée par défaut (comme l'autoescape de Jinja) : un état ou un attribut
// d'entité ne doit jamais devenir du HTML. Restent bruts : la sortie d'une macro / d'un
// {% call %} (HTML écrit par l'auteur du body) et le filtre explicite |safe.
class NmcSafe {
  constructor(s) { this.s = s; }
  toString() { return this.s; }
}
// Titre : posé par textContent, qui ne crée jamais de balise ; l'échapper afficherait &amp;.
let _nmcRawOut = false;
function nmcEscStr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function nmcEscOut(v) {
  if (v instanceof NmcSafe) return v.s;
  if (_nmcRawOut) return nmcToStr(v);
  return nmcEscStr(nmcToStr(v));
}

// Variable inconnue : imprime "", fausse, `is defined` faux, remplacée par |default.
const NMC_UNDEF = Object.freeze({ nmcUndef: true });

// Date : instant + drapeau UTC (now() est local, utcnow() UTC), imprimée comme Python.
class NmcDT {
  constructor(ms, utc) { this.ms = ms; this.utc = !!utc; }
}
// Durée (différence de deux dates, timedelta()) en secondes.
class NmcTD {
  constructor(s) { this.s = s; }
}

const _p2 = (n) => String(n).padStart(2, "0");
function nmcDtParts(dt) {
  const d = new Date(dt.ms), u = dt.utc;
  return {
    y: u ? d.getUTCFullYear() : d.getFullYear(), mo: (u ? d.getUTCMonth() : d.getMonth()) + 1,
    d: u ? d.getUTCDate() : d.getDate(), h: u ? d.getUTCHours() : d.getHours(),
    mi: u ? d.getUTCMinutes() : d.getMinutes(), s: u ? d.getUTCSeconds() : d.getSeconds(),
    ms: u ? d.getUTCMilliseconds() : d.getMilliseconds(),
    wd: u ? d.getUTCDay() : d.getDay(), off: u ? 0 : -d.getTimezoneOffset(),
  };
}
function nmcTzStr(off, colon) {
  const a = Math.abs(off);
  return (off < 0 ? "-" : "+") + _p2(Math.floor(a / 60)) + (colon ? ":" : "") + _p2(a % 60);
}
function nmcDtStr(dt, sep) {
  const p = nmcDtParts(dt);
  const frac = p.ms ? "." + String(p.ms * 1000).padStart(6, "0") : "";
  return `${p.y}-${_p2(p.mo)}-${_p2(p.d)}${sep || " "}${_p2(p.h)}:${_p2(p.mi)}:${_p2(p.s)}${frac}${nmcTzStr(p.off, true)}`;
}
function nmcTdStr(td) {
  let s = Math.round(td.s), neg = s < 0;
  if (neg) s = -s;
  const days = Math.floor(s / 86400), r = s % 86400;
  const hms = `${Math.floor(r / 3600)}:${_p2(Math.floor((r % 3600) / 60))}:${_p2(r % 60)}`;
  return (neg ? "-" : "") + (days ? `${days} day${days > 1 ? "s" : ""}, ` : "") + hms;
}

// Dates HA ("2026-11-28T14:00:00.123456+00:00") : Safari refuse plus de 3 décimales
// et l'espace entre date et heure.
function nmcParseDate(s) {
  if (typeof s !== "string") return NaN;
  const t = s.trim().replace(/^(\d{4}-\d{2}-\d{2}) (\d)/, "$1T$2").replace(/(\.\d{3})\d+/, "$1");
  return Date.parse(t);
}

// Listes/dicts créés par le template. Les autres viennent de hass.states (partagés).
const _nmcOwned = new WeakSet();
function _nmcOwn(o) { _nmcOwned.add(o); return o; }
// Conteneurs neufs rendus par un filtre/une méthode/une fonction : modifiables comme en Jinja.
// Le contrôle « v !== src » écarte les filtres qui rendent leur entrée telle quelle (map sans argument).
const NMC_FRESH_FILTERS = new Set(["slice", "batch", "reverse", "sort", "unique", "dictsort", "items", "groupby",
  "map", "selectattr", "rejectattr", "select", "reject", "regex_findall", "from_json"]);
const NMC_FRESH_METHODS = new Set(["split", "rsplit", "splitlines", "items", "keys", "values"]);
const NMC_FRESH_FUNCS = new Set(["range", "expand", "zip"]);
// Profondeur : slice/batch créent aussi les sous-listes ; from_json crée tout l'arbre.
// groupby : seuls le groupe et sa liste sont neufs, la clé (grouper) peut venir d'une entité.
const NMC_FRESH_DEPTH = { slice: 1, batch: 1, from_json: 64 };
function _nmcFresh(v, src, depth) {
  if (v === src || !(Array.isArray(v) || nmcIsPlain(v)) || _nmcOwned.has(v)) return v;
  _nmcOwn(v);
  if (depth > 0) for (const c of Array.isArray(v) ? v : Object.values(v)) _nmcFresh(c, src, depth - 1);
  return v;
}
function _nmcMutable(o) {
  if (!_nmcOwned.has(o)) throw new Error(_t("valeur d'entité en lecture seule : copie-la avec |list ou dict()"));
}
function nmcIsPlain(o) {
  if (o === null || typeof o !== "object" || Array.isArray(o)) return false;
  const p = Object.getPrototypeOf(o);
  return p === null || p === Object.prototype;
}

const NMC_TUPLE = Symbol("tuple");
function nmcTup(a) { a[NMC_TUPLE] = true; return a; }
function nmcRepr(v, depth) {
  if (v === NMC_UNDEF || v == null) return "None";
  if (v instanceof NmcSafe) v = v.s;
  if (typeof v === "string") return "'" + v.replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
  if (v === true) return "True";
  if (v === false) return "False";
  if ((depth || 0) > 8) return "...";
  if (Array.isArray(v)) {
    const body = v.map((x) => nmcRepr(x, (depth || 0) + 1)).join(", ");
    return v[NMC_TUPLE] ? "(" + body + (v.length === 1 ? ",)" : ")") : "[" + body + "]";
  }
  if (nmcIsPlain(v))
    return "{" + Object.keys(v).map((k) => nmcRepr(k) + ": " + nmcRepr(v[k], (depth || 0) + 1)).join(", ") + "}";
  return nmcToStr(v);
}

// round() de Python : arrondi correct sur la valeur binaire exacte, égalité exacte → chiffre pair.
// toFixed arrondit déjà sur la valeur exacte mais tranche les égalités vers le haut ; on ne
// corrige que ce cas, repéré sur le développement décimal exact (toFixed(100)).
function nmcRoundEven(x, d) {
  if (!isFinite(x) || Math.abs(x) >= 1e21) return x;
  const r = Number(x.toFixed(d));
  const ex = Math.abs(x).toFixed(100), dot = ex.indexOf(".");
  const tail = ex.slice(dot + 1 + d);
  if (!/^50*$/.test(tail)) return r;
  const digits = (ex.slice(0, dot) + ex.slice(dot + 1, dot + 1 + d)).replace(/^0+/, "") || "0";
  if (+digits[digits.length - 1] % 2 === 0) return Math.sign(x) * Number(digits) / Math.pow(10, d);
  return r;
}

function nmcToStr(v) {
  if (v == null || v === NMC_UNDEF) return "";
  if (v instanceof NmcSafe) return v.s;
  if (v instanceof NmcDT) return nmcDtStr(v);
  if (v instanceof NmcTD) return nmcTdStr(v);
  if (Array.isArray(v) || nmcIsPlain(v)) return nmcRepr(v);
  if (typeof v === "object") return "";
  if (typeof v === "boolean") return v ? "True" : "False";
  return String(v);
}

// Chaînes fausses : souplesse HA pour les états ("off", "unknown"…) et un booléen sorti en texte
// par une macro ou un set-bloc ("False"), qui serait vrai en Python.
const NMC_FALSY_STR = new Set(["0", "off", "false", "False", "unavailable", "unknown", "None", ""]);
function nmcTruthy(v) {
  if (v === NMC_UNDEF || v == null || v === false) return false;
  if (typeof v === "number") return v !== 0 && !isNaN(v);
  if (v instanceof NmcSafe) v = v.s;
  if (typeof v === "string") return !NMC_FALSY_STR.has(v);
  if (Array.isArray(v)) return v.length > 0;
  if (v instanceof NmcDomain) return v.list().length > 0;
  if (v instanceof NmcTD) return v.s !== 0;
  if (nmcIsPlain(v)) return Object.keys(v).length > 0;
  return true;
}

// Nombre "souple" : parseFloat, NaN → 0, booléen → 1/0 (True + 1 = 2 comme en Python), date → secondes.
function nmcNum(v) {
  if (typeof v === "number") return isNaN(v) ? 0 : v;
  if (v === true) return 1;
  if (v instanceof NmcSafe) v = v.s;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }
  if (v instanceof NmcDT) return v.ms / 1000;
  if (v instanceof NmcTD) return v.s;
  return 0;
}
const _nmcNumRe = /^\s*[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?\s*$/;
function nmcNumLike(v) {
  if (v instanceof NmcSafe) v = v.s;
  return typeof v === "number" || typeof v === "boolean" || (typeof v === "string" && _nmcNumRe.test(v));
}
function nmcEq(a, b) {
  if (a instanceof NmcSafe) a = a.s;
  if (b instanceof NmcSafe) b = b.s;
  const na = a === NMC_UNDEF || a == null, nb = b === NMC_UNDEF || b == null;
  if (na || nb) return na && nb;
  if (nmcNumLike(a) && nmcNumLike(b)) return nmcNum(a) === nmcNum(b);
  if (Array.isArray(a) && Array.isArray(b))
    return a.length === b.length && a.every((x, i) => nmcEq(x, b[i]));
  if (a instanceof NmcDT && b instanceof NmcDT) return a.ms === b.ms;
  if (typeof a === "object" || typeof b === "object") return a === b;
  return String(a) === String(b);
}
// Ordre : numérique si les deux côtés se lisent comme des nombres, sinon alphabétique.
function nmcOrd(a, b) {
  if (a instanceof NmcSafe) a = a.s;
  if (b instanceof NmcSafe) b = b.s;
  const fa = typeof a === "boolean" || a instanceof NmcDT || a instanceof NmcTD ? nmcNum(a) : parseFloat(a);
  const fb = typeof b === "boolean" || b instanceof NmcDT || b instanceof NmcTD ? nmcNum(b) : parseFloat(b);
  if (!isNaN(fa) && !isNaN(fb)) return fa < fb ? -1 : fa > fb ? 1 : 0;
  const sa = nmcToStr(a), sb = nmcToStr(b);
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}
function nmcIn(x, c) {
  if (c instanceof NmcSafe) c = c.s;
  if (Array.isArray(c)) return c.some((y) => nmcEq(y, x));
  if (typeof c === "string") return c.includes(nmcToStr(x));
  if (c instanceof NmcDomain) return c.list().some((s) => s.entity_id === nmcToStr(x) || s.object_id === nmcToStr(x));
  if (nmcIsPlain(c)) return Object.prototype.hasOwnProperty.call(c, nmcToStr(x));
  return false;
}

/* ── États HA exposés comme dans Jinja : states.sensor.x.state, for s in states.light ── */
const _nmcStWrap = new WeakMap();
function nmcWrapState(s) {
  if (!s || typeof s !== "object") return NMC_UNDEF;
  let w = _nmcStWrap.get(s);
  if (!w) {
    const eid = String(s.entity_id || "");
    const dot = eid.indexOf(".");
    const attrs = s.attributes || {};
    w = {
      entity_id: eid, state: s.state, attributes: attrs,
      last_changed: s.last_changed, last_updated: s.last_updated || s.last_changed,
      last_reported: s.last_reported || s.last_updated || s.last_changed,
      domain: eid.slice(0, dot), object_id: eid.slice(dot + 1),
      name: attrs.friendly_name != null ? attrs.friendly_name : eid.slice(dot + 1),
    };
    _nmcStWrap.set(s, w);
  }
  return w;
}
class NmcStatesRoot {
  constructor(hass) { this.hass = hass; }
  get(k) {
    k = nmcToStr(k);
    if (k.includes(".")) return nmcWrapState(this.hass.states && this.hass.states[k]);
    return new NmcDomain(this.hass, k);
  }
  list() {
    const all = this.hass.states || {};
    return Object.keys(all).sort().map((k) => nmcWrapState(all[k]));
  }
}
class NmcDomain {
  constructor(hass, domain) { this.hass = hass; this.domain = domain; this._l = null; }
  get(k) {
    return nmcWrapState(this.hass.states && this.hass.states[this.domain + "." + nmcToStr(k)]);
  }
  list() {
    if (!this._l) {
      const all = this.hass.states || {}, pre = this.domain + ".";
      this._l = Object.keys(all).filter((k) => k.startsWith(pre)).sort().map((k) => nmcWrapState(all[k]));
    }
    return this._l;
  }
}

class NmcLoop {
  constructor(i, len, list, depth) {
    this.index = i + 1; this.index0 = i;
    this.revindex = len - i; this.revindex0 = len - i - 1;
    this.first = i === 0; this.last = i === len - 1; this.length = len;
    this.previtem = i > 0 ? list[i - 1] : NMC_UNDEF;
    this.nextitem = i < len - 1 ? list[i + 1] : NMC_UNDEF;
    this.depth = depth; this.depth0 = depth - 1;
  }
}

// Recherche d'un nom dans la chaîne de scopes (Object.create) sans jamais lire Object.prototype.
function nmcLookupRaw(vars, name) {
  let o = vars;
  while (o && o !== Object.prototype) {
    if (Object.prototype.hasOwnProperty.call(o, name)) return o[name];
    o = Object.getPrototypeOf(o);
  }
  return undefined;
}
const NMC_CONSTS = { pi: Math.PI, e: Math.E, tau: 2 * Math.PI, inf: Infinity };

// Attribut / indice : propriétés propres seulement (pas de __proto__, constructor...).
function nmcAttr(o, k) {
  if (o === NMC_UNDEF || o == null) return NMC_UNDEF;
  if (o instanceof NmcSafe) o = o.s;
  if (o instanceof NmcStatesRoot || o instanceof NmcDomain) return o.get(k);
  if (o instanceof NmcDT) {
    const p = nmcDtParts(o);
    const m = { year: p.y, month: p.mo, day: p.d, hour: p.h, minute: p.mi, second: p.s, microsecond: p.ms * 1000 };
    return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : NMC_UNDEF;
  }
  if (o instanceof NmcTD) {
    if (k === "days") return Math.floor(o.s / 86400);
    if (k === "seconds") return Math.floor(o.s - Math.floor(o.s / 86400) * 86400);
    return NMC_UNDEF;
  }
  if (Array.isArray(o) || typeof o === "string") {
    if (typeof k === "number" || /^-?\d+$/.test(String(k))) {
      let i = Math.trunc(Number(k));
      if (i < 0) i += o.length;
      return i >= 0 && i < o.length ? o[i] : NMC_UNDEF;
    }
    if (Array.isArray(o) && k !== "length" && Object.prototype.hasOwnProperty.call(o, k)) return o[k];
    return NMC_UNDEF;
  }
  if (typeof o === "object") {
    k = typeof k === "string" ? k : nmcToStr(k);
    if (!Object.prototype.hasOwnProperty.call(o, k)) return NMC_UNDEF;
    return o[k] === undefined ? NMC_UNDEF : o[k];
  }
  return NMC_UNDEF;
}
// Chemin pointé pour selectattr / map / sort(attribute='a.b').
function nmcPath(o, path) {
  for (const seg of String(path).split(".")) o = nmcAttr(o, seg);
  return o;
}

// Découpe façon Python (algorithme de slice.indices).
function nmcSlice(seq, start, stop, step) {
  if (seq instanceof NmcSafe) seq = seq.s;
  const isStr = typeof seq === "string";
  const arr = isStr ? Array.from(seq) : Array.isArray(seq) ? seq : null;
  if (!arr) return NMC_UNDEF;
  const len = arr.length;
  step = step == null || step === NMC_UNDEF ? 1 : Math.trunc(nmcNum(step)) || 1;
  const norm = (v, def, lo, hi) => {
    if (v == null || v === NMC_UNDEF) return def;
    v = Math.trunc(nmcNum(v));
    if (v < 0) v += len;
    return Math.max(lo, Math.min(hi, v));
  };
  let a, b;
  if (step > 0) { a = norm(start, 0, 0, len); b = norm(stop, len, 0, len); }
  else { a = norm(start, len - 1, -1, len - 1); b = norm(stop, -1, -1, len - 1); }
  const out = [];
  for (let i = a; step > 0 ? i < b : i > b; i += step) {
    out.push(arr[i]);
    if (out.length > NMC_MAX_TEMPLATE_OUTPUT) break;
  }
  return isStr ? out.join("") : out;
}

/* ── Lexer du template : texte, {{ }}, {% %}, {# #} ── */
// La fermeture ne compte qu'hors chaîne et hors crochets : {{ {'a': 1} }} reste une seule balise.
function nmcScanClose(text, k, close) {
  let depth = 0, q = "";
  for (let p = k; p < text.length; p++) {
    const c = text[p];
    if (q) {
      if (c === "\\") p++;
      else if (c === q) q = "";
      continue;
    }
    if (c === "'" || c === '"') q = c;
    else if (depth === 0 && c === close[0] && text[p + 1] === close[1]) return p;
    else if (c === "(" || c === "[" || c === "{") depth++;
    else if ((c === ")" || c === "]" || c === "}") && depth > 0) depth--;
  }
  return text.indexOf(close, k);
}

function nmcLexTemplate(text) {
  const toks = [];
  let i = 0, last = 0;
  const pushText = (s) => { if (s) toks.push({ t: "text", s }); };
  while (i < text.length) {
    const j = text.indexOf("{", i);
    if (j < 0 || j + 1 >= text.length) break;
    const c2 = text[j + 1];
    if (c2 !== "{" && c2 !== "%" && c2 !== "#") { i = j + 1; continue; }
    const close = c2 === "{" ? "}}" : c2 === "%" ? "%}" : "#}";
    let k = j + 2, lstrip = false;
    if (text[k] === "-") { lstrip = true; k++; } else if (text[k] === "+") k++;
    const end = c2 === "#" ? text.indexOf("#}", k) : nmcScanClose(text, k, close);
    if (end < 0) { i = j + 2; continue; }
    let inner = text.slice(k, end), rstrip = false;
    if (inner.endsWith("-")) { rstrip = true; inner = inner.slice(0, -1); }
    else if (inner.endsWith("+")) inner = inner.slice(0, -1);
    pushText(text.slice(last, j));
    last = i = end + 2;
    const t = c2 === "{" ? "out" : c2 === "%" ? "tag" : "cmt";
    toks.push({ t, s: inner, lstrip, rstrip });
    // {% raw %} … {% endraw %} : contenu recopié tel quel
    if (t === "tag" && inner.trim() === "raw") {
      const re = /\{%(-?)\s*endraw\s*(-?)%\}/g;
      re.lastIndex = last;
      const m = re.exec(text);
      const stop = m ? m.index : text.length;
      let body = text.slice(last, stop);
      if (rstrip) body = body.replace(/^\s+/, "");
      if (m && m[1]) body = body.replace(/\s+$/, "");
      toks.pop();
      if (lstrip && toks.length && toks[toks.length - 1].t === "text")
        toks[toks.length - 1].s = toks[toks.length - 1].s.replace(/\s+$/, "");
      toks.push({ t: "text", s: body, raw: true });
      last = i = m ? m.index + m[0].length : text.length;
      if (m && m[2]) toks.push({ t: "cmt", s: "", lstrip: false, rstrip: true });
    }
  }
  pushText(text.slice(last));
  // contrôle des blancs {%- -%} : retire les blancs du texte voisin
  for (let n = 0; n < toks.length; n++) {
    const tk = toks[n];
    if (tk.t === "text") continue;
    if (tk.lstrip && n > 0 && toks[n - 1].t === "text" && !toks[n - 1].raw) toks[n - 1].s = toks[n - 1].s.replace(/\s+$/, "");
    if (tk.rstrip && n + 1 < toks.length && toks[n + 1].t === "text" && !toks[n + 1].raw) toks[n + 1].s = toks[n + 1].s.replace(/^\s+/, "");
  }
  return toks;
}

/* ── Lexer d'expression ── */
const NMC_OPS = ["**", "//", "==", "!=", "<=", ">=", "<", ">", "+", "-", "*", "/", "%", "~",
  "(", ")", "[", "]", "{", "}", ",", ":", ".", "|", "="];
const NMC_ESC = { n: "\n", t: "\t", r: "\r", "\\": "\\", "'": "'", '"': '"', "0": "\0" };
function nmcLexExpr(s) {
  const t = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === " " || c === "\n" || c === "\t" || c === "\r") { i++; continue; }
    if (c >= "0" && c <= "9") {
      const m = /^\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][-+]?\d+)?/.exec(s.slice(i));
      t.push({ k: "num", v: Number(m[0].replace(/_/g, "")) });
      i += m[0].length;
      continue;
    }
    if (c === "'" || c === '"') {
      let v = "", p = i + 1, done = false;
      for (; p < s.length; p++) {
        const ch = s[p];
        if (ch === "\\" && p + 1 < s.length) {
          const nx = s[++p];
          if (nx === "u" && /^[0-9a-fA-F]{4}$/.test(s.substr(p + 1, 4))) { v += String.fromCharCode(parseInt(s.substr(p + 1, 4), 16)); p += 4; }
          else v += NMC_ESC[nx] !== undefined ? NMC_ESC[nx] : "\\" + nx;
          continue;
        }
        if (ch === c) { done = true; break; }
        v += ch;
      }
      if (!done) throw new Error(_t("chaîne non fermée"));
      t.push({ k: "str", v });
      i = p + 1;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      const m = /^[A-Za-z_]\w*/.exec(s.slice(i));
      t.push({ k: "name", v: m[0] });
      i += m[0].length;
      continue;
    }
    const op = NMC_OPS.find((o) => s.startsWith(o, i));
    if (!op) throw new Error(`${_t("caractère inattendu")} « ${c} »`);
    t.push({ k: "op", v: op });
    i += op.length;
  }
  t.push({ k: "eof" });
  return t;
}

/* ── Analyseur d'expression (priorités de Jinja2) ── */
const NMC_KW_NOARG = new Set(["and", "or", "not", "in", "is", "if", "else"]);
class NmcParser {
  constructor(toks) { this.t = toks; this.i = 0; this.d = 0; }
  peek(o) { return this.t[Math.min(this.i + (o || 0), this.t.length - 1)]; }
  next() { return this.t[this.i < this.t.length - 1 ? this.i++ : this.i]; }
  isOp(v, o) { const k = this.peek(o); return k.k === "op" && k.v === v; }
  isName(v, o) { const k = this.peek(o); return k.k === "name" && k.v === v; }
  skipOp(v) { if (this.isOp(v)) { this.i++; return true; } return false; }
  skipName(v) { if (this.isName(v)) { this.i++; return true; } return false; }
  expectOp(v) {
    if (!this.skipOp(v)) throw new Error(`${_t("attendu")} « ${v} », ${_t("trouvé")} ${this.desc()}`);
  }
  name() {
    const k = this.next();
    if (k.k !== "name") throw new Error(`${_t("nom attendu")}, ${_t("trouvé")} ${this.desc(-1)}`);
    return k.v;
  }
  desc(o) {
    const k = this.peek(o);
    return k.k === "eof" ? _t("fin de l'expression") : `« ${k.k === "str" ? "'" + k.v + "'" : k.v} »`;
  }
  end() { if (this.peek().k !== "eof") throw new Error(`${_t("inattendu")}${_sep()}${this.desc()}`); }
  atEnd() { const k = this.peek(); return k.k === "eof" || (k.k === "op" && (k.v === ")" || k.v === "]" || k.v === "}")); }

  tuple(noCond) {
    const first = this.expr(noCond);
    if (!this.isOp(",")) return first;
    const items = [first];
    while (this.skipOp(",")) {
      if (this.atEnd() || this.isName("in") || this.isName("if") || this.isOp("=")) break;
      items.push(this.expr(noCond));
    }
    return { k: "tuple", items };
  }
  expr(noCond) {
    if (++this.d > 100) throw new Error(_t("expression trop imbriquée"));
    try {
      const e = this.or();
      if (noCond || !this.skipName("if")) return e;
      const c = this.or();
      const f = this.skipName("else") ? this.expr() : null;
      return { k: "cond", t: e, c, f };
    } finally { this.d--; }
  }
  or() {
    let l = this.and();
    while (this.skipName("or")) l = { k: "or", l, r: this.and() };
    return l;
  }
  and() {
    let l = this.not();
    while (this.skipName("and")) l = { k: "and", l, r: this.not() };
    return l;
  }
  not() {
    if (this.isName("not") && !this.isName("in", 1)) { this.i++; return { k: "un", op: "not", e: this.not() }; }
    return this.cmp();
  }
  cmp() {
    const first = this.add(), ops = [];
    for (;;) {
      const k = this.peek();
      if (k.k === "op" && ["==", "!=", "<", ">", "<=", ">="].includes(k.v)) { this.i++; ops.push([k.v, this.add()]); }
      else if (this.skipName("in")) ops.push(["in", this.add()]);
      else if (this.isName("not") && this.isName("in", 1)) { this.i += 2; ops.push(["notin", this.add()]); }
      else break;
    }
    return ops.length ? { k: "cmp", first, ops } : first;
  }
  add() {
    let l = this.concat();
    while (this.isOp("+") || this.isOp("-")) { const op = this.next().v; l = { k: "bin", op, l, r: this.concat() }; }
    return l;
  }
  concat() {
    let l = this.mul();
    while (this.skipOp("~")) l = { k: "bin", op: "~", l, r: this.mul() };
    return l;
  }
  mul() {
    let l = this.pow();
    while (["*", "/", "//", "%"].some((o) => this.isOp(o))) { const op = this.next().v; l = { k: "bin", op, l, r: this.pow() }; }
    return l;
  }
  pow() {
    let l = this.unary();
    while (this.skipOp("**")) l = { k: "bin", op: "**", l, r: this.unary() };
    return l;
  }
  unary(noFilter) {
    if (++this.d > 100) throw new Error(_t("expression trop imbriquée"));
    try {
      let n;
      if (this.skipOp("-")) n = { k: "un", op: "neg", e: this.unary(true) };
      else if (this.skipOp("+")) n = { k: "un", op: "pos", e: this.unary(true) };
      else n = this.primary();
      n = this.postfix(n);
      return noFilter ? n : this.filters(n);
    } finally { this.d--; }
  }
  primary() {
    const k = this.next();
    if (k.k === "num" || k.k === "str") {
      let v = k.v;
      // littéraux de chaîne adjacents : 'a' 'b' → 'ab'
      if (k.k === "str") while (this.peek().k === "str") v += this.next().v;
      return { k: "lit", v };
    }
    if (k.k === "name") {
      if (k.v === "true" || k.v === "True") return { k: "lit", v: true };
      if (k.v === "false" || k.v === "False") return { k: "lit", v: false };
      if (k.v === "none" || k.v === "None") return { k: "lit", v: null };
      return { k: "name", v: k.v };
    }
    if (k.k === "op" && k.v === "(") {
      if (this.skipOp(")")) return { k: "tuple", items: [] };
      const e = this.tuple();
      this.expectOp(")");
      return e;
    }
    if (k.k === "op" && k.v === "[") {
      const items = [];
      while (!this.isOp("]")) {
        items.push(this.expr());
        if (!this.skipOp(",")) break;
      }
      this.expectOp("]");
      return { k: "list", items };
    }
    if (k.k === "op" && k.v === "{") {
      const pairs = [];
      while (!this.isOp("}")) {
        const key = this.expr();
        this.expectOp(":");
        pairs.push([key, this.expr()]);
        if (!this.skipOp(",")) break;
      }
      this.expectOp("}");
      return { k: "dict", pairs };
    }
    // next() ne dépasse jamais eof : reculer seulement si un jeton a été consommé
    if (k.k !== "eof") this.i--;
    throw new Error(`${_t("inattendu")}${_sep()}${this.desc()}`);
  }
  postfix(n) {
    for (;;) {
      if (this.skipOp(".")) {
        const k = this.next();
        if (k.k !== "name" && k.k !== "num") throw new Error(`${_t("nom attendu")} ${_t("après")} « . »`);
        n = { k: "attr", o: n, name: k.k === "num" ? String(k.v) : k.v };
      } else if (this.skipOp("[")) {
        n = this.subscript(n);
      } else if (this.isOp("(")) {
        this.i++;
        n = Object.assign({ k: "call", f: n }, this.args());
      } else return n;
    }
  }
  subscript(o) {
    const part = () => (this.isOp(":") || this.isOp("]") ? null : this.expr());
    const a = part();
    if (!this.isOp(":")) {
      this.expectOp("]");
      return { k: "sub", o, i: a };
    }
    this.i++;
    const b = part();
    const c = this.skipOp(":") ? part() : null;
    this.expectOp("]");
    return { k: "slice", o, a, b, c };
  }
  // appelé après "(" ; consomme jusqu'à ")"
  args() {
    const args = [], kw = [];
    while (!this.isOp(")")) {
      if (this.peek().k === "name" && this.isOp("=", 1)) {
        const nm = this.next().v;
        this.i++;
        kw.push([nm, this.expr()]);
      } else {
        this.skipOp("*");
        args.push(this.expr());
      }
      if (!this.skipOp(",")) break;
    }
    this.expectOp(")");
    return { args, kw };
  }
  filterCall(e) {
    let name = this.name();
    while (this.isOp(".") && this.peek(1).k === "name") { this.i++; name += "." + this.next().v; }
    const a = this.isOp("(") ? (this.i++, this.args()) : { args: [], kw: [] };
    return Object.assign({ k: "filt", e, name }, a);
  }
  filters(n) {
    for (;;) {
      if (this.skipOp("|")) {
        n = this.filterCall(n);
      } else if (this.skipName("is")) {
        const neg = this.skipName("not");
        const tk = this.next();
        if (tk.k !== "name" && tk.k !== "op") throw new Error(_t("nom de test attendu"));
        let args = [], kw = [];
        if (this.isOp("(")) {
          this.i++;
          ({ args, kw } = this.args());
        } else {
          const k = this.peek();
          const starts = k.k === "num" || k.k === "str" || (k.k === "name" && !NMC_KW_NOARG.has(k.v)) ||
            (k.k === "op" && (k.v === "[" || k.v === "{"));
          if (starts) args = [this.postfix(this.primary())];
        }
        n = { k: "test", e: n, name: tk.v, neg, args, kw };
      } else return n;
    }
  }
}
function nmcParseExpr(src) {
  const p = new NmcParser(nmcLexExpr(src));
  const e = p.tuple();
  p.end();
  return e;
}

/* ── Évaluateur d'expression ── */
// E = { hass, errs, ctx, warn, root } : état du rendu en cours (garde-fous partagés).
function nmcEv(n, V, E) {
  switch (n.k) {
    case "lit": return n.v;
    case "name": {
      const v = nmcLookupRaw(V, n.v);
      if (v !== undefined) return v;
      if (n.v === "states") return E.root || (E.root = new NmcStatesRoot(E.hass));
      if (Object.prototype.hasOwnProperty.call(NMC_CONSTS, n.v)) return NMC_CONSTS[n.v];
      return NMC_UNDEF;
    }
    case "list": return _nmcOwn(n.items.map((x) => nmcEv(x, V, E)));
    case "tuple": return nmcTup(n.items.map((x) => nmcEv(x, V, E)));
    case "dict": {
      const o = {};
      for (const [k, v] of n.pairs) o[nmcToStr(nmcEv(k, V, E))] = nmcEv(v, V, E);
      return _nmcOwn(o);
    }
    case "attr": return nmcAttr(nmcEv(n.o, V, E), n.name);
    case "sub": {
      const o = nmcEv(n.o, V, E), i = nmcEv(n.i, V, E);
      return nmcAttr(o, typeof i === "number" ? i : nmcToStr(i));
    }
    case "slice": {
      const ev = (x) => (x ? nmcEv(x, V, E) : null);
      return nmcSlice(nmcEv(n.o, V, E), ev(n.a), ev(n.b), ev(n.c));
    }
    case "call": return nmcCall(n, V, E);
    case "filt": {
      const { args, kw } = nmcEvArgs(n, V, E);
      const src = nmcEv(n.e, V, E), r = nmcFilter(n.name, src, args, kw, E);
      if (n.name === "groupby" && Array.isArray(r)) for (const g of r) { _nmcOwn(g); _nmcOwn(g[1]); }
      return NMC_FRESH_FILTERS.has(n.name) ? _nmcFresh(r, src, NMC_FRESH_DEPTH[n.name] || 0) : r;
    }
    case "test": {
      if (n.name === "callable" && n.e.k === "name" && nmcLookupRaw(V, NMC_MACRO_PREFIX + n.e.v))
        return !n.neg;
      const { args, kw } = nmcEvArgs(n, V, E);
      const r = nmcTest(n.name, nmcEv(n.e, V, E), args, kw, E);
      return !!(n.neg ? !r : r);
    }
    case "un": {
      const v = nmcEv(n.e, V, E);
      if (n.op === "not") return !nmcTruthy(v);
      return n.op === "neg" ? -nmcNum(v) : nmcNum(v);
    }
    case "and": { const a = nmcEv(n.l, V, E); return nmcTruthy(a) ? nmcEv(n.r, V, E) : a; }
    case "or": { const a = nmcEv(n.l, V, E); return nmcTruthy(a) ? a : nmcEv(n.r, V, E); }
    case "cmp": {
      let a = nmcEv(n.first, V, E);
      for (const [op, x] of n.ops) {
        const b = nmcEv(x, V, E);
        if (!nmcCmpOp(op, a, b)) return false;
        a = b;
      }
      return true;
    }
    case "bin": return nmcBin(n.op, nmcEv(n.l, V, E), nmcEv(n.r, V, E));
    case "cond":
      return nmcTruthy(nmcEv(n.c, V, E)) ? nmcEv(n.t, V, E) : n.f ? nmcEv(n.f, V, E) : NMC_UNDEF;
  }
  throw new Error(_t("expression invalide"));
}
function nmcEvArgs(n, V, E) {
  const args = n.args.map((x) => nmcEv(x, V, E)), kw = {};
  for (const [k, x] of n.kw) kw[k] = nmcEv(x, V, E);
  return { args, kw };
}
function nmcCmpOp(op, a, b) {
  switch (op) {
    case "==": return nmcEq(a, b);
    case "!=": return !nmcEq(a, b);
    case "<": return nmcOrd(a, b) < 0;
    case ">": return nmcOrd(a, b) > 0;
    case "<=": return nmcOrd(a, b) <= 0;
    case ">=": return nmcOrd(a, b) >= 0;
    case "in": return nmcIn(a, b);
    case "notin": return !nmcIn(a, b);
  }
  return false;
}
const _nmcFin = (r) => (isFinite(r) ? r : 0);
// Concaténation qui respecte l'autoescape : une partie sûre reste sûre, l'autre est échappée.
function nmcConcat(a, b) {
  if (!_nmcRawOut && (a instanceof NmcSafe || b instanceof NmcSafe))
    return new NmcSafe(nmcEscOut(a) + nmcEscOut(b));
  return nmcToStr(a) + nmcToStr(b);
}
function nmcBin(op, a, b) {
  if (op === "~") return nmcConcat(a, b);
  const ua = a instanceof NmcSafe ? a.s : a, ub = b instanceof NmcSafe ? b.s : b;
  if (op === "+") {
    if (Array.isArray(ua) && Array.isArray(ub)) return _nmcOwn(ua.concat(ub));
    if (typeof ua === "string" && typeof ub === "string" && !(nmcNumLike(ua) && nmcNumLike(ub))) return nmcConcat(a, b);
    if (ua instanceof NmcDT && ub instanceof NmcTD) return new NmcDT(ua.ms + ub.s * 1000, ua.utc);
    if (ua instanceof NmcTD && ub instanceof NmcTD) return new NmcTD(ua.s + ub.s);
    return _nmcFin(nmcNum(ua) + nmcNum(ub));
  }
  if (op === "-") {
    if (ua instanceof NmcDT && ub instanceof NmcDT) return new NmcTD((ua.ms - ub.ms) / 1000);
    if (ua instanceof NmcDT && ub instanceof NmcTD) return new NmcDT(ua.ms - ub.s * 1000, ua.utc);
    if (ua instanceof NmcTD && ub instanceof NmcTD) return new NmcTD(ua.s - ub.s);
    return _nmcFin(nmcNum(ua) - nmcNum(ub));
  }
  if (op === "*") {
    const rep = (s, n) => {
      n = Math.max(0, Math.trunc(nmcNum(n)));
      const len = (typeof s === "string" ? s.length : s.length) * n;
      if (len > NMC_MAX_TEMPLATE_OUTPUT) throw new Error(_t("résultat trop long"));
      return typeof s === "string" ? s.repeat(n) : [].concat(...Array(n).fill(s));
    };
    if ((typeof ua === "string" && !nmcNumLike(ua)) || Array.isArray(ua)) return rep(ua, ub);
    if ((typeof ub === "string" && !nmcNumLike(ub)) || Array.isArray(ub)) return rep(ub, ua);
    if (ua instanceof NmcTD) return new NmcTD(ua.s * nmcNum(ub));
    return _nmcFin(nmcNum(ua) * nmcNum(ub));
  }
  if (op === "%" && typeof ua === "string" && !nmcNumLike(ua))
    return nmcPrintf(ua, Array.isArray(ub) ? ub : [ub]);
  const x = nmcNum(ua), y = nmcNum(ub);
  switch (op) {
    case "/": return y === 0 ? 0 : _nmcFin(x / y);
    case "//": return y === 0 ? 0 : _nmcFin(Math.floor(x / y));
    case "%": return y === 0 ? 0 : _nmcFin(x - y * Math.floor(x / y));
    case "**": return _nmcFin(Math.pow(x, y));
  }
  return 0;
}

/* ── Appels : macro, fonction, méthode ── */
function nmcCall(n, V, E) {
  if (n.f.k === "name") {
    const name = n.f.v;
    const def = nmcLookupRaw(V, NMC_MACRO_PREFIX + name);
    const { args, kw } = nmcEvArgs(n, V, E);
    if (def) return nmcInvokeMacro(name, def, args, kw, V, E, null);
    if (name === "caller") throw new Error(`caller() → ${_t("hors d'un bloc call")}`);
    const r = nmcFunc(name, args, kw, V, E);
    return NMC_FRESH_FUNCS.has(name) ? _nmcFresh(r, args[0], 0) : r;
  }
  if (n.f.k === "attr") {
    const o = nmcEv(n.f.o, V, E);
    const { args, kw } = nmcEvArgs(n, V, E);
    const r = nmcMethod(o, n.f.name, args, kw, E);
    return NMC_FRESH_METHODS.has(n.f.name) ? _nmcFresh(r, o, 0) : r;
  }
  throw new Error(_t("appel invalide"));
}

// Positionnels puis kwargs, défauts évalués dans le scope de l'appelant.
// `def.scope` (blocs {% call %}) : le corps de caller() s'évalue dans le scope du site d'appel.
function nmcInvokeMacro(name, def, args, kw, V, E, callerDef) {
  kw = Object.assign({}, kw);
  const child = Object.create(def.scope || V);
  def.params.forEach((p, i) => {
    if (Object.prototype.hasOwnProperty.call(kw, p.name)) { child[p.name] = kw[p.name]; delete kw[p.name]; }
    else if (i < args.length) child[p.name] = args[i];
    else child[p.name] = p.def ? nmcEv(p.def, V, E) : "";
  });
  const unknown = Object.keys(kw);
  if (unknown.length) E.warn(`${name}() → ${_t("argument inconnu")}${_sep()}${unknown.join(", ")}`);
  // own-property : un caller() d'un {% call %} englobant reste masqué
  child[NMC_MACRO_PREFIX + "caller"] = callerDef || undefined;
  const brk = E.ctx.brk;
  try { return new NmcSafe(nmcRenderNodes(def.body, E.hass, child, E.errs, E.ctx)); }
  finally { E.ctx.brk = brk; }
}

const _nmcArgNum = (a) => a.map(nmcNum);
function nmcToDT(v, utc) {
  if (v instanceof NmcSafe) v = v.s;
  if (v instanceof NmcDT) return v;
  if (typeof v === "number" && isFinite(v)) return new NmcDT(v * 1000, utc);
  if (typeof v === "string") {
    if (_nmcNumRe.test(v)) return new NmcDT(parseFloat(v) * 1000, utc);
    const ms = nmcParseDate(v);
    if (!isNaN(ms)) return new NmcDT(ms, utc);
  }
  return null;
}
function nmcAsTimestamp(v, d) {
  if (v instanceof NmcSafe) v = v.s;
  if (v instanceof NmcDT) return v.ms / 1000;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const ms = nmcParseDate(v);
    if (!isNaN(ms)) return ms / 1000;
    if (_nmcNumRe.test(v)) return parseFloat(v);
  }
  return d !== undefined ? d : 0;
}
// Algorithme get_age de HA (relative_time).
function nmcRelTime(v) {
  const dt = nmcToDT(v instanceof NmcSafe ? v.s : v, false);
  if (!dt || typeof v === "number") return v;
  const now = Date.now();
  if (now < dt.ms) return v;
  const fmt = (n, u) => (n === 1 ? `1 ${u}` : `${n} ${u}s`);
  const total = Math.floor((now - dt.ms) / 1000);
  let day = Math.floor(total / 86400), sec = total % 86400;
  const year = Math.floor(day / 365);
  day %= 365;
  if (year > 0) return fmt(year, "year");
  const month = Math.floor(day / 30);
  day %= 30;
  if (month > 0) return fmt(month, "month");
  if (day > 0) return fmt(day, "day");
  const hour = Math.floor(sec / 3600);
  sec %= 3600;
  if (hour > 0) return fmt(hour, "hour");
  const minute = Math.floor(sec / 60);
  if (minute > 0) return fmt(minute, "minute");
  return fmt(sec % 60, "second");
}
function nmcStateObj(E, id) {
  if (id && typeof id === "object" && id.entity_id) id = id.entity_id;
  return E.hass.states ? E.hass.states[nmcToStr(id)] : undefined;
}
function nmcExpand(args, E) {
  const seen = new Set(), out = [];
  const walk = (x, depth) => {
    if (x instanceof NmcSafe) x = x.s;
    if (Array.isArray(x)) return x.forEach((y) => walk(y, depth));
    if (x instanceof NmcDomain) return x.list().forEach((y) => walk(y, depth));
    const s = nmcStateObj(E, x);
    if (!s || seen.has(s.entity_id)) return;
    seen.add(s.entity_id);
    const members = s.attributes && s.attributes.entity_id;
    if (Array.isArray(members) && depth < 8) members.forEach((m) => walk(m, depth + 1));
    else out.push(nmcWrapState(s));
  };
  args.forEach((a) => walk(a, 0));
  return out.sort((a, b) => (a.entity_id < b.entity_id ? -1 : 1));
}
function nmcMinMax(isMax, args) {
  const l = args.length === 1 && (Array.isArray(args[0]) || args[0] instanceof NmcDomain)
    ? (Array.isArray(args[0]) ? args[0] : args[0].list()) : args;
  if (!l.length) return NMC_UNDEF;
  return l.reduce((best, x) => ((isMax ? nmcOrd(x, best) > 0 : nmcOrd(x, best) < 0) ? x : best), l[0]);
}

function nmcFunc(name, a, kw, V, E) {
  switch (name) {
    case "range": {
      let [s, e, st] = a.length >= 2 ? _nmcArgNum(a) : [0, nmcNum(a[0])];
      st = st == null ? 1 : Math.trunc(st) || 1;
      s = Math.trunc(s); e = Math.trunc(e);
      const out = [];
      for (let i = s; st > 0 ? i < e : i > e; i += st) {
        if (out.length >= NMC_MAX_TEMPLATE_ITERATIONS) {
          E.warn(`range → ${_t("itérations limitées à")} ${NMC_MAX_TEMPLATE_ITERATIONS}`);
          break;
        }
        out.push(i);
      }
      return out;
    }
    case "states": {
      const s = nmcStateObj(E, a[0]);
      return s ? s.state : "";
    }
    case "is_state": {
      const s = nmcStateObj(E, a[0]);
      if (!s) return 0;
      const w = a[1] instanceof NmcSafe ? a[1].s : a[1];
      return (Array.isArray(w) ? w.some((x) => nmcToStr(x) === s.state) : nmcToStr(w) === s.state) ? true : false;
    }
    case "state_attr": {
      const s = nmcStateObj(E, a[0]);
      const v = s && s.attributes ? s.attributes[nmcToStr(a[1])] : undefined;
      return v == null || !Object.prototype.hasOwnProperty.call(s.attributes, nmcToStr(a[1])) ? "" : v;
    }
    case "is_state_attr": {
      const s = nmcStateObj(E, a[0]);
      return !!(s && s.attributes && nmcEq(s.attributes[nmcToStr(a[1])], a[2]));
    }
    case "has_value": {
      const s = nmcStateObj(E, a[0]);
      return !!(s && s.state !== "unknown" && s.state !== "unavailable");
    }
    case "as_timestamp": return nmcAsTimestamp(a[0], a.length > 1 ? a[1] : kw.default);
    case "now": return new NmcDT(Date.now(), false);
    case "utcnow": return new NmcDT(Date.now(), true);
    case "as_datetime": {
      const dt = nmcToDT(a[0], false);
      return dt || (a.length > 1 ? a[1] : kw.default !== undefined ? kw.default : NMC_UNDEF);
    }
    case "as_local": {
      const dt = nmcToDT(a[0], false);
      return dt ? new NmcDT(dt.ms, false) : NMC_UNDEF;
    }
    case "today_at": {
      const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(nmcToStr(a[0] == null || a[0] === NMC_UNDEF ? "00:00" : a[0]).trim());
      if (!m) throw new Error(`today_at → ${_t("heure invalide")}`);
      const d = new Date();
      d.setHours(+m[1], +m[2], +(m[3] || 0), 0);
      return new NmcDT(d.getTime(), false);
    }
    case "timedelta": {
      const g = (k) => nmcNum(kw[k] !== undefined ? kw[k] : 0);
      const pos = _nmcArgNum(a);
      return new NmcTD((pos[0] || g("days")) * 86400 + (pos[1] || g("seconds")) + g("minutes") * 60 +
        g("hours") * 3600 + g("weeks") * 604800 + g("milliseconds") / 1000);
    }
    case "relative_time": return nmcRelTime(a[0]);
    case "expand": return nmcExpand(a, E);
    case "iif": {
      const t = a.length > 1 ? a[1] : 1, f = a.length > 2 ? a[2] : 0;
      if (a.length > 3 && (a[0] == null || a[0] === NMC_UNDEF)) return a[3];
      return nmcTruthy(a[0]) ? t : f;
    }
    case "max":
    case "min": return nmcMinMax(name === "max", a);
    case "float": case "int": case "bool": case "string": case "str": case "list":
    case "average":
      return nmcFilter(name === "str" ? "string" : name, a[0], a.slice(1), kw, E);
    case "dict": {
      const o = {};
      if (a[0] && typeof a[0] === "object") {
        if (Array.isArray(a[0])) for (const p of a[0]) { if (Array.isArray(p)) o[nmcToStr(p[0])] = p[1]; }
        else if (nmcIsPlain(a[0])) Object.assign(o, a[0]);
      }
      return _nmcOwn(Object.assign(o, kw));
    }
    case "namespace": return _nmcOwn(Object.assign({}, a[0] && nmcIsPlain(a[0]) ? a[0] : {}, kw));
    case "zip": {
      const ls = a.map((x) => (Array.isArray(x) ? x : []));
      const n = ls.length ? Math.min(...ls.map((x) => x.length)) : 0;
      return Array.from({ length: n }, (_, i) => ls.map((x) => x[i]));
    }
    case "len": return nmcFilter("length", a[0], [], {}, E);
    case "abs": return Math.abs(nmcNum(a[0]));
  }
  if (Object.prototype.hasOwnProperty.call(nmcMathFns, name)) return _nmcFin(nmcMathFns[name](_nmcArgNum(a)));
  throw new Error(`${name}() → ${_t("fonction inconnue")}`);
}

const NMC_STR_METHODS = new Set(["upper", "lower", "strip", "lstrip", "rstrip", "replace", "split",
  "startswith", "endswith", "title", "capitalize", "count", "find", "join", "format", "zfill",
  "isdigit", "isnumeric", "isalpha", "isalnum", "isspace", "islower", "isupper", "ljust", "rjust",
  "center", "rsplit", "splitlines", "index", "rfind", "removeprefix", "removesuffix", "swapcase", "casefold"]);
function nmcStrip(s, chars, l, r) {
  if (chars == null || chars === NMC_UNDEF) return l && r ? s.trim() : l ? s.replace(/^\s+/, "") : s.replace(/\s+$/, "");
  const set = nmcToStr(chars);
  let a = 0, b = s.length;
  if (l) while (a < b && set.includes(s[a])) a++;
  if (r) while (b > a && set.includes(s[b - 1])) b--;
  return s.slice(a, b);
}
function nmcPyFormat(s, a, kw) {
  let auto = 0;
  return s.replace(/\{\{|\}\}|\{([^{}]*)\}/g, (m, f) => {
    if (m === "{{") return "{";
    if (m === "}}") return "}";
    const [key, spec] = f.split(":");
    const v = key === "" ? a[auto++] : /^\d+$/.test(key) ? a[+key] : nmcPath(kw, key);
    if (spec) {
      const mm = /^(0?)(\d*)(?:\.(\d+))?([fdsx%]?)$/.exec(spec);
      if (mm) {
        let out = mm[4] === "f" || mm[3] ? nmcNum(v).toFixed(mm[3] ? +mm[3] : 6)
          : mm[4] === "d" ? String(Math.trunc(nmcNum(v))) : mm[4] === "x" ? Math.trunc(nmcNum(v)).toString(16)
          : mm[4] === "%" ? (nmcNum(v) * 100).toFixed(mm[3] ? +mm[3] : 6) + "%" : nmcToStr(v);
        if (mm[2]) out = out.padStart(+mm[2], mm[1] ? "0" : " ");
        return out;
      }
    }
    return nmcToStr(v);
  });
}
function nmcMethod(o, name, a, kw, E) {
  if (o === NMC_UNDEF) return NMC_UNDEF;
  if (o instanceof NmcLoop && name === "cycle") return a.length ? a[o.index0 % a.length] : NMC_UNDEF;
  if (o instanceof NmcDT) {
    const p = nmcDtParts(o);
    switch (name) {
      case "weekday": return (p.wd + 6) % 7;
      case "isoweekday": return p.wd || 7;
      case "timestamp": return o.ms / 1000;
      case "isoformat": return nmcDtStr(o, "T");
      case "strftime": return nmcStrftime(new Date(o.ms), nmcToStr(a[0]), E.hass.language, o.utc);
      case "date": return `${p.y}-${_p2(p.mo)}-${_p2(p.d)}`;
      case "astimezone": case "replace": return o;
    }
  }
  if (o instanceof NmcTD && name === "total_seconds") return o.s;
  if (o instanceof NmcSafe) o = o.s;
  if (typeof o === "string" && NMC_STR_METHODS.has(name)) {
    const s0 = a[0] === undefined || a[0] === NMC_UNDEF ? undefined : a[0];
    switch (name) {
      case "upper": return o.toUpperCase();
      case "lower": case "casefold": return o.toLowerCase();
      case "swapcase": return o.replace(/./g, (c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()));
      case "strip": return nmcStrip(o, s0, true, true);
      case "lstrip": return nmcStrip(o, s0, true, false);
      case "rstrip": return nmcStrip(o, s0, false, true);
      case "replace": {
        const from = nmcToStr(s0), to = nmcToStr(a[1]);
        let n = a.length > 2 ? Math.trunc(nmcNum(a[2])) : -1;
        if (n < 0) return o.split(from).join(to);
        let out = o;
        let idx = 0;
        for (; n > 0; n--) {
          const k = out.indexOf(from, idx);
          if (k < 0) break;
          out = out.slice(0, k) + to + out.slice(k + from.length);
          idx = k + to.length;
        }
        return out;
      }
      case "split": case "rsplit": {
        const max = a.length > 1 ? Math.trunc(nmcNum(a[1])) : -1;
        let parts = s0 == null || s0 === null ? o.trim().split(/\s+/).filter((x) => x !== "") : o.split(nmcToStr(s0));
        if (max >= 0 && parts.length > max + 1) {
          const sep = s0 == null ? " " : nmcToStr(s0);
          parts = name === "split" ? parts.slice(0, max).concat([parts.slice(max).join(sep)])
            : [parts.slice(0, parts.length - max).join(sep)].concat(parts.slice(parts.length - max));
        }
        return parts;
      }
      case "splitlines": return o.split(/\r?\n/);
      case "startswith":
      case "endswith": {
        const l = Array.isArray(s0) ? s0 : [s0];
        return l.some((x) => (name === "startswith" ? o.startsWith(nmcToStr(x)) : o.endsWith(nmcToStr(x)))) ? true : false;
      }
      case "removeprefix": return o.startsWith(nmcToStr(s0)) ? o.slice(nmcToStr(s0).length) : o;
      case "removesuffix": { const x = nmcToStr(s0); return x && o.endsWith(x) ? o.slice(0, -x.length) : o; }
      case "title": return o.toLowerCase().replace(/(^|[^A-Za-zÀ-ÿ])([A-Za-zÀ-ÿ])/g, (m, p, c) => p + c.toUpperCase());
      case "capitalize": return o.charAt(0).toUpperCase() + o.slice(1).toLowerCase();
      case "count": { const x = nmcToStr(s0); return x ? o.split(x).length - 1 : o.length + 1; }
      case "find": return o.indexOf(nmcToStr(s0));
      case "rfind": return o.lastIndexOf(nmcToStr(s0));
      case "index": { const k = o.indexOf(nmcToStr(s0)); if (k < 0) throw new Error(`index → ${_t("introuvable")}`); return k; }
      case "join": return (Array.isArray(s0) ? s0 : s0 instanceof NmcDomain ? s0.list() : []).map(nmcToStr).join(o);
      case "format": return nmcPyFormat(o, a, kw);
      case "zfill": return nmcFilter("zfill", o, a, kw, E);
      case "center": return nmcFilter("center", o, a, kw, E);
      case "ljust": return o.padEnd(Math.trunc(nmcNum(s0)), a[1] != null ? nmcToStr(a[1]) : " ");
      case "rjust": return o.padStart(Math.trunc(nmcNum(s0)), a[1] != null ? nmcToStr(a[1]) : " ");
      case "isdigit": case "isnumeric": return /^\d+$/.test(o) ? true : false;
      case "isalpha": return /^[A-Za-zÀ-ÿ]+$/.test(o) ? true : false;
      case "isalnum": return /^[A-Za-zÀ-ÿ0-9]+$/.test(o) ? true : false;
      case "isspace": return /^\s+$/.test(o) ? true : false;
      case "islower": return o === o.toLowerCase() && o !== o.toUpperCase() ? true : false;
      case "isupper": return o === o.toUpperCase() && o !== o.toLowerCase() ? true : false;
    }
  }
  if (Array.isArray(o)) {
    if (name === "append" || name === "extend" || name === "insert" || name === "pop") _nmcMutable(o);
    switch (name) {
      case "append":
        if (o.length >= NMC_MAX_TEMPLATE_ITERATIONS) throw new Error(_t("liste trop longue"));
        o.push(a[0]); return NMC_UNDEF;
      case "extend":
        for (const x of Array.isArray(a[0]) ? a[0] : []) { if (o.length >= NMC_MAX_TEMPLATE_ITERATIONS) break; o.push(x); }
        return NMC_UNDEF;
      case "insert": o.splice(Math.trunc(nmcNum(a[0])), 0, a[1]); return NMC_UNDEF;
      case "pop": {
        if (!o.length) return NMC_UNDEF;
        let i = a.length ? Math.trunc(nmcNum(a[0])) : o.length - 1;
        if (i < 0) i += o.length;
        return o.splice(i, 1)[0];
      }
      case "index": { const i = o.findIndex((x) => nmcEq(x, a[0])); if (i < 0) throw new Error(`index → ${_t("introuvable")}`); return i; }
      case "count": return o.filter((x) => nmcEq(x, a[0])).length;
    }
  }
  if (nmcIsPlain(o)) {
    switch (name) {
      case "get": { const v = nmcAttr(o, nmcToStr(a[0])); return v === NMC_UNDEF ? (a.length > 1 ? a[1] : null) : v; }
      case "items": return Object.keys(o).map((k) => nmcTup([k, o[k]]));
      case "keys": return Object.keys(o);
      case "values": return Object.values(o);
      case "update": _nmcMutable(o); if (nmcIsPlain(a[0])) Object.assign(o, a[0]); Object.assign(o, kw); return NMC_UNDEF;
    }
  }
  throw new Error(`.${name}() → ${_t("méthode inconnue")}`);
}

/* ── Utilitaires conservés de l'ancien moteur ── */
function nmcSplitTop(s, sep) {
  const out = [];
  let depth = 0, inStr = "", start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) { if (c === inStr) inStr = ""; continue; }
    if (c === '"' || c === "'") { inStr = c; continue; }
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") depth--;
    else if (c === sep && depth === 0) { out.push(s.slice(start, i)); start = i + 1; }
  }
  out.push(s.slice(start));
  return out;
}

// utc : lit les champs UTC (utcnow(), timestamp_utc) au lieu de l'heure locale.
function nmcStrftime(d, fmt, lang, utc) {
  const p2 = (n) => String(n).padStart(2, "0");
  const g = (k) => d[(utc ? "getUTC" : "get") + k]();
  const name = (opts) => {
    if (utc) opts = Object.assign({ timeZone: "UTC" }, opts);
    try { return new Intl.DateTimeFormat(lang || "en", opts).format(d); }
    catch (e) { return new Intl.DateTimeFormat("en", opts).format(d); }
  };
  const Y = g("FullYear"), Mo = g("Month"), D = g("Date"), H = g("Hours"), wd = g("Day");
  const h12 = H % 12 || 12;
  const yday = Math.round((Date.UTC(Y, Mo, D) - Date.UTC(Y, 0, 1)) / 864e5) + 1;
  const off = utc ? 0 : -d.getTimezoneOffset();
  const map = {
    H: () => p2(H), I: () => p2(h12), M: () => p2(g("Minutes")), S: () => p2(g("Seconds")),
    f: () => String(g("Milliseconds") * 1000).padStart(6, "0"),
    p: () => (H < 12 ? "AM" : "PM"),
    d: () => p2(D), e: () => String(D).padStart(2, " "), m: () => p2(Mo + 1),
    y: () => p2(Y % 100), Y: () => String(Y), j: () => String(yday).padStart(3, "0"),
    a: () => name({ weekday: "short" }), A: () => name({ weekday: "long" }),
    b: () => name({ month: "short" }), B: () => name({ month: "long" }),
    u: () => String(wd || 7), w: () => String(wd),
    z: () => nmcTzStr(off, false), Z: () => (utc ? "UTC" : ""),
    "%": () => "%",
  };
  return fmt.replace(/%(-?)(.)/g, (all, nopad, c) => {
    if (!map[c]) return all;
    const v = map[c]();
    return nopad && /^[0 ]\d/.test(v) ? v.replace(/^[0 ]+(?=\d)/, "") : v;
  });
}

const nmcMathFns = {
  log:   (a) => (a[1] ? Math.log(a[0]) / Math.log(a[1]) : (a[0] > 0 ? Math.log(a[0]) : 0)), // log(x) = ln ; log(x,b) = base b
  ln:    (a) => (a[0] > 0 ? Math.log(a[0]) : 0),
  log10: (a) => (a[0] > 0 ? Math.log10(a[0]) : 0),
  log2:  (a) => (a[0] > 0 ? Math.log2(a[0]) : 0),
  exp:   (a) => Math.exp(a[0]),
  sqrt:  (a) => Math.sqrt(Math.max(0, a[0])),
  abs:   (a) => Math.abs(a[0]),
  floor: (a) => Math.floor(a[0]),
  ceil:  (a) => Math.ceil(a[0]),
  round: (a) => nmcRoundEven(a[0], a[1] != null ? Math.max(0, Math.min(100, a[1] | 0)) : 0), // égalité → pair, comme |round
  sin:   (a) => Math.sin(a[0]),
  cos:   (a) => Math.cos(a[0]),
  tan:   (a) => Math.tan(a[0]),
  asin:  (a) => Math.asin(a[0]),
  acos:  (a) => Math.acos(a[0]),
  atan:  (a) => Math.atan(a[0]),
  pow:   (a) => Math.pow(a[0], a[1] == null ? 2 : a[1]),
  atan2: (a) => Math.atan2(a[0], a[1]),
  hypot: (a) => Math.hypot(a[0], a[1]),
};

/* ── Filtres ── */
const _nmcSeq = (r) => (r instanceof NmcSafe ? Array.from(r.s) : Array.isArray(r) ? r
  : r instanceof NmcDomain || r instanceof NmcStatesRoot ? r.list()
  : typeof r === "string" ? Array.from(r) : nmcIsPlain(r) ? Object.keys(r) : []);
const _nmcKey = (at) => (x) => (at == null || at === NMC_UNDEF ? x : nmcPath(x, nmcToStr(at)));
const _nmcIsEmpty = (r) => r === NMC_UNDEF || r == null || r === "" || r === "None" || r === "unknown" || r === "unavailable";
// Python : re.sub/re.match → RegExp JS (groupes nommés, références \1 / \g<n>).
function nmcPyRe(p, flags) {
  return new RegExp(nmcToStr(p).replace(/\(\?P</g, "(?<").replace(/\(\?P=(\w+)\)/g, "\\k<$1>"), flags);
}
const nmcPyRepl = (s) => nmcToStr(s).replace(/\\g<(\w+)>/g, (m, n) => (/^\d+$/.test(n) ? "$" + n : "$<" + n + ">"))
  .replace(/\\(\d)/g, "$$$1");
function nmcPrintf(fmtStr, args) {
  let ai = 0;
  return nmcToStr(fmtStr).replace(/%([+\-0 ]*)(\d+)?(?:\.(\d+))?([sdifxXeE%])/g, (m, fl, w, prec, conv) => {
    if (conv === "%") return "%";
    const arg = args[ai++];
    if (arg === undefined) return m;
    let o;
    if (conv === "s") o = nmcToStr(arg);
    else {
      const num = nmcNum(arg);
      if (conv === "d" || conv === "i") o = String(Math.trunc(num));
      else if (conv === "x") o = Math.trunc(num).toString(16);
      else if (conv === "X") o = Math.trunc(num).toString(16).toUpperCase();
      else if (conv === "e" || conv === "E") {
        o = num.toExponential(prec !== undefined ? +prec : 6).replace(/e([+-])(\d)$/, "e$10$2");
        if (conv === "E") o = o.toUpperCase();
      } else o = num.toFixed(prec !== undefined ? +prec : 6);
      if (fl.includes("+") && num >= 0) o = "+" + o;
      else if (fl.includes(" ") && num >= 0) o = " " + o;
    }
    const width = w ? +w : 0;
    if (o.length < width) o = fl.includes("-") ? o.padEnd(width, " ") : o.padStart(width, fl.includes("0") && conv !== "s" ? "0" : " ");
    return o;
  });
}
function nmcToJson(v, depth) {
  if (depth > 20) return "null";
  if (v instanceof NmcSafe) v = v.s;
  if (v === NMC_UNDEF || v == null) return "null";
  if (v instanceof NmcDT) return JSON.stringify(nmcDtStr(v, "T"));
  if (v instanceof NmcTD) return JSON.stringify(nmcTdStr(v));
  if (v instanceof NmcDomain || v instanceof NmcStatesRoot) v = v.list();
  if (Array.isArray(v)) return "[" + v.map((x) => nmcToJson(x, depth + 1)).join(", ") + "]";
  if (typeof v === "object") return "{" + Object.keys(v).map((k) => JSON.stringify(k) + ": " + nmcToJson(v[k], depth + 1)).join(", ") + "}";
  if (typeof v === "number") return isFinite(v) ? String(v) : "null";
  return JSON.stringify(v);
}
function nmcFromJson(v) {
  if (v === NMC_UNDEF || v == null) return v;
  const conv = (x) => (x === null ? null : Array.isArray(x) ? x.map(conv)
    : typeof x === "object" ? Object.fromEntries(Object.entries(x).map(([k, y]) => [k, conv(y)])) : x);
  return conv(JSON.parse(nmcToStr(v)));
}

function nmcFilter(name, r, a, kw, E) {
  const a0 = a[0], has = (i, k) => (k && kw[k] !== undefined) || a.length > i;
  const arg = (i, k, d) => (k && kw[k] !== undefined ? kw[k] : a.length > i ? a[i] : d);
  const str = () => nmcToStr(r);
  switch (name) {
    case "round": {
      const n = Math.trunc(nmcNum(arg(0, "precision", 0)));
      const method = nmcToStr(arg(1, "method", "common"));
      const num = typeof r === "number" ? r : parseFloat(r instanceof NmcSafe ? r.s : r);
      if (isNaN(num)) return r;
      // Valeur = forgiving_round de HA (round() Python : égalité exacte → pair). Écriture : n
      // décimales fixes (1.20 kW, 0.00 €) — HA écrirait 1.2 ; gardé pour l'affichage des cards.
      const p = Math.pow(10, n);
      let v;
      if (method === "floor" || method === "ceil") v = Math[method](num * p) / p;
      else if (method === "half") v = nmcRoundEven(num * 2, 0) / 2;
      else v = n >= 0 ? nmcRoundEven(num, Math.min(n, 100)) : nmcRoundEven(num / Math.pow(10, -n), 0) * Math.pow(10, -n);
      if (n === 0) return Math.trunc(v);
      return Math.abs(v) < 1e21 ? v.toFixed(Math.max(0, Math.min(100, n))) : v;
    }
    case "float": {
      const n = typeof r === "number" ? r : parseFloat(r instanceof NmcSafe ? r.s : r);
      return isNaN(n) ? arg(0, "default", 0) : n;
    }
    case "int": {
      if (typeof r === "number") return isFinite(r) ? Math.trunc(r) : arg(0, "default", 0);
      const base = Math.trunc(nmcNum(arg(1, "base", 10))) || 10;
      const s = nmcToStr(r).trim();
      const n = base === 10 ? Math.trunc(parseFloat(s)) : parseInt(s, base);
      return isNaN(n) ? arg(0, "default", 0) : n;
    }
    case "bool": {
      const v = r instanceof NmcSafe ? r.s : r;
      if (typeof v === "boolean") return v;
      const s = nmcToStr(v).toLowerCase().trim();
      if (["true", "yes", "on", "enable", "1"].includes(s) || (typeof v === "number" && v !== 0)) return true;
      if (["false", "no", "off", "disable", "0", "none", ""].includes(s)) return false;
      return a.length ? a[0] : nmcTruthy(v);
    }
    case "abs": return Math.abs(nmcNum(r));
    case "clamp": {
      let n = nmcNum(r);
      const lo = a.length > 0 ? nmcNum(a[0]) : NaN, hi = a.length > 1 ? nmcNum(a[1]) : NaN;
      if (!isNaN(lo) && n < lo) n = lo;
      if (!isNaN(hi) && n > hi) n = hi;
      return n;
    }
    case "multiply": return _nmcFin(nmcNum(r) * nmcNum(a0));
    case "format": return nmcPrintf(r, a.length ? a : Object.values(kw));
    case "zfill": {
      const w = Math.trunc(nmcNum(a0)), s = str();
      return /^[-+]/.test(s) ? s[0] + s.slice(1).padStart(Math.max(0, w - 1), "0") : s.padStart(w, "0");
    }
    case "upper": return str().toUpperCase();
    case "lower": return str().toLowerCase();
    case "title": return str().replace(/\b\w/g, (c) => c.toUpperCase());
    case "capitalize": return str().charAt(0).toUpperCase() + str().slice(1).toLowerCase();
    case "trim": return a.length ? nmcStrip(str(), a0, true, true) : str().trim();
    case "string": return r === null ? "None" : nmcToStr(r);
    case "replace": {
      const from = nmcToStr(a0), to = nmcToStr(a[1]);
      const n = a.length > 2 ? Math.trunc(nmcNum(a[2])) : -1;
      return n >= 0 ? nmcMethod(str(), "replace", [from, to, n], {}, E) : str().split(from).join(to);
    }
    case "truncate": {
      const n = Math.trunc(nmcNum(arg(0, "length", 255))), s = str();
      const kill = nmcTruthy(arg(1, "killwords", false)), end = nmcToStr(arg(2, "end", "..."));
      const lee = Math.trunc(nmcNum(arg(3, "leeway", 5)));
      if (s.length <= n + lee) return s;
      const cut = s.slice(0, Math.max(0, n - end.length));
      if (kill) return cut + end;
      const sp = cut.lastIndexOf(" ");
      return (sp >= 0 ? cut.slice(0, sp) : cut) + end;
    }
    case "center": {
      const w = Math.trunc(nmcNum(arg(0, "width", 80))), s = str();
      if (s.length >= w) return s;
      const left = Math.floor((w - s.length) / 2);
      return " ".repeat(left) + s + " ".repeat(w - s.length - left);
    }
    case "wordcount": return (str().match(/\w+/g) || []).length;
    case "striptags": return str().replace(/<!--[\s\S]*?-->|<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    case "indent": {
      const w = arg(0, "width", 4), first = nmcTruthy(arg(1, "first", false)), blank = nmcTruthy(arg(2, "blank", false));
      const pad = typeof w === "string" ? w : " ".repeat(Math.max(0, Math.min(200, Math.trunc(nmcNum(w)))));
      return str().split("\n").map((l, i) => ((i > 0 || first) && (blank || l.trim() !== "") ? pad + l : l)).join("\n");
    }
    case "slice": {
      const seq = _nmcSeq(r), n = Math.max(1, Math.min(NMC_MAX_TEMPLATE_ITERATIONS, Math.trunc(nmcNum(a0)) || 1));
      const fill = arg(1, "fill_with", undefined);
      const per = Math.floor(seq.length / n), extra = seq.length % n, out = [];
      let offset = 0;
      for (let k = 0; k < n; k++) {
        const start = offset + k * per;
        if (k < extra) offset++;
        const col = seq.slice(start, offset + (k + 1) * per);
        if (fill !== undefined && fill !== null && fill !== NMC_UNDEF && k >= extra) col.push(fill);
        out.push(col);
      }
      return out;
    }
    case "batch": {
      const seq = _nmcSeq(r), n = Math.max(1, Math.trunc(nmcNum(a0)) || 1), fill = arg(1, "fill_with", undefined), out = [];
      for (let i = 0; i < seq.length; i += n) out.push(seq.slice(i, i + n));
      if (fill !== undefined && fill !== NMC_UNDEF && out.length) while (out[out.length - 1].length < n) out[out.length - 1].push(fill);
      return out;
    }
    case "default": case "d":
      if (r === NMC_UNDEF || (nmcTruthy(arg(1, "boolean", false)) ? !nmcTruthy(r) : _nmcIsEmpty(r))) return a.length ? a0 : "";
      return r;
    case "length": case "count":
      if (r instanceof NmcDomain || r instanceof NmcStatesRoot) return r.list().length;
      if (Array.isArray(r)) return r.length;
      if (nmcIsPlain(r)) return Object.keys(r).length;
      return r == null || r === NMC_UNDEF ? 0 : str().length;
    case "thousands": {
      const sep = a.length ? nmcToStr(a0) : " ", parts = str().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, sep);
      return parts.join(".");
    }
    case "first": { const s = _nmcSeq(r); return s.length ? s[0] : NMC_UNDEF; }
    case "last": { const s = _nmcSeq(r); return s.length ? s[s.length - 1] : NMC_UNDEF; }
    case "join": {
      const at = arg(1, "attribute", null);
      const s = Array.isArray(r) || r instanceof NmcDomain ? _nmcSeq(r) : null;
      if (!s) return str();
      const sep = a.length || kw.d !== undefined ? nmcToStr(arg(0, "d", "")) : "";
      const parts = s.map(_nmcKey(at));
      return parts.some((x) => x instanceof NmcSafe) && !_nmcRawOut
        ? new NmcSafe(parts.map(nmcEscOut).join(nmcEscOut(sep))) : parts.map(nmcToStr).join(sep);
    }
    case "reverse": return Array.isArray(r) || nmcIsPlain(r) || r instanceof NmcDomain ? _nmcSeq(r).slice().reverse() : Array.from(str()).reverse().join("");
    case "sum": {
      const f = _nmcKey(arg(0, "attribute", null));
      return _nmcSeq(r).reduce((s, x) => s + nmcNum(f(x)), nmcNum(arg(1, "start", 0)));
    }
    case "average": case "mean": {
      const s = _nmcSeq(r).map(nmcNum);
      return s.length ? s.reduce((x, y) => x + y, 0) / s.length : a.length ? a0 : 0;
    }
    case "min": case "max": {
      const s = _nmcSeq(r), f = _nmcKey(kw.attribute);
      if (!s.length) return NMC_UNDEF;
      return s.reduce((b, x) => ((name === "min" ? nmcOrd(f(x), f(b)) < 0 : nmcOrd(f(x), f(b)) > 0) ? x : b), s[0]);
    }
    case "sort": {
      const rev = nmcTruthy(arg(0, "reverse", false)), cs = nmcTruthy(arg(1, "case_sensitive", false));
      const f = _nmcKey(arg(2, "attribute", null));
      const norm = (v) => (!cs && typeof v === "string" ? v.toLowerCase() : v);
      return _nmcSeq(r).slice().sort((x, y) => { const c = nmcOrd(norm(f(x)), norm(f(y))); return rev ? -c : c; });
    }
    case "unique": {
      const f = _nmcKey(arg(1, "attribute", null)), cs = nmcTruthy(arg(0, "case_sensitive", false)), seen = [], out = [];
      for (const x of _nmcSeq(r)) {
        let k = f(x);
        if (!cs && typeof k === "string") k = k.toLowerCase();
        if (!seen.some((s) => nmcEq(s, k))) { seen.push(k); out.push(x); }
      }
      return out;
    }
    case "dictsort": {
      if (!nmcIsPlain(r)) return [];
      const byVal = nmcToStr(arg(1, "by", "key")) === "value", rev = nmcTruthy(arg(2, "reverse", false));
      return Object.keys(r).map((k) => nmcTup([k, r[k]])).sort((x, y) => { const c = nmcOrd(x[byVal ? 1 : 0], y[byVal ? 1 : 0]); return rev ? -c : c; });
    }
    case "items": return nmcIsPlain(r) ? Object.keys(r).map((k) => nmcTup([k, r[k]])) : [];
    case "groupby": {
      const f = _nmcKey(arg(0, "attribute", null)), groups = [];
      for (const x of _nmcSeq(r)) {
        const k = f(x);
        let g = groups.find((y) => nmcEq(y.grouper, k));
        if (!g) { g = [k, []]; g.grouper = k; g.list = g[1]; groups.push(g); }
        g[1].push(x);
      }
      return groups.sort((x, y) => nmcOrd(x.grouper, y.grouper));
    }
    case "map": {
      const s = _nmcSeq(r);
      if (kw.attribute !== undefined) {
        const f = _nmcKey(kw.attribute);
        return s.map((x) => { const v = f(x); return v === NMC_UNDEF && kw.default !== undefined ? kw.default : v; });
      }
      if (!a.length) return s;
      return s.map((x) => nmcFilter(nmcToStr(a0), x, a.slice(1), {}, E));
    }
    case "selectattr": case "rejectattr": case "select": case "reject": {
      const isAttr = name.endsWith("attr"), keep = name.startsWith("select");
      const f = isAttr ? _nmcKey(a0) : (x) => x, rest = isAttr ? a.slice(1) : a;
      return _nmcSeq(r).filter((x) => {
        const v = f(x);
        const ok = rest.length ? nmcTest(nmcToStr(rest[0]), v, rest.slice(1), {}, E) : nmcTruthy(v);
        return ok === keep;
      });
    }
    case "list":
      if (r == null || r === NMC_UNDEF) return [];
      if (Array.isArray(r) || typeof r === "string" || r instanceof NmcSafe || nmcIsPlain(r) || r instanceof NmcDomain || r instanceof NmcStatesRoot)
        return _nmcOwn(_nmcSeq(r).slice());
      return _nmcOwn([r]);
    case "safe": return r instanceof NmcSafe ? r : new NmcSafe(nmcToStr(r));
    case "e": case "escape": case "forceescape":
      return r instanceof NmcSafe && name !== "forceescape" ? r : new NmcSafe(nmcEscStr(nmcToStr(r)));
    case "urlencode":
      return nmcIsPlain(r) ? Object.keys(r).map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(nmcToStr(r[k]))).join("&") : encodeURIComponent(str());
    case "tojson": case "to_json":
      return new NmcSafe(nmcToJson(r, 0).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/'/g, "\\u0027"));
    case "from_json":
      try { return nmcFromJson(r); } catch (e) { if (a.length) return a0; throw new Error(`from_json → ${e.message}`); }
    case "attr": return nmcAttr(r, nmcToStr(a0));
    case "contains": return nmcIn(a0, r) ? true : false;
    case "is_number": return nmcTest("is_number", r, [], {}, E) ? true : false;
    case "regex_replace": {
      const re = nmcPyRe(arg(0, "find", ""), nmcTruthy(arg(2, "ignorecase", false)) ? "gi" : "g");
      return str().replace(re, nmcPyRepl(arg(1, "replace", "")));
    }
    case "regex_match": case "regex_search": {
      const src = nmcToStr(arg(0, "find", "")), ic = nmcTruthy(arg(1, "ignorecase", false)) ? "i" : "";
      return nmcPyRe(name === "regex_match" ? "^(?:" + src + ")" : src, ic).test(str()) ? true : false;
    }
    case "regex_findall": {
      const re = nmcPyRe(arg(0, "find", ""), nmcTruthy(arg(1, "ignorecase", false)) ? "gi" : "g"), out = [];
      for (const m of str().matchAll(re)) {
        out.push(m.length > 2 ? m.slice(1) : m.length === 2 ? m[1] : m[0]);
        if (out.length >= NMC_MAX_TEMPLATE_ITERATIONS) break;
      }
      return out;
    }
    case "regex_findall_index": {
      const l = nmcFilter("regex_findall", r, [arg(0, "find", "")], { ignorecase: arg(2, "ignorecase", false) }, E);
      return nmcAttr(l, Math.trunc(nmcNum(arg(1, "index", 0))));
    }
    case "timestamp_custom": case "timestamp_local": case "timestamp_utc": {
      const ts = nmcAsTimestamp(r, null);
      if (ts == null || r === NMC_UNDEF || r === "" || (typeof r === "string" && !_nmcNumRe.test(r.trim()) && isNaN(nmcParseDate(r)))) {
        const d = arg(name === "timestamp_custom" ? 2 : 0, "default", undefined);
        if (d !== undefined) return d;
        throw new Error(`${name} → ${_t("valeur invalide")}`);
      }
      const utc = name === "timestamp_utc" || (name === "timestamp_custom" && !nmcTruthy(arg(1, "local", true)));
      if (name !== "timestamp_custom") return nmcDtStr(new NmcDT(ts * 1000, utc), "T");
      return nmcStrftime(new Date(ts * 1000), nmcToStr(arg(0, "format_string", "%Y-%m-%d %H:%M:%S")), E.hass.language, utc);
    }
    case "as_timestamp": return nmcAsTimestamp(r, a.length ? a0 : kw.default);
    case "as_datetime": { const dt = nmcToDT(r, false); return dt || (a.length ? a0 : NMC_UNDEF); }
    case "as_local": { const dt = nmcToDT(r, false); return dt ? new NmcDT(dt.ms, false) : NMC_UNDEF; }
    case "relative_time": return nmcRelTime(r);
  }
  if (Object.prototype.hasOwnProperty.call(nmcMathFns, name)) return _nmcFin(nmcMathFns[name]([nmcNum(r)].concat(_nmcArgNum(a))));
  throw new Error(`|${name} → ${_t("filtre inconnu")}`);
}

/* ── Tests (is …) ── */
function nmcTest(name, v, a, kw, E) {
  const u = v instanceof NmcSafe ? v.s : v, b = a[0];
  switch (name) {
    case "defined": return !(u === NMC_UNDEF || u == null || u === "" || u === "None" || u === "unknown" || u === "unavailable");
    case "undefined": return !nmcTest("defined", v, a, kw, E);
    case "none": return u === null || u === NMC_UNDEF || u === "" || u === "None" || u === "none" || u === "unknown" || u === "unavailable";
    case "number": return typeof u === "number" ? isFinite(u) : typeof u === "string" && !isNaN(parseFloat(u)) && isFinite(u);
    case "is_number": return typeof u === "number" ? isFinite(u) : typeof u === "string" && _nmcNumRe.test(u.trim());
    case "string": return typeof u === "string";
    case "mapping": return nmcIsPlain(u);
    case "iterable": return Array.isArray(u) || typeof u === "string" || nmcIsPlain(u) || u instanceof NmcDomain || u instanceof NmcStatesRoot;
    case "sequence": return Array.isArray(u) || typeof u === "string" || nmcIsPlain(u);
    case "list": return Array.isArray(u);
    case "boolean": return typeof u === "boolean";
    case "true": return u === true;
    case "false": return u === false;
    case "integer": return typeof u === "number" && Number.isInteger(u);
    case "float": return typeof u === "number" && !Number.isInteger(u);
    case "datetime": return u instanceof NmcDT;
    case "even": return Math.trunc(nmcNum(u)) % 2 === 0;
    case "odd": return Math.abs(Math.trunc(nmcNum(u)) % 2) === 1;
    case "divisibleby": { const n = nmcNum(b); return n !== 0 && nmcNum(u) % n === 0; }
    case "eq": case "equalto": case "==": return nmcEq(u, b);
    case "ne": case "!=": return !nmcEq(u, b);
    case "gt": case ">": return nmcOrd(u, b) > 0;
    case "ge": case ">=": return nmcOrd(u, b) >= 0;
    case "lt": case "<": return nmcOrd(u, b) < 0;
    case "le": case "<=": return nmcOrd(u, b) <= 0;
    case "sameas": return u === b;
    case "in": return nmcIn(u, b);
    case "contains": return nmcIn(b, u);
    case "lower": return typeof u === "string" && u === u.toLowerCase();
    case "upper": return typeof u === "string" && u === u.toUpperCase();
    case "match": return nmcPyRe("^(?:" + nmcToStr(b) + ")", nmcTruthy(a[1]) ? "i" : "").test(nmcToStr(u));
    case "search": return nmcPyRe(b, nmcTruthy(a[1]) ? "i" : "").test(nmcToStr(u));
    case "escaped": return v instanceof NmcSafe;
    case "callable": return false;
  }
  throw new Error(`is ${name} → ${_t("test inconnu")}`);
}

/* ── Compilation du template en arbre de nœuds ── */
const NMC_MACRO_PREFIX = "__nmc_macro_";
let _nmcCtx = null;
let _nmcErrs = null;
const NMC_BLOCK_END = { if: "endif", for: "endfor", macro: "endmacro", call: "endcall", filter: "endfilter",
  with: "endwith", block: "endblock", set: "endset" };
const NMC_STRAY = new Set(["endif", "endfor", "endmacro", "endcall", "endfilter", "endwith", "endblock", "endset",
  "elif", "else", "endraw"]);

// Paramètres de macro / de {% call(...) %} : noms avec défaut optionnel, jusqu'à ")".
function nmcParseParams(P) {
  const params = [];
  P.expectOp("(");
  while (!P.isOp(")")) {
    const name = P.name();
    params.push({ name, def: P.skipOp("=") ? P.expr() : null });
    if (!P.skipOp(",")) break;
  }
  P.expectOp(")");
  return params;
}
function nmcParseTargets(P) {
  const paren = P.skipOp("("), targets = [];
  do {
    const name = P.name();
    targets.push(P.skipOp(".") ? { ns: name, attr: P.name() } : { name });
  } while (P.skipOp(",") && !P.isOp(")") && !P.isOp("="));
  if (paren) P.expectOp(")");
  return targets;
}

function nmcCompile(text) {
  const toks = nmcLexTemplate(text);
  let pos = 0;
  const body = (stops) => {
    const nodes = [];
    while (pos < toks.length) {
      const tk = toks[pos++];
      if (tk.t === "text") { nodes.push({ t: "text", s: tk.s }); continue; }
      if (tk.t === "cmt") continue;
      if (tk.t === "out") {
        try { nodes.push({ t: "out", e: nmcParseExpr(tk.s), src: tk.s.trim() }); }
        catch (e) { nodes.push({ t: "err", msg: `{{ ${tk.s.trim().slice(0, 70)} }} → ${e.message}` }); }
        continue;
      }
      const src = tk.s.trim(), m = /^(\w+)\s*([\s\S]*)$/.exec(src);
      const kw = m ? m[1] : "", rest = m ? m[2] : "";
      if (stops && stops.includes(kw)) return { nodes, stop: kw, rest, src };
      nodes.push(tag(kw, rest, src));
    }
    return { nodes, stop: null };
  };
  // Bloc dont la balise de fin manque : rendu quand même, avec une erreur visible.
  const closed = (b, end, node) => (b.stop ? node : { t: "seq", nodes: [node, { t: "err", msg: `{% ${end} %} ${_t("manquant")}` }] });
  const tag = (kw, rest, src) => {
    const fail = (e) => {
      // un en-tête cassé consomme quand même son corps, sinon ce corps s'afficherait seul
      const end = NMC_BLOCK_END[kw];
      if (end && !(kw === "set" && /=/.test(rest))) body([end]);
      return { t: "err", msg: `{% ${src.slice(0, 70)} %} → ${e.message}` };
    };
    try {
      const P = new NmcParser(nmcLexExpr(rest));
      switch (kw) {
        case "if": {
          const branches = [];
          let cond = nmcParseExpr(rest), b;
          for (;;) {
            b = body(["elif", "else", "endif"]);
            branches.push({ cond, body: b.nodes });
            if (b.stop === "elif") { cond = nmcParseExpr(b.rest); continue; }
            if (b.stop === "else") { b = body(["endif"]); branches.push({ cond: null, body: b.nodes }); }
            break;
          }
          return closed(b, "endif", { t: "if", branches });
        }
        case "for": {
          const targets = nmcParseTargets(P);
          if (!P.skipName("in")) throw new Error(`${_t("attendu")} « in », ${_t("trouvé")} ${P.desc()}`);
          const iter = P.tuple(true), cond = P.skipName("if") ? P.or() : null;
          P.skipName("recursive");
          P.end();
          let b = body(["else", "endfor"]), elseBody = null;
          const nodes = b.nodes;
          if (b.stop === "else") { b = body(["endfor"]); elseBody = b.nodes; }
          return closed(b, "endfor", { t: "for", targets, iter, cond, body: nodes, elseBody, src: rest.slice(0, 70) });
        }
        case "set": {
          const targets = nmcParseTargets(P);
          if (P.skipOp("=")) {
            const e = P.tuple();
            P.end();
            return { t: "set", targets, e, src: rest.slice(0, 70) };
          }
          const tail = rest.slice(rest.indexOf(targets[targets.length - 1].name || targets[targets.length - 1].attr) +
            (targets[targets.length - 1].name || targets[targets.length - 1].attr).length).trim();
          const e = tail ? nmcParseExpr("__nmc_body" + tail) : null;
          const b = body(["endset"]);
          return closed(b, "endset", { t: "setblock", targets, e, body: b.nodes });
        }
        case "macro": {
          const name = P.name(), params = P.isOp("(") ? nmcParseParams(P) : [];
          P.end();
          const b = body(["endmacro"]);
          return closed(b, "endmacro", { t: "macro", name, params, body: b.nodes });
        }
        case "call": {
          const callerParams = P.isOp("(") ? nmcParseParams(P) : [];
          const call = P.expr();
          P.end();
          if (call.k !== "call" || call.f.k !== "name") throw new Error(_t("appel invalide"));
          const b = body(["endcall"]);
          return closed(b, "endcall", { t: "call", callerParams, call, body: b.nodes });
        }
        case "filter": {
          const e = nmcParseExpr("__nmc_body|" + rest);
          const b = body(["endfilter"]);
          return closed(b, "endfilter", { t: "filter", e, body: b.nodes });
        }
        case "with": {
          const assigns = [];
          while (P.peek().k !== "eof") {
            const name = P.name();
            P.expectOp("=");
            assigns.push([name, P.expr()]);
            if (!P.skipOp(",")) break;
          }
          P.end();
          const b = body(["endwith"]);
          return closed(b, "endwith", { t: "with", assigns, body: b.nodes });
        }
        case "block": {
          const b = body(["endblock"]);
          return closed(b, "endblock", { t: "seq", nodes: b.nodes });
        }
        case "do": return { t: "do", e: nmcParseExpr(rest) };
        case "break": case "continue": return { t: kw };
        case "include": case "import": case "from": case "extends":
          return { t: "err", msg: `{% ${src.slice(0, 70)} %} → ${_t("balise non supportée")}` };
      }
      if (NMC_STRAY.has(kw)) return { t: "err", msg: `{% ${src.slice(0, 70)} %} → ${_t("balise inattendue")}` };
      return { t: "err", msg: `{% ${src.slice(0, 70)} %} → ${_t("balise inconnue")}` };
    } catch (e) { return fail(e); }
  };
  return body(null).nodes;
}

/* ── Rendu ── */
// Les macros définies dans un {% for %} restent visibles après la boucle (comme Jinja2) :
// on les range dans le scope racine de la chaîne Object.create.
function nmcMacroScope(vars) {
  let root = vars;
  for (let i = 0; i < 64; i++) {
    const proto = Object.getPrototypeOf(root);
    if (!proto || proto === Object.prototype) break;
    root = proto;
  }
  return root;
}
function nmcNewCtx(hass, errs) {
  const ctx = { chars: 0, iterations: 0, depth: 0, truncated: false, warned: new Set(), brk: null };
  ctx.E = { hass, errs, ctx, root: null, warn: (m) => {
    if (errs && !ctx.warned.has(m)) { ctx.warned.add(m); errs.push(m); }
  } };
  return ctx;
}
function nmcAssign(targets, v, V, E) {
  if (targets.length > 1) {
    const seq = _nmcSeq(v instanceof NmcSafe ? v.s : v);
    targets.forEach((t, i) => nmcAssign([t], i < seq.length ? seq[i] : NMC_UNDEF, V, E));
    return;
  }
  const t = targets[0];
  if (typeof v === "string") {
    const num = parseFloat(v);
    if (!isNaN(num) && String(num) === v.trim()) v = num;
  }
  if (t.ns !== undefined) {
    const o = nmcLookupRaw(V, t.ns);
    if (o && nmcIsPlain(o)) o[t.attr] = v;
    else E.warn(`set ${t.ns}.${t.attr} → ${_t("pas un namespace")}`);
  } else V[t.name] = v;
}
const _nmcTgtSrc = (ts) => ts.map((t) => (t.ns !== undefined ? t.ns + "." + t.attr : t.name)).join(", ");
const _nmcErrMsg = (e) => (e && e.message) || String(e);

function nmcRenderNodes(nodes, hass, vars, errs, ctx) {
  ctx = ctx || nmcNewCtx(hass, errs);
  const E = ctx.E, warn = E.warn;
  if (ctx.depth >= NMC_MAX_TEMPLATE_DEPTH) {
    warn(`${_t('template → profondeur maximale')} (${NMC_MAX_TEMPLATE_DEPTH})`);
    return "";
  }
  ctx.depth++;
  const _prevCtx = _nmcCtx, _prevErrs = _nmcErrs;
  _nmcCtx = ctx;
  _nmcErrs = errs;
  let out = "";
  const append = (value) => {
    if (ctx.truncated) return;
    const text = String(value), room = NMC_MAX_TEMPLATE_OUTPUT - ctx.chars;
    if (text.length > room) {
      out += text.slice(0, Math.max(0, room));
      ctx.chars += Math.max(0, room);
      ctx.truncated = true;
      warn(`${_t('template → sortie limitée à')} ${NMC_MAX_TEMPLATE_OUTPUT} ${_t('caractères')}`);
      return;
    }
    out += text;
    ctx.chars += text.length;
  };
  // le texte rendu par un sous-bloc est déjà compté dans ctx.chars
  const sub = (b, V) => { out += nmcRenderNodes(b, hass, V, errs, ctx); };
  const withBody = (V, value) => { const c = Object.create(V); c.__nmc_body = value; return c; };
  try {
    for (const n of nodes) {
      if (ctx.truncated || ctx.brk) break;
      switch (n.t) {
        case "text": append(n.s); break;
        case "out":
          try { append(nmcEscOut(nmcEv(n.e, vars, E))); }
          catch (e) { warn(`{{ ${n.src.slice(0, 70)} }} → ${_nmcErrMsg(e)}`); }
          break;
        case "err": warn(n.msg); break;
        case "seq": sub(n.nodes, vars); break;
        case "macro":
          nmcMacroScope(vars)[NMC_MACRO_PREFIX + n.name] = { params: n.params, body: n.body };
          break;
        case "call": {
          const name = n.call.f.v, def = nmcLookupRaw(vars, NMC_MACRO_PREFIX + name);
          if (!def) { warn(`call ${name}() → ${_t('macro inconnue')}`); break; }
          try {
            const { args, kw } = nmcEvArgs(n.call, vars, E);
            append(nmcEscOut(nmcInvokeMacro(name, def, args, kw, vars, E, { params: n.callerParams, body: n.body, scope: vars })));
          } catch (e) { warn(`call ${name}() → ${_nmcErrMsg(e)}`); }
          break;
        }
        case "set":
          try { nmcAssign(n.targets, nmcEv(n.e, vars, E), vars, E); }
          catch (e) {
            n.targets.forEach((t) => { if (t.name !== undefined) vars[t.name] = ""; });
            warn(`set ${_nmcTgtSrc(n.targets)} = ${n.src} → ${_nmcErrMsg(e)}`);
          }
          break;
        case "setblock": {
          let v = new NmcSafe(nmcRenderNodes(n.body, hass, vars, errs, ctx));
          try { if (n.e) v = nmcEv(n.e, withBody(vars, v), E); }
          catch (e) { warn(`set ${_nmcTgtSrc(n.targets)} → ${_nmcErrMsg(e)}`); }
          nmcAssign(n.targets, v, vars, E);
          break;
        }
        case "filter": {
          const html = nmcRenderNodes(n.body, hass, vars, errs, ctx), ents = [];
          const pua = !/[\uE000-\uF8FF]/.test(html);
          const enc = pua ? html.replace(/&(?:#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);/gi, (m) => {
            if (ents.length >= 6400) return m;
            ents.push(m); return String.fromCharCode(0xE000 + ents.length - 1);
          }) : html;
          try {
            const r = nmcToStr(nmcEv(n.e, withBody(vars, new NmcSafe(enc)), E));
            append(ents.length ? r.replace(/[\uE000-\uF8FF]/g, (c) => ents[c.charCodeAt(0) - 0xE000] || c) : r);
          }
          catch (e) { warn(`filter → ${_nmcErrMsg(e)}`); }
          break;
        }
        case "with": {
          const c = Object.create(vars);
          try { for (const [k, e] of n.assigns) c[k] = nmcEv(e, c, E); }
          catch (e) { warn(`with → ${_nmcErrMsg(e)}`); }
          sub(n.body, c);
          break;
        }
        case "do":
          try { nmcEv(n.e, vars, E); } catch (e) { warn(`do → ${_nmcErrMsg(e)}`); }
          break;
        case "break": case "continue": ctx.brk = n.t; break;
        case "if":
          for (const br of n.branches) {
            let ok = br.cond === null;
            if (!ok) {
              try { ok = nmcTruthy(nmcEv(br.cond, vars, E)); }
              catch (e) { warn(`{% if %} → ${_nmcErrMsg(e)}`); }
            }
            if (ok) { sub(br.body, vars); break; }
          }
          break;
        case "for": {
          const head = `for ${_nmcTgtSrc(n.targets)} in ${n.src}`;
          let it;
          try { it = nmcEv(n.iter, vars, E); }
          catch (e) { warn(`${head} → ${_nmcErrMsg(e)}`); break; }
          if (it instanceof NmcSafe) it = it.s;
          let list;
          if (it === NMC_UNDEF) list = [];
          else if (Array.isArray(it)) list = it;
          else if (it instanceof NmcDomain || it instanceof NmcStatesRoot) list = it.list();
          else if (nmcIsPlain(it)) list = Object.keys(it);
          else if (typeof it === "string") list = Array.from(it);
          else { warn(`${head} → ${_t('pas une liste')} (${it === null ? "none" : typeof it})`); break; }
          const bind = (V, x) => {
            if (n.targets.length === 1) V[n.targets[0].name] = x;
            else { const s = _nmcSeq(x instanceof NmcSafe ? x.s : x); n.targets.forEach((t, i) => { V[t.name] = i < s.length ? s[i] : NMC_UNDEF; }); }
          };
          if (n.cond) {
            try { list = list.filter((x) => { const c = Object.create(vars); bind(c, x); return nmcTruthy(nmcEv(n.cond, c, E)); }); }
            catch (e) { warn(`${head} → ${_nmcErrMsg(e)}`); break; }
          }
          if (!list.length) { if (n.elseBody) sub(n.elseBody, vars); break; }
          const len = Math.min(list.length, Math.max(0, NMC_MAX_TEMPLATE_ITERATIONS - ctx.iterations));
          if (len < list.length) warn(`for ${_nmcTgtSrc(n.targets)} → ${_t('itérations limitées à')} ${NMC_MAX_TEMPLATE_ITERATIONS}`);
          const items = len < list.length ? list.slice(0, len) : list;
          const pl = nmcLookupRaw(vars, "loop"), depth = pl instanceof NmcLoop ? pl.depth + 1 : 1;
          for (let i = 0; i < len && !ctx.truncated; i++) {
            ctx.iterations++;
            const child = Object.create(vars);
            bind(child, items[i]);
            child.loop = new NmcLoop(i, len, items, depth);
            sub(n.body, child);
            if (ctx.brk) { const b = ctx.brk; ctx.brk = null; if (b === "break") break; }
          }
          break;
        }
      }
    }
  } finally {
    ctx.depth--;
    _nmcCtx = _prevCtx;
    _nmcErrs = _prevErrs;
  }
  return out;
}

/* ── Macros partagées, cache, API ── */
const NMC_SHARED_MACRO_DEFS = {};
let _nmcSharedMacrosInit = false;
function nmcInitSharedMacros() {
  if (_nmcSharedMacrosInit) return;
  _nmcSharedMacrosInit = true;
  for (const n of nmcCompile(NMC_SHARED_MACROS_SRC)) {
    if (n.t === "macro") NMC_SHARED_MACRO_DEFS[NMC_MACRO_PREFIX + n.name] = { params: n.params, body: n.body };
  }
}

const _nmcCache = new Map();
function _nmcCached(key, build) {
  let v = _nmcCache.get(key);
  if (!v) {
    v = build();
    if (_nmcCache.size > 200) _nmcCache.clear();
    _nmcCache.set(key, v);
  }
  return v;
}
function nmcParseTemplate(hass, text, vars, errs) {
  if (!hass || !text || typeof text !== "string") return text;
  const d = new Date();
  vars = vars || {};
  // now_hour / now_minute : exposés à plat, gardés pour les cards qui les utilisent.
  vars["now_hour"] = d.getHours();
  vars["now_minute"] = d.getMinutes();
  // Macros partagées : own-properties de ce vars littéral ; une macro locale du même nom
  // définie dans `text` l'écrase pour cette card seulement.
  nmcInitSharedMacros();
  Object.assign(vars, NMC_SHARED_MACRO_DEFS);
  const nodes = _nmcCached(text, () => nmcCompile(text));
  return nmcRenderNodes(nodes, hass, vars, errs).trim();
}

// Titre : posé par textContent, qui ne crée jamais de balise ; l'échapper afficherait &amp;.
function nmcParseTemplateText(hass, text, vars, errs) {
  const prev = _nmcRawOut;
  _nmcRawOut = true;
  try { return nmcParseTemplate(hass, text, vars, errs); }
  finally { _nmcRawOut = prev; }
}

// API de test : applique une chaîne de filtres ("|round(1)|upper") à une valeur.
function nmcApplyFilters(val, filterStr, hass, vars) {
  if (!filterStr || !filterStr.trim()) return val;
  const src = "__nmc_v" + (filterStr.trim().startsWith("|") ? "" : "|") + filterStr.trim();
  const ast = _nmcCached("\u0000f" + src, () => nmcParseExpr(src));
  const V = Object.create(vars || {});
  V.__nmc_v = val;
  return nmcEv(ast, V, nmcNewCtx(hass || {}, null).E);
}

/* ══════════════════════════════════════════════════════════════════
 *  MARKDOWN → HTML (mode body.format = markdown)
 * ════════════════════════════════════════════════════════════════ */
const NMC_SENT_CODE = String.fromCharCode(0),
  NMC_SENT_ESC = String.fromCharCode(1);
function nmcMarkdown(src) {
  if (src == null) return "";
  const lines = String(src).replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  let i = 0;
  const listStack = [];
  function closeLists(toIndent) {
    while (listStack.length && listStack[listStack.length - 1].indent >= toIndent)
      out.push("</" + listStack.pop().type + ">");
  }
  function inline(s) {
    const esc = [];
    s = s.replace(/\\([\\`*_~\[\]()#>!-])/g, (m, ch) => {
      esc.push(ch);
      return NMC_SENT_ESC + (esc.length - 1) + NMC_SENT_ESC;
    });
    const codes = [];
    s = s.replace(/`([^`]+)`/g, (m, c) => {
      codes.push(c);
      return NMC_SENT_CODE + (codes.length - 1) + NMC_SENT_CODE;
    });
    s = s.replace(
      /!\[([^\]]*)\]\(([^)\s]+)\)/g,
      (m, alt, url) => '<img src="' + url + '" alt="' + alt + '">'
    );
    s = s.replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      (m, txt, url) => '<a href="' + url + '">' + txt + "</a>"
    );
    s = s
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/__([^_]+)__/g, "<strong>$1</strong>")
      .replace(/~~([^~]+)~~/g, "<del>$1</del>")
      .replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, "$1<em>$2</em>")
      .replace(/(^|[^_\w])_([^_\s][^_]*?)_(?![_\w])/g, "$1<em>$2</em>");
    s = s.replace(
      new RegExp(NMC_SENT_CODE + "(\\d+)" + NMC_SENT_CODE, "g"),
      (m, n) =>
        "<code>" +
        codes[+n].replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") +
        "</code>"
    );
    s = s.replace(new RegExp(NMC_SENT_ESC + "(\\d+)" + NMC_SENT_ESC, "g"), (m, n) => esc[+n]);
    return s;
  }
  while (i < lines.length) {
    const line = lines[i],
      trimmed = line.trim();
    if (/^\s*</.test(line)) {
      closeLists(-1);
      out.push(line);
      i++;
      continue;
    }
    if (trimmed === "") {
      closeLists(-1);
      i++;
      continue;
    }
    if (/^```/.test(trimmed)) {
      closeLists(-1);
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      out.push(
        '<code style="display:block;white-space:pre-wrap;">' +
          buf.join("\n").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") +
          "</code>"
      );
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      closeLists(-1);
      out.push("<hr>");
      i++;
      continue;
    }
    const h = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      closeLists(-1);
      const lvl = Math.min(h[1].length, 4);
      out.push("<h" + lvl + ">" + inline(h[2]) + "</h" + lvl + ">");
      i++;
      continue;
    }
    const q = trimmed.match(/^>\s?(.*)$/);
    if (q) {
      closeLists(-1);
      out.push("<blockquote>" + inline(q[1]) + "</blockquote>");
      i++;
      continue;
    }
    const indent = line.match(/^(\s*)/)[1].length;
    const ul = trimmed.match(/^[-*+]\s+(.*)$/),
      ol = trimmed.match(/^\d+\.\s+(.*)$/);
    if (ul || ol) {
      const type = ul ? "ul" : "ol",
        content = (ul || ol)[1];
      closeLists(indent + 1);
      if (!listStack.length || listStack[listStack.length - 1].indent < indent) {
        out.push("<" + type + ">");
        listStack.push({ type, indent });
      } else if (listStack[listStack.length - 1].type !== type) {
        out.push("</" + listStack.pop().type + ">");
        out.push("<" + type + ">");
        listStack.push({ type, indent });
      }
      out.push("<li>" + inline(content) + "</li>");
      i++;
      continue;
    }
    closeLists(-1);
    const para = [line];
    i++;
    while (i < lines.length) {
      const nt = lines[i].trim();
      if (
        nt === "" ||
        /^\s*</.test(lines[i]) ||
        /^(#{1,6})\s/.test(nt) ||
        /^>\s?/.test(nt) ||
        /^[-*+]\s/.test(nt) ||
        /^\d+\.\s/.test(nt) ||
        /^```/.test(nt) ||
        /^(-{3,}|\*{3,}|_{3,})$/.test(nt)
      )
        break;
      para.push(lines[i]);
      i++;
    }
    out.push("<p>" + para.map((l) => inline(l.replace(/ {2,}$/, "<br>"))).join(" ") + "</p>");
  }
  closeLists(-1);
  return out.join("\n");
}

/* ══════════════════════════════════════════════════════════════════
 *  HREF / SRC — validation
 * ════════════════════════════════════════════════════════════════ */
// v4.x : http:// toléré UNIQUEMENT vers une IP LAN privée (homelab sans TLS, ex Grafana
// :3000) — jamais vers un domaine public, pour ne pas rouvrir la porte à des liens non
// chiffrés génériques dans les cards markdown.
const NMC_LAN_HTTP_HOST_RE =
  /^http:\/\/(127\.\d{1,3}\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|localhost)(:\d+)?(\/|$)/i;
function nmcSafeHref(raw) {
  if (raw == null) return { safe: false, external: false };
  const h = String(raw).trim();
  if (h === "") return { safe: false, external: false };
  const compact = h.replace(/[\x00-\x20]+/g, "").toLowerCase();
  if (/^(javascript|data|vbscript|file|blob|about):/.test(compact))
    return { safe: false, external: false };
  if (h[0] === "/" && h[1] !== "/") return { safe: true, external: false };
  if (h.startsWith("//")) return { safe: false, external: false };
  if (/^https:\/\//i.test(h)) return { safe: true, external: true };
  if (NMC_LAN_HTTP_HOST_RE.test(h)) return { safe: true, external: true };
  if (/^mailto:[^\s]+@[^\s]+$/i.test(h)) return { safe: true, external: true };
  if (/^(waze|google\.navigation|maps|app-id|homeassistant):/i.test(h))
    return { safe: true, external: true };
  return { safe: false, external: false };
}
function nmcSafeSrc(raw) {
  const src = raw == null ? "" : String(raw).trim();
  if (/^\/(local|api|www|media|brand)\//i.test(src))
    return { safe: true, external: false };
  if (src.startsWith("/")) return { safe: false, external: false };
  return nmcSafeHref(src);
}

/* ══════════════════════════════════════════════════════════════════
 *  SANITIZER (DOM) — body HTML
 * ════════════════════════════════════════════════════════════════ */
const NMC_ALLOWED_TAGS = new Set([
  "BR",
  "B",
  "STRONG",
  "I",
  "EM",
  "U",
  "SMALL",
  "MARK",
  "CODE",
  "SPAN",
  "DIV",
  "HA-ICON",
  "DEL",
  "A",
  "IMG",
  "P",
  "HR",
  "BLOCKQUOTE",
  "H1",
  "H2",
  "H3",
  "H4",
  "UL",
  "OL",
  "LI",
  "TABLE",
  "THEAD",
  "TBODY",
  "TR",
  "TD",
  "TH",
]);
const NMC_GLOBAL_ATTRS = new Set(["style", "class", "title", "aria-label", "role", "data-entity", "data-script", "data-toggle", "data-step"]);
// La vraie garde des commandes est _ctlInBody (id écrit en clair dans le body) ; ici, la forme.
const NMC_DATA_TOGGLE_RE = /^[a-z_]+\.[a-z0-9_]+$/;
const NMC_DATA_STEP_RE = /^(number|input_number)\.[a-z0-9_]+\|-?\d+(\.\d+)?$/;
function nmcDataAttrOk(name, value) {
  const v = value.trim();
  if (name === "data-script") return /^script\.[a-z0-9_]+$/.test(v);
  if (name === "data-entity") return /^[a-z_]+\.[a-zA-Z0-9_]+$/.test(v);
  if (name === "data-toggle") return NMC_DATA_TOGGLE_RE.test(v);
  if (name === "data-step") return NMC_DATA_STEP_RE.test(v);
  return true;
}
const NMC_TAG_ATTRS = {
  A: new Set(["href"]),
  IMG: new Set(["src", "alt", "width", "height", "loading"]),
  TD: new Set(["colspan", "rowspan"]),
  TH: new Set(["colspan", "rowspan", "scope"]),
};
const NMC_ALLOWED_SVG_TAGS = new Set([
  "svg",
  "g",
  "path",
  "polyline",
  "polygon",
  "line",
  "circle",
  "ellipse",
  "rect",
  "text",
  "tspan",
  "defs",
  "lineargradient",
  "radialgradient",
  "stop",
  "image",
  "clippath",
  // v4.1 : SMIL — animations natives SVG. Elles suivent les coordonnées du viewBox
  // (donc s'étirent avec la card, contrairement à offset-path CSS en px figés).
  // animateMotion+path = trajet courbe ; garde-fou : interdit d'animer href (cf sanitizer).
  "animate",
  "animatemotion",
  "animatetransform",
  "mpath",
]);
const NMC_ALLOWED_SVG_ATTRS = new Set([
  "d",
  "points",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "width",
  "height",
  "viewbox",
  "preserveaspectratio",
  "transform",
  "fill",
  "fill-opacity",
  "stroke",
  "stroke-width",
  "stroke-opacity",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-dasharray",
  "stroke-dashoffset",
  "opacity",
  "font-size",
  "font-family",
  "text-anchor",
  "offset",
  "stop-color",
  "stop-opacity",
  "gradientunits",
  "vector-effect",
  "style",
  "class",
  "dominant-baseline",
  "href",
  "xlink:href",
  "clip-path",
  "id",
  "data-entity",
  "data-script",
  "data-toggle",
  "data-step",
  // v4.1 : attributs SMIL (+ pathLength pour normaliser les dash à 100)
  "pathlength",
  "attributename",
  "values",
  "dur",
  "begin",
  "end",
  "repeatcount",
  "keypoints",
  "keytimes",
  "keysplines",
  "calcmode",
  "rotate",
  "additive",
  "accumulate",
  "from",
  "to",
  "by",
  "path",
  "restart",
  "type",
]);
const NMC_SAFE_SVG_HREF_RE = /^\/(local|www|api)\//i;
const NMC_UNSAFE_STYLE_RE =
  /expression\s*\(|javascript\s*:|url\s*\(|@import|behavior\s*:|binding\s*:|moz-binding/i;
const NMC_SAFE_CSS_URL_RE = /url\(\s*(['"]?)\/(local|api|www|media|brand)\/[^)'"\s]+\1\s*\)/gi;

function nmcHasUnsafeStyle(styleStr) {
  return NMC_UNSAFE_STYLE_RE.test(styleStr.replace(NMC_SAFE_CSS_URL_RE, ""));
}

function nmcSanitizeStyle(styleStr) {
  if (!styleStr) return null;
  const clean = styleStr.replace(/\/\*[\s\S]*?\*\//g, "");
  const safeDeclarations = [];
  let start = 0,
    depth = 0,
    quote = "";
  const keep = (declaration) => {
    const colon = declaration.indexOf(":");
    if (colon < 1) return;
    const property = declaration.slice(0, colon).trim();
    const value = declaration.slice(colon + 1).trim();
    if (!/^(?:--[a-zA-Z_][\w-]*|[a-zA-Z][\w-]*)$/.test(property) || !value || nmcHasUnsafeStyle(value)) return;
    safeDeclarations.push(`${property}:${value}`);
  };
  for (let i = 0; i <= clean.length; i++) {
    const c = clean[i] || ";";
    if (quote) {
      if (c === quote && clean[i - 1] !== "\\") quote = "";
    } else if (c === "'" || c === '"') quote = c;
    else if (c === "(") depth++;
    else if (c === ")") depth = Math.max(0, depth - 1);
    else if (c === ";" && depth === 0) {
      keep(clean.slice(start, i));
      start = i + 1;
    }
  }
  return safeDeclarations.join(";");
}

// <style> dans le body : on NE garde QUE les @keyframes sûrs (aucun sélecteur normal
// → impossible de restyler l'app ; URLs externes, js/@import/expression rejetés).
// Permet de déclarer des animations custom directement dans le body, sans toucher au .js.
function nmcExtractKeyframes(css) {
  if (!css) return "";
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const re = /@(?:-webkit-|-moz-)?keyframes\s+[A-Za-z_][\w-]*\s*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g;
  const out = [];
  let m;
  while ((m = re.exec(clean)) !== null) {
    if (!nmcHasUnsafeStyle(m[0])) out.push(m[0]);
  }
  return out.join("\n");
}

// ── morph DOM partiel ──
// Remplacer innerHTML à chaque update hass RESETTE toutes les animations (SMIL animateTransform,
// keyframes CSS) : turbines/radars "sautent" dès qu'une valeur change ailleurs.
// On patche l'ancien arbre en place : même structure -> maj attributs+texte seulement (élément préservé,
// l'animation continue) ; structure différente ({% if %}/{% for %} qui bascule) -> reset LOCAL du sous-arbre.
function nmcMorphNode(from, to) {
  for (let i = from.attributes.length - 1; i >= 0; i--) {
    const n = from.attributes[i].name;
    if (!to.hasAttribute(n)) from.removeAttribute(n);
  }
  for (let i = 0; i < to.attributes.length; i++) {
    const a = to.attributes[i];
    if (from.getAttribute(a.name) !== a.value) from.setAttribute(a.name, a.value);
  }
  nmcMorphChildren(from, to);
}
function nmcMorphChildren(from, to) {
  const fc = from.childNodes,
    tc = to.childNodes;
  if (fc.length !== tc.length) {
    from.innerHTML = "";
    while (to.firstChild) from.appendChild(to.firstChild);
    return;
  }
  for (let i = 0; i < fc.length; i++) {
    const f = fc[i],
      t = tc[i];
    if (f.nodeType !== t.nodeType || (f.nodeType === 1 && f.tagName !== t.tagName)) {
      from.replaceChild(t.cloneNode(true), f);
    } else if (f.nodeType === 1) {
      nmcMorphNode(f, t);
    } else if (f.nodeValue !== t.nodeValue) {
      f.nodeValue = t.nodeValue;
    }
  }
}

const NMC_NS_HTML = "http://www.w3.org/1999/xhtml",
  NMC_NS_SVG = "http://www.w3.org/2000/svg";
// Rend un DocumentFragment inséré tel quel : sérialiser puis re-parser l'arbre nettoyé
// permettait une mutation XSS (le second parse ne donne pas le même arbre).
function nmcSanitizeBody(raw) {
  const html = String(raw ?? "").replace(/\[mdi:([a-zA-Z0-9_-]+)\]/g, '<ha-icon icon="mdi:$1"></ha-icon>');
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  const walker = document.createTreeWalker(tpl.content, NodeFilter.SHOW_ELEMENT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((el) => {
    if (!el.isConnected && !tpl.content.contains(el)) return; // sous-arbre déjà retiré
    const tn = el.tagName,
      tnLower = tn.toLowerCase(),
      ns = el.namespaceURI;
    // Hors HTML/SVG (MathML…), <style>/<script> SVG, foreignObject : retirés AVEC leur contenu
    // (déplier ferait passer du HTML dans le SVG ou du texte CSS en contenu).
    if ((ns !== NMC_NS_HTML && ns !== NMC_NS_SVG) ||
        (ns === NMC_NS_SVG && (tnLower === "style" || tnLower === "script" || tnLower === "foreignobject"))) {
      el.remove();
      return;
    }
    // <style> HTML : conserver uniquement les @keyframes sûrs (déclaration d'animations custom)
    if (tn === "STYLE") {
      // v4.0 : CSS complet conservé (classes, @container, @media…) — le shadow DOM de la
      // card le scope. Fallback keyframes-only si motif dangereux détecté.
      const css = el.textContent || "";
      const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
      if (nmcHasUnsafeStyle(clean) || /@import|@font-face|@namespace|@charset|<\//i.test(clean)) {
        const kf = nmcExtractKeyframes(css);
        if (kf) el.textContent = kf;
        else el.remove();
      }
      return;
    }
    const isSvg = ns === NMC_NS_SVG && NMC_ALLOWED_SVG_TAGS.has(tnLower);
    if (!isSvg && (ns !== NMC_NS_HTML || !NMC_ALLOWED_TAGS.has(tn))) {
      const parent = el.parentNode;
      if (parent) {
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
      }
      return;
    }
    if (tn === "HA-ICON") {
      const icon = el.getAttribute("icon") || "";
      if (!icon.match(/^mdi:[a-zA-Z0-9_-]+$/)) {
        el.replaceWith(document.createTextNode(""));
        return;
      }
      [...el.attributes].forEach((a) => {
        if (a.name !== "icon" && a.name !== "style") el.removeAttribute(a.name);
      });
      const st = el.getAttribute("style");
      if (st) {
        const safe = nmcSanitizeStyle(st);
        if (safe) el.setAttribute("style", safe);
        else el.removeAttribute("style");
      }
      return;
    }
    if (isSvg) {
      // v4.1 SMIL : ne JAMAIS animer un attribut de référence (href → détournement
      // d'URL après sanitization) ni un handler.
      if (tnLower.startsWith("animate") || tnLower === "set") {
        const target = (el.getAttribute("attributeName") || "").toLowerCase();
        if (target === "href" || target === "xlink:href" || target.startsWith("on")) {
          el.remove();
          return;
        }
      }
      [...el.attributes].forEach((a) => {
        const an = a.name.toLowerCase();
        if (an.startsWith("on")) {
          el.removeAttribute(a.name);
          return;
        }
        if (!NMC_ALLOWED_SVG_ATTRS.has(an)) {
          el.removeAttribute(a.name);
          return;
        }
        if (an === "href" || an === "xlink:href") {
          // v4.1 : référence fragment (#id) autorisée — nécessaire pour <mpath>
          const v = a.value.trim();
          if (!NMC_SAFE_SVG_HREF_RE.test(v) && !/^#[A-Za-z_][\w-]*$/.test(v)) {
            el.removeAttribute(a.name);
            return;
          }
        }
        if (!nmcDataAttrOk(an, a.value)) {
          el.removeAttribute(a.name);
          return;
        }
        if (a.name === "style") {
          const safe = nmcSanitizeStyle(a.value);
          if (safe) el.setAttribute("style", safe);
          else el.removeAttribute("style");
        }
      });
      return;
    }
    // HTML : politique par tag
    const tagAttrs = NMC_TAG_ATTRS[tn];
    let anchorExternal = false,
      anchorOk = false;
    [...el.attributes].forEach((a) => {
      const name = a.name.toLowerCase();
      if (name.startsWith("on")) {
        el.removeAttribute(a.name);
        return;
      }
      const allowed = NMC_GLOBAL_ATTRS.has(name) || (tagAttrs && tagAttrs.has(name));
      if (!allowed) {
        el.removeAttribute(a.name);
        return;
      }
      if (!nmcDataAttrOk(name, a.value)) {
        el.removeAttribute(a.name);
        return;
      }
      if (tn === "A" && name === "href") {
        const r = nmcSafeHref(a.value);
        if (!r.safe) {
          el.removeAttribute(a.name);
          return;
        }
        anchorOk = true;
        anchorExternal = r.external;
        return;
      }
      if (tn === "IMG" && name === "src") {
        const r = nmcSafeSrc(a.value);
        if (!r.safe) {
          el.removeAttribute(a.name);
          return;
        }
        return;
      }
      if (name === "style") {
        const safe = nmcSanitizeStyle(a.value);
        if (safe) el.setAttribute("style", safe);
        else el.removeAttribute("style");
        return;
      }
    });
    // A : forcer target/rel selon external, ou neutraliser si href invalide
    if (tn === "A") {
      el.removeAttribute("target");
      el.removeAttribute("rel");
      if (anchorOk && anchorExternal) {
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      }
      if (!anchorOk) {
        el.removeAttribute("href");
      }
    }
  });
  return tpl.content;
}
function nmcSanitizeBodyHTML(raw) {
  const t = document.createElement("template");
  t.content.appendChild(nmcSanitizeBody(raw));
  return t.innerHTML;
}

// ── config normalizer ────────────────────────────────────────────
function nmcBuildConfig(raw) {
  const r = raw || {};
  const title = {
    text: r.title?.text ?? "",
    font_size: r.title?.font_size ?? 24,
    font_weight: r.title?.font_weight ?? 600,
    color: r.title?.color ?? null,
    icon: r.title?.icon ?? r.icon ?? null,
    icon_position: r.title?.icon_position ?? r.icon_position ?? "left",
    icon_color: r.title?.icon_color ?? null,
    icon_size: r.title?.icon_size ?? null,
    font_family: r.title?.font_family ?? r.shared?.font_family ?? null,
    uppercase: r.title?.uppercase ?? false,
    italic: r.title?.italic ?? false,
    letter_spacing: r.title?.letter_spacing ?? 0,
    glow: r.title?.glow ?? false,
    glow_color: r.title?.glow_color ?? null,
    glow_size: r.title?.glow_size ?? 12,
    icon_glow_size: r.title?.icon_glow_size ?? null,
    gradient: r.title?.gradient ?? false,
    gradient_from: r.title?.gradient_from ?? null,
    gradient_to: r.title?.gradient_to ?? null,
    scanline: NMC_IS_LOW_POWER ? false : (r.title?.scanline ?? false),
    flicker: NMC_IS_LOW_POWER ? false : (r.title?.flicker ?? false),
    hover_glitch: NMC_IS_LOW_POWER ? false : (r.title?.hover_glitch ?? false),
    text_shadow: r.title?.text_shadow ?? null,
  };
  const body = {
    content: r.body?.content ?? r.subtitle?.text ?? "", // rétro-compat : accepte subtitle.text de v2
    format: r.body?.format ?? "html",
    font_size: r.body?.font_size ?? 13,
    color: r.body?.color ?? null,
    font_family: r.body?.font_family ?? r.shared?.font_family ?? null,
  };
  const shared = {
    padding: r.shared?.padding ?? "8px 16px",
    bg_color: r.shared?.bg_color ?? null,
    bg_opacity: r.shared?.bg_opacity ?? null,
    bg_blur: r.shared?.bg_blur ?? false,
    border_color: r.shared?.border_color ?? null,
    border_width: r.shared?.border_width ?? null,
    border_style: r.shared?.border_style ?? "solid",
    border_radius: r.shared?.border_radius ?? null,
    align_h: r.shared?.align_h ?? "left",
    align_v: r.shared?.align_v ?? "center",
    tap_action: r.shared?.tap_action ?? "none",
    navigation_path: r.shared?.navigation_path ?? null,
    entity: r.shared?.entity ?? null,
  };
  // mode : title|body|both (rétro-compat v2 : subtitle→body, mode both/subtitle)
  let mode = r.mode ?? "both";
  if (mode === "subtitle") mode = "body";
  const debug = r.debug ?? false;
  const history = Array.isArray(r.history)
    ? r.history
        .filter((h) => h && typeof h.entity === "string")
        .map((h) => ({ entity: h.entity, hours: parseFloat(h.hours) || 24, step: !!h.step }))
    : [];
  return { mode, title, body, shared, debug, history };
}

function nmcCollectDependencies(config) {
  const ids = new Set();
  let dynamic = false;
  const scan = (text) => {
    if (typeof text !== "string") return;
    const aliases = {};
    const aliasRe = /\{%\s*set\s+([a-zA-Z_]\w*)\s*=\s*['"]([^'"]+)['"]\s*%\}/g;
    let aliasMatch;
    while ((aliasMatch = aliasRe.exec(text)) !== null) aliases[aliasMatch[1]] = aliasMatch[2];
    const calls = text.match(/\b(?:states|is_state|state_attr|is_state_attr|has_value)\s*\(/g) || [];
    const entityRe = /\b(?:states|is_state|state_attr|is_state_attr|has_value)\(\s*([^,)\s]+)/g;
    let m;
    while ((m = entityRe.exec(text)) !== null) {
      const unquoted = m[1].replace(/^['"]|['"]$/g, "");
      ids.add(aliases[unquoted] || unquoted);
    }
    // states.domaine.objet : forme attribut, lue elle aussi par le moteur
    const attrRe = /\bstates\.([a-z_][a-z0-9_]*)\.([a-z0-9_]+)/g;
    while ((m = attrRe.exec(text)) !== null) ids.add(m[1] + "." + m[2]);
    // états énumérés (states.sensor, states[...], expand, « in states ») : liste inconnue d'avance
    if (/\bstates\s*\[|\bexpand\s*\(|\bin\s+states\b|\bstates\s*\|/.test(text) ||
        /\bstates\.[a-z_][a-z0-9_]*(?![a-z0-9_.])/.test(text)) dynamic = true;
    const unresolved = [...ids].some((entity) => !/^[-a-zA-Z0-9_]+\.[-a-zA-Z0-9_]+$/.test(entity));
    if (calls.length && unresolved) dynamic = true;
  };
  scan(config?.title?.text);
  scan(config?.body?.content);
  return { ids, dynamic };
}

function nmcDependenciesChanged(info, previousHass, nextHass) {
  if (!previousHass || info?.dynamic) return true;
  for (const entity of info?.ids || []) {
    if (previousHass.states?.[entity] !== nextHass.states?.[entity]) return true;
  }
  return false;
}

function nmcRnd(min, max, dec = 2) {
  return +(Math.random() * (max - min) + min).toFixed(dec);
}

/* ══════════════════════════════════════════════════════════════════
 *  ÉDITEUR
 * ════════════════════════════════════════════════════════════════ */
/* ── i18n FR/EN : la clé est la chaîne française (le français s'affiche tel quel) ── */
let _lang = 'en';
const _EN = {
 "Action au tap": "Tap action",
 "Alignement H": "Horizontal align",
 "Alignement V": "Vertical align",
 "Aucun": "None",
 "Aucune": "None",
 "Bas": "Bottom",
 "Bordure": "Border",
 "Centre": "Centre",
 "Chemin navigation": "Navigation path",
 "Commun": "Shared",
 "Contenu": "Content",
 "Corps": "Body",
 "Corps seul": "Body only",
 "Couleur bordure": "Border colour",
 "Couleur fond": "Background colour",
 "Couleur glow": "Glow colour",
 "Couleur icône": "Icon colour",
 "Couleur texte": "Text colour",
 "Couleurs": "Colours",
 "Dessus": "Top",
 "Droite": "Right",
 "Effets": "Effects",
 "Entité (more-info)": "Entity (more-info)",
 "Espacement": "Spacing",
 "Flicker": "Flicker",
 "Flou fond": "Background blur",
 "Fond": "Background",
 "Format": "Format",
 "Gauche": "Left",
 "Glow": "Glow",
 "Gradient": "Gradient",
 "Gradient début": "Gradient start",
 "Gradient fin": "Gradient end",
 "HTML / Jinja": "HTML / Jinja",
 "HTML : blocs néon (div/span/svg/gradients). Markdown : **gras** [lien](url) # titre - liste. Les deux acceptent {% for %}, {% if %}, {{ states() }}, filtres |sort/map/join/format/clamp… + &lt;style&gt; scopé, data-entity → more-info": "HTML: neon blocks (div/span/svg/gradients). Markdown: **bold** [link](url) # heading - list. Both accept {% for %}, {% if %}, {{ states() }}, filters |sort/map/join/format/clamp… + scoped &lt;style&gt;, data-entity → more-info",
 "Haut": "Top",
 "Hover Glitch": "Hover glitch",
 "Icône": "Icon",
 "Interaction": "Interaction",
 "Italique": "Italic",
 "Majuscules": "Uppercase",
 "Markdown": "Markdown",
 "Mise en page": "Layout",
 "Mode d'affichage": "Display mode",
 "Mon Dashboard — templates {{ states(\"entity\") }} supportés": "My Dashboard — {{ states(\"entity\") }} templates supported",
 "Navigation": "Navigation",
 "Opacité fond (0–1)": "Background opacity (0–1)",
 "Plus d’info": "More info",
 "Points": "Dotted",
 "Police": "Font",
 "Police globale": "Global font",
 "Position icône": "Icon position",
 "Radius": "Radius",
 "Scanline CRT": "CRT scanline",
 "Solide": "Solid",
 "Style": "Style",
 "Taille": "Size",
 "Taille glow": "Glow size",
 "Taille glow icône": "Icon glow size",
 "Texte": "Text",
 "Tirets": "Dashed",
 "Titre": "Title",
 "Titre + Corps": "Title + Body",
 "Titre seul": "Title only",
 "Typographie": "Typography",
 "caractères": "characters",
 "erreur(s)": "error(s)",
 "itérations limitées à": "iterations limited to",
 "appel invalide": "invalid call",
 "après": "after",
 "attendu": "expected",
 "balise inattendue": "unexpected tag",
 "balise inconnue": "unknown tag",
 "balise non supportée": "unsupported tag",
 "caractère inattendu": "unexpected character",
 "chaîne non fermée": "unclosed string",
 "expression invalide": "invalid expression",
 "expression trop imbriquée": "expression nested too deeply",
 "filtre inconnu": "unknown filter",
 "fin de l'expression": "end of expression",
 "fonction inconnue": "unknown function",
 "heure invalide": "invalid time",
 "inattendu": "unexpected",
 "introuvable": "not found",
 "liste trop longue": "list too long",
 "manquant": "missing",
 "méthode inconnue": "unknown method",
 "valeur d'entité en lecture seule : copie-la avec |list ou dict()": "entity value is read-only: copy it with |list or dict()",
 "nom attendu": "name expected",
 "nom de test attendu": "test name expected",
 "pas un namespace": "not a namespace",
 "résultat trop long": "result too long",
 "test inconnu": "unknown test",
 "trouvé": "found",
 "valeur invalide": "invalid value",
 "pas une liste": "not a list",
 "argument inconnu": "unknown argument",
 "macro inconnue": "unknown macro",
 "hors d'un bloc call": "outside a call block",
 "template → profondeur maximale": "template → maximum depth",
 "template → sortie limitée à": "template → output limited to",
 "var(--primary-color) ou #hex": "var(--primary-color) or #hex",
 "Épaisseur": "Thickness",
 "— thème HA —": "— HA theme —"
};
// Deux-points : espace insécable avant en français, aucune en anglais.
const _sep = () => (_lang === "fr" ? " : " : ": ");
const _t = (fr) => {
  if (_lang === 'fr' || fr == null || fr === '') return fr;
  const k = String(fr).replace(/\s+/g, ' ').trim();
  return _EN[k] ?? fr;
};
const _setLang = (h) => {
  const l = /^fr/i.test(String(h?.locale?.language || h?.language || '')) ? 'fr' : 'en';
  if (l === _lang) return false;
  _lang = l; return true;
};

class NeonMarkdownCardEditor extends HTMLElement {
  constructor() {
    super();
    this._config = null;
    this._hass = null;
    this._built = false;
    this._tab = "title";
    this._listeners = [];
  }
  setConfig(c) {
    this._config = c;
    if (this._built) {
      const modeChanged = c?.mode !== this._lastMode;
      if (modeChanged) this._rebuild();
      else this._sync();
    } else if (this._hass) {
      this._built = true;
      this._build();
    }
    this._lastMode = c?.mode;
  }
  set hass(h) {
    this._hass = h;
    _setLang(h); if (this._built && this._bl !== _lang) this._rebuild();
    if (!this._built && this._config) {
      this._built = true;
      this._build();
    }
  }
  disconnectedCallback() {
    this._teardown();
  }
  _teardown() {
    this._listeners.forEach(({ el, ev, fn }) => el.removeEventListener(ev, fn));
    this._listeners = [];
    this._built = false;
  }
  _rebuild() {
    this._teardown();
    this._built = true;
    this._build();
  }
  _on(el, ev, fn) {
    el.addEventListener(ev, fn);
    this._listeners.push({ el, ev, fn });
  }
  _fire() {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }
  _set(section, key, value) {
    const cur = this._config[section];
    const base = cur && typeof cur === "object" && !Array.isArray(cur) ? cur : {};
    this._config = { ...this._config, [section]: { ...base, [key]: value } };
    this._fire();
  }
  _setRoot(key, value) {
    this._config = { ...this._config, [key]: value };
    this._fire();
  }
  _get(section, key) {
    const s = this._config?.[section];
    if (typeof s === "string") return key === "text" ? s : "";
    return s?.[key] ?? "";
  }

  _build() {
    this._bl = _lang;
    this.innerHTML = `
      <style>
        :host { display:block; padding:4px 0; }
        neon-markdown-card-editor { --ned-label:color-mix(in srgb,var(--primary-text-color) 82%,transparent); --ned-dim:color-mix(in srgb,var(--primary-text-color) 60%,transparent); --ned-accent:color-mix(in srgb,var(--primary-color) 55%,var(--primary-text-color)); --ned-line:color-mix(in srgb,var(--primary-color) 55%,transparent); }
        neon-markdown-card-editor ha-expansion-panel { --outline-color:var(--ned-line); --expansion-panel-summary-padding:0 12px; color:var(--primary-text-color); margin-bottom:8px; }
        h3 { font-size:11px; font-weight:700; color:var(--ned-accent); text-transform:uppercase; letter-spacing:1.5px; margin:16px 0 8px; padding-bottom:4px; border-bottom:1px solid var(--ned-line); }
        .tabs { display:flex; gap:4px; margin-bottom:16px; }
        .tab-btn { flex:1; padding:6px 0; border:1px solid var(--ned-line); border-radius:6px; background:transparent; color:var(--primary-text-color); font-size:12px; cursor:pointer; transition:all .2s; text-align:center; user-select:none; }
        .tab-btn.active { background:var(--primary-color); color:#fff; border-color:var(--primary-color); }
        .field { margin-bottom:10px; }
        label { display:block; font-size:11px; color:var(--ned-label); margin-bottom:3px; }
        input[type=text],input[type=number],select,textarea { width:100%; box-sizing:border-box; padding:6px 8px; border-radius:6px; border:1px solid var(--ned-line); background:var(--card-background-color); color:var(--primary-text-color); font-size:12px; }
        textarea { resize:vertical; min-height:48px; font-family:'Share Tech Mono',monospace; }
        textarea.body { min-height:160px; }
        .row2 { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .color-row { display:flex; gap:6px; align-items:center; }
        .color-row input[type=color] { width:36px; height:32px; padding:2px; border-radius:4px; flex-shrink:0; }
        .color-row input[type=text] { flex:1; }
        .toggle-field { display:flex; justify-content:space-between; align-items:center; }
        .switch { position:relative; display:inline-block; width:36px; height:20px; }
        .switch input { opacity:0; width:0; height:0; }
        .slider { position:absolute; inset:0; background:#ccc; border-radius:20px; cursor:pointer; transition:.3s; }
        .slider:before { content:''; position:absolute; width:14px; height:14px; left:3px; bottom:3px; background:#fff; border-radius:50%; transition:.3s; }
        input:checked + .slider { background:var(--primary-color); }
        input:checked + .slider:before { transform:translateX(16px); }
        .hint { font-size:10px; color:var(--ned-dim); margin:2px 0 0; }
        .section-hidden { display:none; }
      </style>
      <div class="tabs">
        <div class="tab-btn ${this._tab === "title" ? "active" : ""}" data-tab="title">${_t('Titre')}</div>
        <div class="tab-btn ${this._tab === "body" ? "active" : ""}" data-tab="body">${_t('Corps')}</div>
        <div class="tab-btn ${this._tab === "shared" ? "active" : ""}" data-tab="shared">${_t('Commun')}</div>
      </div>
      <div class="field"><label>${_t("Mode d'affichage")}</label>
        <select data-root="mode">
          <option value="title" ${(this._config?.mode ?? "both") === "title" ? "selected" : ""}>${_t('Titre seul')}</option>
          <option value="body" ${(this._config?.mode ?? "both") === "body" ? "selected" : ""}>${_t('Corps seul')}</option>
          <option value="both" ${(this._config?.mode ?? "both") === "both" ? "selected" : ""}>${_t('Titre + Corps')}</option>
        </select></div>
      <div id="tab-title" class="${this._tab === "title" ? "" : "section-hidden"}">${this._titleTab()}</div>
      <div id="tab-body" class="${this._tab === "body" ? "" : "section-hidden"}">${this._bodyTab()}</div>
      <div id="tab-shared" class="${this._tab === "shared" ? "" : "section-hidden"}">${this._sharedTab()}</div>
    `;
    this.querySelectorAll('ha-expansion-panel').forEach(p => { p.outlined = true; p.header = _t(p.dataset.header); });
    this._attach();
    this._resolveSwatches();
    requestAnimationFrame(() => this._resolveSwatches()); // pas encore monté au 1er build
  }
  _resolveColor(css) {
    if (!this.isConnected) return null;
    try {
      const probe = document.createElement("span");
      probe.style.cssText = `color:${css};position:absolute;left:-9999px;top:-9999px`;
      this.appendChild(probe);
      const rgb = getComputedStyle(probe).color;
      probe.remove();
      const m = rgb.match(/(\d+),\s*(\d+),\s*(\d+)/);
      return m ? "#" + [m[1], m[2], m[3]].map((n) => (+n).toString(16).padStart(2, "0")).join("") : null;
    } catch {
      return null;
    }
  }
  _resolveSwatches() {
    this.querySelectorAll("input[type=color][data-css-default]").forEach((inp) => {
      const hex = this._resolveColor(inp.dataset.cssDefault);
      if (!hex) return;
      inp.dataset.default = hex;
      if (!/^#[0-9a-f]{6}$/i.test(this._get(inp.dataset.section, inp.dataset.key) || "")) inp.value = hex;
    });
  }
  _titleTab() {
    return `
      <h3>${_t('Texte')}</h3>
      ${this._textarea("Titre", "title", "text", 'Mon Dashboard — templates {{ states("entity") }} supportés')}
      ${this._input("Icône", "title", "icon", "text", "mdi:home")}
      ${this._select("Position icône", "title", "icon_position", [
        ["left", "Gauche"],
        ["right", "Droite"],
        ["top", "Dessus"],
      ])}
      <ha-expansion-panel data-header="Typographie">
      ${this._fontSelect("Police", "title", "font_family")}
      <div class="row2">${this._px("Taille", "title", "font_size", "24")}${this._px("Épaisseur", "title", "font_weight", "600")}</div>
      <div class="row2">${this._toggle("Majuscules", "title", "uppercase")}${this._toggle("Italique", "title", "italic")}</div>
      ${this._input("Espacement", "title", "letter_spacing", "text", "0.02em")}
      </ha-expansion-panel>
      <ha-expansion-panel data-header="Couleurs">
      ${this._color("Couleur texte", "title", "color", "var(--ha-card-header-color, var(--primary-text-color))")}
      ${this._color("Couleur icône", "title", "icon_color", this._get("title", "color") || "var(--ha-card-header-color, var(--primary-text-color))")}
      </ha-expansion-panel>
      <ha-expansion-panel data-header="Effets">
      <div class="row2">${this._toggle("Glow", "title", "glow")}${this._toggle("Gradient", "title", "gradient")}</div>
      ${this._color("Couleur glow", "title", "glow_color", "var(--primary-color, #00E8FF)")}
      ${this._px("Taille glow", "title", "glow_size", "12")}
      ${this._px("Taille glow icône", "title", "icon_glow_size", this._get("title", "glow_size") || "12")}
      ${this._color("Gradient début", "title", "gradient_from", "var(--primary-color, #00E8FF)")}
      ${this._color("Gradient fin", "title", "gradient_to", "var(--accent-color, #FF50A0)")}
      <div class="row2">${this._toggle("Flicker", "title", "flicker")}${this._toggle("Scanline CRT", "title", "scanline")}</div>
      ${this._toggle("Hover Glitch", "title", "hover_glitch")}
      </ha-expansion-panel>
    `;
  }
  _bodyTab() {
    return `
      <h3>${_t('Contenu')}</h3>
      ${this._select("Format", "body", "format", [
        ["html", "HTML / Jinja"],
        ["markdown", "Markdown"],
      ])}
      <p class="hint">${_t(`HTML : blocs néon (div/span/svg/gradients). Markdown : **gras** [lien](url) # titre - liste. Les deux acceptent {% for %}, {% if %}, {{ states() }}, filtres |sort/map/join/format/clamp… + &lt;style&gt; scopé, data-entity → more-info`)}</p>
      ${this._textarea("Corps", "body", "content", '{% for a in state_attr("sensor.x","attackers")|sort(attribute="score",reverse=true) %}...{% endfor %}', "body")}
      <ha-expansion-panel data-header="Typographie">
      ${this._fontSelect("Police", "body", "font_family")}
      ${this._px("Taille", "body", "font_size", "13")}
      ${this._color("Couleur texte", "body", "color", "#888888")}
      </ha-expansion-panel>
    `;
  }
  _sharedTab() {
    return `
      <h3>${_t('Police globale')}</h3>${this._fontSelect("Police", "shared", "font_family")}
      <ha-expansion-panel data-header="Mise en page">${this._padding()}
      ${this._select("Alignement H", "shared", "align_h", [
        ["left", "Gauche"],
        ["center", "Centre"],
        ["right", "Droite"],
      ])}
      ${this._select("Alignement V", "shared", "align_v", [
        ["top", "Haut"],
        ["center", "Centre"],
        ["bottom", "Bas"],
      ])}
      </ha-expansion-panel>
      <ha-expansion-panel data-header="Fond">
      ${this._color("Couleur fond", "shared", "bg_color", "#1a1a2e")}
      ${this._number("Opacité fond (0–1)", "shared", "bg_opacity", "0", "1", "0.05")}
      ${this._toggle("Flou fond", "shared", "bg_blur")}
      </ha-expansion-panel>
      <ha-expansion-panel data-header="Bordure">
      ${this._color("Couleur bordure", "shared", "border_color", "#444444")}
      <div class="row2">${this._px("Épaisseur", "shared", "border_width", "1")}${this._px("Radius", "shared", "border_radius", "12")}</div>
      ${this._select("Style", "shared", "border_style", [
        ["solid", "Solide"],
        ["dashed", "Tirets"],
        ["dotted", "Points"],
        ["none", "Aucun"],
      ])}
      </ha-expansion-panel>
      <ha-expansion-panel data-header="Interaction">
      ${this._select("Action au tap", "shared", "tap_action", [
        ["none", "Aucune"],
        ["navigate", "Navigation"],
        ["more-info", "Plus d’info"],
      ])}
      ${this._input("Chemin navigation", "shared", "navigation_path", "text", "/lovelace/0")}
      ${this._input("Entité (more-info)", "shared", "entity", "text", "light.living_room")}
      </ha-expansion-panel>
    `;
  }
  _input(l, s, k, type = "text", ph = "") {
    return `<div class="field"><label>${_t(l)}</label><input type="${type}" data-section="${s}" data-key="${k}" value="${nmcEscAttr(this._get(s, k))}" placeholder="${_t(ph)}"/></div>`;
  }
  _textarea(l, s, k, ph = "", cls = "") {
    return `<div class="field"><label>${_t(l)}</label><textarea class="${cls}" data-section="${s}" data-key="${k}" placeholder="${_t(ph)}">${nmcEscAttr(this._get(s, k))}</textarea></div>`;
  }
  _px(l, s, k, d = "") {
    const raw = this._get(s, k);
    const num = parseFloat(raw);
    return `<div class="field"><label>${_t(l)}</label><div style="display:flex;gap:4px;align-items:center"><input type="number" data-section="${s}" data-key="${k}" data-px="1" value="${isNaN(num) ? "" : num}" placeholder="${d}" min="0" step="1" style="flex:1"/><span style="font-size:11px;color:var(--secondary-text-color)">px</span></div></div>`;
  }
  _select(l, s, k, opts) {
    const v = this._get(s, k);
    return `<div class="field"><label>${_t(l)}</label><select data-section="${s}" data-key="${k}">${opts.map(([val, lbl]) => `<option value="${val}" ${String(v) === String(val) ? "selected" : ""}>${_t(lbl)}</option>`).join("")}</select></div>`;
  }
  _toggle(l, s, k) {
    const v = !!this._get(s, k);
    return `<div class="field toggle-field"><label>${_t(l)}</label><label class="switch"><input type="checkbox" data-section="${s}" data-key="${k}" ${v ? "checked" : ""}/><span class="slider"></span></label></div>`;
  }
  // d = défaut du RENDU : #hex, ou expression CSS résolue après montage (_resolveSwatches).
  // Le picker natif n'accepte que #rrggbb : toute autre valeur l'afficherait en noir.
  _color(l, s, k, d = "#ffffff") {
    const v = this._get(s, k) || "";
    const hex = /^#[0-9a-f]{6}$/i.test(v) ? v : "";
    const css = d.startsWith("#") ? "" : d;
    const fb = css ? "#ffffff" : d;
    return `<div class="field"><label>${_t(l)}</label><div class="color-row"><input type="color" data-section="${s}" data-key="${k}" value="${hex || fb}" data-default="${fb}"${css ? ` data-css-default="${css}"` : ""} ${!hex ? 'style="opacity:0.4"' : ""}/><input type="text" data-section="${s}" data-key="${k}" value="${nmcEscAttr(v)}" placeholder="${_t('var(--primary-color) ou #hex')}"/></div></div>`;
  }
  _number(l, s, k, mn = "0", mx = "100", st = "1") {
    return `<div class="field"><label>${_t(l)}</label><input type="number" data-section="${s}" data-key="${k}" value="${nmcEscAttr(this._get(s, k))}" min="${mn}" max="${mx}" step="${st}"/></div>`;
  }
  _fontSelect(l, s, k) {
    const v = this._get(s, k);
    return `<div class="field"><label>${_t(l)}</label><select data-section="${s}" data-key="${k}"><option value="" ${!v ? "selected" : ""}>${_t('— thème HA —')}</option>${NMC_FONTS.map((f) => `<option value="${f}" ${v === f ? "selected" : ""}>${f}</option>`).join("")}</select></div>`;
  }
  _padding() {
    const raw = this._get("shared", "padding") || "8px 16px";
    const parts = String(raw).replace(/px/g, "").trim().split(/\s+/);
    const v = parseFloat(parts[0]) || 8;
    const h = parseFloat(parts[1] ?? parts[0]) || 16;
    return `<div class="field"><label>Padding</label><div style="display:flex;gap:6px;align-items:center"><input type="number" data-padding="v" value="${v}" min="0" step="1" style="flex:1"/><span style="font-size:11px;color:var(--secondary-text-color)">px ↕</span><input type="number" data-padding="h" value="${h}" min="0" step="1" style="flex:1"/><span style="font-size:11px;color:var(--secondary-text-color)">px ↔</span></div></div>`;
  }
  _attach() {
    this._on(this, "click", (e) => {
      const btn = e.target.closest(".tab-btn");
      if (!btn) return;
      this._tab = btn.dataset.tab;
      this.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b === btn));
      ["title", "body", "shared"].forEach((t) => {
        const el = this.querySelector(`#tab-${t}`);
        if (el) el.classList.toggle("section-hidden", t !== this._tab);
      });
    });
    const modeEl = this.querySelector('[data-root="mode"]');
    if (modeEl) this._on(modeEl, "change", (e) => this._setRoot("mode", e.target.value));
    this.querySelectorAll("[data-padding]").forEach((inp) =>
      this._on(inp, "input", () => {
        const v = parseFloat(this.querySelector('[data-padding="v"]')?.value) || 0;
        const h = parseFloat(this.querySelector('[data-padding="h"]')?.value) || 0;
        this._set("shared", "padding", `${v}px ${h}px`);
      })
    );
    this.querySelectorAll("[data-section][data-key]").forEach((inp) => {
      const section = inp.dataset.section,
        key = inp.dataset.key,
        isPx = inp.dataset.px === "1";
      const isSelect = inp.tagName === "SELECT",
        isCheckbox = inp.type === "checkbox",
        isNumber = inp.type === "number" && !isPx;
      const ev = isCheckbox || isSelect ? "change" : "input";
      this._on(inp, ev, () => {
        let val;
        if (isCheckbox) val = inp.checked;
        else if (isPx) val = inp.value !== "" ? `${inp.value}px` : null;
        else if (isNumber) val = inp.value !== "" ? parseFloat(inp.value) : null;
        else val = inp.value || null;
        this._set(section, key, val);
      });
    });
  }
  _sync() {
    this.querySelectorAll("[data-section][data-key]").forEach((inp) => {
      if (document.activeElement === inp) return;
      const v = this._get(inp.dataset.section, inp.dataset.key);
      if (inp.type === "color") {
        const hex = /^#[0-9a-f]{6}$/i.test(v || "") ? v : "";
        inp.value = hex || inp.dataset.default || "#ffffff";
        inp.style.opacity = hex ? "" : "0.4";
        return;
      }
      if (inp.type === "checkbox") inp.checked = !!v;
      else {
        const nv = v ?? "";
        if (inp.type === "number" || inp.dataset.px === "1") {
          const cur = parseFloat(inp.value),
            nxt = parseFloat(nv);
          if (!isNaN(cur) && !isNaN(nxt) && cur === nxt) return;
          if (inp.value === "" && nv === "") return;
        }
        if (inp.value !== String(nv)) inp.value = nv;
      }
    });
    const modeEl = this.querySelector('[data-root="mode"]');
    if (modeEl && document.activeElement !== modeEl) modeEl.value = this._config?.mode ?? "both";
  }
}
customElements.define("neon-markdown-card-editor", NeonMarkdownCardEditor);

/* ══════════════════════════════════════════════════════════════════
 *  CARD
 * ════════════════════════════════════════════════════════════════ */
class NeonMarkdownCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._config = null;
    this._rendered = false;
    this._rafId = null;
    this._ro = null;
    this._ac = null;
    this._renderKey = null;
    this._flickDur = nmcRnd(3.5, 5.5);
    this._flickOff = nmcRnd(-2, 0);
    this._scanDur = nmcRnd(6, 10);
    this._histVars = null;
    this._histLast = 0;
    this._histBusy = false;
    this._histGeneration = 0;
    this._dependencyInfo = { ids: new Set(), dynamic: true };
    this._lastHass = null;
    this._forceUpdate = true;
  }
  static getConfigElement() {
    return document.createElement("neon-markdown-card-editor");
  }
  static getStubConfig() {
    return {
      mode: "both",
      title: { text: "CYBER_PI", icon: "mdi:shield-lock" },
      body: {
        format: "html",
        content: '<div style="color:#39FF9E">Body {{ states("sun.sun") }}</div>',
      },
      shared: {},
    };
  }

  setConfig(raw) {
    const newConfig = nmcBuildConfig(raw);
    const newKey = JSON.stringify(newConfig);
    if (newKey === this._renderKey) return;
    const oldHistoryKey = JSON.stringify(this._config?.history || []);
    const newHistoryKey = JSON.stringify(newConfig.history || []);
    if (oldHistoryKey !== newHistoryKey) {
      this._histGeneration++;
      this._histVars = null;
      this._histLast = 0;
      this._histBusy = false;
    }
    this._config = newConfig;
    this._dependencyInfo = nmcCollectDependencies(newConfig);
    this._forceUpdate = true;
    this._renderKey = newKey;
    this._rendered = false;
    if (this._hass && this.isConnected) {
      this._cleanup();
      this._render();
      this._forceUpdate = false;
    }
  }
  set hass(h) {
    _setLang(h); if (this._lg !== _lang) { this._lg = _lang; this._forceUpdate = true; }
    const shouldUpdate = this._forceUpdate || nmcDependenciesChanged(this._dependencyInfo, this._lastHass, h);
    this._hass = h;
    this._lastHass = h;
    if (!this._config) return;
    this._ensureHistory();
    const hasCard = !!this.shadowRoot.querySelector("ha-card.nmc-card");
    const hasStyle = !!this.shadowRoot.querySelector("#nmc-style");
    if (!hasCard || !hasStyle) {
      this._cleanup();
      this._render();
      this._forceUpdate = false;
      return;
    } // FIX leak : cleanup avant re-render
    if (!shouldUpdate) return;
    this._forceUpdate = false;
    if (this._rafId) return;
    this._rafId = requestAnimationFrame(() => {
      this._rafId = 0;
      this._updateBody();
    });
  }
  getGridOptions() { return { columns: 12, min_columns: 3 }; }
  getCardSize() {
    const m = this._config?.mode ?? "both";
    return m === "title" ? 1 : 2;
  }

  _cleanup() {
    if (this._ac) {
      this._ac.abort();
      this._ac = null;
    }
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    if (this._ro) {
      this._ro.disconnect();
      this._ro = null;
    }
  }
  connectedCallback() {
    const card = this.shadowRoot && this.shadowRoot.querySelector("ha-card.nmc-card");
    if (card && this._rendered) {
      this._reattach(card);
      if (this._hass) this._updateBody();
    } else if (this._config && this._hass) {
      this._render();
      this._forceUpdate = false;
    }
  }
  disconnectedCallback() {
    this._cleanup();
  }

  _loadFont(f) {
    nmcLoadFont(f);
  }
  _navigate(p) {
    window.history.pushState(null, "", p);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
  _moreInfo(e) {
    this.dispatchEvent(
      new CustomEvent("hass-more-info", { detail: { entityId: e }, bubbles: true, composed: true })
    );
  }

  _updateBody() {
    if (!this.shadowRoot || !this._config) return;
    const c = this._config,
      mode = c.mode;
    const errs = c.debug ? [] : null;
    if (mode === "title" || mode === "both") {
      const el = this.shadowRoot.querySelector(".nmc-title");
      if (el)
        el.textContent =
          nmcParseTemplateText(this._hass, c.title.text, { hist: this._histVars || {} }, errs) || "";
    }
    if (mode === "body" || mode === "both") {
      const el = this.shadowRoot.querySelector(".nmc-body");
      if (el) {
        let rendered =
          nmcParseTemplate(this._hass, c.body.content, { hist: this._histVars || {} }, errs) || "";
        if (c.body.format === "markdown") rendered = nmcMarkdown(rendered);
        const frag = nmcSanitizeBody(rendered);
        if (errs && errs.length) {
          const uniq = [...new Set(errs)].slice(0, 12);
          const box = document.createElement("div");
          box.setAttribute("style", "margin-top:8px;padding:6px 8px;border:1px solid rgba(255,59,48,.6);background:rgba(255,59,48,.08);font-family:monospace;font-size:11px;line-height:1.5;color:#FF6B61;");
          box.appendChild(document.createTextNode("⚠ nmc debug — " + uniq.length + " " + _t('erreur(s)')));
          for (const m of uniq) {
            box.appendChild(document.createElement("br"));
            box.appendChild(document.createTextNode(String(m)));
          }
          frag.appendChild(box);
        }
        // Sérialiser sert seulement à comparer : on insère le fragment nettoyé, jamais un re-parse.
        const cmp = document.createElement("template");
        cmp.content.appendChild(frag.cloneNode(true));
        if (el.innerHTML !== cmp.innerHTML) {
          // morph partiel au lieu d'un remplacement innerHTML : les éléments animés survivent
          nmcMorphChildren(el, frag);
        }
      }
    }
  }

  _ensureHistory() {
    const list = this._config?.history;
    if (!list || !list.length || !this._hass || this._histBusy) return;
    if (Date.now() - this._histLast < 5 * 60 * 1000) return; // refresh ~5 min max
    this._histBusy = true;
    this._histLast = Date.now();
    const generation = this._histGeneration;
    const out = {};
    Promise.all(
      list.map(async (hc) => {
        try {
          const t1 = Date.now(),
            t0 = t1 - hc.hours * 3600 * 1000;
          const path =
            `history/period/${new Date(t0).toISOString()}?filter_entity_id=${encodeURIComponent(hc.entity)}` +
            `&minimal_response&no_attributes&significant_changes_only`;
          const res = await this._hass.callApi("GET", path);
          let pts = ((res && res[0]) || [])
            .map((row) => ({
              v: parseFloat(row.state ?? row.s),
              t: Date.parse(row.last_changed || row.last_updated || row.lu || 0),
            }))
            .filter((p) => !isNaN(p.v) && p.t >= t0);
          if (pts.length > 240) {
            const stride = Math.ceil(pts.length / 240);
            pts = pts.filter((_, idx) => idx % stride === 0);
          }
          if (!pts.length) return;
          // step : valeur tenue jusqu'au changement suivant (registre, consigne) au lieu d'une
          // interpolation entre deux états, et prolongée jusqu'à maintenant (pas d'état émis
          // tant que la valeur ne bouge pas).
          if (hc.step) {
            const st = [pts[0]];
            for (let i = 1; i < pts.length; i++) {
              st.push({ v: pts[i - 1].v, t: pts[i].t }, pts[i]);
            }
            st.push({ v: pts[pts.length - 1].v, t: t1 });
            pts = st;
          }
          let mn = Infinity,
            mx = -Infinity;
          for (const p of pts) {
            if (p.v < mn) mn = p.v;
            if (p.v > mx) mx = p.v;
          }
          const span = mx - mn || 1;
          const coords = pts
            .map(
              (p) =>
                `${(((p.t - t0) / (t1 - t0)) * 100).toFixed(1)},${(30 - ((p.v - mn) / span) * 30).toFixed(1)}`
            )
            .join(" ");
          // Repères toutes les 6 h sur l'heure locale ; marge 4 % aux bords, étiquette coupée
          // au-delà de 88 % pour ne pas chevaucher l'heure de fin.
          const ticks = [];
          const step = 6 * 3600 * 1000;
          const d0 = new Date(t0);
          d0.setMinutes(0, 0, 0);
          d0.setHours(Math.ceil((d0.getHours() + (d0 < t0 ? 1 : 0)) / 6) * 6);
          for (let t = d0.getTime(); t < t1; t += step) {
            const x = ((t - t0) / (t1 - t0)) * 100;
            if (x < 4 || x > 96) continue;
            const h = new Date(t).getHours();
            ticks.push({ x: x.toFixed(1), l: `${String(h).padStart(2, "0")}h`, m: h === 0, lab: x < 88 });
          }
          const de = new Date(t1);
          out[hc.entity] = {
            pts: coords,
            ticks,
            end: `${String(de.getHours()).padStart(2, "0")}:${String(de.getMinutes()).padStart(2, "0")}`,
            min: mn,
            max: mx,
            first: pts[0].v,
            last: pts[pts.length - 1].v,
            n: pts.length,
            hours: hc.hours,
          };
        } catch (e) {
          if (this._config?.debug) console.warn("nmc history", hc.entity, e);
        }
      })
    ).then(() => {
      if (generation !== this._histGeneration) return;
      this._histBusy = false;
      this._histVars = out;
      if (this.isConnected && this.shadowRoot) this._updateBody();
    });
  }

  _render() {
    if (!this._config) return;
    const c = this._config,
      t = c.title,
      b = c.body,
      sh = c.shared,
      mode = c.mode;
    const showTitle = mode === "title" || mode === "both";
    const showBody = mode === "body" || mode === "both";
    if (t.font_family) this._loadFont(t.font_family);
    if (b.font_family) this._loadFont(b.font_family);
    if (sh.font_family) this._loadFont(sh.font_family);

    const _neonGlow = (color, size) => {
      if (!color) return "";
      const s = parseInt(size) || 10;
      return `text-shadow:0 0 ${Math.round(s * 0.2)}px #fff,0 0 ${Math.round(s * 0.4)}px ${color},0 0 ${Math.round(s * 0.8)}px ${color},0 0 ${s}px ${color};`;
    };

    const tFontFamily = t.font_family
      ? `'${t.font_family}', var(--primary-font-family, 'Rajdhani', 'Share Tech Mono', sans-serif)`
      : "var(--primary-font-family, 'Rajdhani', 'Share Tech Mono', sans-serif)";
    const tFontSize = `${parseFloat(t.font_size) || 24}px`;
    const tColor = t.color || "var(--ha-card-header-color, var(--primary-text-color))";
    const tIconColor = t.icon_color || tColor;
    const tIconSize = t.icon_size ? `${parseFloat(t.icon_size)}px` : `calc(${tFontSize} * 1.2)`;
    // nombre nu (éditeur, ancienne config) = px ; "0.1em", clamp(), var() passent tels quels
    const tLetterSp = t.letter_spacing
      ? (/^-?\d*\.?\d+$/.test(String(t.letter_spacing).trim()) ? `${parseFloat(t.letter_spacing)}px` : String(t.letter_spacing))
      : "0.02em";
    const tGlowColor = t.glow_color || "var(--primary-color, #00E8FF)";
    const tGlowSize = parseFloat(t.glow_size) || 12;
    const tIconGlowSize = parseFloat(t.icon_glow_size) || tGlowSize;
    const tGlowShadow = t.text_shadow
      ? `text-shadow: ${t.text_shadow};`
      : t.glow
        ? _neonGlow(tGlowColor, tGlowSize)
        : "";
    const tGradFrom = t.gradient_from || "var(--primary-color, #00E8FF)";
    const tGradTo = t.gradient_to || "var(--accent-color, #FF50A0)";
    const tGradCSS = t.gradient
      ? `background:linear-gradient(90deg,${tGradFrom},${tGradTo});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;`
      : "";
    const tFlickAnim = t.flicker
      ? `animation:nmc-flicker ${this._flickDur}s ease-in-out infinite ${this._flickOff}s;`
      : "";

    const bFontFamily = b.font_family
      ? `'${b.font_family}', var(--primary-font-family, 'Rajdhani', 'Share Tech Mono', sans-serif)`
      : tFontFamily;
    const bFontSize = `${parseFloat(b.font_size) || 13}px`;
    const bColor = b.color || "var(--secondary-text-color, #888)";

    const alignV =
      { top: "flex-start", center: "center", bottom: "flex-end" }[sh.align_v] || "center";
    const alignH =
      { left: "flex-start", center: "center", right: "flex-end" }[sh.align_h] || "flex-start";
    const textAlign = sh.align_h || "left";
    const hasIcon = !!t.icon;
    const iconPos = t.icon_position;
    const iconRight = iconPos === "right",
      iconTop = iconPos === "top";
    const flexDir = iconTop ? "column" : iconRight ? "row-reverse" : "row";

    let bgStyle = "";
    if (sh.bg_color) {
      const hex = sh.bg_color.replace("#", "");
      if (/^[0-9a-fA-F]{6}$/.test(hex)) {
        const r = parseInt(hex.slice(0, 2), 16),
          g = parseInt(hex.slice(2, 4), 16),
          bl = parseInt(hex.slice(4, 6), 16);
        bgStyle = `background:rgba(${r},${g},${bl},${sh.bg_opacity ?? 1});`;
      } else bgStyle = `background:${sh.bg_color};`;
    } else if (sh.bg_opacity != null)
      bgStyle = `background:rgba(var(--rgb-card-background-color,255,255,255),${sh.bg_opacity});`;
    const blurNum = parseFloat(sh.bg_blur);
    const blurVal =
      !isNaN(blurNum) && blurNum > 0 ? `${blurNum}px` : sh.bg_blur === true ? "8px" : "";
    const hasBorder = !!(
      sh.border_color ||
      sh.border_width ||
      (sh.border_style && sh.border_style !== "solid")
    );
    const borderCss = hasBorder
      ? `border:${sh.border_width || "1px"} ${sh.border_style || "solid"} ${sh.border_color || "var(--divider-color)"};`
      : "";
    const radiusCss = sh.border_radius ? `border-radius:${parseFloat(sh.border_radius)}px;` : "";
    const glowBoxShadow = t.glow
      ? `box-shadow:var(--ha-card-box-shadow,none),0 0 ${tGlowSize * 2}px ${tGlowColor}44;`
      : "";
    const interactive = sh.tap_action !== "none";
    const bothGrid = mode === "both" && hasIcon && !iconTop && !iconRight;

    this.shadowRoot.innerHTML = `
      <style id="nmc-style">
        :host { display:block; contain:layout style; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; text-rendering:optimizeLegibility; }
        ha-card.nmc-card { contain:layout style; box-sizing:border-box; width:100%; position:relative; overflow:visible;
          ${bgStyle}${glowBoxShadow}${radiusCss}${blurVal ? `backdrop-filter:blur(${blurVal});-webkit-backdrop-filter:blur(${blurVal});` : ""}${hasBorder ? borderCss : ""}${t.hover_glitch ? "transition:transform 0.25s cubic-bezier(0.4,0,0.2,1);" : ""}
          --nmc-uv:var(--rgb-primary-color,98,0,234); --nmc-cy:var(--rgb-accent-color,0,255,249); --nmc-bl:var(--rgb-blacklight-color,180,0,255); --nmc-er:var(--rgb-error-color,255,45,107); }
        @keyframes nmc-flicker { 0%,19%,21%,23%,25%,54%,56%,100%{opacity:1;} 20%,24%,55%{opacity:.6;} }
        @keyframes nmc-scan-scroll { from{transform:translateY(0) translateZ(0);} to{transform:translateY(50%) translateZ(0);} }
        @keyframes nmc-scan-flicker { 0%,100%{opacity:0;} 8%{opacity:0.04;} 9%{opacity:0;} 41%{opacity:0.06;} 42%{opacity:0;} 76%{opacity:0.03;} 77%{opacity:0;} }
        @keyframes nmc-card-glitch { 0%,100%{transform:translateY(-10px) scale(1.03) translateZ(0);} 15%{transform:translateY(-10px) scale(1.03) translate(-6px,4px) translateZ(0); filter:drop-shadow(6px 0 rgba(var(--nmc-cy),1)) drop-shadow(-6px 0 rgba(var(--nmc-er),1));} 30%{transform:translateY(-10px) scale(1.03) translate(6px,-4px) translateZ(0); filter:drop-shadow(-6px 0 rgba(var(--nmc-bl),1)) drop-shadow(6px 0 rgba(var(--nmc-er),1));} 45%{transform:translateY(-10px) scale(1.03) translate(-4px,3px) translateZ(0); filter:drop-shadow(5px 5px rgba(var(--nmc-cy),1)) drop-shadow(-5px -5px rgba(var(--nmc-er),1));} 60%{transform:translateY(-10px) scale(1.03) translate(5px,-2px) translateZ(0);} 75%{transform:translateY(-10px) scale(1.03) translate(-3px,0) translateZ(0);} }
        @keyframes nmc-icon-glitch { 0%,100%{transform:scale(1) rotate(0) translateZ(0);} 20%{transform:scale(1.15) rotate(-12deg) translateZ(0);} 40%{transform:scale(1.2) rotate(12deg) translateZ(0);} 60%{transform:scale(1.15) rotate(-8deg) translateZ(0);} 80%{transform:scale(1.08) rotate(5deg) translateZ(0);} }
        @keyframes nmc-text-glitch { 0%,100%{transform:translate(0,0) translateZ(0);} 25%{transform:translate(-4px,0) translateZ(0); text-shadow:4px 0 rgba(var(--nmc-cy),1),-4px 0 rgba(var(--nmc-er),1);} 50%{transform:translate(4px,0) translateZ(0); text-shadow:-4px 0 rgba(var(--nmc-bl),1),4px 0 rgba(var(--nmc-er),1);} 75%{transform:translate(-3px,0) translateZ(0); text-shadow:3px 0 rgba(var(--nmc-bl),1),0 0 15px rgba(var(--nmc-cy),0.8);} }
        @keyframes nmc-core-pulse { 0%,100%{transform:scale(1) translateZ(0); filter:brightness(1);} 50%{transform:scale(1.04) translateZ(0); filter:brightness(1.25);} }
        @keyframes nmc-core-glow { 0%,100%{filter:brightness(0.96);} 50%{filter:brightness(1.18);} }
        @keyframes nmc-ring-spin { from{transform:rotate(0) translateZ(0);} to{transform:rotate(360deg) translateZ(0);} }
        @keyframes nmc-ring-spin-rev { from{transform:rotate(360deg) translateZ(0);} to{transform:rotate(0) translateZ(0);} }
        @keyframes nmc-data-flow { from{transform:translateY(0) translateZ(0);} to{transform:translateY(-50%) translateZ(0);} }
        @keyframes nmc-thermo-wave { 0%,100%{opacity:0.8;} 50%{opacity:1;} }
        @keyframes nmc-cell-charge { 0%,100%{opacity:0.75;} 50%{opacity:1;} }
        @keyframes nmc-shimmer { from{transform:translateX(-180%) translateZ(0);} to{transform:translateX(280%) translateZ(0);} }
        @keyframes nmc-stream-x { from{transform:translateX(-50%) translateZ(0);} to{transform:translateX(0) translateZ(0);} }
        @keyframes nmc-stream-x-rev { from{transform:translateX(0) translateZ(0);} to{transform:translateX(-50%) translateZ(0);} }
        @keyframes nmc-pulse-travel { 0%{left:-10%;opacity:0;} 8%{opacity:1;} 92%{opacity:1;} 100%{left:100%;opacity:0;} }
        @keyframes nmc-pulse-travel-rev { 0%{left:100%;opacity:0;} 8%{opacity:1;} 92%{opacity:1;} 100%{left:-10%;opacity:0;} }
        @keyframes nmc-fiber-glow { 0%,100%{opacity:0.5;} 50%{opacity:0.85;} }
        @keyframes nmc-filter-scan { 0%,100%{transform:translateY(-50%) translateZ(0); opacity:0;} 12%{opacity:0.9;} 50%{transform:translateY(50%) translateZ(0); opacity:0.9;} 88%{opacity:0.9;} }
        @keyframes nmc-filter-glow { 0%,100%{opacity:0.65;} 50%{opacity:1;} }
        @keyframes nmc-block-flash { 0%,100%{opacity:0.35; transform:scale(1) translateZ(0);} 50%{opacity:1; transform:scale(1.25) translateZ(0);} }
        @keyframes nmc-pew-flow { from{stroke-dashoffset:3080;} to{stroke-dashoffset:0;} }
        @keyframes nmc-blip-pulse { 0%,100%{opacity:0.4;} 50%{opacity:1;} }
        @keyframes nmc-dash-crawl { to{stroke-dashoffset:-120;} }
        /* scrollbars néon des zones scrollables du body */
        .nmc-body ::-webkit-scrollbar { width:6px; }
        .nmc-body ::-webkit-scrollbar-track { background:rgba(0,0,0,0.25); border-radius:3px; }
        .nmc-body ::-webkit-scrollbar-thumb { background:linear-gradient(180deg,#FF2D6B,#B400FF); border-radius:3px; box-shadow:0 0 5px #FF2D6B88; }
        .nmc-body ::-webkit-scrollbar-thumb:hover { background:#FF2D6B; }
        /* tuiles interactives : hover desktop (lève + éclaircit), inerte au tactile */
        .nmc-body .nmc-tile { transition:transform .15s ease, filter .15s ease; }
        .nmc-body [data-entity], .nmc-body [data-script], .nmc-body [data-toggle], .nmc-body [data-step] { cursor:pointer; }
        @media (hover:hover) { .nmc-body .nmc-tile:hover { transform:translateY(-2px) scale(1.02); filter:brightness(1.18); } }
        /* low-power (iPad/mobile/app Companion) : coupe les BALAYAGES continus coûteux
           injectés par un body markdown (scanlines, data-flow, shimmer, pulse-travel).
           Garde les pulses d'état ponctuels/légers (blip, core-glow, status-dot). */
        ${NMC_IS_LOW_POWER ? `
        .nmc-body [style*="nmc-data-flow"], .nmc-body [style*="nmc-scan-scroll"],
        .nmc-body [style*="nmc-scan-flicker"], .nmc-body [style*="nmc-shimmer"],
        .nmc-body [style*="nmc-pulse-travel"], .nmc-body [style*="nmc-stream-x"],
        .nmc-body [style*="nmc-pew-flow"] { animation:none !important; }
        ` : ""}
        /* lignes extensibles (listes scrollables) : le détail se déplie DANS le flux au survol
           (une tipbox flottante serait rognée par l'overflow:auto du conteneur scrollable) */
        .nmc-body .nmc-xmore { max-height:0; overflow:hidden; opacity:0; transition:max-height .2s ease, opacity .2s ease; }
        @media (hover:hover) { .nmc-body .nmc-xrow:hover .nmc-xmore { max-height:110px; opacity:1; } }
        /* markdown de base */
        .nmc-body a { color:var(--primary-color); text-decoration:none; border-bottom:1px solid currentColor; }
        .nmc-body a:hover { filter:brightness(1.3); }
        .nmc-body h1,.nmc-body h2,.nmc-body h3,.nmc-body h4 { margin:.4em 0 .2em; line-height:1.2; }
        .nmc-body ul,.nmc-body ol { margin:.2em 0; padding-left:1.4em; }
        .nmc-body code { font-family:'Share Tech Mono',monospace; background:rgba(255,255,255,0.08); padding:0 4px; border-radius:3px; }
        .nmc-body table { border-collapse:collapse; width:100%; }
        .nmc-body td,.nmc-body th { padding:3px 7px; border-bottom:1px solid var(--divider-color); text-align:left; }
        .nmc-body blockquote { margin:.3em 0; padding-left:.8em; border-left:2px solid var(--primary-color); opacity:.85; }
        .nmc-body { min-width:0; overflow-wrap:anywhere; }
        .nmc-body img,.nmc-body svg { max-width:100%; }
        .nmc-wrap,.nmc-wrap *,.nmc-icon-wrap,.nmc-text-wrap,.nmc-title,.nmc-body { box-sizing:border-box; }
        ${t.scanline ? `.nmc-scanlines{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:2;border-radius:inherit;} .nmc-scanlines::before{content:' ';display:block;position:absolute;left:0;right:0;top:-100%;height:200%;background:linear-gradient(rgba(18,16,16,0) 50%,rgba(0,0,0,0.15) 50%),linear-gradient(90deg,rgba(255,0,0,0.05),rgba(0,255,0,0.02),rgba(0,0,255,0.05));background-size:100% 3px,3px 100%;animation:nmc-scan-scroll ${(this._scanDur * 1.5).toFixed(1)}s linear infinite;will-change:transform;transform:translateZ(0);} .nmc-scanlines::after{content:' ';display:block;position:absolute;inset:0;background:rgba(18,16,16,0.08);opacity:0;animation:nmc-scan-flicker 4s step-end infinite;}` : ""}
        ${t.hover_glitch ? `ha-card.nmc-card:hover{transform:translateY(-8px) scale(1.02) translateZ(0);animation:nmc-card-glitch 0.4s cubic-bezier(0.4,0,0.2,1);} ha-card.nmc-card:hover .nmc-title{animation:nmc-text-glitch 0.4s cubic-bezier(0.4,0,0.2,1);} ha-card.nmc-card:hover .nmc-icon-wrap ha-icon{animation:nmc-icon-glitch 0.4s cubic-bezier(0.4,0,0.2,1);}` : ""}
        .nmc-wrap {
          ${bothGrid ? `display:grid; grid-template-columns:auto 1fr; align-items:center; column-gap:10px;` : `display:flex; flex-direction:${flexDir}; align-items:${alignV}; justify-content:${alignH}; gap:${iconTop ? "6px" : "10px"};`}
          padding:${sh.padding}; ${mode === "both" ? "padding-bottom:12px;" : ""} position:relative; overflow:visible; }
        ${bothGrid ? `.nmc-wrap>.nmc-icon-wrap{grid-column:1;grid-row:1;} .nmc-wrap>.nmc-text-wrap{display:contents;} .nmc-text-wrap>.nmc-title{grid-column:2;grid-row:1;align-self:center;} .nmc-text-wrap>.nmc-body{grid-column:1 / -1;grid-row:2;width:100%;padding-top:10px;margin-top:8px;border-top:1px solid;border-image:linear-gradient(90deg, transparent, rgba(98,0,234,0.55), rgba(0,255,249,0.25), transparent) 1;} ${t.scanline ? `.nmc-wrap>.nmc-scanlines{grid-column:1 / -1;grid-row:1;inset:auto;position:absolute;top:0;left:0;right:0;bottom:auto;height:100%;pointer-events:none;z-index:2;}` : ""}` : mode === "both" ? `.nmc-title{padding-bottom:10px;margin-bottom:10px;border-bottom:1px solid;border-image:linear-gradient(90deg, transparent, rgba(98,0,234,0.55), rgba(0,255,249,0.25), transparent) 1;}` : ""}
        .nmc-icon-wrap { display:${hasIcon ? "flex" : "none"}; align-items:center; justify-content:center; flex-shrink:0; overflow:visible; }
        .nmc-icon-wrap ha-icon { --mdc-icon-size:${tIconSize}; color:${tIconColor}; overflow:visible; ${t.glow ? `filter:drop-shadow(0 0 ${Math.round(tIconGlowSize * 0.2)}px #fff) drop-shadow(0 0 ${Math.round(tIconGlowSize * 0.4)}px ${tGlowColor}) drop-shadow(0 0 ${Math.round(tIconGlowSize * 0.8)}px ${tGlowColor}) drop-shadow(0 0 ${tIconGlowSize}px ${tGlowColor});` : ""} ${t.flicker && !t.hover_glitch ? tFlickAnim : ""} }
        .nmc-text-wrap { display:flex; flex-direction:column; gap:3px; text-align:${textAlign}; ${iconTop ? "align-items:center;" : ""} ${sh.align_h !== "center" ? "flex:1;" : ""} min-width:0; overflow:visible; }
        .nmc-title { display:${showTitle ? "block" : "none"}; font-family:${tFontFamily}; font-size:${tFontSize}; font-weight:${t.font_weight || 600}; letter-spacing:${tLetterSp}; line-height:1.2; overflow:visible; ${t.uppercase ? "text-transform:uppercase;" : ""}${t.italic ? "font-style:italic;" : ""}${tGradCSS || `color:${tColor};`}${!t.hover_glitch ? tGlowShadow : ""}${!t.hover_glitch ? tFlickAnim : ""}${t.hover_glitch ? "transition:transform 0.2s,text-shadow 0.2s;" : ""} }
        .nmc-body { display:${showBody ? "block" : "none"}; font-family:${bFontFamily}; font-size:${bFontSize}; font-weight:400; line-height:1.4; overflow:visible; color:${bColor}; }
        .nmc-body ha-icon { --mdc-icon-size:${bFontSize}; vertical-align:middle; }
        @media (max-width:1100px) { .nmc-title{font-size:${Math.max(11, Math.round((parseFloat(t.font_size) || 24) * 0.85))}px;} .nmc-body{font-size:${Math.max(10, Math.round((parseFloat(b.font_size) || 13) * 0.9))}px;} }
      </style>
      <ha-card class="nmc-card"${interactive ? ' style="cursor:pointer"' : ""}>
        <div class="nmc-wrap">
          ${t.scanline ? '<div class="nmc-scanlines" aria-hidden="true"></div>' : ""}
          <div class="nmc-icon-wrap"></div>
          <div class="nmc-text-wrap">
            <div class="nmc-title"></div>
            <div class="nmc-body"></div>
          </div>
        </div>
      </ha-card>
    `;
    if (hasIcon) {
      const iconEl = document.createElement("ha-icon");
      iconEl.setAttribute("icon", t.icon);
      this.shadowRoot.querySelector(".nmc-icon-wrap").appendChild(iconEl);
    }
    this._updateBody();
    this._reattach(this.shadowRoot.querySelector("ha-card.nmc-card"));
    this._rendered = true;
  }

  // Un tap ne commande que des entités écrites en clair dans le body rédigé par l'auteur :
  // un id injecté par l'état d'une entité (input_text, MQTT) n'y figure pas.
  _ctlInBody(eid) {
    const src = this._config?.body?.content;
    if (typeof src !== "string" || !eid) return false;
    const esc = eid.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp("(^|[^a-z0-9_.])" + esc + "(?![a-z0-9_])").test(src);
  }

  _reattach(card) {
    if (!card) return;
    if (!this._ro && window.ResizeObserver) {
      this._ro = new ResizeObserver((entries) => {
        for (const e of entries) if (e.contentRect.width === 0) return;
        if (this._rafId) return;
        this._rafId = requestAnimationFrame(() => {
          this._rafId = 0;
          this._updateBody();
        });
      });
      this._ro.observe(card);
    }

    // On regroupe TOUS les addEventListener sous le même garde-fou unique
    if (!this._ac) {
      this._ac = new AbortController();

      // 0. data-script="script.x" (v4.12) : tap → script.turn_on ; data-toggle="…" (v4.18) : tap →
      //    homeassistant.toggle ; data-entity="…" (v4.0) : tap → more-info.
      //    Tous prioritaires sur le tap_action global.
      card.addEventListener(
        "click",
        (e) => {
          const run = e.target && e.target.closest ? e.target.closest("[data-script]") : null;
          if (run) {
            e.stopImmediatePropagation();
            e.preventDefault();
            this._hass?.callService("script", "turn_on", { entity_id: run.getAttribute("data-script") });
            return;
          }
          // data-step="<entity_id>|<delta>" : tap → set_value(valeur + delta), borné aux attributs
          // min/max de l'entité et arrondi à son pas (les flottants accumulent 0.1+0.2).
          const stp = e.target && e.target.closest ? e.target.closest("[data-step]") : null;
          if (stp) {
            e.stopImmediatePropagation();
            e.preventDefault();
            const [eid, d] = stp.getAttribute("data-step").split("|");
            if (!this._ctlInBody(eid)) return;
            const st = this._hass?.states?.[eid];
            const cur = parseFloat(st?.state);
            const delta = parseFloat(d);
            if (st && Number.isFinite(cur) && Number.isFinite(delta)) {
              const a = st.attributes || {};
              const step = parseFloat(a.step) || Math.abs(delta) || 1;
              let v = Math.round((cur + delta) / step) * step;
              if (Number.isFinite(parseFloat(a.min))) v = Math.max(parseFloat(a.min), v);
              if (Number.isFinite(parseFloat(a.max))) v = Math.min(parseFloat(a.max), v);
              const dec = (String(step).split(".")[1] || "").length;
              v = parseFloat(v.toFixed(dec));
              if (v !== cur) this._hass.callService(eid.split(".")[0], "set_value", { entity_id: eid, value: v });
            }
            return;
          }
          const tog = e.target && e.target.closest ? e.target.closest("[data-toggle]") : null;
          if (tog) {
            e.stopImmediatePropagation();
            e.preventDefault();
            const eid = tog.getAttribute("data-toggle");
            if (this._ctlInBody(eid)) this._hass?.callService("homeassistant", "toggle", { entity_id: eid });
            return;
          }
          const hit = e.target && e.target.closest ? e.target.closest("[data-entity]") : null;
          if (hit) {
            e.stopImmediatePropagation();
            e.preventDefault();
            this._moreInfo(hit.getAttribute("data-entity"));
          }
        },
        { signal: this._ac.signal }
      );

      const sh = this._config?.shared;
      const interactive = sh && sh.tap_action !== "none";

      // 1. Écouteur pour le tap_action global de la carte
      if (interactive) {
        card.addEventListener(
          "click",
          () => {
            if (sh.tap_action === "navigate" && sh.navigation_path)
              this._navigate(sh.navigation_path);
            else if (sh.tap_action === "more-info" && sh.entity) this._moreInfo(sh.entity);
          },
          { signal: this._ac.signal }
        );
      }

      // 2. Ton interception des liens <a> internes (toujours active pour le corps Markdown/HTML)
      card.addEventListener(
        "click",
        (e) => {
          const anchor = e.target.closest("a");
          if (anchor) {
            const href = anchor.getAttribute("href");
            if (href && href.startsWith("/") && !href.startsWith("//")) {
              e.preventDefault(); // On empêche le navigateur de recharger la page
              this._navigate(href); // On utilise le routeur fluide interne de HA
            }
          }
        },
        { signal: this._ac.signal }
      );
    }
  }
}
// Une valeur de config interpolée dans un <style> ne doit pas pouvoir le refermer.
function _nmcCfgSafe(v, path) {
  if (typeof v === 'string') return v.replace(/<\/(style)/gi, '<\\/$1');
  if (!v || typeof v !== 'object') return v;
  const isArr = Array.isArray(v);
  let out = v;
  for (const k of Object.keys(v)) {
    const p = isArr ? path : (path ? path + '.' + k : k);
    if (['body.content', 'subtitle.text'].includes(p)) continue;
    const nv = _nmcCfgSafe(v[k], p);
    if (nv !== v[k]) {
      if (out === v) out = isArr ? v.slice() : { ...v };
      out[k] = nv;
    }
  }
  return out;
}
{
  const _setCfg = NeonMarkdownCard.prototype.setConfig;
  NeonMarkdownCard.prototype.setConfig = function (c) { return _setCfg.call(this, _nmcCfgSafe(c, '')); };
}
customElements.define("neon-markdown-card", NeonMarkdownCard);

const NMC_TEST_API = {
  nmcSafeHref,
  nmcSafeSrc,
  nmcSanitizeBody: nmcSanitizeBodyHTML,
  nmcSanitizeBodyFragment: nmcSanitizeBody,
  nmcMarkdown,
  nmcApplyFilters,
  nmcParseTemplate,
  nmcParseTemplateText,
  nmcCollectDependencies,
  nmcDependenciesChanged,
  NeonMarkdownCard,
};
if (typeof window !== "undefined" && window.__NMC_TEST_MODE__) window.__NMC_TEST_API__ = NMC_TEST_API;

window.customCards = window.customCards || [];
window.customCards.push({
  type: "neon-markdown-card",
  name: "Neon Markdown Card",
  description: "Neon header + HTML/Markdown/Jinja body (for/if/filters), Neo Tokyo style",
  preview: true,
});

console.info(
  "%c NEON-MARKDOWN-CARD %c v" + NMC_VERSION + " ",
  "color:#00fff9;font-weight:bold;background:#0A0A14;padding:2px 6px;border-radius:3px 0 0 3px",
  "color:#FF50A0;font-weight:bold;background:#0A0A14;padding:2px 6px;border-radius:0 3px 3px 0"
);
