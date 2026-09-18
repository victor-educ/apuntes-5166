# UT1 · Virtualización e hipervisores

<p class="ut-meta">12 h · Sesiones 1 a 6 · RA1 CE a</p>

Esta es la primera unidad del módulo y la que sostiene todas las demás. Todo lo que vais a desplegar en el curso (las VPC con SDN (redes definidas por software) de la UT2, los cortafuegos y proxies de la UT3, los clústeres de contenedores, los pipelines de Jenkins) corre sobre máquinas virtuales, y esas máquinas virtuales corren sobre un hipervisor que tenéis que saber instalar, configurar y, sobre todo, entender. Vais a montar vuestro propio Proxmox VE, a crear una plantilla con cloud-init (el servicio que configura una VM en su primer arranque) de la que saldrán decenas de VM en las próximas semanas y a medir qué aguanta y qué no aguanta vuestro laboratorio. En la UT2 cogeremos ese mismo Proxmox y le añadiremos redes definidas por software para construir una VPC como la de cualquier nube pública.

## Introducción

Antes de entrar en las sesiones, tres cosas: qué tenéis que saber hacer cuando termine la unidad, qué herramientas y conceptos van a aparecer y cómo se reparte todo entre las seis sesiones.

### Qué tienes que saber hacer al terminar

El criterio de evaluación de esta unidad es el RA1 a: instalar y configurar un hipervisor y conocer sus capacidades y limitaciones. Traducido al laboratorio:

- Instalar Proxmox VE (anidado dentro de otra VM o en hardware real) y dejarlo actualizado, con repositorios correctos y un usuario administrador que no sea root.
- Explicar qué hacen KVM y QEMU, por qué una VM con virtio va más rápida que una con IDE y e1000, y qué implica elegir un tipo de CPU u otro.
- Elegir un almacenamiento (LVM-thin, ZFS, directorio) y un formato de disco (raw, qcow2) sabiendo qué ganas y qué arriesgas con cada uno.
- Construir una plantilla cloud-init, clonarla y depurar el primer arranque cuando la VM no coge la IP o no acepta la clave SSH.
- Decidir entre VM y contenedor LXC con datos, no con intuición.
- Hacer y restaurar snapshots y backups, y saber por qué un snapshot no es un backup.
- Configurar la red del hipervisor: bridge con y sin interfaz física, VLAN-aware, NAT y bonding.
- Medir la capacidad real del hipervisor (CPU, RAM, disco, red) con herramientas estándar y documentar sus límites.

### Los conceptos de la unidad

En la sesión 3 necesitáis dos máquinas nuevas, `app01` y `mon01`, porque al día siguiente empieza la asignatura de mantenimiento y las quiere funcionando. Instaladas desde una ISO son 20 minutos de instalador por máquina, y luego usuario, clave SSH e IP a mano, con la IP mal escrita a la tercera. En la UT2 harán falta seis o siete. Lo que queremos conseguir al final de esta unidad, en una frase: un servidor que fabrica máquinas virtuales ya configuradas en segundos, y saber hasta dónde aguanta antes de que se caiga todo.

Los nombres que van a aparecer, antes de encontrároslos en el texto:

| Herramienta o concepto | Qué es, en una frase | Para qué la usamos en esta unidad |
|---|---|---|
| Hipervisor | El programa que reparte un ordenador físico entre varios sistemas operativos a la vez, aislados entre sí | Es lo que vais a instalar, configurar y medir |
| Proxmox VE | Un hipervisor libre basado en Debian con consola web, la nube privada del aula | El hipervisor del curso, de la sesión 1 hasta junio |
| KVM y QEMU | KVM es la parte del kernel de Linux que deja a la VM usar la CPU real; QEMU es el programa que le inventa el resto del ordenador | Entender por qué una VM va rápida o lenta y qué significa cada opción al crearla |
| virtio | Un atajo para que la VM hable con QEMU directamente en lugar de fingir que hay hardware real | El motivo de dejar disco y red en VirtIO y no en IDE o e1000 |
| LVM-thin, ZFS, raw y qcow2 | Las maneras de guardar los discos de las VM en el host (LVM-thin, ZFS) y el formato de cada disco (raw, qcow2) | Elegir dónde viven los discos y no llenar el almacén sin darse cuenta |
| Bridge Linux (`vmbr0`, `vmbr1`) y VLAN | Un switch virtual dentro del host al que se enchufan las VM; las VLAN son etiquetas que lo dividen en redes separadas | `vmbr0` da acceso al aula, `vmbr1` es la red interna del laboratorio |
| cloud-init | Un servicio de la VM que en el primer arranque lee un fichero con usuario, clave SSH e IP y lo aplica solo | Configurar cada VM nueva sin entrar en ella |
| Plantilla y clon | Una VM congelada de la que se sacan copias, enlazadas (comparten el disco base) o completas | Crear `web01`, `app01`, `mon01` y el resto de VM del curso desde una sola imagen |
| Snapshot y vzdump | Un snapshot es una foto del disco a la que se puede volver; vzdump es la copia de seguridad a otro sitio | Probar cosas peligrosas sin miedo |
| LXC | Contenedor de sistema: un Linux completo que comparte el kernel del host, más ligero que una VM y menos aislado | Compararlo con la VM con números |
| stress-ng, fio, iperf3 | Programas que cargan a propósito CPU, disco y red para medir cuánto dan | Poner números a los límites de vuestro laboratorio |

**Cómo está organizada la unidad.** Después de esta introducción, la unidad sigue las sesiones en el orden en que se dan: cada sesión trae primero los apuntes de la teoría que se explica ese día (y, cuando hace falta, algún apartado de consulta que no se explica pero que la hoja necesita) y después su hoja de práctica. En la sesión 1 instaláis Proxmox VE anidado dentro de una VM de vuestro portátil, tras ver qué es virtualizar y qué tipos de hipervisor hay. En la sesión 2 lo dejáis listo para trabajar: repositorios, almacenamiento, un segundo bridge y un usuario administrador. En la sesión 3 construís la plantilla cloud-init y sacáis de ella `web01`, `app01` y `mon01`. En la sesión 4 entendéis qué hay debajo (KVM, QEMU, virtio), comparáis una VM con un contenedor LXC con medidas y probáis snapshots y backups. En la sesión 5 montáis VLAN sobre el bridge interno y tomáis las primeras medidas de CPU, disco y red, que son el borrador de la práctica evaluable de la sesión 6. Todas las hojas se hacen en el laboratorio; la entrega son capturas y respuestas en un documento breve (una página por actividad) salvo que se indique otra cosa. Los errores frecuentes quedan al final, como material de consulta para cualquier sesión.

