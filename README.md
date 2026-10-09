# Portafolio — Micha

Portafolio personal hecho con **Next.js 15** y **Tailwind CSS**, con modo oscuro/claro y formulario de contacto por correo.

## Desarrollo

```bash
npm install
npm run dev
```

Abre http://localhost:4000.

## Editar el contenido

Todo el contenido (nombre, proyectos, habilidades, experiencia, redes) está en [`src/data/profile.js`](src/data/profile.js).
Las imágenes van en `public/` (por ejemplo `public/projects/mi-proyecto.webp` → `"/projects/mi-proyecto.webp"`).

## Formulario de contacto

Copia `.env.example` a `.env` y completa los datos SMTP.

## Producción

```bash
npm run build
npm start
```
