/* Numera los apartados de las unidades y copia los números al índice lateral. Solo actúa en
   páginas de unidad (docs/ut/). Cada h2 "Sesión N · ..." (o "Bloque N · ...") aporta su número N,
   y sus h3 se numeran N.1, N.2... Los h3 de las hojas de práctica no se numeran porque ya llevan
   su código (A1.1, A1.2...). Los h2 sin número propio (Introducción, Errores frecuentes) y sus
   h3 no se numeran. */
(function () {
  var esUnidad = /\/ut\/[^/]+\/?$/.test(location.pathname);
  var esPdf = !!document.getElementById("print-site-page");
  if (!esUnidad && !esPdf) return;

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

  function numerar(raiz) {
    var sesion = null, n3 = 0;
    raiz.querySelectorAll("h2, h3").forEach(function (h) {
      var texto = h.textContent.trim();
      if (h.tagName === "H2") {
        var m = /^(?:Sesión|Bloque)\s+(\d+)/i.exec(texto);
        sesion = m ? m[1] : null;
        n3 = 0;
      } else if (sesion !== null && !/^A\d+\.\d+/.test(texto)) {
        n3 += 1;
        etiqueta(h, sesion + "." + n3);
      }
    });
  }

  if (esPdf) {
    // En la página imprimible cada unidad va en su propia sección
    document.querySelectorAll("section.print-page[id*='ut-']").forEach(numerar);
  } else {
    var article = document.querySelector("article.md-content__inner");
    if (article) numerar(article);
  }
})();
