# Chuleta de comandos

Lo que se teclea una y otra vez en el laboratorio, agrupado por herramienta. No sustituye a la documentación; es para no tener que buscarla cada vez. Cada comando aparece explicado con calma en su unidad.

## Proxmox VE

```bash
# Estado general
pvesh get /nodes/pve/status
pveversion -v
qm list                                 # VM
pct list                                # contenedores LXC
pvesm status                            # almacenes

# Plantilla cloud-init (UT1)
# Los dos agentes van dentro de la imagen: las VM sin salida a Internet no pueden instalarlos al arrancar
apt install -y libguestfs-tools
export LIBGUESTFS_BACKEND=direct
virt-customize -a /root/debian-13-genericcloud-amd64.qcow2 --install qemu-guest-agent,prometheus-node-exporter
qm create 9000 --name debian-tpl --memory 2048 --cores 2 --cpu x86-64-v2-AES \
  --net0 virtio,bridge=vmbr0 --scsihw virtio-scsi-single --ostype l26
qm set 9000 --scsi0 local-lvm:0,import-from=/root/debian-13-genericcloud-amd64.qcow2,discard=on,ssd=1
qm set 9000 --ide2 local-lvm:cloudinit --boot order=scsi0 --agent enabled=1 --serial0 socket --vga serial0
cat /root/puesto.pub /root/.ssh/id_ed25519.pub > /root/claves.pub   # la clave del puesto y la del nodo
qm set 9000 --ciuser ops --sshkeys /root/claves.pub --ipconfig0 ip=dhcp
qm disk resize 9000 scsi0 20G
qm template 9000

# Clonar con su memoria en la misma orden, arrancar, parar, destruir
qm clone 9000 150 --name prueba --full && qm set 150 --memory 512
qm set 150 --net0 virtio,bridge=devfront --ipconfig0 ip=dhcp
qm start 150 && qm stop 150 && qm destroy 150 --purge
# Cambiar de red conservando la MAC, que es la clave de la reserva DHCP
qm config 120 | grep net0
qm set 120 --net0 virtio=<MAC>,bridge=devback

# Snapshots y backup
qm snapshot 110 antes-nginx
qm rollback 110 antes-nginx
qm listsnapshot 110
vzdump 110 --storage local --mode snapshot --compress zstd

# Agente QEMU (necesita qemu-guest-agent dentro de la VM)
qm guest cmd 110 network-get-interfaces

# LXC (UT1): en vmbr0, porque en vmbr1 no hay DHCP ni salida a Internet
pct create 170 local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst \
  --hostname ct01 --memory 512 --cores 1 --rootfs local-lvm:4 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp --unprivileged 1 --features nesting=1
pct start 170 && pct enter 170

# Usuario y token de OpenTofu (UT5), con los permisos justos
pveum user add terraform@pve --comment "OpenTofu del laboratorio"
pveum acl modify /vms --users terraform@pve --roles PVEVMAdmin
pveum acl modify /storage/local-lvm --users terraform@pve --roles PVEDatastoreUser
pveum acl modify /sdn/zones/lab --users terraform@pve --roles PVESDNUser
pveum user token add terraform@pve tofu --privsep 0

# SDN
pvesh get /cluster/sdn/zones
pvesh get /cluster/sdn/vnets
pvesh set /cluster/sdn                  # equivale al botón Apply
```

## Red y diagnóstico

```bash
ip -br a                                # interfaces e IP, resumen
ip r                                    # tabla de rutas
ss -tlnp                                # puertos TCP en escucha y proceso
ping -c 3 10.10.2.10
traceroute -n 10.10.3.10
dig web01.dev.lab @10.10.0.1 +short
nc -zv -w 3 10.10.3.10 5432             # ¿responde el puerto? timeout: filtrado; refused: cerrado
nmap -sn 10.20.0.0/24                   # descubrimiento de hosts
nmap -sS -p- -T4 10.10.2.10             # todos los puertos TCP (root)
nmap -sT -Pn -p 22,80,443,8080 host     # sin ping previo
tcpdump -i ens22 -n host 10.10.3.10 and port 5432
tcpdump -i any -n -w captura.pcap port 8080
curl -kv https://api.dev.lab/health
curl -sf -o /dev/null -w '%{http_code}\n' http://localhost:8080/health   # dentro de app01
ssh -J ops@<IP de aula de admin01> ops@10.10.2.10   # desde el 27 nov; con el ~/.ssh/config del laboratorio, ssh app01

# dnsmasq
journalctl -u dnsmasq -f
cat /var/lib/misc/dnsmasq.leases

# nftables
nft list ruleset
nft -f /etc/nftables.conf
nft add rule inet fw forward iifname "dmzext" oifname "dmzint" tcp dport 8080 accept
```

