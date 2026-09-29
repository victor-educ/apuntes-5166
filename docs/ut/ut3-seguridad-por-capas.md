# UT3 · Seguridad por capas: DMZ externa, DMZ interna y zona interna

<p class="ut-meta">12 h · Sesiones 14 a 19 · RA1 CE d</p>

La UT2 dejó una VPC por entorno (dev, pre, pro) con cuatro VNets, una por zona (gestión, front, back y data), y un router con una pata en cada una, con el enrutado entre ellas funcionando. Funcionaba demasiado bien: cualquier máquina de front podía hablar con cualquier puerto de back. En esta unidad ese router se sustituye por un cortafuegos, cada zona recibe su papel de seguridad y esa red abierta se convierte en una red por capas donde cada salto está justificado, permitido de forma explícita y registrado. Después hay que demostrar con nmap y tcpdump (un escáner de puertos y un capturador de tráfico) que el aislamiento es real, y separar dos clientes que comparten la misma infraestructura. Lo que se construye aquí no se tira: el cortafuegos, sus reglas y la CA del curso son los que usan el resto del curso y la asignatura de Mantenimiento.

## Introducción

Esta unidad convierte la red plana de la UT2 en una red por capas con un cortafuegos en medio, y termina con un informe que demuestra, con escaneos y capturas, que el aislamiento es real. Antes de entrar en las sesiones, esto es lo que hay que saber hacer al terminar, las herramientas que aparecen y el plan de cada día.

### Qué tienes que saber hacer al terminar

El criterio de evaluación d del RA1 pide desplegar capas de seguridad según el nivel de exposición de cada servicio, probarlas y separar clientes. En concreto:

- Explicar el modelo de zonas (exterior, DMZ externa, DMZ interna, zona interna, gestión) y decidir en qué zona va cada componente de una aplicación.
- Instalar y configurar un cortafuegos con estado entre zonas (OPNsense en el laboratorio del curso) con política de denegación por defecto.
- Publicar un servicio hacia Internet a través de un proxy inverso con TLS, sin exponer la aplicación ni la base de datos.
- Aislar dos clientes con VLAN y reglas, de forma que compartan el proxy pero no se alcancen entre sí.
- Probar el aislamiento con nmap, nc, tcpdump y los logs del cortafuegos, e interpretar correctamente lo que devuelven.
- Entregar a operaciones una matriz de reglas justificada, una matriz de pruebas con evidencias y un procedimiento de cambios.

### Los conceptos de la unidad

Un jueves por la tarde un compañero de otro grupo lanza desde su VM del aula un `nmap` contra la subred back y le salen el 22 de SSH, el 8080 de la API y, en la subred de al lado, el 5432 de PostgreSQL. Abre `psql`, prueba `postgres` sin contraseña y entra. Nadie se entera porque nada lo registra, y esa base de datos de dev tiene una copia de la de pro. Ese es el problema de la unidad: la red funciona, pero cualquiera que esté dentro llega a todo. Lo que se persigue al terminar cabe en una frase: que desde fuera solo se vea el 443 del proxy, que cada salto entre zonas exista porque una regla escrita lo permite, y que todo eso se pueda demostrar con escaneos y capturas fechadas.

| Herramienta o concepto | Qué es, en una frase | Para qué se usa en esta unidad |
|------------------------|----------------------|-----------------------------------|
| Zonas y defensa en profundidad | Dividir la red en capas y poner un filtro entre cada dos | Decidir en qué zona va cada máquina y qué puede hablar con qué |
| Cortafuegos con estado | Un filtro que recuerda las conexiones abiertas, como el portero que deja volver a entrar a quien vio salir | Escribir una sola regla por conexión, en la dirección en que se inicia |
| OPNsense | Un cortafuegos con interfaz web que se instala como una VM más de Proxmox | El firewall central del laboratorio, con una interfaz por zona |
| nftables | El firewall del kernel Linux, con las reglas en un fichero de texto | La alternativa sin interfaz web al cortafuegos central; en cada host lo usa Mantenimiento desde su sesión 17 |
| NAT (port forward y outbound) | Reescribir la IP de destino o de origen de un paquete al cruzar el firewall | Publicar el proxy en la IP pública y dar salida a Internet solo a quien la necesite |
| Proxy inverso (nginx) | Un servidor web que recibe las peticiones de fuera y las reenvía al de dentro | Que Internet hable con web01 y nunca con la aplicación ni la base de datos |
| TLS, certificados y CA | TLS es el cifrado de HTTPS; el certificado identifica al servidor y la CA es quien lo firma y en quien confían los clientes | Crear la CA del curso con `openssl ca`, cifrar con ella lo publicado y saber cuándo toca Let's Encrypt |
| Aliases de OPNsense | Un nombre para una IP, una red o una lista de puertos | Escribir las reglas con nombres (`srv_web`, `net_mgmt`, `p_web`) y cambiar una dirección en un solo sitio |
| VLAN (802.1Q) | Una etiqueta numérica en cada trama Ethernet que separa redes sobre el mismo cable | Aislar a dos clientes que comparten firewall y proxy |
| nmap | Un escáner de puertos: pregunta a una máquina, puerto a puerto, si alguien responde | Comprobar desde cada zona qué se ve de verdad y distinguir `closed` de `filtered` |
| nc y curl | Un cliente TCP mínimo y un cliente HTTP de terminal | Probar un puerto concreto y el servicio publicado de extremo a extremo |
| tcpdump | Un grabador de tráfico: muestra los paquetes que pasan por una interfaz | Saber en qué interfaz muere un paquete |
| Matriz de reglas y matriz de pruebas | Una tabla con cada regla del cortafuegos y su porqué, y otra con cada prueba, lo esperado y lo obtenido | Documentar lo que se abre y demostrar que lo demás está cerrado: son dos de las entregas de la evaluable |

