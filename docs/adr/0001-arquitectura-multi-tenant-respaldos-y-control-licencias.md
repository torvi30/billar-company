# ADR 0001: Arquitectura Multi-Inquilino Aislada en SQLite, Motor de Respaldos en Caliente y Control de Licencias CEO

* **Estado:** Aprobado / Implementado
* **Fecha:** 2026-11-08
* **Autor:** Víctor (Fundador & Lead Engineer)
* **Coautor:** jsdnlb (@jsdnlb)
* **Proyecto:** BillarPulse Pro (Control POS, Kioscos LAN y Gestión de Clubes de Billar)

---

## 1. Contexto y Problemática

BillarPulse Pro nació como una solución offline-first para salas de billar locales operando en hardware tipo Mini-PC (Intel Celeron, N100, Core i3) sin dependencia obligatoria de internet ni bases de datos pesadas (como PostgreSQL o MySQL).

Con la expansión del sistema a múltiples clubes de billar comerciales y la necesidad de Víctor (como creador y CEO) de supervisar y gestionar licencias de forma centralizada sin mezclar datos de clientes, surgieron tres desafíos arquitectónicos fundamentales:

1. **Aislamiento Estricto de Datos entre Clubes:** Una sola sala de billar no puede tener acceso ni visibilidad sobre las ventas, inventarios, mesas o comandas de otros clubes. Mezclar todos los datos en una sola tabla mediante `tenant_id` implicaba riesgo de fuga de datos en consultas manuales o errores en cláusulas `WHERE`.
2. **Integridad de Bases de Datos SQLite en Caliente (WAL Mode):** Las copias de archivos en caliente (`fs.copyFile`) en SQLite con Write-Ahead Logging (WAL) pueden generar corrupción si coinciden con transacciones activas de cobro de mesas. Se requería un mecanismo de respaldo automático, diario y seguro sin detener el servicio.
3. **Monetización y Control de Acceso (Licenciamiento CEO):** El modelo de negocio requiere suscripciones periódicas (mensuales/anuales) o vitalicias. Se requería un mecanismo no intrusivo pero ineludible que suspenda las operaciones de caja y cronómetros si la suscripción no está al día, pero permitiendo a Víctor auditar y desbloquear cualquier sede al instante mediante un PIN Maestro (`9999`).

---

## 2. Decisión de Arquitectura

Se adoptaron las siguientes decisiones de diseño:

### 2.1 Modelo "Database-per-Tenant" con Proxy Dinámico Transparente
- **Base Maestra Central:** `server/data/master_tenants.db` almacena el catálogo de clubes, propietarios, planes, tarifas de suscripción, fechas de vencimiento y contraseñas administrativas.
- **Bases de Datos Aisladas por Sede:** Cada club cuenta con su propio archivo SQLite físico independiente:
  `server/data/tenants/<slug>.db` (ej. `club-el-diamante.db`, `billar-pool-masters.db`).
- **Proxy Dinámico en `server/db.js`:** En lugar de reescribir cientos de consultas SQL en el backend, se implementó un objeto Proxy que intercepta las operaciones de base de datos (`dbOperations.*`) y redirige las lecturas/escrituras al archivo SQLite activo del inquilino seleccionado en memoria.

### 2.2 Motor de Respaldos Seguros con Native SQLite Backup API y Rotación
- Implementado en `server/backup.js`.
- **API Nativa:** Utiliza `db.backup(destPath)` de `better-sqlite3`. Esta función delega a la API nativa de SQLite en C (`sqlite3_backup_*`), realizando una copia bloque a bloque que coordina con el WAL sin causar bloqueos en lecturas ni escrituras concurrentes.
- **Alcance del Respaldo:** Copia `master_tenants.db`, `billarpulse.db` y todos los archivos en `server/data/tenants/*.db`.
- **Metadatos:** Genera un archivo `manifest.json` con timestamps, tamaño en MB, hashes y conteo de archivos.
- **Rotación:** Retención automática de 7 días (`rotateBackups(7)`).
- **Scheduler:** Tarea en segundo plano programada para ejecutarse diariamente (04:00 AM) o manualmente desde el panel CEO.

