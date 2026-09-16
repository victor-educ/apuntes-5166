# Presentación y evaluación

<p class="ut-meta">Módulo 5166 · Despliegue de plataformas de ejecución de contenedores · 116 h · Clases miércoles y viernes, 2 h por sesión</p>

## De qué va el módulo

Un contenedor no corre en el aire. Debajo hay una máquina virtual, debajo de la máquina virtual hay un hipervisor, alrededor hay una red con sus subredes y sus cortafuegos, y por encima hay alguien (o algo) que decide cuándo se despliega una versión nueva y cómo se sabe si ha ido bien. Este módulo se ocupa de todo eso: de la plataforma sobre la que se ejecutan los contenedores, no de los contenedores en sí.

El módulo compañero, 5169 (Mantenimiento del sistema de contenedores desplegado), se ocupa de lo que pasa después: logs, copias de seguridad, vulnerabilidades y retirada. Compartimos laboratorio y bastantes herramientas, así que lo que montéis aquí lo vais a seguir usando allí.

## Resultados de aprendizaje

El currículo define cuatro resultados de aprendizaje. Los resumo con mis palabras y digo en qué unidad se trabaja cada criterio; el texto oficial está en el real decreto del curso de especialización.

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
| Examen 1ª evaluación (22 ene 2027) | UT1 a UT5, prueba práctica en el laboratorio | 60 % de la 1ª evaluación |
| Prácticas evaluables UT6, UT7 | Repositorios y informes de pruebas | 40 % de la 2ª evaluación |
| Examen 2ª evaluación (24 mar 2027) | UT6 y UT7, prueba práctica en el laboratorio | 60 % de la 2ª evaluación |
| Formación en empresa | UT4, UT7b y UT8 con ficha de evidencias firmada por el tutor | Según el plan de FE del centro |

Cada práctica evaluable lleva su tabla de criterios y pesos al final de la unidad. Se entrega en la fecha de la sesión marcada; una entrega fuera de plazo sin causa justificada se corrige sobre el 50 %.

!!! warning "Lo que no se admite"
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
| Análisis de seguridad | checkov, trivy, gitleaks | tfsec, semgrep |

## Sobre el material

Estos apuntes los he escrito yo apoyándome en Claude, el asistente de IA de Anthropic: partí de mis apuntes en Word y de la planificación de sesiones, y usé la herramienta para redactar, ampliar y revisar cada unidad. Lo digo porque no quiero que haya dudas sobre cómo se ha hecho. La revisión final y los errores que queden son míos, y los iré corrigiendo durante el curso.

## Metodología

Cada sesión de dos horas tiene una parte corta de explicación y una parte larga de laboratorio. Los apuntes cubren la explicación con más profundidad de la que da tiempo en clase, así que conviene leerlos antes de la sesión. En el laboratorio se trabaja por parejas sobre un hipervisor por persona; las prácticas evaluables son individuales salvo que se indique lo contrario.

Todo lo que se hace se documenta en el momento: una captura con la fecha, la salida de un comando, el fichero de configuración. Al final de cada unidad esa documentación es la práctica evaluable, así que el que lo va apuntando sobre la marcha tiene el trabajo casi hecho.
