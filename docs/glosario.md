# Glosario

Términos que aparecen en el módulo, explicados en una o dos frases y con la unidad donde se tratan a fondo. Si un término no está, el buscador de la barra de arriba lo localiza: casi seguro que aparece en alguna unidad.

**ACK** · Bandera del segmento TCP con la que el receptor confirma lo que ha recibido. En un escaneo, un SYN al que contesta un SYN/ACK indica un puerto abierto. UT3.

**ACME** · Protocolo con el que un servidor pide y renueva sus certificados sin intervención humana; es el que usa Let's Encrypt. UT3.

**ADC (Application Default Credentials)** · Credenciales por defecto que buscan las librerías de Google Cloud. Las deja `gcloud auth application-default login` y son distintas del login de `gcloud`. UT4.

**Agente (CI)** · Máquina o contenedor donde el orquestador ejecuta de verdad las tareas. El controlador solo coordina. En Jenkins se eligen por etiqueta; en GitLab se llaman runners. UT6.

**Agente QEMU (qemu-guest-agent)** · Servicio dentro de la VM por el que Proxmox le pregunta la IP, la apaga limpiamente y congela su sistema de ficheros durante un snapshot o una copia. En el curso va dentro de la plantilla 9000. UT1.

**Alertmanager** · Componente de Prometheus que recibe las alertas disparadas, las agrupa, las silencia si toca y las envía por correo, Telegram, Slack o webhook. UT7.

**Alias (OPNsense)** · Nombre que se da en el cortafuegos a una IP, una red o una lista de puertos para escribir las reglas con él (`srv_web`, `net_mgmt`, `p_web`). Si la dirección cambia, se cambia el alias y no cada regla. UT3.

**Ansible** · Herramienta de gestión de configuración: ejecuta por SSH tareas idempotentes descritas en YAML (playbooks) sobre un inventario de máquinas. No necesita agente en el destino. UT5.

**ARC** · Caché de lectura de ZFS en la RAM del host. Hay que sumarla al presupuesto de memoria cuando el almacenamiento es ZFS. UT1.

**ARP** · Protocolo con el que una máquina averigua la MAC que corresponde a una IP de su misma red. Si dos máquinas de la zona tienen la misma `.1`, el ARP de esa dirección cambia de MAC y el ping falla a ratos; se mira con `ip neigh`. UT2, UT3.

**Artefacto** · Resultado de una etapa del pipeline que se guarda: un paquete, una imagen, un informe de pruebas. UT6.

**AVX y SSE4.2** · Juegos de instrucciones de la CPU que el invitado solo ve si el tipo de CPU de la VM los expone. El tipo `x86-64-v2-AES` del laboratorio llega hasta SSE4.2 y AES-NI (cifrado por hardware), sin AVX. UT1.

**AWS** · Amazon Web Services, la nube pública de Amazon. Es el proveedor que se desarrolla en la UT4, con Azure y Google Cloud como correspondencia. UT4.

**Backend (Terraform)** · Dónde se guarda el estado. Local por defecto; remoto (S3/MinIO, HTTP de GitLab, Consul) cuando trabaja más de una persona. UT5.

**Ballooning** · Mecanismo por el que el hipervisor recupera memoria que la VM tiene asignada pero no usa. Funciona con un driver dentro del invitado. UT1.

**Basic auth** · Autenticación HTTP con usuario y contraseña en una cabecera. En los exporters oficiales se activa con `--web.config.file` y la contraseña va en bcrypt. UT7.

**Bond** · Varias tarjetas de red físicas agrupadas en una sola interfaz (`bond0`) para tener redundancia o sumar ancho de banda. Es `bond0` lo que se pone como puerto del bridge. UT1.

**Bridge (Linux)** · Switch virtual dentro del host. Las VM se conectan a él como si fuera un switch físico; la tarjeta física del host puede ser un puerto más del bridge. En Proxmox, vmbr0. UT1.

