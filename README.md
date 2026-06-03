# Sistema IoT para Monitoreo de Entrenamientos de Fútbol en Tiempo Real

Este proyecto consiste en una solución de sistemas distribuidos que integra dispositivos de monitoreo (trackers IoT), comunicación en tiempo real ligera y una consola de telemetría e intensidad física táctica en la web para entrenadores y cuerpo técnico.

---

## 📐 Arquitectura del Sistema

El sistema implementa una arquitectura distribuida desacoplada estructurada en las siguientes capas:

1. **Simulador de Trackers IoT (Dispositivos Físicos):** Microcontroladores (simulados) que generan telemetría física basada en cinemática real y rebotes físicos sobre los límites del campo de juego ($100 \times 60$ metros).
2. **Capa de Mensajería IoT (MQTT):** Protocolo de transporte ligero de datos mediante tópicos de publicación/suscripción utilizando el Broker Mosquitto.
3. **Servicio Centralizado (Spring Boot Backend):**
   - Recibe la telemetría del Broker.
   - Aplica validación de consistencia transaccional de métricas físicas y acumuladas.
   - Desacoplado bajo principios **SOLID** utilizando una interfaz abstracta (`SimulationEngine`), lo que independiza la física de simulación (`SoccerPhysicsEngine`) del planificador (`PlayerMetricSimulator`).
   - Envía los datos transformados en lote a través de un WebSocket STOMP.
4. **Dashboard de Visualización (Angular Frontend):**
   - Panel interactivo en modo oscuro de alto rendimiento reactivo mediante Signals.
   - Cuenta con controles de sesión activa (cronómetro interactivo).
   - Dibuja en vivo la **Red de Compactitud** (enlaces dinámicos entre jugadores a distancia de apoyo de menos de 35 metros).
   - Muestra barras e indicadores de **Esfuerzo Cardiovascular por Zonas** en tiempo real.
   - Genera mapas térmicos dinámicos (nubes de ocupación espacial o velocidad instantánea) y gráficos de tendencia Bézier para el equipo.

---

## 🛡️ Relación con el Teorema CAP

La solución se ha diseñado bajo un enfoque **AP (Disponibilidad y Tolerancia a Particiones)**:
- **Tolerancia a Particiones (P):** En campo deportivo, las pérdidas de señal de red o retardos son inevitables. El sistema sigue procesando y respondiendo individualmente para cada tracker disponible.
- **Disponibilidad (A):** Si un tracker o el canal general se cae (partición), la consola web Angular no se congela ni bloquea la interfaz; se pasa a un estado visual de `"Buscando señal (estación base)"` de forma asíncrona, manteniendo la interacción y los controles. Al reconectarse el WebSocket, los datos se sincronizan con **consistencia eventual (C)**.

---

## 🚀 Requisitos previos

Para ejecutar la solución completa, asegúrate de tener instalado:
- **Java JDK 17 o superior**
- **Node.js (versión 18+)**
- **pnpm** (o `npm`)
- **Maven** (incluido en el proyecto mediante `mvnw`)
- **Mosquitto MQTT Broker** (o un broker MQTT accesible localmente en el puerto `1883`)

---

## 🛠️ Instrucciones de Ejecución

### 1. Levantar el Broker MQTT
Asegúrate de que tu servicio Mosquitto o Broker MQTT local esté corriendo en la dirección estándar:
`localhost:1883`

### 2. Iniciar el Backend (Spring Boot)
1. Abre una terminal y navega a la carpeta del backend:
   ```bash
   cd football-monitor
   ```
2. Ejecuta el servidor utilizando Maven Wrapper:
   ```bash
   ./mvnw.cmd spring-boot:run
   ```
   *(El servidor levantará en el puerto `8080` y abrirá el endpoint de WebSockets en `ws://localhost:8080/ws`)*.

### 3. Iniciar el Frontend (Angular)
1. Abre otra terminal y navega a la carpeta del frontend:
   ```bash
   cd dashboard-football
   ```
2. Instala las dependencias necesarias:
   ```bash
   pnpm install
   ```
3. Ejecuta la aplicación de desarrollo:
   ```bash
   pnpm start
   ```
4. Abre tu navegador en la dirección `http://localhost:4200` para interactuar con la consola.