Por encima del cortafuegos hay dos capas más que miran el contenido y no solo los puertos, la detección de intrusos y el cortafuegos de aplicaciones web; en el curso no se montan, y están en [IDS/IPS y WAF, dos capas más](../ampliacion.md#idsips-y-waf-dos-capas-mas).

Cómo está organizada la unidad: sigue las seis sesiones en el orden en que se dan, y cada sesión trae primero la teoría que se explica ese día (con el material de consulta que necesita la hoja) y después su hoja de práctica. En la sesión 14 se explica el modelo de zonas y el cortafuegos con estado, y se configura OPNsense con una interfaz por zona. En la 15 se aprenden las reglas, los aliases y el NAT, y se publica la primera web con un certificado de la CA del curso. En la 16 app01 y mon01 pasan a la VPC y se completa la cadena proxy, aplicación y base de datos con las reglas mínimas entre capas, y en la 17 se añaden dos clientes en VLAN que comparten el proxy sin verse. La 18 ejecuta la matriz de pruebas con nmap, nc y tcpdump, y la 19 cierra el informe de la práctica evaluable. Al final quedan, como consulta, los errores frecuentes del laboratorio.

!!! otra "Dónde se usa esto en la otra asignatura"
    La [UT3 de Mantenimiento, seguridad de la monitorización](https://victor-educ.github.io/apuntes-5169/ut/ut3-seguridad-monitorizacion/) (26 nov a 3 dic) va en paralelo con esta (20 nov a 9 dic) y usa lo que se monta aquí: las reglas de OPNsense y la CA del curso, que nace en la A3.2 (25 nov). nmap y tcpdump vienen de la [sesión 10](ut2-vpc.md#como-se-prueba-una-red), y nftables en cada host lo explica Mantenimiento en su sesión 17 (1 dic).
    app01 y mon01 viven desde octubre en el bridge del aula (vmbr0) y pasan a la VPC dev en la A3.3 (27 nov): app01 a devback con la 10.10.2.10 y mon01 a devmgmt con la 10.10.0.20. Ninguna de las dos lleva una segunda tarjeta de gestión: la monitorización llega a app01 y a db01 atravesando el cortafuegos, por las filas que Mantenimiento deja puestas el 26 de noviembre, la víspera del traslado.
    La matriz de reglas de esta unidad es la única del laboratorio: Mantenimiento le añade desde el 26 de noviembre las filas 11 a 20, con los puertos de los exporters y de Loki, y las unidades posteriores, de la 21 en adelante. La tabla de referencia completa está en [el laboratorio](../laboratorio.md).

### Plan de sesiones

Cada sesión de 110 minutos empieza con una explicación corta y sigue con laboratorio. La columna «Se explica» recoge los apartados de teoría que se desarrollan en clase, con su duración aproximada; la columna «Se practica», el trabajo de laboratorio de esa sesión. Las sesiones marcadas solo como práctica no traen teoría nueva.

| Sesión | Fecha | Tipo | Se explica | Se practica |
|---:|-------|------|------------|-------------|
| [14](#sesion-14-modelo-de-seguridad-por-capas) | 20 nov | Teoría y práctica | Defensa en profundidad y zonas (10 min); DMZ con uno y con dos cortafuegos (5 min); cortafuegos con estado (10 min). | Configurar el OPNsense que se trae instalado de casa: sus cinco interfaces con el .1 de cada zona, el DHCP y el DNS de router-dev traspasados, la regla 0 de todas las zonas y la consola accesible solo desde MGMT. |
| [15](#sesion-15-reglas-por-zona-y-publicacion-de-un-servicio) | 25 nov | Teoría y práctica | Aliases (5 min); reglas y orden de evaluación (5 min); port forward y outbound NAT (5 min); la CA del curso con `openssl ca` y certificados con SAN (10 min). | Comprobar que sin reglas nada pasa; crear la CA del curso y el certificado del proxy; nginx en web01; reglas de gestión, port forward WAN:443 y curl desde el aula. |
| [16](#sesion-16-dmz-interna-y-zona-interna) | 27 nov | Teoría y práctica | Patrón proxy inverso, aplicación y base de datos; terminación TLS y cabeceras (10 min); matriz de reglas y procedimiento de cambios (5 min). | app01 y mon01 a la VPC y el disco `/data` de db01, preparados antes de clase; en db01, la base `servicio` y postgres_exporter; la API contra db01; reglas mínimas entre capas y nginx como proxy inverso de la API; probar desde fuera. |
| [17](#sesion-17-separacion-de-clientes) | 2 dic | Teoría y práctica | Opciones de aislamiento multi-tenant y por qué se usa una VLAN por cliente (15 min). | Dos clientes en las VLAN 101 y 102 sobre el bridge VLAN aware, reglas que solo les dejan llegar al proxy, comprobar que A no alcanza a B. |
| [18](#sesion-18-pruebas-de-seguridad) | 4 dic | Práctica | Repaso de nmap y tcpdump de la sesión 10; lo nuevo: filtered frente a closed detrás del cortafuegos, captura en las dos interfaces y la matriz de pruebas (10 min). | Ejecutar la matriz de pruebas desde cada zona, capturar con tcpdump dos denegaciones y localizarlas en el log, tramitar un hallazgo con el procedimiento de cambios y dejar hecho el diagrama de zonas. |
| [19](#sesion-19-practica-evaluable) | 9 dic | Práctica evaluable | Aclaración del enunciado (10 min). | Cerrar el informe: diagrama, matriz de reglas justificada, matriz de pruebas, un hallazgo corregido y el procedimiento de reglas nuevas; al entregar, destruir router-dev y los dos clientes. |

## Sesión 14 · Modelo de seguridad por capas

<p class="ut-meta" markdown>20 de noviembre · Teoría y práctica · <span class="dur" tabindex="0" aria-label="Defensa en profundidad y zonas · 10 min&#10;DMZ con uno y con dos cortafuegos · 5 min&#10;Cortafuegos con estado · 10 min&#10;A3.1 Instalar el firewall · 85 min" data-dur="Defensa en profundidad y zonas · 10 min&#10;DMZ con uno y con dos cortafuegos · 5 min&#10;Cortafuegos con estado · 10 min&#10;A3.1 Instalar el firewall · 85 min">:material-school:<i class="dur-barra" style="--teoria:23%"></i>:material-flask:</span></p>

Al acabar la sesión hay un OPNsense con una pata en cada una de las cinco zonas, con la IP .1 en cada red, la regla 0 que deja a todas las zonas preguntar al cortafuegos por nombres y por la hora, y la consola web accesible solo desde gestión. En clase se explican el modelo de zonas y el mapa sobre la VPC de la UT2 (qué zona es cada subred ya creada), las dos formas de montar una DMZ y por qué basta un cortafuegos con estado y una regla por conexión. El apartado de OPNsense es consulta: es lo que necesita la preparación de casa de la hoja. La alternativa con nftables tampoco se explica: queda apuntada al final de la teoría, con el fichero de reglas en Para ampliar, para quien prefiera un router Debian.

### Defensa en profundidad y zonas

Ningún control de seguridad es perfecto. El proxy tendrá una vulnerabilidad algún día, alguien subirá una imagen de contenedor con una librería vieja, un administrador reutilizará una contraseña. La defensa en profundidad parte de asumir que cada control fallará y pone varios en serie, de modo que cada capa que atraviesa un atacante le cuesta trabajo, le lleva tiempo y deja rastro en un log que alguien (o algo) está mirando. La forma clásica de organizarlo en red son las zonas, separadas por un cortafuegos que solo deja pasar lo imprescindible entre una y la siguiente.

| Zona | Qué aloja | Quién puede entrar | Hacia dónde sale |
|----|----|----|----|
| Exterior (WAN / Internet) | Usuarios, atacantes | Nadie | DMZ externa |
| DMZ externa | Lo que debe verse desde fuera: proxy inverso, balanceador, web estática, concentrador VPN | Internet, en puertos concretos (80/443) | DMZ interna, en puertos concretos |
| DMZ interna | Aplicación / API, colas, caché | DMZ externa | Zona interna, en puertos concretos |
| Zona interna | Bases de datos, almacenamiento, backups | DMZ interna y administradores | Nada hacia fuera, salvo actualizaciones puntuales |
| Gestión | Consola del firewall, SSH, Proxmox, monitorización | Administradores | Todas las zonas, solo en puertos de gestión |

Los principios que gobiernan las reglas son cuatro, y aparecen repetidos en cualquier auditoría:

- **Denegar por defecto**: todo lo que no está permitido expresamente se bloquea y se registra. La lista de reglas es una lista blanca.
- **Tráfico solo hacia dentro por saltos**: Internet nunca habla con la zona interna; la web nunca habla con la base de datos sin pasar por la aplicación. Cada zona solo inicia conexiones hacia la inmediatamente más profunda.
- **Mínima exposición**: un servicio en DMZ externa solo expone el puerto que necesita. La gestión (SSH, consola web, API de Proxmox) va por una red aparte que no es alcanzable desde ninguna zona de servicio.
- **Registro**: todo lo denegado, y todo lo permitido hacia zonas sensibles, queda en un log con marca de tiempo, regla que lo decidió, origen y destino.

La comparación con la red plana de la UT2 es inmediata: allí una vulnerabilidad en el proxy daba acceso directo a la base de datos y al hipervisor; aquí cada capa que cae deja al atacante delante de otro filtro. El recorrido completo, capa por capa y con lo que frena cada una, está en [Qué frena cada capa](../ampliacion.md#que-frena-cada-capa).

#### Mapa sobre la VPC de la UT2

No hay que rehacer la red: las cuatro VNets de la UT2 ya están, y lo que cambia hoy es quién hace de `.1` y qué papel de seguridad tiene cada una. La subred front pasa a ser la DMZ externa, back la DMZ interna, data la zona interna y gestión la red de administración. En el entorno dev del aula queda así:

| Zona | VNet en Proxmox | Red | Gateway (firewall) | Máquinas |
|----|----|----|----|----|
| DMZ externa | devfront | 10.10.1.0/24 | 10.10.1.1 | web01 (proxy) |
| DMZ interna | devback | 10.10.2.0/24 | 10.10.2.1 | app01 |
| Zona interna | devdata | 10.10.3.0/24 | 10.10.3.1 | db01 |
| Gestión | devmgmt | 10.10.0.0/24 | 10.10.0.1 | Puesto de administración, mon01 |
| Exterior | vmbr0 (bridge del aula) | La del aula | Router del aula | Todo lo demás |

Cada zona es una VNet distinta, es decir, un bridge distinto, y eso es lo que hace posible lo que viene: si dos de estas subredes compartieran bridge, su tráfico no pasaría por el cortafuegos y no habría dónde filtrarlo.

```mermaid
flowchart LR
    INET["<b>Internet</b><br><small>red del aula</small>"]:::infra
    FW{{"<b>Firewall</b><br><small>todo pasa por aquí</small>"}}:::act
    WEB["<b>web01</b><br><small>proxy inverso · 10.10.1.10</small>"]:::pieza
    APP["<b>app01</b><br><small>API · 10.10.2.10</small>"]:::pieza
    DB["<b>db01</b><br><small>PostgreSQL · 10.10.3.10</small>"]:::dato
    ADM["<b>Puesto admin</b><br><small>10.10.0.50</small>"]:::act
    INET -->|443| FW
    FW -->|443| WEB
    WEB -->|8080| FW
    FW -->|8080| APP
    APP -->|5432| FW
    FW -->|5432| DB
    ADM -->|22, 443 gestión| FW
    classDef act fill:#ea580c22,stroke:#ea580c,stroke-width:1.5px
    classDef pieza fill:#64748b22,stroke:#64748b,stroke-width:1.5px
    classDef dato fill:#2563eb22,stroke:#2563eb,stroke-width:1.5px
    classDef infra fill:#a1a1aa14,stroke:#a1a1aa,stroke-width:1.5px
    classDef ok fill:#16a34a22,stroke:#16a34a,stroke-width:1.5px
    classDef riesgo fill:#dc262622,stroke:#dc2626,stroke-width:1.5px
```

<p class="pie" markdown>Ningún salto entre capas es directo: todos vuelven a pasar por el cortafuegos, y por eso se puede filtrar cada uno por separado.</p>

El cortafuegos es el gateway de todas las zonas, con la IP .1 en cada una, así que ningún paquete cruza de una subred a otra sin pasar por él. Es el papel que en la UT2 hacía `router-dev`: OPNsense hereda sus cuatro direcciones `.1` y también su DHCP y su DNS, y `router-dev` se apaga cuando el relevo está hecho (se destruye al cerrar la evaluable de la unidad, el 9 de diciembre).

### DMZ con uno y con dos cortafuegos

El esquema anterior usa un solo cortafuegos con cinco interfaces, una por zona. Es el diseño habitual en pymes y en laboratorios porque es barato y toda la política está en un sitio. Su punto débil es evidente: si el cortafuegos cae, o alguien lo configura mal, todas las capas caen a la vez.

<figure markdown="span">
  ![DMZ con un único cortafuegos de tres interfaces](../img/dmz-un-firewall.svg){ width="560" }
  <figcaption>DMZ con un solo cortafuegos: una interfaz hacia Internet, otra hacia la DMZ y otra hacia la red interna. Fuente: Pbroks13, dominio público, vía Wikimedia Commons.</figcaption>
</figure>

El diseño de dos cortafuegos pone uno de cara a Internet (el "front-end" o perimetral) que solo permite tráfico hacia la DMZ, y otro detrás (el "back-end") entre la DMZ y la red interna. Un atacante que comprometa el primero sigue teniendo el segundo por delante. Con dos firewalls también se reparte la carga: el perimetral absorbe el ruido de Internet y el interno solo ve tráfico ya filtrado.

<figure markdown="span">
  ![DMZ con dos cortafuegos en serie](../img/dmz-dos-firewalls.svg){ width="560" }
  <figcaption>DMZ con dos cortafuegos: el perimetral protege la DMZ; el interno protege la red corporativa. Fuente: Pbroks13, dominio público, vía Wikimedia Commons.</figcaption>
</figure>

Una recomendación clásica de las guías de seguridad perimetral es que los dos cortafuegos sean de fabricantes distintos. Una vulnerabilidad de ejecución remota en el software del firewall (las ha habido en todos los grandes fabricantes) afectaría a los dos si son iguales; con dos fabricantes, el atacante necesita dos exploits distintos. El coste es que operaciones tiene que administrar dos productos, dos ciclos de parches y la misma política en dos sintaxis, y por eso muchas empresas medianas acaban con un solo firewall bien mantenido en lugar de dos mal mantenidos. En la práctica, un cortafuegos único bien parcheado y revisado cada trimestre protege más que dos que nadie se atreve a tocar.

En el laboratorio del curso se monta el modelo de un firewall con cinco interfaces. Quien quiera el de dos puede usar OPNsense como perimetral y un Debian con nftables como interno: fabricantes distintos, gratis, y con el material de [OPNsense](#opnsense) y de [la alternativa con nftables](#alternativa-nftables-en-una-vm-linux).

### Cortafuegos con estado

Antes de escribir la primera regla hay que entender cómo decide el cortafuegos qué paquete pasa, porque de eso depende cuántas reglas hacen falta y en qué dirección se escriben. La idea del apartado es una: el firewall recuerda las conexiones que ya aceptó, así que solo hay que permitir el primer paquete de cada una. Quien lo tiene claro escribe la mitad de reglas y entiende el error de "abre pero no responde".

Un cortafuegos sin estado (stateless, un filtro de paquetes puro) mira cada paquete de forma aislada: origen, destino, protocolo, puerto, flags. Para permitir que web01 abra una conexión a app01:8080 necesitaría dos reglas, una para el SYN de ida (el primer paquete de una conexión TCP, el que pide abrirla) y otra para la respuesta de vuelta, y la de vuelta tendría que permitir tráfico desde el puerto 8080 de app01 hacia cualquier puerto alto de web01, lo cual es un agujero: cualquier cosa que se origine en app01 con puerto origen 8080 pasaría.

Un cortafuegos **con estado** (stateful) recuerda las conexiones. Cuando ve el SYN de web01:43812 hacia app01:8080 y una regla lo permite, crea una entrada en su **tabla de estados** con la tupla (protocolo, IP origen, puerto origen, IP destino, puerto destino) y el estado de la conexión. Cuando llega el SYN-ACK de vuelta, no evalúa las reglas: busca en la tabla, encuentra la entrada, comprueba que el paquete es coherente con el estado (números de secuencia, flags) y lo deja pasar. Lo mismo con todos los paquetes siguientes en ambas direcciones, hasta que ve el cierre (FIN/RST) o la entrada expira por inactividad.

```mermaid
sequenceDiagram
    participant W as web01:43812
    participant F as Cortafuegos
    participant T as Tabla de estados
    participant A as app01:8080
    W->>F: SYN
    F->>F: evalúa las reglas · hay una que lo permite
    F->>T: crea la entrada (tcp, web01:43812, app01:8080)
    F->>A: SYN
    A->>F: SYN-ACK
    F->>T: ¿coincide con algún estado?
    T-->>F: sí, y el paquete es coherente
    Note over F: no vuelve a mirar las reglas
    F->>W: SYN-ACK
    W->>A: datos en los dos sentidos
    W->>F: FIN
    F->>T: cierra la entrada
```

<p class="pie" markdown>Solo hay que permitir el **primer** paquete de cada conexión. Quien lo tiene claro escribe la mitad de reglas y entiende el error de «abre pero no responde».</p>


En Linux este mecanismo se llama **conntrack** y es un módulo del kernel (`nf_conntrack`) que usan tanto iptables (el antecesor de nftables) como nftables. En OPNsense y pfSense lo hace el propio `pf` (el filtro de paquetes de FreeBSD, el sistema sobre el que se construyen ambos), con una tabla visible en Firewall → Diagnostics → States. Los estados que manejan son, de forma simplificada:

| Estado | Significado |
|----|----|
| `new` | Primer paquete de una conexión que no está en la tabla. Es el único que se evalúa contra las reglas. |
| `established` | Paquetes de una conexión ya aceptada, en cualquier dirección. |
| `related` | Conexión nueva que el kernel sabe que pertenece a otra existente: el canal de datos de FTP, o un ICMP "puerto inalcanzable" en respuesta a un UDP saliente. |
| `invalid` | Paquete que no encaja con ningún estado ni es un inicio válido (un ACK suelto, un SYN-ACK sin SYN previo). Se descarta siempre. |

Para UDP e ICMP, que no tienen conexión, conntrack crea "pseudo-estados" basados en la tupla y un temporizador: si se envía una consulta DNS a 10.10.0.53:53, la respuesta que llegue en los siguientes 30 segundos desde ese origen a ese puerto se considera `established`.

Por qué importa esto para escribir reglas: solo hay que escribir la regla del primer paquete, en la dirección en que se inicia la conexión, y poner una regla genérica `established,related accept` al principio de la cadena. Es lo que hace que la política "DMZ externa puede iniciar hacia DMZ interna:8080, pero DMZ interna no puede iniciar nada hacia DMZ externa" sea expresable con una sola línea. También explica un error clásico: si la regla `established,related` no está, o está después de un `drop`, la conexión abre (el SYN pasa) pero nunca responde, y en tcpdump aparecen SYN, SYN-ACK... y el SYN-ACK muriendo en el firewall.

La tabla de estados no es infinita y sus entradas caducan: cuántas caben, qué ocurre cuando se llena y cuánto vive una conexión inactiva está en [La tabla de estados por dentro](../ampliacion.md#la-tabla-de-estados-por-dentro).

### OPNsense

!!! consulta "Material de consulta"
    Esto no se explica en clase: es lo que necesitas para la preparación de casa de la A3.1 y para sus pasos 2 a 4.

Este apartado monta el cortafuegos del laboratorio: una VM con una pata en cada zona, la consola web solo accesible desde gestión, y las reglas, el NAT y los logs que hacen que el modelo de zonas exista de verdad. Más que los menús, que cambian con cada versión, importan tres ideas: las reglas se escriben con nombres (aliases), se evalúan en la interfaz por la que entra el paquete, y nada se aplica hasta pulsar "Apply changes".

OPNsense es una distribución de firewall basada en FreeBSD y en el filtro `pf`, con interfaz web, desarrollo abierto y versiones semestrales (la 26.1 y la 26.7 son las de este curso; la numeración es año.mes). Nació como bifurcación de pfSense en 2015 y las dos son funcionalmente muy parecidas: si en una empresa aparece pfSense, todo lo de esta sección aplica cambiando algún nombre de menú. En el curso se usa OPNsense porque la interfaz es más limpia, parchea más rápido y la edición comunitaria no tiene recortes respecto a la de pago.

<figure markdown="span">
  ![Panel principal de OPNsense](../img/opnsense-dashboard.png){ width="640" }
  <figcaption>Panel de OPNsense con el estado de interfaces, servicios y tráfico. Fuente: Hagennos, CC BY-SA 4.0, vía Wikimedia Commons.</figcaption>
</figure>

#### Instalación en Proxmox

Se instala como una VM normal, con el ID 109 (el último de la franja de gestión de dev): imagen `dvd` o `vga` de la 26.x desde opnsense.org, 2 vCPU, 1 GB de RAM y 20 GB de disco, que es lo que le reserva el presupuesto de memoria del laboratorio. Con la instalación base y sin plugins de inspección basta; si el instalador va justo, se le suben a 2 GB mientras dura y se vuelve a 1 GB al terminar. Lo que la distingue es el número de interfaces: una por zona, cinco en este caso, cada una conectada a su bridge o VNet de Proxmox. Conviene usar el modelo VirtIO (el dispositivo paravirtualizado de KVM, el más rápido en Proxmox) para las NIC y activar la opción de arranque en el orden correcto; FreeBSD nombra las interfaces VirtIO como `vtnet0`, `vtnet1`... en el orden en que Proxmox las presenta en el bus PCI, así que el orden en que se añaden a la VM importa. Conviene apuntar qué MAC corresponde a qué bridge antes de arrancar, porque en el asistente de consola hay que asignar cada `vtnetN` a su papel:

| Interfaz OPNsense | vtnet | Bridge / VNet Proxmox | IP |
|----|----|----|----|
| WAN | vtnet0 | vmbr0 (aula) | DHCP del aula o fija |
| DMZEXT | vtnet1 | devfront | 10.10.1.1/24 |
| DMZINT | vtnet2 | devback | 10.10.2.1/24 |
| INT | vtnet3 | devdata | 10.10.3.1/24 |
| MGMT | vtnet4 | devmgmt | 10.10.0.1/24 |

Tras la instalación, la interfaz web escucha en todas las interfaces con la regla "anti-lockout" (la que impide cerrarse el acceso a la propia consola) activa en LAN. Lo primero es mover la administración a MGMT y desactivar el acceso desde el resto (System → Settings → Administration, "Listen interfaces"). Si un error deja fuera, la consola de Proxmox de la VM tiene un menú de texto con la opción "Reset to factory defaults" y otra para reasignar interfaces; no hace falta reinstalar.

### Alternativa: nftables en una VM Linux

El mismo modelo de zonas se puede montar sin OPNsense: un router Debian 13 con cinco interfaces y **nftables**, el cortafuegos del kernel Linux, sucesor de iptables y el mismo motor que hay debajo del firewall de Proxmox y de Docker. Se pierde la interfaz web y sus comodidades (aliases con resolución de nombres, vista de estados en directo) y se gana un fichero de texto de unas cuarenta líneas que se versiona en git como cualquier otro código.

Se elige nftables cuando el cortafuegos tiene que quedar descrito en código desde el primer día, cuando no compensa mantener una VM más con su propio sistema operativo, o cuando quien lo administra ya trabaja en la línea de comandos. Se elige OPNsense cuando lo van a tocar varias personas, cuando hacen falta las herramientas de diagnóstico integradas o cuando interesa tener en la misma caja el proxy inverso, la VPN y la detección de intrusos. En el curso se usa OPNsense, así que esta alternativa no se explica en clase.

El fichero `/etc/nftables.conf` completo del laboratorio, el recorrido de un paquete por los puntos donde el kernel puede filtrar y el orden en que se evalúan las cadenas están en [nftables: el fichero de reglas completo](../ampliacion.md#nftables-el-fichero-de-reglas-completo). El paso 6 de la A3.1 remite a ese material para quien quiera montar esta variante.

### A3.1 Instalar el firewall (sesión 14)

<span class="et et-obj">Objetivo</span> Un OPNsense con una pata en cada una de las cinco zonas, con la IP .1 en cada red, cuya consola web solo responde desde MGMT, y web01 y db01 usándolo como puerta de enlace, como DNS y como servidor de hora.

<span class="et et-pre">Antes de empezar</span>

- La VPC dev de la UT2 completa: las cuatro VNets (`devmgmt`, `devfront`, `devback`, `devdata`), `router-dev` repartiendo IP y nombres, `web01` (10.10.1.10) en `devfront` y `db01` (10.10.3.10) en `devdata`. Las dos se crearon en la UT2; hoy no hay que crear ninguna. `app01` y `mon01` siguen en `vmbr0` mientras Mantenimiento trabaja con ellas: se trasladan a la VPC en la A3.3, el 27 de noviembre, y sus reservas por MAC ya están escritas en `dev.conf` desde la A2.3.
- El puesto de administración (VM 105, 10.10.0.50 en `devmgmt`) encendido, con su ruta `10.10.0.0/16 via 10.10.0.1` puesta. Se creó en la A2.4, el 6 de noviembre, y es la máquina desde la que administrarás el firewall toda la unidad: hoy no hay que crearla. Entra en ella con `ssh -A ops@<IP de aula de admin01>`: el `-A` le presta la clave de tu puesto, sin copiarla, para saltar desde ahí a `web01` y a `db01`.
- La ISO `dvd` de OPNsense 26.x en el almacenamiento de Proxmox. Descárgala y súbela antes de clase, igual que la de Proxmox en la [A1.1](ut1-virtualizacion.md#a11-instalar-proxmox-ve-sesion-1): la red del aula se resiente cuando la bajan treinta personas a la vez.
- La VM del firewall ya instalada y los paquetes de web01 y db01 ya puestos, que se traen hechos de casa: el bloque siguiente dice cómo.
- Explicado en clase: [el modelo de zonas](#defensa-en-profundidad-y-zonas), [el mapa sobre la VPC](#mapa-sobre-la-vpc-de-la-ut2) y [qué es un cortafuegos con estado](#cortafuegos-con-estado). De consulta, para la preparación y los pasos 2 a 4: [OPNsense](#opnsense).

!!! truco "Preparación antes de la sesión: la VM del firewall, instalada"
    Crear la VM y pasar el instalador son unos veinte minutos de clics que no enseñan nada de lo que toca
    aprender hoy y que no dependen de nadie más. Se hacen en casa, como la descarga de la ISO de Proxmox de la
    A1.1, y la sesión empieza directamente por asignar las interfaces.

    1. Crea la VM del firewall con el ID 109: 2 vCPU, 1 GB de RAM, 20 GB de disco, la ISO `dvd` de OPNsense, y
       cinco NIC VirtIO en el orden exacto de la tabla que va debajo de este bloque, porque FreeBSD las numera por orden
       de bus PCI: en otro orden, `vtnet2` no será la que crees y lo descubrirás a mitad de clase.
    2. Apunta la MAC de cada NIC en la pestaña Hardware de la VM y rellena con ellas la columna de la tabla:
       te hará falta si algo no cuadra en Interfaces → Assignments, y forma parte de la entrega.
    3. Arranca desde la ISO, entra como `installer` / `opnsense`, instala con las opciones por defecto, cambia
       la contraseña de root, retira la ISO y reinicia. Ahí se para: configurarlo es el trabajo de la sesión.
    4. Mientras `web01` y `db01` todavía salen a Internet por `router-dev`, deja instalado lo que van a usar
       las sesiones 15 y 16, porque desde el relevo del paso 5 las zonas de servicio ya no salen:
       `sudo apt install -y nginx nmap netcat-openbsd` en `web01` y
       `sudo apt install -y postgresql prometheus-postgres-exporter nmap netcat-openbsd` en `db01`.

**Las cinco interfaces del firewall.** Esta tabla se usa en toda la hoja: para crear la VM, para asignar cada `vtnet` a su papel, para ponerle su IP a cada zona y para la entrega.

| NIC en Proxmox | Bridge / VNet | Será | IP que le pondrás |
|----|----|----|----|
| net0 | vmbr0 | WAN (vtnet0) | DHCP del aula |
| net1 | devfront | DMZEXT (vtnet1) | 10.10.1.1/24 |
| net2 | devback | DMZINT (vtnet2) | 10.10.2.1/24 |
| net3 | devdata | INT (vtnet3) | 10.10.3.1/24 |
| net4 | devmgmt | MGMT (vtnet4) | 10.10.0.1/24 |

Esas IP no se pueden poner todas de golpe: `router-dev` sigue encendido mientras montas el firewall, y es el `.1` de las cuatro subredes. Dos máquinas no pueden tener la misma IP, así que hasta el paso 5 el firewall se configura con las cuatro interfaces internas **sin activar** y con una dirección provisional en MGMT. El relevo se hace de una vez en el paso 5, con todo preparado.

<span class="et et-pas">Pasos</span>

1. Comprueba el punto de partida. En la pestaña Hardware de la VM 109 tienen que estar las cinco NIC, cada una en el bridge que le toca según la tabla, y la VM tiene que arrancar ya sin la ISO hasta el menú de texto de OPNsense. En Datacenter → SDN → VNets, ninguna de las cuatro subnets conserva gateway ni rango DHCP: desde la A2.3 el `.1` y el DHCP los sirve `router-dev`, y hoy pasan al firewall (si alguna los tuviera, bórralos y pulsa Apply antes de seguir). La ruta del puesto de administración hacia el laboratorio apunta al `.1` de gestión, así que al acabar la sesión apuntará al cortafuegos sin haberla tocado.

    Si no traes la VM hecha, hazla ahora con el bloque de preparación de arriba: son unos veinte minutos de los 85 de la hoja, así que ve directo y sin explorar menús. Lo que no puede quedarse sin tiempo es el paso 5, el relevo del DHCP y el DNS.

2. En la consola de la VM, opción 1 "Assign interfaces": WAN → vtnet0, LAN → vtnet4 (OPNsense llama LAN a la primera interfaz protegida; será MGMT). Opción 2 "Set interface IP address" para LAN: `10.10.0.2/24`, sin DHCP. Es una dirección provisional, del rango reservado `.2` a `.9`, porque el `.1` lo tiene todavía `router-dev`. WAN queda en DHCP.
3. Abre la consola web en `https://10.10.0.2`. Esa dirección solo existe dentro de gestión, así que se llega a ella con un túnel SSH por el puesto de administración, que es la única máquina con un pie en el aula y otro en `devmgmt`. Deja el túnel abierto en una terminal mientras trabajas:

    ```bash
    ssh -L 8443:10.10.0.2:443 ops@<IP de aula de admin01>
    # y en el navegador del aula: https://localhost:8443
    ```

    Cuando en el paso 5 el cortafuegos pase a la 10.10.0.1, el túnel es el mismo cambiando la dirección. Ya dentro, en Interfaces → Assignments añade vtnet1, vtnet2 y vtnet3; en cada una pon la descripción (DMZEXT, DMZINT, INT), IPv4 estática con el `.1/24` de su zona y sin gateway, pero **deja sin marcar "Enable interface"** hasta el paso 5. Renombra LAN a MGMT.

4. Mueve la administración a MGMT: System → Settings → Administration, en "Listen interfaces" deja solo MGMT. No desactives la regla anti-lockout: te protege mientras escribes las reglas propias de MGMT en la sesión 15.
5. El relevo: OPNsense pasa a ser el `.1`, el DHCP y el DNS de las cuatro zonas, y `router-dev` se apaga. El orden importa. Todo se deja configurado en el firewall **antes** de tocar el router; si se apaga primero el router, las máquinas se quedan sin IP en cuanto caduque su concesión y sin resolver un solo nombre, y el laboratorio se para a mitad de sesión.

    1. Con las interfaces internas todavía apagadas, configura en OPNsense el reparto de direcciones: Services → Dnsmasq DHCP & DNS (o el servicio DHCP que traiga tu versión), activo en DMZEXT, DMZINT, INT y MGMT, con el rango `.100` a `.199` de cada red. Deja vacíos el router y el servidor DNS de cada rango: cuando están vacíos, el servicio anuncia la propia IP de la interfaz, que es justo el `.1` de esa zona, y te ahorras ocho campos. Copia las cuatro reservas por MAC de tu `dev.conf` tal cual: `web01` 10.10.1.10, `app01` 10.10.2.10, `db01` 10.10.3.10 y `mon01` 10.10.0.20. Las de `app01` y `mon01` quedan preparadas para el traslado de la A3.3, aunque hoy esas dos VM sigan en el bridge del aula.
    2. Configura el DNS: dominio `dev.lab` y un registro para `api.dev.lab` apuntando a 10.10.1.10. Los nombres `<host>.dev.lab` de las máquinas no hay que escribirlos uno a uno: el servicio los da de alta solo, con cada reserva y cada concesión, igual que hacía dnsmasq en el router. Los de plataforma sí: una entrada para `mon01` del dominio `lab` con la 10.10.0.20 y los alias `grafana.lab`, `prometheus.lab` y `gitea.lab`, que desde hoy resuelve el cortafuegos para todo el laboratorio. Guarda, sin aplicar todavía.
    3. Deja `router-dev` sin sus IP internas. Entra en él desde el nodo por su IP del aula (`ssh ops@<IP de aula de router-dev>`, la pata `ens18`, que no se toca):

        ```bash
        sudo systemctl stop dnsmasq
        for i in ens19 ens20 ens21 ens22; do sudo ip link set $i down; done
        ```

    4. Ahora sí, en OPNsense marca "Enable interface" en DMZEXT, DMZINT e INT, cambia la IP de MGMT de `10.10.0.2` a `10.10.0.1` y aplica. Perderás la sesión del navegador: vuelve a entrar por el túnel, ya con la 10.10.0.1. Arranca el servicio de DHCP y DNS, y comprueba en Services → Network Time → General que el servidor de hora está activo: desde hoy es la hora de todo el laboratorio.
    5. Crea la regla 0, la que todas las zonas necesitan desde el primer minuto: sin ella, la denegación por defecto corta también el DNS, la hora y el ping al propio cortafuegos (el DHCP no la necesita, porque OPNsense añade sola su regla). Como es igual en todas las zonas, se escribe una sola vez sobre un grupo de interfaces:

        - En Firewall → Aliases, un alias de tipo Port, `p_infra`, con el 53 y el 123. Los aliases se explican en la sesión 15; hoy basta con saber que es un nombre para una lista de puertos.
        - En Firewall → Groups, un grupo `ZONAS` con DMZEXT, DMZINT, INT y MGMT. En la sesión 17 se le añaden los dos clientes.
        - En la pestaña ZONAS de Firewall → Rules, dos reglas Pass con destino This Firewall: una TCP/UDP a los puertos `p_infra` y otra ICMP de tipo Echo Request, las dos con la descripción "0 DNS, hora y ping al cortafuegos". Apply.

        En MGMT hoy no cambia nada más: la regla de fábrica de la LAN lo sigue dejando pasar todo hasta que la A3.2 la sustituya por reglas propias.

    6. Comprueba que el relevo está hecho antes de apagar nada más: desde el puesto de gestión responden `ping 10.10.0.1`, `ping 10.10.1.1`, `ping 10.10.2.1` y `ping 10.10.3.1`; en `web01`, tras `sudo networkctl renew ens18`, `ip -br a` sigue dando la 10.10.1.10, ahora concedida por el firewall, y `dig db01.dev.lab` sigue respondiendo 10.10.3.10. Deja también a `web01` y a `db01` tomando la hora del `.1` de su zona, porque el servidor de Internet que traían ya no les llega:

        ```bash
        sudo mkdir -p /etc/systemd/timesyncd.conf.d
        printf '[Time]\nNTP=10.10.1.1\n' | sudo tee /etc/systemd/timesyncd.conf.d/lab.conf   # 10.10.3.1 en db01
        sudo systemctl restart systemd-timesyncd
        timedatectl timesync-status | grep Server        # Server: 10.10.1.1
        ```

    7. Apaga `router-dev` (`qm shutdown 100` desde el nodo) y anota en una línea qué se ha traspasado. No la borres: se queda apagada, por si hubiera que deshacer el relevo, hasta que entregues la evaluable del 9 de diciembre. Las VM de servicio no cambian de gateway: siguen apuntando al `.1` de su zona, que ahora es el firewall. El puesto de administración, que tiene IP fija en gestión, recibe el DNS del cortafuegos desde el nodo: `qm set 105 --nameserver 10.10.0.1 --searchdomain lab && qm reboot 105`. Al volver, `getent hosts mon01.lab` da la 10.10.0.20. Si `ssh` avisa de que la clave del host ha cambiado, es cloud-init, que la regenera al cambiar su configuración: `ssh-keygen -R <IP de aula de admin01>` en tu puesto y vuelve a entrar.

6. Si prefieres montar el cortafuegos con nftables en una VM Debian en lugar de con OPNsense, el fichero de reglas completo y los pasos están en [Para ampliar](../ampliacion.md#nftables-el-fichero-de-reglas-completo).

<span class="et et-com">Comprobación</span>

- Desde el puesto de gestión, `ping 10.10.0.1` responde y la consola web abre.
- Desde web01, `ping 10.10.1.1` y `dig db01.dev.lab` responden por la regla 0, pero `curl -k -m 3 https://10.10.1.1` falla por timeout: la regla 0 no deja pasar el 443 y la consola, además, solo escucha en MGMT.
- En Interfaces → Assignments la MAC de cada vtnet coincide con la que apuntaste para cada bridge.
- `ip route` en web01 y db01 muestra `default via 10.10.X.1`, y `timedatectl timesync-status` el `.1` de su zona como servidor.

<span class="et et-ent">Entrega</span> En la carpeta `ut3/` de tu repositorio, captura de Interfaces → Assignments y la tabla de las cinco interfaces completada con la MAC real de cada NIC y la IP que le has puesto.

<span class="et et-ext">Si te sobra tiempo</span> Añade ya la sexta NIC del firewall, en `vmbr1` y sin tag, que necesitarás en la sesión 17, y comprueba en Interfaces → Assignments que FreeBSD la ve como `vtnet5` después de reiniciar la VM.


## Sesión 15 · Reglas por zona y publicación de un servicio

<p class="ut-meta" markdown>25 de noviembre · Teoría y práctica · <span class="dur" tabindex="0" aria-label="Aliases · 5 min&#10;Reglas y orden de evaluación · 5 min&#10;NAT: port forward y outbound · 5 min&#10;Certificados · 10 min&#10;A3.2 Publicar la web · 85 min" data-dur="Aliases · 5 min&#10;Reglas y orden de evaluación · 5 min&#10;NAT: port forward y outbound · 5 min&#10;Certificados · 10 min&#10;A3.2 Publicar la web · 85 min">:material-school:<i class="dur-barra" style="--teoria:23%"></i>:material-flask:</span></p>

Hoy el firewall empieza a hacer su trabajo: se comprueba que sin reglas nada pasa, se crean los aliases, nace la CA del curso, se publica nginx en web01 con un port forward en la WAN y se prueba con curl y nmap desde el aula. En clase se explican los aliases, el orden de evaluación de las reglas, el NAT y la CA del curso con sus certificados; el apartado de logs es consulta para el paso 1 de la hoja.

### Aliases

Un alias es un nombre para un conjunto de IPs, redes, puertos o URLs. `srv_web` = 10.10.1.10, `net_mgmt` = 10.10.0.0/24, `p_app` = {8080, 8090}, `p_web` = {80, 443}. Las reglas se escriben con aliases, nunca con IPs sueltas, por dos razones: la regla se lee sola ("permitir srv_web a srv_app en p_app") y cuando app01 cambie de IP, o haya dos app, se cambia el alias y no diez reglas. Los aliases de tipo "Host" admiten nombres DNS que OPNsense resuelve periódicamente, y los de tipo "URL Table" descargan listas (por ejemplo, rangos de IP de un proveedor) y las actualizan solas. En Firewall → Aliases.

### Reglas y orden de evaluación

Las reglas se organizan por interfaz y se evalúan sobre el tráfico que **entra** por esa interfaz (dirección "in", que es la habitual casi siempre). Para permitir que web01 hable con app01:8080, la regla va en la pestaña DMZEXT, porque es por donde entra el paquete al firewall, aunque el destino esté en DMZINT.

!!! truco "La pregunta que resuelve el 90 % de las dudas"
    «¿Por qué interfaz **llega** este paquete al cortafuegos?». Esa es la pestaña donde va la regla. Para que
    `web01` hable con `app01:8080` la regla va en DMZEXT, que es por donde entra, aunque el destino esté en
    DMZINT.

```mermaid
flowchart TB
    P["<b>Llega un paquete</b>"]:::dato
    I{"<b>¿Por qué interfaz<br>entra?</b>"}:::act
    PEST["<b>Esa pestaña</b><br><small>y solo esa · dirección in</small>"]:::pieza
    AUT["<b>1 · Reglas automáticas</b><br><small>anti-lockout y las de los port forward</small>"]:::infra
    MIAS["<b>2 · Reglas propias</b><br><small>en orden, de arriba abajo</small>"]:::pieza
    PRIM(["<b>La primera que coincide decide</b><br><small>las de debajo ya no se miran</small>"]):::ok
    DENY(["<b>Si ninguna coincide: se descarta</b>"]):::riesgo
    P --> I --> PEST --> AUT --> MIAS --> PRIM
    MIAS -. "ninguna coincide" .-> DENY
    classDef act fill:#ea580c22,stroke:#ea580c,stroke-width:1.5px
    classDef pieza fill:#64748b22,stroke:#64748b,stroke-width:1.5px
    classDef dato fill:#2563eb22,stroke:#2563eb,stroke-width:1.5px
    classDef infra fill:#a1a1aa14,stroke:#a1a1aa,stroke-width:1.5px
    classDef ok fill:#16a34a22,stroke:#16a34a,stroke-width:1.5px
    classDef riesgo fill:#dc262622,stroke:#dc2626,stroke-width:1.5px
```

<p class="pie" markdown>El orden importa porque gana la primera coincidencia. Una regla permisiva arriba anula todas las restrictivas de debajo.</p>


El orden de evaluación es el siguiente:

1. Reglas automáticas (anti-lockout, las que generan los port forward si se marca la opción).
2. Reglas flotantes (Floating), que aplican a varias interfaces a la vez.
3. Reglas de grupos de interfaces (en el laboratorio, la regla 0 del grupo `ZONAS`).
4. Reglas de la interfaz concreta, de arriba abajo.
5. Denegación implícita al final, que registra si está activado "Log packets matched by the default deny rule" en Firewall → Settings → Advanced.

Aquí entra la opción **quick**, que está marcada por defecto en cada regla y merece explicación. `pf` evalúa toda la lista y aplica la **última** regla que coincide, salvo que una regla tenga `quick`, en cuyo caso la evaluación se detiene en ella. Como OPNsense marca quick en todo, en la práctica funciona como "la primera que coincide gana". Si se desmarca quick en una regla, esa regla solo se aplicará si ninguna posterior coincide. Se usa para escribir una regla genérica arriba ("permitir todo desde MGMT", sin quick) que las reglas posteriores más específicas pueden anular. Lo recomendable es dejar quick activado y ordenar las reglas de más específica a más general: es más fácil de leer y de auditar.

Cada regla lleva: acción (Pass, Block, Reject), interfaz, dirección, familia IP, protocolo, origen (con puerto opcional), destino y puerto, opción de log, y una descripción. Conviene ponerla siempre: en el log aparece la descripción, no el número de regla. La diferencia entre Block y Reject: Block descarta en silencio (el origen espera hasta agotar el timeout), Reject responde con un TCP RST o un ICMP unreachable (el origen sabe al instante que no hay servicio). Hacia Internet se usa Block, para no dar información; entre zonas internas, Reject ahorra esperas a los servicios propios.

Las reglas nuevas se guardan y luego se aplican con "Apply changes". Hasta que no se aplican, no hay cambio. Y al aplicar, los estados existentes que ya no encajan con la política se mantienen hasta que expiran; para cortar una conexión ya establecida hay que borrar su estado en Firewall → Diagnostics → States (o "Reset state table", que las corta todas).

### NAT: port forward y outbound

Dos tipos de NAT hacen falta:

**Port forward** (DNAT, NAT de destino: cambia la IP de destino del paquete) publica un servicio interno en la IP WAN: WAN:443 → srv_web:443. Se configura en Firewall → NAT → Port Forward, y al crearlo OPNsense ofrece generar la regla de filtro asociada ("Filter rule association: add associated filter rule").

!!! ojo "El port forward sin regla de filtro no publica nada"
    OPNsense ofrece generar la regla asociada al crear el port forward. Conviene aceptarla: si no, el paquete se
    traduce y después se bloquea en la interfaz WAN, y el síntoma es un `curl` que se queda colgado sin
    respuesta ni error claro.

```mermaid
flowchart TB
    subgraph IN["Port forward · DNAT, hacia dentro"]
        direction LR
        C1["<b>curl desde el aula</b><br><small>a WAN:443</small>"]:::act
        N1["<b>NAT</b><br><small>destino → srv_web:443</small>"]:::pieza
        FIL["<b>Filtro</b><br><small>la regla se escribe con el destino YA traducido</small>"]:::dato
        S1(["<b>srv_web</b>"]):::ok
        C1 --> N1 --> FIL --> S1
    end
    subgraph OUT["Outbound NAT · SNAT, hacia fuera"]
        direction LR
        Z["<b>Zona interna</b>"]:::pieza
        N2["<b>NAT</b><br><small>origen → IP del firewall</small>"]:::pieza
        I2(("<b>Internet</b>")):::infra
        Z --> N2 --> I2
    end
    IN ~~~ OUT
    classDef act fill:#ea580c22,stroke:#ea580c,stroke-width:1.5px
    classDef pieza fill:#64748b22,stroke:#64748b,stroke-width:1.5px
    classDef dato fill:#2563eb22,stroke:#2563eb,stroke-width:1.5px
    classDef infra fill:#a1a1aa14,stroke:#a1a1aa,stroke-width:1.5px
    classDef ok fill:#16a34a22,stroke:#16a34a,stroke-width:1.5px
    classDef riesgo fill:#dc262622,stroke:#dc2626,stroke-width:1.5px
```

<p class="pie" markdown>En `pf` el NAT va **antes** que el filtro. Es el motivo de que la regla lleve `srv_web:443` y no la IP WAN, y de que mucha gente la escriba mal la primera vez.</p>


**Outbound NAT** (SNAT, NAT de origen: cambia la IP de origen) permite que las zonas internas salgan a Internet con la IP del firewall. En modo automático OPNsense lo hace para todas las redes de sus interfaces, y en el laboratorio se deja así, porque quien decide qué sale no es el NAT sino las reglas de filtro:

- **Gestión sale siempre**, a los puertos 80 y 443 (la fila 2 de la matriz de reglas): es donde viven las máquinas que descargan paquetes, imágenes y plugins.
- **Las zonas de servicio no salen.** Cuando una hoja necesita instalar algo en ellas, abre una fila **TEMPORAL** en la pestaña de esa zona (origen la máquina, destino any, puertos `p_web`, y en la descripción la palabra `TEMPORAL` con la fecha de alta y la de baja), instala y la borra en el mismo paso. Una regla temporal que se queda abierta es la forma más común de que un cortafuegos acabe dejándolo pasar todo.

!!! empresa "Sin salida ni siquiera un rato"
    En producción las zonas internas no salen a Internet ni para actualizarse: toman los paquetes de un mirror o de
    una caché de paquetes (apt-cacher-ng, por ejemplo) que vive en gestión, y el outbound NAT se pone en modo
    Hybrid con solo las salidas justificadas.

### Logs

!!! consulta "Material de consulta"
    Esto no se explica en clase: lo necesitas para el paso 1 de la hoja de esta sesión y para las pruebas de las siguientes.

Firewall → Log Files → Live View muestra en tiempo real cada paquete que coincide con una regla que tiene log activado, y todos los de la denegación por defecto. Cada línea trae interfaz, dirección, acción, origen, destino, protocolo y la etiqueta de la regla. Conviene filtrar por interfaz o por etiqueta; con 20 VM escaneándose, el log sin filtro es inservible. Para el histórico está Plain View, y para enviarlo fuera, que es lo habitual en producción, System → Settings → Logging / Targets permite mandar todo por syslog (el protocolo estándar de envío de logs) a un colector.

Conviene activar el log en todas las reglas de denegación y en las de permiso hacia INT. No en la regla de permiso de WAN:443, que generaría una línea por conexión web y solo serviría para llenar el disco; para eso están los logs de acceso del proxy.

### Certificados

El `curl -kv` de la primera prueba usa `-k` para saltarse la validación del certificado, y eso vale para el primer minuto, pero no es la forma de trabajar. Hay dos escenarios: una CA propia para lo que no ve Internet y Let's Encrypt para lo que tiene nombre público.

**La CA del curso.** Una CA (autoridad de certificación) es quien firma los certificados y en quien confían los clientes. El laboratorio tiene una sola, `Lab 5166 CA`, que nace hoy en el puesto de administración y firma todo lo que se cifra después en las dos asignaturas: el proxy de hoy, los exporters y Loki de Mantenimiento y Jenkins en la UT6. Se hace con `openssl ca` y no con el atajo de `openssl x509 -req`, porque `openssl ca` lleva el registro de lo emitido: `index.txt` apunta cada certificado con su número de serie, y eso es lo que permite revocar uno más adelante y publicar la lista de revocados. Todo vive en `~/ca/` del puesto de administración, y `ca.key` no sale nunca de ahí.

```bash
mkdir -p ~/ca/emitidos && chmod 700 ~/ca && cd ~/ca
touch index.txt
echo 1000 > serial
echo 1000 > crlnumber
```

El fichero de configuración, entero, en `~/ca/ca.cnf`. Tiene dos secciones de extensiones, una para certificados de servidor y otra para certificados de cliente, y `copy_extensions` para que el certificado conserve los nombres que trae la petición:

```ini
[ ca ]
default_ca        = ca_curso

[ ca_curso ]
dir               = $ENV::HOME/ca
certificate       = $dir/ca.crt
private_key       = $dir/ca.key
database          = $dir/index.txt      # registro de lo emitido y lo revocado
serial            = $dir/serial
crlnumber         = $dir/crlnumber
new_certs_dir     = $dir/emitidos       # una copia de cada certificado, por número de serie
default_md        = sha256
default_days      = 365
default_crl_days  = 30
policy            = politica
copy_extensions   = copy                # copia el SAN que trae la petición
unique_subject    = no                  # deja reemitir un certificado con el mismo nombre

[ politica ]
commonName        = supplied

# servidores: proxy, exporters, Jenkins, registry
[ server_cert ]
basicConstraints       = CA:FALSE
extendedKeyUsage       = serverAuth
subjectKeyIdentifier   = hash
authorityKeyIdentifier = keyid,issuer

# clientes que se identifican con certificado: Promtail, logcli
[ client_cert ]
basicConstraints       = CA:FALSE
extendedKeyUsage       = clientAuth
subjectKeyIdentifier   = hash
authorityKeyIdentifier = keyid,issuer
```

La CA se crea una sola vez, con una clave de curva elíptica y diez años de vida. La línea `keyUsage` no es decorativa: sin ella, los clientes que verifican en modo estricto (Python 3.13, por ejemplo) rechazan todo lo que firme la CA.

```bash
cd ~/ca
openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -nodes \
  -keyout ca.key -out ca.crt -days 3650 -subj "/CN=Lab 5166 CA" \
  -addext "keyUsage=critical,keyCertSign,cRLSign"
chmod 600 ca.key
```

Cada certificado se emite después con dos órdenes, cambiando el nombre: una petición (CSR, la solicitud de firma con la clave pública y los nombres) y la firma de la CA. Conviene fijarse en el SAN (Subject Alternative Name, el campo del certificado donde van los nombres y las IP para los que vale): sin él los navegadores y los clientes modernos rechazan el certificado aunque la firma sea correcta.

```bash
openssl req -new -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -nodes \
  -keyout api.dev.lab.key -out api.dev.lab.csr -subj "/CN=api.dev.lab" \
  -addext "subjectAltName=DNS:api.dev.lab,IP:10.10.1.10"
openssl ca -config ~/ca/ca.cnf -extensions server_cert \
  -in api.dev.lab.csr -out api.dev.lab.crt
```

`openssl ca` pregunta dos veces antes de firmar y de anotar; en un bucle se le añade `-batch` para que no pregunte. Un certificado de cliente es lo mismo con `-extensions client_cert`. Para comprobar lo emitido, `openssl x509 -in api.dev.lab.crt -noout -ext subjectAltName` enseña los nombres, y `cat ~/ca/index.txt` una línea por certificado, con una `V` delante mientras es válido. La revocación (`openssl ca -revoke` y `-gencrl`) se usa al final del curso, al dar de baja lo que ya no se necesita.

Después se instala `ca.crt` en los clientes (`/usr/local/share/ca-certificates/` y `update-ca-certificates` en Debian) y `curl` deja de necesitar `-k`. Para algo más serio que un laboratorio, **step-ca** de Smallstep es una CA completa con protocolo ACME (el protocolo con el que un servidor pide y renueva certificados sin intervención humana, el mismo que usa Let's Encrypt), con certificados de vida corta que se renuevan solos.

**Let's Encrypt** en producción, para todo lo que tiene nombre público. Emite certificados de 90 días (y está pasando a 6 días para quien los quiera) gratis, validando el control del dominio: con `HTTP-01` publicando un fichero en `/.well-known/acme-challenge/` por el puerto 80 (por eso el port forward del 80 en el firewall aunque después se redirija a HTTPS), o con `DNS-01` creando un registro TXT (un registro DNS de texto libre), que es la única opción para wildcards y para servicios que no exponen el 80. Certbot, Caddy, Traefik y el plugin ACME de OPNsense renuevan solos. Conviene vigilar que la renovación funcione: un certificado caducado un domingo es la avería más tonta y más frecuente de un servicio publicado.

### A3.2 Publicar la web (sesión 15)

<span class="et et-obj">Objetivo</span> `https://api.dev.lab` responde desde el aula con la web de web01, con un certificado firmado por la CA del curso, y un nmap desde el aula solo ve el 443 (y el 80).

<span class="et et-pre">Antes de empezar</span>

- El firewall de la A3.1 con las cinco interfaces y la regla 0, y web01 y db01 apuntando a él.
- nginx, nmap y netcat-openbsd en web01, instalados en la preparación de la A3.1. Si falta alguno, el paso 4 dice cómo instalarlo con una fila temporal.
- Explicado en clase: [Aliases](#aliases), [Reglas y orden de evaluación](#reglas-y-orden-de-evaluacion), [NAT: port forward y outbound](#nat-port-forward-y-outbound) y [Certificados](#certificados). De consulta, para el paso 1: [Logs](#logs).

<span class="et et-pas">Pasos</span>

1. Comprueba la política por defecto. Desde web01, `nc -zv -w 3 10.10.2.10 22` y `nc -zv -w 3 10.10.3.10 5432` deben terminar por timeout, no con "Connection refused" (app01 todavía no está en la 10.10.2.10, pero da igual: el paquete muere antes, en el cortafuegos). En Firewall → Log Files → Live View, filtra por DMZEXT y localiza las dos denegaciones (si no aparecen, activa el log de la regla por defecto en Firewall → Settings → Advanced y repite).

2. Crea los aliases de hoy en Firewall → Aliases y pulsa Apply: de tipo Host, `srv_web` 10.10.1.10, `srv_app` 10.10.2.10 y `srv_db` 10.10.3.10; de tipo Network, `net_mgmt` 10.10.0.0/24; de tipo Port, `p_web` 80 y 443, `p_app` 8080 (en la A3.3 se le añade el 8090). El `p_infra` de la regla 0 ya existe desde la A3.1.

3. Crea la CA del curso y el certificado del proxy en el puesto de administración, no en web01, para que la clave de la CA no viva en la DMZ. Son los bloques de [Certificados](#certificados) tal cual: prepara `~/ca/`, copia `ca.cnf` entero, crea la CA y emite el certificado de `api.dev.lab` con `-extensions server_cert`. El nombre publicado es `api.dev.lab`, el que el DNS del cortafuegos resuelve a web01 desde la A3.1: los servicios de un entorno se nombran `<host o servicio>.<entorno>.lab`, y el dominio plano `.lab` queda para los de plataforma.

    Copia `api.dev.lab.crt` y `api.dev.lab.key` a web01 con `scp` y, dentro, muévelos a `/etc/ssl/` con `sudo` (la clave, con permisos 600). Hoy la regla de fábrica de MGMT todavía deja pasar el SSH; en el paso 5 la sustituye la regla 5.

4. Crea en web01 `/etc/nginx/sites-available/api.dev.lab`, hoy sin proxy (si nginx no quedó instalado en la preparación de la A3.1, lee antes el final de este paso):

    ```nginx
    server {
        listen 80;
        server_name api.dev.lab;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl;
        http2 on;
        server_name api.dev.lab;
        ssl_certificate     /etc/ssl/api.dev.lab.crt;
        ssl_certificate_key /etc/ssl/api.dev.lab.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        root /var/www/html;
    }
    ```

    Enlázalo en `sites-enabled`, borra el enlace `default`, `nginx -t` y `systemctl reload nginx`.

    Si nginx no quedó instalado en la preparación de la A3.1, web01 ya no sale a Internet: ábrele una fila temporal en la pestaña DMZEXT (Pass, origen `srv_web`, destino any, puertos `p_web`, descripción `TEMPORAL alta 25-11 baja 25-11 apt en web01`), instala y bórrala en cuanto termine el `apt`. Es la única salida de una zona de servicio, y se abre y se cierra en el mismo paso.

5. Reglas de gestión, en la pestaña MGMT: la 5 (Pass, origen `net_mgmt`, destino any, puerto 22, log sí, descripción "5 Administración por SSH") y la 2 (Pass, origen `net_mgmt`, destino any, puertos `p_web`, descripción "2 Gestión: consola y salida a Internet"), que cubre la consola del cortafuegos y las descargas del puesto de administración y de mon01. Con las dos aplicadas, borra la regla de fábrica "Default allow LAN to any": desde aquí gestión también va por lista blanca. La regla 0 de MGMT ya la tienes, en el grupo `ZONAS`.
6. Port forward: Firewall → NAT → Port Forward, interfaz WAN, TCP, destino "WAN address" puerto p_web, redirigir a srv_web puerto p_web, "Add associated filter rule", descripción "1 Publicación de api.dev.lab". Apply y comprueba en Firewall → Rules → WAN que la regla asociada tiene destino srv_web (traducido, no la IP WAN).
7. Desde tu equipo del aula, primera prueba sin validar el certificado: `curl -kv https://IP_WAN`.
8. Instala la CA en tu equipo y repite sin `-k`, con el nombre para que el SAN coincida:

    ```bash
    scp ops@<IP de aula de admin01>:ca/ca.crt /tmp/lab5166.crt
    sudo cp /tmp/lab5166.crt /usr/local/share/ca-certificates/ && sudo update-ca-certificates
    echo "IP_WAN api.dev.lab" | sudo tee -a /etc/hosts
    curl -v https://api.dev.lab
    ```

9. Escanea la IP WAN desde el aula: `sudo nmap -sS -Pn -p 22,80,443,8080 IP_WAN`.

<span class="et et-com">Comprobación</span>

- El `curl -v` sin `-k` termina con `SSL certificate verify ok` y un 200 con la página por defecto de nginx; `curl -v http://api.dev.lab` devuelve un 301 a `https://api.dev.lab/`.
- El nmap muestra 443 y 80 `open`; 22 y 8080 `filtered`. Si alguno sale `closed`, revisa las reglas de WAN antes de seguir.
- En el log, con filtro por interfaz WAN, ves los SYN al 22 y al 8080 denegados por la regla por defecto.

<span class="et et-ent">Entrega</span> En `ut3/`: captura de Firewall → Rules (WAN y MGMT) y de NAT → Port Forward, la salida del `curl -v` sin `-k` y la del nmap, cada una encabezada con `date; hostname` porque la A3.5 las reutiliza como evidencia. Guarda también `ca.crt` (nunca `ca.key`): Mantenimiento firma con esta misma CA desde mañana.

<span class="et et-ext">Si te sobra tiempo</span> Mira en la salida del curl la cabecera `Server` y añade `server_tokens off;` en `/etc/nginx/nginx.conf` para dejar de regalar la versión.

## Sesión 16 · DMZ interna y zona interna

<p class="ut-meta" markdown>27 de noviembre · Teoría y práctica · <span class="dur" tabindex="0" aria-label="Publicar un servicio · 10 min&#10;Documentación operativa · 5 min&#10;A3.3 Aplicación y datos · 95 min" data-dur="Publicar un servicio · 10 min&#10;Documentación operativa · 5 min&#10;A3.3 Aplicación y datos · 95 min">:material-school:<i class="dur-barra" style="--teoria:14%"></i>:material-flask:</span></p>

Al terminar, app01 y mon01 están en la VPC, la base del servicio vive en db01 y la cadena Internet, proxy, aplicación y base de datos funciona con solo dos reglas entre capas; un intento del proxy contra la base de datos muere en el firewall y queda en el log. En clase se explican el patrón de publicación, el proxy inverso con sus cabeceras y la documentación operativa: la matriz de reglas, que hoy se empieza a rellenar en el paso 7 de la hoja, y el procedimiento de cambios.

### Publicar un servicio

Con el firewall en pie, toca el primer servicio de verdad: una web que se ve desde Internet con HTTPS y cuya aplicación y base de datos no son alcanzables desde fuera. El apartado junta el port forward, el proxy inverso en la DMZ externa y el certificado: las tres piezas que necesita cualquier cosa que se publique el resto del curso.

El patrón es siempre el mismo: Internet → firewall (port forward 443) → proxy inverso en DMZ externa → aplicación en DMZ interna → base de datos en zona interna. La aplicación no tiene IP pública ni ruta directa desde fuera. La base de datos solo acepta conexiones desde la subred de aplicación, y con un usuario de aplicación, no con `postgres`.

```mermaid
sequenceDiagram
    participant U as Usuario (Internet)
    participant FW as Firewall
    participant P as web01 (proxy, DMZ ext)
    participant A as app01 (DMZ int)
    participant D as db01 (INT)
    U->>FW: TLS a IP_WAN:443
    FW->>P: DNAT a 10.10.1.10:443 (regla WAN)
    P->>P: Termina TLS, añade X-Forwarded-For
    P->>A: HTTP a 10.10.2.10:8080 (regla DMZEXT)
    A->>D: SQL a 10.10.3.10:5432 (regla DMZINT)
    D-->>A: Filas
    A-->>P: JSON
    P-->>U: Respuesta cifrada
```

<p class="pie" markdown>Cada flecha cruza una zona y necesita su regla. El TLS termina en el proxy: de ahí hacia dentro el tráfico va en claro por la red interna.</p>

#### El proxy inverso

<figure markdown="span">
  ![Esquema de un proxy inverso delante de varios servidores](../img/reverse-proxy.svg){ width="520" }
  <figcaption>El cliente solo conoce al proxy; los servidores de detrás no son alcanzables directamente. Fuente: H2g2bob, CC0, vía Wikimedia Commons.</figcaption>
</figure>

Un proxy inverso recibe la conexión del cliente y abre otra distinta hacia el servidor interno. Son dos conexiones TCP separadas, con consecuencias:

- **Termina TLS**. El certificado y la clave privada viven en el proxy; la aplicación puede hablar HTTP plano dentro de la DMZ interna (o TLS con certificado interno si la política lo exige). Renovar un certificado no toca la aplicación.
- **Oculta la topología**. El cliente ve una IP y un puerto. No sabe si detrás hay una máquina o veinte, ni en qué red están, ni qué servidor de aplicaciones usan. Las cabeceras `Server` y los mensajes de error del backend se pueden reescribir.
- **Filtra rutas**. Se puede publicar `/api` y `/` y dejar `/admin` o `/metrics` solo accesibles desde MGMT, con un `location` y un `allow`/`deny` (directivas de nginx: una ruta y quién puede pedirla). En el laboratorio no hace falta: las métricas de la API están en su propio puerto, el 9102, que el proxy no publica y que solo lee Prometheus.
- **Pierde la IP del cliente**, salvo que se la pase a la aplicación. Como la segunda conexión sale desde 10.10.1.10, la aplicación vería siempre esa IP. Por eso el proxy añade la cabecera `X-Forwarded-For` con la IP original (y `X-Forwarded-Proto` con `https`, para que la aplicación genere enlaces correctos). La aplicación debe confiar en esas cabeceras **solo** si vienen del proxy; si acepta `X-Forwarded-For` de cualquiera, un cliente puede falsificar su IP. El RFC 7239 estandariza esto como cabecera `Forwarded`, pero en la práctica todo el mundo sigue usando las `X-Forwarded-*`.

Configuración de nginx en web01 (fichero en `/etc/nginx/sites-available/api.dev.lab`, enlazado en `sites-enabled`), tal como queda al terminar la A3.3. Son dos bloques `server`: el del puerto 80 solo redirige a HTTPS, y el del 443 termina TLS y reenvía a app01. Conviene fijarse en las cuatro cabeceras `proxy_set_header`, que valen para todos los `location` del bloque, y en los dos destinos: la API del curso en el 8080 y, en `/cabeceras/`, un contenedor de pruebas que devuelve las cabeceras que recibe.

```nginx
server {
    listen 80;
    server_name api.dev.lab;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name api.dev.lab;

    ssl_certificate     /etc/ssl/api.dev.lab.crt;
    ssl_certificate_key /etc/ssl/api.dev.lab.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;

    location / {
        proxy_pass http://10.10.2.10:8080;    # la API del curso
    }

    location /cabeceras/ {
        proxy_pass http://10.10.2.10:8090;    # whoami: enseña lo que le llega
    }
}
```

Con esto cargado (`nginx -t` valida, `systemctl reload nginx` aplica), `curl https://api.dev.lab/health` desde el aula devuelve la respuesta de la API, y `curl https://api.dev.lab/cabeceras/`, la de whoami con las cabeceras que ha añadido el proxy.

nginx no es la única opción. Las otras dos habituales en empresas se diferencian sobre todo en cómo encuentran los servidores de detrás y en quién se ocupa de los certificados:

| Proxy | Cómo encuentra los backends | Certificados | Cuándo se elige |
|----|----|----|----|
| nginx | A mano: un `proxy_pass` por ruta | A mano, o con certbot | Para aprender, porque obliga a entender cada cabecera; es el del curso |
| Traefik | Solo: lee las etiquetas de los contenedores en Docker o Kubernetes | Let's Encrypt integrado | Producción con contenedores que aparecen y desaparecen |
| Caddy | A mano, con un fichero de muy pocas líneas | Let's Encrypt automático, sin configurar nada | Un servicio pequeño en el que no se quiere pensar en certificados |

El criterio, en una línea: nginx para aprender, Traefik para producción con contenedores y Caddy para un servicio pequeño. El mismo proxy escrito para Caddy está en [Caddy: el mismo proxy en cuatro líneas](../ampliacion.md#caddy-el-mismo-proxy-en-cuatro-lineas).

### Documentación operativa

Una red pasa a producción con los cuatro documentos que pide cualquier auditoría: el diagrama de zonas, la matriz de pruebas con evidencias y los dos que siguen.

#### Matriz de reglas

Cada regla del firewall con su justificación, quién la pidió, quién la aprobó y cuándo se revisa; una regla sin justificación se borra. Las filas de esta unidad el 27 de noviembre:

| # | Interfaz | Origen | Destino | Puerto | Acción | Log | Justificación | Solicitó | Aprobó | Revisión |
|----|----|----|----|----|----|----|----|----|----|----|
| 0 | ZONAS | any | This Firewall | p_infra (53, 123) e ICMP echo | Pass | no | DNS, hora y ping al propio cortafuegos | Sistemas | Sistemas | 2027-03 |
| 1 | WAN | any | srv_web | p_web (80, 443) | Pass | no | Publicación de api.dev.lab (el 80 solo redirige a HTTPS) | Desarrollo | Sistemas | 2027-03 |
| 2 | MGMT | net_mgmt | any | p_web (80, 443) | Pass | no | Gestión: consola del cortafuegos y salida a Internet | Sistemas | Sistemas | 2027-03 |
| 3 | DMZEXT | srv_web | srv_app | p_app (8080, 8090) | Pass | no | El proxy reenvía a la API y al contenedor de pruebas de cabeceras | Desarrollo | Sistemas | 2027-03 |
| 4 | DMZINT | srv_app | srv_db | 5432 | Pass | sí | La API consulta PostgreSQL | Desarrollo | Sistemas | 2027-03 |
| 5 | MGMT | net_mgmt | any | 22 | Pass | sí | Administración por SSH | Sistemas | Sistemas | 2027-03 |
| 6 | DMZINT | srv_app | srv_gitea | 3001 | Pass | no | app01 trae y sube el repositorio `servicio` (Gitea en mon01) | Desarrollo | Sistemas | 2027-02 |
| 99 | todas | any | any | any | Block | sí | Denegación por defecto | | | |

En «Solicitó» y «Aprobó» va el equipo, no una persona: el documento tiene que sobrevivir a quien lo firma.

En OPNsense la descripción de cada regla empieza por su número de fila, y así el log y el documento se cruzan sin buscar. Del 0 al 10 son de esta unidad; del 11 al 20, de [Mantenimiento](https://victor-educ.github.io/apuntes-5169/ut/ut3-seguridad-monitorizacion/#puertos-del-entorno-del-curso-y-quien-debe-llegar), que pone la 11 a la 13 (el scrape y los logs) el 26 de noviembre; del 21 en adelante, de las unidades posteriores, y la 99 es siempre la denegación. La 6 y la 13 son las únicas que entran en gestión, y la 6 se revisa en febrero porque el día 12 Gitea pasa a gitea01.

#### Procedimiento de cambios

Quién puede pedir una regla, qué tiene que dar, quién la revisa y dónde se registra. Un procedimiento mínimo, el que se pide en la práctica:

1. Quien necesita la regla abre una petición con origen, destino, puerto, protocolo, motivo y fecha de caducidad si es temporal.
2. Sistemas comprueba que la regla respeta el modelo (no salta capas, usa aliases, no abre hacia MGMT sin un motivo escrito) y propone alternativa si no.
3. Se aplica en dev, se ejecuta la fila correspondiente de la matriz de pruebas, y se pasa a pre y pro con el mismo cambio.
4. Se añade la fila a la matriz de reglas con la referencia de la petición.
5. Las reglas temporales llevan en la descripción `TEMPORAL` con su fecha de alta y de baja, y su fila en la matriz mientras existen. En el laboratorio cada hoja cierra la suya en el mismo paso.

### A3.3 Aplicación y datos (sesión 16)

<span class="et et-obj">Objetivo</span> app01 y mon01 en la VPC, la base del servicio en db01 sobre su propio disco montado en `/data`, y la cadena Internet → proxy → app01 → db01 funcionando con las reglas mínimas; un intento del proxy contra la base de datos muere en el firewall y queda en el log.

<span class="et et-pre">Antes de empezar</span>

- La A3.2 terminada: aliases, port forward, nginx con certificado en web01.
- En db01, los paquetes `postgresql`, `prometheus-postgres-exporter`, `nmap` y `netcat-openbsd` de la preparación de la A3.1. Si falta alguno, ábrele una fila temporal en la pestaña INT como en el paso 4 de la A3.2 y ciérrala en cuanto termine el `apt`.
- En OPNsense, las filas 11 a 13 que Mantenimiento dejó puestas ayer en su A3.1: con ellas el cortafuegos deja pasar el scrape de mon01 y los logs de app01 desde el momento del traslado.
- El disco de db01 preparado y app01 y mon01 trasladadas a la VPC, con el bloque que sigue.
- Desde hoy ninguna máquina de servicio tiene IP del aula, así que se entra a ellas con salto por el puesto de administración: `ssh -J ops@<IP de aula de admin01> ops@10.10.2.10` para app01, y lo mismo con la IP de cada una. [El laboratorio](../laboratorio.md) trae un `~/.ssh/config` de ejemplo para no escribir el salto cada vez. Comprueba así que `ip -br a` da la 10.10.2.10 en app01 y la 10.10.0.20 en mon01.
- Explicado en clase: [Publicar un servicio](#publicar-un-servicio), [El proxy inverso](#el-proxy-inverso) y [Documentación operativa](#documentacion-operativa), con la matriz de reglas que empiezas hoy.

!!! truco "Preparación antes de la sesión: el disco de db01 y el traslado"
    Son órdenes que no dependen de nadie y que no enseñan nada de lo que toca hoy. La parte de db01 se puede
    hacer cualquier día desde el 20 de noviembre; la de app01 y mon01, solo después de la clase de
    Mantenimiento del 26, que todavía usa las dos VM en el bridge del aula. Si no llegas, empieza la sesión
    por aquí y sin explorar: son unos veinte minutos.

    **El disco de datos de db01.** Los datos de la base no se dejan en la raíz del sistema: van en su propio
    sistema de ficheros, montado en `/data`. Así se puede medir cuánto le queda a la base sin que se mezcle con
    los logs del sistema, y un disco lleno se queda en un servicio parado en vez de en una máquina que no
    arranca. Es también el punto de montaje que vigilan los indicadores de capacidad de la
    [UT4 de Mantenimiento](https://victor-educ.github.io/apuntes-5169/ut/ut4-kpi-pruebas/), el 17 de
    diciembre. El disco se añade en caliente desde el nodo (`qm set 130 --scsi1 local-lvm:5`, 5 GB). En db01 se
    formatea sin partición, porque un disco virtual crece con `qm resize` más `resize2fs`, y se monta por su
    etiqueta y no por `/dev/sdb`, que puede cambiar de orden entre arranques. Después se le lleva el clúster de
    PostgreSQL, que ahora está recién instalado y vacío:

    ```bash
    lsblk                                            # en db01: sdb, 5G, sin particiones
    sudo mkfs.ext4 -L datos /dev/sdb && sudo mkdir -p /data
    echo 'LABEL=datos /data ext4 defaults 0 2' | sudo tee -a /etc/fstab
    sudo mount -a && df -h /data                     # unos 4,6 G disponibles
    sudo pg_dropcluster --stop 17 main
    sudo pg_createcluster -d /data/postgresql/17/main --start 17 main
    sudo -u postgres psql -c 'show data_directory'   # /data/postgresql/17/main
    ```

    `pg_dropcluster` borra lo que haya dentro. Recién instalado el paquete no hay nada que perder, y por eso se
    hace ahora y no en enero; si ya habías creado algo probando, sácalo antes con `pg_dumpall > /tmp/antes.sql`.

    **El traslado de app01 y mon01.** Antes de moverla, mientras app01 todavía sale a Internet, descarga lo que
    va a necesitar detrás del cortafuegos. Después, en el nodo, el traslado. **La MAC se conserva**, porque es
    la clave de la reserva que el cortafuegos tiene para cada una desde la A3.1: si el `qm set` no la lleva,
    Proxmox genera otra, la VM cae en el rango dinámico `.100` a `.199` y ni el alias `srv_app` ni Prometheus
    la encuentran.

    ```bash
    ssh ops@<IP de aula de app01> 'docker pull traefik/whoami && sudo apt-get install -y netcat-openbsd'   # desde tu puesto
    qm config 120 | grep net0          # en el nodo: net0: virtio=BC:24:11:..:..:..,bridge=vmbr0
    qm config 103 | grep net0
    qm shutdown 120 && qm shutdown 103
    qm set 120 --net0 virtio=<MAC de app01>,bridge=devback --ipconfig0 ip=dhcp
    qm set 103 --net0 virtio=<MAC de mon01>,bridge=devmgmt --ipconfig0 ip=dhcp
    qm start 120 && qm start 103
    ```

    Borra también del `/etc/hosts` de tu puesto y del de mon01 las líneas con las IP del aula de app01 y de mon01 (`sudo sed -i '/<IP de aula de app01>/d; /<IP de aula de mon01>/d' /etc/hosts`; en mon01, entrando ya con salto por el puesto de administración): desde hoy esos nombres los resuelve el cortafuegos. La de app01 se borra en el paso 3.

    Desde ese momento la monitorización de Mantenimiento atraviesa el cortafuegos por las filas 11 a 13. Hasta
    el 1 de diciembre los targets de app01 y el de PostgreSQL estarán en DOWN, y es lo esperado: Prometheus
    los sigue buscando donde estaban, y la [A3.2 de Mantenimiento](https://victor-educ.github.io/apuntes-5169/ut/ut3-seguridad-monitorizacion/#a32-red-firewall-y-tls-sesion-17)
    los cambia ese día a las de la VPC.

<span class="et et-pas">Pasos</span>

1. La base del servicio en db01, sobre el `/data` que dejaste preparado. Primero ábrela a la red, solo para la subred de aplicación, y crea la base del servicio. Las dos primeras órdenes dejan `listen_addresses = '*'` en `postgresql.conf` y añaden la línea de acceso al final de `pg_hba.conf`; la contraseña del usuario `app` es la que ya usa el servicio en su `.env`:

    ```bash
    cd /etc/postgresql/17/main
    sudo sed -i "s/^#listen_addresses = 'localhost'/listen_addresses = '*'/" postgresql.conf
    echo 'host    servicio    app    10.10.2.0/24    scram-sha-256' | sudo tee -a pg_hba.conf
    sudo systemctl restart postgresql
    sudo -u postgres psql -c "CREATE USER app WITH PASSWORD '<la del .env del servicio>'"
    sudo -u postgres psql -c "CREATE DATABASE servicio OWNER app"
    ss -ltn | grep 5432                      # 0.0.0.0:5432, no 127.0.0.1:5432
    ```

    Después deja postgres_exporter leyendo la base con un usuario propio, `monitor`, que solo tiene el rol `pg_monitor` (estadísticas, ningún dato del servicio):

    ```bash
    sudo -u postgres psql -c "CREATE USER monitor WITH PASSWORD 'cambiame'" -c "GRANT pg_monitor TO monitor"
    echo "DATA_SOURCE_NAME='postgresql://monitor:cambiame@127.0.0.1:5432/postgres?sslmode=disable'" \
      | sudo tee -a /etc/default/prometheus-postgres-exporter
    sudo systemctl restart prometheus-postgres-exporter
    curl -s localhost:9187/metrics | grep '^pg_up'     # pg_up 1
    ```

    !!! otra "Lo que esto desbloquea en Mantenimiento"
        Dos de los nueve indicadores de la A4.2 (`db:disk_avail:ratio` y `db:disk_full:predict30d`) y los
        runbooks de `PgDown` y `DiskWillFillIn7d` miden este `/data`, y el indicador de conexiones sale de este
        postgres_exporter. Desde hoy PostgreSQL de dev se maneja con `systemctl` en db01: ya no es el
        contenedor `db` de app01.

2. Reglas entre capas, solo dos, y la que deja a app01 hablar con Gitea, en las pestañas de entrada:

    | Pestaña | Acción | Origen | Destino | Puerto | Log | Descripción |
    |----|----|----|----|----|----|----|
    | DMZEXT | Pass | srv_web | srv_app | p_app | no | 3 El proxy reenvía a la API |
    | DMZINT | Pass | srv_app | srv_db | 5432 | sí | 4 La API consulta PostgreSQL |
    | DMZINT | Pass | srv_app | srv_gitea | 3001 | no | 6 app01 trae y sube el repositorio servicio |

    Antes, en Firewall → Aliases, añade el 8090 al alias `p_app`, que ya tenía el 8080 (la regla 3 sigue siendo una sola y cubre la API y el contenedor de pruebas), y crea `srv_gitea`, de tipo Host, con la 10.10.0.20 de mon01, donde vive Gitea hasta el 12 de febrero. Nada más. Apply.

3. El servicio de app01, contra db01. Primero el contenedor de pruebas: `whoami` devuelve las cabeceras que recibe, que es lo que interesa ver hoy, y se publica en el **8090** porque el 8080 es de la API y el 8081 de cAdvisor:

    ```bash
    docker run -d --name whoami --restart unless-stopped -p 8090:80 traefik/whoami
    ```

    Después, el servicio del curso deja de llevar su propia base y su propio proxy: la base es la de db01 y el proxy, el nginx de web01. En `/opt/servicio/.env` pon `DB_HOST=10.10.3.10`, y en `/opt/servicio/compose.yml` borra los servicios `db`, `nginx` y `postgres_exporter` y el `depends_on` de `app` que apuntaba a `db`. El servicio `app` tiene que seguir publicando el 8080 (`ports: ["8080:8080"]`). Los datos de prueba de octubre y noviembre no se trasladan: son de prueba, y la API crea el esquema vacío al arrancar.

    ```bash
    docker compose -f /opt/servicio/compose.yml up -d --remove-orphans
    docker compose -f /opt/servicio/compose.yml ps        # solo app
    curl -s localhost:8080/health && curl -s localhost:8090 | head -3
    nc -zv -w 3 10.10.3.10 5432                          # succeeded: la regla 4 deja pasar a la API
    sudo sed -i '/gitea.lab/d' /etc/hosts               # desde hoy ese nombre lo resuelve el cortafuegos
    cd /opt/servicio && git commit -am "La base pasa a db01 y el proxy a web01" && git push
    ```

    La línea de `gitea.lab` que se borra es la que la A2.6 de Mantenimiento puso en el `/etc/hosts` de app01, con la IP del aula de mon01. El `git push` sale por la regla 6: si se queda colgado, falta esa regla.

4. Convierte nginx en proxy inverso. En web01, sustituye el `root /var/www/html;` del bloque 443 por las cuatro líneas `proxy_set_header` y los dos `location` de [El proxy inverso](#el-proxy-inverso), que es el fichero tal como tiene que quedar: `/` va a la API del 8080 y `/cabeceras/` a whoami en el 8090. `nginx -t` y `systemctl reload nginx`.
5. Desde el aula, recorre la cadena entera:

    ```bash
    curl https://api.dev.lab/items         # la API contesta con datos de db01: [] el primer día
    curl https://api.dev.lab/cabeceras/    # whoami, con X-Forwarded-For y X-Forwarded-Proto
    ```

6. La conexión con la base que no debe funcionar, desde web01 (la que sí, desde app01, ya salió en el paso 3): `nc -zv -w 3 10.10.3.10 5432` termina por timeout. En Live View, filtra por interfaz DMZEXT y destino 10.10.3.10 y localiza la denegación.
7. Empieza la matriz de reglas. Copia a `matriz-reglas.md` la tabla de [Matriz de reglas](#matriz-de-reglas), que trae ya las filas del firewall tal como queda hoy, y añádele las filas 11 a 13 que Mantenimiento dejó ayer, con la justificación de su tabla de puertos. Después repásala contra OPNsense: cada regla lleva su número al principio de la descripción, y cualquier regla temporal que siga abierta tiene su fila, con su fecha de baja.

<span class="et et-com">Comprobación</span>

- Desde el aula, `curl https://api.dev.lab/items` devuelve la respuesta de la API y `/cabeceras/` la de whoami, con tu IP en `X-Forwarded-For`.
- En app01, `docker compose -f /opt/servicio/compose.yml ps` solo muestra `app`. app01 y mon01 tienen la IP de su reserva, señal de que el traslado conservó la MAC.
- Desde web01, el nc al 5432 termina por timeout (no "refused") y la línea está en el log en la interfaz DMZEXT.
- En db01, `df -h /data` muestra el disco de 5 GB, `show data_directory` devuelve `/data/postgresql/17/main` y `curl -s localhost:9187/metrics` da `pg_up 1`.

<span class="et et-ent">Entrega</span> En `ut3/`, `matriz-reglas.md` con la matriz justificada (las reglas actuales más la denegación por defecto), la salida de los dos `curl` del paso 5 y la del `nc` del paso 6, encabezadas con `date; hostname`, y la captura de su línea del log.

<span class="et et-ext">Si te sobra tiempo</span> Pon en web01, dentro de `location /cabeceras/`, `proxy_set_header X-Forwarded-For "1.2.3.4";` y observa que whoami se lo cree: por eso la aplicación solo debe confiar en la cabecera si viene del proxy.

## Sesión 17 · Separación de clientes

<p class="ut-meta" markdown>2 de diciembre · Teoría y práctica · <span class="dur" tabindex="0" aria-label="Separación de clientes · 15 min&#10;A3.4 Dos clientes · 95 min" data-dur="Separación de clientes · 15 min&#10;A3.4 Dos clientes · 95 min">:material-school:<i class="dur-barra" style="--teoria:14%"></i>:material-flask:</span></p>

Dos clientes en VLAN distintas llegan los dos al proxy por 443 y no se alcanzan entre sí ni llegan a ninguna otra zona. La explicación de hoy repasa las opciones de aislamiento multi-tenant y por qué se elige una VLAN por cliente; el apartado sobre VLAN en Proxmox y en OPNsense es lo que hace falta para los pasos 1 y 2 de la hoja.

### Separación de clientes

Hasta aquí la red tiene un solo dueño. Este apartado añade dos clientes que pagan por el mismo servicio y no pueden verse entre sí, con la menor infraestructura nueva posible: dos redes etiquetadas, dos pestañas de reglas y el mismo proxy para ambos. Es lo que pide el criterio de evaluación.

Cuando la misma infraestructura sirve a varios clientes (multi-tenant) hay que garantizar que uno no ve ni afecta al otro. Las opciones, de menos a más aislamiento:

1. **Separación lógica en la aplicación**: un campo `cliente_id` en cada tabla y un `WHERE` en cada consulta. Barata; un fallo de código lo expone todo, y los ha habido en empresas grandes.
2. **VLAN o VNet por cliente** con reglas de firewall que solo permiten tráfico cliente → servicios compartidos. Es lo habitual en proveedores medianos y lo que se hace en el módulo.
3. **VPC completa por cliente**, con sus propias zonas y su propio firewall. Máximo aislamiento a nivel de red, más coste y más cosas que mantener. Es lo que dan AWS o Azure por defecto (UT4).
4. **Hardware dedicado**: hosts de Proxmox separados por cliente. Solo lo justifica un contrato que lo exija.

En la práctica del módulo se usa la opción 2: dos clientes en VLAN distintas que comparten el proxy y el firewall pero no se alcanzan.

#### VLAN en Proxmox y en OPNsense

En Proxmox, un bridge marcado como **VLAN aware** deja pasar tramas etiquetadas 802.1Q (el estándar de VLAN: una etiqueta numérica en cada trama Ethernet); a cada VM se le asigna su etiqueta en la configuración de la NIC (`tag=101`), y el bridge la pone y la quita de forma transparente, así que la VM no sabe nada de VLAN. Con el SDN de la UT2, una VNet de tipo VLAN sobre una zona VLAN hace lo mismo con más orden.

El firewall necesita ver las dos VLAN por una sola interfaz física (trunk): en Proxmox, su NIC en ese bridge va **sin** tag, y en OPNsense se crean dos interfaces VLAN (Interfaces → Other Types → VLAN) sobre el padre `vtnet5`, con tags 101 y 102, y se les asignan las IP 10.10.101.1/24 y 10.10.102.1/24. Cada VLAN es una interfaz más a efectos de reglas, con su propia pestaña, y por defecto nada pasa entre ellas porque la denegación implícita se aplica igual.

Las reglas para cada cliente son dos líneas, en la pestaña de su VLAN:

| Interfaz | Acción | Origen | Destino | Puerto | Log | Descripción |
|----|----|----|----|----|----|----|
| CLI_A | Pass | net_cli_a | srv_web | 443 | no | Cliente A al proxy compartido |
| CLI_A | Block | net_cli_a | any | any | sí | Cliente A: resto denegado |
| CLI_B | Pass | net_cli_b | srv_web | 443 | no | Cliente B al proxy compartido |
| CLI_B | Block | net_cli_b | any | any | sí | Cliente B: resto denegado |

La regla explícita de Block al final de cada pestaña es redundante con la denegación implícita, pero deja en el log una descripción legible y muestra la intención a quien lea la matriz sin conocer OPNsense. Con el proxy compartido hay un detalle más: si el cliente A hace una petición a api.dev.lab, el proxy la reenvía a app01 desde su propia IP, así que la aplicación tiene que distinguir clientes por otro medio (nombre de host, cabecera, autenticación), no por la IP de origen. El aislamiento de red garantiza que A no llega a la red de B; el aislamiento de datos sigue siendo responsabilidad de la aplicación.

### A3.4 Dos clientes (sesión 17)

<span class="et et-obj">Objetivo</span> Dos VM de cliente en VLAN distintas llegan las dos al proxy por 443 y no se alcanzan entre sí ni llegan a ninguna otra zona, con la denegación registrada en el log.

<span class="et et-pre">Antes de empezar</span>

- La A3.3 funcionando: `curl https://api.dev.lab/cabeceras/` devuelve whoami.
- `vmbr1`, el bridge interno de la UT1, que es VLAN aware desde la A1.5: la 10.10.10.1 que tiene el host va sin etiqueta y no interfiere con las VLAN 101 y 102. En él, una sexta NIC del firewall sin tag (será `vtnet5`; apaga y enciende la VM 109 para que FreeBSD la vea). Si la añadiste en el «Si te sobra tiempo» de la A3.1, ya la tienes.
- Explicado en clase: [Separación de clientes](#separacion-de-clientes) y [VLAN en Proxmox y en OPNsense](#vlan-en-proxmox-y-en-opnsense).

<span class="et et-pas">Pasos</span>

1. Crea los dos clientes, `cli-a` (180) y `cli-b` (181), del rango de pruebas de dev, con los ID que les da la tabla de VM de prueba del [laboratorio](../laboratorio.md#maquinas-ids-de-vm-y-direcciones). Nacen en `vmbr0`, como cualquier clon de la plantilla, y ahí se quedan el rato justo para instalar lo que van a usar, porque en su VLAN no tendrán salida a Internet:

    ```bash
    qm clone 9000 180 --name cli-a && qm set 180 --memory 512
    qm clone 9000 181 --name cli-b && qm set 181 --memory 512
    qm start 180 && qm start 181
    ```

    En cada uno (su IP del aula aparece en el resumen de la VM), `sudo apt install -y nmap netcat-openbsd curl`. Después, desde el nodo, apágalos y pásalos a `vmbr1` con su VLAN y su IP fija. Las VM no saben nada de VLAN: el bridge etiqueta por ellas.

    ```bash
    qm shutdown 180 && qm shutdown 181
    qm set 180 --net0 virtio,bridge=vmbr1,tag=101 --ipconfig0 ip=10.10.101.10/24,gw=10.10.101.1
    qm set 181 --net0 virtio,bridge=vmbr1,tag=102 --ipconfig0 ip=10.10.102.10/24,gw=10.10.102.1
    qm start 180 && qm start 181
    ```

2. En OPNsense, Interfaces → Other Types → VLAN: VLAN 101 y 102 sobre `vtnet5`. En Assignments añade las dos, actívalas como CLI_A y CLI_B con IPv4 estática 10.10.101.1/24 y 10.10.102.1/24, sin gateway. Añádelas al grupo `ZONAS` (Firewall → Groups) para que tengan la regla 0.
3. Entra en cada cliente desde el puesto de administración (`ssh ops@10.10.101.10`, que la regla 5 de gestión ya permite) y comprueba que hace ping a su gateway.
4. Aliases nuevos: `net_cli_a` = 10.10.101.0/24 y `net_cli_b` = 10.10.102.0/24.
5. Reglas, dos por pestaña y en este orden:

    | Pestaña | Acción | Origen | Destino | Puerto | Log | Descripción |
    |----|----|----|----|----|----|----|
    | CLI_A | Pass | net_cli_a | srv_web | 443 | no | 7 Cliente A al proxy compartido |
    | CLI_A | Block | net_cli_a | any | any | sí | 8 Cliente A: resto denegado |
    | CLI_B | Pass | net_cli_b | srv_web | 443 | no | 9 Cliente B al proxy compartido |
    | CLI_B | Block | net_cli_b | any | any | sí | 10 Cliente B: resto denegado |

    Apply. En el `/etc/hosts` de cada cliente apunta `api.dev.lab` a 10.10.1.10, la IP del proxy, que es la que permiten las reglas 7 y 9.

6. Desde el cliente A intenta alcanzar al B y localiza en Live View (CLI_A) las líneas de la regla 8:

    ```bash
    ping -c 3 -W 2 10.10.102.10
    sudo nmap -sn 10.10.102.0/24
    sudo nmap -Pn -p 22,80,443 10.10.102.10
    ```

7. Lo que sí debe funcionar, desde el cliente A y desde el B: `curl -k https://api.dev.lab/cabeceras/`.
8. Añade las reglas 7 a 10 a `matriz-reglas.md`.

<span class="et et-com">Comprobación</span>

- `ping` desde A hacia B: 100 % de pérdida. `nmap -sn`: ningún host de B; solo aparece la 10.10.102.1, que es el propio cortafuegos y contesta por la regla 0. `nmap -Pn`: los tres puertos `filtered`.
- `curl` desde A y desde B devuelve whoami con `X-Forwarded-For` 10.10.101.10 o 10.10.102.10: la aplicación ve al cliente por la cabecera, no por la IP de origen, que es siempre la del proxy.
- En Live View, filtrando por CLI_A, cada intento contra B aparece con la descripción "8 Cliente A: resto denegado".
- `bridge vlan show` en el host de Proxmox muestra cada VM de cliente con su VLAN y el firewall con las dos.

<span class="et et-ent">Entrega</span> En `ut3/`: capturas de Firewall → Rules (CLI_A y CLI_B), la salida del paso 6 encabezada con `date; hostname` y su línea del log, y `matriz-reglas.md` actualizado.

<span class="et et-ext">Si te sobra tiempo</span> Quita el tag de la NIC del cliente B y repite el paso 6: es el error más frecuente de la unidad y conviene haberlo visto antes de que ocurra por accidente. Vuelve a ponerlo.

## Sesión 18 · Pruebas de seguridad

<p class="ut-meta" markdown>4 de diciembre · Práctica · <span class="dur" tabindex="0" aria-label="Pruebas de seguridad · 10 min&#10;A3.5 Pruebas y evidencias · 100 min" data-dur="Pruebas de seguridad · 10 min&#10;A3.5 Pruebas y evidencias · 100 min">:material-school:<i class="dur-barra" style="--teoria:9%"></i>:material-flask:</span></p>

Sesión casi entera de laboratorio: la matriz de pruebas completa ejecutada desde cada zona, con evidencias fechadas, dos denegaciones demostradas con tcpdump en las dos interfaces del firewall, un hallazgo tramitado con el procedimiento de cambios y el diagrama de zonas. nmap, nc y tcpdump se explicaron en la sesión 10; los diez minutos de hoy repasan lo justo y van a lo nuevo: por qué detrás de un cortafuegos lo que prueba el aislamiento es `filtered` y no `closed`, cómo se localiza con dos capturas dónde muere un paquete y cómo se rellena la matriz de pruebas.

### Pruebas de seguridad

!!! otra "Repaso"
    nmap, nc y tcpdump, con los estados `open`, `closed` y `filtered`, se explicaron a fondo en [Cómo se prueba una red](ut2-vpc.md#como-se-prueba-una-red), en la sesión 10. Aquí solo se repasa lo que hace falta para leer las pruebas con un cortafuegos delante.

No basta con configurar: hay que demostrar que el aislamiento funciona, y demostrarlo desde el punto de vista del atacante, es decir, desde fuera de cada zona. Las pruebas se hacen desde la máquina que representa cada origen (el equipo del aula para Internet, web01 para la DMZ externa, la VM del cliente A para el cliente A), no desde el firewall.

#### nmap

nmap envía paquetes y clasifica cada puerto según la respuesta. De la sesión 10 vienen `-sT` (escaneo connect, el que hace nmap sin root) y `-sn` (descubrir hosts sin escanear puertos). Detrás de un cortafuegos hacen falta dos opciones más:

- `-sS`: escaneo SYN (half-open). Envía un SYN y mira qué vuelve, sin completar la conexión, así que muchos servicios ni lo registran. Necesita root, y es el que usan las hojas de la unidad.
- `-Pn`: no hacer ping previo. Imprescindible cuando el firewall bloquea ICMP, porque si no nmap concluye que el host está caído y no escanea nada.

Con `-p-` se recorren los 65535 puertos TCP y `-T4` lo acelera en una red de laboratorio sin pérdidas; `-sU` escanea UDP (lento, porque un puerto abierto que no responde y uno filtrado se ven igual), y `-sV` y `-O` sacan la versión de cada servicio y el sistema operativo, que es la información que regala el proxy.

Interpretar los estados es lo que separa una prueba de un comando lanzado a ciegas:

| Estado nmap | Qué recibió nmap | Qué significa en este modelo |
|----|----|----|
| `open` | SYN-ACK | Hay un servicio escuchando y el firewall lo deja pasar. |
| `closed` | RST | El paquete **llegó** a la máquina y no hay nada escuchando en ese puerto. El firewall no lo está filtrando. |
| `filtered` | Nada, o ICMP unreachable de tipo administrativo | Algo en medio descarta el paquete. Es lo que debe salir en todo lo que no está publicado. |
| `open\|filtered` | Nada (solo en UDP y algunos escaneos) | nmap no puede distinguir; hay que probar con nc o con tcpdump en el destino. |

Si un escaneo desde Internet contra app01 devuelve `8080/tcp closed` en lugar de `filtered`, hay un problema aunque no haya servicio: el firewall dejó pasar el SYN hasta app01 y fue app01 quien respondió con RST. Alguna regla permite más de lo que parece, y ese es justo el tipo de hallazgo que se pide en la práctica.

#### nc, curl y tcpdump

`nc -zv 10.10.3.10 5432` (nc es netcat, un cliente TCP y UDP mínimo) prueba un puerto concreto y devuelve "succeeded" o "Connection refused" (llegó y no hay servicio, equivale a closed) o se queda esperando hasta el timeout (filtered). Con `-w 3` se limita la espera. `curl -kv https://api.dev.lab` comprueba el servicio publicado de extremo a extremo, y con `-v` se ve el handshake TLS, el certificado presentado y las cabeceras de respuesta; ahí está la cabecera `Server`, que dice si se está regalando la versión de nginx.

tcpdump es la herramienta para saber **dónde** muere un paquete. La técnica es capturar en dos sitios a la vez: en la interfaz de entrada del firewall y en la de salida.

```bash
# En el firewall (OPNsense tiene tcpdump; en el Debian también)
tcpdump -ni vtnet1 host 10.10.1.10 and port 8080     # entrada desde DMZEXT
tcpdump -ni vtnet2 host 10.10.1.10 and port 8080     # salida hacia DMZINT
```

Si el SYN aparece en la primera captura y no en la segunda, el firewall lo ha descartado y la línea correspondiente estará en el log. Si aparece en las dos y no hay respuesta, el problema está en app01 (servicio caído, escuchando solo en localhost, firewall local). Si ni siquiera aparece en la primera, el paquete no ha llegado al firewall: hay que revisar la ruta por defecto de la máquina origen. `-n` evita resoluciones DNS que ralentizan y confunden; `-w captura.pcap` guarda para abrir en Wireshark (el analizador gráfico de capturas), y `-c 20` corta tras 20 paquetes para no llenar el disco.

#### La matriz de pruebas

Una fila por par origen/destino relevante, con puerto, resultado esperado (permitido/bloqueado) y resultado real. Cualquier discrepancia es un hallazgo que hay que corregir y volver a probar; una matriz sin hallazgos en la primera pasada es sospechosa, no meritoria.

| Origen | Destino | Puerto | Esperado | Obtenido | Evidencia |
|----|----|----|----|----|----|
| Internet | proxy DMZ ext | 443 | Permitido | | captura curl |
| Internet | proxy DMZ ext | 22 | Bloqueado | | nmap (filtered) |
| Internet | app DMZ int | 8080 | Bloqueado | | nmap (filtered) |
| proxy | app | 8080 y 8090 | Permitido | | nc |
| proxy | db | 5432 | Bloqueado | | nc + log del firewall |
| proxy | Internet | 443 | Bloqueado | | curl con timeout |
| app | db | 5432 | Permitido | | nc / psql |
| app | proxy | 22 | Bloqueado | | nc |
| db | cualquiera | cualquiera | Bloqueado | | nmap desde db01 |
| cliente A | cliente B | cualquiera | Bloqueado | | nmap -sn + tcpdump |
| cliente A | proxy | 443 | Permitido | | curl |
| cliente A | app | 8080 | Bloqueado | | nc |
| Internet | consola del firewall | 443 | Bloqueado | | curl -v a IP_WAN: el certificado es el de web01 |

### A3.5 Pruebas y evidencias (sesión 18)

<span class="et et-obj">Objetivo</span> La matriz de pruebas completa, con evidencias fechadas desde las máquinas de origen, dos denegaciones demostradas con tcpdump en las dos interfaces del firewall, un hallazgo tramitado con el procedimiento de cambios y el diagrama de zonas del entorno.

<span class="et et-pre">Antes de empezar</span>

- Todo lo de las sesiones 14 a 17 funcionando, y en `ut3/` las evidencias que guardaste en el paso 8 de la A3.2 y en el 9, en los pasos 5 y 6 de la A3.3 y en el paso 6 de la A3.4: hoy se reutilizan.
- Las herramientas, donde las dejaron las hojas anteriores: nmap y curl en tu equipo del aula, nmap y netcat-openbsd en web01 y db01 (preparación de la A3.1), netcat-openbsd en app01 (preparación de la A3.3) y los tres en los clientes (A3.4). `tcpdump` se lanza en la consola del firewall.
- Explicado en clase: [Pruebas de seguridad](#pruebas-de-seguridad), con el repaso de nmap y lo nuevo de hoy: `filtered` frente a `closed` detrás del cortafuegos, las dos capturas y la matriz de pruebas.

<span class="et et-pas">Pasos</span>

1. Copia la tabla de [La matriz de pruebas](#la-matriz-de-pruebas) a `ut3/matriz-pruebas.md` añadiendo una columna Fecha. Mínimo 8 filas, con las de los clientes.
2. Rellena primero las filas que ya probaste, con la evidencia y la fecha de aquel día: Internet contra el proxy, el 22, el 8080 y la consola del cortafuegos (A3.2), proxy contra db (A3.3) y cliente A contra cliente B (A3.4). Ejecuta hoy las que falten, cada una desde su máquina de origen y nunca desde el firewall. Comandos de referencia:

    ```bash
    nc -zv -w 3 10.10.2.10 8080                          # proxy → app, desde web01
    curl -m 5 https://deb.debian.org                     # salida a Internet, desde web01
    nc -zv -w 3 10.10.3.10 5432                          # app → db, desde app01
    curl -k https://api.dev.lab/cabeceras/               # cliente → proxy, desde cli-a
    ```

    Encabeza cada salida con `date; hostname` y guárdala en `ut3/evidencias/` para que lleve fecha y origen.

3. Elige dos filas bloqueadas (por ejemplo, proxy → db:5432 y cliente A → cliente B:22). Para cada una, captura a la vez en la interfaz de entrada y en la de salida del firewall antes de lanzar el intento:

    ```bash
    # Terminal 1, interfaz por la que entra (DMZEXT)
    tcpdump -ni vtnet1 -c 10 host 10.10.3.10 and port 5432
    # Terminal 2, interfaz por la que saldría (INT)
    tcpdump -ni vtnet3 -c 10 host 10.10.3.10 and port 5432
    ```

    Lanza el `nc` desde web01. El SYN debe verse en la primera captura y no en la segunda. Guarda las dos salidas como evidencia. Si no tienes dos consolas en el firewall, Interfaces → Diagnostics → Packet Capture hace lo mismo con las dos interfaces marcadas a la vez.

4. Para esas dos filas, localiza en Live View la línea de la denegación con su etiqueta de regla y anótala en la columna Evidencia.
5. Copia a `ut3/procedimiento.md` los cinco pasos del [Procedimiento de cambios](#procedimiento-de-cambios), adaptados a tu laboratorio: quién pide, quién aprueba y dónde se registra. Si alguna fila da un resultado distinto del esperado (un `closed` donde debía haber `filtered`, un `succeeded` en una fila bloqueada), es un hallazgo, y su corrección se tramita con ese procedimiento: en `ut3/hallazgos.md`, la petición (origen, destino, puerto, motivo y fecha), qué regla lo causaba y cómo lo corregiste; en `matriz-reglas.md`, la fila cambiada con la referencia de la petición; y al final, la fila de pruebas repetida. Si no ha habido ninguno, prueba filas que no están en la tabla: gestión desde una VM de cliente o el 22 de web01 desde app01.
6. Comprueba en Firewall → Rules que no queda ninguna regla con `TEMPORAL` en la descripción. Si queda alguna, bórrala por el mismo procedimiento y anota la baja en `matriz-reglas.md`.
7. Dibuja el diagrama de zonas del entorno dev: parte del de [Mapa sobre la VPC de la UT2](#mapa-sobre-la-vpc-de-la-ut2) y añádele las máquinas de gestión y los dos clientes con su VLAN, con la subred y el `.1` de cada red. Vale en Mermaid o a mano y fotografiado.

<span class="et et-com">Comprobación</span>

- Cada fila de la matriz tiene "Obtenido", fecha y un fichero de evidencia en el repositorio.
- Ninguna fila bloqueada tiene `closed` ni `succeeded` tras la corrección.
- Las dos capturas de tcpdump muestran el SYN en la entrada y nada en la salida, y en el log está la línea que lo explica.
- `procedimiento.md` existe y, si hubo hallazgo, `hallazgos.md` y `matriz-reglas.md` citan la misma petición.

<span class="et et-ent">Entrega</span> En `ut3/`: `matriz-pruebas.md`, la carpeta `evidencias/`, `hallazgos.md`, `procedimiento.md` y el diagrama. Es el material del informe de la sesión 19.

## Sesión 19 · Práctica evaluable

<p class="ut-meta" markdown>9 de diciembre · Práctica evaluable · <span class="dur" tabindex="0" aria-label="Aclaración del enunciado · 10 min&#10;Trabajo en la práctica · 100 min" data-dur="Aclaración del enunciado · 10 min&#10;Trabajo en la práctica · 100 min">:material-school:<i class="dur-barra" style="--teoria:9%"></i>:material-flask:</span></p>

La sesión empieza con diez minutos de aclaración del enunciado y el resto es para montar el informe con lo que ya está en `ut3/`: la práctica no pide nada que no haya salido de una hoja de la unidad, y al lado de cada punto va de dónde sale.

Entrega un informe (máximo 6 páginas) sobre el entorno dev con los dos clientes:

1. Diagrama de zonas con los dos clientes, subredes, gateways y máquinas (A3.5, paso 7).
2. Matriz de reglas completa con la justificación de cada regla: `matriz-reglas.md`, que empieza en el paso 7 de la A3.3 y completan el paso 8 de la A3.4 y los pasos 5 y 6 de la A3.5.
3. Matriz de pruebas ejecutada con evidencias, mínimo 8 filas (A3.5, pasos 1 a 4).
4. Un hallazgo real y cómo lo corregiste (A3.5, paso 5). Si de verdad no ha habido ninguno, qué prueba adicional harías para buscarlo.
5. El procedimiento para solicitar una regla nueva: `procedimiento.md` (A3.5, paso 5).

Checklist antes de entregar:

- [ ] Ninguna regla usa IPs sueltas en lugar de aliases (las reglas de las A3.2 a A3.4 se escriben todas con aliases).
- [ ] Ningún escaneo desde Internet devuelve `closed` en puertos no publicados; todo lo no publicado es `filtered` (A3.2, paso 9).
- [ ] La consola del firewall solo responde desde MGMT (A3.1, paso 4).
- [ ] El certificado del proxy tiene SAN y lo firma la CA del curso (A3.2, pasos 3 y 8).
- [ ] Las evidencias llevan fecha y máquina de origen visibles, con `date; hostname` (A3.5, paso 2).

| Criterio (RA1 d) | De dónde sale | Peso |
|----|----|----|
| Capas de seguridad desplegadas según exposición (DMZ externa, DMZ interna y zona interna) | A3.1 a A3.3 y el diagrama de la A3.5 | 30 % |
| Pruebas de seguridad y aislamiento ejecutadas y documentadas | A3.5, pasos 1 a 4 | 30 % |
| Separación de clientes demostrada | A3.4, pasos 5 a 7 | 20 % |
| Matriz de reglas justificada y procedimiento | A3.3, paso 7; A3.4, paso 8; A3.5, pasos 5 y 6 | 20 % |

Cuando hayas entregado, retira lo que ya no hace falta. `router-dev` seguía apagada desde el 20 de noviembre por si había que deshacer el relevo, y los dos clientes solo servían para esta unidad. En el nodo, `qm stop 100 && qm destroy 100 --purge` y lo mismo con la 180 y la 181. Desde hoy el `.1` de dev es solo el cortafuegos.

!!! examen "Lo que viene después no es una unidad nueva"
    Esta entrega cierra la UT3 y con ella la primera evaluación. El 11 de diciembre hay examen: una prueba teórico-práctica en el laboratorio sobre la UT1, la UT2 y la UT3, que pesa el 60 % de la nota de la evaluación. Entra todo lo que se ha montado a mano hasta hoy: hipervisor y plantilla cloud-init, VPC con SDN y direccionamiento, DHCP y DNS propios, cortafuegos por zonas, publicación con proxy inverso y TLS, separación de clientes y pruebas de aislamiento. Repasa con las tres unidades y con las prácticas evaluables ya entregadas. La UT5, infraestructura como código, no empieza hasta el 16 de diciembre.

## Errores frecuentes en el laboratorio

**Las interfaces de OPNsense no corresponden a los bridges esperados.** Síntoma: se asigna 10.10.1.1 a DMZEXT y web01 no hace ping al gateway. Causa: `vtnet1` no está en `devfront`. Diagnóstico: en Interfaces → Assignments, comparar la MAC de cada vtnet con la que muestra Proxmox en el hardware de la VM. Se corrige reasignando, sin reinstalar.

**La regla existe, pero está en la interfaz equivocada.** La regla "permitir srv_web → srv_app:8080" está en la pestaña DMZINT porque el destino está ahí. Las reglas se evalúan a la entrada: va en DMZEXT. En el log aparece la denegación por defecto en la interfaz DMZEXT, que es la pista.

**Port forward sin regla de filtro.** El DNAT traduce, pero la interfaz WAN bloquea el paquete traducido. nmap desde el aula muestra 443 filtered. Solución: la regla asociada, o una regla manual en WAN con destino srv_web:443 (destino traducido, no IP WAN).

**Los cambios no se aplican.** Se ha guardado pero no se ha pulsado "Apply changes". O sí, pero la conexión que se está probando ya tenía estado y sigue funcionando (o sigue bloqueada) hasta que expira. Hay que borrar el estado en Diagnostics → States.

**El router Debian no reenvía nada aunque nftables lo permite.** `sysctl net.ipv4.ip_forward` devuelve 0. Sin eso, el kernel descarta lo que no es para él antes de llegar al hook forward.

**Todo pasa en el router Debian, incluso lo que debería bloquearse.** Hay otra herramienta manipulando netfilter: Docker instalado en la misma VM ha creado sus propias cadenas, o `iptables-legacy` tiene reglas de una prueba anterior. `nft list ruleset` muestra todas las tablas, incluidas las que no ha puesto la configuración del router. Un router no debe llevar Docker.

**db01 rechaza a app01 aunque el firewall lo permite.** `nc` dice "Connection refused": el paquete llega. PostgreSQL escucha solo en localhost (`listen_addresses` en postgresql.conf) o `pg_hba.conf` no incluye 10.10.2.0/24. El firewall no tiene la culpa; el estado closed de nmap ya lo decía.

**nmap dice que el host está caído y no escanea.** El firewall bloquea ICMP y nmap concluye que no hay nadie. `-Pn`.

**Las VM de los clientes A y B se ven entre sí.** Las dos NIC están en el bridge sin tag, o el bridge no es VLAN aware, o el tag se puso en el firewall y no en las VM. `bridge vlan show` en el host de Proxmox muestra qué puerto lleva qué VLAN.

**Certificado rechazado por el navegador aunque lo firma la CA propia.** Falta el SAN; desde 2017 Chrome y Firefox ignoran el CN. Hay que regenerarlo con `subjectAltName`.

**El log del firewall no muestra la denegación buscada.** "Log packets matched by the default deny rule" está desactivado, o la regla de Block creada no tiene log marcado. Hay que activarlo y repetir la prueba; el log no es retroactivo.

**Las VM se quedan sin IP y sin DNS a mitad de la sesión 14.** Se apagó `router-dev` antes de que OPNsense tuviera configurado el DHCP y el DNS de las cuatro zonas. El orden del paso 5 de la A3.1 no es un capricho: primero se prepara el firewall, después se retira el router. Mientras tanto, cada VM sigue teniendo su concesión de 12 horas, así que hay margen para volver a levantar `router-dev` y rehacer el relevo con calma.

**Dos máquinas con la misma `.1`.** Ocurre si se activan las interfaces internas del firewall con `router-dev` todavía en marcha, o si alguna subnet del SDN conserva el gateway que se le puso en la sesión 8. El síntoma es que el `ping` al `.1` responde unas veces sí y otras no, o que el ARP del `.1` cambia de MAC. Se comprueba con `ip neigh` en una VM de la zona y se arregla dejando un solo `.1`.

Los enlaces para ampliar y los apartados que van más allá de lo que se hace en clase están en [Para ampliar](../ampliacion.md#ut3-seguridad-por-capas-dmz-externa-dmz-interna-y-zona-interna).
