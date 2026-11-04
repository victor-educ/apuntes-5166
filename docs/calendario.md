# Calendario de sesiones

<p class="ut-meta">Curso 2026-27 · Miércoles y viernes · 1 h 50 min por sesión · 43 sesiones (86 h) · Primera clase el 2 de octubre de 2026, examen de la 2ª evaluación el 24 de marzo y última clase el 9 de abril de 2027 · Formación en empresa del 19 de abril al 9 de junio de 2027</p>

Las fechas están calculadas sobre el calendario escolar de Castelló 2026-27. La primera clase es el viernes 2 de octubre de 2026 y arranca con la presentación de la asignatura. **La teoría y los exámenes terminan antes de Pascua**: la última sesión con explicación es la 40 (17 de marzo) y el examen de la 2ª evaluación es el 24 de marzo. Las dos sesiones posteriores a Pascua (7 y 9 de abril) se dedican al [proyecto entre asignaturas](#proyecto-entre-asignaturas), y el 9 de abril termina la parte en el centro, justo antes de la formación en empresa. No son lectivos el 9 y 12 de octubre, el 8 de diciembre, del 22 de diciembre al 7 de enero, del 1 al 5 de marzo (Magdalena), el 19 de marzo y la semana de Pascua (del 25 de marzo al 2 de abril); la semana del 12 al 16 de abril tampoco tiene clase, porque el curso en el centro cierra el 9. Si un día cae festivo por sorpresa, todo se corre una sesión.

Cada sesión dura 110 minutos y casi todas tienen la misma forma: una explicación corta al principio (entre 10 y 30 minutos, indicada en la columna de teoría) y el resto de laboratorio. Las sesiones marcadas como práctica no tienen explicación nueva. Las sesiones en **negrita** son evaluables. La práctica evaluable de la UT7 no tiene sesión propia: es una entrega que se cierra en la sesión 40 y se sube por Aules antes del examen del 24 de marzo.

## Vista de calendario

Cada día de clase lleva el color de su unidad. Al pasar el ratón por encima se ve qué se explica y qué se practica en esa sesión y qué se entrega; con un clic se va a esa sesión en los apuntes. Los días marcados con estrella son sesiones evaluables. Con el teclado, el tabulador recorre las sesiones y muestra el mismo detalle.

<div id="calendario-interactivo" data-src="../assets/sesiones.json" markdown="0"></div>

## Listado de sesiones

### Primera evaluación

| Nº | Fecha | UT | Sesión | Tipo | Se explica | Se practica |
|---:|-------|----|--------|------|------------|-------------|
| 1 | 2 oct | UT1 | Presentación e instalación del hipervisor | Teoría y práctica | Presentación del módulo, evaluación y laboratorio (20 min). Qué es virtualizar; hipervisores tipo 1 y 2; qué es Proxmox y por qué se usa (25 min). | Comprobar VT-x/AMD-V, crear la VM anidada e instalar Proxmox VE desde la ISO. Al final: consola web accesible en el puerto 8006. |
| 2 | 7 oct | UT1 | Configuración inicial de Proxmox | Teoría y práctica | Repositorios, almacenamiento (local, LVM-thin), bridges y realms de usuarios: qué es cada cosa y para qué sirve (25 min). | Cambiar repositorios y actualizar, crear usuario admin en realm pve, crear vmbr1 sin interfaz física, revisar los almacenes y dejar descargada la imagen cloud de la sesión 3. |
| 3 | 14 oct | UT1 | Primera VM y plantilla | Teoría y práctica | cloud-init, plantillas y clon completo frente a enlazado (20 min). | Crear la plantilla 9000 desde la imagen cloud de Debian con el agente QEMU y node_exporter dentro y las claves SSH del puesto y del nodo, clonar web01, app01 y mon01 (las dos últimas, con Docker, para Mantenimiento) y entrar por SSH desde el puesto. |
| 4 | 16 oct | UT1 | Laboratorio: plantilla y clonado (continuación) | Práctica | Sin explicación nueva | Terminar la A1.3 sobre el laboratorio rehecho: revisar la plantilla 9000, clonar web01, app01 y mon01 y entrar por SSH desde el puesto. |
| 5 | 21 oct | UT1 | Laboratorio: plantilla y clonado (continuación) | Práctica | Sin explicación nueva | Terminar la A1.3 sobre el laboratorio rehecho: revisar la plantilla 9000, clonar web01, app01 y mon01 y entrar por SSH desde el puesto. |
| 6 | 23 oct | UT1 | Laboratorio: plantilla y clonado (continuación) | Práctica | Sin explicación nueva | Terminar la A1.3 sobre el laboratorio rehecho: revisar la plantilla 9000, clonar web01, app01 y mon01 y entrar por SSH desde el puesto. |
| 7 | 28 oct | UT1 | Laboratorio: plantilla y clonado (continuación) | Práctica | Sin explicación nueva | Terminar la A1.3 sobre el laboratorio rehecho: revisar la plantilla 9000, clonar web01, app01 y mon01 y entrar por SSH desde el puesto. |
| 8 | 30 oct | UT1 | Laboratorio: plantilla y clonado (continuación) | Práctica | Sin explicación nueva | Terminar la A1.3 sobre el laboratorio rehecho: revisar la plantilla 9000, clonar web01, app01 y mon01 y entrar por SSH desde el puesto. |
| 9 | 4 nov | UT1 | VM vs LXC, snapshots y redes | Teoría y práctica | Cómo funcionan KVM/QEMU y virtio (10 min); LXC frente a VM, con números (5 min); qué es un snapshot y qué no es (5 min); bridge, NAT, VLAN-aware bridge y bond (5 min); demostración de VLAN en vmbr1 con tres VM, ping, bridge vlan show y ballooning (20 min). | Medir web01 frente a un LXC ct01 (arranque, RAM en el host, uname -r); snapshot de web01, instalar nginx y rollback; dejar stress-ng, fio e iperf3 instalados en web01 y app01 para la evaluable. |
| **10** | **6 nov** | **UT1** | **Práctica evaluable UT1** | Práctica evaluable | Aclaración del enunciado (10 min). | Medir CPU, disco y red en web01 y app01, solas y compitiendo; poner vmbr1 en VLAN aware; desplegar app-eval desde la plantilla con los parámetros dados y redactar el informe de capacidades y limitaciones. |
| 11 | 11 nov | UT2 | Diseño y VPC dev con SDN | Teoría y práctica | Qué es una VPC (5 min). Diseño de direccionamiento (5 min). SDN en Proxmox (10 min). | Completar el plano propio de los tres entornos a partir de una tabla a medio rellenar, justificar tamaños y comprobar solapes con ipcalc; crear en SDN la zona lab y las cuatro VNets de dev con DHCP; conectar web01 y db01 y comprobar IP e IPAM; crear el repositorio de entregas. |
| 12 | 13 nov | UT2 | Router de dev y comunicación entre zonas | Teoría y práctica | Servicios de red: enrutado, NAT, DHCP y DNS (15 min). Cómo se prueba una red (5 min). | Retirar el DHCP del SDN y arrancar router-dev, traído clonado de casa, con reenvío, NAT y dnsmasq; poner en marcha el puesto de administración con su ruta; reservas por MAC, api.dev.lab y dig; demostrar web01 a db01 por el 5432 con ping, traceroute, nc y tcpdump y documentar tres pruebas. |
| 13 | 18 nov | UT2 | pre y pro con un script; aislamiento | Teoría y práctica | Aislamiento por construcción y rutas blackhole (5 min); demostración del script idempotente que crea un entorno y de una llamada a la API con curl y token (20 min). | Crear pre y pro con el script, ejecutándolo dos veces; configurar router-pre como router-dev; poner las rutas blackhole; probar desde dev que no se llega a pre ni a pro y documentarlo; destruir las VM de pro con el script, también dos veces. |
| **14** | **20 nov** | **UT2** | **Práctica evaluable UT2** | Práctica evaluable | Aclaración del enunciado (10 min). | Cerrar la memoria: esquema, direccionamiento, configuración, scripts y las cinco pruebas documentadas. |
| 15 | 25 nov | UT3 | Modelo de seguridad por capas y publicación de un servicio | Teoría y práctica | Defensa en profundidad y zonas (5 min), cortafuegos con estado y reglas (5 min) y NAT: port forward y outbound (5 min). | Relevo de router-dev por OPNsense (traído instalado) con la regla 0, reglas de gestión y publicación de api.dev.lab por HTTPS, comprobada con curl y nmap desde fuera. |
| 16 | 27 nov | UT3 | DMZ interna y zona interna | Teoría y práctica | Publicar un servicio, con la base de datos abierta solo a la aplicación y el proxy inverso (10 min), y documentación operativa: matriz de reglas y procedimiento de cambios (5 min). | La cadena proxy, app01 y db01 con una regla por salto, traslado de app01 (10.10.2.10) y mon01 (10.10.0.20) a la VPC dev, el salto prohibido demostrado y la matriz de reglas empezada. |
| 17 | 2 dic | UT3 | Separación de clientes y pruebas de seguridad | Teoría y práctica | Separación de clientes (5 min), demostración de dos clientes en VLAN (10 min) y pruebas de seguridad (5 min). | Matriz de pruebas con evidencias fechadas, dos denegaciones localizadas con tcpdump, hallazgos tramitados con el procedimiento y cortafuegos sin reglas temporales. |
| **18** | **4 dic** | **UT3** | **Práctica evaluable UT3** | Práctica evaluable | Aclaración del enunciado (10 min). | Informe de la UT3: diagrama, matriz de reglas, matriz de pruebas, hallazgo, procedimiento y separación de clientes. |
| 19 | 9 dic | UT3 | Recuperación y repaso | Práctica | Dudas antes del examen (10 min). | Recuperar la evaluable de la UT3 y lo pendiente de las hojas que necesita (sobre todo el traslado de la A3.2), y después lo que quedó en «Si te sobra tiempo». |
| **20** | **11 dic** | **EX1** | **Examen 1ª evaluación** | Examen | Sin explicación nueva | Prueba teórico-práctica de UT1 a UT3 en el laboratorio. |

### Segunda evaluación

| Nº | Fecha | UT | Sesión | Tipo | Se explica | Se practica |
|---:|-------|----|--------|------|------------|-------------|
| 21 | 16 dic | UT5 | IaC: conceptos y primer despliegue | Teoría y práctica | Qué es IaC, declarativo frente a imperativo e idempotencia (15 min); OpenTofu, el ciclo init, plan, apply, cómo leer un plan y el proyecto mínimo (15 min). | En el puesto de administración: instalar OpenTofu, crear terraform@pve con su token, iniciar iac-lab con su remoto en Gitea y un proyecto mínimo que clona la plantilla; init, plan, apply, plan otra vez, destroy. |
| 22 | 18 dic | UT5 | Requisitos y variables | Teoría y práctica | De los requisitos del servicio a variables tipadas con validación (15 min). | Montar MinIO en mon01 para el estado y las copias; rellenar la tabla de requisitos del servicio y escribir variables.tf con tipos, descripciones y validaciones. |
| 23 | 8 ene | UT5 | VM con OpenTofu | Teoría y práctica | El lenguaje HCL: tipos, for_each y funciones (10 min); el provider bpg/proxmox con una VM completa y el camino de gestión a pre (10 min). | Abrir el camino de gestión a pre por router-pre; desplegar web01, app01 y db01 de pre con cloud-init, IP fija y prevent_destroy; comprobar en el plan que cambiar la memoria de app01 solo toca ese recurso. |
| 24 | 13 ene | UT5 | Módulos y estado | Teoría y práctica | Módulos y estructura del repositorio por entornos (5 min); el estado, el backend remoto en MinIO con bloqueo y cómo mover recursos (15 min). | Extraer el módulo vm, configurar el backend en MinIO, crear envs/dev y envs/pre. |
| 25 | 15 ene | UT5 | Ansible | Teoría y práctica | Inventario, playbooks, módulos idempotentes, roles y Vault (25 min). | Inventario desde tofu output, playbook que deja PostgreSQL en db01 y el servicio en app01 de pre; ejecutarlo dos veces y capturar que la segunda no cambia nada. |
| 26 | 20 ene | UT5 | Pruebas del despliegue | Teoría y práctica | Niveles de prueba del IaC, smoke tests y el test.sh de la unidad (15 min). | Poner en marcha test.sh, que encadena apply, playbook, smoke tests y chequeo de configuración; bajar la vCPU de db01 y parar el servicio para ver que devuelve error. |
| 27 | 22 ene | UT5 | Escaneo de seguridad | Teoría y práctica | Errores típicos del IaC; checkov, trivy config y gitleaks; cómo leer y suprimir un hallazgo (15 min). | Ejecutar checkov, trivy config y gitleaks sobre el repositorio, clasificar los hallazgos, comprobar con fallos provocados que los escáneres los ven, y tabularlos con su riesgo y la corrección prevista. |
| 28 | 27 ene | UT5 | Corrección de hallazgos | Teoría y práctica | Dónde viven los secretos (entorno, Ansible Vault, sops, Vault); qué hacer cuando gitleaks encuentra uno; .gitignore y pre-commit (10 min). | Corregir los hallazgos altos y críticos, justificar el resto, rotar el token si gitleaks lo encuentra en el historial e instalar pre-commit con gitleaks. |
| **29** | **29 ene** | **UT5** | **Práctica evaluable UT5** | Práctica evaluable | Aclaración del enunciado (10 min). | Cerrar el repositorio IaC: README, código modular con dos entornos, playbook, test.sh e informe de seguridad. |
| 30 | 3 feb | UT6 | CI y elección del orquestador | Teoría y práctica | Integración, entrega y despliegue continuos y piezas de un sistema de CI (15 min); criterios para elegir orquestador (10 min). | Demo en 30 minutos de Jenkins y Gitea Actions con el mismo hola mundo; tabla comparativa y justificación de media página. |
| 31 | 5 feb | UT6 | Instalación segura y plugins | Teoría y práctica | Cómo se instala Jenkins en contenedor, TLS con la CA del curso, roles y hardening (15 min); qué plugins hacen falta y por qué van en la imagen (5 min). | Desplegar Jenkins con TLS de la CA propia, roles admin/dev/lector y ejecutores del controlador a 0; revisar tres plugins antes de instalarlos, fijar las versiones en plugins.txt y dejar imagen, YAML y README en jenkins-config. |
| 32 | 10 feb | UT6 | Agentes | Teoría y práctica | Controlador frente a agentes; tipos de agente y etiquetas (10 min). | VM agent01 como agente SSH, cloud Docker para agentes efímeros, un job en cada tipo y comprobar en el log dónde ha corrido. |
| 33 | 12 feb | UT6 | Proyecto y credenciales | Teoría y práctica | Tipos de proyecto, credenciales con ámbito, webhooks (15 min). | Mudar Gitea a gitea01, usuario de servicio y token, Multibranch Pipeline del servicio, webhook con secreto y primer disparo por push. |
| 34 | 17 feb | UT6 | Pipeline I: build y test | Teoría y práctica | Sintaxis del Jenkinsfile declarativo: agent, stages, steps, post (15 min). | Jenkinsfile con Checkout y Build & Test en agente Docker, Dockerfile del servicio construido y probado a mano, informe JUnit, comprobación de stash y de options, una prueba que falla y el estado UNSTABLE. |
| 35 | 19 feb | UT6 | Pipeline II: package y ejecución condicional | Teoría y práctica | Registry local con TLS y cómo confía Docker en una CA propia (10 min); when, parallel e input (10 min). | Levantar el registry, etapa Package que sube la imagen etiquetada con el commit, parámetros ENV y RUN_DEPLOY usados de verdad, Lint en paralelo con Test, Package solo en main y Deploy provisional; recorrer la tabla de verdad de las cuatro combinaciones. |
| 36 | 24 feb | UT6 | Gestión de errores | Teoría y práctica | timeout, retry, catchError y cleanWs; notificación por Telegram o Slack (10 min). | Ejecutar uno a uno los cinco casos del plan de pruebas de fallos con su ficha de evidencias, corregir lo que no se comporte y repetirlo; configurar la notificación por Telegram o Slack. |
| 37 | 26 feb | UT6 | Mínimo privilegio y despliegue | Teoría y práctica | Usuarios de servicio, tokens con alcance y credenciales por carpeta (10 min); el despliegue a pre desde un job con su propia credencial (10 min). | Credencial ssh-pre solo en la carpeta pre y comprobar que un job de dev no la ve; inventario de credenciales; etapa Deploy que lleva la imagen a app01 de pre, ejecuta el playbook y test.sh, y recorrer sus dos caminos: despliegue correcto y fallo en el smoke test. |
| **38** | **10 mar** | **UT6** | **Práctica evaluable UT6** | Práctica evaluable | Aclaración del enunciado (10 min). | Cerrar jenkins-config, el Jenkinsfile completo, el informe de pruebas del pipeline y el inventario de credenciales, con las evidencias del 26 de febrero y sin desplegar. |
| 39 | 12 mar | UT7 | Ingesta de métricas | Teoría y práctica | Métricas, logs y trazas (5 min); elegir el gestor de ingesta y el modelo pull (5 min); la pila del curso en mon01 y los targets desde el inventario (5 min). | Targets de node_exporter generados con Ansible desde el inventario, plugin de Jenkins con su versión y su job; todos los targets de dev en UP, una consulta por fuente y la justificación del gestor de ingesta. |
| 40 | 17 mar | UT7 | Visualización, alertas y seguridad | Teoría y práctica | Métricas del orquestador de CI (10 min); seguridad de lo que añade la unidad (5 min). El repaso de PromQL, reglas, Alertmanager y Grafana se lee antes de clase. | Panel de KPI de la plataforma con tres paneles en Git, reglas propias y la alerta JenkinsDown en Mailpit; métricas de Jenkins solo para mon01, comprobación de lo que dejó Mantenimiento y repositorio sin secretos con su etiqueta de entrega. |
| **41** | **24 mar** | **EX2** | **Examen 2ª evaluación** | Examen | Sin explicación nueva | Prueba teórico-práctica de UT5 a UT7 en el laboratorio. |

### Proyecto entre asignaturas

Las dos sesiones que quedan después de Pascua se dedican a un proyecto conjunto con el resto de asignaturas del curso, que se plantea aparte. No tienen explicación nueva ni hoja en ninguna unidad.

| Nº | Fecha | UT | Sesión | Tipo | Se explica | Se practica |
|---:|-------|----|--------|------|------------|-------------|
| 42 | 7 abr | PRO | Proyecto entre asignaturas | Proyecto | Sin explicación nueva | Trabajo en el proyecto conjunto con el resto de asignaturas del curso, que se plantea aparte. |
| 43 | 9 abr | PRO | Proyecto entre asignaturas | Proyecto | Sin explicación nueva | Trabajo en el proyecto conjunto con el resto de asignaturas del curso, que se plantea aparte. |

## Formación en empresa (19 abr a 9 jun 2027)

| UT | Título | Horas | Evidencias |
|----|--------|------:|------------|
| UT4 | Nube pública: consola, CLI y SDK | 12 | Ficha de evidencias A4.1 a A4.5 y documento de cierre |
| UT7b | Monitorización avanzada: alertas, KPI y seguridad | 12 | Esquema de la pila de monitorización de la empresa, árbol de rutas de alertas comentado, dashboard de KPI de negocio, un SLO con su error budget y su alerta, y medidas de seguridad de la pila con una propuesta de mejora ([detalle](ampliacion.md#en-la-empresa-monitorizacion-avanzada)) |
| UT8 | Proyecto integrador y puesta en producción | 6 | Memoria del despliegue realizado en la empresa |

```mermaid
gantt
    title Despliegue de contenedores · curso 2026-27
    dateFormat  YYYY-MM-DD
    axisFormat  %b
    section Centro
    UT1 Hipervisor            :2026-10-02, 2026-11-06
    UT2 VPC                   :2026-11-11, 2026-11-20
    UT3 Seguridad por capas   :2026-11-25, 2026-12-09
    Examen 1ª ev              :milestone, 2026-12-11, 0d
    UT5 IaC                   :2026-12-16, 2027-01-29
    UT6 CI                    :2027-02-03, 2027-03-10
    UT7 Monitorización        :2027-03-12, 2027-03-17
    Examen 2ª ev              :milestone, 2027-03-24, 0d
    Proyecto                  :2027-04-07, 2027-04-09
    section Empresa
    FE                        :2027-04-19, 2027-06-09
```
