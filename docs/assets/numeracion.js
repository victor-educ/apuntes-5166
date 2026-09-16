/* Numera los apartados (h2) y subapartados (h3) de las unidades y copia los números
   al índice lateral. Solo actúa en páginas de unidad (docs/ut/). Los h3 de la sección
   "Actividades" no se numeran porque ya llevan su código (A1.1, A1.2...). */
(function () {
  if (!/\/ut\/[^/]+\/?$/.test(location.pathname)) return;
  var article = document.querySelector("article.md-content__inner");
  if (!article) return;

  var toc = {};
  document.querySelectorAll(".md-nav a.md-nav__link[href^='#']").forEach(function (a) {
    var id = decodeURIComponent(a.getAttribute("href").slice(1));
    (toc[id] = toc[id] || []).push(a);
  });

  function etiqueta(h, num) {
    var span = document.createElement("span");
    span.className = "num-apartado";
    span.textContent = num;
    h.insertBefore(span, h.firstChild);
    (toc[h.id] || []).forEach(function (link) {
      var s = document.createElement("span");
      s.className = "num-apartado";
      s.textContent = num;
      var inner = link.querySelector(".md-ellipsis") || link;
      inner.insertBefore(s, inner.firstChild);
    });
  }

  var n2 = 0, n3 = 0, saltarSub = false;
  article.querySelectorAll("h2, h3").forEach(function (h) {
    if (h.tagName === "H2") {
      n2 += 1; n3 = 0;
      saltarSub = /^actividades/i.test(h.textContent.trim());
      etiqueta(h, n2 + ".");
    } else if (!saltarSub && n2 > 0) {
      n3 += 1;
      etiqueta(h, n2 + "." + n3);
    }
  });
})();
