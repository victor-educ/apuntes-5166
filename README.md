# Apuntes · Despliegue de plataformas de ejecución de contenedores

Apuntes de la asignatura Despliegue de plataformas de ejecución de contenedores (módulo 5166) del curso de especialización en contenedores. Se publican en
<https://victor-educ.github.io/apuntes-5166/>.

## Editar

Los apuntes son ficheros Markdown en `docs/`. Cada unidad de trabajo está en `docs/ut/`.
El sitio se genera con [MkDocs Material](https://squidfunk.github.io/mkdocs-material/).

```bash
pip install -r requirements.txt
mkdocs serve        # vista previa en http://127.0.0.1:8000
```

Cada push a `main` lanza el workflow de `.github/workflows/deploy.yml`, que construye el sitio
y lo publica en GitHub Pages.

## Autoría

Los apuntes los ha escrito Víctor Sellés apoyándose en Claude, el asistente de IA de Anthropic, para redactar, ampliar y revisar el material a partir de sus apuntes originales y de la planificación del curso. El contenido está revisado por el autor.

## Licencia

Texto e imágenes propias: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.es).
Las imágenes de terceros llevan su atribución al pie.

## Versiones

El pie de cada página muestra la versión publicada: la última etiqueta git (`v1.0`, `v1.1`...) seguida del número de commits desde ella y el hash, tal como lo devuelve `git describe --tags`. Para marcar una versión nueva:

```bash
git tag -a v1.1 -m "Correcciones tras la UT2" && git push origin v1.1
```

El push de la etiqueta vuelve a publicar el sitio con ese número.
