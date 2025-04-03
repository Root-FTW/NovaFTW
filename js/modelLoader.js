export class ModelLoader {
    constructor(scene) {
        this.scene = scene;
        this.textureLoader = new THREE.TextureLoader();
        this.models = {};
        this.animations = {};
        this.mixers = {};
        this.defaultModels = {};

        // Crear modelos por defecto para usar mientras se cargan los reales
        this.createDefaultModels();
    }

    createDefaultModels() {
        // Nave del jugador por defecto
        const playerGeometry = new THREE.BoxGeometry(1, 0.5, 2);
        const playerMaterial = new THREE.MeshPhongMaterial({
            color: 0x3333ff,
            emissive: 0x111133,
            shininess: 30
        });
        this.defaultModels.player = new THREE.Mesh(playerGeometry, playerMaterial);

        // Enemigo por defecto
        const enemyGeometry = new THREE.BoxGeometry(1, 0.5, 1);
        const enemyMaterial = new THREE.MeshPhongMaterial({
            color: 0xff3333,
            emissive: 0x331111,
            shininess: 30
        });
        this.defaultModels.enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);

        // Jefe por defecto
        const bossGeometry = new THREE.BoxGeometry(4, 1, 4);
        const bossMaterial = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            emissive: 0x330000,
            shininess: 50
        });
        this.defaultModels.boss = new THREE.Mesh(bossGeometry, bossMaterial);

        // Power-up por defecto
        const powerupGeometry = new THREE.OctahedronGeometry(0.5, 0);
        const powerupMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            emissive: 0x003300,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });
        this.defaultModels.powerup = new THREE.Mesh(powerupGeometry, powerupMaterial);
    }

    loadModel(modelName, path, callback, options = {}) {
        // Devolver modelo por defecto
        let defaultType = options.defaultType || 'enemy';
        const defaultModel = this.defaultModels[defaultType].clone();

        // Llamar al callback con el modelo por defecto
        if (callback) callback(defaultModel);

        return defaultModel;
    }

    enhanceMaterial(material, options) {
        // Mejorar materiales con texturas y efectos
        if (options.emissiveColor) {
            material.emissive = new THREE.Color(options.emissiveColor);
            material.emissiveIntensity = options.emissiveIntensity || 0.5;
        }

        if (options.shininess) {
            material.shininess = options.shininess;
        }

        // Cargar texturas si se especifican
        if (options.textures) {
            if (options.textures.diffuse) {
                this.textureLoader.load(options.textures.diffuse, (texture) => {
                    material.map = texture;
                    material.needsUpdate = true;
                });
            }

            if (options.textures.normal) {
                this.textureLoader.load(options.textures.normal, (texture) => {
                    material.normalMap = texture;
                    material.needsUpdate = true;
                });
            }

            if (options.textures.specular) {
                this.textureLoader.load(options.textures.specular, (texture) => {
                    material.specularMap = texture;
                    material.needsUpdate = true;
                });
            }
        }
    }

    createAnimationMixer(object, modelName) {
        if (!this.animations[modelName]) return null;

        const mixer = new THREE.AnimationMixer(object);
        this.mixers[object.uuid] = mixer;

        return mixer;
    }

    playAnimation(mixer, modelName, animationName, options = {}) {
        if (!mixer || !this.animations[modelName]) return null;

        // Buscar la animación por nombre o usar la primera
        let animation;
        if (animationName && this.animations[modelName].find(a => a.name === animationName)) {
            animation = this.animations[modelName].find(a => a.name === animationName);
        } else {
            animation = this.animations[modelName][0];
        }

        if (!animation) return null;

        // Crear y configurar la acción de animación
        const action = mixer.clipAction(animation);

        if (options.loop === false) {
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
        }

        if (options.timeScale) {
            action.timeScale = options.timeScale;
        }

        action.play();
        return action;
    }

    update(deltaTime) {
        // Actualizar todos los mixers de animación
        Object.values(this.mixers).forEach(mixer => {
            mixer.update(deltaTime);
        });
    }

    // Método para limpiar recursos
    dispose() {
        // Limpiar modelos
        Object.values(this.models).forEach(model => {
            model.traverse((node) => {
                if (node.isMesh) {
                    node.geometry.dispose();

                    if (Array.isArray(node.material)) {
                        node.material.forEach(material => material.dispose());
                    } else if (node.material) {
                        node.material.dispose();
                    }
                }
            });
        });

        // Limpiar mixers
        this.mixers = {};

        // Limpiar modelos por defecto
        Object.values(this.defaultModels).forEach(model => {
            model.geometry.dispose();
            model.material.dispose();
        });
    }
}
