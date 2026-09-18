# Glosario

Términos que aparecen en el módulo, explicados en una o dos frases y con la unidad donde se tratan a fondo. Si un término no está, el buscador de la barra de arriba lo localiza: casi seguro que aparece en alguna unidad.

**ACK** · Bandera del segmento TCP con la que el receptor confirma lo que ha recibido. En un escaneo, un SYN al que contesta un SYN/ACK indica un puerto abierto. UT3.

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

**CLI (nube)** · Programa de línea de comandos del proveedor (`aws`, `az`, `gcloud`) que llama a la misma API que la consola web. Guarda su configuración en el directorio personal y las variables de entorno la sobrescriben. UT4.

**cloud-init** · Estándar para configurar una VM en su primer arranque: usuario, claves SSH, nombre, red, paquetes. Proxmox le pasa los datos por un disco virtual. UT1.

**Clon enlazado / completo** · Un clon enlazado comparte el disco base con la plantilla y solo guarda diferencias (rápido, para pruebas); el completo copia el disco entero (independiente, para producción). UT1.

**conntrack** · Tabla del kernel donde un cortafuegos con estado registra cada conexión abierta, para dejar pasar las respuestas sin reglas explícitas. UT3.

**Credencial (Jenkins)** · Secreto guardado cifrado en el orquestador y referenciado por su ID en el pipeline. Nunca se escribe en el Jenkinsfile. UT6.

**DMZ** · Zona desmilitarizada: subred entre Internet y la red interna donde van los servicios que deben verse desde fuera. Se habla de DMZ externa (proxy, web) y DMZ interna (aplicación). UT3.

**DNAT** · Traducción de la dirección de destino: el cortafuegos cambia la IP de destino de un paquete que entra para llevarlo a la máquina interna que corresponde. Es lo que hace un port forward. UT3.

**dnsmasq** · Servidor ligero de DHCP y DNS en un solo binario. El que se usa como router de entorno. UT2.

**Estado (Terraform)** · Fichero que relaciona cada recurso del código con el recurso real que existe en el proveedor. Sin él, Terraform no sabe qué ha creado. UT5.

**Exporter** · Programa que expone métricas de algo (el sistema, una BD, un servicio) en el formato de texto que Prometheus sabe leer. UT7.

**file_sd** · Descubrimiento de targets en el que Prometheus vigila ficheros JSON o YAML y recarga la lista de máquinas cuando cambian, sin reiniciar. Los escribe Ansible desde el inventario o el pipeline desde los outputs de OpenTofu. UT7.

**Formación en empresa (FE)** · Periodo del curso que se hace en una empresa con un tutor. En este módulo cubre la UT4, la UT7b y la UT8.

**gitleaks** · Busca secretos (tokens, claves, contraseñas) en un repositorio, incluido su historial. UT5.

**HCL** · Lenguaje de configuración de Terraform y OpenTofu. Bloques, atributos, expresiones. UT5.

**Hipervisor** · Software que crea y ejecuta máquinas virtuales repartiendo el hardware entre ellas. Tipo 1 va sobre el metal (Proxmox, ESXi); tipo 2 sobre un sistema operativo (VirtualBox). UT1.

**Idempotencia** · Propiedad de una operación que, aplicada dos veces, deja el mismo resultado que aplicada una. Base del IaC. UT5.

**IaC** · Infraestructura como código: describir máquinas, redes y reglas en ficheros versionados que una herramienta aplica. UT5.

**IAM** · El sistema que dice qué identidad puede hacer qué sobre qué recurso. En AWS son users, roles y policies; en Azure, Entra ID más RBAC; en Google Cloud, bindings entre principales y roles. UT4.

**IOMMU (VT-d / AMD-Vi)** · Extensión del hardware que permite ceder un dispositivo PCI entero a una VM (passthrough). UT1.

**IPAM** · Gestión de direcciones IP: registro de qué IP está asignada a qué máquina. El SDN de Proxmox lo integra. UT2.

**JCasC** · Jenkins Configuration as Code: plugin que permite definir toda la configuración de Jenkins en un YAML versionado. UT6.

