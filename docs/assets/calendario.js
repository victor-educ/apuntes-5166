/* Calendario interactivo de la asignatura.
   Lee assets/sesiones.json y pinta un mes por bloque. Cada día de clase es un enlace a la
   actividad de esa sesión; al pasar el ratón se muestra el detalle. */
(function () {
  var root = document.getElementById("calendario-interactivo");
  if (!root) return;

  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  var DIAS = ["L", "M", "X", "J", "V", "S", "D"];

  function iso(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function fechaLarga(s) {
    var p = s.split("-");
    return parseInt(p[2], 10) + " de " + MESES[parseInt(p[1], 10) - 1] + " de " + p[0];
  }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  var base = root.getAttribute("data-src") || "../assets/sesiones.json";

  fetch(base).then(function (r) { return r.json(); }).then(render).catch(function (e) {
    root.textContent = "No se ha podido cargar el calendario (" + e + ").";
  });

  function render(data) {
    var porFecha = {};
    data.sesiones.forEach(function (s) { porFecha[s.fecha] = s; });
    var feIni = data.fe.inicio, feFin = data.fe.fin;
    var hoy = iso(new Date());

    // Leyenda
    var leyenda = el("div", "cal-leyenda");
    Object.keys(data.ut).forEach(function (k) {
      var item = el("span", "cal-leyenda-item");
      var sw = el("span", "cal-swatch cal-" + k.toLowerCase());
      item.appendChild(sw);
      item.appendChild(document.createTextNode(k + " · " + data.ut[k]));
      leyenda.appendChild(item);
    });
    ["festivo|No lectivo", "fe|Formación en empresa", "eval|Sesión evaluable"].forEach(function (x) {
      var p = x.split("|");
      var item = el("span", "cal-leyenda-item");
      var sw = el("span", "cal-swatch cal-" + p[0]);
      item.appendChild(sw);
      item.appendChild(document.createTextNode(p[1]));
      leyenda.appendChild(item);
    });
    root.appendChild(leyenda);

    // Tooltip único
    var tip = el("div", "cal-tip");
    tip.setAttribute("role", "tooltip");
    document.body.appendChild(tip);

    function mostrarTip(s, x, y) {
      tip.innerHTML = "";
      var cab = el("div", "cal-tip-cab");
      cab.appendChild(el("span", "cal-tip-ut cal-" + s.ut.toLowerCase(), s.ut));
      cab.appendChild(el("span", "cal-tip-n", "Sesión " + s.n + " · " + fechaLarga(s.fecha)));
      tip.appendChild(cab);
      tip.appendChild(el("div", "cal-tip-titulo", s.titulo));
      if (s.tipo) tip.appendChild(el("div", "cal-tip-tipo", s.tipo));
      if (s.teoria) {
        var t = el("div", "cal-tip-bloque");
        t.appendChild(el("strong", null, "Teoría: "));
        t.appendChild(document.createTextNode(s.teoria));
        tip.appendChild(t);
      }
      if (s.practica) {
        var pr = el("div", "cal-tip-bloque");
        pr.appendChild(el("strong", null, "Práctica: "));
        pr.appendChild(document.createTextNode(s.practica));
        tip.appendChild(pr);
      } else if (s.que) {
        tip.appendChild(el("div", "cal-tip-que", s.que));
      }
      if (s.entregable) {
        var e = el("div", "cal-tip-entrega");
        e.appendChild(el("strong", null, "Entregable: "));
        e.appendChild(document.createTextNode(s.entregable));
        tip.appendChild(e);
      }
      tip.appendChild(el("div", "cal-tip-pie", "Clic para ir a la actividad"));
      tip.style.display = "block";
      colocarTip(x, y);
    }
    function colocarTip(x, y) {
      var w = tip.offsetWidth, h = tip.offsetHeight;
      var left = x + 14, top = y + 14;
      if (left + w > window.innerWidth - 8) left = x - w - 14;
      if (top + h > window.innerHeight - 8) top = y - h - 14;
      if (left < 8) left = 8;
      if (top < 8) top = 8;
      tip.style.left = left + "px";
      tip.style.top = top + "px";
    }
    function ocultarTip() { tip.style.display = "none"; }

    // Meses
    var grid = el("div", "cal-meses");
    var ini = new Date(data.inicio + "T00:00:00");
    var fin = new Date(data.fin + "T00:00:00");
    var cur = new Date(ini.getFullYear(), ini.getMonth(), 1);

    while (cur <= fin) {
      var mes = el("div", "cal-mes");
      mes.appendChild(el("h3", "cal-mes-titulo", MESES[cur.getMonth()] + " " + cur.getFullYear()));
      var tabla = el("div", "cal-grid");
      DIAS.forEach(function (d) { tabla.appendChild(el("div", "cal-cab", d)); });

      var primero = new Date(cur.getFullYear(), cur.getMonth(), 1);
      var offset = (primero.getDay() + 6) % 7; // lunes = 0
      for (var i = 0; i < offset; i++) tabla.appendChild(el("div", "cal-dia cal-vacio"));

      var nDias = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
      for (var d = 1; d <= nDias; d++) {
        var fecha = new Date(cur.getFullYear(), cur.getMonth(), d);
        var k = iso(fecha);
        var dow = (fecha.getDay() + 6) % 7;
        var s = porFecha[k];
        var celda;
        if (s) {
          celda = el("a", "cal-dia cal-clase cal-" + s.ut.toLowerCase() + (s.evaluable ? " cal-eval" : ""));
          celda.href = s.url;
          celda.setAttribute("aria-label", "Sesión " + s.n + ", " + s.titulo);
          celda.appendChild(el("span", "cal-num", d));
          celda.appendChild(el("span", "cal-etq", s.ut + " · " + s.n));
          (function (ses) {
            celda.addEventListener("mouseenter", function (ev) { mostrarTip(ses, ev.clientX, ev.clientY); });
            celda.addEventListener("mousemove", function (ev) { colocarTip(ev.clientX, ev.clientY); });
            celda.addEventListener("mouseleave", ocultarTip);
            celda.addEventListener("focus", function () {
              var r = celda.getBoundingClientRect();
              mostrarTip(ses, r.left, r.bottom);
            });
            celda.addEventListener("blur", ocultarTip);
          })(s);
        } else {
          celda = el("div", "cal-dia");
          celda.appendChild(el("span", "cal-num", d));
          if (dow >= 5) {
            celda.classList.add("cal-finde");
          } else if (data.festivos[k]) {
            celda.classList.add("cal-festivo");
            celda.title = data.festivos[k];
            celda.appendChild(el("span", "cal-etq", data.festivos[k]));
          } else if (k >= feIni && k <= feFin) {
            celda.classList.add("cal-fe");
            celda.title = "Formación en empresa";
          } else if (k < data.inicio || k > data.fin) {
            celda.classList.add("cal-fuera");
          }
        }
        if (k === hoy) celda.classList.add("cal-hoy");
        tabla.appendChild(celda);
      }
      mes.appendChild(tabla);
      grid.appendChild(mes);
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }
    root.appendChild(grid);

    // Próxima sesión
    var prox = data.sesiones.filter(function (s) { return s.fecha >= hoy; })[0];
    if (prox) {
      var aviso = el("p", "cal-proxima");
      aviso.appendChild(document.createTextNode("Próxima sesión: "));
      var a = el("a", null, "sesión " + prox.n + " (" + fechaLarga(prox.fecha) + "), " + prox.ut + " · " + prox.titulo);
      a.href = prox.url;
      aviso.appendChild(a);
      root.insertBefore(aviso, leyenda);
    }
  }
})();
