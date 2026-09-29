# Reecicla Frontend — Plataforma de Cotización y Reciclaje Electrónico 🇧🇴

Aplicación web desarrollada con **React 18**, **TypeScript** y **Vite**, con una interfaz de usuario minimalista y limpia adaptada a la moneda boliviana (**Bs.**). Se comunica de forma centralizada con el **API Gateway** (`http://localhost:3000`) del ecosistema de microservicios.

---

## 🚀 Tecnologías

- **Framework**: React 18 + Vite
- **Lenguaje**: TypeScript
- **Estilos**: Vanilla CSS con Diseño Minimalista (Paleta: Blanco, Azul, Verde, Rojo, Naranja)
- **Iconos**: `lucide-react`
- **Moneda**: Bolivianos (**Bs.**)

---

## 📋 Módulos e Historias de Usuario (Sprint 1)

### 1. Autenticación e Identidad Multitenant
- **[HU-001 / HU-002] Registro de Clientes**: Formulario seguro con asignación automática del rol `CLIENT`.
- **[HU-003] Inicio de Sesión**: Generación y persistencia del Token JWT.
- **Contexto de Tenant**: Aislamiento de datos por empresa (`tenant_id`).

### 2. Cotizador de Equipos Electrónicos
- **[HU-005] Cotización en Vivo**: Selector visual para línea blanca (refrigeradores, lavadoras) y dispositivos (laptops, celulares, TVs).
- **Condición Declarada**: Evaluación según estado (*Excelente*, *Con Detalles*, *Averiado*).
- **Cálculo Automático**: Desglose transparente de Precio Base + Ajuste por Condición = **Precio Final en Bs.**
- **Historial de Cotizaciones**: Listado de solicitudes previas en estado `PENDING`.

### 3. Administración de Reglas de Valoración
- **[HU-004] Reglas de Precios**: Panel de configuración para administradores (`ADMIN`) para definir el precio base y ajustes por tipo de equipo en la base de datos `pricing_rules`.

---

## 🛠️ Comandos de Ejecución

### Instalación de dependencias:
```bash
npm install
```

### Ejecutar en modo desarrollo:
```bash
npm run dev
```
> La aplicación estará disponible en `http://localhost:5173/` (o `http://localhost:5174/`).

### Compilar para producción:
```bash
npm run build
```

---

## 🔌 Integración con Backend / API Gateway

| Servicio Proxy | Ruta en Gateway | Endpoint Destino Interno |
| :--- | :--- | :--- |
| **Auth Service** | `http://localhost:3000/api/auth/*` | `http://auth-service:3001/api/auth/*` |
| **Quotation Service** | `http://localhost:3000/api/quotation/*` | `http://quotation-service:3002/api/quotation/*` |