**Jenkinsfile** · Fichero en el repositorio del proyecto que define el pipeline en sintaxis declarativa de Jenkins. UT6.

**JMESPath** · Lenguaje de consulta sobre JSON que usan los `--query` de las CLI de AWS y de Azure para quedarse con unos pocos campos y sacarlos en tabla. UT4.

**KPI** · Indicador clave: la métrica o fórmula que resume si un servicio va bien (disponibilidad, latencia p95, errores por minuto). UT7.

**KVM** · Módulo del kernel Linux que convierte al kernel en hipervisor usando VT-x/AMD-V. QEMU le pone los dispositivos virtuales. UT1.

**LVM-thin** · Almacenamiento con aprovisionamiento ligero: un disco de 50 GB ocupa solo lo escrito. Permite snapshots. Riesgo: prometer más de lo que hay. UT1.

**LXC** · Contenedores de sistema: comparten kernel con el host pero se comportan como una máquina completa. Más ligeros que una VM, menos aislados. UT1.

**MFA** · Segundo factor además de la contraseña: código de una app, llave física o passkey. Obligatorio en todo usuario de la nube de la empresa. UT4.

**MGMT** · La zona de gestión del laboratorio, `10.10.0.0/24`: desde ella se administran las demás zonas por SSH y en ella viven las máquinas de control. Ninguna otra zona entra en ella. UT2, UT3.

**Mínimo privilegio** · Dar a cada usuario, servicio o token solo los permisos que necesita para su tarea y nada más. UT6.

**Módulo (Terraform)** · Directorio con recursos reutilizables que se invoca con parámetros. UT5.

**MTU** · Tamaño máximo del paquete que admite una interfaz, 1500 bytes en Ethernet. Toda encapsulación (VXLAN, WireGuard) resta cabecera y obliga a bajarla en las VM, normalmente a 1450; olvidarlo se manifiesta como transferencias grandes que se cuelgan sin dar error. UT2.

**nftables** · Cortafuegos del kernel Linux, sucesor de iptables. Tablas, cadenas con hooks y reglas. UT3.

**NIC** · Tarjeta de red, física o virtual. Cada interfaz que se añade a una VM es una NIC más, conectada a un bridge o a una VNet. UT1, UT2.

**node_exporter** · Exporter de métricas del sistema operativo: CPU, memoria, disco, red. Puerto 9100. UT7.

**OpenTofu** · Fork libre de Terraform mantenido por la Linux Foundation desde el cambio de licencia de HashiCorp. Comandos y sintaxis intercambiables. UT5.

**OPNsense** · Distribución de cortafuegos basada en FreeBSD con interfaz web. Se usa como firewall entre zonas. UT3.

**Orquestador (CI)** · Servidor que recibe los cambios del repositorio, ejecuta el pipeline en agentes y guarda los resultados. Jenkins, GitLab CI, GitHub Actions. UT6.

**Paravirtualización / virtio** · Drivers en la VM que saben que están virtualizados y hablan directamente con el hipervisor en lugar de emular hardware real. Mucho más rápidos. UT1.

**Perfil (CLI)** · Conjunto con nombre de cuenta, región y credenciales que usa la CLI. Lo habitual es uno por entorno; se elige con una opción del comando o con una variable de entorno, que manda sobre el fichero. UT4.

**Pipeline** · Cadena de etapas por la que pasa cada cambio: checkout, build, test, package, deploy. UT6.

**Plan (Terraform)** · Lista de lo que la herramienta crearía, cambiaría o destruiría para que el estado real coincida con el código. Se lee siempre antes de aplicar. UT5.

**Plantilla (Proxmox)** · VM marcada como base de clonado. No se puede arrancar, solo clonar. UT1.

**Port forward** · Regla NAT que redirige un puerto de la IP pública del firewall a una máquina interna. UT3.

**PromQL** · Lenguaje de consulta de Prometheus. UT7.

**Provider (Terraform)** · Plugin que sabe hablar con un proveedor concreto (Proxmox, AWS, DNS...). UT5.