**CA** · Autoridad de certificación: quien firma los certificados y en quien confían los clientes. En el laboratorio hay una sola, la CA del curso (`Lab 5166 CA`), creada con `openssl ca` en la A3.2 y en `~/ca/` del puesto de administración. UT3, UT6.

**cAdvisor** · Exporter de Google que expone métricas de uso de recursos por contenedor. UT7.

**Cardinalidad** · Número de series temporales distintas que genera una métrica según sus etiquetas. Una etiqueta con muchos valores posibles (IP de cliente, id de usuario) multiplica las series y tumba Prometheus. UT7.

**CD** · Entrega continua (*continuous delivery*): el artefacto que pasa el pipeline queda listo para desplegar y una persona decide cuándo. Si el despliegue también es automático se habla de despliegue continuo. UT6.

**checkov** · Analizador estático de código de infraestructura (Terraform, Ansible, Dockerfile, Kubernetes) con cientos de reglas de seguridad. UT5.

**CI** · Integración continua (*continuous integration*): cada cambio que llega al repositorio se construye y se prueba de forma automática. En la UT5 es el sitio donde corren `tofu validate`, los escáneres y `tofu plan -detailed-exitcode`. UT5, UT6.

**CIDR** · Notación de red con prefijo: 10.10.1.0/24 son las 256 direcciones de 10.10.1.0 a 10.10.1.255. UT2.

**CLI (nube)** · Programa de línea de comandos del proveedor (`aws`, `az`, `gcloud`) que llama a la misma API que la consola web. Guarda su configuración en el directorio personal y las variables de entorno la sobrescriben. UT4.

**Clon enlazado / completo** · Un clon enlazado comparte el disco base con la plantilla y solo guarda diferencias (rápido, para pruebas); el completo copia el disco entero (independiente, para producción). UT1.

**cloud-init** · Estándar para configurar una VM en su primer arranque: usuario, claves SSH, nombre, red, paquetes. Proxmox le pasa los datos por un disco virtual. UT1.

**CN** · *Common Name*: el campo del certificado que antes llevaba el nombre del servidor (`-subj "/CN=api.dev.lab"`). Los navegadores y clientes actuales lo ignoran y miran el SAN. UT3, UT6.

**conntrack** · Tabla del kernel donde un cortafuegos con estado registra cada conexión abierta, para dejar pasar las respuestas sin reglas explícitas. UT3.

**Credencial (Jenkins)** · Secreto guardado cifrado en el orquestador y referenciado por su ID en el pipeline. Nunca se escribe en el Jenkinsfile. UT6.

**CSR** · Petición de firma de certificado: la clave pública y los nombres que se envían a la CA para que los firme. UT3.

**DMZ** · Zona desmilitarizada: subred entre Internet y la red interna donde van los servicios que deben verse desde fuera. Se habla de DMZ externa (proxy, web) y DMZ interna (aplicación). UT3.

**DMZEXT, DMZINT e INT** · Nombres de las interfaces de OPNsense para front (DMZ externa), back (DMZ interna) y data (zona interna). Cada una es una pestaña de reglas en Firewall → Rules. UT3.

**DNAT** · Traducción de la dirección de destino: el cortafuegos cambia la IP de destino de un paquete que entra para llevarlo a la máquina interna que corresponde. Es lo que hace un port forward. UT3.

**dnsmasq** · Servidor ligero de DHCP y DNS en un solo binario. El que se usa como router de entorno. UT2.

**DORA** · Discover, Offer, Request, Ack: las cuatro fases con las que un cliente obtiene su dirección por DHCP. En el journal de dnsmasq se ve una línea por fase. UT2.

**EC2** · Servicio de máquinas virtuales de AWS; cada VM es una instancia. Equivale a Virtual Machines en Azure y a Compute Engine en Google Cloud. UT4.

**ECS y AKS** · Servicios de contenedores gestionados: ECS en AWS, AKS (Kubernetes gestionado) en Azure. En el módulo solo se citan como correspondencia; no se despliega nada en ellos. UT4.

