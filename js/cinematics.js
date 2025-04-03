export class CinematicsManager {
    constructor(ui, scene, camera, renderer) {
        this.ui = ui;
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        // Almacenar la posición original de la cámara para restaurarla después
        this.originalCameraPosition = {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
        };

        this.originalCameraRotation = {
            x: camera.rotation.x,
            y: camera.rotation.y,
            z: camera.rotation.z
        };

        // Estado de la cinemática
        this.isPlaying = false;
        this.currentCinematic = null;
        this.cinematicCamera = null;

        // Definir cinemáticas del juego
        this.cinematics = {
            intro: {
                title: "NovaFTW",
                scenes: [
                    {
                        type: "image",
                        content: "images/cinematics/earth_space_station.jpg",
                        text: "Año 2157. La humanidad ha establecido colonias en todo el sistema solar gracias a la tecnología de propulsión interestelar.",
                        duration: 6000
                    },
                    {
                        type: "image",
                        content: "images/cinematics/fleet.jpg",
                        text: "La Flota de Defensa Terrestre mantiene la paz entre las colonias y protege contra posibles amenazas externas.",
                        duration: 6000
                    },
                    {
                        type: "image",
                        content: "images/cinematics/alien_ship.jpg",
                        text: "Pero una señal de origen desconocido ha sido detectada en los límites del sistema. Naves alienígenas se aproximan a gran velocidad.",
                        duration: 6000
                    },
                    {
                        type: "image",
                        content: "images/cinematics/pilot.jpg",
                        text: "Como piloto de élite de la nave experimental NovaFTW, tu misión es enfrentar esta amenaza y descubrir sus intenciones.",
                        duration: 6000
                    }
                ]
            },
            level1: {
                title: "Nivel 1: Primer Contacto",
                scenes: [
                    {
                        type: "image",
                        content: "images/cinematics/space_colony.jpg",
                        text: "La primera oleada de naves alienígenas ha atacado la colonia espacial en órbita de Marte. Debes defender la estación y repeler el ataque.",
                        duration: 6000
                    }
                ]
            },
            level2: {
                title: "Nivel 2: Campo de Asteroides",
                scenes: [
                    {
                        type: "image",
                        content: "images/cinematics/asteroid_field.jpg",
                        text: "Las naves enemigas se han replegado hacia el cinturón de asteroides. Debes perseguirlas a través de este peligroso territorio.",
                        duration: 6000
                    }
                ]
            },
            level3: {
                title: "Nivel 3: Planeta Enemigo",
                scenes: [
                    {
                        type: "image",
                        content: "images/cinematics/enemy_planet.jpg",
                        text: "Has seguido a la flota enemiga hasta su base principal. Es hora de enfrentar a su líder y detener la invasión de una vez por todas.",
                        duration: 6000
                    }
                ]
            },
            ending: {
                title: "Final",
                scenes: [
                    {
                        type: "image",
                        content: "images/cinematics/victory.jpg",
                        text: "Has derrotado a la amenaza alienígena y salvado a la humanidad. La Tierra y sus colonias están a salvo... por ahora.",
                        duration: 6000
                    },
                    {
                        type: "image",
                        content: "images/cinematics/mystery.jpg",
                        text: "Pero las señales interceptadas sugieren que esto fue solo el principio. Algo más grande se aproxima desde las profundidades del espacio...",
                        duration: 6000
                    },
                    {
                        type: "text",
                        content: "",
                        text: "CONTINUARÁ...",
                        duration: 4000
                    }
                ]
            }
        };

        // Crear cinemáticas alternativas para cuando no hay imágenes disponibles
        this.createFallbackCinematics();

        // Escuchar eventos para saltar cinemáticas
        document.addEventListener('keydown', (e) => {
            if (this.isPlaying && e.code === 'Space') {
                this.skipCinematic();
            }
        });
    }

    createFallbackCinematics() {
        // Crear versiones alternativas de las cinemáticas que usan escenas 3D en lugar de imágenes
        // Esto es útil cuando no tenemos las imágenes disponibles

        // Clonar las cinemáticas originales
        this.fallbackCinematics = JSON.parse(JSON.stringify(this.cinematics));

        // Reemplazar el tipo de cada escena por "scene3D"
        Object.keys(this.fallbackCinematics).forEach(key => {
            const cinematic = this.fallbackCinematics[key];
            cinematic.scenes.forEach(scene => {
                if (scene.type === "image") {
                    scene.type = "scene3D";
                    scene.content = scene.text; // Usar el texto como identificador de la escena
                }
            });
        });
    }

    playCinematic(cinematicId, onComplete) {
        // Verificar si la cinemática existe
        if (!this.cinematics[cinematicId] && !this.fallbackCinematics[cinematicId]) {
            console.error(`Cinemática '${cinematicId}' no encontrada`);
            if (onComplete) onComplete();
            return;
        }

        // Usar cinemáticas alternativas si no hay imágenes disponibles
        const useFallback = !this.checkImagesAvailable(cinematicId);
        const cinematic = useFallback ? this.fallbackCinematics[cinematicId] : this.cinematics[cinematicId];

        this.isPlaying = true;
        this.currentCinematic = {
            id: cinematicId,
            scenes: [...cinematic.scenes],
            currentSceneIndex: 0,
            onComplete: onComplete
        };

        // Reproducir la primera escena
        this.playNextScene();
    }

    checkImagesAvailable(cinematicId) {
        // Verificar si las imágenes de la cinemática están disponibles
        // En un entorno real, podríamos precargar las imágenes y verificar si se cargaron correctamente
        // Para este ejemplo, asumiremos que no están disponibles y usaremos las alternativas
        return false;
    }

    playNextScene() {
        if (!this.isPlaying || !this.currentCinematic) return;

        // Verificar si hay más escenas
        if (this.currentCinematic.currentSceneIndex >= this.currentCinematic.scenes.length) {
            this.endCinematic();
            return;
        }

        // Obtener la escena actual
        const scene = this.currentCinematic.scenes[this.currentCinematic.currentSceneIndex];

        // Reproducir la escena según su tipo
        switch (scene.type) {
            case "image":
                this.playImageScene(scene);
                break;
            case "scene3D":
                this.play3DScene(scene);
                break;
            case "text":
                this.playTextScene(scene);
                break;
            default:
                console.error(`Tipo de escena desconocido: ${scene.type}`);
                this.currentCinematic.currentSceneIndex++;
                this.playNextScene();
                break;
        }

        // Programar la siguiente escena
        setTimeout(() => {
            if (this.isPlaying) {
                this.currentCinematic.currentSceneIndex++;
                this.playNextScene();
            }
        }, scene.duration);
    }

    playImageScene(scene) {
        // Mostrar la imagen y el texto en la interfaz
        this.ui.showCinematic(scene.content, scene.text);
    }

    playTextScene(scene) {
        // Mostrar solo texto en la interfaz
        this.ui.showCinematic("", scene.text);
    }

    play3DScene(scene) {
        // Crear una escena 3D basada en el contenido
        const canvas = this.createScene3D(scene.content);

        // Mostrar la escena y el texto en la interfaz
        this.ui.showCinematic(canvas, scene.text);
    }

    createScene3D(sceneId) {
        // Crear una escena 3D basada en el identificador
        // Aquí podríamos crear diferentes escenas según el ID

        // Crear un canvas para renderizar la escena
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 450;

        // Crear una escena simple con un fondo estrellado y algunos objetos
        const tempScene = new THREE.Scene();
        const tempCamera = new THREE.PerspectiveCamera(60, canvas.width / canvas.height, 0.1, 1000);
        tempCamera.position.set(0, 5, 10);
        tempCamera.lookAt(0, 0, 0);

        // Crear un renderer temporal
        const tempRenderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        tempRenderer.setSize(canvas.width, canvas.height);

        // Añadir iluminación
        const ambientLight = new THREE.AmbientLight(0x404040, 1);
        tempScene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(0, 10, 10);
        tempScene.add(directionalLight);

        // Crear fondo estrellado
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1,
            transparent: true
        });

        const starsVertices = [];
        for (let i = 0; i < 1000; i++) {
            const x = (Math.random() - 0.5) * 200;
            const y = (Math.random() - 0.5) * 200;
            const z = (Math.random() - 0.5) * 200;
            starsVertices.push(x, y, z);
        }

        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        const starField = new THREE.Points(starsGeometry, starsMaterial);
        tempScene.add(starField);

        // Añadir objetos según el ID de la escena
        switch (sceneId) {
            case "La humanidad ha establecido colonias en todo el sistema solar gracias a la tecnología de propulsión interestelar.":
                // Añadir planeta y estación espacial
                this.addPlanet(tempScene, 0, 0, -20, 10, 0x0077ff);
                this.addSpaceStation(tempScene, 5, 3, -15, 2);
                break;

            case "La Flota de Defensa Terrestre mantiene la paz entre las colonias y protege contra posibles amenazas externas.":
                // Añadir naves
                for (let i = 0; i < 5; i++) {
                    this.addSpaceship(tempScene, i * 3 - 6, i % 2 - 0.5, -15 - i, 0.5, 0x3366ff);
                }
                break;

            case "Pero una señal de origen desconocido ha sido detectada en los límites del sistema. Naves alienígenas se aproximan a gran velocidad.":
                // Añadir naves alienígenas
                this.addPlanet(tempScene, -15, -5, -30, 5, 0x663399);
                for (let i = 0; i < 3; i++) {
                    this.addSpaceship(tempScene, -10 + i * 4, 2, -20 - i * 2, 0.8, 0xff3366);
                }
                break;

            case "Como piloto de élite de la nave experimental NovaFTW, tu misión es enfrentar esta amenaza y descubrir sus intenciones.":
                // Añadir nave del jugador
                this.addSpaceship(tempScene, 0, 0, 0, 1, 0x00ffff);
                break;

            case "La primera oleada de naves alienígenas ha atacado la colonia espacial en órbita de Marte. Debes defender la estación y repeler el ataque.":
                // Añadir colonia espacial y naves enemigas
                this.addSpaceStation(tempScene, 0, 0, -10, 3);
                for (let i = 0; i < 7; i++) {
                    this.addSpaceship(tempScene, Math.random() * 20 - 10, Math.random() * 10 - 5, -15 - Math.random() * 10, 0.5, 0xff0000);
                }
                break;

            case "Las naves enemigas se han replegado hacia el cinturón de asteroides. Debes perseguirlas a través de este peligroso territorio.":
                // Añadir asteroides
                for (let i = 0; i < 20; i++) {
                    this.addAsteroid(tempScene, Math.random() * 40 - 20, Math.random() * 20 - 10, -20 - Math.random() * 20, Math.random() * 2 + 0.5);
                }
                break;

            case "Has seguido a la flota enemiga hasta su base principal. Es hora de enfrentar a su líder y detener la invasión de una vez por todas.":
                // Añadir planeta enemigo y base
                this.addPlanet(tempScene, 0, -10, -30, 15, 0x660000);
                this.addEnemyBase(tempScene, 0, 0, -15, 3);
                break;

            case "Has derrotado a la amenaza alienígena y salvado a la humanidad. La Tierra y sus colonias están a salvo... por ahora.":
                // Añadir Tierra y explosiones
                this.addPlanet(tempScene, 0, 0, -20, 10, 0x0077ff);
                for (let i = 0; i < 5; i++) {
                    this.addExplosion(tempScene, Math.random() * 20 - 10, Math.random() * 10 - 5, -15 - Math.random() * 10, Math.random() + 1);
                }
                break;

            case "Pero las señales interceptadas sugieren que esto fue solo el principio. Algo más grande se aproxima desde las profundidades del espacio...":
                // Añadir silueta misteriosa en la distancia
                this.addPlanet(tempScene, 0, 0, -50, 30, 0x000000);
                const glow = new THREE.PointLight(0xff0000, 2, 100);
                glow.position.set(0, 0, -50);
                tempScene.add(glow);
                break;

            default:
                // Escena genérica con algunos objetos
                this.addPlanet(tempScene, 0, 0, -20, 8, 0x0077ff);
                break;
        }

        // Animar la escena
        const animate = () => {
            if (!this.isPlaying) return;

            // Rotar objetos, mover naves, etc.
            tempScene.children.forEach(child => {
                if (child.userData.type === 'planet') {
                    child.rotation.y += 0.001;
                } else if (child.userData.type === 'spaceship') {
                    child.position.z += child.userData.speed || 0.02;
                } else if (child.userData.type === 'asteroid') {
                    child.rotation.x += 0.01;
                    child.rotation.y += 0.005;
                }
            });

            // Renderizar la escena
            tempRenderer.render(tempScene, tempCamera);

            requestAnimationFrame(animate);
        };

        animate();

        return canvas;
    }

    addPlanet(scene, x, y, z, radius, color) {
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: color,
            shininess: 10
        });

        const planet = new THREE.Mesh(geometry, material);
        planet.position.set(x, y, z);
        planet.userData = { type: 'planet' };
        scene.add(planet);

        return planet;
    }

    addSpaceStation(scene, x, y, z, size) {
        const baseGeometry = new THREE.CylinderGeometry(size, size, size * 0.5, 8);
        const baseMaterial = new THREE.MeshPhongMaterial({
            color: 0x888888,
            shininess: 30
        });

        const station = new THREE.Mesh(baseGeometry, baseMaterial);
        station.position.set(x, y, z);
        station.rotation.x = Math.PI / 2;
        station.userData = { type: 'station' };
        scene.add(station);

        // Añadir anillos
        const ringGeometry = new THREE.TorusGeometry(size * 1.5, size * 0.1, 8, 32);
        const ringMaterial = new THREE.MeshPhongMaterial({
            color: 0x444444,
            shininess: 30
        });

        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        station.add(ring);

        return station;
    }

    addSpaceship(scene, x, y, z, size, color) {
        const bodyGeometry = new THREE.ConeGeometry(size * 0.5, size * 2, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: color,
            shininess: 50
        });

        const ship = new THREE.Mesh(bodyGeometry, bodyMaterial);
        ship.position.set(x, y, z);
        ship.rotation.x = Math.PI / 2;
        ship.userData = {
            type: 'spaceship',
            speed: color === 0x00ffff ? 0 : 0.05 // Solo las naves enemigas se mueven
        };
        scene.add(ship);

        // Añadir alas
        const wingGeometry = new THREE.BoxGeometry(size * 2, size * 0.1, size * 0.5);
        const wingMaterial = new THREE.MeshPhongMaterial({
            color: color,
            shininess: 50
        });

        const wings = new THREE.Mesh(wingGeometry, wingMaterial);
        wings.position.set(0, 0, -size * 0.5);
        ship.add(wings);

        return ship;
    }

    addAsteroid(scene, x, y, z, size) {
        const geometry = new THREE.DodecahedronGeometry(size, 0);
        const material = new THREE.MeshPhongMaterial({
            color: 0x888888,
            shininess: 0
        });

        const asteroid = new THREE.Mesh(geometry, material);
        asteroid.position.set(x, y, z);
        asteroid.rotation.set(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        );
        asteroid.userData = { type: 'asteroid' };
        scene.add(asteroid);

        return asteroid;
    }

    addEnemyBase(scene, x, y, z, size) {
        const baseGeometry = new THREE.BoxGeometry(size * 2, size, size * 2);
        const baseMaterial = new THREE.MeshPhongMaterial({
            color: 0x660000,
            shininess: 30
        });

        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(x, y, z);
        base.userData = { type: 'base' };
        scene.add(base);

        // Añadir torres
        const towerPositions = [
            { x: -size * 0.7, y: size * 0.8, z: -size * 0.7 },
            { x: size * 0.7, y: size * 0.8, z: -size * 0.7 },
            { x: -size * 0.7, y: size * 0.8, z: size * 0.7 },
            { x: size * 0.7, y: size * 0.8, z: size * 0.7 }
        ];

        towerPositions.forEach(pos => {
            const towerGeometry = new THREE.CylinderGeometry(size * 0.2, size * 0.2, size * 0.6, 8);
            const towerMaterial = new THREE.MeshPhongMaterial({
                color: 0x880000,
                shininess: 30
            });

            const tower = new THREE.Mesh(towerGeometry, towerMaterial);
            tower.position.set(pos.x, pos.y, pos.z);
            base.add(tower);
        });

        return base;
    }

    addExplosion(scene, x, y, z, size) {
        const geometry = new THREE.SphereGeometry(size, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.7
        });

        const explosion = new THREE.Mesh(geometry, material);
        explosion.position.set(x, y, z);
        explosion.userData = {
            type: 'explosion',
            createdAt: Date.now()
        };
        scene.add(explosion);

        // Añadir luz
        const light = new THREE.PointLight(0xff6600, 1, 10);
        light.position.set(0, 0, 0);
        explosion.add(light);

        return explosion;
    }

    skipCinematic() {
        if (!this.isPlaying) return;

        // Ocultar la cinemática actual
        this.ui.hideCinematic();

        // Avanzar a la siguiente escena o finalizar
        this.currentCinematic.currentSceneIndex++;
        if (this.currentCinematic.currentSceneIndex >= this.currentCinematic.scenes.length) {
            this.endCinematic();
        } else {
            this.playNextScene();
        }
    }

    endCinematic() {
        this.isPlaying = false;
        this.ui.hideCinematic();

        // Restaurar la cámara a su posición original si se modificó
        if (this.cinematicCamera) {
            this.camera.position.set(
                this.originalCameraPosition.x,
                this.originalCameraPosition.y,
                this.originalCameraPosition.z
            );

            this.camera.rotation.set(
                this.originalCameraRotation.x,
                this.originalCameraRotation.y,
                this.originalCameraRotation.z
            );

            this.cinematicCamera = null;
        }

        // Llamar al callback de finalización si existe
        if (this.currentCinematic && this.currentCinematic.onComplete) {
            this.currentCinematic.onComplete();
        }

        this.currentCinematic = null;
    }

    // Método para crear una cinemática personalizada
    createCustomCinematic(title, scenes) {
        const cinematicId = 'custom_' + Date.now();
        this.cinematics[cinematicId] = {
            title: title,
            scenes: scenes
        };

        return cinematicId;
    }
}
