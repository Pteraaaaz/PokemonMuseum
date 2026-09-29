import * as three from "./three.js-r145/build/three.module.js"
import { FontLoader } from "./three.js-r145/examples/jsm/loaders/FontLoader.js"
import { TextGeometry } from "./three.js-r145/examples/jsm/geometries/TextGeometry.js"
import { GLTFLoader } from "./three.js-r145/examples/jsm/loaders/GLTFLoader.js"

var scene, camera, renderer, mainCamera, exhibitCamera;

var raycaster = new three.Raycaster();
var pointer = new three.Vector2();

var clickablePokemon = [];
var selectedPokemon = null;

// bikin 3 function (init, render, windows.onload)

const createDirectionalLight = () => {
    var directionalLight = new three.DirectionalLight("#ffffff", 0.8);

    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;

    return directionalLight;
}

const createAmbientLight = () => {
    var ambientLight = new three.AmbientLight("#ffffff", 0.25);

    return ambientLight;
}

const createPointLight = () => {
    var pointLight = new three.PointLight("#ffffff", 2, 20);

    pointLight.position.set(0, 6, 2);
    pointLight.castShadow = true;

    return pointLight;
}

const createFloor = () => {
    var geometry = new three.PlaneGeometry(16, 12);
    var material = new three.MeshStandardMaterial({
        color: "#202030",
        side: three.DoubleSide,
    });
    var floor = new three.Mesh(geometry, material);

    floor.receiveShadow = true;

    return floor;
};

const createPedestal = () => {
    var geometry = new three.BoxGeometry(2, 1, 2);
    var material = new three.MeshStandardMaterial({
        color: "#52527a"
    });

    var pedestal = new three.Mesh(geometry, material);
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;

    return pedestal;
}

const createPlatform = () => {
    var texture = createPokeballTexture();

    texture.wrapS = three.RepeatWrapping;
    texture.wrapT = three.RepeatWrapping;

    texture.repeat.set(1, 1);

    var geometry = new three.CylinderGeometry(0.9, 0.9, 0.05, 32);

    var material = new three.MeshStandardMaterial({map: texture});

    var platform = new three.Mesh(geometry, material);

    platform.rotateY(three.MathUtils.degToRad(90));
    platform.castShadow = true;
    platform.receiveShadow = true;

    return platform;
}

const createMuseumText = () => {
    var loader = new FontLoader();

    loader.load(
        "https://threejs.org/examples/fonts/helvetiker_bold.typeface.json",
        (font) => {
            var geometry = new TextGeometry("Pokemon Museum", {
                font: font,
                size: 0.4,
                height: 0.08,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.01,
                bevelSize: 0.005,
                bevelSegments: 3
            });

            var material = new three.MeshStandardMaterial({
                color: "#ffffff"
            });

            var text = new three.Mesh(geometry, material);

            geometry.computeBoundingBox()

            var textWidth = geometry.boundingBox.max.x - geometry.boundingBox.min.x

            text.position.set(-textWidth / 2, 2.5, -2)

            text.castShadow = true;
            text.receiveShadow = true;

            scene.add(text);
        }
    )
}

const createSkyBox = () => {
    var loader = new three.CubeTextureLoader();

    var texture = loader.load([
        "./texture/skybox/px.png",
        "./texture/skybox/nx.png",
        "./texture/skybox/py.png",
        "./texture/skybox/ny.png",
        "./texture/skybox/pz.png",
        "./texture/skybox/nz.png"
    ])

    return texture;
}

const createPokeballTexture = () => {
    var loader = new three.TextureLoader();

    var texture = loader.load("texture/pokeball-texture.png");

    return texture;
}

const createPokemonModel = (fileDirectory, pokemonName, x, y, z, scale) => {
    var loader = new GLTFLoader();

    loader.load(
        fileDirectory,
        (gltf) => {
            var model = gltf.scene;

            model.position.set(x, y, z);

            model.scale.set(scale, scale, scale);

            model.userData.pokemonName = pokemonName;

            model.traverse((child) => {
                if(child.isMesh){
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.userData.pokemonRoot = model;
                }
            })

            scene.add(model);
            clickablePokemon.push(model);
        }
    )
}

const pokemonInfo = {
    Mimikyu: {
        name: "Mimikyu",
        type: "Ghost & Fairy",
        description: "Mimikyuuuu"
    },
    Rayquaza: {
        name: "Rayquaza",
        type: "Dragon & Flying",
        description: "The GOAT"
    },
    Tyranitar: {
        name: "Tyranitar",
        type: "Dark & Rock",
        description: "Sand Veil Menace"
    }
};

