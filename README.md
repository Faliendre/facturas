# Sistema de Gastos Familiares

Este es un sistema web moderno construido con React, Tailwind CSS 4, Chart.js y Supabase para registrar y monitorear gastos familiares.

## Requisitos previos

1. Node.js instalado en tu equipo.
2. Una cuenta en [Supabase](https://supabase.com/).

## Configuración de Supabase

1. Crea un nuevo proyecto en Supabase.
2. Ve a **SQL Editor** y ejecuta TODO el contenido del archivo `supabase.sql` que se encuentra en la raíz de este proyecto. Esto creará la tabla `registros`, la tabla `perfiles`, las políticas de seguridad y configurará la autenticación.
3. Ve a **Storage** en Supabase, crea un nuevo bucket llamado `documentos` y asegúrate de marcarlo como **Público**.

## Configuración del proyecto local

1. Copia el archivo `.env.example` y renómbralo a `.env`:
   ```bash
   cp .env.example .env
   ```
2. Edita el archivo `.env` y pega tu `URL` y `Anon Key` de Supabase (las encuentras en Project Settings > API).

## Ejecución

1. Instala las dependencias (si aún no lo has hecho):
   ```bash
   npm install
   ```
2. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
3. Abre tu navegador en la URL indicada (generalmente `http://localhost:5173`).

## Uso del Sistema

- **Registro**: La primera vez, haz clic en "Crear cuenta" en la pantalla de Login y regístrate.
- **Roles**: Por defecto, para facilitar las pruebas, el script SQL asignará rol de `admin` al primer (y futuros) usuarios que se registren. Si necesitas que un usuario sea `lector`, puedes editar la tabla `perfiles` directamente en Supabase.
- **Funciones**:
  - **Dashboard**: Muestra estadísticas y gráficos (necesitas registros previos para ver datos).
  - **Registrar gasto**: Selecciona imagen/PDF y carga el detalle.
  - **Historial**: Filtra, visualiza PDFs integrados e imágenes, e incluso exporta tu historial a Excel.