**Estado (Terraform)** · Fichero que relaciona cada recurso del código con el recurso real que existe en el proveedor. Sin él, Terraform no sabe qué ha creado. UT5.

**EVPN** · Tipo de zona del SDN de Proxmox: VXLAN más BGP para anunciar MAC e IP entre nodos, con enrutado distribuido. Solo tiene sentido en un clúster. UT2.

**Exporter** · Programa que expone métricas de algo (el sistema, una BD, un servicio) en el formato de texto que Prometheus sabe leer. UT7.

**file_sd** · Descubrimiento de targets en el que Prometheus vigila ficheros JSON o YAML y recarga la lista de máquinas cuando cambian, sin reiniciar. Los escribe Ansible desde el inventario o el pipeline desde los outputs de OpenTofu. UT7.

**Formación en empresa (FE)** · Periodo del curso que se hace en una empresa con un tutor. En este módulo cubre la UT4, la UT7b y la UT8.

**GCP** · Google Cloud Platform, la nube pública de Google. En la UT4 aparece como correspondencia del proveedor principal. UT4.

**gitleaks** · Busca secretos (tokens, claves, contraseñas) en un repositorio, incluido su historial. UT5.

**Grafana** · Interfaz web que dibuja en paneles las consultas a Prometheus y a otras fuentes. En el curso está en mon01 detrás de un nginx en el 443. UT7.

**GUID** · Identificador de 32 caracteres hexadecimales separados por guiones. En Azure identifica la suscripción y el tenant. UT4.

**HCL** · Lenguaje de configuración de Terraform y OpenTofu. Bloques, atributos, expresiones. UT5.

**Hipervisor** · Software que crea y ejecuta máquinas virtuales repartiendo el hardware entre ellas. Tipo 1 va sobre el metal (Proxmox, ESXi); tipo 2 sobre un sistema operativo (VirtualBox). UT1.

**IaC** · Infraestructura como código: describir máquinas, redes y reglas en ficheros versionados que una herramienta aplica. UT5.

**IAM** · El sistema que dice qué identidad puede hacer qué sobre qué recurso. En AWS son users, roles y policies; en Azure, Entra ID más RBAC; en Google Cloud, bindings entre principales y roles. UT4.

**ICMP** · Protocolo de mensajes de control de IP: el echo de `ping` y los avisos de destino inalcanzable. Que un ping no responda no demuestra casi nada, porque muchos cortafuegos lo filtran. UT2, UT3.

**Idempotencia** · Propiedad de una operación que, aplicada dos veces, deja el mismo resultado que aplicada una. Base del IaC. La A2.6 ya exige que los scripts de creación y destrucción se puedan ejecutar dos veces sin error ni duplicados. UT2, UT5.

**IOMMU (VT-d / AMD-Vi)** · Extensión del hardware que permite ceder un dispositivo PCI entero a una VM (passthrough). UT1.

**IOPS** · Operaciones de entrada y salida por segundo que aguanta un disco. Es la cifra que se mide con `fio` y la que se hunde cuando varias VM comparten disco. UT1.

**IPAM** · Gestión de direcciones IP: registro de qué IP está asignada a qué máquina. El SDN de Proxmox lo integra. UT2.

**JCasC** · Jenkins Configuration as Code: plugin que permite definir toda la configuración de Jenkins en un YAML versionado. UT6.

**Jenkinsfile** · Fichero en el repositorio del proyecto que define el pipeline en sintaxis declarativa de Jenkins. UT6.

**JMESPath** · Lenguaje de consulta sobre JSON que usan los `--query` de las CLI de AWS y de Azure para quedarse con unos pocos campos y sacarlos en tabla. UT4.

**JUnit** · Formato XML estándar de resultados de pruebas. `pytest` lo genera y Jenkins lo lee para marcar las pruebas que fallan. UT6.

**KPI** · Indicador clave: la métrica o fórmula que resume si un servicio va bien (disponibilidad, latencia p95, errores por minuto). UT7.

