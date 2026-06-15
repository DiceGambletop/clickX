import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';

export class ThreeScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.onResize();

    this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 100);
    this.camera.position.set(2.2, 1.4, 2.2);
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enablePan = false;
    this.controls.enableZoom = false;
    this.controls.minPolarAngle = 0.8;
    this.controls.maxPolarAngle = 1.2;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.6;

    const hemi = new THREE.HemisphereLight(0x404040, 0x000000, 0.25);
    this.scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(2, 3, 2);
    this.scene.add(dir);

    const geo = new THREE.BoxGeometry(1,1,1);
    const mat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.35, metalness: 0.2, emissive: 0x0ea5e9, emissiveIntensity: 0.25 });
    this.cube = new THREE.Mesh(geo, mat);
    this.cube.position.y = 0;
    this.scene.add(this.cube);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.onCubeClick = null;

    this.pulse = 0;
    this.visualEnergy = 0;
    this.vibe = 0.25;

    this.prestigeCube = null; this.inVoid = false; this.onPrestigeClick = null; this.onHoverFU = null;

    this.render = this.render.bind(this);
    this.render();
  }

  onResize() {
    this.width = this.canvas.clientWidth || this.canvas.parentElement.clientWidth;
    this.height = this.canvas.clientHeight || this.canvas.parentElement.clientHeight || 400;
    this.renderer.setSize(this.width, this.height, false);
    if (this.camera) {
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
    }
  }

  handlePointer(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.pointer.set(x, y);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObject(this.cube, false);
    const pHits = (this.prestigeCube && this.prestigeCube.visible) ? this.raycaster.intersectObject(this.prestigeCube, false) : [];
    if (pHits.length && this.onPrestigeClick) { this.onPrestigeClick(); return; }
    if (hits.length) {
      this.pulse = 1;
      const worldPoint = hits[0].point.clone();
      if (this.onCubeClick) this.onCubeClick(
        (e.clientX - rect.left) / rect.width,
        (e.clientY - rect.top) / rect.height,
        worldPoint
      );
    }
  }

  handlePointerMove(e) {
    if (!this.inVoid || !this.fuSphere) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.pointer.set(x, y); this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObject(this.fuSphere, false);
    if (this.onHoverFU) this.onHoverFU(hits.length > 0);
  }

  update(dt, energy = 0) {
    this.controls.update();
    this.cube.rotation.x += 0.4 * dt;
    this.cube.rotation.y += 0.6 * dt;

    this.pulse = Math.max(0, this.pulse - dt * 3);
    const s = 1 + 0.12 * Math.sin((1 - this.pulse) * Math.PI) * this.pulse;
    this.cube.scale.setScalar(1 * (1 + 0.05 * energy) * s);

    // emissive reacts to progression "vibe"
    const targetEmissive = 0.18 + Math.min(0.9, this.vibe);
    this.cube.material.emissiveIntensity += (targetEmissive - this.cube.material.emissiveIntensity) * Math.min(1, dt * 4);

    this.visualEnergy = energy;
  }

  enterVoid() {
    // shatter effect (quick scale pop) then swap to void sphere
    if (this.cube && this.cube.parent) this.scene.remove(this.cube);
    if (this.prestigeCube && this.prestigeCube.parent) this.scene.remove(this.prestigeCube);
    this.inVoid = true; this.scene.background = new THREE.Color(0x000000);
    const geo = new THREE.SphereGeometry(0.7, 48, 48);
    const mat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, metalness:0.1, roughness:0.25, emissive:0x60a5fa, emissiveIntensity:0.35 });
    this.fuSphere = new THREE.Mesh(geo, mat); this.scene.add(this.fuSphere);
  }

  setPrestigeVisible(show) {
    if (!this.prestigeCube && show) {
      const g = new THREE.BoxGeometry(0.25,0.25,0.25);
      const m = new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffd166, emissiveIntensity: 0.4, metalness:0.6 });
      this.prestigeCube = new THREE.Mesh(g,m); this.prestigeCube.position.set(-1.6,1.0,-1.6); this.scene.add(this.prestigeCube);
    }
    if (this.prestigeCube) this.prestigeCube.visible = !!show && !this.inVoid;
  }

  render() {
    requestAnimationFrame(this.render);
    this.renderer.render(this.scene, this.camera);
  }
}