const init = () => {
    // scene
    scene = new three.Scene();
    scene.background = createSkyBox();

    // camera
    // dua tipe camera -> perspective (cara kita liat sekarang / First Person) & orthographic (ibarat ngeliat blueprint)
    mainCamera = new three.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 100);
    mainCamera.position.set(0, 3, 10);
    mainCamera.lookAt(0, 1, 0);

    exhibitCamera = new three.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 100);
    exhibitCamera.position.set(0, 2, 5);
    exhibitCamera.lookAt(0, 1, 0);

    camera = mainCamera;

    renderer = new three.WebGLRenderer({
        antialias: true
    });
    // nyambungin scene dan kamere ke website

    // render sizenya beraapa
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = three.PCFSoftShadowMap;

    // masukin ke body html
    document.body.appendChild(renderer.domElement);

    renderer.domElement.addEventListener("click", (event) => {
        var rect = renderer.domElement.getBoundingClientRect();

        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(pointer, camera);

        var intersects = raycaster.intersectObjects(clickablePokemon, true);

        if(intersects.length > 0){
            var clickableObject = intersects[0].object;

            var pokemonModel = clickableObject.userData.pokemonRoot;

            if(pokemonModel){
                selectedPokemon = pokemonModel;

                var pokemonName = selectedPokemon.userData.pokemonName;
                var info = pokemonInfo[pokemonName];

                if(info) {
                    document.getElementById("pokemon-name").textContent = info.name;

                    document.getElementById("pokemon-type").textContent =
                        "Type: " + info.type;

                    document.getElementById("pokemon-description").textContent =
                        info.description;

                    document.getElementById("pokemon-info").style.display =
                        "block";
                }
            }
        }
    })

    document.getElementById("close-info").addEventListener("click", () => {
        document.getElementById("pokemon-info").style.display = "none";
        selectedPokemon = null;
    })

    var floor;

    var pedestal1;
    var pedestal2;
    var pedestal3;

    var platform1;
    var platform2;
    var platform3;

    var dirLight;
    var ambientLight;
    var pointLight;


    var object = [
        floor = createFloor(),
        pedestal1 = createPedestal(),
        pedestal2 = createPedestal(),
        pedestal3 = createPedestal(),
        platform1 = createPlatform(),
        platform2 = createPlatform(),
        platform3 = createPlatform(),
        dirLight = createDirectionalLight(),
        ambientLight = createAmbientLight(),
        pointLight = createPointLight(),
    ]

    floor.rotation.x = -Math.PI / 2;

    pedestal1.position.set(0, 0.5, 0);
    pedestal2.position.set(-3, 0.5, 0);
    pedestal3.position.set(3, 0.5, 0);

    platform1.position.set(0, 1.1, 0);
    platform2.position.set(-3, 1.1, 0);
    platform3.position.set(3, 1.1, 0);

    platform1.scale.set(1.1, 1, 1.1);
    platform2.scale.set(1.1, 1, 1.1);
    platform3.scale.set(1.1, 1, 1.1);

    object.forEach(obj => {
        scene.add(obj)
    });

    createMuseumText();
    createPokemonModel("/3d-models/rayquaza.glb", "Rayquaza", 0, 1.2, 0, 0.1);
    createPokemonModel("/3d-models/tyranitar.glb", "Tyranitar", 3, 1.2, 0, 0.4);
    createPokemonModel("/3d-models/mimikyu.glb", "Mimikyu", -3, 1.2, 0, 3);
}

const render = () => {
    clickablePokemon.forEach((pokemon) => {
        pokemon.rotation.y += 0.005;
    });
    renderer.render(scene, camera);

    // bikin supaya rendernya berulang / async
    requestAnimationFrame(render);
}

window.onload = () => {
    init();
    render();
}

window.onresize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);

    mainCamera.aspect = window.innerWidth/window.innerHeight;
    mainCamera.updateProjectionMatrix();

    exhibitCamera.aspect = window.innerWidth/window.innerHeight;
    exhibitCamera.updateProjectionMatrix();
    
}

window.addEventListener("keydown", (event) => {
    if(event.key == "1"){
        camera = mainCamera;
    }
    else if(event.key == "2"){
        camera = exhibitCamera;
    }
})