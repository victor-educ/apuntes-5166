# Bibliografía y enlaces

Cada unidad tiene su propia sección "Para ampliar" con enlaces concretos. Aquí está lo transversal: documentación de referencia, libros que merecen la pena y algunos sitios donde practicar. Todo en línea y gratuito salvo los libros.

## Documentación oficial

La primera fuente siempre. Cuando un comando de los apuntes no funcione en tu versión, la respuesta está aquí.

| Herramienta | Enlace | Qué mirar |
|-------------|--------|-----------|
| Proxmox VE | [pve.proxmox.com/pve-docs](https://pve.proxmox.com/pve-docs/) | Manual del administrador completo; capítulos de red, almacenamiento, cloud-init y SDN |
| Proxmox wiki | [pve.proxmox.com/wiki](https://pve.proxmox.com/wiki/Main_Page) | Guías prácticas y casos concretos |
| cloud-init | [cloudinit.readthedocs.io](https://cloudinit.readthedocs.io/) | Datasource NoCloud, módulos, depuración |
| OPNsense | [docs.opnsense.org](https://docs.opnsense.org/) | Interfaces, reglas, NAT, IDS |
| nftables | [wiki.nftables.org](https://wiki.nftables.org/) | Guía rápida y ejemplos de configuración |
| nmap | [nmap.org/book](https://nmap.org/book/) | El libro de referencia, gratis en línea |
| OpenTofu | [opentofu.org/docs](https://opentofu.org/docs/) | Lenguaje, CLI, estado, backends |
| Terraform | [developer.hashicorp.com/terraform](https://developer.hashicorp.com/terraform/docs) | Casi todo aplica a OpenTofu |
| Provider bpg/proxmox | [registry.terraform.io/providers/bpg/proxmox](https://registry.terraform.io/providers/bpg/proxmox/latest/docs) | Recursos VM, contenedor, SDN, ficheros |
| Ansible | [docs.ansible.com](https://docs.ansible.com/ansible/latest/) | Guía del usuario, índice de módulos, buenas prácticas |
| Jenkins | [jenkins.io/doc](https://www.jenkins.io/doc/) | Pipeline syntax, gestión de agentes, seguridad |
| GitLab CI | [docs.gitlab.com/ee/ci](https://docs.gitlab.com/ee/ci/) | Referencia de .gitlab-ci.yml |
| Gitea | [docs.gitea.com](https://docs.gitea.com/) | Actions, registry de paquetes, webhooks |
| Prometheus | [prometheus.io/docs](https://prometheus.io/docs/introduction/overview/) | Conceptos, PromQL, alertas, Alertmanager |
| Grafana | [grafana.com/docs/grafana](https://grafana.com/docs/grafana/latest/) | Dashboards, provisioning, alerting |
| AWS | [docs.aws.amazon.com](https://docs.aws.amazon.com/) | Guías de VPC, IAM, CLI |
| Azure | [learn.microsoft.com/azure](https://learn.microsoft.com/azure/) | Virtual Network, Entra ID, CLI |
| Google Cloud | [cloud.google.com/docs](https://cloud.google.com/docs) | VPC, IAM, gcloud |

## Libros

- Sobre Proxmox no hay libro que supere al manual oficial; no perdáis dinero ahí.
- Kief Morris, *Infrastructure as Code* (O'Reilly, 2ª ed.). El libro que explica por qué se hace IaC y cómo organizar el código. No es un manual de Terraform, es mejor que eso.
- Yevgeniy Brikman, *Terraform: Up & Running* (O'Reilly, 3ª ed.). Práctico y con opiniones. Todo aplica a OpenTofu.
- Jeff Geerling, *Ansible for DevOps*. Se compra en Leanpub a precio libre. Ejemplos reales y bien explicados.
- Betsy Beyer y otros, *Site Reliability Engineering* (Google). Gratis en [sre.google/books](https://sre.google/books/). Los capítulos de monitorización y alertas son la base de la UT7.
- Brendan Burns y otros, *Kubernetes: Up & Running*. No lo tocamos en este módulo, pero es lo siguiente que os vais a encontrar.

## Para practicar fuera del aula

- [KillerCoda](https://killercoda.com/) tiene escenarios interactivos de Linux, Docker y CI en el navegador.
- [Play with Docker](https://labs.play-with-docker.com/) para probar cosas rápidas sin instalar nada.
- [OverTheWire: Bandit](https://overthewire.org/wargames/bandit/) si la terminal de Linux no la tienes fina.
- [Subnetting practice](https://subnettingpractice.com/) para calcular subredes hasta hacerlo de cabeza.
- [Awesome Selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted) para elegir servicios que desplegar en vuestro laboratorio como proyecto.

## Comunidades y noticias

- [Foro de Proxmox](https://forum.proxmox.com/) en inglés; el hilo casi siempre existe ya.
- [r/homelab](https://www.reddit.com/r/homelab/) y [r/selfhosted](https://www.reddit.com/r/selfhosted/) para ver montajes reales y sus problemas.
- [Blog de Jeff Geerling](https://www.jeffgeerling.com/) sobre Ansible, hardware y homelab.
- [Blog de Grafana Labs](https://grafana.com/blog/) y [blog de Prometheus](https://prometheus.io/blog/) para las novedades de cada versión.
- [CNCF Landscape](https://landscape.cncf.io/) para situar cualquier herramienta que os suene en su categoría.

## Normativa

- Real decreto del curso de especialización que define los resultados de aprendizaje: búscalo en el [BOE](https://www.boe.es/) por el nombre del curso. El resumen de RA y CE con mis palabras está en la [página del módulo](modulo.md).
- Calendario escolar de la Comunitat Valenciana: [ceice.gva.es](https://ceice.gva.es/).

## Créditos de las imágenes

| Fichero | Autor y licencia | Origen |
|---------|------------------|--------|
| hipervisor-tipos.png | Scsami, CC0 | Wikimedia Commons |
| proxmox-cluster-summary.png | Proxmox Server Solutions GmbH, dominio público | Wikimedia Commons |
| cloud-init-logo.svg | Dominio público | Wikimedia Commons |
| vpc-esquema.svg | Sam Johnston, CC BY-SA 3.0 | Wikimedia Commons |
| dmz-un-firewall.svg, dmz-dos-firewalls.svg | Pbroks13, dominio público | Wikimedia Commons |
| opnsense-dashboard.png | Hagennos, CC BY-SA 4.0 | Wikimedia Commons |
| reverse-proxy.svg | H2g2bob, CC0 | Wikimedia Commons |
| jenkins-pipeline.png | Mark Waite, CC BY-SA 4.0 | Wikimedia Commons |
| jenkins-logo.png | Proyecto Jenkins, CC BY-SA 3.0 | jenkins.io |
| prometheus-arquitectura.svg | Proyecto Prometheus, Apache 2.0 | github.com/prometheus/prometheus |
| grafana-dashboard.png | Joel Kennedy, dominio público | Wikimedia Commons |
| Logos de Terraform, Ansible, Prometheus y Grafana | Marcas de sus titulares, uso nominativo | Wikimedia Commons |
