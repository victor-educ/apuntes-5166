# Glosario

Términos que aparecen en el módulo, explicados en una o dos frases y con la unidad donde se tratan a fondo. Si un término no está, búscalo en la barra de arriba: casi seguro que está en alguna unidad.

**Agente (CI)** · Máquina o contenedor donde el orquestador ejecuta de verdad las tareas. El controlador solo coordina. En Jenkins se eligen por etiqueta; en GitLab se llaman runners. UT6.

**Alertmanager** · Componente de Prometheus que recibe las alertas disparadas, las agrupa, las silencia si toca y las envía por correo, Telegram, Slack o webhook. UT7.

**Ansible** · Herramienta de gestión de configuración: ejecuta por SSH tareas idempotentes descritas en YAML (playbooks) sobre un inventario de máquinas. No necesita agente en el destino. UT5.

**Artefacto** · Resultado de una etapa del pipeline que se guarda: un paquete, una imagen, un informe de pruebas. UT6.

**Backend (Terraform)** · Dónde se guarda el estado. Local por defecto; remoto (S3/MinIO, HTTP de GitLab, Consul) cuando trabaja más de una persona. UT5.

**Ballooning** · Mecanismo por el que el hipervisor recupera memoria que la VM tiene asignada pero no usa. Funciona con un driver dentro del invitado. UT1.

**Bridge (Linux)** · Switch virtual dentro del host. Las VM se conectan a él como si fuera un switch físico; la tarjeta física del host puede ser un puerto más del bridge. En Proxmox, vmbr0. UT1.

**cAdvisor** · Exporter de Google que expone métricas de uso de recursos por contenedor. UT7.

**Cardinalidad** · Número de series temporales distintas que genera una métrica según sus etiquetas. Una etiqueta con muchos valores posibles (IP de cliente, id de usuario) multiplica las series y tumba Prometheus. UT7.

**checkov** · Analizador estático de código de infraestructura (Terraform, Ansible, Dockerfile, Kubernetes) con cientos de reglas de seguridad. UT5.

**CIDR** · Notación de red con prefijo: 10.10.1.0/24 son las 256 direcciones de 10.10.1.0 a 10.10.1.255. UT2.

**cloud-init** · Estándar para configurar una VM en su primer arranque: usuario, claves SSH, nombre, red, paquetes. Proxmox le pasa los datos por un disco virtual. UT1.

**Clon enlazado / completo** · Un clon enlazado comparte el disco base con la plantilla y solo guarda diferencias (rápido, para pruebas); el completo copia el disco entero (independiente, para producción). UT1.

**conntrack** · Tabla del kernel donde un cortafuegos con estado registra cada conexión abierta, para dejar pasar las respuestas sin reglas explícitas. UT3.

**Credencial (Jenkins)** · Secreto guardado cifrado en el orquestador y referenciado por su ID en el pipeline. Nunca se escribe en el Jenkinsfile. UT6.

**DMZ** · Zona desmilitarizada: subred entre Internet y la red interna donde van los servicios que deben verse desde fuera. Se habla de DMZ externa (proxy, web) y DMZ interna (aplicación). UT3.

**dnsmasq** · Servidor ligero de DHCP y DNS en un solo binario. El que usamos como router de entorno. UT2.

**Estado (Terraform)** · Fichero que relaciona cada recurso del código con el recurso real que existe en el proveedor. Sin él, Terraform no sabe qué ha creado. UT5.

**Exporter** · Programa que expone métricas de algo (el sistema, una BD, un servicio) en el formato de texto que Prometheus sabe leer. UT7.

**Formación en empresa (FE)** · Periodo del curso que se hace en una empresa con un tutor. En este módulo cubre la UT4, la UT7b y la UT8.

**gitleaks** · Busca secretos (tokens, claves, contraseñas) en un repositorio, incluido su historial. UT5.

**HCL** · Lenguaje de configuración de Terraform y OpenTofu. Bloques, atributos, expresiones. UT5.

**Hipervisor** · Software que crea y ejecuta máquinas virtuales repartiendo el hardware entre ellas. Tipo 1 va sobre el metal (Proxmox, ESXi); tipo 2 sobre un sistema operativo (VirtualBox). UT1.

**Idempotencia** · Propiedad de una operación que, aplicada dos veces, deja el mismo resultado que aplicada una. Base del IaC. UT5.

**IaC** · Infraestructura como código: describir máquinas, redes y reglas en ficheros versionados que una herramienta aplica. UT5.

**IOMMU (VT-d / AMD-Vi)** · Extensión del hardware que permite ceder un dispositivo PCI entero a una VM (passthrough). UT1.

**IPAM** · Gestión de direcciones IP: registro de qué IP está asignada a qué máquina. El SDN de Proxmox lo integra. UT2.

**JCasC** · Jenkins Configuration as Code: plugin que permite definir toda la configuración de Jenkins en un YAML versionado. UT6.

**Jenkinsfile** · Fichero en el repositorio del proyecto que define el pipeline en sintaxis declarativa de Jenkins. UT6.

**KPI** · Indicador clave: la métrica o fórmula que resume si un servicio va bien (disponibilidad, latencia p95, errores por minuto). UT7.

**KVM** · Módulo del kernel Linux que convierte al kernel en hipervisor usando VT-x/AMD-V. QEMU le pone los dispositivos virtuales. UT1.

**LVM-thin** · Almacenamiento con aprovisionamiento ligero: un disco de 50 GB ocupa solo lo escrito. Permite snapshots. Riesgo: prometer más de lo que hay. UT1.

