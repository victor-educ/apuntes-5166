# UT3 · Seguridad por capas: DMZ externa, DMZ interna y zona interna

<p class="ut-meta">12 h · Sesiones 14 a 19 · RA1 CE d</p>

La UT2 dejó una VPC por entorno (dev, pre, pro) con cuatro VNets, una por zona (gestión, front, back y data), y un router con una pata en cada una, con el enrutado entre ellas funcionando. Funcionaba demasiado bien: cualquier máquina de front podía hablar con cualquier puerto de back. En esta unidad ese router se sustituye por un cortafuegos, cada zona recibe su papel de seguridad y esa red abierta se convierte en una red por capas donde cada salto está justificado, permitido de forma explícita y registrado. Después hay que demostrar con nmap y tcpdump (un escáner de puertos y un capturador de tráfico) que el aislamiento es real, y separar dos clientes que comparten la misma infraestructura. Lo que se construye aquí no se tira: en la UT5 se describe como código con OpenTofu y Ansible, y en la UT6 el pipeline de Jenkins despliega contenedores dentro de estas zonas, respetando las reglas escritas ahora.

## Introducción

Esta unidad convierte la red plana de la UT2 en una red por capas con un cortafuegos en medio, y termina con un informe que demuestra, con escaneos y capturas, que el aislamiento es real. Antes de entrar en las sesiones, esto es lo que hay que saber hacer al terminar, las herramientas que aparecen y el plan de cada día.

### Qué tienes que saber hacer al terminar

El criterio de evaluación d del RA1 pide desplegar capas de seguridad según el nivel de exposición de cada servicio, probarlas y separar clientes. En concreto:

