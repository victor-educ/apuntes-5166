# Para ampliar

Esta página recoge, unidad por unidad, dos cosas que no caben en las sesiones: los apartados que van más allá de lo que se hace en clase (no se explican ni los necesita ninguna hoja de práctica, pero son lo que os vais a encontrar en una empresa) y los enlaces para seguir por vuestra cuenta. Las unidades quedan así con lo que se da en cada sesión, y esto está aquí para cuando queráis ir más lejos o cuando algo de la formación en empresa os suene y queráis situarlo.

## UT1 · Virtualización e hipervisores

Material que va más allá de lo que se hace en clase en la [UT1](ut/ut1-virtualizacion.md): el clúster de Proxmox con migración en vivo, que no se monta en el laboratorio, y los enlaces de referencia de la unidad.

### Clúster y migración en vivo

No lo montaremos en el laboratorio (haría falta un segundo nodo con la misma red y, para que tenga sentido, almacenamiento compartido), pero es lo primero que veréis en una empresa y explica varias decisiones de diseño de esta unidad.

<figure markdown="span">
  ![Resumen de un clúster de Proxmox VE con varios nodos y sus gráficas de CPU, memoria y almacenamiento](img/proxmox-cluster-summary.png){ width="640" }
  <figcaption>Resumen de un clúster de tres nodos en Proxmox VE 8. Fuente: Proxmox Server Solutions GmbH, dominio público, vía Wikimedia Commons.</figcaption>
</figure>

Varios nodos Proxmox se unen en un clúster (`pvecm create`, `pvecm add`) que comparte `/etc/pve` a través de corosync, un protocolo de mensajería con quórum: para que el clúster tome decisiones necesita mayoría de nodos (por eso los clústeres son de tres o cinco, no de dos; con dos, si cae uno el otro se queda sin quórum y no os deja ni arrancar VM). Desde una sola consola web se administran todos los nodos.

La migración en vivo (`qm migrate 101 pve2 --online`) mueve una VM encendida de un nodo a otro sin que los usuarios lo noten: QEMU copia la RAM al destino mientras la VM sigue trabajando, va recopiando las páginas que se ensucian, y cuando queda poco por copiar pausa la VM unas decenas de milisegundos, transfiere el resto y el estado de la CPU, y la reanuda en el destino. Con almacenamiento compartido (NFS, Ceph, iSCSI) el disco no se mueve; con almacenamiento local Proxmox también puede copiarlo (`--with-local-disks`), pero tardará lo que tarde el disco. Aquí es donde el tipo de CPU importa: si la VM es `host` y los dos nodos tienen CPU distintas, la migración se rechaza o el invitado se rompe al llegar. Y sobre el clúster se monta la alta disponibilidad (HA): si un nodo muere, sus VM marcadas como HA se arrancan automáticamente en otro, cosa que también exige almacenamiento compartido y, en Proxmox, *fencing* por watchdog para asegurarse de que el nodo caído no siga escribiendo.

### Enlaces