### 2.3 Manejo Fino de Suscripciones y Bloqueo de Servicio
- **Evaluación Temporal:** Función `evaluateSubscription(business)` en `server/tenants.js` calcula los días restantes contra la fecha de corte (`expiry_date`), clasificando el estado en:
  - `active`: Suscripción vigente (> 5 días).
  - `expiring_soon`: Advertencia preventiva (≤ 5 días).
  - `expired`: Fecha de expiración superada (bloqueado).
  - `suspended`: Suspensión administrativa manual por falta de pago (bloqueado).
  - `perpetual`: Licencia vitalicia sin vencimiento.
- **Middleware Express:** Intercepta solicitudes HTTP que impliquen mutaciones (`POST`, `PUT`, `DELETE`). Si el club activo está bloqueado (`isLocked === true`), retorna `403 SUBSCRIPTION_LOCKED`, impidiendo arrancar cronómetros, añadir comandas o alterar inventarios.
- **SubscriptionLockOverlay (Frontend):** Si una sede no autorizada intenta operar con la suscripción vencida, la interfaz se bloquea con un overlay que expone:
  - Notificación de vencimiento con datos del negocio.
  - Botón de contacto directo por WhatsApp al número de soporte del CEO.
  - Puerta de acceso Maestro con PIN `9999` para auditorías in situ.

### 2.4 Despliegue Automatizado en Mini-PCs con PM2
- Configuración en `ecosystem.config.js` y script bash ejecutable `scripts/deploy-minipc.sh`.
- Límite de memoria establecido en `512MB` para entornos de bajo consumo.
- Registro en `systemd` / arranque automático de Linux tras cortes imprevistos de energía eléctrica en el billar.
- Creación de accesos directos en el escritorio del sistema operativo (`.desktop`).

---

## 3. Diagrama de Flujo y Componentes

```
+-------------------------------------------------------------+
|                  Mini-PC Local / LAN del Billar             |
+-------------------------------------------------------------+
          |                                       |
    [Vite Frontend]                         [Express Server]
   (:5173 dev / :3001)                      (server/index.js)
          |                                       |
          +------------ HTTP / WebSocket ---------+
                                                  |
                                   +--------------+---------------+
                                   |                              |
                        [Subscription Middleware]         [Backup Engine]
                                   |                              |
                                   v                              v
                          [Tenant DB Proxy]             Native db.backup()
                                   |                              |
                 +-----------------+-----------------+            v
                 |                                   |     server/data/backups/
                 v                                   v     (Rotación 7 días)
     server/data/master_tenants.db      server/data/tenants/*.db
     (Catálogo, Sedes, Licencias)       (Mesas, Comandas, Caja Club)
```

---

## 4. Consecuencias y Beneficios

### Aspectos Positivos
* **Privacidad y Aislamiento 100%:** Si un cliente solicita una copia de su base de datos o cancela el servicio, basta con entregar o archivar su archivo `.db` individual.
* **Cero Corrupción de Datos:** La API nativa de respaldo elimina cualquier probabilidad de bases de datos corruptas por transacciones WAL incompletas.
* **Protección del Modelo de Negocio SaaS Local:** El bloqueo por expiración y la pantalla de cobro garantizan el recaudo periódico de cuotas de mantenimiento sin necesidad de servidores en la nube obligatorios.
* **Resiliencia Operativa:** Si se va la luz en el billar, el sistema arranca solo al volver el suministro gracias a PM2, y el cronómetro de las mesas no pierde su tiempo gracias al cálculo delta por timestamp persistido en SQLite.

### Consideraciones y Mitigaciones
* **Espacio en Disco:** Múltiples bases de datos y respaldos diarios consumen almacenamiento en las Mini-PCs.
  * *Mitigación:* Se implementó la rotación automática de 7 días y compresión de respaldos antiguos.
* **Migraciones de Esquema:** Actualizaciones futuras de tablas deben ejecutarse contra cada archivo `.db` de inquilino.
  * *Mitigación:* El `tenantManager.init()` ejecuta automáticamente las migraciones DDL (`CREATE TABLE IF NOT EXISTS`) al inicializar o conmutar cada base de datos.

---

## 5. Participantes y Créditos

* **Lead Architect & CEO:** Víctor
* **Coautor de Arquitectura:** jsdnlb (@jsdnlb)
* **Fecha de Implementación:** Noviembre 2026
* **Versión de Referencia:** BillarPulse Pro v1.0.0 Multi-Tenant Enterprise

