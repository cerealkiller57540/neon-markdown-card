# Prompt template for AI assistants

Asking ChatGPT, Claude, Gemini or any other assistant to write a `neon-markdown-card`? Paste the prompt below first, then describe the card you want and list your entity ids.

**Why this is needed:** the card does not use Home Assistant's Jinja. It runs its own lighter engine in the browser, and an assistant trained on HA templates will write code that works in *Developer tools → Template* but renders wrong here, often without an error. The rules below were each measured on the engine of version 5.0.1, not guessed.

Fill in the two lines at the end (`MY CARD`, `MY ENTITIES`), then send it.

~~~~markdown
You are writing a Home Assistant Lovelace card of type `custom:neon-markdown-card` (v5.x).
Its body is HTML + inline CSS + SVG, templated with a CUSTOM JavaScript Jinja engine that
runs in the browser. It is NOT Home Assistant's Jinja2: many things that work in HA's
template editor break here, usually silently. Follow these rules strictly.

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
- Animations: keyframes named `nmc-*` are built in (e.g. `nmc-core-pulse`, `nmc-flicker`, `nmc-shimmer`, `nmc-ring-spin`); you may also declare
  your own `@keyframes` in a `<style>` block.

## The golden rule: compute in `{% set %}`, print simple variables
The arithmetic parser is fragile as soon as a filter or a function call sits inside a larger
expression. Put every entity read and every filter in its own `{% set %}`, then do maths only
between plain variables.

WRONG (silently prints the first value only):
  {{ states('sensor.a')|float(0) + states('sensor.b')|float(0) }}
  {{ states('sensor.p')|float(0) * 1000 }}
RIGHT:
  {% set a = states('sensor.a')|float(0) %}{% set b = states('sensor.b')|float(0) %}
  {{ a + b }}
  {% set p = states('sensor.p')|float(0) %}{{ p * 1000 }}

Also printed as raw text, not evaluated:
- Parentheses around a filtered expression: `{{ (states('x')|float(0)) * 2 }}`.
- A conditional expression inside arithmetic: `{{ b + (2 if c else 0) }}`
  → `{% set extra = 2 if c else 0 %}{{ b + extra }}`.
- A macro call inside arithmetic: `{{ 1 + my_macro(2) }}`
  → `{% set r = my_macro(2)|float %}{{ 1 + r }}`.
- A bare math function: `{{ max(1, 4) }}`, `{{ log10(x) }}`, `{{ sqrt(x) }}`.
  These only evaluate inside an expression with an operator: `{{ max(a, 9) * 1 }}`.
  `{{ [a, b]|max }}` and `{{ [a, b]|min }}` work directly.

Parentheses between plain variables are fine: `{{ (a + b) * 2 }}`.
Supported operators: `+ - * / ** %` and comparisons. `//` is BROKEN (returns 0):
use `{{ (a / b)|int }}`.

## Conditionals and booleans
- Booleans print as `1` / `0`, never `True` / `False`. Use them in `{% if %}`, not as text.
- A conditional expression MUST have an `else`: `{{ ',' if not loop.last else '' }}`.
  Without `else` the whole expression is printed as text.
- `is_state(...)`, `states(...)` and `state_attr(...)` accept variables or literal ids.
- `{% set %}` inside an `{% if %}` or `{% for %}` LEAKS OUT of the block (unlike Jinja).
  Inside a `{% for %}`, a running total does NOT accumulate: use filters (see Lists).

## Undefined names: the dangerous one
An undefined variable renders as ITS OWN NAME: `{{ zz }}` prints `zz`. Therefore:
- `zz is defined` is TRUE for an undefined variable, and `is not defined` is false.
- `zz|default('x')` prints `zz`.
So never rely on `is defined` / `default` for a plain variable: always `{% set %}` it first.
They DO work on lookups: `hist['sensor.x'] is defined`, `state_attr(e, 'a') is none`,
`state_attr(e, 'a')|default('—')`. For entity states use `|float(0)` / `|int(0)`, which
handle `unavailable` and `unknown`.

