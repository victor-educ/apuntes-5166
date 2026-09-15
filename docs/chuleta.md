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
qm create 9000 --name debian-tpl --memory 2048 --cores 2 \
  --net0 virtio,bridge=vmbr0 --scsihw virtio-scsi-pci
qm set 9000 --scsi0 local-lvm:0,import-from=/root/debian-13-genericcloud-amd64.qcow2
qm set 9000 --ide2 local-lvm:cloudinit --boot order=scsi0 --agent enabled=1
qm set 9000 --ciuser ops --sshkeys ~/.ssh/id_ed25519.pub --ipconfig0 ip=dhcp
qm template 9000

# Clonar, arrancar, parar
qm clone 9000 101 --name web01 --full
qm set 101 --net0 virtio,bridge=vmbr1,tag=10 --ipconfig0 ip=10.10.1.10/24,gw=10.10.1.1
qm start 101 && qm stop 101 && qm destroy 101 --purge

# Snapshots y backup
qm snapshot 101 antes-nginx
qm rollback 101 antes-nginx
qm listsnapshot 101
vzdump 101 --storage local --mode snapshot --compress zstd

# Agente QEMU (necesita qemu-guest-agent dentro de la VM)
qm agent 101 network-get-interfaces

# LXC
pct create 200 local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst \
  --hostname lxc01 --memory 512 --net0 name=eth0,bridge=vmbr1,ip=dhcp --unprivileged 1
pct start 200 && pct enter 200

# Usuarios y tokens
pveum user add terraform@pve
pveum role add TerraformRole -privs "VM.Allocate VM.Clone VM.Config.CDROM VM.Config.CPU VM.Config.Cloudinit VM.Config.Disk VM.Config.HWType VM.Config.Memory VM.Config.Network VM.Config.Options VM.Monitor VM.Audit VM.PowerMgmt Datastore.AllocateSpace Datastore.Audit SDN.Use"
pveum aclmod / -user terraform@pve -role TerraformRole
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
dig web01.dev.lab @10.10.0.2 +short
nc -zv db01 5432                        # ¿responde el puerto?
nmap -sn 10.20.0.0/24                   # descubrimiento de hosts
nmap -sS -p- -T4 10.10.2.10             # todos los puertos TCP (root)
nmap -sT -Pn -p 22,80,443,8080 host     # sin ping previo
tcpdump -i ens19 -n host 10.10.1.10 and port 5432
tcpdump -i any -n -w captura.pcap port 8080
curl -kv https://app.lab/health
curl -sf -o /dev/null -w '%{http_code}\n' http://app01:8080/health

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
tofu apply -auto-approve                # solo en CI o en dev
tofu destroy
tofu output -json
tofu state list
tofu state show 'proxmox_virtual_environment_vm.vm["web01"]'
tofu state rm 'module.vm.proxmox_virtual_environment_vm.vm'
tofu import 'proxmox_virtual_environment_vm.vm["db01"]' pve/103
tofu workspace list && tofu workspace select pre
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
ansible-playbook -i inventory.ini site.yml --limit app01 --tags docker
ansible-playbook -i inventory.ini site.yml -e env=pre
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
tfsec .
gitleaks detect --source . --verbose
gitleaks protect --staged                # como hook de pre-commit
sops --encrypt --age $(cat ~/.age/key.pub) secrets.yaml > secrets.enc.yaml
sops --decrypt secrets.enc.yaml
```

## Docker y registry

```bash
docker compose up -d && docker compose logs -f
docker compose down -v                   # cuidado: borra volúmenes
docker build -t registry.lab:5000/app:$(git rev-parse --short HEAD) .
docker push registry.lab:5000/app:abc1234
docker pull registry.lab:5000/app:latest
docker stats --no-stream
docker system df && docker system prune -f
# Registry con TLS
docker run -d -p 5000:5000 --name registry \
  -v $PWD/certs:/certs -v registry_data:/var/lib/registry \
  -e REGISTRY_HTTP_TLS_CERTIFICATE=/certs/registry.crt \
  -e REGISTRY_HTTP_TLS_KEY=/certs/registry.key registry:2
