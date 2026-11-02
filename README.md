![Retype: practica de mecanografia](public/brand/banner.png)

# Retype

Una app de mecanografia centrada en escribir. Controles compactos, detalles
verdes y resultados guardados en tu navegador. Inspirada en Monkeytype,
con identidad y contenido propios.

React, TypeScript y Vite. Sin cuentas, backend, base de datos ni claves de API.
Se publica como una web estatica en Vercel.

## Empezar

Requiere **Node.js 24 LTS** y npm.

```sh
npm ci
npm run dev
```

Abre la URL que muestra Vite. La prueba esta lista para escribir al entrar;
el reloj comienza con la primera pulsacion.

Para comprobar la version de produccion localmente:

```sh
npm run build
npm run preview
```

La configuracion de instalacion desactiva scripts de dependencias. Vite usa
sus paquetes nativos de plataforma; no habilites scripts globalmente para
resolver un error sin revisar primero el paquete que lo requiere.

## Practica

| Modo          | Prueba                                           |
| ------------- | ------------------------------------------------ |
| Tiempo        | 15, 30, 60 o 120 segundos.                       |
| Palabras      | 10, 25, 50 o 100 palabras.                       |
| Citas         | Textos originales de Retype en espanol o ingles. |
| Zen           | Escritura libre, sin limite de tiempo.           |
| Personalizado | Tu propio texto, hasta 5000 caracteres.          |

- Espanol e ingles; numeros y puntuacion opcionales en los modos generados.
- Tres lineas de escritura, cursor configurable y reinicio sin salir de la prueba.
- WPM, velocidad bruta, precision, consistencia, grafico y mapa de errores.
- Historial y ejercicios locales con las palabras que fallaste.

El editor personalizado permite pegar texto. La entrada de la prueba no permite
pegar ni arrastrar, para que las metricas reflejen la escritura.
La interfaz esta en espanol; el idioma seleccionado cambia el contenido.
El mapa de teclado es orientativo y no obliga a un layout fisico.

## Preferencias

### Tema

**Sistema es el valor predeterminado.** Retype usa claro u oscuro segun la
configuracion de tu PC y responde a sus cambios mientras la pagina esta abierta.

En `Ajustes > Apariencia > Tema` puedes elegir **Sistema**, **Claro** u **Oscuro**.
Las selecciones manuales se conservan al recargar y no cambian con el sistema.
El boton de la cabecera cambia entre claro y oscuro; selecciona Sistema en
Ajustes para volver al comportamiento automatico.

Las preferencias que ya tenias guardadas no se sobrescriben con el nuevo default.

### Espanol Con Teclado Ingles

Selecciona la opcion de espanol sin tildes en el idioma de la prueba o activala
en Ajustes. El texto de referencia se convierte a vocales sin tildes ni dieresis
y usa `n` en lugar de la enie, incluidas citas y textos personalizados.

El ingles y el espanol normal no se modifican. Ambas modalidades de espanol
tienen records separados.

### Reinicio Y Escritura

En Ajustes puedes configurar **Tab**, **Escape**, **Enter** o **F2** para reiniciar.
El atajo esta desactivado por defecto y mantiene las palabras del entrenamiento.
Respeta los controles, editores, ventanas, teclas modificadoras y composicion
de texto; no se activa en Ajustes ni Progreso.

Tambien puedes elegir el tamano del texto y un cursor de linea, bloque o subrayado.

## Datos Y Privacidad

Las preferencias y el historial se guardan en `localStorage`, bajo `retype.v1`.
No hay autenticacion ni sincronizacion entre dispositivos, navegadores o dominios.

- Hasta 500 sesiones y 180 muestras de grafico por resultado.
- No se guardan el texto de referencia ni las pulsaciones escritas.
- Las palabras falladas de Personalizado y Zen tampoco se guardan.
- En los otros modos, las palabras falladas permiten crear ejercicios locales.
- Las fuentes se sirven desde la app, sin consultas a Google Fonts.

Desde Ajustes puedes exportar una copia JSON, importar y combinar historiales
sin duplicados o borrar los datos con confirmacion. Las copias anteriores
siguen siendo compatibles. Exporta una copia antes de borrar datos del navegador.