## OpenTofu / Terraform

```bash
tofu init                               # descargar providers, preparar backend
tofu fmt -recursive && tofu validate
tofu plan -out plan.tfplan
tofu apply plan.tfplan
tofu apply -auto-approve                # solo dentro de test.sh (A5.6)
tofu destroy
tofu output -json
tofu state list
tofu state show 'proxmox_virtual_environment_vm.vm["web01"]'
tofu state rm 'module.vm.proxmox_virtual_environment_vm.vm'
tofu import 'proxmox_virtual_environment_vm.vm["db01"]' pve/230
cd envs/pre && tofu init && tofu plan   # un directorio por entorno, sin workspaces (UT5)
tofu plan -detailed-exitcode            # 0 sin cambios, 2 con cambios, 1 error
export TF_VAR_pve_token="terraform@pve!tofu=xxxxxxxx-..."
export TF_LOG=DEBUG                     # cuando el provider hace cosas raras
```

## Ansible

```bash
ansible -i inventory.ini all -m ping
ansible -i inventory.ini app -m setup -a 'filter=ansible_memtotal_mb'
ansible -i inventory.ini all -b -m apt -a 'name=htop state=present'
ansible-playbook -i inventory.ini site.yml
ansible-playbook -i inventory.ini site.yml --check --diff
ansible-playbook -i inventory.ini site.yml --limit app
ansible-playbook -i inventory.ini site.yml -e app_image=registry.lab:5000/app:abc1234   # otra versión, como el job despliegue (A6.8)
ansible-inventory -i inventory.ini --graph
ansible-lint site.yml
ansible-vault encrypt group_vars/all/vault.yml
ansible-vault edit group_vars/all/vault.yml
ansible-galaxy collection install community.docker
```

## Seguridad del código

```bash
checkov -d . --quiet
checkov -d . --skip-check CKV_TF_1 --soft-fail
trivy config .
trivy fs --scanners secret,misconfig .
gitleaks detect --source . --verbose
gitleaks protect --staged                # como hook de pre-commit
ssh ops@app01 docker save app:1.4.2 > app.tar && trivy image --input app.tar   # la imagen local, antes del registry
sops --encrypt --age $(cat ~/.age/key.pub) secrets.yaml > secrets.enc.yaml
sops --decrypt secrets.enc.yaml
```

## Docker y registry

```bash
# El servicio: siempre por su compose y el nombre del servicio, nunca por el del contenedor
docker compose -f /opt/servicio/compose.yml ps
docker compose -f /opt/servicio/compose.yml restart app
docker compose -f /opt/servicio/compose.yml logs -f app
docker compose down -v                   # cuidado: borra volúmenes
docker build -t app:1.4.2 api            # en app01, en /opt/servicio, hasta el 19 feb
docker build -t registry.lab:5000/app:$(git rev-parse --short HEAD) api
docker push registry.lab:5000/app:abc1234
ssh ops@10.10.2.10 docker save app:1.4.2 | ssh ops@10.20.2.10 sudo docker load   # de app01 de dev a pre, lanzado en admin01: pre no llega al registry
docker stats --no-stream
docker system df && docker system prune -f
# Registry con TLS y htpasswd (UT6): en gitea01, /opt/registry, con el compose.yml de la sesión 35
docker run --rm --entrypoint htpasswd httpd:2 -Bbn jenkins 'S3creto' > auth/htpasswd
docker compose up -d
curl --cacert ca.crt -u jenkins https://registry.lab:5000/v2/_catalog
# Confiar en la CA del curso
sudo cp ca.crt /usr/local/share/ca-certificates/lab-ca.crt && sudo update-ca-certificates
sudo mkdir -p /etc/docker/certs.d/registry.lab:5000 && sudo cp ca.crt /etc/docker/certs.d/registry.lab:5000/
```

## Certificados

