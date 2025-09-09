const phrases = [];

// Frase correcta por fragmentos (orden objetivo que comprobamos)
    const fragments = [
      "Nunca he estado preparado,",                              // índice 0
      "a veces solo hay que ser valiente",                     // índice 1
      "o estar muy loco,",                                      // índice 2
      "o las dos cosas.",                                       // índice 3
      "Aceptar que no todo está bajo nuestro control",          // índice 4
      "y estar en paz con ello,",                               // índice 5
      "también significa estar en control."                     // índice 6
    ];
    phrases.push(fragments);
  
    const fragments2 = [
      "Ser valiente,",                              // índice 0
      "no significa la ausencia",                     // índice 1
      "del miedo,",                                      // índice 2
      "sino reconocer,",                                       // índice 3
      "que existe algo",          // índice 4
      "más importante:",                               // índice 5
      "atreverse a intentar."                     // índice 6
    ];
    phrases.push(fragments2);

    const fragments3 = [
      "No escuchar,",                              // índice 0
      "el ruido ajeno",                     // índice 1
      "es aprender,",                                      // índice 2
      "a oír",                                       // índice 3
      "tu propia voz.",          // índice 4
    ];
    phrases.push(fragments3);

    console.log(phrases);
    

    // --- Utilidades simples ---
    const $ = s => document.querySelector(s); // selector corto (ej: $("#pieces"))
    const pieces = $("#pieces");              // contenedor del banco de piezas
    const dropzone = $("#dropzone");          // contenedor donde se arma la frase
    const result = $("#result");              // elemento donde mostramos mensajes

    
    // Mezcla Fisher–Yates (sin sesgo): crea y devuelve una copia mezclada del array
    function shuffle(arr) {
      const a = arr.slice();                  // copiamos para no mutar el original
      for (let i = a.length - 1; i > 0; i--) { // recorrido desde el final
        const j = Math.floor(Math.random() * (i + 1)); // índice aleatorio 0..i
        [a[i], a[j]] = [a[j], a[i]];         // swap
      }
      return a;                              // array mezclado
    }

    // Contador para asignar ids únicas a cada pieza (útil para drag & drop)
    let idCounter = 0;

    // Crea un botón que representa una pieza con el texto dado
    function createPiece(text) {
      const b = document.createElement("button"); // uso de button => accesible y focusable
      b.type = "button";                          // evita que sea submit en un form
      b.className = "piece";                      // clase CSS
      b.textContent = text;                       // texto visible en la pieza
      b.draggable = true;                         // habilita drag nativo
      b.id = "p-" + (idCounter++);                // id único: p-0, p-1, ...
      return b;                                   // devolvemos el elemento
    }

    const indiceAleatorio= Math.floor(Math.random()*phrases.length);
    console.log(indiceAleatorio); 
    const PlayPhrase = phrases[indiceAleatorio];
    console.log(PlayPhrase);

    // Resto: limpia la UI y rellena el banco con piezas mezcladas
    function renderNewRound() {
      result.textContent = "";                    // borra mensaje anterior
      result.className = "status row";            // resetea clases de estado
      pieces.innerHTML = "";                      // limpia banco
      dropzone.innerHTML = "";                    // limpia zona de armado

      shuffle(PlayPhrase).forEach(t => pieces.appendChild(createPiece(t))); // crea piezas mezcladas
    }

    // --- Drag & Drop nativo con delegación ---
    let draggedId = null; // guardamos el id del elemento que se está arrastrando

    // Inicio del drag: guardamos id y configuramos el dataTransfer
    function onDragStart(e) {
      const t = e.target.closest(".piece"); // soporta delegación por si el target no es exactamente el botón
      if (!t) return;                       // si no hay pieza, salimos
      draggedId = t.id;                     // guardamos id (por compatibilidad)
      e.dataTransfer.setData("text/plain", draggedId); // ponemos el id en dataTransfer
      e.dataTransfer.effectAllowed = "move"; // indicamos que la intención es mover
    }

    // allowDrop: necesario para que el drop sea permitido (evita comportamiento por defecto)
    function allowDrop(e) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }

    // onDrop: se ejecuta cuando sueltas una pieza sobre una zona (pieces o dropzone)
    function onDrop(e) {
      e.preventDefault(); // prevenir comportamiento por defecto
      const id = e.dataTransfer.getData("text/plain") || draggedId; // recuperamos id
      const piece = document.getElementById(id); // buscamos el elemento por id
      if (!piece) return; // si no lo encontramos, salimos

      const container = e.currentTarget; // la zona sobre la que se soltó (pieces o dropzone)
      container.appendChild(piece); // lo añadimos AL FINAL del contenedor (comportamiento "append")
      updateStatus(false, true); //actualizamos el estado (sin confeti porque llamada normal)
    }

    // Registramos los listeners en ambos contenedores (delegación en zona)
    [pieces, dropzone].forEach(zone => {
      zone.addEventListener("dragstart", onDragStart);    // cuando inicia drag de una pieza dentro de la zona
      zone.addEventListener("dragover", allowDrop);      // necesario para permitir drop
      zone.addEventListener("drop", onDrop);             // manejar el drop
      zone.addEventListener("dragenter", () => zone.classList.add("over")); // efecto visual al entrar
      zone.addEventListener("dragleave", () => zone.classList.remove("over")); // quitar efecto al salir
      zone.addEventListener("drop", () => zone.classList.remove("over")); // quitar efecto tras soltar
    });

    // --- Verificación del orden y control de confeti ---
    // showConfetti: booleano opcional; si true lanzaremos confeti cuando la frase sea correcta
    function updateStatus(checkFinal = false, showConfetti = false) {
      // Obtenemos el arreglo de textos colocados en la dropzone (en el orden DOM actual)
      const placed = Array.from(dropzone.children).map(n => n.textContent.trim());
      const done = placed.length === PlayPhrase.length; // true si ya se colocaron todas las piezas
      const ok = done && placed.every((t, i) => t === PlayPhrase[i]); // true si cada pieza está en su lugar exacto

      // estado intermedio: mostramos cuántas piezas hay colocadas
      // Durante el armado (checkFinal = false)
      if(!checkFinal){
        result.textContent = `Colocadas: ${placed.length}/${PlayPhrase.length}`;
        result.className = "status row";
        return; // no seguimos evaluando
      }

      if (ok) {
        result.className = "status row correct";        // clase para estilo

        if (showConfetti) {                             // solo si pidieron confeti explícitamente
          confetti({ particleCount: 120, spread: 60, origin: { x: 0, y: 0.8 } }); // izquierda
          confetti({ particleCount: 120, spread: 60, origin: { x: 1, y: 0.8 } }); // derecha

           result.textContent = "¡Correcto! 🎉";            // mensaje de éxito
        }

      } else if(done) {
        // todas las piezas están colocadas pero el orden no coincide con `PlayPhrase`
        result.textContent = "El orden no es correcto, intenta otra vez.";
        result.className = "status row wrong";
      }
    }


    // Evento del botón "Verificar": llama updateStatus con showConfetti = true
    $("#check").addEventListener("click", () => updateStatus(true, true)); // al hacer click, si es correcto, también saldrá confeti
    // Evento del botón "Reiniciar": generamos una nueva ronda (remezcla y limpia zona)
    $("#reset").addEventListener("click", renderNewRound);

    // Lanzamos la primera ronda al cargar
    renderNewRound();