- [Proxmox VE Administration Guide](https://pve.proxmox.com/pve-docs/pve-admin-guide.html): la referencia completa; los capítulos de Qemu/KVM Virtual Machines, Network Configuration y Storage cubren toda esta unidad con más detalle.
- [Wiki de Proxmox: Cloud-Init Support](https://pve.proxmox.com/wiki/Cloud-Init_Support): cómo integra Proxmox el datasource NoCloud, opciones de `qm set` y ejemplos de snippets con `cicustom`.
- [Wiki de Proxmox: Package Repositories](https://pve.proxmox.com/wiki/Package_Repositories): los repositorios enterprise, no-subscription y test, y el formato en cada versión.
- [Wiki de Proxmox: Nested Virtualization](https://pve.proxmox.com/wiki/Nested_Virtualization): activar la anidada en el host exterior y requisitos de la VM.
- [Documentación de cloud-init](https://cloudinit.readthedocs.io/): referencia de módulos, el datasource NoCloud, las etapas de arranque y la guía de depuración.
- [Imágenes cloud de Debian](https://cloud.debian.org/images/cloud/): variantes `generic`, `genericcloud` y `nocloud` y qué incluye cada una.
- [Documentación de KVM en el kernel](https://docs.kernel.org/virt/kvm/index.html): la API de `/dev/kvm` que usa QEMU; para entender qué es un VM exit de verdad.
- [Documentación de QEMU](https://www.qemu.org/docs/master/): dispositivos emulados, formato qcow2 y `qemu-img`.
- [Especificación virtio (OASIS)](https://docs.oasis-open.org/virtio/virtio/v1.2/virtio-v1.2.html): cómo funcionan las virtqueues; con leer la introducción se entiende por qué virtio gana a la emulación.
- [Proxmox Backup Server: documentación](https://pbs.proxmox.com/docs/): deduplicación, backups incrementales y retención, para cuando el laboratorio se convierta en algo que hay que proteger.
- [man 1 fio](https://man7.org/linux/man-pages/man1/fio.1.html) y [stress-ng](https://man7.org/linux/man-pages/man1/stress-ng.1.html): los parámetros de las herramientas de medida que usaréis en la práctica.

## UT2 · Nubes privadas virtuales (VPC)

Apartados y enlaces que van más allá de lo que se hace en clase en la unidad de nubes privadas virtuales, [UT2](ut/ut2-vpc.md).

### Zonas de disponibilidad

En nube, una región (eu-west-1, westeurope) tiene dos o tres zonas de disponibilidad: centros de datos físicamente separados, con alimentación y red independientes, unidos por fibra de baja latencia. La VPC abarca toda la región, pero cada subred vive en una zona concreta. Una aplicación que quiera sobrevivir a la caída de un edificio tiene que tener instancias en al menos dos subredes de zonas distintas, y un balanceador delante que reparta. Los proveedores lo cobran: el tráfico entre zonas se factura y los servicios gestionados "multi-AZ" cuestan más.

En el aula la zona de disponibilidad es el nodo Proxmox: si un nodo se apaga, caen sus VM y no las del otro. Quien tenga acceso a dos nodos en clúster lo simula con una zona VXLAN (para que la VNet exista en ambos) y una VM de cada capa en cada nodo. Quien tenga un solo nodo lo simula lógicamente: dos subredes por capa (`front-a` en `10.10.1.0/24`, `front-b` en `10.10.11.0/24`), una VM de la aplicación en cada una, y demuestra que apagar `web01` en front-a no tira el servicio porque `web02` en front-b sigue respondiendo. No es lo mismo (comparten el hardware), pero el diseño de red y el despliegue de la aplicación son exactamente los que se harían en nube, y eso es lo que se evalúa.

### Enlaces

- [Proxmox VE Administration Guide, capítulo SDN](https://pve.proxmox.com/pve-docs/chapter-pvesdn.html): la referencia de zonas, VNets, subnets, IPAM y DHCP integrado; leed la parte de "Simple zone" y "DHCP" antes de la sesión 8.
- [Proxmox VE API Viewer](https://pve.proxmox.com/pve-docs/api-viewer/): todas las rutas de la API con sus parámetros; es lo que `pvesh usage` muestra, pero navegable.
- [Proxmox wiki: Proxmox VE API](https://pve.proxmox.com/wiki/Proxmox_VE_API): autenticación con tickets y con tokens, y ejemplos con curl.
- [RFC 1918, Address Allocation for Private Internets](https://www.rfc-editor.org/rfc/rfc1918): cuatro páginas; explica por qué existen los rangos privados y qué obligaciones tiene quien los usa.
- [RFC 4632, CIDR](https://www.rfc-editor.org/rfc/rfc4632): la especificación del direccionamiento sin clases, por si queréis entender de dónde sale la notación /n.
- [RFC 7348, VXLAN](https://www.rfc-editor.org/rfc/rfc7348): el formato de encapsulación y el porqué de los 50 bytes de cabecera.
- [Página de manual de dnsmasq](https://thekelleys.org.uk/dnsmasq/docs/dnsmasq-man.html): larga pero es la fuente; buscad `dhcp-range`, `dhcp-host`, `expand-hosts` y `local`.
- [nftables wiki: Performing Network Address Translation](https://wiki.nftables.org/wiki-nftables/index.php/Performing_Network_Address_Translation_(NAT)): masquerade, SNAT y DNAT con ejemplos que usaremos tal cual en la UT3.
- [cloud-init, Network configuration](https://cloudinit.readthedocs.io/en/latest/reference/network-config.html): cómo cloud-init traduce el `--ipconfig0` de Proxmox a la configuración de red de la VM.
- [tcpdump(8) en man7.org](https://man7.org/linux/man-pages/man8/tcpdump.8.html) y [pcap-filter(7)](https://man7.org/linux/man-pages/man7/pcap-filter.7.html): la sintaxis de los filtros (`port`, `host`, `net`, `and`, `not`).

## UT3 · Seguridad por capas: DMZ externa, DMZ interna y zona interna

Apartado que en clase solo se menciona y la lista de enlaces de la [UT3](ut/ut3-seguridad-por-capas.md), la unidad del cortafuegos por zonas, el proxy inverso y la separación de clientes.

### IDS/IPS y WAF, dos capas más

El cortafuegos decide por puertos y direcciones. No sabe si lo que entra por el 443 es una petición legítima o un intento de explotación. Para eso hay dos capas adicionales que en el módulo solo mencionamos: OPNsense integra **Suricata** como IDS/IPS (Services → Intrusion Detection), que inspecciona el contenido de los paquetes contra reglas de firmas (ET Open, gratuitas) y puede alertar o bloquear. En la interfaz WAN de un laboratorio con tráfico cifrado ve poco; tiene más sentido en la DMZ externa, después del proxy, donde el tráfico ya va en claro. Y en el propio proxy inverso se puede añadir un **WAF** (Web Application Firewall) como ModSecurity o su reimplementación en Go, Coraza, con el conjunto de reglas OWASP CRS (Core Rule Set, la lista de patrones de ataque que mantiene la fundación OWASP), que bloquea patrones de inyección SQL, XSS (inyección de scripts en páginas web) y similares antes de que lleguen a la aplicación. Ambos generan falsos positivos; no los pongáis en modo bloqueo el primer día.

### Enlaces

- [Documentación de OPNsense: Firewall](https://docs.opnsense.org/manual/firewall.html): reglas, orden de evaluación, quick, flotantes y grupos, con capturas de cada campo.
- [Documentación de OPNsense: Aliases](https://docs.opnsense.org/manual/aliases.html): tipos de alias, incluidas las tablas URL y los aliases GeoIP.
- [Documentación de OPNsense: NAT](https://docs.opnsense.org/manual/nat.html): port forward, outbound, one-to-one y NPT, con el detalle de la regla de filtro asociada.
- [Documentación de OPNsense: Intrusion Prevention System](https://docs.opnsense.org/manual/ips.html): Suricata integrado, conjuntos de reglas y modo IPS.
- [Wiki de nftables](https://wiki.nftables.org/wiki-nftables/index.php/Main_Page): la referencia del proyecto; empezad por "Quick reference" y "Netfilter hooks".
- [nft(8) en man7.org](https://man7.org/linux/man-pages/man8/nft.8.html): sintaxis completa, familias, tipos de cadena y expresiones de conntrack.
- [Nmap Reference Guide: Port Scanning Basics](https://nmap.org/book/man-port-scanning-basics.html): la definición exacta de open, closed, filtered y los estados combinados.
- [nginx: módulo ngx_http_proxy_module](https://nginx.org/en/docs/http/ngx_http_proxy_module.html): todas las directivas proxy_*, incluidas las de cabeceras y buffers.
- [Documentación de Traefik](https://doc.traefik.io/traefik/): descubrimiento de servicios por etiquetas Docker; lo usaremos en la UT6.
- [Let's Encrypt: cómo funciona](https://letsencrypt.org/docs/): retos HTTP-01 y DNS-01, límites de emisión y clientes ACME.
- [step-ca de Smallstep](https://smallstep.com/docs/step-ca/): CA interna con ACME para automatizar certificados en zonas que no ven Internet.
- [Proxmox VE: Network Configuration](https://pve.proxmox.com/wiki/Network_Configuration): bridges VLAN aware, tags por VM y trunks.

## UT4 · Nube pública: consola, CLI y SDK

Material que va más allá de lo que se hace en la empresa en la unidad [UT4](ut/ut4-nube-publica.md): el modelo de responsabilidad compartida, que explica qué deja de ser tu problema al pasar de Proxmox a la nube, y los enlaces de ampliación.

### El modelo de responsabilidad compartida

Los tres grandes lo llaman modelo de responsabilidad compartida y lo resumen igual: el proveedor es responsable de la seguridad *de* la nube (centros de datos, hardware, hipervisor, red física, los servicios gestionados por dentro) y el cliente es responsable de la seguridad *en* la nube (sistema operativo de sus VM, parches, configuración de red, cortafuegos, identidades, cifrado de sus datos, y sobre todo qué expone a Internet).

En Proxmox lo tenías todo: si el hipervisor se quedaba sin parchear era problema tuyo. En la nube el hipervisor deja de ser tu problema, pero el grupo de seguridad con `0.0.0.0/0` al puerto 22 sigue siéndolo, y también lo es la clave de acceso que alguien subió a un repositorio público. La línea se desplaza según el servicio: en una VM (EC2, Azure VM, Compute Engine) administras el sistema operativo; en un contenedor gestionado sin servidor (Fargate, Container Apps, Cloud Run) solo administras la imagen y su configuración; en una base de datos gestionada ni siquiera ves el sistema operativo. Cuanto más gestionado, menos responsabilidad operativa y menos control.

### Enlaces

- <https://aws.amazon.com/compliance/shared-responsibility-model/>: el modelo de responsabilidad compartida explicado por AWS, con el diagrama que todo el mundo copia.
- <https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html>: formato de `~/.aws/config` y `~/.aws/credentials`, perfiles, `sso-session` y `role_arn`.
- <https://docs.aws.amazon.com/cli/latest/userguide/cli-usage-output-format.html>: formatos de salida y `--query` con JMESPath, con ejemplos que vale la pena copiar.
- <https://jmespath.org/tutorial.html>: el tutorial oficial de JMESPath, que sirve igual para `aws --query` y `az --query`.
- <https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html>: referencia de los elementos de una política IAM (Effect, Action, Resource, Condition).
- <https://boto3.amazonaws.com/v1/documentation/api/latest/guide/credentials.html>: la cadena de credenciales de boto3, en el orden exacto en que se evalúa.
- <https://learn.microsoft.com/cli/azure/azure-cli-configuration>: `az config`, ficheros de `~/.azure` y variables de entorno de la Azure CLI.
- <https://learn.microsoft.com/azure/role-based-access-control/overview>: cómo funcionan las asignaciones de rol, los ámbitos y la herencia en Azure RBAC.
- <https://learn.microsoft.com/python/api/overview/azure/identity-readme>: `DefaultAzureCredential` y el orden en que prueba cada fuente.
- <https://cloud.google.com/sdk/gcloud/reference/config/configurations>: referencia de las configurations de `gcloud`.
- <https://cloud.google.com/docs/authentication/application-default-credentials>: cómo buscan credenciales las librerías de Google (ADC) y por qué hay dos logins.
- <https://github.com/gitleaks/gitleaks>: instalación y uso de gitleaks, incluido el hook de pre-commit.

## UT5 · Infraestructura como código

Enlaces de referencia de la [UT5](ut/ut5-iac.md): documentación de OpenTofu, del provider de Proxmox, de Ansible y de los escáneres. Todo lo que se explica en clase y lo que necesitan las hojas de práctica sigue en la unidad; aquí solo está lo que va más allá.

### Enlaces

- https://opentofu.org/docs/language/ : referencia del lenguaje HCL (bloques, tipos, funciones, expresiones). Es la que hay que tener abierta mientras se escribe.
- https://opentofu.org/docs/cli/commands/state/ : todos los subcomandos de `tofu state`, con los avisos sobre cuándo no usarlos.
- https://opentofu.org/manifesto/ : el manifiesto OpenTF, para entender por qué existe el fork y qué se comprometieron a mantener.
- https://registry.opentofu.org/providers/bpg/proxmox/latest/docs : documentación del provider bpg/proxmox, recurso por recurso y por versión. La única fuente fiable para la sintaxis del bloque VM.
- https://pve.proxmox.com/wiki/User_Management : usuarios, roles, tokens y ACL de Proxmox; lo que necesitas para dar al token los permisos justos.
- https://docs.ansible.com/ansible/latest/playbook_guide/index.html : guía de playbooks, incluidas variables, precedencia, handlers y roles.
- https://docs.ansible.com/ansible/latest/collections/community/docker/docker_compose_v2_module.html : parámetros del módulo que despliega el compose del servicio.
- https://ansible.readthedocs.io/projects/lint/ : reglas de ansible-lint y perfiles; explica cada regla y cómo suprimirla.
- https://www.checkov.io/ y https://trivy.dev/ : documentación de los dos escáneres, con el catálogo de reglas y la sintaxis de supresión.
- https://github.com/gitleaks/gitleaks y https://github.com/getsops/sops : detección de secretos y cifrado de ficheros con age; los README son suficientes para empezar.
- https://cloudinit.readthedocs.io/ : lo que hace cloud-init en el primer arranque, para entender qué configura el bloque `initialization` y qué hacer cuando no aplica.

## UT6 · Orquestador de integración continua

Apartado que va más allá de lo que se hace en clase y enlaces para ampliar de la [UT6](ut/ut6-ci.md).

### El mismo pipeline en GitLab CI

Para que veáis que lo aprendido se traslada, este es el equivalente del `Jenkinsfile` en `.gitlab-ci.yml`. Las diferencias de modelo: no hay `agent`, hay `tags` que eligen runner e `image` que elige contenedor; no hay `parameters`, hay variables que se rellenan al lanzar a mano o que se fijan con `rules`; el `when` es `rules`; el `stash` no hace falta porque cada job clona el repositorio; y los informes JUnit se publican con `artifacts:reports`.

=== "Jenkinsfile"

    ```groovy
    stage('Build & Test') {
        agent { docker { image 'python:3.12'; label 'docker' } }
        steps { unstash 'src'; sh 'pip install -r requirements.txt && pytest --junitxml=report.xml' }
        post { always { junit 'report.xml' } }
    }
    ```

=== "GitLab CI"

    ```yaml
    # .gitlab-ci.yml
    stages: [test, package, deploy]

    variables:
      REGISTRY: registry.lab:5000
      IMAGE: $CI_REGISTRY_IMAGE       # o $REGISTRY/app si el registry no es el de GitLab
      DEPLOY_ENV:
        value: "dev"
        options: ["dev", "pre"]
        description: "Entorno de despliegue"

    default:
      tags: [docker]                  # runner con ejecutor docker
      interruptible: true

    test:
      stage: test
      image: python:3.12
      script:
        - pip install -r requirements.txt
        - pytest --junitxml=report.xml
      artifacts:
        when: always
        reports:
          junit: report.xml

    package:
      stage: package
      image: docker:27
      services: [docker:27-dind]
      rules:
        - if: $CI_COMMIT_BRANCH == "main"
      script:
        - echo "$REGISTRY_PASSWORD" | docker login -u "$REGISTRY_USER" --password-stdin $REGISTRY
        - docker build -t $REGISTRY/app:$CI_COMMIT_SHORT_SHA -t $REGISTRY/app:latest .
        - docker push --all-tags $REGISTRY/app

    deploy:
      stage: deploy
      tags: [terraform]               # runner con ejecutor shell en la máquina de despliegue
      rules:
        - if: $CI_COMMIT_BRANCH == "main"
          when: manual                # equivale a RUN_DEPLOY: alguien pulsa
      environment:
        name: $DEPLOY_ENV
      resource_group: $DEPLOY_ENV     # equivale a disableConcurrentBuilds por entorno
      timeout: 30m
      script:
        - cd envs/$DEPLOY_ENV && tofu init -input=false && tofu apply -auto-approve && cd -
        - ansible-playbook -i inventory/$DEPLOY_ENV.ini site.yml
        - bash test.sh
    ```

    `REGISTRY_USER`, `REGISTRY_PASSWORD` y `TF_VAR_pve_token` no van en el fichero: se crean en Settings → CI/CD → Variables marcadas como **Masked** (se ocultan en el log) y **Protected** (solo se inyectan en ramas y etiquetas protegidas, así una rama de un desarrollador no puede leer el token de Proxmox). Es el equivalente de las credenciales por carpeta de Jenkins. El `after_script` con limpieza y la notificación por fallo se hacen con integraciones del proyecto (Settings → Integrations) en vez de con un `post`.

### Enlaces

- [Pipeline Syntax (jenkins.io)](https://www.jenkins.io/doc/book/pipeline/syntax/): la referencia del declarativo; `when`, `parallel`, `matrix`, `post` y `options` con todos sus valores.
- [Using Docker with Pipeline](https://www.jenkins.io/doc/book/pipeline/docker/): la diferencia entre `agent { docker }`, `docker.build` y `docker.withRegistry`, con ejemplos.
- [Installing Jenkins with Docker](https://www.jenkins.io/doc/book/installing/docker/): la instalación oficial en contenedor y las opciones de `JENKINS_OPTS`.
- [Configuration as Code plugin](https://github.com/jenkinsci/configuration-as-code-plugin): documentación y una carpeta `demos/` con YAML de ejemplo para casi cada plugin.
- [Securing Jenkins](https://www.jenkins.io/doc/book/security/): CSRF, aislamiento del controlador, Agent → Controller security y cómo se publican los avisos.
- [Using credentials](https://www.jenkins.io/doc/book/using/using-credentials/): tipos, ámbitos y `withCredentials`, incluido el aviso sobre interpolación de Groovy.
- [Using Jenkins agents](https://www.jenkins.io/doc/book/using/using-agents/): SSH, inbound y el porqué de las etiquetas.
- [GitLab CI/CD YAML reference](https://docs.gitlab.com/ci/yaml/): para traducir cualquier construcción del `Jenkinsfile` a `.gitlab-ci.yml`.
- [Deploy a registry server (Distribution)](https://distribution.github.io/distribution/about/deploying/): TLS, autenticación y almacenamiento del registry.
- [Verify repository client with certificates (Docker)](https://docs.docker.com/engine/security/certificates/): el directorio `certs.d` y cómo Docker decide en quién confía.
- [Continuous Integration, Martin Fowler](https://martinfowler.com/articles/continuousIntegration.html): el texto de referencia sobre qué es CI y por qué; corto y sin herramientas.
- [User Management (Proxmox VE wiki)](https://pve.proxmox.com/wiki/User_Management): roles, tokens de API y *privilege separation* para el `jenkins@pve`.

## UT7 · Monitorización del entorno

Apartados de la [UT7](ut/ut7-monitorizacion.md) que no se explican en clase ni necesita ninguna hoja de práctica: la monitorización avanzada que se hace en la formación en empresa, la retención y el almacenamiento a largo plazo de Prometheus, y los enlaces para ampliar.

### En la empresa: monitorización avanzada

Las 12 horas de esta unidad en la formación en empresa sirven para ver la pila en un entorno que no cabe en tres VM. Lo que se espera que hagáis, o al menos observéis con quien lo hace:

- **Alertas con enrutado y silencios reales**: árbol de rutas por equipo y severidad, guardias (PagerDuty, Opsgenie o turnos en Telegram), inhibiciones entre capas (si cae el switch, no avisan los 40 hosts detrás), silencios ligados a ventanas de mantenimiento y revisión de las alertas que nadie atiende (una alerta un mes en firing sin que nadie la mire, sobra).
- **KPI de negocio**: métricas que no son de infraestructura (pedidos por minuto, tiempo de cola, usuarios activos) expuestas por la aplicación o leídas de la base de datos, en un dashboard para gente no técnica.
- **SLI/SLO y error budget**: al menos un SLO acordado con la empresa, el SLI en PromQL que lo mide, un panel con el presupuesto restante y una alerta de burn rate.
- **Seguridad de la pila**: cómo se autentica Grafana (LDAP, OAuth), quién ve qué (carpetas y permisos por equipo), cómo llegan las credenciales a los exporters, qué retención hay y si existe Thanos, Mimir o un servicio gestionado detrás.

Evidencias para la memoria de FE (una página por punto, con capturas anonimizadas si hace falta):

- [ ] Esquema de la pila de monitorización de la empresa (qué recoge, dónde se guarda, cuánto tiempo).
- [ ] Extracto del árbol de rutas de Alertmanager (o equivalente) comentado: quién recibe qué.
- [ ] Un dashboard de KPI de negocio, con la consulta de al menos un panel explicada.
- [ ] Un SLO escrito (SLI, objetivo, ventana), con el cálculo del error budget y la alerta asociada.
- [ ] Lista de medidas de seguridad de la pila y una propuesta de mejora justificada.

### Retención y almacenamiento

Conviene saber cuánto disco y memoria va a pedir la pila y qué pasa cuando los 30 días del laboratorio se quedan cortos; aquí va el cálculo aproximado y las herramientas del largo plazo.

La TSDB de Prometheus escribe bloques de 2 h que luego compacta en bloques mayores (hasta un 10 % de la retención). La compresión (delta de deltas para timestamps, XOR para valores) deja cada muestra en 1 a 2 bytes. Cálculo aproximado de disco: `series activas × muestras por segundo por serie × bytes por muestra × segundos de retención`. Para las 7 000 series del laboratorio a 15 s y 30 días: 7 000 / 15 × 1,5 × 2 592 000 ≈ 1,8 GB, más la WAL (write-ahead log, el diario donde apunta las muestras antes de formar bloque: las últimas 2 a 3 h sin compactar) y la memoria del head, que suele limitar antes que el disco.

Dos límites que conviene tener claros. Prometheus es un servidor único: no se agrupa ni replica; la alta disponibilidad se hace con dos Prometheus idénticos leyendo los mismos targets y Alertmanager deduplicando. Y la retención de años o las consultas globales sobre varios Prometheus no son su problema: para eso existen **Thanos** y **Grafana Mimir**, que reciben los bloques o las muestras por remote write (Prometheus las reenvía a otro servidor según las escribe) y las guardan en almacenamiento de objetos (S3, MinIO). Os los encontraréis en cualquier empresa mediana; en el curso quedan en mención.

### Enlaces

- [Prometheus: Overview](https://prometheus.io/docs/introduction/overview/): la documentación oficial, empezando por la arquitectura y el modelo de datos. Todo lo de esta unidad está ahí con más detalle.
- [Querying basics (PromQL)](https://prometheus.io/docs/prometheus/latest/querying/basics/) y [Functions](https://prometheus.io/docs/prometheus/latest/querying/functions/): la referencia de selectores, operadores y funciones; tenedla abierta mientras hacéis la A7.1.
- [Configuration (prometheus.yml)](https://prometheus.io/docs/prometheus/latest/configuration/configuration/): todas las opciones de scrape, descubrimiento (`file_sd_configs`, `docker_sd_configs`) y relabeling.
- [Alerting rules](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/) y [Alertmanager configuration](https://prometheus.io/docs/alerting/latest/configuration/): plantillas de anotaciones, rutas, inhibiciones y todos los receptores.
- [Securing Prometheus: TLS and basic auth](https://prometheus.io/docs/guides/tls-encryption/) y [web configuration](https://prometheus.io/docs/prometheus/latest/configuration/https/): el `web.config.file` que necesitáis en la práctica.
- [Prometheus storage](https://prometheus.io/docs/prometheus/latest/storage/): cómo funciona la TSDB, retención, snapshots y remote write.
- [Grafana documentation: Provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/): fuentes de datos y dashboards desde ficheros, la base para versionarlos en Git.
- [Grafana Alerting](https://grafana.com/docs/grafana/latest/alerting/): cuando queráis comparar con las reglas de Prometheus.
- [Node Exporter Full (dashboard 1860)](https://grafana.com/grafana/dashboards/1860-node-exporter-full/): el dashboard que importáis en la A7.2 y una buena cantera de consultas.
- [Google SRE Workbook: Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/): el método de burn rate y error budget que veréis en la empresa.
- [cAdvisor](https://github.com/google/cadvisor) y [node_exporter](https://github.com/prometheus/node_exporter): el README de cada uno tiene la lista de métricas y los flags de arranque (los colectores de node_exporter se activan y desactivan uno a uno).

