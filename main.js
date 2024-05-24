import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

//limit the FPS
let msPrevious = window.performance.now();
const fps = 120;
const msPerFrame = 1000 / fps;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
);

camera.position.set(4.61, 2.74, 8);


const renderer = new THREE.WebGLRenderer({
	antialias: true,
	alpha: true,
});
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
			const friction = 0.5
			entity.velocity.y *= friction; //multiply by friction
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
		isEnemy = false,
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

		this.isEnemy = isEnemy;
		this.isPlayer = isPlayer;
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

		if (this.isEnemy) this.velocity.z += 0.0003;
		this.velocity.y += this.gravity; //apply gravity
		this.position.x += this.velocity.x;
		this.position.z += this.velocity.z;
		if (this.isPlayer) this.playerControls();
		CollisionDetector.checkCollisionGround(this);
	}

	playerControls() {
		this.velocity.x = 0;
		this.velocity.z = 0;
		if (keys.a.pressed) this.velocity.x = -0.08;
		else if (keys.d.pressed) this.velocity.x = 0.08;
		if (keys.w.pressed) this.velocity.z = -0.08;
		else if (keys.s.pressed) this.velocity.z = 0.08;
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
		y: 0,
		z: 0,
	},
	isPlayer: true,
});
cube.castShadow = true;
scene.add(cube);

const ground = new Box({
	width: 10,
	height: 0.5,
	depth: 50,
	color: 0x369695,
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
light.position.z = 1;
light.castShadow = true;
scene.add(light);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));

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
		case "Space":
			cube.velocity.y = 0.08;
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

const enemies = [];

let frames = 0;
let spawnRate = 200;

addEventListener("resize", () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
	const animationId = requestAnimationFrame(animate);
	renderer.render(scene, camera);
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

	if (frames % spawnRate == 0) {
		
		if(spawnRate > 20) spawnRate -= 20;
		const enemy = new Box({
			width: 1,
			height: 1,
			depth: 1,
			position: {
				x: (Math.random() - 0.5) * ground.width,
				y: 0,
				z: -20,
			},
			velocity: {
				x: 0,
				y: 0,
				z: 0.005,
			},
			color: 'red',
			isEnemy: true,
		});
		enemy.castShadow = true;
		scene.add(enemy);
		enemies.push(enemy);
	}
	frames++;
}
animate();
