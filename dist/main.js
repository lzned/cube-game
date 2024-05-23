import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
);

const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

class CollisionDetector {
	constructor() {}
	static checkCollisionGround(entity) {
		if (entity.bottom + entity.velocity.y <= ground.top) {
			entity.velocity.y *= 0.6; //multiply by friction
			entity.velocity.y = -entity.velocity.y;
		} else {
			entity.position.y += entity.velocity.y;
		}
	}
}

class Box extends THREE.Mesh {
	constructor({
		width,
		height,
		depth,
		color = 0x00ff00,
		velocity = {
			x: 0,
			y: 0,
			z: 0,
		},
		position = {
			x: 0,
			y: 0,
			z: 0,
		},
	}) {
		super(
			new THREE.BoxGeometry(width, height, depth),
			new THREE.MeshStandardMaterial({ color })
		);

		this.width = width;
		this.height = height;
		this.depth = depth;
		this.color = color;

		this.velocity = velocity;
		this.position.set(position.x, position.y, position.z);

		this.bottom = this.position.y - this.height / 2;
		this.top = this.position.y + this.height / 2;
		this.gravity = -0.002;
	}

	update(ground) {
		this.bottom = this.position.y - this.height / 2;
		this.top = this.position.y + this.height / 2;
		this.velocity.y += this.gravity; //apply gravity
		CollisionDetector.checkCollisionGround(this);
		//this.#checkForCollisons();
	}
	/* //check for collision between the player entity and ground.
	#checkForCollisons() {
		//this is when we hit the ground
		if (this.bottom + this.velocity.y <= ground.top) {
			this.velocity.y *= 0.6; //multiply by friction
			this.velocity.y = -this.velocity.y;
		} else {
			this.position.y += this.velocity.y;
		}
	}*/
}
// TODO: Add an Entity class that extends the Box class.
// Todo This class will include collision detection and movement, while Box will just extend THREE.Mesh
// Todo: make const cube a Entity/Player object, and let ground remain a box.

const cube = new Box({
	width: 1,
	height: 1,
	depth: 1,
	velocity: {
		x: 0,
		y: -0.01,
		z: 0,
	},
});
cube.castShadow = true;
scene.add(cube);

const ground = new Box({
	width: 5,
	height: 0.5,
	depth: 10,
	color: 0x0000ff,
	position: {
		x: 0,
		y: -2,
		z: 0,
	},
});
ground.receiveShadow = true;
scene.add(ground);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.y = 3;
light.position.z = 2;
light.castShadow = true;
scene.add(light);

console.log(cube.position.y);
console.log(ground.position.y);

camera.position.z = 5;
controls.update();

function animate() {
	requestAnimationFrame(animate);
	cube.update(ground);

	//cube.rotation.x += 0.01;
	//cube.rotation.y += 0.01;
	//cube.position.y += -0.01;

	renderer.render(scene, camera);
}
animate();

addEventListener("resize", () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
});
