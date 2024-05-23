import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

//limit the FPS
let msPrevious = window.performance.now();
const fps = 60;
const msPerFrame = 1000 / fps;

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
	static checkCollisionGround(entity, other = ground) {
		if (
			this.boxCollision({
				entity,
				other,
			})
		) {
			entity.velocity.y *= 0.6; //multiply by friction
			entity.velocity.y = -entity.velocity.y;
		} else {
			entity.position.y += entity.velocity.y;
		}
	}

	static boxCollision({ entity, other }) {
		const xCollision =
			entity.right >= other.left && entity.left <= other.right;
		const yCollision =
			entity.bottom + entity.velocity.y <= other.top &&
			entity.top >= other.bottom;
		const zCollision =
			entity.front >= other.back && entity.back <= other.front;
		return xCollision && yCollision && zCollision;
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
		isPlayer = false,
		zAcceleration = false
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

		this.front = this.position.z + this.depth / 2;
		this.back = this.position.z - this.depth / 2;

		this.right = this.position.x + this.width / 2;
		this.left = this.position.x - this.width / 2;

		this.bottom = this.position.y - this.height / 2;
		this.top = this.position.y + this.height / 2;
		this.gravity = -0.002;
	}

	updateSides() {
		this.front = this.position.z + this.depth / 2;
		this.back = this.position.z - this.depth / 2;

		this.right = this.position.x + this.width / 2;
		this.left = this.position.x - this.width / 2;

		this.bottom = this.position.y - this.height / 2;
		this.top = this.position.y + this.height / 2;
	}

	update() {
		this.updateSides();
		this.velocity.y += this.gravity; //apply gravity

		this.position.x += this.velocity.x;
		this.position.z += this.velocity.z;
		this.playerControls();
		CollisionDetector.checkCollisionGround(this);
	}

	playerControls() {
		cube.velocity.x = 0;
		cube.velocity.z = 0;
		if (keys.a.pressed) cube.velocity.x = -0.05;
		else if (keys.d.pressed) cube.velocity.x = 0.05;
		if (keys.w.pressed) cube.velocity.z = -0.05;
		else if (keys.s.pressed) cube.velocity.z = 0.05;
	}
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
	isPlayer: true
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

const keys = {
	a: {
		pressed: false,
	},
	d: {
		pressed: false,
	},
	s: {
		pressed: false,
	},
	w: {
		pressed: false,
	},
};

const enemy = new Box({
	width: 1,
	height: 1,
	depth: 1,
	position: {
		x: 0,
		y: 0,
		z: -4,
	},
	velocity: {
		x: 0,
		y: 0,
		z: 0.005,
	},
	color: "red",
});
enemy.castShadow = true;
scene.add(enemy);
const enemies = [enemy];

addEventListener("keydown", (keyPressed) => {
	switch (keyPressed.code) {
		case "KeyA":
			keys.a.pressed = true;
			break;
		case "KeyD":
			keys.d.pressed = true;
			break;
		case "KeyS":
			keys.s.pressed = true;
			break;
		case "KeyW":
			keys.w.pressed = true;
			break;
	}
});

addEventListener("keyup", (keyPressed) => {
	switch (keyPressed.code) {
		case "KeyA":
			keys.a.pressed = false;
			break;
		case "KeyD":
			keys.d.pressed = false;
			break;
		case "KeyS":
			keys.s.pressed = false;
			break;
		case "KeyW":
			keys.w.pressed = false;
			break;
	}
});

function animate() {
	const animationId = requestAnimationFrame(animate);
	const msNow = window.performance.now();
	const msPassed = msNow - msPrevious;

	if (msPassed < msPerFrame) return;

	const excessTime = msPassed % msPerFrame;
	msPrevious = msNow - excessTime;
	msPrevious = msNow;

	cube.update();
	enemies.forEach((enemy) => {
		enemy.update();
		if (
			CollisionDetector.boxCollision({
				entity: cube,
				other: enemy,
			})
		) {
			cancelAnimationFrame(animationId);
		}
	});
	renderer.render(scene, camera);
}
animate();

addEventListener("resize", () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
});