**Provisioning (Grafana)** · Fuentes de datos y dashboards definidos en ficheros que Grafana lee al arrancar, en lugar de configurarlos a clics. Es lo que permite versionarlos en Git. UT7.

**Proxy inverso** · Servidor que recibe las peticiones de los clientes y las reenvía a los servidores internos. Termina TLS y oculta la topología. nginx, Traefik, Caddy. UT3.

**Pull / push (monitorización)** · En pull, el servidor de métricas lee de cada objetivo (Prometheus). En push, cada máquina envía sus datos (Zabbix agent, Pushgateway). UT7.

**QEMU** · Emulador de máquinas que, junto con KVM, ejecuta las VM en Proxmox. UT1.

**Realm (Proxmox)** · Origen de los usuarios: pam (usuarios Linux del host), pve (usuarios propios), LDAP, AD. UT1.

**Región (nube)** · Conjunto de centros de datos de una zona geográfica, con catálogo de servicios y precios propios. Casi todos los recursos son regionales: mirar en la región equivocada es no ver nada. UT4.

**Registry** · Almacén de imágenes de contenedor. Docker Hub es uno público; en el laboratorio del curso se monta uno local. UT6.

**Regla de grabación** · Consulta PromQL que Prometheus ejecuta sola y cuyo resultado guarda como una serie nueva, para no repetir un cálculo caro en cada panel. Se nombra nivel:métrica:operación. UT7.

**RST** · Bandera TCP de reinicio. Es lo que responde un puerto cerrado y lo que devuelve una regla Reject, frente al silencio de un Drop. UT3.

**Runner** · Nombre del agente en GitLab CI, Gitea Actions y GitHub Actions. UT6.

**Scrape** · Lectura periódica que Prometheus hace de cada exporter. UT7.

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

**Terraform** · Herramienta de aprovisionamiento declarativo de HashiCorp. Ver OpenTofu. UT5.

**TLS** · Protocolo de cifrado de las conexiones (el de https). Certificados, CA, SAN. UT3, UT6.

**Trivy** · Escáner de vulnerabilidades y configuraciones inseguras: imágenes, ficheros de IaC, repositorios. UT5.

**TSDB** · Base de datos de series temporales: el almacén donde Prometheus guarda cada muestra con su marca de tiempo. Escribe bloques de dos horas y después los compacta. UT7.

**Umbral** · Valor a partir del cual una métrica se considera anómala y dispara una alerta. UT7.

**VE (Proxmox VE)** · *Virtual Environment*, el nombre completo del producto: la distribución basada en Debian que trae el hipervisor, el SDN y la consola web del laboratorio. UT1.

**Virtualización anidada** · Ejecutar un hipervisor dentro de una VM. Lo que se hace en el laboratorio del curso para tener Proxmox en VirtualBox. UT1.

**VLAN (802.1Q)** · Etiqueta en las tramas Ethernet que separa redes lógicas sobre el mismo cable o bridge. UT1, UT2.

**VM exit** · Salida del modo invitado: cada vez que la VM hace algo que el hipervisor tiene que atender (un acceso a un dispositivo emulado, una interrupción), la CPU devuelve el control al host. Cuesta del orden de un microsegundo, y reducir su número es lo que hace rápido a virtio. UT1.

**VNet (Proxmox SDN)** · Red virtual dentro de una zona del SDN. Aparece como un bridge más al crear VM. UT2.

**VPC** · Nube privada virtual: red aislada definida por software dentro de una infraestructura compartida, con sus subredes, rutas y reglas. UT2.

**VXLAN** · Encapsulación que transporta redes de capa 2 sobre IP; permite extender una red virtual entre varios nodos. UT2.

**Webhook** · Petición HTTP que un sistema (Gitea, GitLab) envía a otro (Jenkins) cuando pasa algo, por ejemplo un push. UT6.

**Zona de disponibilidad** · Centro de datos independiente dentro de una región de nube. Una VPC abarca varias. UT2, UT4.

**Zona (SDN de Proxmox)** · Tipo de red virtual: simple, vlan, vxlan, evpn. UT2.