**KVM** · Módulo del kernel Linux que convierte al kernel en hipervisor usando VT-x/AMD-V. QEMU le pone los dispositivos virtuales. UT1.

**LVM-thin** · Almacenamiento con aprovisionamiento ligero: un disco de 50 GB ocupa solo lo escrito. Permite snapshots. Riesgo: prometer más de lo que hay. UT1.

**LXC** · Contenedores de sistema: comparten kernel con el host pero se comportan como una máquina completa. Más ligeros que una VM, menos aislados. UT1.

**MAC** · Dirección física de una interfaz de red. Proxmox asigna una a cada NIC de la VM; el traslado de la A3.3 la conserva para que la VM no cambie de IP ni de nombre de interfaz. UT2, UT3.

**Mailpit** · Servidor de correo de pruebas con interfaz web: acepta cualquier mensaje y lo enseña sin entregarlo a nadie. En el curso recibe las notificaciones de Alertmanager. UT7.

**MFA** · Segundo factor además de la contraseña: código de una app, llave física o passkey. Obligatorio en todo usuario de la nube de la empresa. UT4.

**MGMT** · La zona de gestión del laboratorio, `10.10.0.0/24`: desde ella se administran las demás zonas por SSH y en ella viven las máquinas de control. Ninguna otra zona entra en ella salvo por las filas documentadas de la matriz de reglas: app01 hacia la Gitea provisional (fila 6) y hacia Loki (fila 13). UT2, UT3.

**Mínimo privilegio** · Dar a cada usuario, servicio o token solo los permisos que necesita para su tarea y nada más. UT6.

**Módulo (Terraform)** · Directorio con recursos reutilizables que se invoca con parámetros. UT5.

**MTU** · Tamaño máximo del paquete que admite una interfaz, 1500 bytes en Ethernet. Toda encapsulación (VXLAN, WireGuard) resta cabecera y obliga a bajarla en las VM, normalmente a 1450; olvidarlo se manifiesta como transferencias grandes que se cuelgan sin dar error. UT2.

**NAT** · Traducción de direcciones: el router o el cortafuegos cambia la IP de origen (SNAT, masquerade) o la de destino (DNAT, port forward) de los paquetes que pasan por él. En el laboratorio da salida a Internet a las zonas y publica `api.dev.lab`. UT2, UT3.

**NFS** · Protocolo para compartir directorios por red. En Proxmox es un tipo de almacén compartido entre nodos para ISOs y copias. UT1.

**nftables** · Cortafuegos del kernel Linux, sucesor de iptables. Tablas, cadenas con hooks y reglas. UT3.

**NIC** · Tarjeta de red, física o virtual. Cada interfaz que se añade a una VM es una NIC más, conectada a un bridge o a una VNet. UT1, UT2.

**node_exporter** · Exporter de métricas del sistema operativo: CPU, memoria, disco, red. Puerto 9100. Viene instalado en la plantilla 9000 como paquete `prometheus-node-exporter` desde la A1.3, así que lo lleva toda VM clonada. UT1, UT7.

**NTP** · Protocolo de sincronización de la hora (123 UDP). Desde la A3.1 el cortafuegos es el servidor de hora de todas las zonas. UT3.

**OpenTofu** · Fork libre de Terraform mantenido por la Linux Foundation desde el cambio de licencia de HashiCorp. Comandos y sintaxis intercambiables. UT5.

**OPNsense** · Distribución de cortafuegos basada en FreeBSD con interfaz web. Se usa como firewall entre zonas. UT3.

**Orquestador (CI)** · Servidor que recibe los cambios del repositorio, ejecuta el pipeline en agentes y guarda los resultados. Jenkins, GitLab CI, GitHub Actions. UT6.

**OU (unidad organizativa)** · Carpeta de cuentas de AWS Organizations a la que se aplican políticas en bloque. UT4.