```bash
# La CA del curso, una sola vez (UT3): en ~/ca/ de admin01, con el ca.cnf de la sesión 15
openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -nodes \
  -keyout ca.key -out ca.crt -days 3650 -subj "/CN=Lab 5166 CA" \
  -addext "keyUsage=critical,keyCertSign,cRLSign"
# Certificado de servidor con SAN (con -extensions client_cert, uno de cliente)
openssl req -new -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -nodes \
  -keyout jenkins.key -out jenkins.csr -subj "/CN=jenkins.lab" -addext "subjectAltName=DNS:jenkins.lab"
openssl ca -config ~/ca/ca.cnf -extensions server_cert -in jenkins.csr -out jenkins.crt
# Comprobar
cat ~/ca/index.txt                        # una línea por certificado, con V si es válido
openssl x509 -in jenkins.crt -noout -ext subjectAltName
openssl s_client -connect jenkins.lab:443 -servername jenkins.lab </dev/null | openssl x509 -noout -dates -subject
```

## Jenkins

```bash
docker compose exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword   # solo sin JCasC
# CLI, desde una máquina que resuelva jenkins.lab y confíe en la CA del curso
curl -sO https://jenkins.lab/jnlpJars/jenkins-cli.jar
java -jar jenkins-cli.jar -s https://jenkins.lab -auth admin:TOKEN list-jobs
java -jar jenkins-cli.jar -s https://jenkins.lab -auth admin:TOKEN build servicio/ci/main -p ENV=pre -p RUN_DEPLOY=true
# Validar un Jenkinsfile sin ejecutarlo
curl -sk -u admin:TOKEN -X POST -F "jenkinsfile=<Jenkinsfile" https://jenkins.lab/pipeline-model-converter/validate
# Copia de seguridad, en jenkins01: el volumen lleva delante el nombre del proyecto compose
docker run --rm -v jenkins-config_jenkins_home:/data -v $PWD:/backup alpine tar czf /backup/jenkins_home-$(date +%F).tgz -C /data .
```

## Prometheus, Alertmanager y Grafana

```bash
# Desde el 3 dic, Prometheus y Alertmanager solo escuchan en 127.0.0.1 de mon01: se usan desde una
# shell en mon01 o por el túnel que da el laboratorio de Mantenimiento, y amtool, con docker compose exec
cd /opt/monitoring                        # en mon01: promtool y amtool van dentro de sus contenedores
docker compose exec prometheus promtool check config /etc/prometheus/prometheus.yml   # revisa también rule_files
docker compose exec prometheus promtool query instant http://localhost:9090 'up'
docker compose exec alertmanager amtool check-config /etc/alertmanager/alertmanager.yml
docker compose exec alertmanager amtool --alertmanager.url=http://localhost:9093 alert
docker compose exec alertmanager amtool --alertmanager.url=http://localhost:9093 silence add alertname=HostDown --duration=2h --comment "mantenimiento"
curl -s http://10.10.3.10:9100/metrics | grep -E '^node_(memory_MemAvailable|filesystem_avail)'   # desde mon01; el de app01 va con TLS
curl -s -X POST http://localhost:9090/-/reload   # en mon01
ansible-playbook -i ansible/dev.ini ansible/ut7-targets.yml   # en admin01, en iac-lab: regenera targets/ut7-*.yml (A7.1)
# Exportar un dashboard de Grafana por API, por el túnel de Grafana
curl -s --cacert ca.crt -H "Authorization: Bearer $GRAFANA_TOKEN" https://grafana.lab:8443/api/dashboards/uid/<uid> | jq .dashboard > grafana/ut7/kpi-plataforma.json
```

Consultas PromQL que se usan constantemente:

```text
up == 0
100 - avg by(host)(rate(node_cpu_seconds_total{mode="idle",env="dev"}[5m])) * 100
node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes * 100
node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"} * 100
rate(container_cpu_usage_seconds_total{service="app"}[5m])
container_memory_working_set_bytes{service="app"}
increase(default_jenkins_builds_failed_build_count[1h])
histogram_quantile(0.95, sum by(le)(rate(app_http_request_duration_seconds_bucket[5m])))
```

## Git

```bash
git init -b main && git add . && git commit -m "Primer despliegue"
git remote add origin http://gitea.lab:3001/ops/iac-lab.git && git push -u origin main   # hasta el 12 feb
git remote set-url origin https://gitea.lab/ops/iac-lab.git                              # desde la A6.4 (12 feb)
git switch -c feature/ansible-docker
git log --oneline --graph --all
git diff main..feature/ansible-docker
# Quitar un fichero del historial (secreto subido por error): antes se rota el secreto
git filter-repo --path terraform.tfvars --invert-paths
```
