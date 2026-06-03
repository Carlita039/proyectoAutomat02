# Automatización Front-End

Plantilla base para practicar automatización de front-end con despliegue local en Docker.

## Estructura

- `src/`: ambiente base de la aplicación web (dockerizable)

## Flujo recomendado

1. Levantar ambiente web:
   - Ir a `src/`
   - Ejecutar: `docker compose up --build -d`
   - Abrir: `http://localhost:3000`

2. Ejecucion de test automatico 