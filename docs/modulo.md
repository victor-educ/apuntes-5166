# Presentación y evaluación

<p class="ut-meta">Módulo 5166 · Despliegue de plataformas de ejecución de contenedores · 120 h · Clases miércoles y viernes, 1 h 50 min por sesión</p>

## De qué va el módulo

La presentación del módulo, con los conceptos que vertebran el curso, está en la [página de inicio](index.md).

El módulo compañero, 5169 (Mantenimiento del sistema de contenedores desplegado), se ocupa de lo que pasa después: logs, copias de seguridad, vulnerabilidades y retirada. Los dos módulos comparten laboratorio y bastantes herramientas, así que lo que se monta aquí se sigue usando allí.

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
| k | Asegurar comunicaciones, accesos y repositorio de datos de la monitorización | UT7 + empresa |

## Cómo se evalúa

La nota sale de tres cosas: las prácticas evaluables de cada unidad, dos exámenes teórico-prácticos en el laboratorio y la formación en empresa.

| Evaluación | Qué entra | Peso |
|------------|-----------|-----:|
| Prácticas evaluables UT1, UT2, UT3, UT5 | Informe o repositorio al cierre de cada unidad | 40 % de la 1ª evaluación |
| Examen 1ª evaluación (29 ene 2027) | UT1 a UT5, prueba práctica en el laboratorio | 60 % de la 1ª evaluación |
| Prácticas evaluables UT6, UT7 | Repositorios y informes de pruebas | 40 % de la 2ª evaluación |
| Examen 2ª evaluación (16 abr 2027) | UT6 y UT7, prueba práctica en el laboratorio | 60 % de la 2ª evaluación |
| Formación en empresa | UT4, UT7b y UT8 con ficha de evidencias firmada por el tutor | Según el plan de FE del centro |

Cada práctica evaluable lleva su tabla de criterios y pesos al final de la unidad. Se entrega en la fecha de la sesión marcada; una entrega fuera de plazo sin causa justificada se corrige sobre el 50 %.

!!! examen "Lo que no se admite"
    Informes sin evidencias (capturas o salidas de comandos con fecha), repositorios con secretos en el historial y código que no se puede ejecutar desde cero siguiendo el README. En las tres situaciones la práctica vuelve al alumno sin nota hasta que lo corrija.

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
| Monitorización | Prometheus, Alertmanager, Grafana | Zabbix, Loki, servicios de nube |
| Análisis de seguridad | checkov, trivy, gitleaks | semgrep, Snyk |

## Sobre el material

Este material lo ha escrito Víctor Sellés para la asignatura, con el apoyo de Claude (el asistente de IA de Anthropic) en la redacción, ampliación y revisión, a partir de apuntes propios y de la planificación del curso. La revisión final es del autor, igual que los errores que queden, que se corrigen durante el curso.

## Metodología

Cada sesión de 110 minutos tiene una parte corta de explicación (entre 10 y 30 minutos, según la sesión) y una parte larga de laboratorio. El [calendario](calendario.md) y el plan de sesiones de cada unidad dicen, sesión a sesión, qué se explica y qué se practica, y de qué tipo es cada sesión: teoría y práctica, solo práctica, práctica evaluable o examen. Cada unidad está ordenada por sesiones: primero una introducción con los conceptos y herramientas de la unidad y el plan de sesiones, y después, sesión a sesión, los apartados de teoría que se explican ese día seguidos de la hoja de práctica, con objetivo, requisitos previos, pasos, comprobación y entrega, pensada para seguirla de arriba abajo en el laboratorio. Lo que va más allá de lo que se hace en clase está en la página [Para ampliar](ampliacion.md). Los apuntes cubren la explicación con más profundidad de la que da tiempo en clase, así que conviene leerlos antes de la sesión. En el laboratorio se trabaja por parejas sobre un hipervisor por persona; las prácticas evaluables son individuales salvo que se indique lo contrario.

Todo lo que se hace se documenta en el momento: una captura con la fecha, la salida de un comando, el fichero de configuración. Al final de cada unidad esa documentación es la práctica evaluable, así que el que lo va apuntando sobre la marcha tiene el trabajo casi hecho.