**LXC** · Contenedores de sistema: comparten kernel con el host pero se comportan como una máquina completa. Más ligeros que una VM, menos aislados. UT1.

**Mínimo privilegio** · Dar a cada usuario, servicio o token solo los permisos que necesita para su tarea y nada más. UT6.

**Módulo (Terraform)** · Directorio con recursos reutilizables que se invoca con parámetros. UT5.

**nftables** · Cortafuegos del kernel Linux, sucesor de iptables. Tablas, cadenas con hooks y reglas. UT3.

**node_exporter** · Exporter de métricas del sistema operativo: CPU, memoria, disco, red. Puerto 9100. UT7.

**OpenTofu** · Fork libre de Terraform mantenido por la Linux Foundation desde el cambio de licencia de HashiCorp. Comandos y sintaxis intercambiables. UT5.

**OPNsense** · Distribución de cortafuegos basada en FreeBSD con interfaz web. La usamos como firewall entre zonas. UT3.

**Orquestador (CI)** · Servidor que recibe los cambios del repositorio, ejecuta el pipeline en agentes y guarda los resultados. Jenkins, GitLab CI, GitHub Actions. UT6.

**Paravirtualización / virtio** · Drivers en la VM que saben que están virtualizados y hablan directamente con el hipervisor en lugar de emular hardware real. Mucho más rápidos. UT1.

**Pipeline** · Cadena de etapas por la que pasa cada cambio: checkout, build, test, package, deploy. UT6.

**Plan (Terraform)** · Lista de lo que la herramienta crearía, cambiaría o destruiría para que el estado real coincida con el código. Se lee siempre antes de aplicar. UT5.

**Plantilla (Proxmox)** · VM marcada como base de clonado. No se puede arrancar, solo clonar. UT1.

**Port forward** · Regla NAT que redirige un puerto de la IP pública del firewall a una máquina interna. UT3.

**PromQL** · Lenguaje de consulta de Prometheus. UT7.

**Provider (Terraform)** · Plugin que sabe hablar con un proveedor concreto (Proxmox, AWS, DNS...). UT5.

**Proxy inverso** · Servidor que recibe las peticiones de los clientes y las reenvía a los servidores internos. Termina TLS y oculta la topología. nginx, Traefik, Caddy. UT3.

**Pull / push (monitorización)** · En pull, el servidor de métricas lee de cada objetivo (Prometheus). En push, cada máquina envía sus datos (Zabbix agent, Pushgateway). UT7.

**QEMU** · Emulador de máquinas que, junto con KVM, ejecuta las VM en Proxmox. UT1.

**Realm (Proxmox)** · Origen de los usuarios: pam (usuarios Linux del host), pve (usuarios propios), LDAP, AD. UT1.

**Registry** · Almacén de imágenes de contenedor. Docker Hub es uno público; en el laboratorio montamos uno local. UT6.

**Runner** · Nombre del agente en GitLab CI, Gitea Actions y GitHub Actions. UT6.

**Scrape** · Lectura periódica que Prometheus hace de cada exporter. UT7.

**SDN (Proxmox)** · Redes definidas por software: zonas, VNets y subredes que Proxmox gestiona desde el Datacenter. UT2.

**Serie temporal** · Una métrica con una combinación concreta de etiquetas y sus valores en el tiempo. UT7.

**Snapshot** · Foto del disco (y opcionalmente la memoria) de una VM en un instante. Permite volver atrás. No es una copia de seguridad. UT1.

**sops** · Herramienta para cifrar ficheros de secretos (YAML, JSON, env) y guardarlos en el repositorio. UT5.

**Stateful (cortafuegos)** · Cortafuegos que recuerda las conexiones abiertas y deja pasar las respuestas sin regla adicional. UT3.

**Subred pública / privada** · Pública si tiene ruta directa a Internet; privada si solo sale por NAT o no sale. UT2.

**Terraform** · Herramienta de aprovisionamiento declarativo de HashiCorp. Ver OpenTofu. UT5.

**TLS** · Protocolo de cifrado de las conexiones (el de https). Certificados, CA, SAN. UT3, UT6.

**Trivy** · Escáner de vulnerabilidades y configuraciones inseguras: imágenes, ficheros de IaC, repositorios. UT5.

**Umbral** · Valor a partir del cual una métrica se considera anómala y dispara una alerta. UT7.

**Virtualización anidada** · Ejecutar un hipervisor dentro de una VM. Lo que hacemos en el laboratorio para tener Proxmox en VirtualBox. UT1.

**VLAN (802.1Q)** · Etiqueta en las tramas Ethernet que separa redes lógicas sobre el mismo cable o bridge. UT1, UT2.

**VNet (Proxmox SDN)** · Red virtual dentro de una zona del SDN. Aparece como un bridge más al crear VM. UT2.

**VPC** · Nube privada virtual: red aislada definida por software dentro de una infraestructura compartida, con sus subredes, rutas y reglas. UT2.

**VXLAN** · Encapsulación que transporta redes de capa 2 sobre IP; permite extender una red virtual entre varios nodos. UT2.

**Webhook** · Petición HTTP que un sistema (Gitea, GitLab) envía a otro (Jenkins) cuando pasa algo, por ejemplo un push. UT6.

**Zona de disponibilidad** · Centro de datos independiente dentro de una región de nube. Una VPC abarca varias. UT2, UT4.

**Zona (SDN de Proxmox)** · Tipo de red virtual: simple, vlan, vxlan, evpn. UT2.
