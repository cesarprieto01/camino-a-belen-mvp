// Barra de pestañas de Theo (design system «Tabar»): la misma en todas las pantallas, clara también en modo oscuro.
const TABS = [
  ['hoy', 'Hoy'], ['explorar', 'Explorar'], ['teodoro', 'Teodoro'], ['musica', 'Música'], ['favoritos', 'Favoritos'],
];

/** Crea la barra con la pestaña «active» (clave de TABS) encendida. «onTab(clave)» recibe cada toque.
 *  «sinTeodoro»: familias sin mascota, la barra de cuatro pestañas de siempre. */
export function tabBar(active, onTab, sinTeodoro = false) {
  const nav = document.createElement('nav');
  nav.className = 'theo-tabbar';
  nav.setAttribute('aria-label', 'Pestañas de Theo');
  nav.innerHTML = TABS.filter(([k]) => !(sinTeodoro && k === 'teodoro')).map(([k, label]) => {
    const on = k === active;
    return `<a role="button" tabindex="0" data-nav="${k}" aria-label="${label}"${on ? ' aria-current="page"' : ''} data-bound="1">`
      + `<img src="assets/tabbar/${k}-${on ? 'on' : 'off'}.png" alt="" aria-hidden="true">${label}</a>`;
  }).join('') + '<i class="theo-home" aria-hidden="true"></i>';
  nav.querySelectorAll('a').forEach(a => {
    const fire = ev => { ev.preventDefault(); ev.stopPropagation(); onTab(a.dataset.nav); };
    a.addEventListener('click', fire);
    a.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') fire(ev); });
  });
  return nav;
}
