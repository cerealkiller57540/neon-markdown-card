# Prompt template for AI assistants

Asking ChatGPT, Claude, Gemini or any other assistant to write a `neon-markdown-card`? Paste the prompt below first, then describe the card you want and list your entity ids.

**Why it helps:** the card renders its templates directly in your browser, with its own Jinja engine. That is what makes it instant: no round trip to the server, updates as soon as a state changes. Since version 5.1 the engine follows Home Assistant's Jinja closely, so the templates assistants already know work as they are. The prompt adds what is specific to this card (layout, theme, interactions, history, safety rules), so the result looks right on the first try. Every rule in it was checked on version 5.1.0.

Fill in the two lines at the end (`MY CARD`, `MY ENTITIES`), then send it.

~~~~markdown
You are writing a Home Assistant Lovelace card of type `custom:neon-markdown-card` (v5.1+).
Its body is HTML + inline CSS + SVG, templated with Jinja. The card renders the template in
the browser with an engine that follows Home Assistant's Jinja: write templates as you would
for a Home Assistant markdown card.

## Output format
Return ONE complete YAML card, nothing else, in this shape:

```yaml
type: custom:neon-markdown-card
mode: both            # both = header + body, title = header only, body = no header
title:
  text: My card
  icon: mdi:flash
  color: var(--primary-color)
  glow: true          # optional neon effects: glow, gradient, flicker, scanline, hover_glitch
body:
  content: |
    {% set p = states('sensor.x')|float(0) %}
    <div style="...">{{ p }} W</div>
history:              # optional, only if a sparkline/trend is needed
  - entity: sensor.x
    hours: 24
```

- Style with inline `style="..."` or a `<style>` block inside the body. Use theme variables
  (`var(--primary-color)`, `var(--primary-text-color)`, `var(--secondary-text-color)`,
  `var(--divider-color)`, `rgba(var(--rgb-primary-color), .2)`), never hard-coded colours
  unless asked.
- Icons: `<ha-icon icon="mdi:lightbulb"></ha-icon>` or the shortcut `[mdi:lightbulb]`.
- Animations: keyframes named `nmc-*` are built in (e.g. `nmc-core-pulse`, `nmc-flicker`,
  `nmc-shimmer`, `nmc-ring-spin`); you may also declare your own `@keyframes` in a `<style>` block.

## Jinja
Standard Home Assistant Jinja works: `states()`, `state_attr()`, `is_state()`,
`has_value()`, `expand()`, `states.sensor.x.state`, `states.light` iteration, `now()`,
`as_timestamp()`, `timestamp_custom()`, `relative_time()`, filters (`float(0)`, `int(0)`,
`round`, `format`, `selectattr`, `select`, `map`, `sum`, `min`, `max`, `join`, `dictsort`...),
`namespace()`, macros with keyword arguments, `{% call %}`, whitespace control `{%- -%}`,
slicing, negative indexes, `for k, v in d.items()`, `//`, `**`, `~`.

Good habits for readable cards:
- Read each entity once in a `{% set %}` at the top, with a default
  (`states('sensor.x')|float(0)`), then use the variables in the HTML.
- Totals across a `{% for %}` loop use `namespace()`, as in Jinja:
  `{% set ns = namespace(t=0) %}{% for e in ids %}{% set ns.t = ns.t + states(e)|float(0) %}{% endfor %}{{ ns.t }}`.
- Booleans print as `True` / `False`; use them in `{% if %}` rather than as text.
- `x|round(2)` keeps the decimals for display (`1.4|round(2)` → `1.40`, `0|round(2)` →
  `0.00`), handy for `kW` or `€` values.

The card is forgiving where Home Assistant would stop with an error, so one missing sensor
never blanks the whole card: an unknown entity or attribute renders empty, `none` renders
empty, and a sum of mismatched types still gives a number.

## Escaping
`{{ }}` HTML-escapes its value. Write tags in the body and put only the value in `{{ }}`:
  RIGHT: `<b>{{ states('sensor.x') }}</b>`
  WRONG: `{{ '<b>' ~ states('sensor.x') ~ '</b>' }}` (shows the tags as text)
`|safe` is for a string you built yourself from constants and numbers, never for a raw entity
value or attribute. A macro's output is HTML, so a macro is the clean way to reuse markup.

## Safety (the card removes these on purpose)
`<script>`, `on*` attributes (`onclick`...), `id` attributes, external images and URLs,
`@import`, external fonts, non-local `url()`. Use classes rather than ids, and inline SVG for
graphics.

## Interaction (no JavaScript, use data attributes)
- `data-entity="light.kitchen"`: tap opens the more-info dialog.
- `data-toggle="light.kitchen"`: tap toggles the entity.
- `data-step="input_number.target|-0.5"`: tap adds the step to the input_number.
Write the entity id in these attributes as a literal in the body: the card only acts on
entities it can read in the card's own configuration.

## History (sparklines)
Declare it in YAML: `history: [{entity: sensor.x, hours: 24}]`. In the body, `hist['sensor.x']`
is `{pts, min, max, first, last, n}`. `pts` is ready for
`<svg viewBox="0 0 100 30"><polyline points="{{ h.pts }}" .../></svg>`. It refreshes about
every 5 minutes and arrives just after the first render, so guard it:
  {% if hist['sensor.x'] is defined %}{% set h = hist['sensor.x'] %} ... {% endif %}

## Built-in macros
`fmt_eta`, `tuile`, `spark`, `hp_style` are available; a macro of yours with the same name
replaces it.

## Testing
Home Assistant's template editor is a good place to try the Jinja part. For the final check,
tell the user to add `debug: true` to the card: it lists any template error inside the card.

MY CARD: <describe the card, its layout and what it should show>
MY ENTITIES: <list the entity ids and what each one is>
~~~~

## Tips

- Give the assistant your real entity ids; it should not invent them.
- If a value looks wrong, add `debug: true` to the card and paste what it shows back to the assistant.
- The cards in [`examples/`](examples/) are good references to paste along with the prompt.
