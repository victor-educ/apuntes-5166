# Apuntes · 5166 Despliegue de plataformas de ejecución de contenedores

Apuntes del módulo 5166 del curso de especialización en contenedores. Se publican en
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

## Licencia

Texto e imágenes propias: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.es).
Las imágenes de terceros llevan su atribución al pie.