- Explicar el modelo de zonas (exterior, DMZ externa, DMZ interna, zona interna, gestión) y decidir en qué zona va cada componente de una aplicación.
- Instalar y configurar un cortafuegos con estado entre zonas (OPNsense en clase, o nftables sobre Debian) con política de denegación por defecto.
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
| nftables | El firewall del kernel Linux, con las reglas en un fichero de texto | La alternativa sin interfaz web, la que Ansible desplegará en la UT5 |
| NAT (port forward y outbound) | Reescribir la IP de destino o de origen de un paquete al cruzar el firewall | Publicar el proxy en la IP pública y dar salida a Internet solo a quien la necesite |
| Proxy inverso (nginx) | Un servidor web que recibe las peticiones de fuera y las reenvía al de dentro | Que Internet hable con web01 y nunca con la aplicación ni la base de datos |
| TLS, certificados y CA | TLS es el cifrado de HTTPS; el certificado identifica al servidor y la CA es quien lo firma y en quien confían los clientes | Cifrar lo publicado con una CA propia hecha con openssl, y saber cuándo toca Let's Encrypt |
| VLAN (802.1Q) | Una etiqueta numérica en cada trama Ethernet que separa redes sobre el mismo cable | Aislar a dos clientes que comparten firewall y proxy |
| nmap | Un escáner de puertos: pregunta a una máquina, puerto a puerto, si alguien responde | Comprobar desde cada zona qué se ve de verdad y distinguir `closed` de `filtered` |
| nc y curl | Un cliente TCP mínimo y un cliente HTTP de terminal | Probar un puerto concreto y el servicio publicado de extremo a extremo |
| tcpdump | Un grabador de tráfico: muestra los paquetes que pasan por una interfaz | Saber en qué interfaz muere un paquete |
| IDS/IPS y WAF | Filtros que miran el contenido de los paquetes o de las peticiones web, no solo los puertos | Solo se mencionan como capas adicionales; el apartado está en [Para ampliar](../ampliacion.md#idsips-y-waf-dos-capas-mas) |

Cómo está organizada la unidad: sigue las seis sesiones en el orden en que se dan, y cada sesión trae primero la teoría que se explica ese día (con el material de consulta que necesita la hoja) y después su hoja de práctica. En la sesión 14 se explica el modelo de zonas y el cortafuegos con estado, y se instala OPNsense con una interfaz por zona. En la 15 se aprenden las reglas, los aliases y el NAT, y se publica la primera web con certificado de una CA propia. En la 16 se completa la cadena proxy, aplicación y base de datos con las reglas mínimas entre capas, y en la 17 se añaden dos clientes en VLAN que comparten el proxy sin verse. La 18 ejecuta la matriz de pruebas con nmap, nc y tcpdump, y la 19 cierra el informe de la práctica evaluable. Al final quedan, como consulta, los errores frecuentes del laboratorio.

!!! otra "Dónde se usa esto en la otra asignatura"
    La [UT3 de Mantenimiento, seguridad de la monitorización](https://victor-educ.github.io/apuntes-5169/ut/ut3-seguridad-monitorizacion/) (26 nov a 10 dic) va en paralelo con esta (20 nov a 9 dic) y da por sabido lo que se explica aquí: nmap, tcpdump, nftables, la CA del curso y las reglas de OPNsense se aprenden en esta quincena y allí se aplican a los puertos de la monitorización.
    Hasta ahora app01 y mon01 vivían en el entorno provisional del bridge del aula (vmbr0); esta unidad es el momento de moverlas a la VPC dev, detrás del firewall de la sesión 14: app01 a devback con la 10.10.2.10 y mon01 a devmgmt con la 10.10.0.20. Ninguna de las dos lleva una segunda tarjeta de gestión: la monitorización llega a app01 y a db01 atravesando el cortafuegos, que es justo lo que se aprende a permitir aquí.
    La matriz de reglas de la sección de documentación es la que en la 5169 se amplía con los puertos de los exporters (9100, 8081, 9187) desde mon01 y el 3100 de Loki desde cada host: allí no se hace una matriz nueva, se añaden filas a esta.

### Plan de sesiones

Cada sesión de 110 minutos empieza con una explicación corta y sigue con laboratorio. La columna «Se explica» recoge los apartados de teoría que se desarrollan en clase, con su duración aproximada; la columna «Se practica», el trabajo de laboratorio de esa sesión. Las sesiones marcadas solo como práctica no traen teoría nueva.

| Sesión | Fecha | Tipo | Se explica | Se practica |
|---:|-------|------|------------|-------------|
| [14](#sesion-14-modelo-de-seguridad-por-capas) | 20 nov | Teoría y práctica | Defensa en profundidad, zonas y DMZ con uno y dos cortafuegos; cortafuegos con estado; qué es OPNsense (30 min). | Instalar OPNsense con cinco interfaces, una por VNet de dev, asignar .1 en cada zona, traspasarle el DHCP y el DNS de router-dev y acceder solo desde MGMT. |
| [15](#sesion-15-reglas-por-zona-y-publicacion-de-un-servicio) | 25 nov | Teoría y práctica | Orden de evaluación de reglas, aliases, port forward y outbound NAT (25 min). | Comprobar que sin reglas nada pasa; nginx en web01; port forward WAN:443 y regla; curl desde el aula. |
| [16](#sesion-16-dmz-interna-y-zona-interna) | 27 nov | Teoría y práctica | Patrón proxy inverso, aplicación, base de datos; terminación TLS y cabeceras (20 min). | app01 con API en 8080, db01 con PostgreSQL limitado a la subred back, reglas mínimas entre capas, nginx como proxy inverso; probar desde fuera. |
| [17](#sesion-17-separacion-de-clientes) | 2 dic | Teoría y práctica | Opciones de aislamiento multi-tenant y por qué se usa una VLAN por cliente (15 min). | VLAN 101 y 102 sobre bridge VLAN aware, reglas que solo permiten llegar al proxy, comprobar que A no alcanza a B. |
| [18](#sesion-18-pruebas-de-seguridad) | 4 dic | Práctica | Cómo leer open, closed y filtered en nmap (10 min). | Ejecutar la matriz de pruebas completa desde cada zona, capturar con tcpdump dos denegaciones y localizarlas en el log del firewall. |
| [19](#sesion-19-practica-evaluable) | 9 dic | Práctica evaluable | Aclaración del enunciado (10 min). | Cerrar el informe: diagrama, matriz de reglas justificada, matriz de pruebas, un hallazgo corregido y el procedimiento de reglas nuevas. |

## Sesión 14 · Modelo de seguridad por capas

<p class="ut-meta" markdown>20 de noviembre · Teoría y práctica · <span class="dur" tabindex="0" aria-label="Defensa en profundidad y zonas · 5 min&#10;DMZ con uno y con dos cortafuegos · 5 min&#10;Cortafuegos con estado · 10 min&#10;OPNsense · 10 min&#10;A3.1 Instalar el firewall · 80 min" data-dur="Defensa en profundidad y zonas · 5 min&#10;DMZ con uno y con dos cortafuegos · 5 min&#10;Cortafuegos con estado · 10 min&#10;OPNsense · 10 min&#10;A3.1 Instalar el firewall · 80 min">:material-school:<i class="dur-barra" style="--teoria:27%"></i>:material-flask:</span></p>

Al acabar la sesión hay un OPNsense con una pata en cada una de las cinco zonas, con la IP .1 en cada red y la consola web accesible solo desde gestión. Para la hoja hace falta entender el modelo de zonas y el mapa sobre la VPC de la UT2 (qué zona es cada subred ya creada), por qué basta un cortafuegos con estado y una regla por conexión, y la tabla de interfaces de la instalación de OPNsense. La alternativa con nftables no se explica: queda apuntada al final de la teoría, con el fichero de reglas en Para ampliar, para quien prefiera un router Debian.

### Defensa en profundidad y zonas

Ningún control de seguridad es perfecto. El proxy tendrá una vulnerabilidad algún día, alguien subirá una imagen de contenedor con una librería vieja, un administrador reutilizará una contraseña. La defensa en profundidad parte de asumir que cada control fallará y pone varios en serie, de modo que cada capa que atraviesa un atacante le cuesta trabajo, le lleva tiempo y deja rastro en un log que alguien (o algo) está mirando. La forma clásica de organizarlo en red son las zonas, separadas por un cortafuegos que solo deja pasar lo imprescindible entre una y la siguiente.

| Zona | Qué aloja | Quién puede entrar | Hacia dónde sale |
|----|----|----|----|
| Exterior (WAN / Internet) | Usuarios, atacantes | Nadie | DMZ externa |
| DMZ externa | Lo que debe verse desde fuera: proxy inverso, balanceador, web estática, concentrador VPN | Internet, en puertos concretos (80/443) | DMZ interna, en puertos concretos |
| DMZ interna | Aplicación / API, colas, caché | DMZ externa | Zona interna, en puertos concretos |
| Zona interna | Bases de datos, almacenamiento, backups | DMZ interna y administradores | Nada hacia fuera (o solo actualizaciones por proxy) |
| Gestión | Consola del firewall, SSH, Proxmox, monitorización | Administradores | Todas las zonas, solo en puertos de gestión |

Los principios que gobiernan las reglas son cuatro, y aparecen repetidos en cualquier auditoría:

- **Denegar por defecto**: todo lo que no está permitido expresamente se bloquea y se registra. La lista de reglas es una lista blanca.
- **Tráfico solo hacia dentro por saltos**: Internet nunca habla con la zona interna; la web nunca habla con la base de datos sin pasar por la aplicación. Cada zona solo inicia conexiones hacia la inmediatamente más profunda.
- **Mínima exposición**: un servicio en DMZ externa solo expone el puerto que necesita. La gestión (SSH, consola web, API de Proxmox) va por una red aparte que no es alcanzable desde ninguna zona de servicio.
- **Registro**: todo lo denegado, y todo lo permitido hacia zonas sensibles, queda en un log con marca de tiempo, regla que lo decidió, origen y destino.

#### Qué frena cada capa

Para que el modelo no se quede en una tabla bonita, conviene saber qué ataque concreto para cada zona. Un escaneo de puertos desde Internet contra la IP pública solo ve el 443 del proxy; los puertos 8080 de la aplicación y 5432 de PostgreSQL ni siquiera aparecen como cerrados, aparecen como filtrados, que es distinto y se explica al hablar de nmap. Si un atacante explota una vulnerabilidad del proxy y consigue ejecutar código en él, se encuentra en la DMZ externa: puede llegar al 8080 de app01 porque es lo que el proxy necesita, pero no puede abrir una sesión a la base de datos, ni hacer SSH a nada, ni salir a Internet a descargarse herramientas si la regla de salida de la DMZ externa está cerrada. Si además compromete la aplicación (inyección SQL, deserialización, dependencia vulnerable), llega a la base de datos, pero con el usuario de aplicación, que no puede hacer `COPY ... TO PROGRAM` (una orden de PostgreSQL que ejecuta programas en el servidor) ni leer otras bases. Para llegar a la zona de gestión no hay ningún camino permitido desde ninguna zona de servicio, así que tendría que atacar el propio cortafuegos. Cada uno de esos saltos deja intentos denegados en el log, que es justo lo que un sistema de detección busca.

La comparación con la red plana de la UT2 es inmediata: allí una vulnerabilidad en el proxy daba acceso directo a la base de datos y al hipervisor.

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

El cortafuegos es el gateway de todas las zonas, con la IP .1 en cada una, así que ningún paquete cruza de una subred a otra sin pasar por él. Es el papel que en la UT2 hacía `router-dev`: OPNsense hereda sus cuatro direcciones `.1` y también su DHCP y su DNS, y `router-dev` se apaga cuando el relevo está hecho.

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

En el laboratorio del curso se monta el modelo de un firewall con cinco interfaces. Quien quiera el de dos puede usar OPNsense como perimetral y un Debian con nftables como interno: fabricantes distintos, gratis y lo que se explica en las dos secciones siguientes.

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

Este apartado monta el cortafuegos del laboratorio: una VM con una pata en cada zona, la consola web solo accesible desde gestión, y las reglas, el NAT y los logs que hacen que el modelo de zonas exista de verdad. Más que los menús, que cambian con cada versión, importan tres ideas: las reglas se escriben con nombres (aliases), se evalúan en la interfaz por la que entra el paquete, y nada se aplica hasta pulsar "Apply changes".

OPNsense es una distribución de firewall basada en FreeBSD y en el filtro `pf`, con interfaz web, desarrollo abierto y versiones semestrales (la 26.1 y la 26.7 son las de este curso; la numeración es año.mes). Nació como bifurcación de pfSense en 2015 y las dos son funcionalmente muy parecidas: si en una empresa aparece pfSense, todo lo de esta sección aplica cambiando algún nombre de menú. En el curso se usa OPNsense porque la interfaz es más limpia, parchea más rápido y la edición comunitaria no tiene recortes respecto a la de pago.

<figure markdown="span">
  ![Panel principal de OPNsense](../img/opnsense-dashboard.png){ width="640" }
  <figcaption>Panel de OPNsense con el estado de interfaces, servicios y tráfico. Fuente: Hagennos, CC BY-SA 4.0, vía Wikimedia Commons.</figcaption>
</figure>

#### Instalación en Proxmox

Se instala como una VM normal: imagen `dvd` o `vga` de la 26.x desde opnsense.org, 2 vCPU, 1 GB de RAM y 20 GB de disco, que es lo que le reserva el presupuesto de memoria del laboratorio. Con la instalación base y sin plugins de inspección basta; si el instalador va justo, se le suben a 2 GB mientras dura y se vuelve a 1 GB al terminar. Lo que la distingue es el número de interfaces: una por zona, cinco en este caso, cada una conectada a su bridge o VNet de Proxmox. Conviene usar el modelo VirtIO (el dispositivo paravirtualizado de KVM, el más rápido en Proxmox) para las NIC y activar la opción de arranque en el orden correcto; FreeBSD nombra las interfaces VirtIO como `vtnet0`, `vtnet1`... en el orden en que Proxmox las presenta en el bus PCI, así que el orden en que se añaden a la VM importa. Conviene apuntar qué MAC corresponde a qué bridge antes de arrancar, porque en el asistente de consola hay que asignar cada `vtnetN` a su papel:

| Interfaz OPNsense | vtnet | Bridge / VNet Proxmox | IP |
|----|----|----|----|
| WAN | vtnet0 | vmbr0 (aula) | DHCP del aula o fija |
| DMZEXT | vtnet1 | devfront | 10.10.1.1/24 |
| DMZINT | vtnet2 | devback | 10.10.2.1/24 |
| INT | vtnet3 | devdata | 10.10.3.1/24 |
| MGMT | vtnet4 | devmgmt | 10.10.0.1/24 |

Tras la instalación, la interfaz web escucha en todas las interfaces con la regla "anti-lockout" (la que impide cerrarse el acceso a la propia consola) activa en LAN. Lo primero es mover la administración a MGMT y desactivar el acceso desde el resto (System → Settings → Administration, "Listen interfaces"). Si un error deja fuera, la consola de Proxmox de la VM tiene un menú de texto con la opción "Reset to factory defaults" y otra para reasignar interfaces; no hace falta reinstalar.

### Alternativa: nftables en una VM Linux

El mismo modelo de zonas se puede montar sin OPNsense: un router Debian 13 con cinco interfaces y **nftables**, el cortafuegos del kernel Linux, sucesor de iptables y el mismo motor que hay debajo del firewall de Proxmox y de Docker. Se pierde la interfaz web y sus comodidades (aliases con resolución de nombres, vista de estados en directo) y se gana un fichero de texto de unas cuarenta líneas que se versiona en git y que Ansible despliega en la UT5 sin nada por medio.

Se elige nftables cuando el cortafuegos tiene que quedar descrito en código desde el primer día, cuando no compensa mantener una VM más con su propio sistema operativo, o cuando quien lo administra ya trabaja en la línea de comandos. Se elige OPNsense cuando lo van a tocar varias personas, cuando hacen falta las herramientas de diagnóstico integradas o cuando interesa tener en la misma caja el proxy inverso, la VPN y la detección de intrusos. En el curso se usa OPNsense, así que esta alternativa no se explica en clase.

El fichero `/etc/nftables.conf` completo del laboratorio, el recorrido de un paquete por los puntos donde el kernel puede filtrar y el orden en que se evalúan las cadenas están en [nftables: el fichero de reglas completo](../ampliacion.md#nftables-el-fichero-de-reglas-completo). El paso 9 de la A3.1 lo usa quien quiera montar esta variante.

### A3.1 Instalar el firewall (sesión 14)

<span class="et et-obj">Objetivo</span> Un OPNsense con una pata en cada una de las cinco zonas, con la IP .1 en cada red, cuya consola web solo responde desde MGMT, y web01 y db01 usándolo como puerta de enlace.

<span class="et et-pre">Antes de empezar</span>

- La VPC dev de la UT2 completa: las cuatro VNets (`devmgmt`, `devfront`, `devback`, `devdata`), `router-dev` repartiendo IP y nombres, `web01` (10.10.1.10) en `devfront` y `db01` (10.10.3.10) en `devdata`. Las dos se crearon en la UT2; hoy no hay que crear ninguna. `app01` y `mon01` siguen en `vmbr0` mientras Mantenimiento trabaja con ellas: se trasladan a la VPC en la A3.3, el 27 de noviembre, y sus reservas por MAC ya están escritas en `dev.conf` desde la A2.3.
- Una VM en `devmgmt` con la 10.10.0.50: el puesto desde el que administrarás el firewall toda la unidad.
- La ISO `dvd` de OPNsense 26.x en el almacenamiento de Proxmox.
- Explicado en clase: [el modelo de zonas](#defensa-en-profundidad-y-zonas), [el mapa sobre la VPC](#mapa-sobre-la-vpc-de-la-ut2) y [qué es un cortafuegos con estado](#cortafuegos-con-estado). Para la instalación, la tabla de interfaces de [Instalación en Proxmox](#instalacion-en-proxmox).

<span class="et et-pas">Pasos</span>

1. Comprueba que las cuatro VNets de dev están creadas y aplicadas desde la UT2, porque el firewall va a tener una pata en cada una. En el nodo:

    ```bash
    ip -br link show type bridge     # devmgmt, devfront, devback y devdata, state UP
    ```

    Comprueba también, en Datacenter → SDN → VNets, que ninguna de las cuatro subnets conserva gateway ni rango DHCP: desde la A2.3 el `.1` y el DHCP los sirve `router-dev`, y hoy pasan al firewall. Si alguna los tuviera, bórralos y pulsa Apply antes de seguir.

2. Crea la VM del firewall (2 vCPU, 1 GB, 20 GB, la ISO) con cinco NIC VirtIO en este orden exacto, porque FreeBSD las numera por orden de bus PCI:

    | NIC en Proxmox | Bridge / VNet | Será | IP que le pondrás |
    |----|----|----|----|
    | net0 | vmbr0 | WAN (vtnet0) | DHCP del aula |
    | net1 | devfront | DMZEXT (vtnet1) | 10.10.1.1/24 |
    | net2 | devback | DMZINT (vtnet2) | 10.10.2.1/24 |
    | net3 | devdata | INT (vtnet3) | 10.10.3.1/24 |
    | net4 | devmgmt | MGMT (vtnet4) | 10.10.0.1/24 |

    `router-dev` sigue encendido mientras montas el firewall, y es el `.1` de las cuatro subredes. Dos máquinas no pueden tener la misma IP, así que hasta el paso 8 el firewall se configura con las cuatro interfaces internas **sin activar** y con una dirección provisional en MGMT. El relevo se hace de una vez en el paso 8, con todo preparado.

3. Antes de arrancar, apunta la MAC de cada NIC (pestaña Hardware de la VM); te hará falta si algo no cuadra en Interfaces → Assignments.
4. Arranca desde la ISO, entra como `installer` / `opnsense`, instala con las opciones por defecto, cambia la contraseña de root, retira la ISO y reinicia.
5. En la consola de la VM, opción 1 "Assign interfaces": WAN → vtnet0, LAN → vtnet4 (OPNsense llama LAN a la primera interfaz protegida; será MGMT). Opción 2 "Set interface IP address" para LAN: `10.10.0.2/24`, sin DHCP. Es una dirección provisional, del rango reservado `.2` a `.9`, porque el `.1` lo tiene todavía `router-dev`. WAN queda en DHCP.
6. Desde el puesto de gestión, entra en `https://10.10.0.2`. En Interfaces → Assignments añade vtnet1, vtnet2 y vtnet3; en cada una pon la descripción (DMZEXT, DMZINT, INT), IPv4 estática con el `.1/24` de su zona y sin gateway, pero **deja sin marcar "Enable interface"** hasta el paso 8. Renombra LAN a MGMT.
7. Mueve la administración a MGMT: System → Settings → Administration, en "Listen interfaces" deja solo MGMT. No desactives la regla anti-lockout hasta tener una regla propia en MGMT (sesión 15).
8. El relevo: OPNsense pasa a ser el `.1`, el DHCP y el DNS de las cuatro zonas, y `router-dev` se apaga. El orden importa. Todo se deja configurado en el firewall **antes** de tocar el router; si se apaga primero el router, las máquinas se quedan sin IP en cuanto caduque su concesión y sin resolver un solo nombre, y el laboratorio se para a mitad de sesión.

    1. Con las interfaces internas todavía apagadas, configura en OPNsense el reparto de direcciones: Services → Dnsmasq DHCP & DNS (o el servicio DHCP que traiga tu versión), activo en DMZEXT, DMZINT, INT y MGMT, con el rango `.100` a `.199` de cada red y el `.1` de cada zona como router y como servidor DNS. Copia las reservas por MAC de tu `dev.conf`: `web01` 10.10.1.10, `app01` 10.10.2.10, `db01` 10.10.3.10 y `mon01` 10.10.0.20. Las de `app01` y `mon01` quedan preparadas para el traslado de la A3.3, aunque hoy esas dos VM sigan en el bridge del aula.
    2. Configura el DNS: dominio `dev.lab`, y los nombres que servía dnsmasq, incluido `api.dev.lab` apuntando a 10.10.1.10. Guarda, sin aplicar todavía.
    3. Deja `router-dev` sin sus IP internas, desde la consola de Proxmox de esa VM:

        ```bash
        systemctl stop dnsmasq
        for i in ens19 ens20 ens21 ens22; do ip link set $i down; done
        ```

    4. Ahora sí, en OPNsense marca "Enable interface" en DMZEXT, DMZINT e INT, cambia la IP de MGMT de `10.10.0.2` a `10.10.0.1` y aplica. Perderás la sesión del navegador: vuelve a entrar en `https://10.10.0.1`. Arranca el servicio de DHCP y DNS.
    5. Comprueba que el relevo está hecho antes de apagar nada más: desde el puesto de gestión responden `ping 10.10.0.1`, `ping 10.10.1.1`, `ping 10.10.2.1` y `ping 10.10.3.1`; en `web01`, `dhclient -r ens18 && dhclient ens18` devuelve otra vez la 10.10.1.10 y `dig db01.dev.lab` sigue respondiendo 10.10.3.10.
    6. Apaga `router-dev` (`qm shutdown` desde el nodo) y anota en la memoria qué se ha traspasado. Las VM de servicio no cambian de gateway: siguen apuntando al `.1` de su zona, que ahora es el firewall; compruébalo con `ip route` en web01 y db01.

9. Alternativa nftables: una VM Debian 13 con las mismas cinco NIC, `net.ipv4.ip_forward=1` en `/etc/sysctl.d/99-router.conf`, las .1 en las interfaces y el fichero de reglas de [Para ampliar](../ampliacion.md#nftables-el-fichero-de-reglas-completo) cargado con `nft -f`.

<span class="et et-com">Comprobación</span>

- Desde el puesto de gestión, `ping 10.10.0.1` responde y la consola web abre.
- Desde web01, `ping 10.10.1.1` responde, pero `curl -k -m 3 https://10.10.1.1` falla por timeout: la consola no escucha en DMZEXT.
- En Interfaces → Assignments la MAC de cada vtnet coincide con la que apuntaste para cada bridge.
- `ip route` en web01 y db01 muestra `default via 10.10.X.1`.

<span class="et et-ent">Entrega</span> En la carpeta `ut3/` de tu repositorio, captura de Interfaces → Assignments y un esquema de zonas (texto o Mermaid) con las cinco redes, la IP del firewall en cada una y las máquinas.

<span class="et et-ext">Si te sobra tiempo</span> Añade ya la sexta NIC (bridge VLAN aware, sin tag) que necesitarás en la sesión 17.

## Sesión 15 · Reglas por zona y publicación de un servicio

<p class="ut-meta" markdown>25 de noviembre · Teoría y práctica · <span class="dur" tabindex="0" aria-label="Aliases · 5 min&#10;Reglas y orden de evaluación · 5 min&#10;NAT: port forward y outbound · 5 min&#10;Logs · 5 min&#10;Certificados · 5 min&#10;A3.2 Publicar la web · 85 min" data-dur="Aliases · 5 min&#10;Reglas y orden de evaluación · 5 min&#10;NAT: port forward y outbound · 5 min&#10;Logs · 5 min&#10;Certificados · 5 min&#10;A3.2 Publicar la web · 85 min">:material-school:<i class="dur-barra" style="--teoria:23%"></i>:material-flask:</span></p>

Hoy el firewall empieza a hacer su trabajo: se comprueba que sin reglas nada pasa, se crean los aliases, se publica nginx en web01 con un port forward en la WAN y se prueba con curl y nmap desde el aula. Los apartados que siguen son la parte de OPNsense que se explica en clase: aliases, orden de evaluación de las reglas, NAT y logs. El apartado de certificados no se explica, pero hace falta para crear la CA y el certificado del proxy en el paso 3 de la hoja.

### Aliases

Un alias es un nombre para un conjunto de IPs, redes, puertos o URLs. `srv_web` = 10.10.1.10, `net_dmzint` = 10.10.2.0/24, `p_app` = {8080, 8090}, `p_web` = {80, 443}. Las reglas se escriben con aliases, nunca con IPs sueltas, por dos razones: la regla se lee sola ("permitir net_dmzext a srv_app en p_app") y cuando app01 cambie de IP, o haya dos app, se cambia el alias y no diez reglas. Los aliases de tipo "Host" admiten nombres DNS que OPNsense resuelve periódicamente, y los de tipo "URL Table" descargan listas (por ejemplo, rangos de IP de un proveedor) y las actualizan solas. En Firewall → Aliases.

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
3. Reglas de grupos de interfaces.
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


**Outbound NAT** (SNAT, NAT de origen: cambia la IP de origen) permite que las zonas internas salgan a Internet con la IP del firewall. En modo automático OPNsense lo hace para todas las redes de sus interfaces. En el laboratorio del curso interesa restringirlo: la DMZ interna y la zona interna no deberían salir a Internet salvo para actualizaciones, y eso se resuelve mejor con un proxy de paquetes (apt-cacher-ng, una caché de paquetes Debian, o un mirror interno en MGMT) que con NAT abierto. Se pone en modo "Hybrid" y se crean solo las reglas de salida justificadas.

### Logs

Firewall → Log Files → Live View muestra en tiempo real cada paquete que coincide con una regla que tiene log activado, y todos los de la denegación por defecto. Cada línea trae interfaz, dirección, acción, origen, destino, protocolo y la etiqueta de la regla. Conviene filtrar por interfaz o por etiqueta; con 20 VM escaneándose, el log sin filtro es inservible. Para el histórico está Plain View, y para enviarlo fuera (lo normal en producción, y lo que se hace en la UT7) System → Settings → Logging / Targets permite mandar todo por syslog (el protocolo estándar de envío de logs) a un colector.

Conviene activar el log en todas las reglas de denegación y en las de permiso hacia INT. No en la regla de permiso de WAN:443, que generaría una línea por conexión web y solo serviría para llenar el disco; para eso están los logs de acceso del proxy.

### Certificados

!!! consulta "Material de consulta"
    Esto no se explica en clase: lo necesitas para la hoja de práctica de esta sesión.

El `curl -kv` de las actividades usa `-k` para saltarse la validación del certificado, y eso está bien para probar el primer día, pero no es la forma de trabajar. Hay dos escenarios:

**CA interna** (autoridad de certificación: quien firma los certificados y en quien confían los clientes) para el laboratorio y para todo lo que no ve Internet (paneles de administración, comunicación entre zonas). Con openssl se crea una CA y se firma un certificado para api.dev.lab en cinco comandos. Conviene fijarse en el SAN (Subject Alternative Name, el campo del certificado donde van los nombres y las IP para los que vale): sin él los navegadores rechazan el certificado aunque la firma sea correcta.

```bash
# CA raíz (la clave se guarda en MGMT, no en el proxy)
openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -nodes \
  -keyout ca.key -out ca.crt -days 3650 -subj "/CN=Lab 5166 CA"

# Clave y petición para el proxy
openssl req -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -nodes \
  -keyout app.key -out app.csr -subj "/CN=api.dev.lab"

# Firma con SAN (sin SAN los navegadores modernos lo rechazan)
printf "subjectAltName=DNS:api.dev.lab,IP:10.10.1.10\n" > san.ext
openssl x509 -req -in app.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out app.crt -days 365 -extfile san.ext
```

Después se instala `ca.crt` en los clientes (`/usr/local/share/ca-certificates/` y `update-ca-certificates` en Debian) y `curl` deja de necesitar `-k`. Para algo más serio que un laboratorio, **step-ca** de Smallstep es una CA completa con protocolo ACME (el protocolo con el que un servidor pide y renueva certificados sin intervención humana, el mismo que usa Let's Encrypt), de modo que los servidores internos renuevan sus certificados solos con el mismo cliente que usarían contra Let's Encrypt, y con certificados de vida corta (24 horas) que hacen innecesarias las listas de revocación.

**Let's Encrypt** en producción, para todo lo que tiene nombre público. Emite certificados de 90 días (y está pasando a 6 días para quien los quiera) gratis, validando el control del dominio: con `HTTP-01` publicando un fichero en `/.well-known/acme-challenge/` por el puerto 80 (por eso el port forward del 80 en el firewall aunque después se redirija a HTTPS), o con `DNS-01` creando un registro TXT (un registro DNS de texto libre), que es la única opción para wildcards y para servicios que no exponen el 80. Certbot, Caddy, Traefik y el plugin ACME de OPNsense renuevan solos. Conviene vigilar que la renovación funcione: un certificado caducado un domingo es la avería más tonta y más frecuente de un servicio publicado.

### A3.2 Publicar la web (sesión 15)

<span class="et et-obj">Objetivo</span> `https://IP_WAN` responde desde el aula con la web de web01, con un certificado firmado por tu CA, y un nmap desde el aula solo ve el 443 (y el 80).

<span class="et et-pre">Antes de empezar</span>

- El firewall de la A3.1 con las cinco interfaces y las tres VM apuntando a él.
- web01 con nginx instalable (proxy APT de MGMT o una regla temporal de salida).
- Explicado en clase: [Aliases](#aliases), [Reglas y orden de evaluación](#reglas-y-orden-de-evaluacion) y [NAT: port forward y outbound](#nat-port-forward-y-outbound). Para el certificado, [Certificados](#certificados).

<span class="et et-pas">Pasos</span>

1. Comprueba la política por defecto. Desde web01, `nc -zv -w 3 10.10.2.10 22` y `nc -zv -w 3 10.10.3.10 5432` deben terminar por timeout, no con "Connection refused". En Firewall → Log Files → Live View, filtra por DMZEXT y localiza las dos denegaciones (si no aparecen, activa el log de la regla por defecto en Firewall → Settings → Advanced y repite).

2. Crea los aliases en Firewall → Aliases y pulsa Apply: de tipo Host, `srv_web` 10.10.1.10, `srv_app` 10.10.2.10 y `srv_db` 10.10.3.10; de tipo Network, `net_dmzext` 10.10.1.0/24, `net_dmzint` 10.10.2.0/24, `net_int` 10.10.3.0/24 y `net_mgmt` 10.10.0.0/24; de tipo Port, `p_web` 80 y 443, `p_app` 8080 (en la A3.3 se le añade el 8090).

3. Crea la CA y el certificado del proxy. El nombre publicado es `api.dev.lab`, el que el dnsmasq del router creó en la sesión 9 apuntando a web01: los servicios de un entorno se nombran `<host o servicio>.<entorno>.lab`, y el dominio plano `.lab` queda para los de plataforma. Hazlo en el puesto de gestión, no en web01, para que la clave de la CA no viva en la DMZ:

    ```bash
    openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -nodes \
      -keyout ca.key -out ca.crt -days 3650 -subj "/CN=Lab 5166 CA"
    openssl req -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -nodes \
      -keyout app.key -out app.csr -subj "/CN=api.dev.lab"
    printf "subjectAltName=DNS:api.dev.lab,IP:10.10.1.10,IP:IP_WAN\n" > san.ext
    openssl x509 -req -in app.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
      -out app.crt -days 365 -extfile san.ext
    ```

    Sustituye `IP_WAN` por la IP del firewall en el aula (Interfaces → Overview). Copia `app.crt` y `app.key` a `/etc/ssl/` de web01 con `scp` (la regla de SSH la creas en el paso 5).

4. Instala nginx en web01 y crea `/etc/nginx/sites-available/api.dev.lab`, hoy sin proxy:

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
        ssl_certificate     /etc/ssl/app.crt;
        ssl_certificate_key /etc/ssl/app.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        root /var/www/html;
    }
    ```

    Enlázalo en `sites-enabled`, borra el enlace `default`, `nginx -t` y `systemctl reload nginx`.

5. Regla de gestión: en la pestaña MGMT, Pass, origen net_mgmt, destino any, puerto 22, log sí, descripción "5 Administración por SSH"; y otra Pass desde net_mgmt a "This Firewall" puerto 443 para no quedarte fuera de la consola.
6. Port forward: Firewall → NAT → Port Forward, interfaz WAN, TCP, destino "WAN address" puerto p_web, redirigir a srv_web puerto p_web, "Add associated filter rule", descripción "1 Publicación de api.dev.lab". Apply y comprueba en Firewall → Rules → WAN que la regla asociada tiene destino srv_web (traducido, no la IP WAN).
7. Desde tu equipo del aula, primera prueba sin validar el certificado: `curl -kv https://IP_WAN`.
8. Instala la CA en tu equipo (`ca.crt` en `/usr/local/share/ca-certificates/lab5166.crt` y `update-ca-certificates`) y repite sin `-k`, con el nombre para que el SAN coincida:

    ```bash
    echo "IP_WAN api.dev.lab" | sudo tee -a /etc/hosts
    curl -v https://api.dev.lab
    ```

9. Escanea la IP WAN desde el aula: `sudo nmap -sS -Pn -p 22,80,443,8080 IP_WAN`.

<span class="et et-com">Comprobación</span>

- El `curl -v` sin `-k` termina con `SSL certificate verify ok` y un 200 con la página por defecto de nginx; `curl -v http://api.dev.lab` devuelve un 301 a `https://api.dev.lab/`.
- El nmap muestra 443 y 80 `open`; 22 y 8080 `filtered`. Si alguno sale `closed`, revisa las reglas de WAN antes de seguir.
- En el log, con filtro por interfaz WAN, ves los SYN al 22 y al 8080 denegados por la regla por defecto.

<span class="et et-ent">Entrega</span> En `ut3/`: captura de Firewall → Rules (WAN y MGMT) y de NAT → Port Forward, la salida del `curl -v` sin `-k` y la del nmap. Guarda también `ca.crt` (nunca `ca.key`): lo necesitarás en la 5169.

<span class="et et-ext">Si te sobra tiempo</span> Mira en la salida del curl la cabecera `Server` y añade `server_tokens off;` en `/etc/nginx/nginx.conf` para dejar de regalar la versión.

## Sesión 16 · DMZ interna y zona interna

<p class="ut-meta" markdown>27 de noviembre · Teoría y práctica · <span class="dur" tabindex="0" aria-label="Publicar un servicio · 15 min&#10;Documentación operativa · 5 min&#10;A3.3 Aplicación y datos · 90 min" data-dur="Publicar un servicio · 15 min&#10;Documentación operativa · 5 min&#10;A3.3 Aplicación y datos · 90 min">:material-school:<i class="dur-barra" style="--teoria:18%"></i>:material-flask:</span></p>

Al terminar, la cadena Internet, proxy, aplicación y base de datos funciona con solo dos reglas entre capas, y un intento del proxy contra la base de datos muere en el firewall y queda en el log. En clase se explica el patrón de publicación y el proxy inverso con sus cabeceras; la matriz de reglas de la documentación operativa es consulta, pero hoy se empieza a rellenar en el paso 8 de la hoja.

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
- **Filtra rutas**. Se puede publicar `/api` y `/` y dejar `/admin` o `/metrics` solo accesibles desde MGMT, con un `location` y un `allow`/`deny` (directivas de nginx: una ruta y quién puede pedirla).
- **Pierde la IP del cliente**, salvo que se la pase a la aplicación. Como la segunda conexión sale desde 10.10.1.10, la aplicación vería siempre esa IP. Por eso el proxy añade la cabecera `X-Forwarded-For` con la IP original (y `X-Forwarded-Proto` con `https`, para que la aplicación genere enlaces correctos). La aplicación debe confiar en esas cabeceras **solo** si vienen del proxy; si acepta `X-Forwarded-For` de cualquiera, un cliente puede falsificar su IP. El RFC 7239 estandariza esto como cabecera `Forwarded`, pero en la práctica todo el mundo sigue usando las `X-Forwarded-*`.

Configuración mínima de nginx en web01 (fichero en `/etc/nginx/sites-available/api.dev.lab`, enlazado en `sites-enabled`). Son dos bloques `server`: el del puerto 80 solo redirige a HTTPS, y el del 443 termina TLS y reenvía a app01. Conviene fijarse en las cuatro cabeceras `proxy_set_header` y en el `location /metrics`, que es la ruta restringida a gestión:

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

    ssl_certificate     /etc/ssl/app.crt;
    ssl_certificate_key /etc/ssl/app.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://10.10.2.10:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /metrics {
        allow 10.10.0.0/24;
        deny all;
        proxy_pass http://10.10.2.10:8080;
    }
}
```

Con esto cargado (`nginx -t` valida, `systemctl reload nginx` aplica), `curl -kv https://api.dev.lab` desde el aula devuelve la respuesta de app01, y `/metrics` desde cualquier sitio que no sea MGMT devuelve un 403.

Las alternativas habituales en empresas son **Traefik** y **Caddy**. Traefik descubre los backends solo: se conecta al socket de Docker o a la API de Kubernetes y crea las rutas a partir de etiquetas de los contenedores, lo que lo hace el proxy natural para la UT6, donde el pipeline despliega contenedores y no compensa editar nginx a mano cada vez. Caddy destaca porque obtiene y renueva certificados de Let's Encrypt automáticamente sin configurar nada, y su fichero de configuración para lo mismo que arriba son cuatro líneas:

```text
api.dev.lab {
    reverse_proxy 10.10.2.10:8080
}
```

Para aprender, nginx es el mejor de los tres porque obliga a entender cada cabecera; para producción con contenedores, Traefik; y para un servicio pequeño sin pensar en certificados, Caddy.

### Documentación operativa

!!! consulta "Material de consulta"
    Esto no se explica en clase: lo necesitas para la hoja de práctica de esta sesión.

Lo que se entrega a operaciones cuando la red pasa a producción, y lo que pedirá cualquier auditoría, son cuatro documentos. El diagrama de zonas con subredes, gateways y máquinas. La matriz de pruebas ejecutada, con evidencias. Y dos más que merecen detalle.

#### Matriz de reglas

Cada regla del firewall con su justificación (qué servicio la necesita), quién la pidió, quién la aprobó y cuándo se revisa. Una regla sin justificación es una regla que hay que borrar. Ejemplo de filas:

| # | Interfaz | Origen | Destino | Puerto | Acción | Log | Justificación | Solicitó | Aprobó | Revisión |
|----|----|----|----|----|----|----|----|----|----|----|
| 1 | WAN | any | srv_web | 443 | Pass | no | Publicación de api.dev.lab | Desarrollo | Sistemas | 2027-03 |
| 2 | WAN | any | srv_web | 80 | Pass | no | Redirección a HTTPS y reto ACME | Desarrollo | Sistemas | 2027-03 |
| 3 | DMZEXT | srv_web | srv_app | p_app (8080, 8090) | Pass | no | El proxy reenvía a la API y al contenedor de pruebas de cabeceras | Desarrollo | Sistemas | 2027-03 |
| 4 | DMZINT | srv_app | srv_db | 5432 | Pass | sí | La API consulta PostgreSQL | Desarrollo | Sistemas | 2027-03 |
| 5 | MGMT | net_mgmt | any | 22 | Pass | sí | Administración por SSH | Sistemas | Sistemas | 2027-03 |
| 6 | * | any | any | any | Block | sí | Denegación por defecto | | | |

En las columnas «Solicitó» y «Aprobó» va el equipo responsable, no el nombre de una persona: los nombres cambian y el documento sobrevive a quien lo firma.

En OPNsense la descripción de cada regla debería llevar el número de fila de esta matriz; así el log y el documento se cruzan sin buscar.

#### Procedimiento de cambios

Quién puede pedir una regla, qué información tiene que dar, quién la revisa, dónde se registra y cómo se revierte. Un procedimiento mínimo, que es lo que se pide en la práctica:

1. Quien necesita la regla (normalmente desarrollo) abre una petición con origen, destino, puerto, protocolo, motivo y fecha de caducidad si es temporal.
2. Sistemas comprueba que la regla respeta el modelo (no salta capas, no abre hacia MGMT, usa aliases) y propone alternativa si no.
3. Se aplica en dev, se ejecuta la fila correspondiente de la matriz de pruebas, y se pasa a pre y pro con el mismo cambio (en la UT5 esto será un commit en el repositorio de infraestructura).
4. Se añade la fila a la matriz de reglas con la referencia de la petición.
5. Las reglas temporales tienen fecha; el primer lunes de cada mes se revisan las caducadas.

Lo que no puede pasar es que alguien entre un viernes a las 18:00, abra "cualquiera → cualquiera" para que funcione algo y se olvide. Sin procedimiento, todos los cortafuegos acaban así en dos años.

### A3.3 Aplicación y datos (sesión 16)

<span class="et et-obj">Objetivo</span> La cadena Internet → proxy → app01 → db01 funciona con las reglas mínimas, y un intento del proxy contra la base de datos muere en el firewall y queda en el log.

<span class="et et-pre">Antes de empezar</span>

- La A3.2 terminada: aliases, port forward, nginx con certificado en web01.
- app01 con Docker y db01 (10.10.3.10) con el paquete `postgresql`. Como no tienen salida a Internet, instala desde el proxy APT de MGMT o con una regla temporal de salida, apuntada y con fecha, que borrarás al terminar.
- `app01` llega hoy desde `vmbr0`, donde Mantenimiento la ha tenido desde octubre. Antes de abrir la hoja, trasládala a `devback` y lleva `mon01` a `devmgmt` para que Prometheus siga alcanzando sus exporters. Cada una tiene una sola tarjeta, la de su zona, y coge la IP de la reserva por MAC que ya está en el firewall:

    ```bash
    qm shutdown 120 && qm shutdown 103
    qm set 120 --net0 virtio,bridge=devback --ipconfig0 ip=dhcp
    qm set 103 --net0 virtio,bridge=devmgmt --ipconfig0 ip=dhcp
    qm start 120 && qm start 103
    ```

    Dentro de cada una, `ip -br a` tiene que dar la 10.10.2.10 en `app01` y la 10.10.0.20 en `mon01`, y `ip route` el `.1` de su zona. Desde ese momento la monitorización de la 5169 atraviesa el cortafuegos, que es lo que se permite en la A3.4.
- Explicado en clase: [Publicar un servicio](#publicar-un-servicio), [El proxy inverso](#el-proxy-inverso) y la matriz de [Matriz de reglas](#matriz-de-reglas) que rellenarás hoy.

<span class="et et-pas">Pasos</span>

1. Contenedor de pruebas en app01. `whoami` devuelve las cabeceras que recibe, que es lo que interesa ver hoy. Se publica en el **8090**, no en el 8080: ese puerto lo ocupa en app01 la API del curso, la que se publica como `api.dev.lab` y la que la 5169 instrumenta, y Docker fallaría con `port is already allocated`. El 8081 tampoco vale, porque en app01 lo usa cAdvisor.

    ```bash
    docker run -d --name whoami --restart unless-stopped -p 8090:80 traefik/whoami
    curl -s http://localhost:8090
    ```

2. PostgreSQL en db01, escuchando en la red y limitado a la subred de aplicación: en `/etc/postgresql/17/main/postgresql.conf`, `listen_addresses = '*'`; al final de `pg_hba.conf`, en la misma carpeta:

    ```text
    host    appdb    appuser    10.10.2.0/24    scram-sha-256
    ```

    Crea el usuario y la base, y reinicia:

    ```bash
    sudo -u postgres psql -c "CREATE USER appuser WITH PASSWORD 'cambiame';"
    sudo -u postgres psql -c "CREATE DATABASE appdb OWNER appuser;"
    systemctl restart postgresql
    ss -ltnp | grep 5432
    ```

    `ss` debe mostrar `0.0.0.0:5432`, no `127.0.0.1:5432`.

3. Reglas entre capas, solo dos, en las pestañas de entrada:

    | Pestaña | Acción | Origen | Destino | Puerto | Log | Descripción |
    |----|----|----|----|----|----|----|
    | DMZEXT | Pass | srv_web | srv_app | p_app | no | 3 El proxy reenvía a la API |
    | DMZINT | Pass | srv_app | srv_db | 5432 | sí | 4 La API consulta PostgreSQL |

    Nada más. Añade el 8090 al alias `p_app`, que ya tenía el 8080: la regla sigue siendo una sola, y la descripción de la matriz dirá que cubre la API y el contenedor de pruebas. Apply.

4. Convierte nginx en proxy inverso. Sustituye el `root /var/www/html;` del bloque 443 por los dos `location` del apartado teórico:

    ```nginx
        location / {
            proxy_pass http://10.10.2.10:8090;
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /metrics {
            allow 10.10.0.0/24;
            deny all;
            proxy_pass http://10.10.2.10:8090;
        }
    ```

    Hoy el `proxy_pass` apunta al 8090, que es donde está `whoami`. Cuando la API del curso ocupe su sitio se cambia el puerto al 8080 y no hay que tocar ninguna regla, porque el alias `p_app` cubre los dos. `nginx -t` y `systemctl reload nginx`.

5. Desde el aula, `curl https://api.dev.lab`. La respuesta de whoami debe incluir `X-Forwarded-For` con tu IP del aula y `X-Forwarded-Proto: https`.
6. La conexión que sí debe funcionar, desde app01: `nc -zv -w 3 10.10.3.10 5432` devuelve "succeeded" (con `psql -h 10.10.3.10 -U appuser appdb` entras con la contraseña).
7. La que no debe funcionar, desde web01: `nc -zv -w 3 10.10.3.10 5432` termina por timeout. En Live View, filtra por interfaz DMZEXT y destino 10.10.3.10 y localiza la denegación.
8. Empieza la matriz de reglas con el formato de [Matriz de reglas](#matriz-de-reglas): una fila por regla que exista ahora en el firewall, con justificación, quién la pidió y cuándo se revisa. El número de fila va al principio de la descripción de la regla en OPNsense.

<span class="et et-com">Comprobación</span>

- `curl https://api.dev.lab` desde el aula devuelve whoami con tu IP en `X-Forwarded-For`; `/metrics` devuelve 403 desde el aula y 200 desde gestión.
- Desde web01, el nc al 5432 termina por timeout (no "refused") y la línea está en el log en la interfaz DMZEXT.
- `sudo nmap -sS -Pn -p 8080,8090,5432 IP_WAN` desde el aula: los tres `filtered`.

<span class="et et-ent">Entrega</span> En `ut3/`, `matriz-reglas.md` con la matriz justificada (las reglas actuales más la denegación por defecto) y la captura de la línea del log del paso 7.

<span class="et et-ext">Si te sobra tiempo</span> Pon en web01 `proxy_set_header X-Forwarded-For "1.2.3.4";` y observa que whoami se lo cree: por eso la aplicación solo debe confiar en la cabecera si viene del proxy.

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

- La A3.3 funcionando: `curl https://api.dev.lab` devuelve whoami.
- Un bridge de Proxmox VLAN aware (`vmbr1`, sin IP en el host) y una sexta NIC del firewall en él sin tag (será `vtnet5`; apaga y enciende la VM para que FreeBSD la vea).
- Dos VM Debian mínimas para hacer de cliente A y cliente B.
- Explicado en clase: [Separación de clientes](#separacion-de-clientes) y [VLAN en Proxmox y en OPNsense](#vlan-en-proxmox-y-en-opnsense).

<span class="et et-pas">Pasos</span>

1. En Proxmox, la NIC del cliente A va en `vmbr1` con VLAN Tag `101`; la del cliente B, con tag `102`. Las VM no saben nada de VLAN; el bridge etiqueta por ellas.
2. En OPNsense, Interfaces → Other Types → VLAN: VLAN 101 y 102 sobre `vtnet5`. En Assignments añade las dos, actívalas como CLI_A y CLI_B con IPv4 estática 10.10.101.1/24 y 10.10.102.1/24, sin gateway.
3. Configura las VM de cliente con IP fija (10.10.101.10/24 con gateway 10.10.101.1, y 10.10.102.10/24 con gateway 10.10.102.1). Comprueba que cada una hace ping a su gateway.
4. Aliases nuevos: `net_cli_a` = 10.10.101.0/24 y `net_cli_b` = 10.10.102.0/24.
5. Reglas, dos por pestaña y en este orden:

    | Pestaña | Acción | Origen | Destino | Puerto | Log | Descripción |
    |----|----|----|----|----|----|----|
    | CLI_A | Pass | net_cli_a | srv_web | 443 | no | 7 Cliente A al proxy compartido |
    | CLI_A | Block | net_cli_a | any | any | sí | 8 Cliente A: resto denegado |
    | CLI_B | Pass | net_cli_b | srv_web | 443 | no | 9 Cliente B al proxy compartido |
    | CLI_B | Block | net_cli_b | any | any | sí | 10 Cliente B: resto denegado |

    Apply. Para que `api.dev.lab` funcione desde los clientes sin NAT reflection, en su `/etc/hosts` apunta el nombre a 10.10.1.10, no a la IP WAN.

6. Desde el cliente A intenta alcanzar al B y localiza en Live View (CLI_A) las líneas de la regla 8:

    ```bash
    ping -c 3 -W 2 10.10.102.10
    sudo nmap -sn 10.10.102.0/24
    sudo nmap -Pn -p 22,80,443 10.10.102.10
    ```

7. Desde el cliente A, lo que sí debe funcionar: `curl -k https://api.dev.lab`. Repite 6 y 7 desde B hacia A.
8. Añade las reglas 7 a 10 a `matriz-reglas.md`.

<span class="et et-com">Comprobación</span>

- `ping` desde A hacia B: 100 % de pérdida. `nmap -sn`: 0 hosts up. `nmap -Pn`: los tres puertos `filtered`.
- `curl` desde A y desde B devuelve whoami con `X-Forwarded-For` 10.10.101.10 o 10.10.102.10: la aplicación ve al cliente por la cabecera, no por la IP de origen, que es siempre la del proxy.
- En Live View, filtrando por CLI_A, cada intento contra B aparece con la descripción "8 Cliente A: resto denegado".
- `bridge vlan show` en el host de Proxmox muestra cada VM de cliente con su VLAN y el firewall con las dos.

<span class="et et-ent">Entrega</span> En `ut3/`: capturas de Firewall → Rules (CLI_A y CLI_B), la salida del paso 6 con su línea del log, y `matriz-reglas.md` actualizado.

<span class="et et-ext">Si te sobra tiempo</span> Quita el tag de la NIC del cliente B y repite el paso 6: es el error más frecuente de la unidad y conviene haberlo visto antes de que ocurra por accidente. Vuelve a ponerlo.

## Sesión 18 · Pruebas de seguridad

<p class="ut-meta" markdown>4 de diciembre · Práctica · <span class="dur" tabindex="0" aria-label="Pruebas de seguridad · 10 min&#10;A3.5 Pruebas y evidencias · 100 min" data-dur="Pruebas de seguridad · 10 min&#10;A3.5 Pruebas y evidencias · 100 min">:material-school:<i class="dur-barra" style="--teoria:9%"></i>:material-flask:</span></p>

Sesión casi entera de laboratorio: la matriz de pruebas completa ejecutada desde cada zona, con evidencias fechadas, y dos denegaciones demostradas con tcpdump en las dos interfaces del firewall. Lo único que se explica es cómo leer open, closed y filtered en nmap; nc, curl, tcpdump y la matriz de pruebas son consulta para la hoja.

### Pruebas de seguridad

No basta con configurar: hay que demostrar que el aislamiento funciona, y demostrarlo desde el punto de vista del atacante, es decir, desde fuera de cada zona. Las pruebas se hacen desde la máquina que representa cada origen (el equipo del aula para Internet, web01 para la DMZ externa, la VM del cliente A para el cliente A), no desde el firewall.

#### nmap

nmap envía paquetes y clasifica cada puerto según la respuesta. Los tipos de escaneo que hacen falta:

- `nmap -sS -p- -T4 destino`: escaneo SYN (half-open) de los 65535 puertos TCP. Envía un SYN y mira qué vuelve; no completa la conexión, así que muchos servicios no lo registran. Necesita root. `-T4` acelera; en una red de laboratorio sin pérdidas está bien, en producción conviene `-T3`.
- `nmap -sT`: escaneo connect, completa el handshake. Es lo que hace nmap sin root, más lento y más ruidoso, pero sirve igual.
- `nmap -sU -p 53,123,161 destino`: UDP. Es lento porque un puerto abierto que no responde y uno filtrado se ven igual (silencio), y nmap tiene que reintentar. Conviene limitar los puertos.
- `nmap -sn 10.10.3.0/24`: descubrimiento de hosts sin escaneo de puertos. Desde Internet o desde el otro cliente, no debe encontrar nada en zonas internas.
- `-Pn`: no hacer ping previo. Imprescindible cuando el firewall bloquea ICMP, porque si no nmap concluye que el host está caído y no escanea nada.
- `-sV` identifica la versión del servicio, `-O` el sistema operativo. Útiles para ver qué información regala el proxy.

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
| Internet | firewall MGMT | 443 | Bloqueado | | nmap |

### A3.5 Pruebas y evidencias (sesión 18)

<span class="et et-obj">Objetivo</span> La matriz de pruebas completa ejecutada desde las máquinas de origen, con evidencias fechadas, dos denegaciones demostradas con tcpdump en las dos interfaces del firewall, y cualquier discrepancia corregida y repetida.

<span class="et et-pre">Antes de empezar</span>

- Todo lo de las sesiones 14 a 17 funcionando.
- `nmap`, `netcat-openbsd` y `curl` en el equipo del aula, web01, app01, db01 y las dos VM de cliente; acceso a la consola del firewall para `tcpdump`.
- Explicado en clase: [nmap](#nmap) y sus estados. De consulta: [nc, curl y tcpdump](#nc-curl-y-tcpdump) y [La matriz de pruebas](#la-matriz-de-pruebas).

<span class="et et-pas">Pasos</span>

1. Copia la tabla de [La matriz de pruebas](#la-matriz-de-pruebas) a `ut3/matriz-pruebas.md` añadiendo una columna Fecha. Mínimo 8 filas, con las de los clientes.
2. Ejecuta cada fila desde la máquina de origen que indica, nunca desde el firewall. Comandos de referencia:

    ```bash
    curl -v https://api.dev.lab                              # publicado, desde el aula
    sudo nmap -sS -Pn -p 22,80,443,8080,5432 IP_WAN      # filtered, desde el aula
    nc -zv -w 3 10.10.3.10 5432                          # un puerto, desde web01 o app01
    curl -m 5 https://deb.debian.org                     # salida a Internet, desde web01
    sudo nmap -sn 10.10.102.0/24                         # un cliente contra el otro
    ```

    Encabeza cada salida con `date; hostname` y guárdala en un fichero para que lleve fecha y origen.

3. Elige dos filas bloqueadas (por ejemplo, proxy → db:5432 y cliente A → cliente B:22). Para cada una, captura a la vez en la interfaz de entrada y en la de salida del firewall antes de lanzar el intento:

    ```bash
    # Terminal 1, interfaz por la que entra (DMZEXT)
    tcpdump -ni vtnet1 -c 10 host 10.10.3.10 and port 5432
    # Terminal 2, interfaz por la que saldría (INT)
    tcpdump -ni vtnet3 -c 10 host 10.10.3.10 and port 5432
    ```

    Lanza el `nc` desde web01. El SYN debe verse en la primera captura y no en la segunda. Guarda las dos salidas como evidencia.

4. Para esas dos filas, localiza en Live View la línea de la denegación con su etiqueta de regla y anótala en la columna Evidencia.
5. Si alguna fila da un resultado distinto del esperado (un `closed` donde debía haber `filtered`, un `succeeded` en una fila bloqueada), es un hallazgo. Escríbelo en `ut3/hallazgos.md` con qué viste, qué regla lo causaba, cómo lo corregiste y la repetición de la fila. Si no ha habido ninguno, prueba filas que no están en la tabla: gestión desde una VM de cliente o el 22 de web01 desde app01.
6. Borra las reglas temporales que hayas usado para instalar paquetes y anótalo en la matriz de reglas.

<span class="et et-com">Comprobación</span>

- Cada fila de la matriz tiene "Obtenido", fecha y un fichero de evidencia en el repositorio.
- Ninguna fila bloqueada tiene `closed` ni `succeeded` tras la corrección.
- Las dos capturas de tcpdump muestran el SYN en la entrada y nada en la salida, y en el log está la línea que lo explica.

<span class="et et-ent">Entrega</span> En `ut3/`: `matriz-pruebas.md`, la carpeta `evidencias/` y `hallazgos.md`. Es el material del informe de la sesión 19.

## Sesión 19 · Práctica evaluable

<p class="ut-meta" markdown>9 de diciembre · Práctica evaluable · <span class="dur" tabindex="0" aria-label="Aclaración del enunciado · 10 min&#10;Trabajo en la práctica · 100 min" data-dur="Aclaración del enunciado · 10 min&#10;Trabajo en la práctica · 100 min">:material-school:<i class="dur-barra" style="--teoria:9%"></i>:material-flask:</span></p>

La sesión empieza con diez minutos de aclaración del enunciado y el resto es para cerrar el informe con el material de las sesiones 14 a 18: el diagrama de zonas, la matriz de reglas justificada, la matriz de pruebas con evidencias, un hallazgo corregido y el procedimiento de cambios.

Entrega un informe (máximo 6 páginas) sobre el entorno dev con los dos clientes:

1. Diagrama de zonas del entorno dev con los dos clientes, subredes, gateways y máquinas.
2. Matriz de reglas completa con justificación por regla (formato de la sección de documentación).
3. Matriz de pruebas ejecutada con evidencias (capturas o salidas de comandos), mínimo 8 filas.
4. Un hallazgo real que hayas encontrado durante las pruebas y cómo lo corregiste. Si de verdad no ha habido ninguno, explica qué prueba adicional harías para buscarlo.
5. Procedimiento breve para solicitar una regla nueva.

Checklist antes de entregar:

- [ ] Ninguna regla usa IPs sueltas en lugar de aliases (OPNsense) o variables (nftables).
- [ ] Ningún escaneo desde Internet devuelve `closed` en puertos no publicados; todo lo no publicado es `filtered`.
- [ ] La consola del firewall solo responde desde MGMT.
- [ ] El certificado del proxy tiene SAN y lo firma la CA propia.
- [ ] Las capturas llevan fecha y máquina de origen visibles.

| Criterio (RA1 d) | Peso |
|----|----|
| Capas de seguridad desplegadas según exposición (externa, interna, interna) | 30 % |
| Pruebas de seguridad y aislamiento ejecutadas y documentadas | 30 % |
| Separación de clientes demostrada | 20 % |
| Matriz de reglas justificada y procedimiento | 20 % |

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

**Las VM se quedan sin IP y sin DNS a mitad de la sesión 14.** Se apagó `router-dev` antes de que OPNsense tuviera configurado el DHCP y el DNS de las cuatro zonas. El orden del paso 8 de la A3.1 no es un capricho: primero se prepara el firewall, después se retira el router. Mientras tanto, cada VM sigue teniendo su concesión de 12 horas, así que hay margen para volver a levantar `router-dev` y rehacer el relevo con calma.

**Dos máquinas con la misma `.1`.** Ocurre si se activan las interfaces internas del firewall con `router-dev` todavía en marcha, o si alguna subnet del SDN conserva el gateway que se le puso en la sesión 8. El síntoma es que el `ping` al `.1` responde unas veces sí y otras no, o que el ARP del `.1` cambia de MAC. Se comprueba con `ip neigh` en una VM de la zona y se arregla dejando un solo `.1`.

Los enlaces para ampliar y los apartados que van más allá de lo que se hace en clase están en [Para ampliar](../ampliacion.md#ut3-seguridad-por-capas-dmz-externa-dmz-interna-y-zona-interna).
