// Librería Three.js desde CDN

    // Variables globales para escena, cámara, renderer y objetos
    let scene, camera, renderer;
    let circlePieces = []; // Array que contendrá el círculo o sus fragmentos
    let broken = false;    // Boolean que indica si el círculo está roto
    let circle;            // El mesh del círculo original
    const friccion = .98;  //


    //Grietas variables:
    let crackTexture; // Textura para las grietas
    let crackMesh;    // Malla que mostrará las grietas


    // Getting from CSS - Styles and values.
    const rootStyles = getComputedStyle(document.documentElement);
    // Color del circulo
    const colorcircle = rootStyles.getPropertyValue('--circle').trim();
    // Vista de la camara (getPropertyValue consigue valores devueltos como string)
    const cameraPositionCircle = parseFloat(rootStyles.getPropertyValue('--camera-position-circle').trim());
    // Velocidad de animación (getPropertyValue consigue valores devueltos como string)
    const explosionSpeed = parseFloat(rootStyles.getPropertyValue('--explosion--speed').trim());


    // Raycaster para detectar clicks en objetos 3D
    const raycaster = new THREE.Raycaster();
    // Vector para almacenar la posición del mouse normalizada
    const mouse = new THREE.Vector2();

    // Obtener referencia al contenedor donde pondremos el canvas
    const container = document.getElementById('circle-container');

    // Llamar funciones de inicialización y animación
    createScene();
    init();
    // animate();


  function createCircle(){

    // Crear geometría de círculo con 64 segmentos para suavidad
      const circleGeometry = new THREE.CircleGeometry(1, 64);
      // Crear material físico para simular cristal
      const material = new THREE.MeshPhysicalMaterial({
        // color: 0x88ccff,     // Azul claro
        color: colorcircle,      //Amarillo patito
        transparent: false,   // Habilitar transparencia
        opacity: 0.5,        // Opacidad media para translúcido
        roughness: 0.1,      // Poco rugoso para brillo
        metalness: 0,        // No metálico
        clearcoat: 1,        // Capa extra de brillo
        clearcoatRoughness: 0.1
      });
      // Crear mesh combinando geometría y material
      circle = new THREE.Mesh(circleGeometry, material);
      // Añadir círculo a la escena
      scene.add(circle);

      // Guardar círculo para detectar clicks sobre él
      circlePieces.push(circle);

  }

  function resetScene() {
     // 1. Eliminar todos los objetos de la escena
       while(scene.children.length > 0){ 
         scene.remove(scene.children[0]); 
       }

      //2. Vaciar el array de fragmentos/piezas
      circlePieces = [];

      //  //2. Volver a crear el círculo
      init();

       broken = false; // volver al estado inicial
     }