**Paravirtualización / virtio** · Drivers en la VM que saben que están virtualizados y hablan directamente con el hipervisor en lugar de emular hardware real. Mucho más rápidos. UT1.

**PBS (Proxmox Backup Server)** · Servidor de copias de Proxmox que guarda cada trozo de disco una sola vez y solo lee lo cambiado desde la copia anterior. En el laboratorio no se monta. UT1.

**pct** · Comando de Proxmox para crear y gestionar contenedores LXC desde la terminal; el equivalente de `qm` para las VM. UT2.

**Perfil (CLI)** · Conjunto con nombre de cuenta, región y credenciales que usa la CLI. Lo habitual es uno por entorno; se elige con una opción del comando o con una variable de entorno, que manda sobre el fichero. UT4.

**Pipeline** · Cadena de etapas por la que pasa cada cambio: checkout, build, test, package, deploy. UT6.

**Plan (Terraform)** · Lista de lo que la herramienta crearía, cambiaría o destruiría para que el estado real coincida con el código. Se lee siempre antes de aplicar. UT5.

**Plantilla (Proxmox)** · VM marcada como base de clonado. No se puede arrancar, solo clonar. UT1.

**Port forward** · Regla NAT que redirige un puerto de la IP pública del firewall a una máquina interna. UT3.

**Prometheus** · Servidor de monitorización que lee cada pocos segundos las métricas de los exporters (modelo pull), las guarda en su base de series temporales y evalúa las reglas de alerta. En el curso corre en mon01 desde octubre. UT7.

**PromQL** · Lenguaje de consulta de Prometheus. UT7.

**Provider (Terraform)** · Plugin que sabe hablar con un proveedor concreto (Proxmox, AWS, DNS...). UT5.

**Provisioning (Grafana)** · Fuentes de datos y dashboards definidos en ficheros que Grafana lee al arrancar, en lugar de configurarlos a clics. Es lo que permite versionarlos en Git. UT7.

**Proxy inverso** · Servidor que recibe las peticiones de los clientes y las reenvía a los servidores internos. Termina TLS y oculta la topología. nginx, Traefik, Caddy. UT3.

**Pull / push (monitorización)** · En pull, el servidor de métricas lee de cada objetivo (Prometheus). En push, cada máquina envía sus datos (Zabbix agent, Pushgateway). UT7.

**Pushgateway** · Buzón intermedio al que un trabajo corto (un cron, una copia) empuja sus métricas para que Prometheus las lea después. Solo para lotes que no están vivos cuando Prometheus pasa a leer. UT7.

**pvesh** · Cliente de línea de comandos de la API de Proxmox que se ejecuta en el propio nodo. Recorre la API como un sistema de ficheros: `get` lee, `create` es POST, `set` es PUT y `delete` es DELETE. UT2.

**qcow2 y raw** · Formatos de disco de VM. raw es una imagen byte a byte, la más rápida y la que usan LVM-thin y ZFS; qcow2 es un fichero con metadatos que crece bajo demanda y admite snapshots internos, y es el formato en que se distribuyen las imágenes cloud. UT1.

**QEMU** · Emulador de máquinas que, junto con KVM, ejecuta las VM en Proxmox. UT1.

**Realm (Proxmox)** · Origen de los usuarios: pam (usuarios Linux del host), pve (usuarios propios), LDAP, AD. UT1.

**Región (nube)** · Conjunto de centros de datos de una zona geográfica, con catálogo de servicios y precios propios. Casi todos los recursos son regionales: mirar en la región equivocada es no ver nada. UT4.

**Registry** · Almacén de imágenes de contenedor. Docker Hub es uno público; en el laboratorio del curso se monta uno local. UT6.

**Regla de grabación** · Consulta PromQL que Prometheus ejecuta sola y cuyo resultado guarda como una serie nueva, para no repetir un cálculo caro en cada panel. Se nombra nivel:métrica:operación. UT7.

**REST** · Estilo de API que se llama por HTTP, con rutas como las de una web, y responde en JSON. La consola web de Proxmox y las CLI de la nube usan una API así por debajo. UT1, UT2, UT4.

