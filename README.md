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

## Secciones y biblioteca de ejercicios

Cada área de entrenamiento contiene secciones con múltiples ejercicios o puntos. Wrestling incluye Introducción, Calentamiento, Técnica, Combate y Vuelta a la calma. Puedes agregar secciones personalizadas y quitar secciones del entrenamiento.

- **Agregar ejercicio** crea un elemento dentro de esa sección, con nombre, minutos y detalles. Cada cambio con nombre no vacío se guarda automáticamente en la biblioteca de esa categoría.
- **Biblioteca** abre directamente la categoría de la sección. El selector de categorías y el buscador permiten recuperar ejercicios e insertarlos en el entrenamiento actual.
- La biblioteca está separada por área (Wrestling, Lifting, Mind & Focus) y categoría. Los nombres se comparan sin distinguir mayúsculas ni espacios exteriores para evitar duplicados. Editar un ejercicio actualiza su entrada de biblioteca; los otros planes guardados conservan sus propias copias.
- Quitar un ejercicio o sección del plan no elimina la biblioteca. **Eliminar de biblioteca** requiere confirmación y no cambia los ejercicios que ya figuran en los planes.
- Un plan nuevo conserva las categorías predeterminadas vacías; las categorías personalizadas de la biblioteca reaparecen al insertar sus ejercicios.
- El PDF agrupa las actividades por sección, incluye subtotales y diferencia la duración prevista de la suma de los ejercicios. Las secciones vacías no se imprimen.

Almacenamiento: `tp_exercise_library_v1` guarda el catálogo local; los planes mantienen sus filas en `tp_draft`, `tp_tracks` y `tp_templates`, ampliadas a `[nombre, minutos, detalles, categoría, idBiblioteca]`, junto a `categories` y `schemaVersion: 2`. Los planes previos se convierten al abrirlos sin eliminar nombres, tiempos ni notas; las filas anteriores sin categoría se asignan por su posición a las secciones predeterminadas, y las adicionales a Otros.

Las verificaciones de `tests/sections.cjs` cubren múltiples ejercicios, guardado automático, escritura sin duplicados parciales, persistencia tras recarga, reutilización, categorías personalizadas, borrado independiente, aislamiento por área y PDF agrupado. Chrome headless usa `--disable-renderer-accessibility` para evitar un cierre del puente ATK observado en este host; estas verificaciones no certifican accesibilidad con lectores de pantalla.

## Documento

Formato carta, encabezado con logo, nombre del plan, club, fecha y duración; tabla Actividad/Tiempo con detalles; pie con entrenador, temporada y mensaje. Las tablas largas continúan en nuevas páginas con encabezado, logo y numeración. Recupera esa estructura del planner de WPL; no es una copia pixel a pixel de sus estilos. La fuente incluida admite español sin perder acentos. El PDF se genera en el dispositivo, sin enviar planes ni logos a servicios externos.

## Almacenamiento y conexiones

Actualmente los planes y la personalización se guardan en localStorage, no en Firebase. Borrar los datos del navegador elimina ese almacenamiento; conserva una copia PDF de tus planes. La sincronización entre dispositivos y las asignaciones autenticadas no están activadas. Los archivos Firebase del repositorio son material para una futura integración, no conexiones operativas ni reglas desplegadas.

## Desarrollo y validación

Sirve la raíz con `python3 -m http.server 4173 --bind 127.0.0.1`.

`npm ci --ignore-scripts` instala las dependencias bloqueadas. `npm test` ejecuta verificaciones de UI, persistencia, exportación y contrato de Web Share en Chrome headless. El menú nativo de iOS/Android requiere validación en un dispositivo real; la verificación automatizada sustituye esa API para inspeccionar el archivo entregado. El script actual usa `/usr/bin/google-chrome` y el logo de club incluido en `tests/fixtures/`.

## Publicación

GitHub Actions publica los archivos de aplicación y `vendor/`, no dependencias de desarrollo ni archivos Firebase. Bibliotecas jsPDF y AutoTable fijadas mediante package-lock; copias de navegador y licencias en `vendor/`. Al actualizar dependencias, regenerar las copias de vendor y ejecutar las verificaciones. Fuente DejaVu Sans con licencia incluida.