## Lists and dicts
- You can NOT build a list: `l + [x]` and `l.append(x)` both fail. Write literal lists.
- `{% for a, b in pairs %}` does not unpack: use `{% for r in pairs %}{{ r[0] }}{{ r[1] }}`.
- You can NOT loop over a dict (`for k in d`, `d.items()`, `d.keys()`, `|dictsort` fail).
  Use a list of dicts instead: `{% for r in [{'n': 'Kitchen', 'e': 'light.kitchen'}] %}`
  then `r.n`, `states(r.e)`.
- A trailing comma in a literal list is OK.
- Counting entities in a state: `select('eq', ...)` and `select('is_state', ...)` IGNORE
  their test (they return the whole list), and `states.light` is empty. The reliable way:
  `{{ expand(['light.a', 'light.b'])|selectattr('state', 'eq', 'on')|list|length }}`.
- Works: `|selectattr(attr, 'eq', v)`, `|map(attribute='x')`, `|sum`, `|join(', ')`,
  `|length`, `|first`, `|last`, `|list`, `d.get('k', default)`, `'b' in ['a', 'b']`.
- Does NOT work: negative indexes (`l[-1]` → use `|last`), slicing (`s[0:3]`),
  `namespace()`.

## Filters and functions
Works: `float(d)`, `int(d)`, `round(n)` (pads zeros: `1.4|round(2)` → `1.40`), `abs`,
`upper`, `lower`, `title`, `replace`, `truncate`, `format` (`'%.1f'|format(x)`), `safe`,
`as_timestamp(...)`, `now()`, `relative_time(...)`, `expand(...)`, `states.sensor.x.state`,
`~` for string concatenation.
Does NOT work: `timestamp_custom` (returns the raw number), whitespace control `{%- -%}` /
`{{- -}}` (the dashes are printed), negative indexes, slicing.
Macros: `{% macro name(a, b='x') %}` with keyword arguments works, and so does
`{% call %}` / `caller()`. A macro named like a built-in function (`round`, `max`...) is ignored: pick another name.
Built-in macros: `fmt_eta`, `tuile`, `spark`, `hp_style` (a macro of yours with the same name replaces it).

## Escaping (v5.0+)
`{{ }}` HTML-escapes its value. Write tags in the body and put only the value in `{{ }}`:
  RIGHT: `<b>{{ states('sensor.x') }}</b>`
  WRONG: `{{ '<b>' ~ states('sensor.x') ~ '</b>' }}` (shows the tags as text)
`|safe` is allowed only on a string you built yourself from constants and numbers, never on
a raw entity value or attribute.

## Sanitizer (removed from the output, on purpose)
`<script>`, `on*` attributes (`onclick`...), `id` attributes, external images and URLs,
`@import`, external fonts, non-local `url()`. Use classes, not ids. Use inline SVG for graphics.

## Interaction (no JavaScript, use data attributes)
- `data-entity="light.kitchen"`: tap opens the more-info dialog.
- `data-toggle="light.kitchen"`: tap toggles the entity.
- `data-step="input_number.target|-0.5"`: tap adds the step to the input_number.
The entity id in these attributes must be a LITERAL written in the body, not built by a
template expression.

## History (sparklines)
Declare it in YAML: `history: [{entity: sensor.x, hours: 24}]`. In the body, `hist['sensor.x']`
is `{pts, min, max, first, last, n}`. `pts` is ready for
`<svg viewBox="0 0 100 30"><polyline points="{{ h.pts }}" .../></svg>`. It refreshes about
every 5 minutes and is empty on first render, so guard it:
  {% if hist['sensor.x'] is defined %}{% set h = hist['sensor.x'] %} ... {% endif %}

## Testing
Do not validate with Home Assistant's template editor or `/api/template`: that is another
engine. Tell the user to add `debug: true` to the card, which lists engine errors inside it.

MY CARD: <describe the card, its layout and what it should show>
MY ENTITIES: <list the entity ids and what each one is>
~~~~

## Tips

- Give the assistant your real entity ids; it should not invent them.
- If something prints as raw template text, the rule it broke is almost always the golden rule above. Paste the result back and say "it printed literally".
- The six cards in [`examples/`](examples/) follow every rule here and are good references to paste along with the prompt.
