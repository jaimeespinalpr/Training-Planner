# Training Planner

Aplicación oficial de planificación de entrenamientos de United Wrestling Club, con mejoras continuas.

**Aplicación:** https://jaimeespinalpr.github.io/Training-Planner/

## Uso

- Selecciona Wrestling, Lifting o Mind & Focus.
- Edita el nombre, la fecha, las actividades, sus minutos y sus notas.
- **Save plan** guarda el entrenamiento en este navegador; **Open** recupera un plan guardado.
- **Personalizar / Customize** permite subir o quitar un logo PNG/JPG/WebP, indicar club, entrenador, temporada, mensaje del pie y color del documento. La imagen se normaliza a PNG con dimensión máxima de 640 px y se guarda en este dispositivo.
- **Guardar PDF** prepara un archivo PDF de la fecha y área seleccionadas. Descárgalo o ábrelo antes de compartirlo.
- **Compartir PDF** prepara ese mismo documento. Pulsa **Compartir archivo PDF** para elegir una aplicación en el menú nativo del móvil. Si Web Share de archivos no está disponible, se descarga el PDF para adjuntarlo manualmente.

## Documento

Formato carta, encabezado con logo, nombre del plan, club, fecha y duración; tabla Actividad/Tiempo con detalles; pie con entrenador, temporada y mensaje. Las tablas largas continúan en nuevas páginas con encabezado, logo y numeración. Recupera esa estructura del planner de WPL; no es una copia pixel a pixel de sus estilos. La fuente incluida admite español sin perder acentos. El PDF se genera en el dispositivo, sin enviar planes ni logos a servicios externos.

## Almacenamiento y conexiones

Actualmente los planes y la personalización se guardan en localStorage, no en Firebase. Borrar los datos del navegador elimina ese almacenamiento; conserva una copia PDF de tus planes. La sincronización entre dispositivos y las asignaciones autenticadas no están activadas. Los archivos Firebase del repositorio son material para una futura integración, no conexiones operativas ni reglas desplegadas.

## Desarrollo y validación

Sirve la raíz con `python3 -m http.server 4173 --bind 127.0.0.1`.

`npm ci --ignore-scripts` instala las dependencias bloqueadas. `npm test` ejecuta verificaciones de UI, persistencia, exportación y contrato de Web Share en Chrome headless. El menú nativo de iOS/Android requiere validación en un dispositivo real; la verificación automatizada sustituye esa API para inspeccionar el archivo entregado. El script actual usa `/usr/bin/google-chrome` y el logo de club incluido en `tests/fixtures/`.

## Publicación

GitHub Actions publica los archivos de aplicación y `vendor/`, no dependencias de desarrollo ni archivos Firebase. Bibliotecas jsPDF y AutoTable fijadas mediante package-lock; copias de navegador y licencias en `vendor/`. Al actualizar dependencias, regenerar las copias de vendor y ejecutar las verificaciones. Fuente DejaVu Sans con licencia incluida.
