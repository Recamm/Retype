# Retype

App de mecanografia con identidad propia, inspirada en la experiencia de
Monkeytype. React, TypeScript y Vite. Publicacion estatica en Vercel: sin cuentas,
base de datos, claves ni servicios de pago.

## Desarrollo

Requiere Node.js 24 LTS y npm.

```sh
npm ci
npm run dev
```

La politica `.npmrc` desactiva scripts de instalacion. Las dependencias nativas
de Vite se obtienen mediante sus paquetes de plataforma. No habilitar scripts
globalmente para resolver un error; revisar el paquete que lo requiere.

## Funcionalidad

- Tiempo: 15, 30, 60 o 120 segundos; palabras: 10, 25, 50 o 100.
- Citas originales ES/EN, escritura libre Zen y texto personalizado.
- Espanol sin tildes ni enie para teclado ingles, desde el selector de idioma o Ajustes.
- Tecla de reinicio configurable en Ajustes: Tab, Escape, Enter o F2; desactivada por defecto.
- Numeros y puntuacion opcionales en los modos generados.
- Escritura centrada sobre gris oscuro, con detalles verdes y controles compactos.
- Cursor y tamano de texto configurables; tema oscuro inicial, claro y del sistema.
- WPM, velocidad bruta, precision, consistencia, grafico y mapa de errores.
- Entrenamiento local con palabras falladas e historial.
- Copias JSON con validacion, combinacion sin duplicados y borrado confirmado.

El idioma seleccionado corresponde al contenido del test. La interfaz esta en
espanol. El mapa visual de teclado es orientativo: no obliga a un layout fisico.
El editor de texto personalizado acepta pegar; la entrada cronometrada no, para
que las metricas reflejen intentos de escritura, no texto pegado.

El modo de teclado ingles transforma el texto de referencia, incluidas citas y
texto personalizado: `nino` en lugar de la palabra con enie, y vocales sin tildes
ni dieresis. No modifica el idioma ingles ni las pruebas en espanol normal.
El atajo reinicia desde la escritura o los resultados y mantiene las palabras
del entrenamiento. Respeta los controles, editores, ventanas, modificadores y
composicion de texto; no se activa en Ajustes ni Progreso. Ambos ajustes se guardan
localmente y las copias anteriores siguen siendo compatibles.

## Datos Y Privacidad

Los datos se guardan bajo `retype.v1` en `localStorage`, con esquema versionado.
Se conservan como maximo 500 sesiones y 180 muestras de grafico por resultado.
No se guarda el texto de referencia ni lo escrito. Tampoco se conservan palabras
falladas procedentes de textos personalizados o de Zen. En el resto de modos,
las palabras falladas permiten generar ejercicios. Las fuentes se sirven desde
la app, sin peticiones a Google Fonts.

No hay sincronizacion ni autenticacion. Otro dispositivo, navegador o dominio
tendra otro historial. Borrar los datos del navegador lo elimina; exporta una
copia para trasladarlo o conservarlo. Si la lectura o escritura falla, aparece
un aviso y se trabaja en memoria. Los datos ilegibles no se sobrescriben sin
confirmacion. No es una app offline/PWA: necesita cargar sus archivos iniciales.

## Metricas

- WPM: grafemas correctos actuales / 5 / minutos transcurridos.
- Bruta: todos los intentos de insercion / 5 / minutos transcurridos.
- Precision: inserciones correctas / intentos totales. Corregir no borra fallos.
- Consistencia: 100 menos la variacion relativa de WPM acumulado muestreado,
  limitada a 0-100. Una sola muestra no permite estimar variacion y muestra 100.

El reloj comienza con la primera insercion. Las pruebas por tiempo continuan en
segundo plano y finalizan en su deadline, aunque el timer se ejecute tarde.
Los records comparan modo, idioma, longitud, modificadores y entrenamiento.
El espanol normal y el espanol sin tildes tienen records separados.
Las medias de progreso son agregados de la seleccion, no records comparables.
No se afirma equivalencia exacta con las formulas internas de Monkeytype.

## Verificacion

```sh
npm test
npm run lint
npm run format:check
npm run build
npm audit
npm run test:e2e
```

Los E2E usan Edge instalado en Windows. En otros sistemas, instalar Chromium
de Playwright con `npx playwright install chromium`. Se comprueban escritorio
1440x960 y movil 375x812, capturas, teclado, foco, Unicode, timers, copias y
recuperacion ante almacenamiento bloqueado. Las capturas quedan en `artifacts/`.
La practica tambien se comprueba a 320px y en escritorio de poca altura,
incluido el acceso al reinicio y las tres lineas completas de texto.
La emulacion movil Chromium no acredita Safari ni un teclado real de iPhone.

El override de `minimatch` fija una version corregida para la cadena de lint.
Se valido ejecutando ESLint; no se aplico `npm audit fix --force`.

## Vercel

1. Subir el proyecto a un repositorio propio e importarlo en Vercel.
2. Elegir el preset Vite y Node.js 24 LTS.
3. Build: `npm run build`. Directorio de salida: `dist`.
4. No configurar base de datos ni variables de entorno.
5. Revisar la preview antes de promocionarla a produccion.

`vercel.json` incluye CSP, restricciones de framing, permisos, HSTS y cache de
assets con hash. Las vistas usan fragmentos (`#practice`, `#progress`,
`#settings`), por lo que no necesitan rewrites de rutas. `npm run preview`
utiliza los mismos encabezados principales para verificarlos localmente.
La CSP permite estilos inline porque React/Recharts los usan para layout,
pero los scripts se limitan al mismo origen y no se permite `eval`.

La publicacion y la conexion con GitHub/Vercel requieren autorizacion aparte;
no forman parte de la implementacion local.

## Estructura

- `src/lib/engine.ts`: motor puro, Unicode, errores y tiempo.
- `src/lib/storage.ts`: esquema, limites, backups y resumenes de resultados.
- `src/lib/content.ts`: vocabulario y citas originales de Retype.
- `src/components/`: practica, resultados, graficos diferidos y preferencias.
- `src/App.tsx`: flujo de sesiones, persistencia y navegacion entre vistas.
- `DESIGN.md`: decisiones del sistema visual y de medicion.

Las citas fueron redactadas para este proyecto; no se copio contenido de
Monkeytype. Lucide utiliza ISC, Manrope e IBM Plex Mono SIL Open Font License.
Las licencias completas se incluyen en sus respectivos paquetes npm.