function createScene(){
      // Crear la escena de Three.js
      scene = new THREE.Scene();
      // Establecer color de fondo de la escena (rosa claro)
      // scene.background = new THREE.Color(0x00FFFFFF);
      scene.background = null;

      // Crear cámara perspectiva con aspecto basado en el tamaño del contenedor
      camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
      // Posicionar la cámara alejándola para ver el círculo completo
      camera.position.z = cameraPositionCircle;

      // Crear el renderer con antialias para suavizar bordes
      renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
      // Ajustar tamaño del renderer para llenar el contenedor
      renderer.setSize(container.clientWidth, container.clientHeight);
      // Insertar el canvas del renderer dentro del contenedor
      container.appendChild(renderer.domElement);

      // Escuchar clicks en la ventana para romper el círculo
      window.addEventListener('click', onClick);

      // Ajustar tamaño del renderer y cámara cuando se redimensiona la ventana
      window.addEventListener('resize', () => {
        renderer.setSize(container.clientWidth, container.clientHeight);
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
      });

      animate();
}



  function addLights(){
    // Añadir luz ambiental suave para iluminar la escena
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      // Añadir luz direccional para brillo y reflejos más marcados
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);
  }




  function init() {

      // Añadir luz ambiental suave para iluminar la escena
      // Añadir luz direccional para brillo y reflejos más marcados
      addLights();

      //Crear círculo
      createCircle();

      // // Escuchar clicks en la ventana para romper el círculo
      // window.addEventListener('click', onClick);

      // // Ajustar tamaño del renderer y cámara cuando se redimensiona la ventana
      // window.addEventListener('resize', () => {
      //   renderer.setSize(container.clientWidth, container.clientHeight);
      //   camera.aspect = container.clientWidth / container.clientHeight;
      //   camera.updateProjectionMatrix();
      // });
    }

    // Función que se ejecuta al hacer click
    function onClick(event) {
      // Si el círculo ya está roto, no hacer nada
      // if (broken) return;

      // Obtener el rectángulo del contenedor para calcular posición relativa del click
      const rect = container.getBoundingClientRect();
      const insideCanvas =
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom;

        if (!insideCanvas) return; // click fuera → nada


      // Convertir coordenadas del click a rango normalizado [-1, 1]
      mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = - ((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

      // Actualizar raycaster desde la cámara hacia la posición del mouse
      raycaster.setFromCamera(mouse, camera);

      // Buscar intersección entre raycaster y objetos clickeables (círculo o fragmentos)
      const intersects = raycaster.intersectObjects(circlePieces);


      //MODIFICACIÓN
       if(broken){
        //Busca en el espacio del círculo completo
        const hitCircle = raycaster.intersectObject(circle, true);
          if (hitCircle.length > 0) {
        // if (insideCanvas) {
              resetScene();
              return;
           }
        }


      // Si se clickeó sobre alguna pieza
      if (intersects.length > 0) {
        // Romper el círculo en fragmentos
        breakCircle(circle);
        broken = true;
      }
    }

    // Función que divide el círculo en fragmentos y los dispersa
    function breakCircle(circle) {

      // Quitar el círculo original de la escena
      scene.remove(circle);
      // Limpiar el array de piezas para poner solo fragmentos
      circlePieces = [];

      const fragmentsCount = 6; // Número de fragmentos
      const radius = 1;           // Radio del círculo
      const color = colorcircle;     // Color azul claro para fragmentos

      // Crear cada fragmento como una "rebanada" tipo pizza
      for (let i = 0; i < fragmentsCount; i++) {
        const shape = new THREE.Shape();

        // Ángulos inicial y final de la rebanada
        const startAngle = (i * 2 * Math.PI) / fragmentsCount;
        const endAngle = ((i + 1) * 2 * Math.PI) / fragmentsCount;

        // Crear sector con centro y arco
        shape.moveTo(0, 0);
        shape.absarc(0, 0, radius, startAngle, endAngle, false);

        // Crear geometría basada en la forma
        const geometry = new THREE.ShapeGeometry(shape);
        // Crear material para fragmento con mismo estilo que el círculo
        const material = new THREE.MeshPhysicalMaterial({
          color: color,
          transparent: true,
          opacity: 0.5,
          roughness: 0.1,
          metalness: 0,
          clearcoat: 1,
          clearcoatRoughness: 0.1,
          side: THREE.DoubleSide // Mostrar ambas caras
        });
        // Crear mesh fragmento
        const mesh = new THREE.Mesh(geometry, material);

        // Posición inicial en el centro
        mesh.position.set(0, 0, 0);

        // Asignar velocidad y rotación aleatorias para animar dispersión
        mesh.userData = {
          velocity: new THREE.Vector3(
            Math.cos((startAngle + endAngle) / 2) * (explosionSpeed + Math.random() * explosionSpeed),
            Math.sin((startAngle + endAngle) / 2) * (explosionSpeed + Math.random() * explosionSpeed),
            0
          ),
          rotationSpeed: (Math.random() - 0.5) * 0.2
        };

        // Guardar fragmento en array y agregar a escena
        circlePieces.push(mesh);
        scene.add(mesh);
      }
    }

    
    //Detecta el espacio de la animación, asigna el estilo... cursor:pointer.

    window.addEventListener('mousemove', onMouseMove);

    function onMouseMove(event) {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;
        
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(circlePieces);

      if (intersects.length > 0) {
        container.style.cursor = 'pointer';
      } else {
        container.style.cursor = 'default';
      }
    }

    // Loop de animación que se ejecuta cada frame (~60fps)
  function animate(event) {
    requestAnimationFrame(animate);

    // Si el círculo está roto, mover y rotar los fragmentos
    if (broken) {
  
        circlePieces.forEach(piece => {
          //Mover piezas
          piece.position.add(piece.userData.velocity);

          //Rotación
          piece.rotation.z += piece.userData.rotationSpeed;

          // aplicar friccion
          piece.userData.velocity.multiplyScalar(friccion);
          piece.userData.rotationSpeed *= friccion;
        });
      }

      // Renderizar la escena con la cámara
      renderer.render(scene, camera);
  }
  

    