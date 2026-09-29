# Presentación y evaluación

<p class="ut-meta">Módulo 5166 · Despliegue de plataformas de ejecución de contenedores · 120 h oficiales · 43 sesiones de 1 h 50 min en el centro, miércoles y viernes</p>

## De qué va el módulo

La presentación del módulo, con los conceptos que vertebran el curso, está en la [página de inicio](index.md).

El módulo compañero, [5169 (Mantenimiento del sistema de contenedores desplegado)](https://victor-educ.github.io/apuntes-5169/modulo/), se ocupa de lo que pasa después: vigilar el servicio (métricas, logs, alarmas y la seguridad de la monitorización, que aquí la UT7 solo repasa), medirlo y probarlo, actualizarlo, tratar sus vulnerabilidades y retirarlo, y en la empresa explotar sus registros y sus copias de seguridad. Los dos módulos comparten laboratorio y bastantes herramientas: lo que se monta aquí se sigue usando allí, y la pila de monitorización de `mon01`, que aquel monta desde octubre, es sobre la que trabaja la UT7 de aquí.

## Resultados de aprendizaje

El currículo define cuatro resultados de aprendizaje. Las tablas siguientes los recogen en lenguaje llano e indican en qué unidad se trabaja cada criterio; el texto oficial está en el real decreto del curso de especialización.

**RA1. Despliega la infraestructura virtual sobre la que van a correr los contenedores.**

| CE | Qué se pide | Unidad |
|----|-------------|--------|
| a | Instalar y configurar un hipervisor conociendo sus capacidades y limitaciones | UT1 |
| b | Crear nubes privadas virtuales (VPC) diferenciadas por entorno y aisladas entre sí | UT2 |
| c | Asignar direccionamiento IP y DNS y comunicar las zonas de cada entorno | UT2 |
| d | Desplegar capas de seguridad (DMZ externa, DMZ interna, zona interna) según la exposición, probarlas y separar clientes | UT3 |

**RA2. Trabaja con una plataforma de nube pública desde la consola, la línea de comandos y el SDK.**

| CE | Qué se pide | Unidad |
|----|-------------|--------|
| a | Acceder a la consola de la plataforma | UT4 (empresa) |
| b | Configurar la interfaz de gestión | UT4 (empresa) |
| c | Instalar y configurar la CLI | UT4 (empresa) |
| d | Gestionar configuraciones y perfiles de la CLI | UT4 (empresa) |
| e | Instalar las librerías cliente con el gestor de dependencias del proyecto | UT4 (empresa) |

**RA3. Despliega infraestructura como código.**

| CE | Qué se pide | Unidad |
|----|-------------|--------|
| a | Recoger los requisitos del servicio y trasladarlos a variables | UT5 |
| b | Escribir código de despliegue funcional, modular e idempotente | UT5 |
| c | Ejecutar el despliegue con pruebas del servicio y chequeo de configuración | UT5 |
| d | Verificar la seguridad del código: escaneo, corrección y ausencia de secretos | UT5 |

**RA4. Configura un orquestador de integración continua y la monitorización del entorno.**

| CE | Qué se pide | Unidad |
|----|-------------|--------|
| a | Seleccionar el orquestador según el control de variables, limitaciones e integración | UT6 |
| b | Instalarlo con permisos, accesos y certificados | UT6 |
| c | Configurar plugins y complementos | UT6 |
| d | Crear el proyecto y las credenciales de acceso al repositorio | UT6 |
| e | Definir tareas parametrizadas: agente, condiciones de ejecución | UT6 |
| f | Construir el pipeline con etapas y scripts | UT6 |
| g | Probar el pipeline en todos sus caminos con gestión de errores | UT6 |
| h | Aplicar mínimo privilegio | UT6 |
| i | Seleccionar el gestor de ingesta y recolectar datos de hosts, contenedores y orquestador | UT7 |
| j | Construir paneles con KPI y alertas con envío | UT7 |
| k | Asegurar comunicaciones, accesos y repositorio de datos de la monitorización | UT7 (comprueba lo que dejó la UT3 de 5169) + empresa |

Los CE i, j y k se apoyan en lo que Mantenimiento ya ha trabajado, sobre todo en noviembre y diciembre: las alarmas de su UT2, la seguridad de la pila de monitorización de su UT3 y los indicadores de su UT4 (el reparto está en su [página de evaluación](https://victor-educ.github.io/apuntes-5169/modulo/)). Aquí se evalúa lo propio del despliegue: la elección justificada del gestor de ingesta, los targets que salen del inventario de Ansible, las métricas del orquestador, el panel de KPI de la plataforma con sus alertas y la seguridad de lo que añade la UT7 (métricas del orquestador solo para `mon01` y repositorio `monitoring` sin secretos). De lo que dejó Mantenimiento solo se comprueba que sigue activo.

## Cómo se evalúa

La nota sale de tres cosas: las prácticas evaluables de cada unidad, dos exámenes teórico-prácticos en el laboratorio y la formación en empresa. El primer examen (11 de diciembre de 2026) cierra la UT3 y con ella la primera evaluación; el segundo (24 de marzo de 2027) cierra la UT7 y con ella la teoría del curso, antes de Pascua. Después de Pascua, las dos últimas sesiones en el centro (7 y 9 de abril) se dedican a un proyecto conjunto con el resto de asignaturas del curso, que se plantea aparte.

| Evaluación | Qué entra | Peso |
|------------|-----------|-----:|
| Prácticas evaluables UT1, UT2 y UT3 | Informe o repositorio al cierre de cada unidad | 40 % de la 1ª evaluación |
| Examen 1ª evaluación (11 dic 2026) | UT1, UT2 y UT3, prueba práctica en el laboratorio | 60 % de la 1ª evaluación |
| Prácticas evaluables UT5, UT6 y UT7 | Repositorios, informe de pruebas del pipeline y panel exportado; la de la UT7 se entrega por Aules antes del examen | 40 % de la 2ª evaluación |
| Examen 2ª evaluación (24 mar 2027) | UT5, UT6 y UT7, prueba práctica en el laboratorio | 60 % de la 2ª evaluación |
| Formación en empresa | UT4, UT7b y UT8, con la [ficha de evidencias](#formacion-en-empresa) firmada por el tutor | En el RA de cada unidad |

La nota final del módulo pondera los cuatro resultados de aprendizaje como fija la programación didáctica: **40 % el RA1, 4 % el RA2, 19 % el RA3 y 37 % el RA4**. Cada RA toma la nota de las unidades donde se trabaja (las tablas de arriba): en las del centro, 60 % el examen y 40 % la práctica evaluable; en las de la empresa, la ficha de evidencias. Para aprobar hace falta un 5 en cada RA, y un RA suspendido se recupera solo, con los mismos instrumentos y pesos.

Cada práctica evaluable lleva su tabla de criterios y pesos al final de la unidad. Se entrega en la fecha de su sesión en el calendario, salvo la de la UT7, que no tiene sesión propia y se entrega antes del examen del 24 de marzo; una entrega fuera de plazo sin causa justificada se corrige sobre el 50 %.

!!! examen "Lo que no se admite"
    Informes sin evidencias (capturas o salidas de comandos con fecha), repositorios con secretos en el historial y código que no se puede ejecutar desde cero siguiendo el README. En las tres situaciones la práctica vuelve al alumno sin nota hasta que lo corrija.

### Formación en empresa

Tres unidades se cursan en la empresa, del 19 de abril al 9 de junio de 2027, con el tutor de empresa y sin el profesor delante. Se califican con la ficha de evidencias que firma el tutor, y cada una tiene escrito qué se hace y qué se entrega:

| Unidad | Horas | Qué se hace | Qué se entrega |
|--------|------:|-------------|----------------|
| [UT4 · Nube pública: consola, CLI y SDK](ut/ut4-nube-publica.md) | 12 | Las hojas A4.1 a A4.5 sobre la plataforma de nube de la empresa | Las evidencias de las cinco hojas y el documento de cierre, como pide su práctica evaluable |
| UT7b · Monitorización avanzada | 12 | El programa de [En la empresa: monitorización avanzada](ampliacion.md#en-la-empresa-monitorizacion-avanzada) | Las cinco evidencias que lista ese apartado |
| UT8 · Proyecto integrador y puesta en producción | 6 | Un despliegue real de la empresa, seguido de principio a fin y con la participación que permita el puesto | Memoria del despliegue con un apartado por capa (entorno de ejecución, red, seguridad, infraestructura como código, pipeline y monitorización) que diga qué usa la empresa y a qué equivale de lo visto en el curso |

## Herramientas del módulo

| Capa | Herramienta | Alternativas que se mencionan |
|------|-------------|-------------------------------|
| Hipervisor | Proxmox VE 9 (KVM + LXC) | VMware ESXi, Hyper-V, XCP-ng |
| Red virtual | Proxmox SDN, bridges Linux, dnsmasq | OpenStack Neutron |
| Cortafuegos | OPNsense | pfSense, nftables en Debian |
| Nube pública | La que decida la empresa | AWS, Azure, Google Cloud, Hetzner, OVH |
| IaC | OpenTofu (compatible con Terraform), Ansible | Pulumi, CloudFormation, Bicep |
| CI/CD | Jenkins LTS | GitLab CI, Gitea Actions, GitHub Actions |
| Registry y Git | Gitea, registry:2 | GitLab |
| Monitorización | Prometheus, Alertmanager, Grafana (la pila la monta 5169) | Zabbix, servicios de nube |
| Logs | Loki y Promtail (los monta y explota 5169) | ELK / OpenSearch, Fluent Bit |
| Análisis de seguridad | checkov, trivy, gitleaks | semgrep, Snyk |

### Dueño de cada herramienta compartida

Varias herramientas salen en las dos asignaturas. Cada una se explica a fondo en una sola sesión, la que da esta tabla; en cualquier otra aparición, de una asignatura o de la otra, el apartado abre con un recuadro de repaso que enlaza a esa sesión y dedica sus minutos solo a lo nuevo.

| Herramienta | Se explica a fondo en | Se instala en |
|-------------|-----------------------|---------------|
| nmap y tcpdump | [Sesión 10 de esta asignatura](ut/ut2-vpc.md#sesion-10-comunicacion-entre-zonas) (6 nov) | El puesto de administración y la VM que indique cada hoja |
| nftables en el propio host | [Sesión 17 de Mantenimiento](https://victor-educ.github.io/apuntes-5169/ut/ut3-seguridad-monitorizacion/#sesion-17-red-firewall-y-tls) (1 dic) | Cada host que se cierra |
| Trivy | [Sesión 25 de Mantenimiento](https://victor-educ.github.io/apuntes-5169/ut/ut4-kpi-pruebas/#sesion-25-estres-y-seguridad) (21 ene) | El puesto de administración (A4.6 de Mantenimiento) |
| gitleaks y pre-commit | [Sesión 28 de esta asignatura](ut/ut5-iac.md#sesion-28-correccion-de-hallazgos) (27 ene) | El puesto de administración |
| Seguridad de la pila de monitorización | [UT3 de Mantenimiento](https://victor-educ.github.io/apuntes-5169/ut/ut3-seguridad-monitorizacion/) (26 nov a 3 dic) | `mon01` |
| PromQL, reglas, Alertmanager, Grafana y KPI | [UT1](https://victor-educ.github.io/apuntes-5169/ut/ut1-observabilidad/), [UT2](https://victor-educ.github.io/apuntes-5169/ut/ut2-alarmas/) y [UT4](https://victor-educ.github.io/apuntes-5169/ut/ut4-kpi-pruebas/) de Mantenimiento | `mon01` |

## Sobre el material

Este material lo ha escrito Víctor Sellés para la asignatura, con el apoyo de Claude (el asistente de IA de Anthropic) en la redacción, ampliación y revisión, a partir de apuntes propios y de la planificación del curso. La revisión final es del autor, igual que los errores que queden, que se corrigen durante el curso.

## Metodología

Cada sesión de 110 minutos tiene una parte corta de explicación (entre 10 y 30 minutos, según la sesión) y una parte larga de laboratorio. El [calendario](calendario.md) y el plan de sesiones de cada unidad dicen, sesión a sesión, qué se explica y qué se practica, y de qué tipo es cada sesión: teoría y práctica, solo práctica, práctica evaluable, examen o proyecto. Cada unidad está ordenada por sesiones: primero una introducción con los conceptos y herramientas de la unidad y el plan de sesiones, y después, sesión a sesión, los apartados de teoría que se explican ese día seguidos de la hoja de práctica, con objetivo, requisitos previos, pasos, comprobación y entrega, pensada para seguirla de arriba abajo en el laboratorio. Lo que va más allá de lo que se hace en clase está en la página [Para ampliar](ampliacion.md). Los apuntes cubren la explicación con más profundidad de la que da tiempo en clase, así que conviene leerlos antes de la sesión. En el laboratorio se trabaja por parejas sobre un hipervisor por persona; las prácticas evaluables son individuales salvo que se indique lo contrario.

Todo lo que se hace se documenta en el momento: una captura con la fecha, la salida de un comando, el fichero de configuración. Al final de cada unidad esa documentación es la práctica evaluable, así que el que lo va apuntando sobre la marcha tiene el trabajo casi hecho.
