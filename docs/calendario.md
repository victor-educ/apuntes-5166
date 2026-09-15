# Calendario de sesiones

<p class="ut-meta">Curso 2026-27 · Miércoles y viernes · 2 h por sesión · 45 sesiones en el centro (90 h) · Formación en empresa del 19 de abril al 9 de junio de 2027</p>

Las fechas están calculadas sobre el calendario escolar de Castelló 2026-27. No son lectivos el 9 y 12 de octubre, el 8 de diciembre, del 22 de diciembre al 7 de enero, del 1 al 5 de marzo (Magdalena), el 19 de marzo, del 25 de marzo al 2 de abril (Pascua) y el 1 de mayo. Si un día cae festivo por sorpresa, todo se corre una sesión.

Las sesiones en **negrita** son evaluables.

## Primera evaluación

| Nº | Fecha | UT | Sesión | Qué se hace |
|---:|-------|----|--------|-------------|
| 1 | 2 oct | UT1 | Presentación e instalación del hipervisor | Presentación del módulo, evaluación y laboratorio. Hipervisores tipo 1 y 2. Instalación de Proxmox VE en VM anidada. |
| 2 | 7 oct | UT1 | Configuración inicial de Proxmox | Bridge vmbr0, almacenamiento, usuarios y roles, consola web, repositorios. |
| 3 | 14 oct | UT1 | Primera VM y plantilla | VM Debian con cloud-init, conversión a plantilla, clonado linked/full, acceso SSH. |
| 4 | 16 oct | UT1 | VM vs LXC, snapshots y límites | LXC frente a VM. Snapshots y rollback. Anidada, flags de CPU, ballooning, cuotas. |
| 5 | 21 oct | UT1 | Redes en el hipervisor | NAT, bridge, VLAN-aware bridge y bonding. Dos VM en VLAN distintas. |
| **6** | **23 oct** | **UT1** | **Práctica evaluable UT1** | VM desde plantilla con parámetros dados e informe de capacidades y limitaciones. |
| 7 | 28 oct | UT2 | Diseño de la VPC | VPC, subred, zona de disponibilidad, DNS interno. Diseño de dev, pre y pro en papel. |
| 8 | 30 oct | UT2 | Proxmox SDN: zonas y VNets | Activar SDN, crear zona y VNets para dev. Conectar VM. |
| 9 | 4 nov | UT2 | IP, DHCP y DNS interno | VM router con dnsmasq: rangos, reservas, nombres. |
| 10 | 6 nov | UT2 | Comunicación entre zonas | Enrutado front a back dentro de dev. Conectividad y trazas. |
| 11 | 11 nov | UT2 | Segundo y tercer entorno; aislamiento | Replicar pre y pro. Comprobar con ping y nmap que no se ven. |
| 12 | 13 nov | UT2 | Automatizar con la CLI de Proxmox | qm, pct y pvesh por script. Antesala del IaC. |
| **13** | **18 nov** | **UT2** | **Práctica evaluable UT2** | Tres VPC documentadas: esquema, direccionamiento, scripts, evidencias de aislamiento. |
| 14 | 20 nov | UT3 | Modelo de seguridad por capas | DMZ externa, DMZ interna y zona interna. OPNsense entre las zonas. |
| 15 | 25 nov | UT3 | Reglas por zona y publicación de un servicio | Política deny por defecto; web en DMZ externa con port forward. |
| 16 | 27 nov | UT3 | DMZ interna y zona interna | API en DMZ interna, BD en zona interna, reglas mínimas, registro de tráfico. |
| 17 | 2 dic | UT3 | Separación de clientes | Dos clientes en VLAN distintas con reglas propias. |
| 18 | 4 dic | UT3 | Pruebas de seguridad | nmap y tcpdump desde cada zona; matriz origen/destino/puerto. |
| **19** | **9 dic** | **UT3** | **Práctica evaluable UT3** | Informe con matriz de reglas, pruebas de aislamiento y separación de clientes. |
| 20 | 11 dic | UT5 | IaC: conceptos y primer despliegue | Estado, idempotencia, declarativo frente a imperativo. OpenTofu con provider Proxmox. |
| 21 | 16 dic | UT5 | Requisitos del servicio | De los requisitos (cómputo, memoria, disco, red) a variables.tf y tfvars. |
| 22 | 18 dic | UT5 | VM con Terraform | Clonar plantilla con cloud-init desde código; outputs con IP; destroy y recreate. |
| 23 | 8 ene | UT5 | Módulos y estado | Módulo reutilizable; backend de estado compartido; entornos dev/pre/pro. |
| 24 | 13 ene | UT5 | Ansible: configuración post-despliegue | Inventario desde outputs; playbook que instala Docker y despliega el servicio. |
| 25 | 15 ene | UT5 | Pruebas del despliegue | Terraform + Ansible encadenados; smoke tests y chequeo de configuración. |
| 26 | 20 ene | UT5 | Seguridad del IaC | checkov, tfsec, trivy config; secretos fuera del código. |
| 27 | 22 ene | UT5 | Corrección de hallazgos | Corregir el escaneo, documentar lo aplicado y lo que no. |
| **28** | **27 ene** | **UT5** | **Práctica evaluable UT5** | Repositorio IaC que levanta VPC + VM + servicio, con pruebas y escaneo limpio. |
| **29** | **29 ene** | **EX1** | **Examen 1ª evaluación** | Prueba teórico-práctica de UT1 a UT5 en el laboratorio. |