**RFC** · Documento que fija un estándar de Internet. La RFC 1918 reserva los rangos privados (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) de los que sale el direccionamiento del laboratorio. UT2.

**RST** · Bandera TCP de reinicio. Es lo que responde un puerto cerrado y lo que devuelve una regla Reject, frente al silencio de un Drop. UT3.

**Runner** · Nombre del agente en GitLab CI, Gitea Actions y GitHub Actions. UT6.

**Ruta blackhole** · Ruta que descarta en silencio todo el tráfico hacia un bloque de direcciones. En el laboratorio impide que un entorno alcance a los otros (router-dev descarta 10.20.0.0/16 y 10.30.0.0/16). UT2.

**S3** · Protocolo de almacenamiento de objetos de Amazon (buckets y objetos por HTTP) que MinIO también habla. El backend `s3` guarda contra él el estado de OpenTofu, y restic las copias. UT4, UT5.

**SaaS** · Software como servicio (*software as a service*): la herramienta la aloja y la mantiene el proveedor y se usa por Internet, sin servidor propio. GitHub Actions o GitLab.com frente a un Jenkins autoalojado. UT6.

**SAN** · *Subject Alternative Name*: campo del certificado con los nombres y las IP para los que vale. Sin él los navegadores y los clientes modernos lo rechazan aunque la firma sea correcta. UT3, UT6.

**Scrape** · Lectura periódica que Prometheus hace de cada exporter. UT7.

**SCSI, SATA e IDE** · Buses de disco que Proxmox puede emular en una VM. El que se usa es VirtIO SCSI, paravirtualizado; un disco en IDE o SATA rinde muy por debajo. UT1.

**SDK** · Librería que hace desde un lenguaje de programación las mismas llamadas a la API que la CLI (`boto3`, `azure-mgmt-*`, `google-cloud-*`). Toma las credenciales de la cadena por defecto, nunca escritas en el código. UT4.

**SDN (Proxmox)** · Redes definidas por software: zonas, VNets y subredes que Proxmox gestiona desde el Datacenter. UT2.

**Serie temporal** · Una métrica con una combinación concreta de etiquetas y sus valores en el tiempo. UT7.

**SLA** · Acuerdo de nivel de servicio: el contrato con el cliente, con penalización si no se cumple. Siempre más laxo que el SLO interno. UT7.

**SLI** · Indicador de nivel de servicio: la medición concreta, normalmente una fracción de peticiones o de sondas correctas. UT7.

**SLO** · Objetivo de nivel de servicio: el valor que se asume para un SLI en una ventana de tiempo (99,5 % en 30 días). Lo que sobra hasta el 100 % es el presupuesto de error. UT7.

**Snapshot** · Foto del disco (y opcionalmente la memoria) de una VM en un instante. Permite volver atrás. No es una copia de seguridad. UT1.

**SNAT** · Traducción de la dirección de origen: el router cambia la IP de origen de los paquetes que salen para que las respuestas vuelvan a él. El masquerade es el SNAT que usa la IP de la interfaz de salida. UT2, UT3.

**sops** · Herramienta para cifrar ficheros de secretos (YAML, JSON, env) y guardarlos en el repositorio. UT5.

**SSO (inicio de sesión único)** · Entrar en la nube con la identidad corporativa y recibir credenciales temporales, en lugar de tener claves de larga duración. En AWS lo configura `aws configure sso`. UT4.

**Stateful (cortafuegos)** · Cortafuegos que recuerda las conexiones abiertas y deja pasar las respuestas sin regla adicional. UT3.

**Subred pública / privada** · Pública si tiene ruta directa a Internet; privada si solo sale por NAT o no sale. UT2.

**SYN** · Bandera del primer segmento TCP de una conexión. Un escaneo `-sS` envía solo ese SYN, y una inundación de SYN busca llenar la tabla de estados del cortafuegos. UT3.

