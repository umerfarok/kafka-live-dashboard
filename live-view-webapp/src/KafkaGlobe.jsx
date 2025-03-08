import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const KafkaGlobe = ({ messages }) => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const globeRef = useRef(null);
    const arcsRef = useRef([]);
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const [lastMessageCount, setLastMessageCount] = useState(0);

    useEffect(() => {
        // Scene setup
        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(isDarkMode ? 0x000000 : 0xf5f5f5, 5, 15);
        sceneRef.current = scene;

        // Camera setup
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 4;
        camera.position.y = 0.5;

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance"
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(isDarkMode ? 0x000000 : 0xf5f5f5, 0.1);
        mountRef.current.appendChild(renderer.domElement);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.rotateSpeed = 0.3;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.3;
        controls.enableZoom = true;
        controls.minDistance = 3;
        controls.maxDistance = 8;

        // Create Earth sphere with higher detail
        const earthGeometry = new THREE.SphereGeometry(1.5, 96, 96);
        const earthMaterial = new THREE.MeshPhongMaterial({
            color: isDarkMode ? 0x1a1a1a : 0xf0f0f0,
            transparent: true,
            opacity: 0.9,
            wireframe: true,
            emissive: isDarkMode ? 0x112244 : 0x223355,
            emissiveIntensity: 0.1,
            wireframeLinewidth: 0.5
        });
        const earth = new THREE.Mesh(earthGeometry, earthMaterial);
        scene.add(earth);
        globeRef.current = earth;

        // Add latitude lines
        const latitudeLines = new THREE.Group();
        for (let i = -80; i <= 80; i += 20) {
            const radius = 1.51;
            const points = [];
            const segments = 96;
            for (let j = 0; j <= segments; j++) {
                const theta = (j / segments) * Math.PI * 2;
                const x = radius * Math.cos((i * Math.PI) / 180) * Math.cos(theta);
                const z = radius * Math.cos((i * Math.PI) / 180) * Math.sin(theta);
                points.push(new THREE.Vector3(x, radius * Math.sin((i * Math.PI) / 180), z));
            }
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ 
                color: isDarkMode ? 0x333333 : 0xdddddd,
                transparent: true,
                opacity: 0.2
            });
            const circle = new THREE.Line(geometry, material);
            latitudeLines.add(circle);
        }
        scene.add(latitudeLines);

        // Add longitude lines
        const longitudeLines = new THREE.Group();
        for (let i = 0; i < 360; i += 20) {
            const radius = 1.51;
            const points = [];
            for (let j = 0; j <= 180; j++) {
                const lat = (j - 90) * Math.PI / 180;
                const lon = i * Math.PI / 180;
                points.push(new THREE.Vector3(
                    radius * Math.cos(lat) * Math.cos(lon),
                    radius * Math.sin(lat),
                    radius * Math.cos(lat) * Math.sin(lon)
                ));
            }
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ 
                color: isDarkMode ? 0x333333 : 0xdddddd,
                transparent: true,
                opacity: 0.2
            });
            const line = new THREE.Line(geometry, material);
            longitudeLines.add(line);
        }
        scene.add(longitudeLines);

        // Add grid sphere
        const gridGeometry = new THREE.SphereGeometry(1.51, 32, 32);
        const gridMaterial = new THREE.MeshBasicMaterial({
            color: isDarkMode ? 0x333333 : 0xdddddd,
            transparent: true,
            opacity: 0.2,
            wireframe: true
        });
        const grid = new THREE.Mesh(gridGeometry, gridMaterial);
        scene.add(grid);

        // Lighting
        const ambientLight = new THREE.AmbientLight(isDarkMode ? 0x404040 : 0x606060, 0.5);
        scene.add(ambientLight);

        const createPointLight = (x, y, z, intensity, color) => {
            const light = new THREE.PointLight(color, intensity);
            light.position.set(x, y, z);
            scene.add(light);
            return light;
        };

        createPointLight(5, 3, 5, isDarkMode ? 0.6 : 0.4, 0x0044ff);
        createPointLight(-5, -3, -5, isDarkMode ? 0.4 : 0.3, 0x4400ff);
        createPointLight(0, 5, 0, isDarkMode ? 0.5 : 0.4, 0x00ff44);

        // Animation loop with smoother rotation
        let animationFrameId;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            
            // Rotate globe and grid lines
            earth.rotation.y += 0.001;
            latitudeLines.rotation.y += 0.001;
            longitudeLines.rotation.y += 0.001;
            
            // Update arcs with smoother fade out
            arcsRef.current.forEach((arc, index) => {
                arc.material.opacity -= 0.005;
                if (arc.material.opacity <= 0) {
                    scene.remove(arc);
                    arcsRef.current = arcsRef.current.filter((_, i) => i !== index);
                }
            });

            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // Handle window resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            mountRef.current?.removeChild(renderer.domElement);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isDarkMode]);

    // Update arc creation with smoother paths
    useEffect(() => {
        if (!messages || !sceneRef.current || messages.length <= lastMessageCount) return;

        const createArc = () => {
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            const radius = 1.5;

            const points = [];
            const numPoints = 100; // Increased for smoother curves
            for (let i = 0; i <= numPoints; i++) {
                const t = i / numPoints;
                // Add some randomness to the arc path for more organic look
                const randOffset = (Math.random() - 0.5) * 0.1;
                const r = radius * (0.7 + 0.5 * t + randOffset);
                const x = r * Math.sin(theta) * Math.cos(phi);
                const y = r * Math.sin(theta) * Math.sin(phi);
                const z = r * Math.cos(theta);
                points.push(new THREE.Vector3(x, y, z));
            }

            const curve = new THREE.CatmullRomCurve3(points);
            const geometry = new THREE.TubeGeometry(curve, 100, 0.004, 8, false);
            const material = new THREE.MeshPhongMaterial({
                color: isDarkMode ? 0x00ff88 : 0x00aa66,
                transparent: true,
                opacity: 0.8,
                emissive: isDarkMode ? 0x003322 : 0x002211,
                emissiveIntensity: 0.5,
                shininess: 100
            });

            const arc = new THREE.Mesh(geometry, material);
            sceneRef.current.add(arc);
            arcsRef.current.push(arc);

            // Remove old arcs if there are too many
            if (arcsRef.current.length > 100) {
                const oldArc = arcsRef.current.shift();
                sceneRef.current.remove(oldArc);
            }
        };

        // Create multiple arcs with slight delays for more natural effect
        for (let i = lastMessageCount; i < messages.length; i++) {
            const numArcs = Math.floor(Math.random() * 2) + 1;
            for (let j = 0; j < numArcs; j++) {
                setTimeout(() => createArc(), j * 100); // Stagger arc creation
            }
        }
        
        setLastMessageCount(messages.length);
    }, [messages, isDarkMode, lastMessageCount]);

    return (
        <Box
            ref={mountRef}
            sx={{
                width: '100%',
                height: '100vh',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 0,
                backgroundColor: theme.palette.background.default
            }}
        />
    );
};

export default KafkaGlobe;