## Segunda evaluación

| Nº | Fecha | UT | Sesión | Qué se hace |
|---:|-------|----|--------|-------------|
| 30 | 3 feb | UT6 | CI y elección del orquestador | Conceptos CI/CD. Comparativa Jenkins, GitLab CI, Gitea Actions. Justificar la elección. |
| 31 | 5 feb | UT6 | Instalar el orquestador | Jenkins en contenedor; TLS con certificado propio; usuarios, roles y permisos. |
| 32 | 10 feb | UT6 | Plugins y complementos | Git, Docker Pipeline, Credentials, Pipeline; configuración global. |
| 33 | 12 feb | UT6 | Agentes | Agente Docker; etiquetas; ejecutar en el agente y no en el controlador. |
| 34 | 17 feb | UT6 | Proyecto y credenciales | Proyecto, token de acceso al repositorio, primer job. |
| 35 | 19 feb | UT6 | Pipeline declarativo I | Jenkinsfile: checkout, build y test. |
| 36 | 24 feb | UT6 | Pipeline declarativo II | Package (imagen Docker) y push a registry local. Artefactos. |
| 37 | 26 feb | UT6 | Tareas y condiciones de ejecución | Parámetros, when, paralelismo, webhooks; en qué máquina corre cada tarea. |
| 38 | 10 mar | UT6 | Gestión de errores | post, retry, timeout, notificaciones. Provocar fallos y verificar. |
| 39 | 12 mar | UT6 | Mínimo privilegio | Usuario de servicio, tokens limitados, secretos en el orquestador. |
| 40 | 17 mar | UT6 | Pipeline que despliega | Etapa deploy con el IaC de la UT5 contra dev. Recorrer todos los caminos. |
| **41** | **24 mar** | **UT6** | **Práctica evaluable UT6** | Pipeline build → test → package → deploy con caminos de error probados. |
| 42 | 7 abr | UT7 | Ingesta de métricas | Prometheus, node_exporter y cAdvisor en compose; scrape del servicio y del orquestador. |
| 43 | 9 abr | UT7 | Visualización y alertas | Grafana: fuente de datos, panel con cinco KPI, una alerta con envío. |
| **44** | **14 abr** | **UT7** | **Práctica evaluable UT7** | Asegurar la monitorización y entregar panel y alerta funcionando. |
| **45** | **16 abr** | **EX2** | **Examen 2ª evaluación** | Prueba teórico-práctica de UT6 y UT7. Cierre de entregas antes de la FE. |

## Formación en empresa (19 abr a 9 jun 2027)

| UT | Título | Horas | Evidencias |
|----|--------|------:|------------|
| UT4 | Nube pública: consola, CLI y SDK | 12 | Ficha de evidencias A4.1 a A4.5 y documento de cierre |
| UT7b | Monitorización avanzada: alertas, KPI y seguridad | 12 | Reglas de alerta, panel de KPI, informe de seguridad de la pila |
| UT8 | Proyecto integrador y puesta en producción | 6 | Memoria del despliegue realizado en la empresa |

```mermaid
gantt
    title Módulo 5166 · curso 2026-27
    dateFormat  YYYY-MM-DD
    axisFormat  %b
    section Centro
    UT1 Hipervisor           :2026-10-02, 2026-10-23
    UT2 VPC                  :2026-10-28, 2026-11-18
    UT3 Seguridad por capas  :2026-11-20, 2026-12-09
    UT5 IaC                  :2026-12-11, 2027-01-27
    Examen 1ª ev             :milestone, 2027-01-29, 0d
    UT6 CI                   :2027-02-03, 2027-03-24
    UT7 Monitorización       :2027-04-07, 2027-04-14
    Examen 2ª ev             :milestone, 2027-04-16, 0d
    section Empresa
    UT4 + UT7b + UT8         :2027-04-19, 2027-06-09
```
