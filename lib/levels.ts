export type Lesson = {
  id: string;
  title: string;
  theory: string;
  objective: string;
  isTest?: boolean;
  isDynamicAi?: boolean;
};

export type Module = {
  id: string;
  title: string;
  lessons: Lesson[];
};

export const modules: Module[] = [
  {
    id: "modulo-1",
    title: "1. Setup y Exploración",
    lessons: [
      {
        id: "m1-l1",
        title: "Mirando qué hay (show dbs)",
        theory: "¡Bienvenido a la sesión ultra intensiva de MongoDB!\n\nAntes de crear cosas, como buenos profesionales, vemos qué existe en el servidor. Para listar qué 'cuadernos' o bases de datos hay instaladas:\n\n`show dbs`\n\n(Las BD sin datos no aparecen por optimización de memoria).",
        objective: "Escribe el comando nativo `show dbs` para escanear el servidor.",
        isTest: false
      },
      {
        id: "m1-l2",
        title: "Creando el Espacio de Trabajo (use)",
        theory: "El comando `use` se usa para **entrar** a una base de datos existente o **para crear una nueva mágicamente** si no existiera.\n\nEjemplo: `use veterinaria`",
        objective: "Escribe `use empresa` para crear y seleccionar nuestra base de datos corporativa.",
        isTest: false
      },
      {
        id: "m1-l3",
        title: "¿Qué es una Colección?",
        theory: "Las Bases de Datos MongoDB se dividen internamente por 'Colecciones' (como Tablas en SQL). Para organizarlo se usa:\n\n`db.createCollection('perros')`",
        objective: "Escribe el comando `db.createCollection('personal')` para inicializar el contenedor donde irán nuestros empleados.",
        isTest: false
      },
      {
        id: "m1-l4",
        title: "Listando tus Colecciones",
        theory: "¡Cerciórate de que se crearon los contenedores! Para revisar cuántas colecciones hay bajo tu DB elegida, usarás:\n\n`show collections`",
        objective: "Escribe `show collections` y confirma que figure tu colección nueva.",
        isTest: false
      },
      {
         id: "m1-test",
         title: "Prueba Modular: El Gestor",
         theory: "¡Fin del Módulo 1! Has aprendido cómo navegar alrededor del entorno.\n1. `show dbs` te permite ver qué bases existen.\n2. `use baseDatos` crea/te cambia a esa base.\n3. `db.createCollection('tabla')` te asegura la existencia física de un contenedor.\n4. `show collections` visualiza lo que tienes.",
         objective: "Demuestra lo aprendido: Crea una base de datos totalmente nueva llamada 'ventas' (usa comando use) y luego crea en ella una colección llamada 'ticket_2026' (db.createCollection).",
         isTest: true
      }
    ]
  },
  {
    id: "modulo-2",
    title: "2. Inserciones (CRUD)",
    lessons: [
      {
        id: "m2-l1",
        title: "Tu Primer Documento (insertOne)",
        theory: "En MongoDB los datos se guardan en formato JSON dentro de Documentos {}.\nEjemplo:\n`db.perros.insertOne({ nombre: 'Boby', raza: 'Pug' })`\n(Nota: Si la colección no existía previamente, `insertOne` la crea en secreto por ti).",
        objective: "Usa el comando `use empresa` (si no estabas dentro) y luego ingresa un empleado a la colección 'personal' usando `db.personal.insertOne({ nombre: 'Juan Pérez', cargo: 'CEO' })`.",
        isTest: false
      },
      {
        id: "m2-l2",
        title: "Inserción Múltiple (insertMany)",
        theory: "Manejar grandes bultos de datos es típico. Usamos `insertMany([ {}, {} ])` (Pasando entre corchetes una LISTA de los corchetes pequeños).\n\nEjemplo: `db.perros.insertMany([ {n:'A'}, {n:'B'} ])`",
        objective: "Dentro de la BD 'empresa', usa `db.personal.insertMany` e ingresa al menos 2 personas extra (ej con campos nombre y edad, como [ {nombre:'Ana', edad:20}, {nombre:'Luis', edad: 25} ] )",
        isTest: false
      },
      {
        id: "m2-test",
        title: "Prueba Modular: Data Entry",
        theory: "Aprobaste el ingreso de datos manual y automático en MongoDB. Sabes cómo utilizar objetos JSON embebidos. En la vida útil empresarial los datos deben cargarse de inmediato y rápido formando un documento robusto.",
        objective: "Usa insertMany para meter dos documentos MÁS a la colección 'personal'. Deben tener sí o sí los campos 'nombre' y 'sueldo' (este último, un número).",
        isTest: true
      }
    ]
  },
  {
    id: "modulo-3",
    title: "3. Consultas y Filtros Avanzados",
    lessons: [
      {
        id: "m3-l1",
        title: "Consultas sin Condiciones (find)",
        theory: "Para leer los datos de todo un contenedor usas `find()` vacío.\n\nEjemplo:\n`db.perros.find()` \nTe listará sin misericordia miles y miles de resultados.",
        objective: "Utiliza `db.personal.find()` sin nada adentro para ver absolutamente a todo el personal de la empresa.",
        isTest: false
      },
      {
         id: "m3-l2",
         title: "F. Textuales y Regex (findOne / RegExp)",
         theory: "Si solo quieres recuperar 1 documento, el primero que exista, usas `findOne()`. Además, si buscas texto que contenga fragmentos usas `$regex` (Expresiones Regulares).\nEjemplo: `db.perros.find({ raza: { $regex: 'pu', $options: 'i' } })` busca cualquier raza que incluya 'pu' como 'Pug'.",
         objective: "Jugueteemos a buscar. Ejecuta el comando `db.personal.findOne()` para que MongoDB te devuelva un solo miembro del equipo sin estresarse.",
         isTest: false
      },
      {
        id: "m3-l3",
        title: "Operadores Relacionales ($gt, $lt, $ne)",
        theory: "¿Qué pasa si busco perros de más de 5 años? Usamos operadores. \n`$gt` (mayor), `$lt` (menor), `$gte` (mayor igual), `$ne` (no es igual a).\nEjemplo:\n`db.perros.find({ edad: { $gt: 5 } })`",
        objective: "Busca en la colección `personal` a aquellos trabajadores donde el 'sueldo' filtre como `$gt` (mayor) a un monto como 1000, o 'edad' mayor a 20 (el campo numérico que hayas registrado recién).",
        isTest: false
      },
      {
        id: "m3-l4",
        title: "Compuertas Lógicas ($or, $and, $in)",
        theory: "Permiten cruces.\n`$or`: Uno u otro.  Ej: `$or: [{nombre: 'A'}, {nombre:'B'}]`\n`$and`: Forzoso que los dos existan.\n`$in`: Si el campo de la persona está DENTRO de un arreglo de opciones. Ej: `db.perros.find({raza: { $in: ['Pug', 'Beagle'] }})`",
        objective: "Busca usando el operador `$or` a trabajadores cuyo 'nombre' pueda ser Mónica O Juan. (Opcional, hazlo con cualquier nombre tuyo).",
        isTest: false
      },
      {
        id: "m3-l5",
        title: "Modificadores Paginables (limit, skip, count)",
        theory: "Las funciones de Mongo son anidables.\n`.count()` cuenta.\n`.limit(5)` solo te trae 5. \n`.skip(10)` se salta los 10 primeros resultados, muy útil en la 'Paginación' tipo Amazon.\n`.sort({edad: -1})` te los ordena de mayor a menor.",
        objective: "Ejecuta un encadenado de modificadores `db.personal.find().sort({ _id: -1 }).limit(1)` Esto te traerá exactamente la última persona que ingresaste en la DB.",
        isTest: false
      },
      {
        id: "m3-test",
        title: "Prueba Modular: Data Analyst",
        theory: "El módulo 3 fue duro. Aprendiste cómo filtrar entre millones de documentos usando operadores Lógicos (`$or`, `$in`), Operadores de Rango Numérico (`$lt`, `$gt`) y las estructuras complejas del cursor para paginar.",
        objective: "Prueba final de consultas: De la DB empresa, ejecuta un find en la colección 'personal' buscando con operador de Rango a alguien mayor a 0 años de edad O mayor a 1 billete de sueldo. Y termina la consulta encadenándole un .count()",
        isTest: true
      }
    ]
  },
  {
    id: "modulo-4",
    title: "4. Actualizaciones (Mutaciones)",
    lessons: [
      {
        id: "m4-l1",
        title: "Asignando y Reemplazar ($set)",
        theory: "Se usa `updateOne({filtro}, {modificador})`. El `$set` permite crear y reemplazar un dato dentro del documento sin destruir el resto de su contenido original.\nEjemplo: `db.perros.updateOne({nombre: 'Boby'}, { $set: { vacunasAlDia: true } })`",
        objective: "Dale a alguien del equipo. Busca usando de filtro `db.personal.updateOne` a un miembro con 'nombre' X. Y en su modificador asígnale `{ $set: { departamento: 'Sistemas', bonificacion: 100 } }`.",
        isTest: false
      },
      {
         id: "m4-l2",
         title: "Incrementar y Quitar Campos ($inc, $unset)",
         theory: "Dos geniales:\n`$inc`: Va sumando al número existente, como un carrito de ventas o para depositar saldo. Ej: `{ $inc: { saldo: 50} }`.\n`$unset`: Extirpa definitivamente ese campo del JSON. Ej: `{ $unset: { bonificacion: true} }`.",
         objective: "Busca a un gerente/miembro específico de tu personal en updateOne y aplícale un `{ $inc: { bonificacion: 500 } }` ¡Premio gordo al instante sumándose a lo anterior!",
         isTest: false
      },
      {
        id: "m4-l3",
        title: "Actualización Masiva (updateMany, $rename)",
        theory: "Para mutar a todo un grupo completo según un filtro usamos `updateMany()`.\nOtro grandioso es `$rename`, si te equivocaste y 'apell' debía escribirse 'apellido': `{ $rename: { 'apell': 'apellido'} }`",
        objective: "Intenta darles a todos tus trabajadores un nuevo beneficio. `updateMany({})` con un filtro vacío aplicará al 100% de la gente de la colección. Añádeles `$set: { empresaPagada: true }` a Todos.",
        isTest: false
      },
      {
         id: "m4-test",
         title: "Prueba Modular: Operador Humano",
         theory: "Las bases de datos sufren mutaciones de estado todos los segundos mediante Updates.",
         objective: "Supera el nivel usando UpdateMany sobre 'personal'. Escoge a la gente por filtro de 'empresaPagada: true'. Aplícales a esos mismos el operador oscuro `$unset` para borrarle a todos el campo que acababas de crear: { $unset: { empresaPagada: '' } }",
         isTest: true
      }
    ]
  },
  {
    id: "modulo-5",
    title: "5. Arreglos y Subdocumentos",
    lessons: [
      {
        id: "m5-l1",
        title: "Inmersos: Objectos Adentro (Mapas)",
        theory: "¿Qué pasa si alguien requiere dirección? Se pone un `{ dentro de un }`.\nEj: `db.perros.insertOne({ nombre: 'Lucas', direccion: { calle: 'Colon', comuna: 'Pudahuel' } })`\nLuego lo buscas con COMILLAS `db.perros.find({ 'direccion.calle': 'Colon' })`",
        objective: "Agrega con insertOne a un trabajador en 'personal' pero que posea un sub-objeto llamado 'contacto' de la forma `{ contacto: {telefono: 111, correo: 'l@o.cl'} }`",
        isTest: false
      },
      {
        id: "m5-l2",
        title: "Arreglos Nativos: Push y Pull ([])",
        theory: "Los arreglos de MongoDB son potentes. \n`$push`: Empuja un solo o varios elementos al final del Array.\n`$pull`: Remueve un string por valor o si calza un target.\n`$addToSet`: Empuja un elemento PERO solo si él no existía antes en la lista. ",
        objective: "Usa `updateOne` en tu usuario X y ponle un `{ $push: { herramientas: 'Martillo' } }`",
        isTest: false
      },
      {
         id: "m5-test",
         title: "Prueba Modular: Arreglos",
         theory: "Controlar sub-niveles diferencia al programador junior de un nivel medio.",
         objective: "Usando el updateOne en la persona a la cual le diste el martillo, elimínale el martillo usando operador `$pull` sobre su arreglo herramientas.",
         isTest: true
      }
    ]
  },
  {
    id: "modulo-6",
    title: "6. Aggregation Framework",
    lessons: [
      {
        id: "m6-l1",
        title: "Uniendo tuberías de datos (pipeline)",
        theory: "Aquí inicia la analítica de empresas.\nEl `db.coleccion.aggregate([])` acepta un arreglo de operaciones continuas ejecutadas en cadena (Tuberías Pipa). \nLa más vital es `$match`, que es literalmente lo mismo que un `.find({})` pero adaptado para ser el primer paso de un pipeline de agregación.",
        objective: "Inicia escribiendo `db.personal.aggregate([ { $match: { cargo: 'CEO' } } ])` (Reemplaza 'CEO' por el filtro que quieras).",
        isTest: false
      },
      {
        id: "m6-l2",
        title: "Agrupación Analítica ($group y $sum)",
        theory: "Ahora la magia. ¿Y si quiero ver la suma de TODOS los sueldos en 1 ciudad específica?\nEn lugar del find, usas agregados con `$group` por un '_id' común.\nEj: `{ $group: { _id: '$departamento', totalSueldos: { $sum: '$sueldo' } } }`",
        objective: "Encadena una agregación en array, ejemplo: `db.personal.aggregate([ { $group: { _id: 'todos', costoMensual: { $sum: '$bonificacion' } } } ])`.",
        isTest: false
      },
      {
         id: "m6-test",
         title: "Prueba Modular: Científico de Datos",
         theory: "Las Pipelines de Analítica te permitirán cruzar y exportar la analítica financiera del sistema sin colapsar el Backend.",
         objective: "Realiza una consulta combinada pura usando aggregate(). Combina el  `{ $match: { _id: { $exists: true } } }` y luego como segundo en el corchete el `{ $group: { _id: 'TodosJuntos', contados: { $sum: 1 } } }` simulando el funcionamiento de un contador nativo.",
         isTest: true
      }
    ]
  },
  {
    id: "modulo-7",
    title: "7. Índices de Desempeño",
    lessons: [
      {
         id: "m7-l1",
         title: "Creación de Índice B-Tree (createIndex)",
         theory: "Si tienes 3 millones de personas, un find() puede tardar demasiado porque revisa DATO POR DATO secuencial (CollScan).\nLa solución es crear un índice estructurado sobre el campo crítico. Usas `createIndex({campo: orden})`.\nEjemplo para optimizar búsquedas por RUT: `db.personas.createIndex({ rut: 1 })`.",
         objective: "Ayuda al desempeño de tu colección ejecutando un `db.personal.createIndex({ nombre: 1 })` para indexarlos alfabéticamente a baja escala.",
         isTest: false
      },
      {
         id: "m7-l2",
         title: "Viendo nuestro Catálogo (getIndexes)",
         theory: "Los índices sí ocupan mucha RAM y disco, la computadora gasta RAM por ti para no colapsar el CPU cuando haya tráfico.\nPara ver tu inversión:\n`db.coleccion.getIndexes()`",
         objective: "Asegúrate de que Mongo obedeció el comando anterior usando `db.personal.getIndexes()`",
         isTest: true
      }
    ]
  },
  {
    id: "modulo-8",
    title: "8. Borrado y Destrucción General",
    lessons: [
      {
        id: "m8-l1",
        title: "Despidiendo a Uno (deleteOne)",
        theory: "Llegó la hora de eliminar. Si alguien renunció, nos libramos de ese documento.\nAsí: `db.personal.deleteOne({ nombre: 'Juan' })`\n(Este método no perdona y es instantáneo desde la V4 de Mongo).",
        objective: "Despide a un trabajador usando `deleteOne` indicando de preferencia su 'nombre'.",
        isTest: false
      },
      {
        id: "m8-l2",
        title: "Borrado Masivo (deleteMany)",
        theory: "El temido botón de destrucción general. \n`db.perros.deleteMany({})` vacío borra absolutamente todos los documentos de la colección.\n\nEsto limpia la información y deja a todos vacíos.",
        objective: "Usa `deleteMany({})` vacío para despedir a absolutamente todo el personal.",
        isTest: false
      },
      {
        id: "m8-l3",
        title: "Borrar la Colección Estructural (drop)",
        theory: "Ya borraste a los trabajadores pero la carpeta literal '.personal' sigue existiendo para Mongo.\nPara hacerla estallar en partes desde el cimiento: `db.nombreColeccion.drop()`.",
        objective: "Vuela tu colección de base mediante `db.personal.drop()`.",
        isTest: false
      },
      {
        id: "m8-l4",
        title: "Armagedón del Database (dropDatabase)",
        theory: "Esto liquidará al ecosistema actual. \nOJO: Este comando actúa sobre la base de datos a la que estés conectado, se lleva Índices, Vistas, Agregaciones y Colecciones al infinito negro cósmico.\n\nSería así:\n`db.dropDatabase()`",
        objective: "Escribe el comando nativo `db.dropDatabase()` en la terminal. Termina la lección limpiando todo el rastro de la 'empresa' y tu cursado.",
        isTest: true
      }
    ]
  },
  {
    id: "modulo-9",
    title: "9. SIMULADOR LABORAL (Desafío Groq AI)",
    lessons: [
      {
         id: "m9-boss",
         title: "La Gran Ligas 🧠",
         theory: "Ahora todo dependerá de ti. Ya no hay más tutoriales escritos estáticos, lo que vas a afrontar ahora son problemas de la vida real inyectables y asíncronos generados por nuestra IA de forma improvisada.\n\nEl sistema te pedirá manejar empresas distintas, solucionar bugs, e implementar CRUD libremente.",
         objective: "No hay objetivo estático definido. Todo se compila al vuelo, prepárate para los golpes de tu CEO virtual.",
         isDynamicAi: true
      }
    ]
  }
];