# Confiar en la CA propia
sudo cp ca.crt /usr/local/share/ca-certificates/lab-ca.crt && sudo update-ca-certificates
sudo mkdir -p /etc/docker/certs.d/registry.lab:5000 && sudo cp ca.crt /etc/docker/certs.d/registry.lab:5000/
```

## Certificados

```bash
# CA propia
openssl genrsa -out ca.key 4096
openssl req -x509 -new -key ca.key -sha256 -days 1825 -subj "/CN=Lab CA" -out ca.crt
# Certificado de servidor con SAN
openssl req -new -newkey rsa:2048 -nodes -keyout jenkins.key \
  -subj "/CN=jenkins.lab" -addext "subjectAltName=DNS:jenkins.lab" -out jenkins.csr
openssl x509 -req -in jenkins.csr -CA ca.crt -CAkey ca.key -CAcreateserial \
  -days 825 -sha256 -copy_extensions copy -out jenkins.crt
# Keystore Java para Jenkins
openssl pkcs12 -export -in jenkins.crt -inkey jenkins.key -certfile ca.crt -out jenkins.p12 -name jenkins
keytool -importkeystore -srckeystore jenkins.p12 -srcstoretype PKCS12 -destkeystore jenkins.jks
# Comprobar
openssl s_client -connect jenkins.lab:8443 -servername jenkins.lab </dev/null | openssl x509 -noout -dates -subject
```

## Jenkins

```bash
docker compose exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
# CLI
curl -sO https://jenkins.lab:8443/jnlpJars/jenkins-cli.jar
java -jar jenkins-cli.jar -s https://jenkins.lab:8443 -auth admin:TOKEN list-jobs
java -jar jenkins-cli.jar -s https://jenkins.lab:8443 -auth admin:TOKEN build servicio/main -p ENV=dev -p RUN_DEPLOY=true
# Validar un Jenkinsfile sin ejecutarlo
curl -sk -u admin:TOKEN -X POST -F "jenkinsfile=<Jenkinsfile" https://jenkins.lab:8443/pipeline-model-converter/validate
# Copia de seguridad
docker run --rm -v jenkins_home:/data -v $PWD:/backup alpine tar czf /backup/jenkins_home-$(date +%F).tgz -C /data .
```

## Prometheus, Alertmanager y Grafana

```bash
promtool check config prometheus.yml
promtool check rules alerts.yml
promtool query instant http://localhost:9090 'up'
amtool check-config alertmanager.yml
amtool --alertmanager.url=http://localhost:9093 alert
amtool --alertmanager.url=http://localhost:9093 silence add alertname=DiskLow --duration=2h --comment "mantenimiento"
curl -s http://app01:9100/metrics | grep -E '^node_(memory_MemAvailable|filesystem_avail)'
curl -s -X POST http://localhost:9090/-/reload
# Exportar un dashboard de Grafana por API
curl -s -H "Authorization: Bearer $GRAFANA_TOKEN" https://grafana.lab/api/dashboards/uid/kpi | jq .dashboard > dashboards/kpi.json
```

Consultas PromQL que se usan constantemente:

```text
up == 0
100 - avg by(instance)(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100
node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes * 100
node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"} * 100
rate(container_cpu_usage_seconds_total{name="app"}[5m])
container_memory_working_set_bytes{name="app"}
increase(jenkins_builds_failed_build_count[1h])
histogram_quantile(0.95, sum by(le)(rate(http_request_duration_seconds_bucket[5m])))
```

## Git

```bash
git init && git add . && git commit -m "Primer despliegue"
git remote add origin https://gitea.lab/alumno/infra.git && git push -u origin main
git switch -c feature/ansible-docker
git log --oneline --graph --all
git diff main..feature/ansible-docker
# Quitar un fichero del historial (secreto subido por error): rota el secreto primero
git filter-repo --path terraform.tfvars --invert-paths
```
