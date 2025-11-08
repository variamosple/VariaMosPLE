FROM node:16-alpine as build

WORKDIR /app

RUN apk update

# Copiar archivos necesarios para instalar dependencias
COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci

# Copiar el resto del código fuente
COPY . .

# No copies .env si usas docker-compose con env_file
# Si necesitas variables en tiempo de build, podrías copiarlas
COPY .env .env

# Construir la aplicación (React/Vite/Vue)
RUN npm run build

# No hay etapa final: los archivos estáticos se copiarán en otro contenedor (nginx)
