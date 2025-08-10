-- Habilitar la extensión uuid-ossp para generar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear la base de datos si no existe
-- SELECT 'CREATE DATABASE tekoapp' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'tekoapp')\gexec