**TCG** · Emulación pura de QEMU, sin ayuda de KVM: es a lo que cae una VM cuando falta la virtualización por hardware, de diez a veinte veces más lenta. UT1.

**Terraform** · Herramienta de aprovisionamiento declarativo de HashiCorp. Ver OpenTofu. UT5.

**TLS** · Protocolo de cifrado de las conexiones (el de https). Cada servidor presenta un certificado con su SAN, firmado por una CA en la que confía el cliente. UT3, UT6.

**TOTP** · Código de un solo uso basado en la hora que genera la app de autenticación del móvil; es el segundo factor más habitual. UT4.

**Trivy** · Escáner de vulnerabilidades y configuraciones inseguras: imágenes, ficheros de IaC, repositorios. UT5.

**TSDB** · Base de datos de series temporales: el almacén donde Prometheus guarda cada muestra con su marca de tiempo. Escribe bloques de dos horas y después los compacta. UT7.

**Túnel SSH** · Conexión SSH que lleva un puerto de una máquina remota hasta el puesto (`ssh -L`). En el curso es la forma de llegar a Prometheus, Alertmanager y Mailpit, que desde diciembre solo escuchan en 127.0.0.1 de mon01. UT7.

**Umbral** · Valor a partir del cual una métrica se considera anómala y dispara una alerta. UT7.

**VE (Proxmox VE)** · *Virtual Environment*, el nombre completo del producto: la distribución basada en Debian que trae el hipervisor, el SDN y la consola web del laboratorio. UT1.

**virt-customize** · Herramienta de libguestfs que instala paquetes dentro de una imagen de disco sin arrancarla. Con ella se meten el agente QEMU y node_exporter en la imagen de la plantilla. UT1.

**Virtualización anidada** · Ejecutar un hipervisor dentro de una VM. Lo que se hace en el laboratorio del curso para tener Proxmox en VirtualBox. UT1.

**VLAN (802.1Q)** · Etiqueta en las tramas Ethernet que separa redes lógicas sobre el mismo cable o bridge. UT1, UT2, UT3.

**VM exit** · Salida del modo invitado: cada vez que la VM hace algo que el hipervisor tiene que atender (un acceso a un dispositivo emulado, una interrupción), la CPU devuelve el control al host. Cuesta del orden de un microsegundo, y reducir su número es lo que hace rápido a virtio. UT1.

**VNet (Proxmox SDN)** · Red virtual dentro de una zona del SDN. Aparece como un bridge más al crear VM. UT2.

**VPC** · Nube privada virtual: red aislada definida por software dentro de una infraestructura compartida, con sus subredes, rutas y reglas. UT2.

**VPN** · Red privada virtual: túnel cifrado que une una máquina o una oficina con una red remota. En la nube es una de las formas de restringir el acceso de administración. UT2, UT3.

**VXLAN** · Encapsulación que transporta redes de capa 2 sobre IP; permite extender una red virtual entre varios nodos. UT2.

**vzdump** · Herramienta de copia de seguridad integrada en Proxmox: copia completa de una VM o de un contenedor, con su configuración, a otro almacén. Se restaura con `qmrestore`. UT1.

**WAN** · La interfaz exterior del cortafuegos, la que da a la red del aula y a Internet. En OPNsense es `vtnet0`, en `vmbr0`. UT3.

**Webhook** · Petición HTTP que un sistema (Gitea, GitLab) envía a otro (Jenkins) cuando pasa algo, por ejemplo un push. UT6.

**ZFS** · Sistema de ficheros y gestor de volúmenes con snapshots instantáneos, compresión, sumas de verificación de cada bloque y RAID por software. A cambio usa RAM para su caché (ARC). UT1.

**Zona de disponibilidad (AZ)** · Centro de datos independiente dentro de una región de nube. Una VPC abarca varias. UT2, UT4.

**Zona (SDN de Proxmox)** · Tipo de red virtual: simple, vlan, vxlan, evpn. UT2.