!!! info "Dónde se usa esto en la otra asignatura"
    La asignatura de mantenimiento (5169) empieza el 1 de octubre, un día antes que esta, y su [UT1 Observabilidad](https://victor-educ.github.io/apuntes-5169/ut/ut1-observabilidad/) necesita desde la primera semana máquinas que vigilar; la VPC de la UT2 y el firewall de la UT3 no llegan hasta noviembre y diciembre. Por eso en la sesión 3 de esta unidad, junto a `web01`, clonáis de la misma plantilla cloud-init dos VM en el bridge del aula (`vmbr0`): `app01`, con el servicio del curso en compose, y `mon01`, donde 5169 levanta Prometheus, Alertmanager y Grafana con un compose que se da allí en su sesión 1. Se usan en 5169 al día siguiente, así que tienen que arrancar, coger IP y aceptar la clave SSH ese mismo día.
    Ese es el entorno provisional de 5169 en octubre y noviembre. Cuando esta asignatura termine la UT2 (13 nov) y la UT3 (4 dic), las dos VM se mueven a la VPC dev detrás del firewall, y lo hace 5169 en su UT3 (24 nov a 3 dic). Todo lo que aprendáis aquí sobre cloud-init, snapshots y `qm` lo vais a repetir allí cada vez que una de esas VM se rompa.

### Plan de sesiones

Cada sesión de dos horas empieza con una explicación corta y sigue con laboratorio. La columna "Se explica" es lo que cuento yo al principio (con su duración aproximada); la columna "Se practica" es lo que hacéis vosotros con el material de práctica de esta unidad. Las sesiones marcadas solo como práctica no traen teoría nueva.

| Sesión | Fecha | Tipo | Se explica | Se practica |
|---:|-------|------|------------|-------------|
| [1](#sesion-1-presentacion-e-instalacion-del-hipervisor) | 2 oct | Teoría y práctica | Presentación del módulo, evaluación y laboratorio (20 min). Qué es virtualizar; hipervisores tipo 1 y 2; qué es Proxmox y por qué lo usamos (25 min). | Comprobar VT-x/AMD-V, crear la VM anidada e instalar Proxmox VE desde la ISO. Al final: consola web accesible en el puerto 8006. |
| [2](#sesion-2-configuracion-inicial-de-proxmox) | 7 oct | Teoría y práctica | Repositorios, almacenamiento (local, LVM-thin), bridges y realms de usuarios: qué es cada cosa y para qué sirve (25 min). | Cambiar repositorios y actualizar, crear usuario admin en realm pve, crear vmbr1 sin interfaz física, revisar los almacenes. |
| [3](#sesion-3-primera-vm-y-plantilla) | 14 oct | Teoría y práctica | cloud-init, plantillas y clon completo frente a enlazado (20 min). | Crear la plantilla 9000 desde la imagen cloud de Debian, clonar web01, app01 y mon01 (las dos últimas para Mantenimiento), acceder por SSH. |
| [4](#sesion-4-vm-vs-lxc-snapshots-y-limites) | 16 oct | Teoría y práctica | Cómo funcionan KVM/QEMU y virtio; LXC frente a VM; qué es un snapshot en LVM-thin y qué no es (25 min). | Crear un LXC y compararlo con la VM; snapshot, romper e instalar nginx, rollback; backup con vzdump. |
| [5](#sesion-5-redes-en-el-hipervisor) | 21 oct | Teoría y práctica | Bridge, VLAN-aware bridge, bond y NAT: qué resuelve cada uno (20 min). | vmbr1 VLAN aware, tres VM en dos VLAN, comprobar con ping quién ve a quién. Medir CPU, disco y red con stress-ng, fio e iperf3. |
| [6](#sesion-6-practica-evaluable) | 23 oct | Práctica evaluable | Aclaración del enunciado (10 min). | Desplegar app-eval desde la plantilla con los parámetros dados y redactar el informe de capacidades y limitaciones con medidas reales. |

## Sesión 1 · Presentación e instalación del hipervisor

<p class="ut-meta">2 de octubre · Teoría y práctica · Explicación unos 45 min · Práctica unos 75 min</p>

Al acabar la sesión tenéis un Proxmox VE instalado dentro de una VM de vuestro portátil y su consola web abierta en el puerto 8006. Los primeros 20 minutos son la presentación del módulo, la evaluación y el laboratorio; después explico qué es virtualizar, qué tipos de hipervisor hay y por qué usamos Proxmox, que son los dos apartados que siguen. Los requisitos hardware no se explican en clase, pero la hoja de práctica os manda leerlos antes de crear la VM exterior: el punto de la virtualización anidada es el que más disgustos da.

### Qué es virtualizar y para qué sirve

Este apartado pone el vocabulario mínimo: qué es una máquina virtual, quién la fabrica y por qué las empresas las usan en lugar de un servidor por aplicación. Sin esto, las tablas de tipos de hipervisor y de VM frente a contenedor que vienen después no se leen bien.

Virtualizar es ejecutar varios sistemas operativos independientes sobre un mismo hardware físico. Un software llamado hipervisor reparte CPU, memoria, disco y red entre las máquinas virtuales (VM) y las mantiene aisladas entre sí. Cada VM cree que tiene un ordenador para ella sola: una BIOS o UEFI, una CPU con sus registros, una controladora de disco, una tarjeta de red. Nada de eso existe físicamente; es el hipervisor el que lo fabrica y el que decide en cada instante qué VM usa el núcleo físico número 3 o quién escribe en el disco.

Se virtualiza por cinco razones que os vais a encontrar en cualquier empresa:

- Consolidación. Un servidor físico de 2024 tiene 32 o 64 núcleos y 256 GB de RAM; ninguna aplicación normal los usa. Con virtualización, ese servidor aloja decenas de VM en lugar de una sola aplicación, y la factura de electricidad y de rack se divide entre todas.
- Aislamiento. Si una VM falla, se cuelga o se compromete, las demás siguen. El hipervisor es la frontera de seguridad.
- Snapshots y clonado. Se guarda el estado de una VM y se vuelve a él en segundos. Antes de una actualización arriesgada, snapshot; si sale mal, rollback y a otra cosa.
- Portabilidad. Una VM se mueve entre hosts sin reinstalar, incluso encendida (migración en vivo). El hardware físico se cambia sin que el servicio se entere.
- Base de la nube. Toda nube pública es, por debajo, hipervisores gestionados a gran escala. Una instancia EC2 de AWS es una VM sobre KVM (Nitro); una VM de Azure corre sobre Hyper-V. Cuando en la UT4 lancéis instancias en la nube, estaréis haciendo con una API lo mismo que haréis aquí con `qm create`.

#### VM frente a contenedor

Como ya conocéis Docker, conviene aclarar desde el principio qué relación hay entre lo que vais a hacer en esta unidad y los contenedores del título del módulo.

|  | Máquina virtual | Contenedor |
|----|----|----|
| Qué virtualiza | Hardware completo (CPU, disco, red) | Solo el espacio de usuario; comparte el kernel del host |
| Sistema operativo | Cada VM lleva el suyo, con su propio kernel | Usa el kernel del host |
| Arranque | Segundos a minutos | Milisegundos |
| Tamaño | GB | MB |
| Aislamiento | Fuerte (hipervisor, CPU en modo invitado) | Medio (namespaces, cgroups, seccomp) |
| Caso típico | Servidores completos, distintos SO, seguridad, hipervisor anidado | Aplicaciones, microservicios, CI/CD |

En este curso los contenedores se ejecutan dentro de máquinas virtuales: el hipervisor da la infraestructura y los contenedores dan la aplicación. Es exactamente lo que hace cualquier proveedor cloud con un clúster de Kubernetes gestionado: los nodos son VM. Un contenedor no puede ejecutar otro kernel ni otro sistema operativo, y un proceso que escape de un contenedor está en el kernel del host; un proceso que escape de una VM (cosa muchísimo más rara) está en el hipervisor. Esa diferencia de aislamiento es la razón de que los proveedores no mezclen contenedores de clientes distintos sobre el mismo kernel.

### Tipos de hipervisor

Aquí clasificamos los hipervisores en dos familias y explicamos por qué el curso usa Proxmox VE. Os interesa porque en el laboratorio vais a tener los dos tipos a la vez: uno en vuestro portátil y otro, Proxmox, dentro de él.

<figure markdown="span">
  ![Hipervisor tipo 1 sobre el hardware frente a hipervisor tipo 2 sobre un sistema operativo anfitrión](../img/hipervisor-tipos.png){ width="640" }
  <figcaption>Hipervisor de tipo 1 (bare metal) frente a tipo 2 (hosted). Fuente: Scsami, CC0, vía Wikimedia Commons.</figcaption>
</figure>

|  | Tipo 1 (bare metal) | Tipo 2 (hosted) |
|----|----|----|
| Dónde se instala | Directamente sobre el hardware | Sobre un sistema operativo de escritorio |
| Rendimiento | Alto | Menor (hay un SO por medio) |
| Uso | Servidores, centros de datos, nube | Pruebas, desarrollo, laboratorio |
| Ejemplos | Proxmox VE (KVM), VMware ESXi, Microsoft Hyper-V, Xen | VirtualBox, VMware Workstation, Parallels |

La clasificación es útil pero tiene una trampa que os preguntaré en clase: KVM es un módulo del kernel de Linux, así que un Debian de escritorio con KVM y virt-manager es técnicamente tipo 1 (el kernel que gestiona las VM es el mismo que gestiona el hardware) aunque lo uséis como si fuera tipo 2. Lo que distingue de verdad a un hipervisor de producción no es la etiqueta sino que el sistema anfitrión esté dedicado y recortado a esa función, con una capa de gestión encima. Eso es Proxmox VE.

En el módulo usaremos Proxmox VE: libre (AGPLv3), basado en Debian, con KVM para VM y LXC para contenedores de sistema, y con una consola web completa. Es lo más parecido a una nube privada que se puede montar en un aula, y desde que Broadcom cambió el licenciamiento de VMware en 2024 es también lo que muchas pymes y centros educativos han adoptado en producción. Proxmox VE 8 está construido sobre Debian 12 (bookworm) y Proxmox VE 9 sobre Debian 13 (trixie); en el laboratorio instalaremos la 9, pero todo lo que hay en estos apuntes vale para las dos salvo donde se indique.

### Requisitos hardware

*Material de consulta: no se explica en clase; lo necesitas para la hoja de práctica de esta sesión.*

Antes de instalar nada, esta lista dice qué tiene que tener el equipo y qué hay que activar en el hipervisor exterior. El punto de la virtualización anidada es el que más disgustos da en la sesión 1: si se salta, Proxmox se instala igual pero sus VM van a paso de tortuga.

- CPU con extensiones de virtualización: Intel VT-x o AMD-V. Sin ellas KVM no funciona. Se comprueba con `egrep -c '(vmx|svm)' /proc/cpuinfo` (debe dar más de 0). Si da 0 en un equipo moderno, la causa casi siempre es que está desactivado en la BIOS/UEFI.
- VT-d / AMD-Vi (IOMMU) para pasar dispositivos físicos a una VM (passthrough). Opcional.
- Virtualización anidada: para instalar Proxmox dentro de una VM (lo que haremos en el laboratorio) hay que activarla en el hipervisor exterior. En un host Linux con KVM, `options kvm-intel nested=1` (o `kvm-amd`) en `/etc/modprobe.d/kvm.conf` y se comprueba con `cat /sys/module/kvm_intel/parameters/nested`. En VirtualBox, "Enable Nested VT-x/AMD-V" en la pestaña de procesador o `VBoxManage modifyvm pve --nested-hw-virt on`. En VMware Workstation, "Virtualize Intel VT-x/EPT or AMD-V/RVI". Si el hipervisor exterior es otro Proxmox, la VM debe tener tipo de CPU `host`. Sin esto, el Proxmox anidado instala pero al arrancar una VM dirá que KVM no está disponible y la ejecutará en emulación pura (TCG), a una velocidad diez o veinte veces menor.
- RAM: el hipervisor consume poco (un Proxmox recién instalado usa alrededor de 1 GB), pero cada VM necesita la suya. Regla de aula: 2 GB por VM de servidor. Si usáis ZFS, sumad lo que reserve la caché ARC (la caché de lectura de ZFS en RAM; el instalador de Proxmox la limita al 10 % de la RAM, con máximo de 16 GB, desde la 8.1).
- Almacenamiento: SSD. Proxmox usa por defecto LVM-thin (aprovisionamiento ligero: solo ocupa lo escrito). Un disco mecánico con cuatro VM haciendo E/S aleatoria a la vez es la experiencia más frustrante que os puede dar un laboratorio.
- Red: una interfaz basta para empezar; dos permiten separar gestión y tráfico de VM, y tres o cuatro son lo normal en un servidor de producción (gestión, VM, almacenamiento, migración o corosync).

### A1.1 Instalar Proxmox VE (sesión 1)

**Objetivo.** Al terminar tienes un Proxmox VE 9 instalado dentro de una VM de tu portátil y entras en su consola web en el puerto 8006.

**Antes de empezar.**

- VirtualBox o VMware Workstation instalado en tu equipo, con 16 GB de RAM y al menos 80 GB libres en un SSD.
- La ISO de Proxmox VE 9 (la última 9.x de la web de Proxmox, alrededor de 1,5 GB). Descárgala antes de clase si puedes; la red del aula se resiente cuando la bajan treinta personas a la vez.
- Lo explicado al principio de la sesión: [qué es virtualizar](#que-es-virtualizar-y-para-que-sirve) y [tipos de hipervisor](#tipos-de-hipervisor). Los [requisitos hardware](#requisitos-hardware) no se explican en clase: lee ese apartado antes del paso 2, sobre todo el punto de la virtualización anidada.

**Pasos.**

1. Comprueba que tu equipo tiene virtualización activada. En Linux, `egrep -c '(vmx|svm)' /proc/cpuinfo` tiene que dar más de 0. En Windows, la pestaña Rendimiento del Administrador de tareas muestra "Virtualización: habilitado". Si da 0 o "deshabilitado", actívalo en la BIOS/UEFI antes de seguir; sin esto no hay práctica.
2. Crea la VM exterior: tipo Linux Debian 64 bits, 4 vCPU, 8 GB de RAM, 60 GB de disco, red en modo puente (bridged) y virtualización anidada activada. En VirtualBox es Sistema > Procesador > "Enable Nested VT-x/AMD-V", o desde terminal:
   ```bash
   VBoxManage modifyvm pve --nested-hw-virt on
   ```
   En VMware Workstation es Processors > "Virtualize Intel VT-x/EPT or AMD-V/RVI".
3. Arranca la VM con la ISO y sigue el instalador: acepta la licencia, deja el disco y el sistema de ficheros por defecto (ext4 con LVM-thin), país y zona horaria, contraseña de root y un correo. En la pantalla de red anota el nombre de host (por ejemplo `pve.lab.local`), la IP de gestión que propone y la puerta de enlace. Al terminar se reinicia y muestra en la consola la URL de acceso.
4. Desde el navegador de tu portátil abre `https://IP:8006`. El certificado es autofirmado y el navegador avisará; acepta la excepción. Entra como `root` con el realm `Linux PAM` y cierra el aviso de suscripción.
5. Abre la shell del nodo (nodo > Shell) y comprueba la anidada:
   ```bash
   nproc
   cat /sys/module/kvm_intel/parameters/nested   # o kvm_amd
   ```

**Comprobación.** La consola web muestra el nodo con su CPU, su RAM y los almacenes `local` y `local-lvm`; `nproc` devuelve 4 y el fichero `nested` devuelve `Y` (o `1`). Si devuelve `N`, revisa el paso 2 antes de la sesión 2: es el error más habitual de la unidad y está descrito en [Errores frecuentes](#errores-frecuentes-en-el-laboratorio).

**Entrega.** Una página en el documento de la unidad con la captura del panel principal, la IP y el nombre de host, y la respuesta a tres preguntas: ¿qué tipo de hipervisor es Proxmox? ¿Y el que has usado para alojarlo? ¿Qué devuelve `cat /sys/module/kvm_intel/parameters/nested` (o `kvm_amd`) dentro de tu Proxmox, y qué significa?

**Si te sobra tiempo.** En la shell del nodo, `pveversion -v` te dice qué kernel y qué versión de QEMU lleva tu Proxmox. Abre `/etc/network/interfaces` con `cat` y compáralo con el ejemplo del [apartado de red](#red): ya tienes un `vmbr0` con la tarjeta física como puerto.

## Sesión 2 · Configuración inicial de Proxmox

<p class="ut-meta">7 de octubre · Teoría y práctica · Explicación unos 25 min · Práctica unos 95 min</p>

Al acabar la sesión el Proxmox está actualizado, con un usuario administrador que no es root, un segundo bridge interno y las herramientas de medida instaladas. La explicación recorre las cuatro piezas de Proxmox que toca la hoja: cómo está construido, dónde guarda los discos, cómo conecta las VM a la red y quién puede hacer qué. Las modalidades de red más allá del bridge simple (VLAN, NAT, bond) se dejan para la sesión 5.

### Proxmox VE

Este apartado recorre las cuatro piezas de Proxmox que vais a tocar en las sesiones 1 y 2: cómo está construido, dónde guarda los discos, cómo conecta las VM a la red y quién puede hacer qué. Cada una lleva sus órdenes de terminal; la web hace lo mismo con clics, pero saber la orden es lo que os permitirá automatizarlo en la UT5.

#### Arquitectura

Debian + kernel Linux con KVM/QEMU (máquinas virtuales) + LXC (contenedores de sistema) + un servicio de gestión (`pve`) con API REST, consola web en el puerto 8006 y herramientas de línea de comandos. Toda la configuración del clúster vive en `/etc/pve`, que no es un directorio normal sino un sistema de ficheros en memoria (`pmxcfs`) replicado entre nodos y respaldado por una base de datos SQLite; por eso `/etc/pve/qemu-server/101.conf` aparece en todos los nodos de un clúster aunque la VM solo exista en uno.

| Herramienta | Para qué |
|-----------------|--------------------------------------------------------|
| `qm` | Máquinas virtuales: crear, arrancar, clonar, snapshots, migrar |
| `pct` | Contenedores LXC |
| `pvesm` | Almacenamiento: listar, añadir, ver ocupación |
| `pveum` | Usuarios, grupos, roles y permisos |
| `vzdump` | Copias de seguridad |
| `pveam` | Descargar plantillas de contenedor |
| `pvecm` | Clúster: crear, añadir nodos, ver quórum |
| `pveperf` | Medida rápida de CPU y disco del host |

Puertos que conviene tener en la cabeza: 8006 (web y API), 22 (SSH), 5900 a 5999 (consolas VNC), 3128 (proxy SPICE, un protocolo de consola remota), 5405 a 5412 UDP (corosync, la mensajería del clúster; solo en clúster) y 60000 a 60050 (migraciones).

#### Almacenamiento

Cada almacén tiene un tipo y un contenido permitido (imágenes de disco, ISOs, plantillas de contenedor, backups, snippets). La instalación por defecto crea dos:

- `local` (tipo directorio, en `/var/lib/vz`): ISOs, plantillas de contenedor, backups y snippets. Puede alojar también discos de VM en formato qcow2 o raw como ficheros en `/var/lib/vz/images/<vmid>/`.
- `local-lvm` (tipo LVM-thin, sobre el volumen `pve/data`): discos de VM y contenedores como volúmenes lógicos de bloques. Aprovisionamiento ligero y snapshots.

Y otros que añadiréis según el caso:

- ZFS: si hay discos de sobra. Snapshots instantáneos, compresión transparente (lz4), sumas de verificación de cada bloque, replicación integrada entre nodos (`pvesr`) y RAID por software sin controladora. A cambio, RAM para la caché ARC y una cierta penalización de escritura por el copy-on-write.
- NFS / CIFS / iSCSI: almacenamiento compartido entre varios nodos, requisito para migrar en vivo sin copiar el disco y para la alta disponibilidad.
- Ceph: almacenamiento distribuido integrado en Proxmox; a partir de tres nodos.
- Proxmox Backup Server: destino de backups deduplicados (más abajo).

Cómo elegir, con lo que pesa cada opción:

| | LVM-thin | ZFS | Directorio (ext4/xfs) |
|---|---|---|---|
| Formato de disco de VM | raw (volumen de bloques) | raw (zvol) | qcow2 o raw (fichero) |
| Snapshots | Sí, de bloques, rápidos | Sí, instantáneos | Solo con qcow2 |
| Thin provisioning | Sí | Sí | Sí con qcow2 (crece bajo demanda) |
| Clones enlazados | Sí | Sí | Sí con qcow2 |
| Integridad de datos | La del disco | Checksums, autocorrección con redundancia | La del sistema de ficheros |
| Coste en RAM | Ninguno | ARC (GB) | Ninguno |
| Cuándo | Un solo disco, laboratorio, lo simple | Varios discos, datos que importan, replicación | Almacén compartido NFS, ISOs, backups |

Sobre los formatos: **raw** es una imagen byte a byte del disco, sin cabecera, lo más rápido y lo que usan LVM y ZFS; **qcow2** (QEMU Copy On Write v2) es un formato de fichero con metadatos que permite crecer bajo demanda, snapshots internos, compresión y una imagen base de la que cuelgan otras (así se hacen los clones enlazados en un directorio). Con qcow2 pagáis una capa de indirección (tablas L1/L2) y una fragmentación que se nota con el tiempo; en un directorio sobre SSD la diferencia con raw es de un 5 a un 10 % en E/S aleatoria, aceptable para laboratorio. Las imágenes cloud se distribuyen en qcow2 porque es lo compacto; al importarlas a LVM-thin Proxmox las convierte a raw automáticamente.

El **thin provisioning** merece un aviso serio. Un almacén de 200 GB puede tener asignados 10 discos de 50 GB (500 GB "prometidos") porque solo ocupan lo escrito. Mientras las VM estén medio vacías, perfecto. El día que dos de ellas se llenen a la vez y el pool llegue al 100 %, LVM-thin no puede atender las escrituras: las VM reciben errores de E/S, sus sistemas de ficheros pasan a solo lectura o se corrompen, y vosotros no podéis ni borrar un snapshot para hacer sitio porque borrar también necesita metadatos. En ZFS el comportamiento es similar cuando el pool se llena, agravado por el copy-on-write. Vigiladlo con `lvs` (columnas `Data%` y `Meta%`) o `zpool list`, y activad el descarte de bloques (`discard=on` en el disco de la VM y `fstrim` periódico dentro del invitado, que Debian ya trae como temporizador de systemd) para que el espacio que la VM libera vuelva al pool. Sin descarte, un pool thin solo crece.

```bash
# Ocupación real del pool thin y de cada disco
lvs pve/data
lvs -o lv_name,lv_size,data_percent pve
# Descarte desde el host, a través del agente QEMU
qm guest cmd 101 fstrim
```

#### Red

Proxmox no conecta las VM directamente a la tarjeta física: crea un bridge Linux (`vmbr0`) que actúa como un switch virtual. La tarjeta física se conecta al bridge y las VM se conectan al bridge con interfaces `tap` (una por tarjeta virtual: `tap101i0` es la net0 de la VM 101). La configuración está en `/etc/network/interfaces` y la aplica `ifupdown2` sin reiniciar con `ifreload -a`; la web hace eso mismo cuando pulsáis "Apply Configuration".

```text
auto lo
iface lo inet loopback

iface eno1 inet manual

auto vmbr0
iface vmbr0 inet static
    address 192.168.1.50/24
    gateway 192.168.1.1
    bridge-ports eno1
    bridge-stp off
    bridge-fd 0

auto vmbr1
iface vmbr1 inet static
    address 10.10.10.1/24
    bridge-ports none
    bridge-stp off
    bridge-fd 0
    bridge-vlan-aware yes
    bridge-vids 2-4094
```

#### Usuarios y permisos

Los usuarios pertenecen a un realm (`pam` = usuarios Linux del host, `pve` = usuarios propios de Proxmox, almacenados en `/etc/pve/user.cfg`; también se pueden enganchar directorios externos: LDAP, Active Directory y OpenID Connect). Los permisos se asignan como un rol (conjunto de privilegios: `Administrator`, `PVEAdmin`, `PVEVMAdmin`, `PVEVMUser`, `PVEAuditor`, `PVEDatastoreUser`...) sobre una ruta del árbol de objetos (`/`, `/vms/100`, `/storage/local`, `/nodes/pve1`), con o sin propagación a los hijos. Buena práctica: no trabajar como `root@pam`; crear un usuario administrador en el realm `pve` y reservar root para lo que solo root puede hacer (algunas operaciones del nodo y la consola del host). Los tokens de API (claves con las que un programa habla con Proxmox sin contraseña), que usaréis con OpenTofu en la UT5, se crean sobre un usuario y heredan o restringen sus permisos.

```bash
pveum user add admin@pve --password 'CambiaEsto' --comment "Administrador del laboratorio"
pveum acl modify / --users admin@pve --roles Administrator
pveum user list
pveum acl list
```

### A1.2 Configuración inicial (sesión 2)

**Objetivo.** Un Proxmox actualizado, con un usuario administrador que no es root, un segundo bridge interno y las herramientas de medida instaladas.

**Antes de empezar.**

- El Proxmox de A1.1 arrancado y accesible en el puerto 8006, con `nested` en `Y`.
- Lo explicado al principio de la sesión: [arquitectura y herramientas](#arquitectura), [almacenamiento](#almacenamiento), [red](#red) y [usuarios y permisos](#usuarios-y-permisos).

**Pasos.**

1. Repositorios. En la web, nodo > Updates > Repositories: desactiva `pve-enterprise` y el `ceph` enterprise (botón Disable) y añade `No-Subscription` (botón Add). En Proxmox VE 9 quedan como ficheros en `/etc/apt/sources.list.d/*.sources`; míralos desde la shell.
2. Actualiza desde la shell del nodo:
   ```bash
   apt update && apt full-upgrade -y
   ```
   Si ha entrado un kernel nuevo (aparece un paquete `proxmox-kernel-...` en la salida), reinicia con `reboot` y vuelve a entrar.
3. Almacenamiento. En Datacenter > Storage mira qué contenido admite `local` (ISO, plantillas de contenedor, backups, snippets) y qué admite `local-lvm` (discos de VM y contenedores). Desde la shell:
   ```bash
   pvesm status
   lvs pve/data
   ```
   Anota el tamaño del pool thin y las columnas `Data%` y `Meta%`.
4. Usuario administrador:
   ```bash
   pveum user add admin@pve --password 'CambiaEsto' --comment "Administrador del laboratorio"
   pveum acl modify / --users admin@pve --roles Administrator
   pveum user list
   pveum acl list
   ```
   Cierra sesión y entra con `admin` en el realm `Proxmox VE authentication server`. A partir de ahora trabajas con él.
5. Segundo bridge. En nodo > Network > Create > Linux Bridge: nombre `vmbr1`, IPv4/CIDR `10.10.10.1/24`, el campo Bridge ports vacío. Pulsa Apply Configuration. Equivale a añadir esto a `/etc/network/interfaces` y ejecutar `ifreload -a`:
   ```text
   auto vmbr1
   iface vmbr1 inet static
       address 10.10.10.1/24
       bridge-ports none
       bridge-stp off
       bridge-fd 0
   ```
6. Herramientas de medida en el host:
   ```bash
   apt install -y stress-ng fio iperf3 sysstat
   ```

**Comprobación.** `apt update` termina sin errores 401; `pveum user list` muestra `admin@pve`; `ip -br addr` muestra `vmbr0` con la IP del aula y `vmbr1` con `10.10.10.1/24`; `fio --version` responde.

**Entrega.** Captura de `/etc/network/interfaces` y de la lista de usuarios (`pveum user list`), más el tamaño del pool thin, en el documento de la unidad.

**Si te sobra tiempo.** Descarga ya en `/root` la imagen cloud de Debian 13 que usarás en la sesión 3 (el `wget` del paso 1 de A1.3) para no depender de la red del aula ese día. Crea un segundo usuario con rol `PVEAuditor` sobre `/`, entra con él y anota qué puede ver y qué no puede tocar.

## Sesión 3 · Primera VM y plantilla

<p class="ut-meta">14 de octubre · Teoría y práctica · Explicación unos 20 min · Práctica unos 100 min</p>

Al acabar la sesión tenéis una plantilla cloud-init (VM 9000) de la que salen `web01`, `app01` y `mon01`, las tres con IP y acceso SSH con vuestra clave; las dos últimas las usa Mantenimiento al día siguiente. Explico cloud-init, las plantillas y la diferencia entre clon completo y enlazado. Los parámetros de `qm create` y los tipos de CPU están aquí para que entendáis cada opción de la hoja; snapshots y backups, que cierran el ciclo de vida de una VM, se ven en la sesión 4.

### Máquinas virtuales en Proxmox

Con el hipervisor listo, aquí está el ciclo de vida completo de una VM: crearla con los parámetros correctos, elegir la CPU que expone, configurarla sola con cloud-init, convertirla en plantilla y clonarla, y protegerla con snapshots y backups. Es el apartado más largo y el que más vais a consultar durante el curso; las actividades A1.3 y A1.4 siguen este mismo orden.

#### Crear una VM: los parámetros que importan

- ID (100 en adelante, único en el clúster) y nombre. Reservad un rango para plantillas (9000 en adelante es la costumbre).
- ISO de instalación o imagen de disco importada (plantilla).
- Disco: bus `scsi` con controladora `VirtIO SCSI single`, formato raw sobre `local-lvm`, `discard=on` y `ssd=1` si el almacén es SSD (el invitado lo trata como SSD y hace TRIM). Tamaño en GB; con thin, sed generosos en tamaño pero conscientes de lo que suma.
- CPU: número de núcleos (`cores`) y sockets (dejad 1 socket) y tipo, que tiene sección propia más abajo.
- Memoria: fija o con ballooning (mínimo y máximo; el host reclama la que no se usa).
- Red: modelo virtio, bridge y, si procede, etiqueta VLAN y cortafuegos de Proxmox activado.
- Firmware y máquina (el tipo de BIOS y de placa base que QEMU emula): SeaBIOS con i440fx por defecto; OVMF (UEFI) con q35 si vais a hacer passthrough de PCIe, Secure Boot o Windows 11 (que además exige un TPM virtual, un chip de seguridad emulado).
- Agente QEMU: instalarlo dentro de la VM (`apt install qemu-guest-agent`) y activarlo en la VM (`--agent enabled=1`) para que Proxmox vea su IP, pueda apagarla limpiamente, congelar el sistema de ficheros durante un backup y ejecutar `fstrim`.

```bash
qm create 101 --name web01 --memory 2048 --balloon 1024 --cores 2 --cpu x86-64-v2-AES \
  --scsihw virtio-scsi-single --scsi0 local-lvm:20,discard=on,ssd=1 \
  --net0 virtio,bridge=vmbr1,tag=10 --ostype l26 --agent enabled=1
qm config 101
```

#### Tipos de CPU y su efecto en la migración

Cuando el kernel invitado ejecuta `cpuid`, KVM le responde con lo que Proxmox haya configurado, no necesariamente con la CPU real. Esa respuesta determina qué instrucciones cree tener disponibles el invitado (AVX, AES-NI, SSE4.2...), y los compiladores y las bibliotecas eligen rutas de código en función de ella.

| Tipo | Qué expone | Ventaja | Inconveniente |
|---|---|---|---|
| `host` | Todas las banderas de la CPU física | Máximo rendimiento; necesario para virtualización anidada y para algunas cargas (AVX-512, compilación) | La VM solo puede migrar en vivo a un host con exactamente la misma CPU; si cambia de máquina, el invitado puede caer con "illegal instruction" |
| `x86-64-v2-AES` | Nivel de microarquitectura v2 (SSE4.2, SSSE3, POPCNT, CX16) más AES-NI | Por defecto para VM nuevas desde Proxmox VE 8; funciona en cualquier CPU desde 2010 y migra entre hosts distintos | Sin AVX/AVX2: cargas numéricas o de cifrado moderno van más lentas |
| `x86-64-v3`, `x86-64-v4` | v2 más AVX, AVX2, BMI, FMA (v3); más AVX-512 (v4) | Buen compromiso en un clúster homogéneo moderno | Exige que todos los nodos tengan esas banderas |
| `kvm64` | Un Pentium 4 con extensiones mínimas | Corre en cualquier sitio; era el valor por defecto hasta la 7 | Muy pobre: sin SSE4, sin AES-NI; muchas distribuciones actuales lo rechazan porque exigen x86-64-v2 |
| Modelos con nombre (`EPYC-Rome`, `Skylake-Server`...) | Las banderas de esa familia concreta | Reproducible y portable dentro de una gama | Hay que saber qué tenéis |

En el laboratorio, anidado y con un solo nodo, `host` es lo razonable para el Proxmox interior (así puede virtualizar a su vez) y `x86-64-v2-AES` para las VM que creéis dentro, que es lo que os pondrá Proxmox si no decís nada. En una empresa con un clúster de nodos comprados en años distintos, se elige el mínimo común denominador (a menudo v2 o v3) o se define un modelo de CPU propio en `/etc/pve/virtual-guest/cpu-models.conf` para toda la organización. Cambiar el tipo de CPU exige apagar y encender la VM; un reinicio desde dentro no basta.

#### cloud-init

<figure markdown="span">
  ![Logotipo de cloud-init](../img/cloud-init-logo.svg){ width="160" }
  <figcaption>cloud-init. Fuente: dominio público, vía Wikimedia Commons.</figcaption>
</figure>

**cloud-init** es el estándar para configurar una VM en el primer arranque: usuario, contraseña o clave SSH, nombre de host, red, paquetes, comandos. Lo usan todas las nubes (AWS, Azure, GCP, OpenStack) y todas las imágenes cloud de Debian, Ubuntu, Rocky o Fedora lo llevan instalado y activado. Es un servicio que arranca antes que la red, busca una fuente de datos (*datasource*), lee de ella la configuración y la aplica en cuatro etapas: `init-local` (configura la red a partir de `network-config`), `init` (con red: usuarios, claves SSH, redimensionado del disco), `modules:config` y `modules:final` (paquetes, `runcmd`, mensaje de fin). Todo se registra en `/var/log/cloud-init.log` (detallado) y `/var/log/cloud-init-output.log` (salida de los comandos).

Proxmox lo integra con el datasource **NoCloud**: genera al vuelo una imagen ISO de unos 4 MB con etiqueta `cidata` que contiene tres ficheros (`user-data`, `meta-data` y `network-config`), la conecta a la VM como un CD-ROM (`ide2: local-lvm:vm-101-cloudinit`) y cloud-init la encuentra al arrancar buscando un volumen con esa etiqueta. Cada vez que cambiáis un parámetro cloud-init en la VM (`--ciuser`, `--ipconfig0`, `--sshkeys`, `--nameserver`), Proxmox regenera la ISO en el siguiente arranque. Podéis ver exactamente lo que va a recibir la VM sin arrancarla:

```bash
qm cloudinit dump 101 user
qm cloudinit dump 101 network
qm cloudinit dump 101 meta
```

El `user-data` que genera Proxmox es deliberadamente corto (hostname, usuario, contraseña cifrada, claves SSH, `package_upgrade` si lo marcáis). Si necesitáis más (instalar el agente QEMU, crear varios usuarios, ejecutar comandos), escribís vuestro propio fichero YAML en el almacén `local` como snippet (un fichero auxiliar que Proxmox guarda junto a las ISO) y lo referenciáis con `--cicustom "user=local:snippets/web.yaml"`; en ese caso Proxmox deja de generar el `user-data` y usa el vuestro tal cual, pero sigue generando la red. Esto es lo que haréis en la UT5 desde OpenTofu.

```yaml
#cloud-config
hostname: web01
users:
  - name: alumno
    groups: [sudo]
    shell: /bin/bash
    sudo: ALL=(ALL) NOPASSWD:ALL
    ssh_authorized_keys:
      - ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... alumno@portatil
package_update: true
packages:
  - qemu-guest-agent
runcmd:
  - systemctl enable --now qemu-guest-agent
```

```mermaid
sequenceDiagram
    participant A as Administrador
    participant P as Proxmox (qm)
    participant Q as QEMU
    participant C as cloud-init (VM)
    A->>P: qm set 101 --ciuser alumno --ipconfig0 ip=10.10.10.11/24,gw=10.10.10.1
    A->>P: qm start 101
    P->>P: genera ISO NoCloud (user-data, meta-data, network-config)
    P->>Q: arranca la VM con la ISO en ide2
    Q->>C: arranque del kernel invitado
    C->>C: busca datasource, encuentra volumen cidata
    C->>C: init-local: aplica network-config (IP estática)
    C->>C: init: crea usuario, instala clave SSH, amplía el disco
    C->>C: config y final: paquetes, runcmd
    C-->>A: la VM responde por SSH con la clave
```

Cómo depurarlo cuando no funciona, que os pasará:

```bash
# Dentro de la VM (por la consola noVNC de Proxmox si no hay SSH)
cloud-init status --long        # done / running / error, y con --long el detalle
cloud-init query -a | head -50  # qué datasource encontró y qué metadatos leyó
grep -iE "warn|error|traceback" /var/log/cloud-init.log
cat /var/log/cloud-init-output.log
# Forzar que se vuelva a ejecutar como si fuera el primer arranque
cloud-init clean --logs && reboot
```

Dos detalles que ahorran horas. Primero: cloud-init guarda en `/var/lib/cloud/instance` que ya se ejecutó para esa instancia (identificada por el `instance-id` del `meta-data`); si clonáis una VM ya arrancada en lugar de una plantilla limpia, el clon cree que ya está configurado y no aplica nada. Por eso la plantilla nunca se arranca. Segundo: el disco de la imagen cloud es pequeño (2 GB en Debian) y cloud-init lo amplía al tamaño del volumen en el primer arranque (`growpart` + `resizefs`), pero solo si le habéis dado ese tamaño antes de arrancar (`qm disk resize 101 scsi0 +18G`, o `qm resize` en versiones anteriores).

#### Plantillas y clonado

Flujo de trabajo de aula (y de producción):

1. Descargar una imagen cloud de Debian o Ubuntu (formato qcow2).
2. Crear una VM con esa imagen como disco y añadir el disco cloud-init.
3. Convertirla en plantilla (`qm template`): ya no se puede arrancar, solo clonar. Internamente Proxmox marca el disco base como solo lectura.
4. Clonar: **linked clone** (rápido, comparte el disco base con la plantilla y solo escribe las diferencias en un volumen propio; para pruebas y aulas) o **full clone** (independiente, copia completa del disco; para producción y para poder borrar la plantilla o moverlo a otro almacén).
5. Cada clon recibe su configuración por cloud-init: IP, usuario, clave.

Así, crear una VM nueva pasa de 20 minutos de instalación a 20 segundos. Un linked clone sobre LVM-thin tarda menos de un segundo porque no copia nada; un full clone de 20 GB tarda lo que tarde el disco en copiar lo que hay escrito (unos segundos en SSD para una imagen de 2 GB reales). El precio del linked clone es la dependencia: no podéis borrar la plantilla mientras exista un clon, y todos los clones leen de los mismos bloques base, lo que en disco mecánico se nota.

### A1.3 Plantilla cloud-init y clonado (sesión 3)

**Objetivo.** Una plantilla cloud-init (VM 9000) de la que salen `web01`, `app01` y `mon01`, las tres con IP y acceso SSH con tu clave, y `app01` y `mon01` listas para Mantenimiento mañana.

**Antes de empezar.**

- Proxmox actualizado, `vmbr1` creado y usuario `admin` (A1.2).
- Par de claves SSH en el host Proxmox. Si `ls ~/.ssh/id_ed25519.pub` no existe, créalo con `ssh-keygen -t ed25519` (sin contraseña, es un laboratorio).
- Lo explicado al principio de la sesión: [cloud-init](#cloud-init) y [plantillas y clonado](#plantillas-y-clonado). Para entender cada parámetro del `qm create`, [crear una VM](#crear-una-vm-los-parametros-que-importan) y [tipos de CPU](#tipos-de-cpu-y-su-efecto-en-la-migracion).

**Pasos.**

1. Descarga la imagen cloud en el host. Con Debian 13 (trixie); si tu Proxmox es 8, la imagen de bookworm (`debian-12-genericcloud-amd64.qcow2`) funciona igual.
   ```bash
   cd /root
   wget https://cloud.debian.org/images/cloud/trixie/latest/debian-13-genericcloud-amd64.qcow2
   ```
2. Crea la VM 9000 e importa la imagen como su disco:
   ```bash
   qm create 9000 --name debian-tpl --memory 2048 --cores 2 --cpu x86-64-v2-AES \
      --net0 virtio,bridge=vmbr0 --scsihw virtio-scsi-single --ostype l26
   qm set 9000 --scsi0 local-lvm:0,import-from=/root/debian-13-genericcloud-amd64.qcow2,discard=on,ssd=1
   ```
3. Añade el disco cloud-init, el orden de arranque, el agente y la consola serie:
   ```bash
   qm set 9000 --ide2 local-lvm:cloudinit --boot order=scsi0 --agent enabled=1 --serial0 socket --vga serial0
   ```
4. Configura cloud-init y amplía el disco. El `resize` va antes del primer arranque, que es cuando cloud-init redimensiona el sistema de ficheros:
   ```bash
   qm set 9000 --ciuser alumno --sshkeys ~/.ssh/id_ed25519.pub --ipconfig0 ip=dhcp
   qm disk resize 9000 scsi0 20G
   qm cloudinit dump 9000 user
   ```
   Revisa que la salida del `dump` contiene tu clave pública en una sola línea y con el `ssh-ed25519` inicial.
5. Convierte en plantilla sin haberla arrancado nunca:
   ```bash
   qm template 9000
   ```
6. Clona `web01` y arráncala:
   ```bash
   qm clone 9000 101 --name web01 --full
   qm start 101
   qm guest cmd 101 network-get-interfaces   # fallará hasta que instales el agente dentro
   ```
   Espera un minuto, mira en la consola noVNC de la VM (o con `qm terminal 101`, se sale con Ctrl+O) la IP que ha cogido por DHCP y entra desde el host: `ssh alumno@IP`.
7. Dentro de `web01` instala el agente y comprueba cloud-init:
   ```bash
   sudo apt update && sudo apt install -y qemu-guest-agent
   sudo systemctl enable --now qemu-guest-agent
   cloud-init status --long
   ```
   Al volver a la web, Proxmox muestra la IP de la VM en Summary y `qm guest cmd 101 network-get-interfaces` ya responde.
8. Clona `app01` (ID 103) y `mon01` (ID 104) igual que `web01`, con `--full` y en `vmbr0`, arráncalas e instala el agente en cada una. Estas dos las usa Mantenimiento mañana: tienen que arrancar, coger IP y aceptar la clave hoy.
9. Crea también un linked clone para comparar, y mira el almacén antes y después:
   ```bash
   lvs pve
   qm clone 9000 102 --name web02
   lvs pve
   ```

**Comprobación.** `qm list` muestra 9000 como plantilla y las VM 101 a 104; entras por SSH en `web01`, `app01` y `mon01` como `alumno` sin contraseña; `cloud-init status --long` dice `done`; en `lvs pve` el disco de `web02` aparece como volumen que depende de `base-9000-disk-0`, y el de `web01` como volumen independiente.

**Entrega.** Salida de `qm list`, de `cloud-init status --long` dentro de `web01` y de `lvs pve` con los clones, más una explicación de dos o tres líneas de la diferencia entre clon completo y enlazado con lo que ocupa cada uno. Anota las IP de `app01` y `mon01`: las necesitas mañana en 5169.

**Si te sobra tiempo.** Escribe un snippet `--cicustom` que instale el agente automáticamente: activa el contenido `snippets` en `local` (Datacenter > Storage > local > Edit), guarda el YAML del [apartado de cloud-init](#cloud-init) en `/var/lib/vz/snippets/web.yaml`, clona una VM con `--cicustom "user=local:snippets/web.yaml"` y comprueba que arranca ya con el agente. Rompe algo a propósito: clona una VM sin `--ipconfig0` y depúrala con `cloud-init status --long` y `/var/log/cloud-init.log`.

## Sesión 4 · VM vs LXC, snapshots y límites

<p class="ut-meta">16 de octubre · Teoría y práctica · Explicación unos 25 min · Práctica unos 95 min</p>

Al acabar la sesión tenéis una tabla con vuestras medidas de VM frente a LXC, un snapshot de `web01` al que habéis vuelto y un backup restaurado como VM 111. La explicación va en tres partes: qué hacen KVM y QEMU por debajo y por qué virtio es más rápido que el hardware emulado; qué es un contenedor LXC y en qué se diferencia de una VM, con números; y qué es un snapshot en LVM-thin y qué no es. El apartado de backups con vzdump no se explica, pero el último paso de la hoja lo usa.

### Cómo funciona KVM/QEMU por debajo

Esto es lo que os diferencia de alguien que solo sabe hacer clic en "Create VM". Cuando arrancáis una VM en Proxmox, ocurren tres cosas a la vez.

**KVM (Kernel-based Virtual Machine)** son dos módulos del kernel de Linux: `kvm.ko`, genérico, y `kvm_intel.ko` o `kvm_amd.ko`, específicos de cada fabricante. KVM no emula nada: lo que hace es usar las extensiones de virtualización de la CPU (Intel VT-x, AMD-V) para ejecutar el código del sistema operativo invitado directamente en el procesador físico, a velocidad nativa. Se dice a menudo que el hipervisor corre en "ring -1": la CPU tiene un modo adicional (VMX root en Intel) en el que corre el kernel del host con KVM, y un modo invitado (VMX non-root) en el que corre la VM con sus propios anillos 0 a 3. El kernel del invitado cree que está en ring 0 y ejecuta instrucciones privilegiadas con normalidad; cuando hace algo que el hipervisor necesita controlar (tocar una tabla de páginas, acceder a un puerto de E/S, ejecutar `cpuid`, recibir una interrupción) la CPU sale del modo invitado (un *VM exit*), KVM atiende la petición y vuelve a entrar (*VM entry*). Cada VM exit cuesta del orden de un microsegundo, y minimizar su número es la clave del rendimiento de cualquier VM. La memoria se gestiona con tablas de páginas anidadas (EPT en Intel, NPT o RVI en AMD), de forma que la traducción de direcciones del invitado a direcciones físicas la hace la MMU (la unidad de la CPU que traduce direcciones de memoria) en hardware sin intervención del hipervisor.

**QEMU** es un proceso de usuario ordinario, uno por VM (lo veréis con `ps aux | grep kvm` en el host: `/usr/bin/kvm -id 101 -name web01 ...`). Abre `/dev/kvm`, crea la VM y sus vCPU mediante `ioctl()` (la llamada con la que un proceso da órdenes a un driver del kernel) y lanza un hilo por vCPU que se pasa la vida dentro de una llamada `KVM_RUN`. Mientras la VM ejecuta código normal, ese hilo está bloqueado en el kernel y QEMU no hace nada. Cuando se produce un VM exit que KVM no puede resolver solo (casi siempre E/S), la llamada vuelve a QEMU, que es quien emula los dispositivos: la placa base (i440fx o q35), la controladora SATA, la tarjeta de red, la VGA, el reloj, el firmware (SeaBIOS o OVMF para UEFI). QEMU puede emular una tarjeta Intel e1000 con tal fidelidad que el driver de Windows XP la reconoce; el problema es que cada acceso del driver a un registro de esa tarjeta ficticia es un VM exit y una vuelta a espacio de usuario.

```mermaid
flowchart LR
    subgraph HW["Hardware: CPU con VT-x/AMD-V"]
        CPU["Núcleos físicos"]
    end
    subgraph KERNEL["Kernel Linux del host (VMX root)"]
        KVM["kvm.ko + kvm_intel.ko<br/>/dev/kvm"]
    end
    subgraph QEMU["Proceso QEMU (espacio de usuario)"]
        VCPU["Hilo vCPU 0"]
        VCPU1["Hilo vCPU 1"]
        DEV["Emulación de dispositivos<br/>virtio, e1000, SATA, VGA"]
    end
    subgraph VM["Máquina virtual (VMX non-root)"]
        GUEST["Kernel invitado (ring 0)<br/>procesos (ring 3)"]
    end
    VCPU -- "ioctl KVM_RUN" --> KVM
    VCPU1 -- "ioctl KVM_RUN" --> KVM
    KVM -- "VM entry" --> GUEST
    GUEST -- "VM exit (E/S, cpuid...)" --> KVM
    KVM -- "E/S no resuelta" --> DEV
    KVM --> CPU
```

La tercera pieza es la **capa de gestión de Proxmox** (`pve-manager`, `pvedaemon`, `pveproxy`, `pvestatd`), que traduce lo que hacéis en la web o con `qm` en la línea de comandos de QEMU adecuada y en operaciones sobre el almacenamiento. El fichero `/etc/pve/qemu-server/101.conf` es la descripción de la VM; QEMU nunca lo lee, lo lee Proxmox para construir la orden.

#### Paravirtualización y virtio

Si QEMU puede emular cualquier tarjeta, ¿por qué no usamos siempre la e1000 que reconoce cualquier sistema? Porque emular hardware real es lento. Un driver de e1000 escribe en decenas de registros por paquete y cada escritura es un VM exit. Con 10 Gbit/s de tráfico, la CPU del host se pasaría el día saliendo y entrando de la VM.

La alternativa es la **paravirtualización**: el sistema invitado sabe que está virtualizado y usa un driver diseñado para hablar con el hipervisor en lugar de fingir que hay hardware. El estándar en KVM es **virtio** (una especificación abierta, publicada por el consorcio OASIS). Un dispositivo virtio no tiene registros que emular; tiene colas (*virtqueues*) en memoria compartida entre invitado y QEMU. El invitado encola descriptores de paquetes o de bloques, avisa una vez ("kick") y QEMU procesa el lote. El número de VM exits por operación baja de decenas a uno, o a cero cuando se combina con vhost (el procesado se hace en el kernel del host sin pasar por QEMU).

Por eso en Proxmox las opciones por defecto son las que son y no hay que cambiarlas:

- **Disco: VirtIO SCSI** (`scsihw: virtio-scsi-pci` o mejor `virtio-scsi-single`, que da un hilo de E/S por disco). Frente a IDE o SATA emulados, multiplica el rendimiento de E/S varias veces y añade soporte de descarte de bloques (TRIM), imprescindible con thin provisioning (asignar a las VM más disco del que hay, contando con que no lo llenen). Existe también `virtio-blk` (bus `virtio0`), algo más antiguo; SCSI es hoy el recomendado porque admite muchos discos por controladora y comandos SCSI reales.
- **Red: virtio (`virtio-net`)**. Es el único modelo que llega a las velocidades de la red física. Se usa `e1000` o `rtl8139` solo con sistemas antiguos sin drivers virtio.
- **Memoria: virtio-balloon**, para el ballooning que veremos después.
- **Consola y agente: virtio-serial**, por donde habla el agente QEMU.

Linux lleva los drivers virtio en el kernel desde hace más de una década, así que cualquier imagen cloud de Debian o Ubuntu arranca con ellos sin hacer nada. Windows no: hay que cargar los drivers de la ISO `virtio-win` durante la instalación, y es el motivo por el que "he instalado Windows y no ve el disco" es una pregunta habitual en los foros de Proxmox.

### LXC frente a VM, con números

Proxmox ofrece contenedores de sistema LXC junto a las VM. Un contenedor LXC no es un contenedor Docker: ejecuta un sistema operativo completo desde `init` (systemd, sshd, cron), no un solo proceso, pero sin kernel propio. Comparte el kernel del host con aislamiento por namespaces y cgroups, igual que Docker, y Proxmox lo gestiona como si fuera una VM ligera (consola, snapshots, backups, migración en frío).

```bash
pveam update
pveam available --section system | grep debian
pveam download local debian-12-standard_12.7-1_amd64.tar.zst
pct create 200 local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst \
  --hostname ct01 --memory 512 --cores 1 --rootfs local-lvm:4 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp --unprivileged 1 --features nesting=1
pct start 200
pct enter 200
```

Lo que medimos en clase el curso pasado sobre un portátil con SSD NVMe y un Proxmox anidado (vuestros números variarán, por eso los vais a tomar en la actividad A1.4):

| | VM Debian (2 vCPU, 2 GB, virtio) | LXC Debian (1 núcleo, 512 MB) |
|---|---|---|
| Arranque hasta prompt SSH | 12 a 18 s | menos de 2 s |
| RAM usada en el host en reposo | 350 a 450 MB (RAM tocada por el invitado más QEMU) | 25 a 40 MB |
| Espacio en disco tras instalar | 1,3 GB (imagen cloud desplegada) | 450 MB |
| `uname -r` | El kernel de la imagen cloud (6.1 en Debian 12, 6.12 en Debian 13) | El kernel del host Proxmox (6.x de Proxmox) |
| Sobrecarga de CPU | 2 a 5 % en cargas normales, más en E/S intensa | Prácticamente cero |
| Densidad en un host de 32 GB | 10 a 12 VM de 2 GB | 60 o más contenedores de 512 MB |

Por qué no lo usamos para todo:

- Comparten kernel: menor aislamiento; un fallo del kernel afecta a todos, y un contenedor privilegiado con acceso a `/dev` es root en el host. Usad siempre `unprivileged 1` salvo que sepáis por qué no.
- No ejecutan otro kernel ni otro sistema operativo: nada de Windows, nada de FreeBSD, nada de módulos de kernel propios, nada de hipervisor anidado.
- Docker dentro de LXC funciona (con `nesting=1` y `keyctl=1`) pero es una configuración que Proxmox desaconseja oficialmente en producción; Docker se ejecuta en una VM.
- No hay migración en vivo de contenedores; se migran apagados (o con un reinicio muy corto).

La regla práctica: servicios de infraestructura pequeños y Linux (DNS, un proxy, un Pi-hole, un runner de Jenkins) en LXC; todo lo que sea plataforma de contenedores, cargas con kernel propio o algo que necesite migración en vivo, en VM. En este módulo casi todo irá en VM precisamente porque vamos a ejecutar Docker y clústeres encima.

### Snapshots

Un snapshot es una foto del disco (y opcionalmente la RAM, si la VM está encendida y marcáis "include RAM") en un momento. Se vuelve a ella con un clic o con `qm rollback 101 antes-nginx`. No es una copia de seguridad: vive en el mismo disco y en el mismo almacén que la VM; si muere el SSD, mueren los dos.

Cómo se hace depende del almacén:

- En **LVM-thin**, el snapshot es un volumen lógico nuevo (`snap_vm-101-disk-0_antes-nginx`) que comparte todos los bloques con el disco original. A partir de ese momento cada escritura de la VM sobre un bloque compartido se hace en un bloque nuevo (copy-on-write a nivel de bloque del pool). El snapshot ocupa cero al crearse y va creciendo con lo que la VM modifique. La lista está en `lvs pve`.
- En **ZFS** es igual pero a nivel de sistema de ficheros: `zfs list -t snapshot`. Crear y destruir es instantáneo.
- En un **directorio con qcow2**, el snapshot es interno al fichero: qcow2 guarda una tabla de snapshots y hace copy-on-write de sus propios clústeres. `qemu-img snapshot -l vm-101-disk-0.qcow2` los lista. Con raw en un directorio no hay snapshots.

En cualquiera de los tres, cada snapshot activo añade una capa de indirección a las lecturas y escrituras. Tres o cuatro no se notan; veinte encadenados durante meses sí, y además consumen espacio del pool que nadie ve en el disco de la VM. La costumbre correcta es snapshot antes de una operación arriesgada y borrarlo (o consolidarlo) en cuanto se confirma que todo va bien. El agente QEMU permite congelar el sistema de ficheros del invitado un instante mientras se hace el snapshot, de modo que sea consistente; sin agente, el snapshot equivale a un corte de corriente y el invitado tendrá que revisar el sistema de ficheros al restaurar.

```bash
qm snapshot 101 antes-nginx --description "Antes de instalar nginx"
qm listsnapshot 101
qm rollback 101 antes-nginx
qm delsnapshot 101 antes-nginx
```

### Backups con vzdump y Proxmox Backup Server

*Material de consulta: no se explica en clase; lo necesitas para la hoja de práctica de esta sesión.*

`vzdump` es la herramienta de copia de seguridad integrada: copia completa de la VM (configuración y discos) a otro almacén, programable desde Datacenter > Backup. Tres modos: `stop` (apaga la VM, copia, la enciende; el único con consistencia total garantizada), `suspend` (la pausa mientras copia) y `snapshot` (el habitual: hace un snapshot temporal, copia desde él mientras la VM sigue funcionando y lo borra al terminar; con el agente QEMU congela el sistema de ficheros para que sea consistente). El resultado es un fichero `.vma.zst` (VM) o `.tar.zst` (contenedor) en el directorio `dump` del almacén elegido, por ejemplo `/var/lib/vz/dump/vzdump-qemu-101-2026_10_16-10_30_00.vma.zst`. Se restaura con `qmrestore` o desde la web, con la posibilidad de cambiar el ID y el almacén de destino.

```bash
vzdump 101 --storage local --mode snapshot --compress zstd --notes-template "{{guestname}}"
ls -lh /var/lib/vz/dump/
qmrestore /var/lib/vz/dump/vzdump-qemu-101-*.vma.zst 111 --storage local-lvm
```

El problema de vzdump a ficheros es que cada backup es completo: 20 VM de 20 GB con backup diario y retención de 14 días son 5,6 TB. **Proxmox Backup Server** (PBS) es un producto aparte, también libre, que resuelve eso: parte los discos en trozos de 4 MB, guarda cada trozo una sola vez (deduplicación entre backups y entre VM), aprovecha el mapa de bloques modificados que QEMU mantiene desde el último backup (*dirty bitmap*) para leer solo lo cambiado, y añade verificación de integridad, cifrado en el cliente, retención con reglas (`keep-daily`, `keep-weekly`...) y sincronización a un segundo PBS remoto. En una empresa con Proxmox, PBS es la opción normal; en el laboratorio no lo montaremos, pero conviene que sepáis que existe y que "backup a `local`" es lo mínimo, no lo correcto.

### A1.4 VM frente a LXC, snapshots (sesión 4)

**Objetivo.** Una tabla con tus medidas de VM frente a LXC, un snapshot de `web01` al que has vuelto y un backup restaurado como VM 111.

**Antes de empezar.**

- `web01` funcionando con agente QEMU y acceso SSH (A1.3).
- Lo explicado al principio de la sesión: [KVM/QEMU y virtio](#como-funciona-kvmqemu-por-debajo), [LXC frente a VM](#lxc-frente-a-vm-con-numeros) y [snapshots](#snapshots). Para el paso del backup, [vzdump](#backups-con-vzdump-y-proxmox-backup-server) es material de consulta.

**Pasos.**

1. Medida de partida. Con `web01` apagada (`qm shutdown 101`), anota en el host la RAM usada con `free -h`.
2. Arranca `web01` con cronómetro y toma sus medidas:
   ```bash
   date +%T; qm start 101
   # repite esto hasta que responda; la diferencia con la hora anterior es el tiempo de arranque
   ssh alumno@IP-de-web01 'systemd-analyze; uname -r'
   free -h
   ```
3. Crea el contenedor, no privilegiado y con 512 MB, y mide lo mismo:
   ```bash
   pveam update
   pveam available --section system | grep debian
   pveam download local debian-12-standard_12.7-1_amd64.tar.zst
   pct create 200 local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst \
     --hostname ct01 --memory 512 --cores 1 --rootfs local-lvm:4 \
     --net0 name=eth0,bridge=vmbr0,ip=dhcp --unprivileged 1 --features nesting=1
   free -h
   time pct start 200
   pct exec 200 -- systemd-analyze
   pct exec 200 -- uname -r
   free -h
   ```
   Si el nombre de la plantilla ha cambiado, usa el que muestre `pveam available`. Compara `uname -r` de los dos con el del host.
4. Snapshot de `web01`: mira el almacén, haz el snapshot y vuelve a mirarlo:
   ```bash
   lvs pve
   qm snapshot 101 antes-nginx --description "Antes de instalar nginx"
   lvs pve
   ```
   Dentro de `web01`, `sudo apt install -y nginx` y `curl -s localhost | head -3` para ver que sirve la página. Luego, en el host:
   ```bash
   qm listsnapshot 101
   qm rollback 101 antes-nginx
   qm start 101
   ```
   Entra otra vez y comprueba si nginx sigue (`systemctl status nginx`).
5. Backup de `web01` a `local` en modo snapshot, y restauración como VM 111:
   ```bash
   time vzdump 101 --storage local --mode snapshot --compress zstd
   ls -lh /var/lib/vz/dump/
   qmrestore /var/lib/vz/dump/vzdump-qemu-101-*.vma.zst 111 --storage local-lvm
   ```
   Arranca la 111 con `web01` apagada: las dos tienen la misma dirección MAC y en el mismo bridge se pisarían.

**Comprobación.** Tienes tiempo de arranque, RAM en el host y `uname -r` para la VM y para el LXC (el LXC muestra el kernel del host); tras el rollback, nginx no está en `web01`; en `lvs pve` apareció `snap_vm-101-disk-0_antes-nginx` al crear el snapshot; `qm list` muestra la 111 y arranca.

**Entrega.** Tabla comparativa VM/LXC con tus medidas y capturas; capturas de `lvs pve` antes y después del snapshot con una explicación del volumen que apareció; tamaño y tiempo del backup.

**Si te sobra tiempo.** Borra el snapshot (`qm delsnapshot 101 antes-nginx`) y comprueba en `lvs pve` que el volumen desaparece. Con `web01` encendida, `ps aux | grep 'kvm -id 101'` en el host te enseña la línea de QEMU completa que Proxmox ha construido desde `/etc/pve/qemu-server/101.conf`: localiza en ella el disco virtio-scsi, la tarjeta virtio-net y el tipo de CPU.

## Sesión 5 · Redes en el hipervisor

<p class="ut-meta">21 de octubre · Teoría y práctica · Explicación unos 20 min · Práctica unos 100 min</p>

Al acabar la sesión tenéis tres VM en `vmbr1` repartidas en dos VLAN que solo se ven dentro de su VLAN, y las primeras medidas de CPU, disco y red de vuestro laboratorio. Explico las modalidades de red del hipervisor (bridge simple, bridge sin interfaz física, NAT, VLAN-aware y bond) y qué resuelve cada una; el bridge básico y el fichero `/etc/network/interfaces` están en el apartado [Red](#red) de la sesión 2. Las herramientas de medida no se explican en clase: leed el apartado de capacidades y limitaciones antes del paso 5 de la hoja, porque esa tabla es el borrador de la práctica evaluable.

### Modalidades de red: bridge, NAT, VLAN y bond

Modalidades que vais a usar:

- **Bridge simple** (`vmbr0` con `eno1` como puerto): las VM están en la misma red que el host y reciben IP del router del aula. Es la opción con la que se instala Proxmox y la que os da acceso inmediato a las VM desde vuestro portátil.
- **Bridge sin interfaz física** (`bridge-ports none`): red interna solo entre VM y el host. Lo usaremos para las VPC. Las VM no salen a Internet salvo que alguien enrute por ellas.
- **NAT**: el bridge interno más `ip_forward` y una regla de masquerade en el host, que hace de router. Es cómodo cuando el aula solo os da una IP y queréis muchas VM con salida a Internet sin exponerlas. Se configura con `post-up` en el bridge; la documentación de Proxmox trae el ejemplo exacto. En la UT2 sustituiremos esto por una zona SDN con NAT integrado.
- **VLAN-aware bridge** (`bridge-vlan-aware yes`): un solo bridge transporta varias VLAN; cada VM indica su etiqueta (tag) en la tarjeta virtual y el bridge etiqueta y desetiqueta por ella. El puerto físico debe ser un trunk en el switch del aula si queréis que las VLAN salgan del host; para redes internas no hace falta. Es la forma de tener tres redes aisladas con un solo bridge, que es lo que haréis en la actividad A1.5.
- **Bond**: varias tarjetas físicas agrupadas para redundancia o ancho de banda. Modos que se ven en producción: `active-backup` (no requiere nada en el switch; una tarjeta activa y otra en espera), `802.3ad` o LACP (requiere configurar el agregado en el switch; reparte tráfico y suma ancho de banda entre conexiones distintas, nunca dentro de una misma) y `balance-xor`. El bond se crea como interfaz `bond0` y es `bond0`, no las tarjetas, lo que se pone como puerto del bridge.

```text
auto bond0
iface bond0 inet manual
    bond-slaves eno1 eno2
    bond-miimon 100
    bond-mode 802.3ad
    bond-xmit-hash-policy layer3+4

auto vmbr0
iface vmbr0 inet static
    address 192.168.1.50/24
    gateway 192.168.1.1
    bridge-ports bond0
    bridge-stp off
    bridge-fd 0
```

!!! warning "Cambiar la red del host a distancia"
    Un error en `/etc/network/interfaces` os deja sin acceso al Proxmox. Si el laboratorio es anidado, tenéis la consola de la VM exterior y no pasa nada; en un servidor real, haced los cambios desde la web (que valida y aplica con `ifreload`) o dejad un `sleep 120 && ifreload -a` programado con la configuración antigua a mano. Y antes de tocar `vmbr0`, comprobad qué interfaz física es la buena con `ip -br link` y `ethtool eno1`.

### Capacidades y limitaciones, y cómo medirlas

*Material de consulta: no se explica en clase; lo necesitas para la hoja de práctica de esta sesión.*

El criterio de evaluación pide conocer las capacidades y limitaciones del hipervisor, y eso no se aprende leyendo: se mide. Primero va la tabla de qué permite hacer un hipervisor y dónde está el riesgo de cada cosa, y después las herramientas con las que tomaréis vuestras propias medidas para la práctica evaluable.

| Capacidad | Qué permite | Límite o riesgo |
|----|----|----|
| Sobreasignación de CPU | Dar más vCPU en total que núcleos físicos (4:1 es habitual en cargas de oficina) | Si todas trabajan a la vez, se degrada todo; el *steal time* (tiempo que la vCPU esperó a que el host le diera un núcleo) dentro de las VM lo delata |
| Ballooning de RAM | Recuperar memoria no usada (Proxmox empieza a reclamarla cuando el host pasa del 80 %) | Nunca sobreasignar más de lo físico + swap; el invitado necesita el driver virtio-balloon, y la RAM reclamada sale de su caché de disco, así que rinde peor |
| KSM | Deduplicar páginas idénticas entre VM (mismo SO, mismas bibliotecas) | Consume CPU en el host y puede filtrar información entre VM por canales laterales; en entornos multi-inquilino se desactiva |
| Hotplug | Añadir disco, red, CPU o RAM en caliente | Depende del SO invitado; RAM requiere `numa=1` y que el invitado active los DIMM nuevos; la CPU en caliente solo con `vcpus` menor que `cores` |
| Virtualización anidada | Hipervisor dentro de VM | Rendimiento reducido (cada VM exit del hipervisor interior es un VM exit del exterior); solo laboratorio |
| Passthrough (IOMMU) | Dar una GPU, una controladora o una NIC a una VM | El dispositivo deja de estar disponible para el host y la VM ya no puede migrar en vivo |
| LXC | Contenedores de sistema muy ligeros | Comparten kernel: menor aislamiento; no ejecutan otro kernel |
| Snapshots | Volver atrás en segundos | Muchos snapshots encadenados frenan el disco y llenan el pool |
| Thin provisioning | Prometer más disco del que hay | Pool lleno = VM corruptas; hay que vigilar y descartar |

Regla de oro: medir antes de sobreasignar. Un hipervisor de aula con 32 GB no debe albergar 20 VM de 2 GB "porque no las usamos todas a la vez". Tarde o temprano se usan, y lo que ocurre entonces (el kernel del host mata la VM que más memoria tiene, sin avisar, con el OOM killer) es mucho peor que haber puesto 12.

Lo que os pido en la práctica evaluable es precisamente una tabla como la de arriba, pero con las medidas de vuestro laboratorio. Herramientas, todas en los repositorios de Debian (`apt install stress-ng fio iperf3 sysstat`; `stress-ng` carga la CPU, `fio` mide el disco, `iperf3` la red y `sysstat` trae `iostat` y `sar` para observar el host):

```bash
# Inventario del host
nproc; lscpu | grep -E "Model name|Thread|Core|Socket|Flags" | cut -c1-120
free -h                              # RAM total, usada, disponible (no "free")
pvesm status                         # almacenes y ocupación
lvs pve/data                         # % de datos y metadatos del pool thin
cat /sys/module/kvm_intel/parameters/nested   # Y si la anidada está activa

# CPU: cuántos núcleos reales hay detrás de las vCPU
pveperf                              # BOGOMIPS, REGEX/SECOND, FSYNCS/SECOND del host
stress-ng --cpu 4 --timeout 60s --metrics-brief   # dentro de una VM; repetir en dos VM a la vez
top                                  # dentro de la VM, columna "st" (steal): CPU que el host no le dio

# Disco: latencia y IOPS reales (dentro de la VM, sobre el disco virtio)
fio --name=rand4k --ioengine=libaio --rw=randrw --rwmixread=70 --bs=4k --size=1G \
    --numjobs=1 --iodepth=32 --direct=1 --runtime=60 --time_based --group_reporting
fio --name=seq1m --ioengine=libaio --rw=write --bs=1M --size=2G --direct=1 --group_reporting

# Red: ancho de banda entre dos VM del mismo bridge y entre VM y host
iperf3 -s                            # en una VM
iperf3 -c 10.10.10.11 -t 30 -P 4     # desde la otra

# Memoria: cuánto libera el ballooning
qm monitor 101   # y dentro: info balloon
```

Anotad no solo el resultado sino la condición: "fio 4k aleatorio 70/30 en web01 con app-eval parada: 18 000 IOPS; con app-eval ejecutando el mismo fio: 9 500 IOPS cada una". Ese segundo número es el límite del hipervisor; el primero es solo lo que hace un SSD. Lo mismo con iperf3: entre dos VM del mismo bridge veréis 10 a 20 Gbit/s aunque la tarjeta física sea de 1 Gbit/s, porque el tráfico nunca sale del host; hacia fuera, lo que dé la tarjeta.

### A1.5 Redes: VLAN (sesión 5)

**Objetivo.** Tres VM en `vmbr1` repartidas en dos VLAN que solo se ven dentro de su VLAN, y las primeras medidas de CPU, disco y red de tu laboratorio.

**Antes de empezar.**

- Plantilla 9000 y `vmbr1` (A1.2 y A1.3); `web01` y `app01` funcionando en `vmbr0`; `stress-ng`, `fio` e `iperf3` instalados en el host.
- Lo explicado al principio de la sesión: [red](#red) y [modalidades de red](#modalidades-de-red-bridge-nat-vlan-y-bond) (bridge simple, VLAN-aware, bond y NAT). Para las medidas, [capacidades y limitaciones](#capacidades-y-limitaciones-y-como-medirlas) es material de consulta: lee los comandos de ese apartado antes del paso 5.

**Pasos.**

1. Marca `vmbr1` como VLAN aware: nodo > Network > `vmbr1` > Edit > VLAN aware, y Apply Configuration. En `/etc/network/interfaces` aparecen `bridge-vlan-aware yes` y `bridge-vids 2-4094`.
2. Clona tres VM con net0 en `vmbr1`, dos con tag 10 y una con tag 20, con IP manual por cloud-init. En `vmbr1` no hay DHCP ni salida a Internet, así que ponles también una contraseña para poder entrar por la consola:
   ```bash
   qm clone 9000 120 --name vlan10a --full
   qm clone 9000 121 --name vlan10b --full
   qm clone 9000 122 --name vlan20a --full
   qm set 120 --net0 virtio,bridge=vmbr1,tag=10 --ipconfig0 ip=192.168.10.11/24 --cipassword 'lab'
   qm set 121 --net0 virtio,bridge=vmbr1,tag=10 --ipconfig0 ip=192.168.10.12/24 --cipassword 'lab'
   qm set 122 --net0 virtio,bridge=vmbr1,tag=20 --ipconfig0 ip=192.168.20.11/24 --cipassword 'lab'
   for i in 120 121 122; do qm start $i; done
   ```
3. Entra en `vlan10a` con `qm terminal 120` (usuario `alumno`, contraseña `lab`; se sale con Ctrl+O) y comprueba quién ve a quién:
   ```bash
   ip -br addr
   ping -c 3 192.168.10.12    # misma VLAN: responde
   ping -c 3 192.168.20.11    # otra VLAN: no responde
   ```
   Repite desde `vlan20a` hacia `192.168.10.11`.
4. En el host, identifica en qué VLAN está cada interfaz `tap`:
   ```bash
   bridge vlan show
   ```
   Tienen que aparecer `tap120i0` y `tap121i0` en la VLAN 10 y `tap122i0` en la 20.
5. Medidas de capacidad, sobre `web01` y `app01` (están en `vmbr0` y pueden instalar paquetes). Dentro de cada una, `sudo apt install -y stress-ng fio iperf3`. Después:
   ```bash
   # CPU: primero en web01 sola, después en web01 y app01 a la vez; compara los bogo ops/s
   stress-ng --cpu 2 --timeout 60s --metrics-brief
   # Disco: dentro de web01, con app01 parada y luego con app01 haciendo lo mismo a la vez
   fio --name=rand4k --ioengine=libaio --rw=randrw --rwmixread=70 --bs=4k --size=1G \
       --numjobs=1 --iodepth=32 --direct=1 --runtime=60 --time_based --group_reporting
   # Red entre dos VM del mismo bridge
   iperf3 -s                            # en app01
   iperf3 -c IP-de-app01 -t 30 -P 4     # desde web01
   ```
   Anota junto a cada número la condición en que lo tomaste; el número con las dos VM cargando a la vez es el límite del hipervisor, el otro solo es lo que hace un SSD o un cable.

**Comprobación.** El ping funciona entre `192.168.10.11` y `192.168.10.12` y falla hacia `192.168.20.11`; `bridge vlan show` coloca cada `tap` en su VLAN; tienes un valor de bogo ops/s, de IOPS y de Gbit/s con y sin carga simultánea.

**Entrega.** Esquema (Mermaid o dibujo) de las tres VM, el bridge y las VLAN; capturas de ping y de `bridge vlan show`; y una tabla con las medidas de CPU, disco y red indicando la condición de cada una. Esa tabla es el borrador de la que pide la práctica evaluable.

**Si te sobra tiempo.** Mide con `iperf3` el ancho de banda entre las dos VM de la VLAN 10: para instalarlo necesitan Internet, así que añade a cada una una segunda tarjeta temporal en `vmbr0` (`qm set 120 --net1 virtio,bridge=vmbr0`, dentro `sudo dhclient` sobre la interfaz nueva que muestre `ip -br link`), instala, quita la tarjeta (`qm set 120 --delete net1`) y mide entre `192.168.10.11` y `192.168.10.12`. Cambia `vlan20a` a tag 10 (`qm set 122 --net0 virtio,bridge=vmbr1,tag=10`) y comprueba que ahora sí responde al ping desde `vlan10a`.

## Sesión 6 · Práctica evaluable

<p class="ut-meta">23 de octubre · Práctica evaluable · Explicación unos 10 min · Práctica unos 110 min</p>

Se realiza sobre el Proxmox que habéis montado en las sesiones anteriores. Los primeros 10 minutos son para aclarar el enunciado; el resto es vuestro. Para la tabla de capacidades y limitaciones usad las herramientas del apartado [capacidades y limitaciones](#capacidades-y-limitaciones-y-como-medirlas) de la sesión 5 y anotad la condición en que tomáis cada medida.

**Enunciado.** Despliega desde tu plantilla una VM llamada `app-eval` con 2 vCPU, 3 GB de RAM con ballooning (mínimo 1 GB), disco de 20 GB, red en `vmbr1` VLAN 30, usuario `ops` con clave SSH y agente QEMU funcionando.

**Entrega.** Un informe (máximo 3 páginas) con:

- [ ] Comandos o capturas del proceso (clonado, `qm set`, cloud-init, instalación del agente).
- [ ] Evidencia de que la VM cumple lo pedido: `qm config app-eval`, `free -h` y `nproc` dentro de la VM, `lsblk`, IP en la VLAN 30 visible en la web de Proxmox gracias al agente, acceso SSH como `ops`.
- [ ] Una tabla de capacidades y limitaciones del hipervisor de tu laboratorio (CPU, RAM, disco, red, anidada) con al menos una medida real de cada una, tomada con las herramientas de la sección de capacidades, e indicando en qué condiciones se tomó.

| Criterio (RA1 a) | Peso |
|----|----|
| Hipervisor instalado y configurado correctamente (repos, usuario, red) | 30 % |
| VM cumple la especificación y se demuestra | 40 % |
| Tabla de capacidades y limitaciones con medidas reales | 20 % |
| Claridad del informe | 10 % |

## Errores frecuentes en el laboratorio

**"KVM virtualisation configured, but not available" al arrancar la primera VM en el Proxmox anidado.** La virtualización anidada no está activada en el hipervisor exterior, o la VM exterior no tiene CPU `host`. Comprobad `cat /sys/module/kvm_intel/parameters/nested` en el Proxmox: si dice `N`, el problema está fuera. Como parche para salir del paso, `kvm: 0` en la configuración de la VM la ejecuta en emulación (lentísima); no es una solución.

**Proxmox no actualiza: "401 Unauthorized" en `apt update`.** Sigue activo el repositorio `pve-enterprise`, que exige suscripción. Desactivadlo y añadid `pve-no-subscription` (en la web: nodo > Updates > Repositories). En Proxmox VE 9 los repositorios están en formato deb822 en `/etc/apt/sources.list.d/*.sources`; en la 8, en `*.list`. Mientras esté el enterprise, `apt` fallará aunque el resto esté bien.

**La VM clonada no coge IP o no acepta la clave SSH.** Por orden de probabilidad: (1) el disco cloud-init no está en la VM (`qm config 101 | grep cloudinit`); (2) la plantilla se arrancó antes de convertirla y el clon cree que ya está inicializado (`cloud-init clean --logs` dentro y reiniciar, y rehacer la plantilla bien); (3) la clave se pegó con saltos de línea o sin el `ssh-ed25519` inicial (`qm cloudinit dump 101 user` lo muestra); (4) `--ipconfig0` no se puso y la imagen no usa DHCP por defecto en esa interfaz. `cloud-init status --long` y `/var/log/cloud-init.log` en la consola noVNC resuelven el 90 %.

**El clon arranca pero el disco sigue teniendo 2 GB.** El `resize` se hizo después del primer arranque o no se hizo. `growpart` y `resizefs` solo actúan en el primer arranque; después, `qm disk resize 101 scsi0 +18G` y dentro `growpart /dev/sda 1 && resize2fs /dev/sda1` a mano.

**"TASK ERROR: storage 'local-lvm' does not support content type 'iso'"** o al revés con imágenes. Cada almacén admite unos contenidos: las ISO y plantillas van a `local`, los discos a `local-lvm`. Se cambia en Datacenter > Storage, pero lo normal es usar cada uno para lo suyo.

**El pool thin se llena y las VM se quedan en solo lectura.** `lvs pve/data` con `Data%` cerca de 100. Liberar: borrar snapshots viejos, backups que hayáis dejado en `local-lvm` por error, VM de prueba. Luego `fstrim` en todas las VM con `discard=on`. Y a partir de ahí, dimensionar: la suma de discos asignados no debería pasar del doble del pool en un laboratorio.

**El agente QEMU aparece como "not running" aunque está instalado.** Falta `--agent enabled=1` en la VM (se añade y se apaga y enciende la VM, no basta un reinicio) o dentro el servicio no está activo (`systemctl status qemu-guest-agent`). Las imágenes cloud de Debian no lo traen instalado.

**Las VM en VLAN 10 y 20 se ven entre sí.** El bridge no es VLAN-aware (falta `bridge-vlan-aware yes` y aplicar la configuración) o las VM se conectaron sin `tag`. `bridge vlan show` en el host muestra en qué VLAN está cada `tap`.

**Ping entre VM de la red interna funciona pero no salen a Internet.** Es lo esperado en un bridge sin puerto físico. O ponéis NAT en el host (`ip_forward` y `MASQUERADE` hacia `vmbr0`), o esperáis a la UT2 y lo hacéis con SDN.

**Rendimiento de disco pésimo en la VM (cientos de IOPS).** Disco en bus IDE o SATA en lugar de VirtIO SCSI, o caché de disco en `writethrough` sobre disco mecánico, o el host anidado con disco de VirtualBox en formato dinámico sobre un disco lento. Comprobad `qm config` y medid con `fio` en el host y en la VM para localizar la capa que frena.

**"illegal instruction" en un programa dentro de la VM tras moverla de portátil.** La VM tenía CPU `host` en un equipo con AVX y ahora corre en uno sin él. Cambiad a `x86-64-v2-AES` y apagad y encended.

Los enlaces para ampliar y los apartados que van más allá de lo que se hace en clase están en [Para ampliar](../ampliacion.md#ut1-virtualizacion-e-hipervisores).
