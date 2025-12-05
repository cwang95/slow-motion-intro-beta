import * as THREE from 'https://unpkg.com/three@0.164.0/build/three.module.js';
import {
    simulationVertexShader,
    simulationFragmentShader,
    renderVertexShader,
    renderFragmentShader
} from './shaders.js';

document.addEventListener("DOMContentLoaded", async () => {

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const width = window.innerWidth * window.devicePixelRatio;
    const height = window.innerHeight * window.devicePixelRatio;

    const simScene = new THREE.Scene();
    const scene = new THREE.Scene();

    const options = { format: THREE.RGBAFormat, type: THREE.FloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
    let rtA = new THREE.WebGLRenderTarget(width, height, options);
    let rtB = new THREE.WebGLRenderTarget(width, height, options);

    // Load image
    const loader = new THREE.TextureLoader();
    const imageTexture = await loader.loadAsync('image.png'); // update path
    imageTexture.minFilter = THREE.LinearFilter;
    imageTexture.magFilter = THREE.LinearFilter;

    // Mouse
    const mouse = new THREE.Vector3();
    renderer.domElement.addEventListener("mousemove", e => {
        mouse.x = e.clientX * window.devicePixelRatio;
        mouse.y = (window.innerHeight - e.clientY) * window.devicePixelRatio;
        mouse.z = 1.0;
    });
    renderer.domElement.addEventListener("mouseleave", () => mouse.z = 0.0);

    // Simulation material
    const simMaterial = new THREE.ShaderMaterial({
        vertexShader: simulationVertexShader,
        fragmentShader: simulationFragmentShader,
        uniforms: {
            iChannel0: { value: rtA.texture },
            iResolution: { value: new THREE.Vector2(width, height) },
            iMouse: { value: mouse },
            delta: { value: 1.0 }
        },
        glslVersion: THREE.GLSL3
    });

    const simQuad = new THREE.Mesh(new THREE.PlaneGeometry(2,2), simMaterial);
    simScene.add(simQuad);

    // Render material
    const renderMaterial = new THREE.ShaderMaterial({
        vertexShader: renderVertexShader,
        fragmentShader: renderFragmentShader,
        uniforms: {
            iChannel0: { value: rtB.texture },
            iChannel1: { value: imageTexture },
            iResolution: { value: new THREE.Vector2(width, height) }
        },
        glslVersion: THREE.GLSL3
    });

    const renderQuad = new THREE.Mesh(new THREE.PlaneGeometry(2,2), renderMaterial);
    scene.add(renderQuad);

    // Animate
    function animate() {
        simMaterial.uniforms.iChannel0.value = rtA.texture;

        renderer.setRenderTarget(rtB);
        renderer.render(simScene, camera);

        renderMaterial.uniforms.iChannel0.value = rtB.texture;

        renderer.setRenderTarget(null);
        renderer.render(scene, camera);

        [rtA, rtB] = [rtB, rtA];

        requestAnimationFrame(animate);
    }
    animate();

    // Resize
    window.addEventListener('resize', () => {
        const w = window.innerWidth * window.devicePixelRatio;
        const h = window.innerHeight * window.devicePixelRatio;
        renderer.setSize(window.innerWidth, window.innerHeight);
        rtA.setSize(w,h);
        rtB.setSize(w,h);
        simMaterial.uniforms.iResolution.value.set(w,h);
        renderMaterial.uniforms.iResolution.value.set(w,h);
    });
});
