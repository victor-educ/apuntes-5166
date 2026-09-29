# UT5 · Infraestructura como código

<p class="ut-meta">18 h · Sesiones 21 a 29 · RA3 CE a, b, c, d</p>

En la UT2 la VPC se montó dos veces: primero a mano en la consola de Proxmox, y después con un script bash, el de la [A2.6](ut2-vpc.md#a26-script-de-creacion-sesion-12), que repetía los mismos pasos. El script fue un avance, pero tiene un defecto de fondo: describe cómo llegar, no dónde hay que estar. Ejecutado dos veces crea las cosas dos veces (o falla), y si alguien toca una VM a mano, el script no se entera. En esta unidad cambia el enfoque: se escribe en ficheros de texto el estado deseado (tres VM con estas CPU, estas IP, en estos puentes) y una herramienta calcula y aplica la diferencia. El playbook y el script de pruebas que salen de aquí son lo que ejecuta el pipeline de Jenkins en UT6 al desplegar en `pre`. Es la primera de las tres unidades que entran en la segunda evaluación, cuyo examen es la sesión 41, el 24 de marzo de 2027.

## Introducción

Esta unidad se lee en el orden en que se da en clase: primero los conceptos y las herramientas que se manejan, y después las ocho sesiones una detrás de otra, cada una con la teoría que se explica ese día y su hoja de práctica.

### Qué tienes que saber hacer al terminar

- Recoger los requisitos de un servicio (cómputo, memoria, disco, red, disponibilidad, backup) y convertirlos en variables tipadas y validadas, no en números sueltos por el código (CE a).
- Escribir código OpenTofu/Terraform funcional, dividido en módulos y con entornos separados, que aplicado dos veces no cambia nada, y un playbook de Ansible que deja el servicio corriendo con la misma propiedad (CE b).
- Encadenar despliegue, configuración, smoke tests y comprobación de configuración en un script que devuelve 0 o distinto de 0, y saber leer un plan antes de aplicarlo (CE c).
- Pasar checkov, trivy y gitleaks sobre el repositorio, corregir o justificar cada hallazgo, y tener el token de la API fuera del código y del historial de Git (CE d).

### Los conceptos de la unidad

Un jueves de diciembre, a las tres de la tarde, el nodo Proxmox del aula se reinicia por una actualización y la VPC dev montada en noviembre vuelve sin dos de las tres VM. Quien las creó a mano en UT2 tiene que recordar la RAM, el puente, la IP y la clave SSH de cada una, y pierde una tarde en dejarlo parecido. Con el script de la A2.6 va más rápido, pero el script no sabe qué sobrevivió: o se lanza entero y crea duplicados, o hay que ir comentando líneas. Lo que se busca cabe en una frase: que cualquiera del grupo, con un `git clone` y tres comandos, levante el entorno completo con el servicio funcionando, y que un script diga si está bien.

| Herramienta o concepto | Qué es, en una frase | Para qué se usa en esta unidad |
|----|----|----|
| OpenTofu (y Terraform) | Programa que lee ficheros con la infraestructura deseada, la compara con lo que existe y crea, cambia o borra lo que haga falta | Crear las VM del servicio en Proxmox a partir de código |
| HCL | El lenguaje de esos ficheros: bloques con atributos, parecido a un JSON con variables | Todo el código `.tf` de la unidad |
| Provider (bpg/proxmox) | El complemento que enseña a OpenTofu a hablar con una plataforma, como un driver de impresora | Que OpenTofu sepa crear y borrar VM en el Proxmox del aula |
| Estado y backend remoto (MinIO) | El fichero donde OpenTofu apunta qué ha creado; el backend es dónde se guarda, y MinIO un servidor de ficheros compatible con S3 | Que OpenTofu recuerde qué VM son suyas y que dos personas no se pisen |
| cloud-init | Lo que configura una VM recién clonada en su primer arranque (IP, usuario, clave SSH), visto en UT1 | Que las VM nazcan accesibles por SSH sin tocar la consola |
| Ansible | Programa que entra por SSH en las máquinas y las deja como se le pide (paquetes, ficheros, servicios), sin instalar nada en ellas | Dejar PostgreSQL en `db01` y el servicio del curso en `app01` de `pre` |
| Playbook e inventario | El playbook es la lista de tareas en YAML; el inventario, la lista de máquinas y sus grupos | Decir a Ansible qué hacer y en qué hosts |
| Ansible Vault, sops y age | Formas de guardar contraseñas cifradas dentro del repositorio | Saber elegir dónde vive un secreto; en el laboratorio la contraseña de la base no entra en Git, y cifrarla es el «Si te sobra tiempo» de la A5.8 |
| checkov y trivy config | Escáneres que leen el código y avisan de configuraciones inseguras, como un corrector ortográfico de seguridad | Encontrar puertos abiertos de más, versiones sin fijar y permisos excesivos |
| gitleaks | Escáner que busca contraseñas y tokens en los ficheros y en todo el historial de Git | Comprobar que ningún secreto ha entrado en el repositorio |
| pre-commit | Programa que ejecuta comprobaciones antes de cada commit y lo bloquea si fallan | Que un commit con un token dentro no llegue a existir |
| jq | Filtro de JSON para la línea de comandos | Convertir las salidas de OpenTofu en el inventario de Ansible |

**Cómo está organizada la unidad.** La unidad sigue las sesiones en orden y cada sesión trae primero la teoría que se explica y después su hoja de práctica. Todo se trabaja desde el puesto de administración. En la sesión 21 se instala OpenTofu y se crea y se destruye una VM para ver el ciclo `init`, `plan`, `apply`; en la 22 se monta MinIO y se pasa de los requisitos del servicio a variables con validación, y en la 23 se abre el camino de gestión hasta `pre`, se despliegan con el provider de Proxmox sus tres VM y se aprende a leer un plan. En la 24 la VM se empaqueta en un módulo, los entornos se separan en directorios y el estado pasa a MinIO con bloqueo. En la 25 Ansible deja PostgreSQL en `db01` y el servicio en `app01`; en la 26 un `test.sh` encadena despliegue, configuración y pruebas con un código de salida; en la 27 se escanea el repositorio y en la 28 se corrigen los hallazgos. La sesión 29 cierra el repositorio como práctica evaluable, y al final de la página queda la lista de errores frecuentes para consultar durante el trabajo.

!!! otra "Dónde se usa esto en la otra asignatura"
    - Esta unidad coincide con la [UT4 de Mantenimiento (KPI y pruebas)](https://victor-educ.github.io/apuntes-5169/ut/ut4-kpi-pruebas/), del 15 de diciembre al 28 de enero. Allí se prueba el servicio en `dev`, que por eso sigue encendido todo enero; aquí se crea desde código el entorno `pre`.
    - El entorno `pre` que se despliega en A5.3, se organiza en A5.4 (`envs/pre`) y recibe PostgreSQL y el servicio en A5.5 no es un ejercicio de un día: es el que la [UT7 de Mantenimiento](https://victor-educ.github.io/apuntes-5169/ut/ut7-actualizacion-vulnerabilidades/) estrena y actualiza en febrero (A7.4, 11 de febrero). A principios de febrero tiene que existir, desplegado con `tofu apply` y el playbook desde el repositorio y no a mano.
    - La [UT8 de Mantenimiento](https://victor-educ.github.io/apuntes-5169/ut/ut8-terminacion-segura/) (del 25 de febrero al 18 de marzo) da de baja ese entorno: el 11 de marzo, en su A8.3, retira el `prevent_destroy` que se pone aquí en la A5.3 y lanza `tofu destroy`. Necesita el repositorio `iac-lab`, el estado remoto y el token de `terraform@pve` tal como quedan aquí. El estado no se borra al terminar la práctica evaluable.

### Plan de sesiones

Cada sesión de 110 minutos empieza con una explicación corta y sigue con laboratorio. La columna «Se explica» recoge los apartados de teoría que se desarrollan en clase, con su duración aproximada; la columna «Se practica», el trabajo de laboratorio de esa sesión. Las sesiones marcadas solo como práctica no traen teoría nueva.

| Sesión | Fecha | Tipo | Se explica | Se practica |
|---:|-------|------|------------|-------------|
| [21](#sesion-21-iac-conceptos-y-primer-despliegue) | 16 dic | Teoría y práctica | Qué es IaC, declarativo frente a imperativo e idempotencia (15 min); OpenTofu, el ciclo init, plan, apply, cómo leer un plan y el proyecto mínimo (15 min). | En el puesto de administración: instalar OpenTofu, crear terraform@pve con su token, iniciar iac-lab con su remoto en Gitea y un proyecto mínimo que clona la plantilla; init, plan, apply, plan otra vez, destroy. |
| [22](#sesion-22-requisitos-y-variables) | 18 dic | Teoría y práctica | De los requisitos del servicio a variables tipadas con validación (15 min). | Montar MinIO en mon01 para el estado y las copias; rellenar la tabla de requisitos del servicio y escribir variables.tf con tipos, descripciones y validaciones. |
| [23](#sesion-23-vm-con-opentofu) | 8 ene | Teoría y práctica | El lenguaje HCL: tipos, for_each y funciones (10 min); el provider bpg/proxmox con una VM completa y el camino de gestión a pre (10 min). | Abrir el camino de gestión a pre por router-pre; desplegar web01, app01 y db01 de pre con cloud-init, IP fija y prevent_destroy; comprobar en el plan que cambiar la memoria de app01 solo toca ese recurso. |
| [24](#sesion-24-modulos-y-estado) | 13 ene | Teoría y práctica | Módulos y estructura del repositorio por entornos (5 min); el estado, el backend remoto en MinIO con bloqueo y cómo mover recursos (15 min). | Extraer el módulo vm, configurar el backend en MinIO, crear envs/dev y envs/pre. |
| [25](#sesion-25-ansible) | 15 ene | Teoría y práctica | Inventario, playbooks, módulos idempotentes, roles y Vault (25 min). | Inventario desde tofu output, playbook que deja PostgreSQL en db01 y el servicio en app01 de pre; ejecutarlo dos veces y capturar que la segunda no cambia nada. |
| [26](#sesion-26-pruebas-del-despliegue) | 20 ene | Teoría y práctica | Niveles de prueba del IaC, smoke tests y el test.sh de la unidad (15 min). | Poner en marcha test.sh, que encadena apply, playbook, smoke tests y chequeo de configuración; bajar la vCPU de db01 y parar el servicio para ver que devuelve error. |
| [27](#sesion-27-escaneo-de-seguridad) | 22 ene | Teoría y práctica | Errores típicos del IaC; checkov, trivy config y gitleaks; cómo leer y suprimir un hallazgo (15 min). | Ejecutar checkov, trivy config y gitleaks sobre el repositorio, clasificar los hallazgos, comprobar con fallos provocados que los escáneres los ven, y tabularlos con su riesgo y la corrección prevista. |
| [28](#sesion-28-correccion-de-hallazgos) | 27 ene | Teoría y práctica | Dónde viven los secretos (entorno, Ansible Vault, sops, Vault); qué hacer cuando gitleaks encuentra uno; .gitignore y pre-commit (10 min). | Corregir los hallazgos altos y críticos, justificar el resto, rotar el token si gitleaks lo encuentra en el historial e instalar pre-commit con gitleaks. |
| [29](#sesion-29-practica-evaluable) | 29 ene | Práctica evaluable | Aclaración del enunciado (10 min). | Cerrar el repositorio IaC: README, código modular con dos entornos, playbook, test.sh e informe de seguridad. |

## Sesión 21 · IaC: conceptos y primer despliegue

<p class="ut-meta" markdown>16 de diciembre · Teoría y práctica · <span class="dur" tabindex="0" aria-label="Infraestructura como código · 15 min&#10;OpenTofu: instalación y primer proyecto · 15 min&#10;A5.1 Primer despliegue · 80 min" data-dur="Infraestructura como código · 15 min&#10;OpenTofu: instalación y primer proyecto · 15 min&#10;A5.1 Primer despliegue · 80 min">:material-school:<i class="dur-barra" style="--teoria:27%"></i>:material-flask:</span></p>

Al acabar esta sesión hay OpenTofu instalado en el puesto de administración, un token de la API de Proxmox con los permisos justos, el repositorio `iac-lab` publicado en Gitea y un proyecto mínimo que crea una VM desde la plantilla, comprueba que un segundo `plan` no cambia nada y la destruye. Antes de tocar la terminal se ve qué es la infraestructura como código y por qué se exige idempotencia, y después el ciclo `init`, `plan`, `apply`, cómo se lee un plan y el proyecto mínimo que copia la hoja A5.1. El proyecto completo, con variables y tres VM, llega en la sesión 23.

### Infraestructura como código

Este primer apartado es de conceptos: qué significa describir la infraestructura en ficheros y por qué la idempotencia es la propiedad exigible a todo el código que se escriba.

IaC es describir la infraestructura (máquinas, redes, discos, reglas de cortafuegos, registros DNS) en ficheros de texto que una herramienta aplica automáticamente. Los ficheros van a un repositorio Git como cualquier otro código: se revisan en un pull request (la petición de revisión de cambios de GitLab o GitHub), se versionan, se prueban y se pueden volver a aplicar en otro sitio. Frente a clicar en la consola, aporta cuatro cosas concretas:

- Reproducible: dev, pre y pro salen iguales porque nacen del mismo código con distintos valores.
- Rápido: un entorno completo (tres VM, red, configuración del servicio) tarda minutos, y el tiempo lo pone la máquina, no una persona.
- Auditable: el historial de Git dice quién cambió qué y cuándo, y el plan dice qué va a pasar antes de que pase.
- Recuperable: si se pierde el entorno (un nodo Proxmox que muere, un becario que borra la VM equivocada), se vuelve a aplicar el código.

#### Declarativo frente a imperativo

|  | Declarativo | Imperativo |
|----|----|----|
| Qué se escribe | El estado final deseado ("quiero 3 VM así") | Los pasos ("crea VM, luego disco, luego red") |
| Quién calcula los cambios | La herramienta, comparando lo deseado con lo que existe | Quien escribe el script, que tiene que prever todos los casos |
| Segunda ejecución | No hace nada si ya está como se pidió | Repite los pasos, con lo que eso implique |
| Ejemplos | Terraform/OpenTofu, CloudFormation, Bicep, manifiestos de Kubernetes | Scripts bash, Ansible (parcialmente) |

Ansible está en la columna imperativa "parcialmente" porque un playbook es una lista ordenada de tareas (imperativo), pero cada tarea es declarativa: `state: present` no dice "instala", dice "que esté instalado", y el módulo comprueba antes de actuar. El resultado es que un playbook bien escrito se comporta como declarativo aunque se lea como una receta.

Lo que une a las dos columnas buenas es la idempotencia: aplicar el código dos veces deja el mismo resultado que una. Es lo que permite ejecutarlo sin miedo, meterlo en un pipeline que corre en cada commit y usarlo para reparar un entorno que alguien ha tocado a mano. Cuando una hoja de esta unidad pide "ejecútalo dos veces y captura la segunda", es esto lo que se comprueba.

#### Herramientas

- Terraform (HashiCorp) y su bifurcación libre OpenTofu ![Logo de Terraform](../img/terraform-logo.svg){ .logo-inline } aprovisionan infraestructura (VM, redes, DNS, recursos de nube) a través de providers (el complemento que sabe hablar con cada plataforma: Proxmox, AWS, Cloudflare), en HCL (su propio lenguaje de configuración). Es la herramienta de referencia del sector y la del curso.
- Ansible ![Logo de Ansible](../img/ansible-logo.svg){ .logo-inline } (Red Hat) configura lo que hay dentro de las máquinas (paquetes, ficheros, servicios) por SSH, sin agente, en YAML. Complementa a Terraform: uno crea la máquina, el otro la deja útil.
- Pulumi: mismo modelo que Terraform pero el código se escribe en Python, TypeScript o Go. Gusta a equipos de desarrollo que no quieren aprender otro lenguaje; en operaciones se ve menos.
- CloudFormation, Bicep y Deployment Manager: los lenguajes propios de AWS, Azure y GCP. Solo sirven en su nube; Terraform sirve en todas y en Proxmox, que es lo que hay en el laboratorio.

El patrón del curso, que es también el más habitual en empresas medianas: Terraform crea las VM en Proxmox con cloud-init (la configuración del primer arranque ya usada en la plantilla de UT1); Ansible instala PostgreSQL y Docker y despliega el servicio; un script de pruebas comprueba que todo responde.

#### Por qué existen Terraform y OpenTofu

Terraform, de HashiCorp, dejó de publicarse con licencia libre en 2023, y OpenTofu es la bifurcación que continuó con la licencia anterior, hoy alojada en la Linux Foundation; en clase se usa OpenTofu por eso, y en una empresa aparecen las dos. El lenguaje, los providers y los ficheros son los mismos: donde un tutorial diga `terraform plan` aquí se escribe `tofu plan`, y los providers se descargan de `registry.opentofu.org` en lugar de `registry.terraform.io`.

Cómo se llegó a la bifurcación y en qué se han separado las dos herramientas desde entonces está en [Para ampliar](../ampliacion.md#del-cambio-de-licencia-de-terraform-a-opentofu).

### OpenTofu: instalación y primer proyecto

Este apartado instala la herramienta y recorre su ciclo de trabajo: cómo se organiza un proyecto en ficheros, qué hacen `init`, `plan` y `apply`, cómo se lee un plan antes de decir que sí y cuál es el proyecto más pequeño que crea una VM. Cada actividad empieza con esos tres comandos.

OpenTofu se instala en el puesto de administración (10.10.0.50), y toda la unidad se trabaja desde ahí: es la máquina que llega a la vez a la API de Proxmox por la red del aula, a las zonas del laboratorio y a MinIO, donde vivirá el estado desde la sesión 24.

```bash
# OpenTofu en Debian/Ubuntu (instala el repositorio APT oficial)
curl -fsSL https://get.opentofu.org/install-opentofu.sh | sh -s -- --install-method deb
tofu version
```

En macOS `brew install opentofu`; en Windows, `winget install OpenTofu.Tofu`. Si en la empresa se usa Terraform, `terraform version` y el resto de esta unidad se lee igual.

#### Estructura de un proyecto

Un proyecto (en la jerga, un módulo raíz) es un directorio con ficheros `.tf`. OpenTofu los lee todos y los junta; los nombres son una convención, pero es la convención que todo el mundo espera:

| Fichero | Contenido |
|----|----|
| providers.tf | Qué providers se usan, con qué versión, y cómo se conectan |
| variables.tf | Variables de entrada con tipo, descripción, valor por defecto y validaciones |
| main.tf | Recursos y llamadas a módulos |
| outputs.tf | Valores que se exportan (IP, ID) para otros módulos, para Ansible o para leerlos por pantalla |
| terraform.tfvars | Valores de las variables para este entorno. No se sube si contiene secretos (y mejor que no los contenga) |
| .terraform.lock.hcl | Versiones exactas y hashes de los providers descargados. Este sí se sube |

#### El ciclo init, plan, apply

```mermaid
flowchart TB
    A["<b>tofu init</b><br><small>descarga el provider</small>"]:::act
    B["<b>tofu fmt · validate</b>"]:::act
    C["<b>tofu plan -out=plan.bin</b>"]:::act
    D{"<b>Leer el plan</b>"}:::dato
    E["<b>tofu apply plan.bin</b>"]:::act
    F["<b>terraform.tfstate</b><br><small>actualizado</small>"]:::dato
    G["<b>tofu destroy</b>"]:::riesgo
    A --> B --> C --> D
    D -- correcto --> E
    D -- sorpresa --> B
    E --> F --> C
    E -.-> G
    classDef act fill:#ea580c22,stroke:#ea580c,stroke-width:1.5px
    classDef pieza fill:#64748b22,stroke:#64748b,stroke-width:1.5px
    classDef dato fill:#2563eb22,stroke:#2563eb,stroke-width:1.5px
    classDef infra fill:#a1a1aa14,stroke:#a1a1aa,stroke-width:1.5px
    classDef ok fill:#16a34a22,stroke:#16a34a,stroke-width:1.5px
    classDef riesgo fill:#dc262622,stroke:#dc2626,stroke-width:1.5px
```

<p class="pie" markdown>El bucle es el trabajo diario. La flecha de «sorpresa» es la importante: si el plan no dice lo esperado, se vuelve al código, no se aplica.</p>

1. `tofu init`: descarga los providers al directorio `.terraform/`, escribe el fichero de bloqueo y configura el backend del estado (dónde se guarda el fichero en que OpenTofu apunta lo que ha creado; tiene su apartado más abajo). Hay que repetirlo al cambiar de backend o al añadir un provider o un módulo.
2. `tofu fmt` y `tofu validate`: formato canónico y comprobación sintáctica y de tipos, sin hablar con Proxmox. Son los dos primeros pasos de cualquier pipeline de IaC, y los hooks de pre-commit de la sesión 28.
3. `tofu plan`: lee el estado, consulta a la API qué existe de verdad (refresh), compara con el código y muestra qué crearía, cambiaría o destruiría. Siempre se lee antes de aplicar. Con `-out=plan.bin` el plan se guarda y `apply` ejecuta exactamente eso, no un plan recalculado.
4. `tofu apply`: aplica el plan. Sin fichero de plan lo recalcula y pide confirmación; con `-auto-approve` no la pide (solo en scripts y en CI).
5. `tofu destroy`: elimina todo lo que gestiona el estado. En las pruebas del laboratorio se usa a diario; en producción, y en el `pre` del curso, está protegido por permisos y por `prevent_destroy`.

#### Cómo leer un plan

El plan resume cada recurso con un símbolo, y hay que saber leerlos antes de escribir `yes`:

| Símbolo | Significado | Qué hacer |
|----|----|----|
| `+` create | Recurso nuevo | Normal en el primer apply |
| `~` update in-place | Cambia atributos sin recrear (memoria, nombre) | Normal; leer qué atributo |
| `-` destroy | Se elimina | Solo si se ha pedido |
| `-/+` replace | Se destruye y se crea de nuevo | Peligro: se pierde el disco y su contenido |
| `<=` read | Un `data` (bloque de solo lectura) que se consulta en apply | Inofensivo |

La línea `# forces replacement` junto a un atributo es la que más disgustos da. Significa que el provider no sabe cambiar ese atributo en caliente (por ejemplo el nodo donde vive la VM, el `vm_id` o el datastore del disco) y va a resolverlo destruyendo la VM y creando otra. Para una VM web sin estado es molesto; para `db01` es perder la base de datos. El resumen final `Plan: 1 to add, 0 to change, 1 to destroy` cuando se esperaba `0 to destroy` es motivo suficiente para parar. Dos protecciones: el bloque `lifecycle { prevent_destroy = true }` en los recursos con datos, que hace fallar el plan en lugar de destruir, y `tofu plan -detailed-exitcode` en CI, que devuelve 2 cuando hay cambios y permite exigir revisión humana.

#### El proyecto mínimo

El proyecto más pequeño que crea algo en Proxmox tiene tres ficheros y un solo recurso con los valores escritos a mano. Es el que copia la A5.1:

```hcl
# providers.tf
terraform {
  required_providers {
    proxmox = { source = "bpg/proxmox", version = "~> 0.60" }
  }
}

provider "proxmox" {
  endpoint  = var.pve_endpoint
  api_token = var.pve_token      # llega por TF_VAR_pve_token, nunca en un fichero
  insecure  = true               # certificado autofirmado del laboratorio
}

# variables.tf
variable "pve_endpoint" {
  type = string
}
variable "pve_token" {
  type      = string
  sensitive = true
}

# main.tf
resource "proxmox_virtual_environment_vm" "prueba" {
  name      = "prueba01"
  node_name = "pve"
  vm_id     = 150                  # primera de la franja de pruebas de dev (150 a 199)

  clone { vm_id = 9000 }           # plantilla cloud-init de UT1

  cpu    { cores = 1 }
  memory { dedicated = 1024 }
  network_device { bridge = "devfront" }
  agent { enabled = true }         # qemu-guest-agent, para leer la IP

  initialization {
    ip_config {
      ipv4 {
        address = "10.10.1.200/24"
        gateway = "10.10.1.1"
      }
    }
    user_account {
      username = "ops"
      keys     = [file("~/.ssh/id_ed25519.pub")]
    }
  }
}
```

El `vm_id` no es opcional en la práctica: sin él Proxmox da el primer ID libre, que cae en la franja de gestión de dev, y el [laboratorio](../laboratorio.md#convenciones) reserva de la 150 a la 199 para las pruebas. La `10.10.1.200` es del rango libre de front. El bloque `initialization` es lo que cloud-init aplica en el primer arranque, y la clave que mete es la del puesto de administración, que es desde donde se entra después. Qué es cada bloque y cómo se generaliza a tres VM con variables se ve en la sesión 23.

### A5.1 Primer despliegue (sesión 21)

<span class="et et-obj">Objetivo</span> Desde el puesto de administración, una VM clonada de la plantilla 9000 aparece en Proxmox creada por OpenTofu, un segundo `plan` dice `No changes` y `destroy` la elimina. De paso nacen dos cosas que se usan hasta marzo: el usuario `terraform@pve` con su token y el repositorio `iac-lab` en Gitea.

<span class="et et-pre">Antes de empezar</span> El puesto de administración (VM 105, 10.10.0.50, de la A2.4) encendido; entras en él desde tu puesto con `ssh ops@<IP de aula de admin01>`. La consola del nodo (Shell en la interfaz web, o SSH como `root`), Proxmox accesible en `https://192.168.1.50:8006/` (la IP del nodo en la red del aula, la de `vmbr0` de la UT1; sustitúyela por la tuya) y la plantilla cloud-init 9000. La Gitea de `mon01` en `http://gitea.lab:3001` con el usuario `ops`, la de la A2.6 de Mantenimiento. Se ha explicado [qué es IaC y la idempotencia](#infraestructura-como-codigo), [el ciclo init, plan, apply](#el-ciclo-init-plan-apply) y [el proyecto mínimo](#el-proyecto-minimo).

<span class="et et-pas">Pasos</span>

1. En el puesto de administración, instala OpenTofu y comprueba la versión:

    ```bash
    curl -fsSL https://get.opentofu.org/install-opentofu.sh | sh -s -- --install-method deb
    tofu version
    ```

2. En la consola del nodo, crea el usuario de OpenTofu con sus tres permisos y su token. El tercer permiso es el que deja conectar una VM a una VNet del SDN; sin él, el `apply` falla con `Permission check failed`:

    ```bash
    pveum user add terraform@pve --comment "OpenTofu del laboratorio"
    pveum acl modify /vms --users terraform@pve --roles PVEVMAdmin
    pveum acl modify /storage/local-lvm --users terraform@pve --roles PVEDatastoreUser
    pveum acl modify /sdn/zones/lab --users terraform@pve --roles PVESDNUser
    pveum user token add terraform@pve tofu --privsep 0
    ```

    La última orden muestra el secreto del token (`value`) una sola vez: cópialo en el momento.

3. En el puesto de administración, exporta el token en la terminal (solo en la sesión, nunca en un fichero) y comprueba que la API responde con su versión:

    ```bash
    export TF_VAR_pve_token='terraform@pve!tofu=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
    curl -k -H "Authorization: PVEAPIToken=$TF_VAR_pve_token" https://192.168.1.50:8006/api2/json/version
    ```

4. Crea el repositorio. Si `ls ~/.ssh/id_ed25519.pub` no encuentra nada, genera antes el par de claves del puesto de administración con `ssh-keygen -t ed25519`: es la clave pública que OpenTofu mete en cada VM que crea. El `.gitignore` va desde el primer día, antes del primer commit:

    ```bash
    mkdir ~/iac-lab && cd ~/iac-lab && git init -b main
    printf '.terraform/\n*.tfstate\n*.tfstate.*\nplan.bin\n' > .gitignore
    ```

    Crea `providers.tf`, `variables.tf` y `main.tf` copiando tal cual el [proyecto mínimo](#el-proyecto-minimo), y `terraform.tfvars` con la línea `pve_endpoint = "https://192.168.1.50:8006/"`.

5. `tofu init`, `tofu fmt`, `tofu validate`, `tofu plan -out=plan.bin`. Lee el plan entero y cuenta los atributos que lleva la VM aunque tú solo hayas escrito una docena; anota el número.
6. `tofu apply plan.bin`. Cuando termine, comprueba en la consola de Proxmox que `prueba01` (ID 150) existe y arranca, y entra desde el puesto de administración con `ssh ops@10.10.1.200`.
7. `tofu plan` otra vez y `tofu destroy`.
8. Publica el repositorio en la Gitea de `mon01`: crea el repositorio vacío con la API (`curl` te pide la contraseña de `ops` en Gitea) y sube el primer commit.

    ```bash
    curl -u ops -X POST -H 'Content-Type: application/json' \
      -d '{"name": "iac-lab", "private": true}' http://gitea.lab:3001/api/v1/user/repos
    git add . && git commit -m "A5.1 proyecto mínimo"
    git remote add origin http://gitea.lab:3001/ops/iac-lab.git
    git push -u origin main
    ```

<span class="et et-com">Comprobación</span> El segundo `plan` termina en `No changes. Your infrastructure matches the configuration.`, tras `destroy` la VM 150 no aparece en Proxmox y `git status` no muestra `.terraform/` ni ningún tfstate. Si `plan` o `apply` fallan con `401 authentication failure` o con `Permission check failed`, revisa los permisos del paso 2 en [Errores frecuentes](#errores-frecuentes-en-el-laboratorio).

<span class="et et-ent">Entrega</span> `iac-lab` en Gitea con los `.tf` y el `.gitignore` (el tfvars no contiene el token), y la salida del primer `plan` y la del segundo en `ut5/a51/` de `entregas-5166`. Desde hoy cada hoja de la unidad termina con `git add`, `git commit` y `git push` de `iac-lab`, y sus salidas van a `ut5/` de `entregas-5166`.

<span class="et et-ext">Si te sobra tiempo</span> Cambia `dedicated` a 2048 con la VM creada y mira si el plan marca `~` o `-/+`. Prueba `tofu graph | dot -Tsvg > graph.svg` si tienes graphviz instalado.

## Sesión 22 · Requisitos y variables

<p class="ut-meta" markdown>18 de diciembre · Teoría y práctica · <span class="dur" tabindex="0" aria-label="De los requisitos al código · 10 min&#10;validation y sensitive · 5 min&#10;A5.2 Requisitos y variables · 95 min" data-dur="De los requisitos al código · 10 min&#10;validation y sensitive · 5 min&#10;A5.2 Requisitos y variables · 95 min">:material-school:<i class="dur-barra" style="--teoria:14%"></i>:material-flask:</span></p>

Esta sesión no crea máquinas: escribe el `variables.tf` que las describirá, y deja montado de paso el almacén S3 del laboratorio, que es donde el estado vivirá a partir de la sesión 24. Se parte de la tabla de requisitos del servicio, con el origen de cada dato, y cada fila se convierte en una variable con tipo, descripción y validación, de modo que un tfvars mal escrito falle en `plan` con un mensaje propio. La sintaxis de `validation` y `sensitive`, que forma parte del lenguaje HCL que se ve entero en la sesión 23, se adelanta aquí porque la hoja A5.2 la necesita.

### De los requisitos al código

Antes de escribir una línea de HCL hay que saber qué necesita el servicio, y de dónde sale cada número. Para la aplicación del curso (web + API + PostgreSQL):

| Recurso | Requisito | Origen del dato |
|----|----|----|
| Cómputo | 2 vCPU la app, 1 vCPU el proxy, 2 vCPU la BD | Pruebas de carga previas / recomendación del fabricante |
| Memoria | 2 GB app, 1 GB proxy, 2 GB BD | Idem |
| Almacenamiento | 20 GB SO + 50 GB datos en disco aparte para la BD | Volumen de datos esperado × 3 |
| Red | Subredes front/back/data de la VPC; puertos 443, 8080, 5432 | Diseño UT2/UT3 |
| Disponibilidad | Dos instancias de app tras el proxy | Acuerdo de servicio |
| Backup | Snapshot diario de la BD | Política de la empresa |

La columna "origen del dato" no es decorativa. Cuando dentro de seis meses alguien pregunte por qué la BD tiene 4 GB, la respuesta tiene que estar en el README. Y cada fila acaba siendo una variable en el código, con tipo, descripción y una validación que impida valores absurdos. Un `memory = 512` para PostgreSQL debería fallar en `tofu plan`, no a las tres de la mañana en producción.

El laboratorio no cumple la tabla entera, y el README lo dice en vez de esconderlo: en `pre` cada VM lleva 1 GB y un solo disco de 20 GB, porque es lo que el nodo da a ese entorno; hay una sola instancia de app, y las copias de la BD las hace la asignatura de Mantenimiento. Esas filas se dejan como requisito documentado, con la diferencia y su motivo al lado.

### validation y sensitive

```hcl
variable "vms" {
  type = map(object({
    vmid   = number
    cores  = number
    memory = number
    disk   = number
    bridge = string
    ip     = string
  }))
  description = "VM a crear, con sus requisitos"

  validation {
    condition     = alltrue([for v in values(var.vms) : v.memory >= 1024])
    error_message = "Ninguna VM puede tener menos de 1024 MB."
  }
  validation {
    condition     = alltrue([for v in values(var.vms) : can(cidrhost(v.ip, 0))])
    error_message = "ip debe ser una dirección con prefijo, por ejemplo 10.10.1.10/24."
  }
}

variable "pve_token" {
  type      = string
  sensitive = true
}
```

Las validaciones se evalúan en `plan`, así que un tfvars mal escrito falla en segundos y con un mensaje propio. `sensitive = true` hace que el valor aparezca como `(sensitive value)` en el plan y en los outputs. No lo cifra: sigue en claro en el estado. Es una protección contra terminales y logs de CI, no contra quien pueda leer el tfstate.

### A5.2 Requisitos y variables (sesión 22)

<span class="et et-obj">Objetivo</span> Un `variables.tf` con tipos, descripciones y validaciones que rechaza con tu propio mensaje un tfvars mal escrito, y MinIO en marcha en la `10.10.0.30` con sus dos buckets, listo para la A5.4.

<span class="et et-pre">Antes de empezar</span> El proyecto `iac-lab` de A5.1 en el puesto de administración (sin VM creadas), con `TF_VAR_pve_token` exportado como en el paso 3 de la A5.1: sin él, `tofu plan` se para a pedirlo. Para el paso 1, SSH a `mon01` (10.10.0.20) como `ops`, con su pila en `/opt/monitoring`: entra en el puesto de administración con `ssh -A ops@<IP de aula de admin01>` (el `-A` le presta la clave de tu puesto sin copiarla) y desde ahí `ssh ops@10.10.0.20`. Se ha explicado [cómo pasar de los requisitos a variables](#de-los-requisitos-al-codigo); la sintaxis está en [validation y sensitive](#validation-y-sensitive).

<span class="et et-pas">Pasos</span>

1. **Preparación: el almacén S3 del laboratorio.** Monta MinIO en `mon01`. Hoy no se usa: es donde la [A5.4](#a54-modulos-y-estado-sesion-24) guardará el estado remoto de los dos entornos y donde la asignatura de Mantenimiento dejará sus copias desde febrero, y se monta ahora porque esas dos sesiones van justas de tiempo. Va como un contenedor más de la pila de `mon01` y no como VM propia: la máquina ya tiene Docker, está encendida desde octubre y así el presupuesto de memoria del nodo no sube. La dirección es la de la tabla del laboratorio, `10.10.0.30`, que se añade a `mon01` como segunda dirección de su tarjeta de gestión.

    !!! ojo "Si el profesor monta MinIO para toda el aula"
        Sáltate este paso entero. Apunta el endpoint que te dé (normalmente `http://10.10.0.30:9000`), tu
        clave de acceso y tu secreto, comprueba con el `mc ls` de la letra c que ves los buckets `tfstate`
        y `backups`, y sigue en el paso 2. El resto de la hoja no cambia.

    **a.** En `mon01`, añade la segunda dirección con una unidad de systemd, igual que la ruta del puesto de administración en la A2.4: la red de la VM la escribe cloud-init, y así no depende de sus ficheros. Comprueba antes el nombre de la tarjeta con `ip -br a`; en las VM del curso es `ens18`:

    ```bash
    sudo tee /etc/systemd/system/ip-minio.service > /dev/null <<'EOF'
    [Unit]
    Description=Segunda dirección de mon01 para MinIO
    After=network-online.target
    Wants=network-online.target
    Before=docker.service

    [Service]
    Type=oneshot
    RemainAfterExit=yes
    ExecStart=/sbin/ip addr replace 10.10.0.30/24 dev ens18

    [Install]
    WantedBy=multi-user.target
    EOF
    sudo systemctl enable --now ip-minio.service
    ip -br a show ens18      # tienen que salir la 10.10.0.20 y la 10.10.0.30
    ```

    El orden importa: si el contenedor arranca antes de que exista la 10.10.0.30, Docker falla con `cannot assign requested address`. El `Before=docker.service` lo asegura en cada arranque.

    **b.** En `/opt/monitoring`, añade el servicio al `compose.yml` de la pila y declara `minio_data:` en `volumes:`. El puerto se publica solo en la dirección nueva, para que la pila de monitorización siga escuchando en la 10.10.0.20 y no se mezclen:

    ```yaml
      minio:
        image: quay.io/minio/minio:latest
        command: server /almacen --console-address ":9001"
        restart: unless-stopped
        environment:
          MINIO_ROOT_USER: admin
          MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:?ponla en el .env}
        ports:
          - "10.10.0.30:9000:9000"
          - "10.10.0.30:9001:9001"
        volumes:
          - minio_data:/almacen
    ```

    La contraseña va en el `.env` junto al `compose.yml`, que es un secreto y no se sube: añádele (o créalo, si no existe) una línea `MINIO_ROOT_PASSWORD=` con una contraseña tuya, `chmod 600 .env`, y añade `.env` al `.gitignore` del repositorio `monitoring` si no está. La ruta interna es `/almacen` a propósito, para no confundirla con el `/data` de `db01`, que es otra cosa.

    **c.** Levanta el servicio y crea los dos buckets y las dos credenciales de trabajo. `mc` es el cliente de línea de comandos de MinIO y se usa como contenedor de un solo uso, sin instalar nada:

    ```bash
    cd /opt/monitoring && docker compose up -d minio
    set -a; . ./.env; set +a               # trae MINIO_ROOT_PASSWORD a esta terminal
    M="docker run --rm --network host -e MC_HOST_lab=http://admin:$MINIO_ROOT_PASSWORD@10.10.0.30:9000 quay.io/minio/mc"
    $M mb lab/tfstate                      # el estado de OpenTofu
    $M mb lab/backups                      # las copias restic, que empiezan en la UT7 de Mantenimiento
    $M admin user add lab tofu   'CambiaEsteSecreto1'
    $M admin user add lab restic 'CambiaEsteSecreto2'
    $M admin policy attach lab readwrite --user tofu
    $M admin policy attach lab readwrite --user restic
    $M ls lab                              # tfstate y backups
    ```

    Apunta los dos secretos en el gestor de contraseñas del puesto de administración. Ninguno de los dos se usa hoy: el de `tofu` lo pide la A5.4 el 13 de enero y el de `restic`, la [A7.4 de Mantenimiento](https://victor-educ.github.io/apuntes-5169/ut/ut7-actualizacion-vulnerabilidades/) el 11 de febrero; volver a MinIO a crearlos entonces cuesta más que crearlos ahora.

    **d.** De vuelta en el puesto de administración (10.10.0.50), que es desde donde la A5.4 usará el estado remoto, comprueba que el servicio responde:

    ```bash
    curl -s -o /dev/null -w '%{http_code}\n' http://10.10.0.30:9000/minio/health/live   # 200
    ```

    !!! empresa "Dónde vive esto en producción"
        Juntar el almacén de copias con la máquina que vigila no se hace fuera de un laboratorio: si se
        pierde `mon01` se pierden a la vez la monitorización y las copias. Aquí se acepta porque el nodo
        tiene 16 GB en el pico de febrero y una VM más no cabe. En una empresa el almacén de objetos es un
        servicio aparte, en otra máquina y a poder ser en otro edificio, y además con versionado y Object
        Lock, que es lo que se comprueba en la UT6 de Mantenimiento.

2. Copia la tabla de requisitos del apartado "De los requisitos al código" a un `README.md` en la raíz de `iac-lab` y rellénala para el servicio del curso (web + API + PostgreSQL). Cada fila lleva su origen del dato; si no lo sabes, escribe de dónde lo sacarías. Debajo, en dos o tres líneas, las diferencias del laboratorio con su motivo, como las cuenta el apartado.
3. Convierte las filas en variables. Escribe `variables.tf` copiando del apartado [validation y sensitive](#validation-y-sensitive) la variable `vms`, que ya trae sus dos validaciones (memoria mínima de 1024 e `ip` con prefijo), y `pve_token`; añade `pve_endpoint` como en la A5.1 y pon `description` a las tres. Comprueba que cada fila de cómputo, memoria, almacenamiento y red de tu tabla tiene su campo en `vms`.
4. Añade una tercera validación tuya al bloque `vms`, sobre disco (por ejemplo `disk >= 10`) o sobre `bridge` (que esté en `["devfront", "devback", "devdata", "prefront", "preback", "predata"]` con `contains`), con su propio `error_message`.
5. Escribe `terraform.tfvars` con las tres VM del servicio en el entorno `pre`: ID 210, 220 y 230, puentes `prefront`, `preback` y `predata`, IP `10.20.1.10/24`, `10.20.2.10/24` y `10.20.3.10/24`, 1024 MB y 20 GB cada una, y las vCPU de tu tabla. Sin recursos aún, `main.tf` queda vacío: borra el recurso `prueba` de la A5.1.
6. `tofu fmt`, `tofu validate`, `tofu plan`. Guarda la salida.
7. Copia el tfvars a `malo.tfvars`, pon `memory = 512` en `db01` y ejecuta `tofu plan -var-file=malo.tfvars`. Guarda la salida.

<span class="et et-com">Comprobación</span> `tofu validate` sale con `Success!`, el `plan` correcto no da errores y el `plan` con `malo.tfvars` falla en segundos mostrando tu `error_message`, no un error genérico del provider. El `$M ls lab` del paso 1 lista `tfstate` y `backups`, y el `curl` de salud responde `200`.

<span class="et et-ent">Entrega</span> En `iac-lab`, `README.md` con la tabla, `variables.tf` y `terraform.tfvars`. En `ut5/a52/` de `entregas-5166`, `malo.tfvars`, las dos salidas de `plan` y la salida del `$M ls lab` del paso 1.

<span class="et et-ext">Si te sobra tiempo</span> Abre `tofu console` y prueba `cidrhost(var.vms["db01"].ip, 1)` y `{ for k, v in var.vms : k => v.memory }` contra tus variables.

## Sesión 23 · VM con OpenTofu

<p class="ut-meta" markdown>8 de enero · Teoría y práctica · <span class="dur" tabindex="0" aria-label="El lenguaje HCL · 10 min&#10;Provider Proxmox y una VM completa · 10 min&#10;A5.3 VM completas · 90 min" data-dur="El lenguaje HCL · 10 min&#10;Provider Proxmox y una VM completa · 10 min&#10;A5.3 VM completas · 90 min">:material-school:<i class="dur-barra" style="--teoria:18%"></i>:material-flask:</span></p>

Al acabar, el puesto de administración llega a `pre` a través de `router-pre`, y `web01`, `app01` y `db01` corren en ese entorno, creadas por un solo bloque `resource` con `for_each`, configuradas por cloud-init y protegidas con `prevent_destroy`; queda visto además un plan que cambia la memoria de una sola VM sin recrearla. Primero se repasa el lenguaje HCL (tipos de bloque, tipos de dato, `for_each` y las funciones de red) y después el proyecto completo con el provider `bpg/proxmox`, que es el que se copia en A5.3. Para leer el plan del paso 7 de la A5.3 sirve la tabla de símbolos de la sesión 21.

### El lenguaje HCL

Este apartado recorre la sintaxis con la que se escribe todo lo anterior. No hace falta memorizarla entera: con los tipos de bloque, los tipos de dato, `for_each` y media docena de funciones se escribe casi todo un proyecto.

HCL (HashiCorp Configuration Language) es un lenguaje declarativo de bloques y atributos. Un fichero `.tf` es una serie de bloques `tipo "etiqueta" "etiqueta" { atributo = expresión }`. Los tipos de bloque de uso habitual:

```hcl
terraform {                      # ajustes del propio proyecto: versiones y backend
  required_version = ">= 1.9"
  required_providers {
    proxmox = { source = "bpg/proxmox", version = "~> 0.60" }
  }
}

provider "proxmox" { ... }       # cómo conectar con la API

variable "memory" {              # entrada
  type        = number
  description = "RAM en MB"
  default     = 2048
}

locals {                         # valores calculados, para no repetir
  gateway = cidrhost(var.cidr, 1)
}

data "proxmox_virtual_environment_nodes" "all" {}   # lectura, no crea nada

resource "proxmox_virtual_environment_vm" "web" { ... }   # lo que se crea

module "vm" { source = "./modules/vm" ... }   # llamada a un módulo

output "ip" { value = local.ip }  # salida
```

#### Tipos y expresiones

Los tipos primitivos son `string`, `number` y `bool`. Los compuestos: `list(T)`, `set(T)`, `map(T)` (claves string) y `object({ campo = T, ... })`, que se pueden anidar. Un `map(object({...}))` es el tipo más frecuente: un diccionario de máquinas con sus atributos, como en el ejemplo del provider. Las expresiones admiten referencias (`var.x`, `local.y`, `resource_type.name.attr`, `module.m.output`), operadores, condicionales `cond ? a : b`, interpolación en cadenas `"${var.env}-web"`, y bucles `for`:

```hcl
[for k, v in var.vms : k if v.bridge == "prefront"]     # lista de nombres del front
{ for k, v in var.vms : k => v.ip }                      # mapa nombre => IP
```

#### count frente a for_each

Las dos formas de crear varios recursos con un bloque. `count = 3` crea `vm[0]`, `vm[1]`, `vm[2]` indexadas por posición; si se borra la del medio, la tercera pasa a ser `vm[1]` y OpenTofu la destruye y la recrea porque para él es otra. `for_each = var.vms` crea `vm["web01"]`, `vm["app01"]`, indexadas por clave: borrar `app01` del mapa solo toca `app01`. Regla: `count` para "n copias idénticas" o para activar o desactivar un recurso (`count = var.enabled ? 1 : 0`); `for_each` para todo lo demás. Dentro del bloque se accede con `each.key` y `each.value`.

```mermaid
flowchart TB
    subgraph C["count · indexado por posición"]
        direction LR
        C1["<b>vm[0]</b><br><small>web01</small>"]:::pieza
        C2["<b>vm[1]</b><br><small>app01 · se borra</small>"]:::riesgo
        C3["<b>vm[2]</b><br><small>db01</small>"]:::pieza
        R1["<b>db01 pasa a ser vm[1]</b><br><small>para OpenTofu es otro recurso:<br>lo destruye y lo vuelve a crear</small>"]:::riesgo
        C1 --- C2 --- C3 --> R1
    end
    subgraph F["for_each · indexado por clave"]
        direction LR
        F1["<b>vm[#quot;web01#quot;]</b>"]:::pieza
        F2["<b>vm[#quot;app01#quot;]</b><br><small>se borra</small>"]:::act
        F3["<b>vm[#quot;db01#quot;]</b>"]:::pieza
        R2(["<b>Solo se toca app01</b><br><small>los demás ni se enteran</small>"]):::ok
        F1 --- F2 --- F3 --> R2
    end
    C ~~~ F
    classDef act fill:#ea580c22,stroke:#ea580c,stroke-width:1.5px
    classDef pieza fill:#64748b22,stroke:#64748b,stroke-width:1.5px
    classDef dato fill:#2563eb22,stroke:#2563eb,stroke-width:1.5px
    classDef infra fill:#a1a1aa14,stroke:#a1a1aa,stroke-width:1.5px
    classDef ok fill:#16a34a22,stroke:#16a34a,stroke-width:1.5px
    classDef riesgo fill:#dc262622,stroke:#dc2626,stroke-width:1.5px
```

<p class="pie" markdown>`count` solo para «n copias idénticas» o para activar y desactivar un recurso. Para todo lo demás, `for_each`.</p>


#### locals y funciones útiles

`locals` guarda valores calculados una vez y usados varias. Las funciones que salen en todos los proyectos:

| Función | Ejemplo | Resultado |
|----|----|----|
| `cidrhost(prefix, n)` | `cidrhost("10.10.1.0/24", 1)` | `10.10.1.1` (la puerta de enlace) |
| `cidrsubnet(prefix, bits, n)` | `cidrsubnet("10.10.0.0/16", 8, 2)` | `10.10.2.0/24` (subred n de la VPC) |
| `cidrnetmask(prefix)` | `cidrnetmask("10.10.1.0/24")` | `255.255.255.0` |
| `lookup(map, key, default)` | `lookup(var.sizes, "db", 2048)` | valor o 2048 si no existe |
| `file(path)` | `file("~/.ssh/id_ed25519.pub")` | contenido del fichero |
| `templatefile(path, vars)` | `templatefile("ci.tftpl", { user = "ops" })` | fichero renderizado (cloud-init) |
| `format`, `join`, `split` | `format("%s-%02d", "web", 3)` | `web-03` |
| `merge(a, b)` | `merge(local.defaults, each.value)` | objeto con valores por defecto sobreescritos |
| `try(expr, default)` | `try(each.value.disk, 20)` | 20 si el campo no existe |

`tofu console` abre una consola donde probar cualquiera de estas expresiones contra las variables del proyecto antes de meterlas en el código.

#### El grafo de dependencias

OpenTofu no ejecuta los bloques en el orden del fichero. Construye un grafo dirigido: cada referencia (`proxmox_virtual_environment_vm.db.ipv4_addresses` dentro de otro recurso) es una arista, y los recursos sin dependencias entre sí se crean en paralelo (10 a la vez por defecto, `-parallelism=n`). Por eso las tres VM del laboratorio se crean a la vez y por eso el orden de destrucción es el inverso. Cuando una dependencia existe pero no se ve en el código (un recurso que necesita que otro exista aunque no use ninguno de sus atributos), se declara con `depends_on = [recurso]`. `tofu graph | dot -Tsvg > graph.svg` dibuja el grafo.

```mermaid
flowchart LR
    N["<b>Red</b><br><small>nadie depende de nada</small>"]:::infra
    W["<b>web01</b>"]:::pieza
    A["<b>app01</b>"]:::pieza
    D["<b>db01</b>"]:::pieza
    P["<b>Se crean en paralelo</b><br><small>10 a la vez · -parallelism=n</small>"]:::ok
    REF["<b>Una referencia es una arista</b><br><small>db.ipv4_addresses dentro de otro recurso</small>"]:::dato
    DEP["<b>depends_on</b><br><small>para la dependencia que no se ve en el código</small>"]:::act
    N --> W & A & D --> P
    REF -.-> P
    DEP -.-> P
    classDef act fill:#ea580c22,stroke:#ea580c,stroke-width:1.5px
    classDef pieza fill:#64748b22,stroke:#64748b,stroke-width:1.5px
    classDef dato fill:#2563eb22,stroke:#2563eb,stroke-width:1.5px
    classDef infra fill:#a1a1aa14,stroke:#a1a1aa,stroke-width:1.5px
    classDef ok fill:#16a34a22,stroke:#16a34a,stroke-width:1.5px
    classDef riesgo fill:#dc262622,stroke:#dc2626,stroke-width:1.5px
```

<p class="pie" markdown>El orden del fichero da igual: manda el grafo. Y como manda el grafo, destruir va exactamente al revés de crear.</p>


### Provider Proxmox y una VM completa

Con el lenguaje visto, toca crear máquinas de verdad: un proyecto completo que clona la plantilla cloud-init de UT1 tres veces en el entorno `pre`, base de las actividades A5.3 y A5.4.

Hay dos providers para Proxmox con uso real: `Telmate/proxmox`, el histórico, y `bpg/proxmox`, más completo y mantenido, que es el que se usa aquí. El ejemplo del curso, completo. Conviene fijarse en cuatro cosas: el token entra por variable y no por fichero, `for_each` sobre el mapa `vms` hace que un solo bloque `resource` cree las tres VM, el bloque `initialization` es lo que cloud-init aplica en el primer arranque (IP, puerta de enlace, usuario y clave SSH), y `lifecycle` impide que un plan destruya las VM:

```hcl
# providers.tf
terraform {
  required_providers {
    proxmox = { source = "bpg/proxmox", version = "~> 0.60" }
  }
}

provider "proxmox" {
  endpoint  = var.pve_endpoint
  api_token = var.pve_token      # usuario!token=uuid, nunca en el código
  insecure  = true               # certificado autofirmado del laboratorio
}

# variables.tf
variable "pve_endpoint" {
  type = string
}
variable "pve_token" {
  type      = string
  sensitive = true
}
variable "vms" {
  type = map(object({ vmid = number, cores = number, memory = number, disk = number, bridge = string, ip = string }))
}

# main.tf
resource "proxmox_virtual_environment_vm" "vm" {
  for_each  = var.vms
  name      = each.key
  node_name = "pve"
  vm_id     = each.value.vmid              # 210, 220, 230: la convención de IDs del laboratorio

  clone { vm_id = 9000 }                     # plantilla cloud-init de UT1

  cpu    { cores = each.value.cores }
  memory { dedicated = each.value.memory }

  disk {
    datastore_id = "local-lvm"
    interface    = "scsi0"
    size         = each.value.disk
  }

  network_device { bridge = each.value.bridge }

  agent { enabled = true }                   # qemu-guest-agent, para leer la IP

  initialization {
    ip_config {
      ipv4 {
        address = each.value.ip
        gateway = cidrhost(each.value.ip, 1)
      }
    }
    user_account {
      username = "ops"
      keys     = [file("~/.ssh/id_ed25519.pub")]
    }
  }

  lifecycle {
    prevent_destroy = true                   # pre no se destruye sin aprobación
  }
}

# outputs.tf
output "ips" { value = { for k, v in var.vms : k => v.ip } }
```

```hcl
# terraform.tfvars (pre)
pve_endpoint = "https://192.168.1.50:8006/"
vms = {
  web01 = { vmid = 210, cores = 1, memory = 1024, disk = 20, bridge = "prefront", ip = "10.20.1.10/24" }
  app01 = { vmid = 220, cores = 2, memory = 1024, disk = 20, bridge = "preback",  ip = "10.20.2.10/24" }
  db01  = { vmid = 230, cores = 2, memory = 1024, disk = 20, bridge = "predata",  ip = "10.20.3.10/24" }
}
```

El token va en la variable de entorno `TF_VAR_pve_token`, no en ningún fichero. OpenTofu lee cualquier `TF_VAR_nombre` como valor de la variable `nombre`. Es el token `tofu` de `terraform@pve` que se crea en la A5.1, con tres permisos: `PVEVMAdmin` sobre `/vms`, `PVEDatastoreUser` sobre `/storage/local-lvm` y `PVESDNUser` sobre `/sdn/zones/lab`, que es el que deja conectar una VM a una VNet. El token se crea sin separación de privilegios (`--privsep 0`) para que herede los permisos del usuario. Los valores del tfvars son los que caben en el nodo, no los de la tabla de requisitos: 1 GB y 20 GB por VM, con la diferencia escrita en el README.

`prevent_destroy` hace fallar cualquier plan que quiera destruir una de estas VM, por error o a propósito. Lo que se quiere proteger de verdad es `db01`, que guarda la base de datos, pero el bloque `lifecycle` es del recurso entero y no admite variables, así que con `for_each` protege las tres. Para `pre` es lo que conviene: otra asignatura depende de él hasta marzo, y cuando toque darlo de baja, en la A8.3 de Mantenimiento, el bloque se quita en una rama del repositorio que queda como evidencia de la aprobación.

Los puentes son las VNets del SDN que se crearon en la UT2 (`prefront`, `preback`, `predata`; el porqué de esos nombres, en [Una VNet por zona, una subred por VNet](ut2-vpc.md#una-vnet-por-zona-una-subred-por-vnet)). El ejemplo despliega `pre` porque las VM de `dev` ya existen desde UT1 y UT2 con esas mismas IP, y aplicar el código contra ellas chocaría.

#### Cómo llega el puesto de administración a pre

!!! otra "Repaso"
    nftables se explica a fondo en la [sesión 17 de Mantenimiento](https://victor-educ.github.io/apuntes-5169/ut/ut3-seguridad-monitorizacion/#nftables-por-host-el-fichero-completo) (1 de diciembre), y en `router-pre` ya hace el NAT de salida desde la A2.5. Aquí solo se añade la tabla `inet fw`, la de los hosts del curso, con una cadena `forward` de tres reglas.

Desde la A2.5, nada de `dev` alcanza `pre`: `router-pre` tiene un blackhole para `10.10.0.0/16` y ningún router conoce la red del otro entorno. Para crear y configurar las VM de `pre` desde el puesto de administración hace falta un camino, y se abre el mínimo, en un solo sentido:

- `router-pre` recibe una sexta tarjeta, en `devmgmt`, con la `10.10.0.2`, una dirección del rango `.2` a `.9` que el laboratorio reserva para servicios de red. Dentro de la VM es `ens23`. Como `10.10.0.0/24` queda conectada a esa tarjeta, es una ruta más específica que el blackhole de `10.10.0.0/16` y gana: `router-pre` ya puede contestar a gestión.
- En `router-pre`, tres reglas nftables en la cadena `forward`: lo establecido y relacionado pasa, lo que entra por `ens23` pasa, y nada nuevo sale de `pre` hacia `ens23`. `pre` responde a gestión, pero no puede iniciar nada contra ella.
- En el puesto de administración, una ruta a `10.20.0.0/16` por la `10.10.0.2`, en la misma unidad `ruta-lab.service` de la A2.4.

Lo que llega a `pre` se empuja siempre desde gestión: ficheros con Ansible e imágenes con `docker save` por SSH. `pre` sale a Internet por el NAT de `router-pre`, como desde la A2.5. En las hojas, las máquinas de `pre` se escriben con su IP (`10.20.x.10`): los nombres `<host>.pre.lab` solo los resuelve `router-pre`.

!!! ojo "La sintaxis exacta del provider cambia entre versiones"
    Los nombres de bloques y atributos de `bpg/proxmox` (por ejemplo `initialization`, `ip_config`, `user_account`) han cambiado varias veces entre versiones 0.x, y seguirán haciéndolo. El ejemplo de arriba corresponde a la serie 0.6x. Antes de copiar nada conviene abrir la página del recurso en https://registry.opentofu.org/providers/bpg/proxmox/latest/docs para la versión fijada en `required_providers`, y no subir la versión sin leer el changelog.

### A5.3 VM completas (sesión 23)

<span class="et et-obj">Objetivo</span> El puesto de administración llega a `pre`, y `web01`, `app01` y `db01` corren en ese entorno, accesibles por SSH desde el puesto y protegidas con `prevent_destroy`, con un cambio de memoria que el plan resuelve con `~` sobre un solo recurso.

<span class="et et-pre">Antes de empezar</span> `iac-lab` con el `variables.tf` y el tfvars de A5.2 y `TF_VAR_pve_token` exportado en el puesto de administración. `pre` tal como quedó en la A2.5: las VNets `prefront`, `preback` y `predata`, cada una con su subred **sin puerta de enlace y sin rango DHCP**, y `router-pre` (ID 200) encendido haciendo de `.1`, de DHCP y de DNS del entorno, al que entras como en la A2.5, por su IP del aula. La `web01` de pre (ID 210) que clonaste en la A2.5 ya no existe, porque se destruyó al cerrar la evaluable de la UT2: `qm list` en el nodo no debe mostrar ninguna VM entre la 210 y la 239. Se ha explicado [el recurso VM del provider](#provider-proxmox-y-una-vm-completa), [cómo llega el puesto de administración a pre](#como-llega-el-puesto-de-administracion-a-pre), [for_each](#count-frente-a-for_each) y [cómo leer un plan](#como-leer-un-plan).

!!! ojo "Se despliega `pre`, no `dev`"
    Las VM de `dev` ya existen: se crearon a mano en UT1 y UT2, con esas mismas IP. Aplicar el código contra `dev` chocaría con ellas, así que el entorno que nace desde código es `pre`, en el bloque `10.20.0.0/16`. Es además el que Mantenimiento actualiza en febrero y da de baja en marzo. Las tres VM llevan 1 GB cada una y caben en el [presupuesto de memoria](../laboratorio.md#requisitos-por-puesto) sin apagar nada de `dev`, que Mantenimiento sigue usando en enero para sus pruebas.

<span class="et et-pas">Pasos</span>

1. **El camino de gestión a pre.** Son los tres cambios del [apartado](#como-llega-el-puesto-de-administracion-a-pre), cada uno en una máquina.

    **a.** En el nodo, la tarjeta nueva de `router-pre`, y un reinicio para que cloud-init la configure:

    ```bash
    qm set 200 --net5 virtio,bridge=devmgmt --ipconfig5 ip=10.10.0.2/24
    qm reboot 200
    ```

    La plantilla ya se comprobó en la A5.1: si allí el `apply` terminó y entraste por SSH, tiene `qemu-guest-agent` y el `apply` de hoy no se quedará en `Still creating...`.

    **b.** En `router-pre`, comprueba la dirección y la ruta, y añade las tres reglas de `forward`, guardándolas para los siguientes arranques:

    ```bash
    ip -br a show ens23          # 10.10.0.2/24
    ip r                         # 10.10.0.0/24 dev ens23, además del blackhole de 10.10.0.0/16
    sudo nft add table inet fw
    sudo nft add chain inet fw forward '{ type filter hook forward priority 0 ; policy accept ; }'
    sudo nft add rule inet fw forward ct state established,related accept
    sudo nft add rule inet fw forward iifname "ens23" accept
    sudo nft add rule inet fw forward oifname "ens23" drop
    sudo sh -c 'nft list ruleset > /etc/nftables.conf'
    ```

    **c.** En el puesto de administración, la ruta a `pre`, añadida a la unidad de la A2.4:

    ```bash
    sudo sed -i '/^ExecStart=/a ExecStart=/sbin/ip route replace 10.20.0.0/16 via 10.10.0.2 dev ens19' \
      /etc/systemd/system/ruta-lab.service
    sudo systemctl daemon-reload && sudo systemctl restart ruta-lab.service
    ping -c1 10.20.1.1           # responde router-pre
    ```

2. Escribe `main.tf` y `outputs.tf` con el ejemplo completo del apartado del provider: `for_each = var.vms`, `clone { vm_id = 9000 }`, `agent { enabled = true }`, el bloque `initialization` con IP, puerta de enlace y la clave pública del puesto de administración, y el bloque `lifecycle`. Comprueba que el tfvars es el de `pre`: ID 210, 220 y 230, 1024 MB, puentes `prefront`, `preback` y `predata`, e IP `10.20.1.10/24`, `10.20.2.10/24` y `10.20.3.10/24`.
3. `tofu fmt`, `tofu validate`, `tofu plan -out=plan.bin`. El resumen debe ser `Plan: 3 to add, 0 to change, 0 to destroy`.
4. `tofu apply plan.bin` y `tofu output ips`.
5. Entra en las tres desde el puesto de administración: `ssh ops@10.20.1.10`, `ssh ops@10.20.2.10`, `ssh ops@10.20.3.10`. Si alguna no tiene IP, revisa el punto de cloud-init en [Errores frecuentes](#errores-frecuentes-en-el-laboratorio).
6. Comprueba la protección: `tofu plan -destroy` tiene que fallar con `Instance cannot be destroyed` sin tocar nada. Guarda la salida.
7. Cambia `memory` de `app01` a 1536 en `terraform.tfvars` y ejecuta `tofu plan`. Guarda la salida completa. No apliques: devuélvelo a 1024 y comprueba con otro `tofu plan` que no queda nada pendiente. El presupuesto de RAM del nodo no da para subirlo.

<span class="et et-com">Comprobación</span> `ping -c1 10.20.1.1` responde desde el puesto de administración. El `plan -destroy` del paso 6 falla con `Instance cannot be destroyed`. El plan del paso 7 lleva exactamente un recurso con `~ update in-place`, `Plan: 0 to add, 1 to change, 0 to destroy`, y ninguna línea `# forces replacement`; con la memoria devuelta a 1024, `tofu plan` dice `No changes`.

<span class="et et-ent">Entrega</span> `main.tf` y `outputs.tf` en `iac-lab`. En `ut5/a53/` de `entregas-5166`, el `ip r` de `router-pre` y las salidas de los pasos 6 y 7. No destruyas las VM: A5.4 sigue sobre ellas.

<span class="et et-ext">Si te sobra tiempo</span> Cambia `node_name` o `datastore_id` solo en el plan (sin aplicar), localiza la línea `# forces replacement` y fíjate en que `prevent_destroy` para el plan antes de destruir nada.

## Sesión 24 · Módulos y estado

<p class="ut-meta" markdown>13 de enero · Teoría y práctica · <span class="dur" tabindex="0" aria-label="Módulos, entornos y estructura del repositorio · 5 min&#10;El estado a fondo · 15 min&#10;A5.4 Módulos y estado · 90 min" data-dur="Módulos, entornos y estructura del repositorio · 5 min&#10;El estado a fondo · 15 min&#10;A5.4 Módulos y estado · 90 min">:material-school:<i class="dur-barra" style="--teoria:18%"></i>:material-flask:</span></p>

Con las tres VM vivas, en esta sesión el repositorio adopta la forma que tendrá hasta marzo: un módulo `vm`, un directorio por entorno (`envs/dev`, `envs/pre`) y el estado en MinIO con bloqueo. Empieza por los módulos y la estructura por entornos, y sigue con el estado: qué contiene, cómo se guarda en un backend remoto y cómo se mueve un recurso al módulo con `moved` o `state mv` sin que el plan quiera destruirlo. La hoja A5.4 recorre exactamente ese camino sobre el MinIO que quedó montado en la A5.2: es la pieza de la que dependen el estado de los dos entornos y, desde febrero, las copias de la asignatura de Mantenimiento.

### Módulos, entornos y estructura del repositorio

Con un proyecto que ya funciona, el siguiente problema es no repetirlo: tres VM en dev, cuatro en pre, otras en pro, cada una con los mismos cuarenta atributos. Aquí la VM se empaqueta en un módulo y los entornos se separan de forma que un error en dev no pueda tocar pro.

Un módulo es un directorio con ficheros `.tf` que recibe variables y devuelve outputs. Cualquier proyecto es ya un módulo (el raíz); un módulo hijo se llama con `module "app" { source = "./modules/vm" ... }` y se accede a sus salidas con `module.app.ip`. Sirve para que el equipo de plataforma publique "así se hace una VM aquí" y los demás solo pasen nombre, tamaño y red. Dos reglas de diseño: un módulo hace una cosa (una VM, una subred, un bucket) y no configura su propio provider, que hereda del raíz.

Para los entornos hay dos caminos. Los workspaces (`tofu workspace new pre`) mantienen varios estados para el mismo código y exponen `terraform.workspace` como variable; sirven cuando la única diferencia entre entornos son valores. El directorio por entorno (`envs/dev`, `envs/pre`, `envs/pro`), cada uno con su backend, su tfvars y sus llamadas a los módulos comunes, es lo que prefiere la mayoría de los equipos, y lo que se usa aquí: se ve de un vistazo qué hay en cada entorno, un error en `dev` no puede tocar el estado de `pro`, los permisos del backend se dan por directorio y el pipeline solo tiene que hacer `cd envs/pre`. Los workspaces comparten backend y credenciales, y es fácil aplicar en el workspace equivocado.

```mermaid
flowchart LR
    R["<b>iac-lab</b><br><small>el repositorio</small>"]:::dato
    M["<b>modules/</b><br><small>lo reutilizable</small>"]:::pieza
    E["<b>envs/</b><br><small>lo que cambia por entorno</small>"]:::pieza
    A["<b>ansible/</b>"]:::pieza
    T["<b>test.sh</b>"]:::pieza
    P["<b>.pre-commit-config.yaml</b>"]:::pieza
    M1["<b>vm/</b><br><small>main.tf · variables.tf · outputs.tf</small>"]:::infra
    M2["<b>network/</b>"]:::infra
    E1["<b>dev/</b><br><small>backend.tf · main.tf · terraform.tfvars</small>"]:::infra
    E2["<b>pre/</b><br><small>backend.tf · main.tf · terraform.tfvars</small>"]:::infra
    A1["<b>inventory.ini · group_vars/ · files/ · site.yml</b>"]:::infra
    R --> M & E & A & T & P
    M --> M1 & M2
    E --> E1 & E2
    A --> A1
    classDef act fill:#ea580c22,stroke:#ea580c,stroke-width:1.5px
    classDef pieza fill:#64748b22,stroke:#64748b,stroke-width:1.5px
    classDef dato fill:#2563eb22,stroke:#2563eb,stroke-width:1.5px
    classDef infra fill:#a1a1aa14,stroke:#a1a1aa,stroke-width:1.5px
    classDef ok fill:#16a34a22,stroke:#16a34a,stroke-width:1.5px
    classDef riesgo fill:#dc262622,stroke:#dc2626,stroke-width:1.5px
```

<p class="pie" markdown>La separación que importa es `modules/` frente a `envs/`: el módulo no sabe en qué entorno vive, y el entorno solo aporta sus valores.</p>

El módulo `vm` expone como mínimo `name`, `vmid`, `cores`, `memory`, `disk`, `bridge`, `ip` como variables y `ip` y `vm_id` como outputs. `envs/pre/main.tf` lo llama con `for_each = var.vms` y pasa `each.value`. Los módulos se pueden versionar aparte y referenciar por Git (`source = "git::https://gitea.lab/iac/modules.git//vm?ref=v1.2.0"`), que es como se hace cuando varios repositorios los comparten.

### El estado a fondo

El estado es la pieza que hace que OpenTofu sea declarativo, y también la que más disgustos da cuando se trabaja en equipo. Este apartado explica qué contiene, dónde guardarlo para que dos personas no se pisen y qué comandos lo tocan sin romperlo.

`terraform.tfstate` es un JSON con la correspondencia entre cada bloque `resource` del código y el objeto real: su ID en Proxmox, todos sus atributos tal como el provider los leyó la última vez, las dependencias y la versión del provider. Sin estado OpenTofu no sabe que `vm["web01"]` es el VMID 210 y en el siguiente apply intentaría crear otra.

!!! ojo "El estado es un fichero con secretos dentro"
    Como guarda todos los atributos tal como el provider los leyó, guarda también las contraseñas de
    cloud-init, los tokens y cualquier valor que un recurso devuelva. Nunca va al repositorio, ni siquiera
    «temporalmente para probar»: el historial de Git no se olvida.

```mermaid
flowchart LR
    COD["<b>Código</b><br><small>resource vm[#quot;web01#quot;]</small>"]:::dato
    EST["<b>terraform.tfstate</b><br><small>web01 → VMID 210<br>+ todos sus atributos</small>"]:::dato
    REAL["<b>Lo que existe en Proxmox</b><br><small>la VM 210 de verdad</small>"]:::pieza
    SIN["<b>Sin estado</b><br><small>no sabe que web01 ya existe:<br>en el siguiente apply crea otra</small>"]:::riesgo
    COD <--> EST <--> REAL
    EST -. "si se pierde" .-> SIN
    classDef act fill:#ea580c22,stroke:#ea580c,stroke-width:1.5px
    classDef pieza fill:#64748b22,stroke:#64748b,stroke-width:1.5px
    classDef dato fill:#2563eb22,stroke:#2563eb,stroke-width:1.5px
    classDef infra fill:#a1a1aa14,stroke:#a1a1aa,stroke-width:1.5px
    classDef ok fill:#16a34a22,stroke:#16a34a,stroke-width:1.5px
    classDef riesgo fill:#dc262622,stroke:#dc2626,stroke-width:1.5px
```

<p class="pie" markdown>El estado es lo que convierte el código en declarativo: sin él no hay forma de saber qué bloque corresponde a qué máquina.</p>

Reglas:

- Nunca editarlo a mano. Para moverlo o limpiarlo están los subcomandos `tofu state`.
- En equipo, guardarlo en un backend remoto con bloqueo, no en Git. Dos personas aplicando a la vez sobre el mismo estado lo corrompen.
- Protegerlo como un secreto: permisos en el bucket, cifrado, sin copias en el portátil.
- `.gitignore` con `*.tfstate`, `*.tfstate.*` y `.terraform/`. Si el estado ha entrado en el repositorio alguna vez, tratarlo como un secreto filtrado.

#### Backend remoto: s3 contra MinIO

En el laboratorio se usa MinIO (un servidor de objetos libre que habla el protocolo S3 de Amazon) en la subred de gestión, en la `10.10.0.30`, como un contenedor más de la pila de `mon01`; lo monta el primer paso de la hoja [A5.2](#a52-requisitos-y-variables-sesion-22), casi un mes antes de que haga falta, y de él cuelgan después el estado de los dos entornos del repositorio y las copias de la asignatura de Mantenimiento. La configuración del backend usa el mismo protocolo que AWS S3 y solo hay que desactivar las comprobaciones que son de AWS:

```hcl
terraform {
  backend "s3" {
    bucket                      = "tfstate"
    key                         = "envs/pre/terraform.tfstate"
    region                      = "main"
    endpoints                   = { s3 = "http://10.10.0.30:9000" }
    use_path_style              = true
    skip_credentials_validation = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    use_lockfile                = true
  }
}
```

Las credenciales van en `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY` (o en `-backend-config=` en `init`), nunca en el bloque. `use_lockfile = true` implementa el bloqueo con un fichero `.tflock` junto al estado; requiere una versión reciente de MinIO. El bloqueo hace que un segundo `apply` simultáneo falle con `Error acquiring the state lock` en lugar de pisar el estado. Si alguien pierde la conexión con el bloqueo tomado, `tofu force-unlock ID` lo libera, solo después de comprobar que nadie está aplicando de verdad.

OpenTofu puede además cifrar el estado antes de subirlo, y hay otros backends para cuando no se tiene un almacén S3 a mano; las dos cosas, en [Para ampliar](../ampliacion.md#el-estado-cifrado-y-otros-backends).

#### Manipular el estado

```bash
tofu state list                                    # qué recursos gestiona
tofu state show 'module.vm["db01"].proxmox_virtual_environment_vm.this'
tofu state mv 'proxmox_virtual_environment_vm.vm["db01"]' 'module.vm["db01"].proxmox_virtual_environment_vm.this'
tofu state rm 'proxmox_virtual_environment_vm.vm["tmp"]'   # olvida el recurso, no lo destruye
tofu import 'proxmox_virtual_environment_vm.legacy' pve/110  # adopta una VM que ya existía (web01 de dev)
```

`state mv` es lo que salva al extraer un recurso a un módulo (actividad A5.4): sin él, el plan quiere destruir `vm["db01"]` y crear `module.vm["db01"]`, que para OpenTofu son direcciones distintas. Esto mismo se puede escribir en el código con un bloque `moved { from = ... to = ... }`, que queda versionado y se aplica en el siguiente plan; es preferible al comando en proyectos de equipo. `import` adopta un recurso creado a mano: OpenTofu lo lee y lo mete en el estado, y el siguiente plan muestra la diferencia entre lo que hay y lo que dice el código. El formato del ID (`nodo/vmid` en el caso de bpg) lo dice la documentación de cada recurso. Hay también un bloque `import` que además escribe el HCL del recurso adoptado; está en [Para ampliar](../ampliacion.md#importar-con-el-bloque-import).

### A5.4 Módulos y estado (sesión 24)

<span class="et et-obj">Objetivo</span> El repositorio queda con `modules/vm`, `envs/pre` y `envs/dev`, el estado en MinIO con bloqueo, y las tres VM de A5.3 siguen vivas sin haberse recreado.

<span class="et et-pre">Antes de empezar</span> Las VM de A5.3 desplegadas y su `terraform.tfstate` local, en `iac-lab` del puesto de administración. MinIO en marcha en la `10.10.0.30`, con los buckets `tfstate` y `backups` y el secreto de la credencial `tofu` a mano: se montó en el paso 1 de la [A5.2](#a52-requisitos-y-variables-sesion-22), y si no está, móntalo con ese paso antes de la sesión. El puesto de administración está en la subred de gestión y alcanza el 9000 de MinIO: compruébalo con `curl -s -o /dev/null -w '%{http_code}\n' http://10.10.0.30:9000/minio/health/live`, que responde `200`. Se han explicado [módulos y entornos](#modulos-entornos-y-estructura-del-repositorio), el [backend remoto](#backend-remoto-s3-contra-minio) y [cómo mover recursos en el estado](#manipular-el-estado).

<span class="et et-pas">Pasos</span>

1. Crea `modules/vm/` con `main.tf` (un solo `resource "proxmox_virtual_environment_vm" "this"` sin `for_each`, con `var.name`, `var.vmid`, `var.cores`, `var.memory`, `var.disk`, `var.bridge`, `var.ip`, y el mismo bloque `lifecycle` de la A5.3), `variables.tf` con esas siete variables y `outputs.tf` con `ip` y `vm_id`. El módulo no lleva bloque `provider`.
2. Crea `envs/pre/` y mueve allí `providers.tf`, `variables.tf`, `outputs.tf` y `terraform.tfvars`; el `main.tf` de la raíz se borra. El de `envs/pre/` queda así:

    ```hcl
    module "vm" {
      source   = "../../modules/vm"
      for_each = var.vms
      name     = each.key
      vmid     = each.value.vmid
      cores    = each.value.cores
      memory   = each.value.memory
      disk     = each.value.disk
      bridge   = each.value.bridge
      ip       = each.value.ip
    }
    ```

3. Copia el `terraform.tfstate` de A5.3 a `envs/pre/`, ejecuta `tofu init` y añade a `main.tf` un bloque `moved` por VM, o ejecuta el `state mv` equivalente:

    ```hcl
    moved {
      from = proxmox_virtual_environment_vm.vm["web01"]
      to   = module.vm["web01"].proxmox_virtual_environment_vm.this
    }
    ```

4. `tofu plan`: debe decir `No changes` (o solo el aviso de movimientos). Si falta un `moved`, el plan querría destruir y crear, y `prevent_destroy` lo para con un error: añade el `moved` que falta y repite.
5. Añade `envs/pre/backend.tf` con el bloque `backend "s3"` del apartado del estado (`key = "envs/pre/terraform.tfstate"`), exporta `AWS_ACCESS_KEY_ID=tofu` y `AWS_SECRET_ACCESS_KEY` con el secreto de la credencial `tofu` que creaste en la A5.2, y ejecuta `tofu init -migrate-state`. Responde `yes` a copiar el estado.
6. `tofu state list` debe listar las tres VM; borra el `terraform.tfstate` local (queda `terraform.tfstate.backup`, bórralo también) y repite `tofu state list`.
7. Desde dos terminales, lanza `tofu apply` a la vez y captura el `Error acquiring the state lock` de la segunda. Responde `no` en la primera.
8. Crea `envs/dev/` copiando `pre`: cambia `key` a `envs/dev/terraform.tfstate` en `backend.tf` y en el tfvars pon los `vmid` 110, 120 y 130, los puentes `devfront`, `devback` y `devdata`, las IP `10.10.1.10/24`, `10.10.2.10/24` y `10.10.3.10/24` y la memoria de la tabla del laboratorio (1024, 2048 y 2048). `tofu init` y `tofu plan`, **sin aplicar**: esas VM ya existen creadas a mano desde UT1 y UT2 y un `apply` chocaría con ellas. Queda el código escrito; adoptarlas sería trabajo de `tofu import` con esos mismos ID.
9. Haz commit de todo y `git push`. El `.gitignore` de la A5.1 ya deja fuera `.terraform/`, `plan.bin` y los tfstate de cualquier directorio.

<span class="et et-com">Comprobación</span> `git status` no muestra ningún tfstate; `tofu state list` en `envs/pre` responde desde MinIO; el plan del paso 4 no destruyó nada; el error de bloqueo está capturado.

<span class="et et-ent">Entrega</span> `modules/` y `envs/` en `iac-lab`, y las salidas de los pasos 4, 6 y 7 en `ut5/a54/` de `entregas-5166`. Este estado remoto se queda hasta marzo: lo usa Mantenimiento.

<span class="et et-ext">Si te sobra tiempo</span> Añade una variable `env` al módulo y úsala en el nombre (`"${var.env}-${var.name}"`); mira en el plan qué atributos fuerza a recrear un cambio de nombre en bpg/proxmox.

## Sesión 25 · Ansible

<p class="ut-meta" markdown>15 de enero · Teoría y práctica · <span class="dur" tabindex="0" aria-label="Ansible · 25 min&#10;A5.5 Ansible · 85 min" data-dur="Ansible · 25 min&#10;A5.5 Ansible · 85 min">:material-school:<i class="dur-barra" style="--teoria:23%"></i>:material-flask:</span></p>

Al acabar, PostgreSQL corre en `db01` y el servicio del curso en `app01` de `pre`, desplegados por un playbook cuyo inventario sale de `tofu output`, y la segunda pasada termina con `changed=0`. Se ven el inventario (a mano y generado con `jq`), los comandos ad hoc, el playbook del curso con handlers, por qué los módulos son idempotentes y cómo se organiza en roles cuando crece; Vault y ansible-lint cierran el apartado, y ansible-lint lo usa la hoja A5.5 en su último paso.

### Ansible

Ansible configura las máquinas que OpenTofu ha creado. No instala agente: necesita SSH y un intérprete de Python en el destino, cosa que cualquier imagen cloud de Debian o Ubuntu trae. Desde la máquina de control (el puesto de administración en esta unidad, `agent01` en UT6) se conecta a cada host, copia un pequeño programa Python (el módulo), lo ejecuta y recoge el resultado en JSON. En Debian se instala con el paquete de la distribución, `sudo apt install ansible ansible-lint`, que trae `ansible-core` y las colecciones de la comunidad (`community.docker`, `community.postgresql`) que usa el playbook del curso; `ansible --version` debe indicar core 2.18 o superior. En otros sistemas, `pipx install ansible` (pipx instala herramientas Python cada una en su entorno aislado).

#### Inventario

El inventario lista los hosts y los agrupa. En INI, que es el formato que usa el curso:

```ini
# inventory.ini
[web]
web01 ansible_host=10.20.1.10

[app]
app01 ansible_host=10.20.2.10

[db]
db01 ansible_host=10.20.3.10

[servicio:children]
web
app
db

[all:vars]
ansible_user=ops
ansible_python_interpreter=/usr/bin/python3
```

El mismo inventario se puede escribir en YAML, el formato que prefiere ansible-lint; el curso se queda con INI porque es el que genera `gen-inventory.sh`, y la versión YAML está en [Para ampliar](../ampliacion.md#inventario-en-yaml). `ansible-inventory -i inventory.ini --graph` dibuja los grupos y sirve para comprobar que la agrupación es la correcta.

#### Inventario generado desde los outputs de OpenTofu

Escribir el inventario a mano duplica lo que ya está en tfvars, y se desincroniza a la primera. `tofu output -json` devuelve todos los outputs en JSON, y con `jq` (el filtro de JSON de la línea de comandos) se convierte en inventario en cinco líneas:

```bash
#!/usr/bin/env bash
# gen-inventory.sh: genera ansible/inventory.ini desde los outputs de envs/pre
set -euo pipefail
cd "$(dirname "$0")/envs/${ENV:-pre}"
tofu output -json ips | jq -r '
  to_entries
  | map(. + { group: (.key | sub("[0-9]+$"; "")) })
  | group_by(.group)
  | map("[\(.[0].group)]\n" + (map("\(.key) ansible_host=\(.value | split("/")[0])") | join("\n")))
  | join("\n\n")' > ../../ansible/inventory.ini
printf '\n[all:vars]\nansible_user=ops\n' >> ../../ansible/inventory.ini
```

Agrupa por el nombre sin el número final (`web01` va al grupo `web`, `db01` a `db`) y quita el `/24` de la IP. En proyectos más grandes se usa el plugin de inventario `cloud.terraform.terraform_state`, que lee el estado directamente; el script se entiende entero.

#### Comandos ad hoc y playbooks

Un comando ad hoc ejecuta un módulo en un grupo sin escribir playbook. Sirve para comprobar y para arreglar cosas puntuales:

```bash
ansible -i inventory.ini all -m ping                          # conectividad y Python
ansible -i inventory.ini db -m setup -a 'filter=ansible_memtotal_mb'
ansible -i inventory.ini app -b -m apt -a 'name=docker.io,docker-compose state=present update_cache=true'
```

Un playbook es un fichero YAML con una o más jugadas (plays), cada una con un grupo de hosts y una lista de tareas. El del curso tiene dos: la primera deja PostgreSQL en `db01` con la base `servicio` y el usuario `app`, abierto solo a la subred de `app01`; la segunda deja el servicio en `app01`, con el compose en `/opt/servicio` apuntando a esa base. `web01` no tiene jugada: en `pre` se queda como clon limpio, sin nginx ni certificado. Conviene fijarse en que cada tarea tiene nombre, usa el nombre completo del módulo y describe un estado (`present`, `directory`), no una acción:

```yaml
# site.yml
- name: PostgreSQL en db01
  hosts: db
  become: true
  vars:
    pg_conf: /etc/postgresql/17/main
  tasks:
    - name: Instalar PostgreSQL y lo que necesitan los módulos
      ansible.builtin.apt:
        name: [postgresql, python3-psycopg2, acl]
        state: present
        update_cache: true

    - name: Escuchar en la red
      ansible.builtin.lineinfile:
        path: "{{ pg_conf }}/postgresql.conf"
        regexp: "^#?listen_addresses"
        line: "listen_addresses = '*'"
      notify: Reiniciar PostgreSQL

    - name: Admitir solo a la subred de app
      ansible.builtin.lineinfile:
        path: "{{ pg_conf }}/pg_hba.conf"
        line: "host servicio app 10.20.2.0/24 scram-sha-256"
      notify: Reiniciar PostgreSQL

    - name: Crear el usuario de la aplicación
      become: true
      become_user: postgres
      community.postgresql.postgresql_user:
        name: app
        password: "{{ db_password }}"
      no_log: true

    - name: Crear la base del servicio
      become: true
      become_user: postgres
      community.postgresql.postgresql_db:
        name: servicio
        owner: app

  handlers:
    - name: Reiniciar PostgreSQL
      ansible.builtin.service:
        name: postgresql
        state: restarted

- name: El servicio en app01
  hosts: app
  become: true
  vars:
    app_dir: /opt/servicio
  tasks:
    - name: Instalar Docker y el plugin compose
      ansible.builtin.apt:
        name: [docker.io, docker-compose]
        state: present
        update_cache: true

    - name: Crear el directorio del servicio
      ansible.builtin.file:
        path: "{{ app_dir }}"
        state: directory
        mode: "0755"

    - name: Crear la red obs que el compose declara externa
      community.docker.docker_network:
        name: obs

    - name: Copiar el fichero compose
      ansible.builtin.copy:
        src: files/compose.yml
        dest: "{{ app_dir }}/compose.yml"
        mode: "0644"
      notify: Reiniciar el servicio

    - name: Escribir el .env de pre
      ansible.builtin.copy:
        dest: "{{ app_dir }}/.env"
        content: |
          APP_IMAGE={{ app_image }}
          DB_HOST={{ db_host }}
          DB_NAME=servicio
          DB_USER=app
          DB_PASS={{ db_password }}
        mode: "0600"
      no_log: true
      notify: Reiniciar el servicio

    - name: Levantar el servicio
      community.docker.docker_compose_v2:
        project_src: "{{ app_dir }}"
        state: present

  handlers:
    - name: Reiniciar el servicio
      community.docker.docker_compose_v2:
        project_src: "{{ app_dir }}"
        state: restarted
```

Y las variables que usan las dos jugadas, en `group_vars/all.yml` junto al playbook:

```yaml
# group_vars/all.yml
app_image: app:1.4.2            # la imagen que corre en app01 de dev: docker image ls app
db_host: 10.20.3.10
# La contraseña del usuario app la genera Ansible la primera vez y la guarda en
# ansible/secretos/db-pre, que está en .gitignore: nunca entra en el repositorio
db_password: "{{ lookup('ansible.builtin.password', 'secretos/db-pre', length=24, chars=['ascii_letters', 'digits']) }}"
```

Cuatro detalles que explican el resto. Las jugadas se ejecutan en orden, y los handlers al final de cada una: PostgreSQL ya escucha en la red cuando arranca la API, que crea su esquema al conectarse. Las tareas de la base se ejecutan como el usuario `postgres` (`become_user`), que es el que puede entrar sin contraseña; el paquete `acl` es lo que Ansible necesita para cambiar a un usuario sin privilegios. `no_log: true` evita que la contraseña salga por pantalla. Y el `.env` lleva las cuatro variables con las que la API encuentra su base (si el `.env` de `app01` en dev tiene alguna más, se añade aquí con el mismo nombre) y una quinta, `APP_IMAGE`, que el compose de `pre` usa en su línea `image:`.

La imagen del servicio no la lleva el playbook. Hasta que exista el registry, en febrero, llega a `pre` desde `app01` de dev por una tubería, `docker save` en un lado y `docker load` en el otro, y el playbook la encuentra ya cargada. Qué imagen arranca lo decide `app_image`: para desplegar otra versión basta con cargarla y ejecutar el playbook con `-e app_image=...`, que es lo que hará el pipeline de UT6.

`ansible-playbook -i inventory.ini site.yml`. La primera vez casi todo sale `changed`; la segunda todo `ok` y el resumen final tiene `changed=0` en cada host. Si en la segunda pasada algo sigue en `changed`, esa tarea no es idempotente y hay que arreglarla: casi siempre es un `command` o `shell` sin `creates:` o `changed_when:`.

#### Módulos idempotentes y handlers

Cada módulo compara el estado pedido con el real antes de tocar nada: `apt` consulta dpkg, `copy` compara el hash del fichero, `service` pregunta a systemd, `user` lee `/etc/passwd`. `command` y `shell` no pueden saber nada de eso, así que siempre informan `changed`; se usan solo cuando no hay módulo, con `creates: /ruta` (no ejecutar si existe) o `changed_when: false` (es una consulta). Los handlers son tareas que solo se ejecutan si alguna tarea con `notify` ha cambiado algo, y una sola vez al final de la jugada aunque las notifiquen cinco tareas. Los nombres completos de los módulos (`ansible.builtin.apt` en lugar de `apt`) son obligatorios para ansible-lint y evitan ambigüedades con colecciones instaladas. Las colecciones (paquetes de módulos, como `community.docker`) que no vienen con `ansible-core` las trae el paquete `ansible` de Debian; con pipx se instalan con `ansible-galaxy collection install community.docker` o, mejor, con un `requirements.yml` en el repositorio.

#### Roles, variables y group_vars

Cuando el playbook pasa de veinte tareas, se parte en roles: directorios con estructura fija que Ansible carga solo. `ansible-galaxy role init roles/docker` crea el esqueleto:

```text
roles/docker/
  tasks/main.yml        # las tareas
  handlers/main.yml     # los handlers
  defaults/main.yml     # variables con la prioridad más baja (el usuario las sobreescribe)
  vars/main.yml         # variables internas del rol
  templates/            # ficheros Jinja2 (.j2), plantillas con variables, para el módulo template
  files/                # ficheros que se copian tal cual
  meta/main.yml         # dependencias de otros roles
```

Y `site.yml` queda en `- hosts: app`, `roles: [docker, app_compose]`. Las variables por grupo van en `group_vars/app.yml` y `group_vars/db.yml`, y las de todos en `group_vars/all.yml`; por host, en `host_vars/db01.yml`. La precedencia va de `defaults` del rol (la más baja) a `-e` en la línea de comandos (la más alta), pasando por group_vars, host_vars y `vars` del play. Cuando una variable no toma el valor esperado, `ansible-inventory --host db01` muestra lo que Ansible ha resuelto para ese host.

#### Ansible Vault

Las contraseñas de la base de datos o las claves del registro de contenedores no pueden ir en claro en `group_vars`. El playbook del curso lo evita generando la contraseña fuera del repositorio; cuando un secreto sí tiene que viajar con el código, Vault cifra ficheros o valores sueltos con AES-256 y una contraseña:

```bash
ansible-vault create group_vars/db/vault.yml       # abre el editor, guarda cifrado
ansible-vault encrypt_string 'S3cr3t0' --name 'db_password'   # un solo valor, para pegar en YAML
ansible-playbook site.yml --ask-vault-pass          # o --vault-password-file ~/.vault_pass
```

El fichero cifrado sí se sube a Git (empieza por `$ANSIBLE_VAULT;1.1;AES256` y gitleaks lo reconoce como cifrado). La contraseña del vault se pasa por entorno o por fichero fuera del repositorio; en un pipeline la inyecta el orquestador como credencial.

#### ansible-lint, --check y --diff

`ansible-lint` (el paquete `ansible-lint` de Debian) revisa sintaxis, nombres completos de módulos, tareas sin `name`, permisos sin especificar en `copy`, y tiene un perfil `production` más exigente. Va en el pipeline junto a `tofu validate`. `ansible-playbook --check` ejecuta en modo simulación: cada módulo dice qué cambiaría sin cambiarlo (los que no lo soportan se saltan), y `--diff` muestra el diff de cada fichero que `copy`, `template` o `lineinfile` van a tocar. `--check --diff` juntos son el equivalente al `tofu plan` de Ansible, y `--limit db01` restringe a un host durante la depuración.

### A5.5 Ansible (sesión 25)

<span class="et et-obj">Objetivo</span> PostgreSQL corre en `db01` y el servicio del curso en `app01` de `pre`, desplegados por un playbook cuyo inventario sale de `tofu output`, y la segunda pasada termina con `changed=0`.

<span class="et et-pre">Antes de empezar</span> Las VM de `envs/pre` levantadas y accesibles por SSH desde el puesto de administración, con las credenciales de la cuenta `tofu` de MinIO exportadas como en el paso 5 de la A5.4: `gen-inventory.sh` lee el estado remoto con `tofu output`, y `tofu state list` en `envs/pre` tiene que listar las tres VM. Entra hoy en el puesto con `ssh -A ops@<IP de aula de admin01>`: el `-A` le presta la clave de tu puesto para llegar a `app01` de dev (10.10.2.10), de donde salen el compose del servicio y su imagen. Se han explicado [inventario, playbooks y módulos idempotentes](#ansible), el [inventario generado desde los outputs](#inventario-generado-desde-los-outputs-de-opentofu) y el [playbook del curso](#comandos-ad-hoc-y-playbooks).

<span class="et et-pas">Pasos</span>

1. Instala Ansible y el linter con los paquetes de Debian, que traen también las colecciones que usa el playbook: `sudo apt install -y ansible ansible-lint`. `ansible --version` debe dar core 2.18 o superior.
2. Crea el directorio `ansible/`, copia `gen-inventory.sh` del apartado del inventario a la raíz del repositorio, dale permisos (`chmod +x`) y ejecútalo. Mira `ansible/inventory.ini`: tres grupos con la IP sin `/24`.
3. `ansible -i ansible/inventory.ini all -m ping`: los tres hosts deben responder `pong`. Si sale `Permission denied`, añade `ansible_ssh_private_key_file=~/.ssh/id_ed25519` a `[all:vars]` en el script.
4. Prepara los ficheros. El compose es el del repositorio `servicio` tal como corre en `app01` de dev (el que se guarda desde la [A1.1 de Mantenimiento](https://victor-educ.github.io/apuntes-5169/ut/ut1-observabilidad/)), que desde noviembre solo tiene el servicio `app`:

    ```bash
    mkdir -p ansible/files ansible/group_vars
    scp ops@10.10.2.10:/opt/servicio/compose.yml ansible/files/compose.yml
    echo 'ansible/secretos/' >> .gitignore
    ```

    En la copia, borra el bloque `build:` del servicio `app` si lo tiene (a `pre` la imagen llega hecha) y deja su línea de imagen como `image: ${APP_IMAGE}`. Crea `ansible/site.yml` y `ansible/group_vars/all.yml` copiando tal cual los del [apartado](#comandos-ad-hoc-y-playbooks), y pon en `app_image` la etiqueta que te dé `ssh ops@10.10.2.10 docker image ls app`.

5. Lleva Docker y la imagen a `app01` de pre. Docker, con el comando ad hoc del apartado; la imagen, desde `app01` de dev por una tubería, con la misma etiqueta que has puesto en `app_image`:

    ```bash
    ansible -i ansible/inventory.ini app -b -m apt -a 'name=docker.io,docker-compose state=present update_cache=true'
    ssh ops@10.10.2.10 docker save app:<versión> | ssh ops@10.20.2.10 sudo docker load
    ```

6. `ansible-playbook -i ansible/inventory.ini ansible/site.yml`. La primera vez casi todas las tareas salen `changed`. Comprueba que el servicio corre con `ssh ops@10.20.2.10 sudo docker compose -f /opt/servicio/compose.yml ps` y que responde con `curl http://10.20.2.10:8080/health`.
7. Vuelve a ejecutar el playbook y guarda la salida completa: el resumen debe llevar `changed=0` en `app01` y en `db01`. Si no, localiza la tarea con `--diff` y corrígela.
8. `ansible-lint ansible/site.yml` y corrige todo lo que marque hasta que salga limpio.

<span class="et et-com">Comprobación</span> La segunda pasada del paso 7 termina en `changed=0 unreachable=0 failed=0` para los dos hosts; `ansible-lint` no devuelve hallazgos; `curl http://10.20.2.10:8080/health` responde y `nc -zv 10.20.3.10 5432` conecta.

<span class="et et-ent">Entrega</span> `gen-inventory.sh` y `ansible/` en `iac-lab` (`ansible/secretos/` no entra), y las salidas de las dos ejecuciones en `ut5/a55/` de `entregas-5166`. Las VM se quedan levantadas con el servicio dentro: las usan la A5.6 y, en febrero, Mantenimiento.

<span class="et et-ext">Si te sobra tiempo</span> Cambia una línea de `files/compose.yml` (por ejemplo una etiqueta), ejecuta de nuevo y comprueba que solo cambia `Copiar el fichero compose` y que el handler reinicia el servicio. Después parte la segunda jugada en dos roles con `ansible-galaxy role init roles/docker` y `roles/app_compose`, y mueve `app_dir` a `group_vars/app.yml`.

## Sesión 26 · Pruebas del despliegue

<p class="ut-meta" markdown>20 de enero · Teoría y práctica · <span class="dur" tabindex="0" aria-label="Pruebas del despliegue · 15 min&#10;A5.6 Pruebas del despliegue · 95 min" data-dur="Pruebas del despliegue · 15 min&#10;A5.6 Pruebas del despliegue · 95 min">:material-school:<i class="dur-barra" style="--teoria:14%"></i>:material-flask:</span></p>

Esta sesión convierte el despliegue en algo que se puede afirmar o negar con un código de salida: un `test.sh` que aplica, configura, lanza smoke tests, compara la máquina con los requisitos y comprueba la idempotencia, y que con `SOLO_PRUEBAS=1` se limita a probar lo que hay. Primero los niveles de prueba del IaC, del más barato al más caro, y después el script que se copia en A5.6 y se rompe a propósito para ver que falla donde debe.

### Pruebas del despliegue

Un despliegue que no se prueba no está terminado: OpenTofu puede acabar sin error con una VM que no arranca, y Ansible puede decir `ok` con un servicio que no responde. Aquí se monta la cadena que va del `apply` a un código de salida 0 o distinto de 0, y el pipeline de UT6 usa su tramo de pruebas como smoke test después de cada despliegue en `pre`.

```mermaid
flowchart TB
    T["<b>tofu apply</b>"]:::act
    O["<b>tofu output -json</b>"]:::dato
    I["<b>gen-inventory.sh</b><br><small>del estado al inventario</small>"]:::act
    A["<b>ansible-playbook site.yml</b>"]:::act
    S["<b>Smoke tests</b><br><small>curl, nc</small>"]:::pieza
    C["<b>Chequeo de configuración</b><br><small>vCPU y RAM</small>"]:::pieza
    R{"<b>¿exit 0?</b>"}:::dato
    OK(["<b>Despliegue válido</b>"]):::ok
    KO(["<b>Fallo: revisar y repetir</b>"]):::riesgo
    T --> O --> I --> A --> S --> C --> R
    R -- sí --> OK
    R -- no --> KO
    classDef act fill:#ea580c22,stroke:#ea580c,stroke-width:1.5px
    classDef pieza fill:#64748b22,stroke:#64748b,stroke-width:1.5px
    classDef dato fill:#2563eb22,stroke:#2563eb,stroke-width:1.5px
    classDef infra fill:#a1a1aa14,stroke:#a1a1aa,stroke-width:1.5px
    classDef ok fill:#16a34a22,stroke:#16a34a,stroke-width:1.5px
    classDef riesgo fill:#dc262622,stroke:#dc2626,stroke-width:1.5px
```

<p class="pie" markdown>El inventario sale del estado, no se escribe a mano: así no hay forma de que Ansible configure una máquina que ya no existe.</p>

Probar infraestructura es probar por niveles, del más barato al más caro. Cada nivel atrapa un tipo de error distinto y ninguno sustituye a los demás:

| Nivel | Qué se prueba | Cómo | Cuándo |
|----|----|----|----|
| Estático | Sintaxis, formato, buenas prácticas | `tofu fmt -check`, `tofu validate`, `ansible-lint`, `checkov` | En cada commit, en segundos, sin credenciales |
| Plan | Que el plan sea el esperado y nada se destruya por sorpresa | Leer `tofu plan`; `tofu plan -detailed-exitcode` en CI (0 sin cambios, 2 con cambios, 1 error) | Antes de cada apply |
| Unitario | Que un módulo produce los recursos que debe con unas entradas dadas | `tofu test` para módulos y Molecule para roles de Ansible; en el curso no se piden, y cómo son está en [Para ampliar](../ampliacion.md#tofu-test-y-molecule) | Al cambiar el módulo o el rol |
| Servicio | Que lo desplegado funciona de verdad | Smoke test: `curl -f http://10.20.2.10:8080/health` contra lo que el playbook ha desplegado, `nc -zv` a los puertos que deben escuchar | Después de cada apply |
| Configuración | Que la máquina es como se pidió | `ansible -m setup` y comparar `ansible_processor_vcpus`, `ansible_memtotal_mb`, tamaño de disco con los requisitos | Después de cada apply |
| Idempotencia | Segunda ejecución sin cambios | `tofu plan` = "No changes"; `ansible-playbook` con `changed=0` | Después de cada apply |

#### test.sh

El script que pide la actividad A5.6 y la práctica encadena los niveles Servicio, Configuración e Idempotencia. Lo importante es la disciplina de `set -euo pipefail` (para en el primer comando que falle, en variables sin definir y en tuberías rotas) y que cada comprobación salga con un mensaje claro:

```bash
#!/usr/bin/env bash
# test.sh: despliega pre y comprueba que está como se pidió.
# SOLO_PRUEBAS=1 ./test.sh pre se salta el despliegue y la idempotencia.
set -euo pipefail
ENV="${1:-pre}"
cd "$(dirname "$0")"

fail() { echo "FALLO: $*" >&2; exit 1; }

if [ -z "${SOLO_PRUEBAS:-}" ]; then
  echo "== Despliegue"
  ( cd "envs/$ENV" && tofu apply -auto-approve -input=false )
  ./gen-inventory.sh
  ansible-playbook -i ansible/inventory.ini ansible/site.yml
fi

echo "== Smoke tests"
for h in 10.20.1.10 10.20.2.10 10.20.3.10; do
  nc -zv -w 3 "$h" 22 || fail "la VM $h no responde por SSH"
done
nc -zv -w 3 10.20.3.10 5432 || fail "PostgreSQL no escucha en db01"
curl -fsS --max-time 5 http://10.20.2.10:8080/health >/dev/null || fail "el servicio no responde en /health"

echo "== Configuración contra requisitos"
vcpus=$(ansible -i ansible/inventory.ini db01 -m setup -a 'filter=ansible_processor_vcpus' \
        | grep -o '"ansible_processor_vcpus": [0-9]*' | grep -o '[0-9]*$')
[ "$vcpus" -ge 2 ] || fail "db01 tiene $vcpus vCPU, se pedían 2"
mem=$(ansible -i ansible/inventory.ini db01 -m setup -a 'filter=ansible_memtotal_mb' \
        | grep -o '"ansible_memtotal_mb": [0-9]*' | grep -o '[0-9]*$')
[ "$mem" -ge 900 ] || fail "db01 tiene $mem MB, se pedían 1024"

if [ -z "${SOLO_PRUEBAS:-}" ]; then
  echo "== Idempotencia"
  ( cd "envs/$ENV" && tofu plan -detailed-exitcode -input=false >/dev/null ) || fail "el plan no está limpio"
  ansible-playbook -i ansible/inventory.ini ansible/site.yml > /tmp/segunda.log
  if grep -q 'changed=[1-9]' /tmp/segunda.log; then
    fail "la segunda pasada de Ansible ha cambiado algo"
  fi
fi

echo "OK: despliegue $ENV válido"
```

Los smoke tests prueban lo que de verdad hay en `pre`, ni más ni menos: el servicio del curso en `app01`, que es lo que la API contesta en `/health`, y PostgreSQL en `db01`, que tiene que escuchar en el 5432. De `web01`, que en `pre` se queda como clon limpio de la plantilla, se comprueba lo que `tofu apply` promete: que la máquina existe, ha arrancado y admite SSH. Si algún día el playbook configura también un nginx en `web01`, su comprobación se añade aquí, y no al revés: un smoke test contra algo que nadie despliega falla siempre y acaba enseñando a ignorar los fallos. Las IP son las de `pre`, el único entorno que se despliega desde código.

El umbral de memoria es 900 y no 1024 porque el kernel reserva parte y `ansible_memtotal_mb` devuelve lo que ve el SO. La segunda pasada se da por buena solo si ningún host tiene `changed` distinto de 0: buscar `changed=0` no basta, porque lo encontraría en un host aunque el otro hubiera cambiado algo.

`SOLO_PRUEBAS=1` existe por una razón práctica: el playbook repara lo que encuentra roto. Si alguien para el servicio y se lanza el script completo, el playbook lo vuelve a levantar antes de los smoke tests y el script da `OK`. Para ver que las pruebas detectan un servicio caído hay que saltarse el despliegue, y es también el modo en que el pipeline de UT6 usa el script, porque despliega por su cuenta. Un script de pruebas que nunca se ha visto fallar no prueba nada.

### A5.6 Pruebas del despliegue (sesión 26)

<span class="et et-obj">Objetivo</span> Un `test.sh` que despliega, configura y comprueba el entorno `pre`, y que devuelve 0 cuando todo está bien y distinto de 0 cuando algo falla, demostrado con las dos salidas.

<span class="et et-pre">Antes de empezar</span> El repositorio tal como quedó en A5.5 (envs, playbook, `gen-inventory.sh`) con el servicio corriendo en `pre`. En el puesto de administración, `TF_VAR_pve_token` y las credenciales de la cuenta `tofu` de MinIO exportadas (`AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY`, como en la A5.4), y `curl` y `nc` instalados (`sudo apt install netcat-openbsd` si falta `nc`). Se han explicado [los niveles de prueba](#pruebas-del-despliegue) y el [script test.sh](#testsh).

<span class="et et-pas">Pasos</span>

1. Copia el `test.sh` del apartado a la raíz del repositorio y `chmod +x test.sh`. Los smoke tests no se tocan: comprueban lo que la A5.5 dejó en `pre` (SSH en las tres VM, PostgreSQL en `db01` y `/health` de la API en `app01`).
2. Ajusta los umbrales de la sección "Configuración contra requisitos" a tu tfvars (vCPU y MB de `db01`) si no son 2 y 1024.
3. `./test.sh pre` con todo en orden. Guarda la salida completa y el código de salida: `echo $?` justo después debe dar `0`.
4. Rompe la configuración: baja `cores` de `db01` a 1 en `envs/pre/terraform.tfvars` y ejecuta `./test.sh pre` otra vez. El `apply` reinicia `db01` con una sola vCPU y el script tiene que pararse en la comprobación de configuración. Guarda salida y `echo $?`.
5. Devuelve `cores` a 2 en el tfvars (se aplicará en el paso 6). Rompe ahora el servicio con `ssh ops@10.20.2.10 sudo docker compose -f /opt/servicio/compose.yml stop app` y ejecuta `SOLO_PRUEBAS=1 ./test.sh pre`: sin esa variable, el playbook volvería a levantar el servicio antes de probarlo. Guarda salida y código de salida.
6. Pasa `./test.sh pre` completo una última vez: el `apply` devuelve la vCPU a `db01`, el playbook levanta el servicio y el script queda en verde.

<span class="et et-com">Comprobación</span> Las ejecuciones de los pasos 3 y 6 terminan con `OK: despliegue pre válido` y `$?` igual a 0. Las de los pasos 4 y 5 terminan con una línea `FALLO: ...` que nombra la causa correcta (vCPU de `db01`, servicio sin responder en `/health`) y `$?` distinto de 0. Ninguna ejecución se queda colgada: si `curl` o `nc` tardan, revisa los `--max-time` y `-w`.

<span class="et et-ent">Entrega</span> `test.sh` en `iac-lab`, y en `ut5/a56/` de `entregas-5166` las tres salidas (correcta, vCPU baja, servicio parado) con su código de salida.

<span class="et et-ext">Si te sobra tiempo</span> Añade una comprobación de disco (`ansible_devices` en `-m setup`) o escribe un `tests/vm.tftest.hcl` para `modules/vm` con `command = plan`, como el de [Para ampliar](../ampliacion.md#tofu-test-y-molecule).

## Sesión 27 · Escaneo de seguridad

<p class="ut-meta" markdown>22 de enero · Teoría y práctica · <span class="dur" tabindex="0" aria-label="Seguridad del IaC · 15 min&#10;A5.7 Escaneo de seguridad · 95 min" data-dur="Seguridad del IaC · 15 min&#10;A5.7 Escaneo de seguridad · 95 min">:material-school:<i class="dur-barra" style="--teoria:14%"></i>:material-flask:</span></p>

Al acabar queda la lista completa de hallazgos de checkov, trivy y gitleaks sobre el repositorio, tabulada por severidad. Se ven los errores típicos del IaC, los tres escáneres y cómo se lee y se suprime un hallazgo con su justificación; corregirlos es la sesión 28, que es también donde se explica a fondo gitleaks.

### Seguridad del IaC

El código de infraestructura tiene un problema que el código de aplicación no tiene: un fallo no es un bug, es una VM con SSH abierto a todo Internet o un token de administrador en GitHub. Los errores que más se repiten:

- Secretos en claro (tokens de API, contraseñas de BD) en tfvars, en `group_vars` o en el propio HCL, subidos a Git. Una vez en el historial, están ahí aunque se borren en el siguiente commit.
- Puertos abiertos a `0.0.0.0/0`, usuarios con permisos de administrador donde bastaba `PVEVMUser`, discos y buckets sin cifrar.
- Versiones de provider y de módulos sin fijar, imágenes base sin actualizar desde hace un año.
- Estado de Terraform en el repositorio, con todo lo anterior dentro.

#### Escáneres

Tres herramientas, cada una con su foco. En el laboratorio se pasan las tres:

| Herramienta | Qué revisa | Instalación | Comando |
|----|----|----|----|
| checkov | Terraform, Ansible, Docker, Kubernetes, Helm, con cientos de reglas de configuración | `pipx install checkov` | `checkov -d .` |
| trivy config | Misma familia de reglas, en el mismo programa que el escáner de imágenes de Mantenimiento | ya está en el puesto de administración | `trivy config .` |
| gitleaks | Secretos en el árbol de trabajo y en todo el historial de Git, por patrones y entropía | `sudo apt install gitleaks` | `gitleaks detect -v` (o `gitleaks git` en versiones recientes) |

!!! otra "Repaso: Trivy"
    Trivy se explica a fondo en la [sesión 25 de Mantenimiento](https://victor-educ.github.io/apuntes-5169/ut/ut4-kpi-pruebas/#seguridad-zap-baseline-y-trivy-image) (21 de enero), y su A4.6 lo instala en el puesto de administración. Aquí solo cambia el modo: `trivy image` busca vulnerabilidades conocidas en los paquetes de una imagen; `trivy config` lee ficheros de configuración (HCL, YAML de Ansible, Dockerfile) y avisa de malas prácticas con su propio catálogo de reglas, sin consultar la base de vulnerabilidades.

En mucha documentación aparece un cuarto, tfsec, específico de Terraform: el proyecto está archivado y sus reglas se integraron en trivy, así que no hace falta pasarlo. checkov y trivy se solapan bastante; se pasan los dos porque las reglas no son idénticas y porque en una empresa pedirán uno u otro. gitleaks es de otra categoría: no mira la calidad del código, mira si se ha filtrado algo, y es el único que revisa commits antiguos. Hoy solo se ejecuta; qué hacer con lo que encuentra se ve en la [sesión 28](#secretos-gitleaks-y-pre-commit).

#### Cómo leer un hallazgo y cómo suprimirlo

Un hallazgo de checkov tiene este aspecto:

```text
Check: CKV_TF_1: "Ensure Terraform module sources use a commit hash"
        FAILED for resource: module.vm
        File: /envs/dev/main.tf:12-18
        Guide: https://docs.prismacloud.io/...
```

Id de la regla, qué comprueba, recurso y fichero con líneas, y un enlace con la explicación. Cada hallazgo se trata como una incidencia: se corrige, o se documenta por escrito por qué se acepta el riesgo. La supresión va en el código, junto al recurso, con la justificación en la misma línea para que quien lea el fichero la vea:

```hcl
resource "proxmox_virtual_environment_vm" "vm" {
  #checkov:skip=CKV_TF_1: módulo local del mismo repositorio, no aplica el hash
  #trivy:ignore:AVD-XXX-0001 laboratorio sin TLS válido; en pro el endpoint tiene certificado
  ...
}
```

Una supresión sin justificación no vale; en la práctica evaluable cuenta como hallazgo sin corregir. Los hallazgos de gitleaks tienen su propio tratamiento, que se ve en la sesión 28.

### A5.7 Escaneo de seguridad (sesión 27)

<span class="et et-obj">Objetivo</span> Tabla completa de hallazgos de checkov, trivy y gitleaks sobre el repositorio, cada uno clasificado, con su riesgo escrito y con la corrección prevista lista para aplicarla en la A5.8.

<span class="et et-pre">Antes de empezar</span> El repositorio de A5.6 con todo en commit. Se han explicado [los escáneres](#escaneres) y [cómo leer y suprimir un hallazgo](#como-leer-un-hallazgo-y-como-suprimirlo).

<span class="et et-pas">Pasos</span>

1. En el puesto de administración, instala lo que falta: `sudo apt install -y pipx gitleaks` y `pipx install checkov` (si después la terminal no encuentra `checkov`, `pipx ensurepath` y vuelve a entrar). Trivy ya lo tienes desde la A4.6 de Mantenimiento: comprueba `trivy version` y sigue.
2. Desde la raíz del repositorio ejecuta los tres escáneres y guarda cada salida en `informe/antes-*.txt`:

    ```bash
    mkdir -p informe
    checkov -d . > informe/antes-checkov.txt
    trivy config . > informe/antes-trivy.txt
    gitleaks detect -v > informe/antes-gitleaks.txt   # o gitleaks git -v
    ```

3. Cuenta lo que tienes antes de leerlo: cuántos hallazgos ha sacado cada herramienta y cuántos hay de cada severidad. checkov sin cuenta en su plataforma no muestra la severidad: a los suyos dales la de la regla equivalente de trivy, o media si trivy no la tiene. Después agrupa los altos y críticos en las cuatro categorías del apartado de [seguridad del IaC](#seguridad-del-iac) (secretos, exposición de red o permisos de más, versiones sin fijar, estado en el repositorio) y anota cuántos caen en cada una. Si alguno no encaja en ninguna, abre una categoría tuya y ponle nombre.
4. Lee de verdad los tres hallazgos más graves, o todos si hay menos de tres. De cada uno abre el enlace `Guide` (o busca el id en la documentación de la herramienta) y escribe dos cosas con tus palabras: qué comprueba la regla y qué podría pasar en este laboratorio si no se corrige. Una frase de riesgo por hallazgo, y que sea tuya, no la del enlace.
5. Compara checkov con trivy: busca un hallazgo que salga en los dos informes y otro que solo vea uno de ellos. Con esos dos delante, escribe dos líneas diciendo si en una empresa te llevarías las dos herramientas o te quedarías con una, y por qué.
6. Comprueba que los escáneres detectan de verdad, porque un informe vacío tanto puede significar que todo está bien como que la herramienta no está mirando donde crees. Sin hacer commit, introduce dos fallos a propósito en ficheros que ya estén en Git: pon `mode: "0777"` en una tarea `copy` del playbook y añade a cualquier `.tf` una línea con un token falso con el formato de Proxmox (`terraform@pve!tofu=` y un uuid inventado). Vuelve a pasar las tres herramientas (para el árbol de trabajo, `gitleaks detect --no-git` o `gitleaks dir .` según tu versión) y apunta qué herramienta ve cada fallo y cuál no lo ve: ninguna de las tres los ve los dos, y esa es la razón de pasarlas todas. Deshaz los cambios con `git checkout -- .` y confirma con `git status` que el árbol vuelve a estar limpio.
7. Escribe `informe/hallazgos.md`. Una fila por hallazgo alto o crítico, con estas columnas: id, severidad, fichero y línea, descripción, categoría del paso 3, riesgo en una frase (el del paso 4 en los que leíste a fondo), decisión (corregir o aceptar) y **corrección prevista**. Esa última columna es la que hace el trabajo: para los que vas a corregir, escribe qué fichero tocarás, en qué línea y qué vas a poner en ella; para los que vas a aceptar, escribe la línea de supresión completa (`#checkov:skip=ID: motivo` o `#trivy:ignore:ID motivo`) con el motivo ya redactado. No apliques nada todavía: eso es la A5.8.

<span class="et et-com">Comprobación</span> La tabla cubre todos los hallazgos de severidad alta o crítica de los tres informes y ninguna fila tiene la columna de corrección prevista vacía. Los dos fallos del paso 6 aparecen en la salida de alguna herramienta y `git status` vuelve a estar limpio.

<span class="et et-ent">Entrega</span> La carpeta `informe/` de `iac-lab` (los tres `antes-*.txt`, `hallazgos.md` y la comparación del paso 5). La columna de corrección prevista es el plan de trabajo de la A5.8 y el arranque del punto 5 de la práctica evaluable.

<span class="et et-ext">Si te sobra tiempo</span> Pasa `checkov --compact --framework ansible -d ansible/` y compara el recuento con el de la pasada general del paso 2. Mira si `.terraform.lock.hcl` está en el repositorio y qué versiones del provider fija por hash.

## Sesión 28 · Corrección de hallazgos

<p class="ut-meta" markdown>27 de enero · Teoría y práctica · <span class="dur" tabindex="0" aria-label="Secretos, gitleaks y pre-commit · 10 min&#10;A5.8 Corrección de hallazgos · 100 min" data-dur="Secretos, gitleaks y pre-commit · 10 min&#10;A5.8 Corrección de hallazgos · 100 min">:material-school:<i class="dur-barra" style="--teoria:9%"></i>:material-flask:</span></p>

Al acabar, el repositorio pasa checkov, trivy y gitleaks sin hallazgos altos ni críticos sin justificar, el token de Proxmox no está en ningún fichero ni en el historial y pre-commit bloquea un commit que lo contenga. Se explican las opciones para guardar secretos, qué hacer cuando gitleaks encuentra uno y el `.gitignore` y `pre-commit` que la hoja A5.8 instala.

### Secretos, gitleaks y pre-commit

Este apartado es el de referencia de gitleaks y pre-commit en las dos asignaturas: dónde puede vivir un secreto, qué se hace cuando uno se escapa al repositorio y cómo se impide que vuelva a pasar.

#### Gestión de secretos

Cuatro sitios, del más simple al más serio, y todos se usan:

| Dónde vive el secreto | Qué es | Cuándo se usa | Cómo lo leen OpenTofu y Ansible |
|----|----|----|----|
| Variable de entorno | `export TF_VAR_pve_token=...` en la sesión, o un `.env` fuera de Git que se carga con `source` | Un puesto de trabajo; no sirve para compartir | `TF_VAR_nombre`; `lookup('ansible.builtin.env', 'NOMBRE')` |
| Ansible Vault | Un fichero o un valor cifrado con una contraseña, que sí se sube | Secretos de Ansible en un equipo pequeño | Solo Ansible, con `--ask-vault-pass` o un fichero de contraseña |
| sops con age | Un YAML o JSON con los valores cifrados campo a campo y las claves legibles, que se sube y se descifra con la clave privada de cada persona | Equipos pequeños que quieren el secreto versionado con el código y sin servidor | Provider `carlpett/sops`; colección `community.sops` |
| HashiCorp Vault u OpenBao | Un servidor de secretos con autenticación, políticas, rotación y auditoría (OpenBao es su bifurcación libre, por la misma razón que OpenTofu) | Empresas grandes; montarlo bien es un proyecto en sí | Provider `vault`; colección `community.hashi_vault` |

En el laboratorio, el token de Proxmox va en variable de entorno y la contraseña de la base de `pre` la genera Ansible fuera del repositorio. En el pipeline (UT6) los secretos los guarda Jenkins como credenciales y los entrega solo al bloque que los usa, como variable de entorno o como fichero temporal que borra al salir, de modo que no quedan en el disco del agente. Cómo se trabaja con sops y age orden a orden está en [Para ampliar](../ampliacion.md#sops-age-y-vault-en-la-practica).

#### Cuando gitleaks encuentra algo

Hay dos casos y se tratan distinto. Un falso positivo (un valor de ejemplo, un hash que parece un token) se suprime con un fichero `.gitleaksignore` con la huella del hallazgo (commit:fichero:regla:línea), y la justificación va al informe como cualquier otra supresión. Un secreto real nunca se suprime: se rota primero (se revoca el token en Proxmox y se crea otro) y, si el repositorio no es público, se reescribe después el historial con `git filter-repo` (la herramienta que reescribe todos los commits para quitar el fichero o la línea). Si es público, se da por quemado aunque se reescriba. El orden importa: reescribir sin rotar deja el secreto válido en cualquier copia del repositorio que ya exista.

#### .gitignore y pre-commit

El `.gitignore` mínimo de un repositorio de IaC:

```text
.terraform/
*.tfstate
*.tfstate.*
*.tfplan
plan.bin
*.tfvars          # excepto los de ejemplo:
!*.example.tfvars
.env
*.pem
.vault_pass
```

Los tfvars con valores no sensibles (tamaños, nombres, IP internas) pueden subirse, y en `envs/` de hecho deben subirse porque son la definición del entorno. La regla se cambia a `**/secrets*.tfvars` en ese caso. Y para que nada de esto dependa de acordarse, pre-commit ejecuta los escáneres antes de cada commit:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.99.0
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_checkov
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.24.0
    hooks:
      - id: gitleaks
```

`pipx install pre-commit`, `pre-commit install` en el repositorio, y a partir de ahí un commit con un token dentro no llega a existir. Los hooks de pre-commit-terraform llaman al binario `terraform` por defecto; con `PCT_TFPATH=tofu` en el entorno usan OpenTofu. Las etiquetas `rev` de arriba son las de un momento concreto; `pre-commit autoupdate` las sube.

### A5.8 Corrección de hallazgos (sesión 28)

<span class="et et-obj">Objetivo</span> El repositorio pasa checkov, trivy y gitleaks sin hallazgos altos ni críticos sin justificar, no tiene secretos en el historial y pre-commit bloquea un commit con un token.

<span class="et et-pre">Antes de empezar</span> La tabla de hallazgos de A5.7. Se han explicado [dónde viven los secretos](#gestion-de-secretos), [qué hacer cuando gitleaks encuentra algo](#cuando-gitleaks-encuentra-algo) y [.gitignore y pre-commit](#gitignore-y-pre-commit).

<span class="et et-pas">Pasos</span>

1. Instala pre-commit en el puesto de administración: `pipx install pre-commit`.
2. Corrige todos los hallazgos altos y críticos: versión de provider fijada, `sensitive = true` donde falte, permisos de ficheros en `copy`, lo que salga. Para los que decidas aceptar, pon la supresión junto al recurso con la justificación en la misma línea (`#checkov:skip=ID: motivo`, `#trivy:ignore:ID motivo`) y copia la justificación al informe.
3. Si gitleaks ha encontrado el token en algún commit, sigue el orden del apartado: revoca el token en el nodo (`pveum user token remove terraform@pve tofu`), crea uno nuevo con la última orden del paso 2 de la A5.1, expórtalo en `TF_VAR_pve_token` y reescribe el historial con `git filter-repo`. Repite `gitleaks detect` hasta que no quede nada.
4. Crea `.pre-commit-config.yaml` con el contenido del apartado (pre-commit-terraform y gitleaks), exporta `PCT_TFPATH=tofu` y ejecuta `pre-commit install` y `pre-commit run --all-files`.
5. Demuestra el bloqueo: crea `prueba.tf` con la línea `api_token = "terraform@pve!tofu=12345678-1234-1234-1234-123456789abc"`, haz `git add` y `git commit`. Captura el rechazo de gitleaks y borra el fichero.
6. Vuelve a pasar los tres escáneres a `informe/despues-*.txt`.

<span class="et et-com">Comprobación</span> Los ficheros `despues-*` no contienen hallazgos de severidad alta o crítica que no estén en la tabla como aceptados y suprimidos con motivo; `gitleaks detect` sale sin hallazgos en todo el historial; la captura del paso 5 muestra el commit bloqueado.

<span class="et et-ent">Entrega</span> `informe/despues-*.txt`, `.pre-commit-config.yaml` y las supresiones en el código, en `iac-lab`, y la captura del paso 5 en `ut5/a58/` de `entregas-5166`. Este informe es el punto 5 de la práctica evaluable.

<span class="et et-ext">Si te sobra tiempo</span> Cifra con `ansible-vault encrypt_string` la contraseña que Ansible guardó en `ansible/secretos/db-pre` y ponla en `group_vars/all.yml` en lugar del `lookup`, o prueba sops con age sobre un `secrets.yaml`, y comprueba que gitleaks lo da por limpio.

## Sesión 29 · Práctica evaluable

<p class="ut-meta" markdown>29 de enero · Práctica evaluable · <span class="dur" tabindex="0" aria-label="Aclaración del enunciado · 10 min&#10;Trabajo en la práctica · 100 min" data-dur="Aclaración del enunciado · 10 min&#10;Trabajo en la práctica · 100 min">:material-school:<i class="dur-barra" style="--teoria:9%"></i>:material-flask:</span></p>

La sesión empieza con diez minutos de aclaración del enunciado y el resto es trabajo sobre el repositorio propio. Todo lo que se pide se ha construido en las hojas A5.1 a A5.8; aquí se cierra, se documenta en el README y se entrega. Conviene tener a mano la lista de errores frecuentes del final de la página.

Entrega el repositorio `iac-lab`, publicado en Gitea, con:

1. `README.md`: la tabla de requisitos con el origen del dato y las diferencias del laboratorio (de la A5.2, paso 2), y tres apartados cortos: cómo desplegar, cómo probar y cómo destruir.
2. Código OpenTofu modular: `modules/vm` y los entornos `dev` y `pre` en directorios (de la A5.4, pasos 1, 2 y 8), backend remoto con bloqueo (de la A5.4, pasos 5 y 7), versiones de provider fijadas y sin secretos en ningún fichero ni en el historial (de la A5.8, pasos 2 y 3), y las VM de `pre` con `prevent_destroy` (de la A5.3, pasos 2 y 6).
3. Playbook Ansible, con roles o sin ellos, pero con nombres completos de módulo y handlers, que deja PostgreSQL en `db01` y el servicio en `app01`, e inventario generado desde los outputs (de la A5.5, pasos 2, 6 y 7).
4. `test.sh` con smoke tests y comprobación de configuración, que devuelve 0 o distinto de 0 (de la A5.6).
5. Informe de seguridad: hallazgos, correcciones y justificaciones, con el antes y el después de los escáneres (de la A5.7 y la A5.8).

Checklist antes de entregar:

- [ ] `tofu fmt -check`, `tofu validate` y `ansible-lint` limpios (de la A5.5, paso 8, y de la A5.8, paso 4)
- [ ] Segundo `tofu plan` con `No changes` (de la A5.4, paso 4) y segunda pasada del playbook con `changed=0` (de la A5.5, paso 7)
- [ ] `gitleaks detect` sin hallazgos en todo el historial (de la A5.8, paso 3)
- [ ] `.gitignore` con tfstate, `.terraform/` y `ansible/secretos/` (de la A5.1, paso 4, y de la A5.5, paso 4)
- [ ] `test.sh` probado fallando y acertando (de la A5.6, pasos 3 a 6)

| Criterio | RA3 | Sale de | Peso |
|----|----|----|----|
| Requisitos recogidos y trasladados a variables | a | A5.2 | 20 % |
| Código de despliegue funcional, modular e idempotente | b | A5.3, A5.4 y A5.5 | 30 % |
| Ejecución con pruebas de servicio y chequeo de configuración | c | A5.6 | 25 % |
| Seguridad verificada: escaneo, correcciones, sin secretos | d | A5.7 y A5.8 | 25 % |

## Errores frecuentes en el laboratorio

- `Error: 401 authentication failure` en el primer `plan`. El token no tiene permisos: creado con separación de privilegios y sin ACL propia, o el formato no es `usuario@realm!nombre=uuid`. Se comprueba en Datacenter > Permissions, y con `curl -k -H "Authorization: PVEAPIToken=$TF_VAR_pve_token" https://192.168.1.50:8006/api2/json/version`.
- `Permission check failed (/sdn/zones/lab/devfront, SDN.Use)` en el `apply`. Al usuario le falta el tercer permiso de la A5.1, `PVESDNUser` sobre `/sdn/zones/lab`, que es el que deja conectar una VM a una VNet. `pveum user permissions terraform@pve` lista lo que tiene.
- `Error: x509: certificate signed by unknown authority`. El certificado de Proxmox es autofirmado y falta `insecure = true` en el provider (o, mejor en pro, la CA en el sistema).
- El apply se queda minutos en `Still creating...` y acaba en timeout. Casi siempre `agent { enabled = true }` con una plantilla que no tiene `qemu-guest-agent` instalado: el provider espera a que el agente informe de la IP. Se instala el agente en la plantilla 9000 o se quita el bloque.
- La VM arranca pero no tiene la IP que se le dio. cloud-init no ha corrido porque la plantilla no tenía el disco cloud-init (`ide2`) o el clon lo ha perdido; `qm config 210` en el nodo (o el ID de la VM afectada) muestra si existe. También pasa al clonar una VM que ya arrancó una vez: cloud-init solo aplica en el primer arranque.
- `Error acquiring the state lock` sin que nadie esté aplicando. Un apply anterior murió con el bloqueo puesto (Ctrl+C, portátil cerrado). `tofu force-unlock ID` con el ID que muestra el error, tras comprobarlo con el resto del grupo.
- El plan falla con `Instance cannot be destroyed` después de mover el recurso al módulo (sin `prevent_destroy`, querría destruir y crear las tres VM). Falta `tofu state mv` o el bloque `moved`. No se quita la protección para seguir: son las mismas VM con otra dirección en el estado.
- `Plan: 0 to add, 1 to change` cada vez que se ejecuta el plan, sin haber tocado nada. Un atributo que el provider lee distinto de como se escribió (mayúsculas en una MAC, tamaño de disco en G en vez de GB, orden de una lista). Se pone en el código el valor que devuelve el provider, o se añade a `lifecycle { ignore_changes = [...] }` con una justificación.
- Ansible: `Permission denied (publickey)`. La clave que cloud-init instaló no es la que usa el agente SSH local, o el usuario no es `ops`. `ssh -v ops@10.20.2.10` lo dice; `ansible_ssh_private_key_file` en el inventario lo arregla.
- Ansible: `/usr/bin/python3: not found`. Imagen mínima sin Python; `ansible -m raw -a 'apt-get install -y python3'` una vez, o meter el paquete en la plantilla.
- `ssh ops@10.20.x.10` se queda sin respuesta desde el puesto de administración. Falta un trozo del camino de gestión a `pre` del paso 1 de la A5.3: `ip route get 10.20.1.10` en el puesto tiene que salir por la `10.10.0.2`, y en `router-pre` `ip r` tiene que mostrar `10.10.0.0/24 dev ens23` y `nft list ruleset` las tres reglas de `forward`.
- El servicio de `app01` en `pre` no arranca y `docker compose ps` muestra `pull access denied for app`. La imagen no está cargada: repite la tubería `docker save | docker load` del paso 5 de la A5.5 con la etiqueta que dice `app_image` (`sudo grep APP_IMAGE /opt/servicio/.env` en `app01` muestra cuál espera).
- La segunda pasada del playbook sigue diciendo `changed=1`. Una tarea `command` sin `creates` o `changed_when`, o un `copy` de un fichero que otra tarea modifica después. El módulo `debug` y `--diff` localizan cuál.
- gitleaks encuentra el token en un commit de hace tres semanas aunque ya no está en el fichero. Está en el historial. Se rota el token en Proxmox primero y se reescribe el historial después.

Los enlaces para ampliar y los apartados que van más allá de lo que se hace en clase están en [Para ampliar](../ampliacion.md#ut5-infraestructura-como-codigo).