Si el almacenamiento falla, Retype muestra un aviso y sigue funcionando en memoria.
Los datos ilegibles no se sobrescriben sin confirmacion. No es una PWA offline:
necesita cargar sus archivos iniciales.

## Como Se Calculan Los Resultados

| Metrica      | Calculo                                                                                             |
| ------------ | --------------------------------------------------------------------------------------------------- |
| WPM          | Grafemas correctos actuales / 5 / minutos transcurridos.                                            |
| Bruta        | Intentos totales de insercion / 5 / minutos transcurridos.                                          |
| Precision    | Inserciones correctas / intentos totales. Corregir no borra fallos.                                 |
| Consistencia | 100 menos la variacion relativa del WPM acumulado, limitada a 0-100. Con una sola muestra vale 100. |

Las pruebas por tiempo siguen activas en segundo plano y terminan en su limite,
aunque el temporizador se ejecute tarde. Los records comparan modo, idioma,
longitud, modificadores y entrenamiento; las medias de progreso son agregados
de la seleccion. No se afirma equivalencia exacta con las formulas de Monkeytype.

## Verificacion

```sh
npm test
npm run lint
npm run format:check
npm run build
npm run test:e2e
npm audit
```

Los E2E usan Edge en Windows. En otros sistemas instala Chromium con
`npx playwright install chromium`. Cubren escritorio y movil, foco, contraste,
temas del sistema, Unicode, cronometro, copias, reinicios y almacenamiento bloqueado.
Tambien comprueban la practica a 320 px y en escritorio de poca altura.
Las capturas quedan en `artifacts/`, fuera del repositorio.

La emulacion movil Chromium no certifica Safari ni un teclado real de iPhone.
El override de `minimatch` corrige la cadena de lint y se verifica con ESLint;
no uses `npm audit fix --force` como solucion automatica.

## Publicar En Vercel

1. Importa tu repositorio en Vercel.
2. Selecciona **Vite** y **Node.js 24 LTS**.
3. Usa `npm run build` y el directorio de salida `dist`.
4. No agregues base de datos ni variables de entorno.
5. Revisa la preview antes de promocionarla a produccion.

Las vistas usan `#practice`, `#progress` y `#settings`, sin rewrites.
La configuracion de Vercel incluye CSP, restricciones de framing, permisos,
HSTS y cache para assets con hash. La preview local aplica los encabezados
principales. Los scripts se limitan al mismo origen; no se permite `eval`.
Los estilos inline se permiten para React y Recharts.

## Recursos De Marca

El logo conserva el teclado y el verde de Retype. El banner utiliza gris oscuro
y Manrope, sin gradientes ni elementos decorativos.

| Recurso                            | Archivo                                            |
| ---------------------------------- | -------------------------------------------------- |
| Logo vectorial                     | [public/brand/logo.svg](public/brand/logo.svg)     |
| Logo PNG transparente, 1024 x 1024 | [public/brand/logo.png](public/brand/logo.png)     |
| Banner editable, 1600 x 440        | [public/brand/banner.svg](public/brand/banner.svg) |
| Banner PNG, 3200 x 880             | [public/brand/banner.png](public/brand/banner.png) |

Usa los PNG para mantener la tipografia y el aspecto en GitHub. El banner SVG
usa Manrope; el logo SVG no necesita fuentes.

## Codigo Y Creditos

| Area                                 | Archivo                                  |
| ------------------------------------ | ---------------------------------------- |
| Motor de escritura, Unicode y tiempo | [src/lib/engine.ts](src/lib/engine.ts)   |
| Persistencia, copias y resultados    | [src/lib/storage.ts](src/lib/storage.ts) |
| Vocabulario y citas                  | [src/lib/content.ts](src/lib/content.ts) |
| Flujo de sesiones y navegacion       | [src/App.tsx](src/App.tsx)               |
| Sistema visual y medicion            | [DESIGN.md](DESIGN.md)                   |

Las citas son originales; no se copio contenido ni branding de Monkeytype.
Lucide utiliza ISC; Manrope e IBM Plex Mono, SIL Open Font License. Las licencias
completas estan incluidas en sus paquetes npm.
