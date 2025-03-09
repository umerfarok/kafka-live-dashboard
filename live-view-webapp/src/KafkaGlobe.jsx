import { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const GLOBE_RADIUS = 1.3;
const CURVE_SEGMENTS = 256; // Increased for smoother curves
const CURVE_ANIMATION_DURATION = 2; // seconds

const KafkaGlobe = ({ messages }) => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const globeRef = useRef(null);
    const arcsRef = useRef([]);
    const markerPoolRef = useRef([]);
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const [lastMessageCount, setLastMessageCount] = useState(0);
    const timeRef = useRef(0);

    // Enhanced globe texture generation with more detailed continents and grid
    const globeTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 4096; // Increased resolution
        canvas.height = 2048;
        const ctx = canvas.getContext('2d');
        
        // Enhanced background gradient with more depth
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        if (isDarkMode) {
            gradient.addColorStop(0, '#111827');
            gradient.addColorStop(0.5, '#1F2937');
            gradient.addColorStop(1, '#111827');
        } else {
            gradient.addColorStop(0, '#F3F4F6');
            gradient.addColorStop(0.5, '#E5E7EB');
            gradient.addColorStop(1, '#F3F4F6');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Enhanced dot pattern with varied sizes and colors
        for (let i = 0; i < canvas.width; i += 8) {
            for (let j = 0; j < canvas.height; j += 8) {
                if (Math.random() > 0.75) {
                    const size = Math.random() * 2 + 0.5;
                    ctx.fillStyle = isDarkMode 
                        ? `rgba(255,255,255,${Math.random() * 0.2})`
                        : `rgba(0,0,0,${Math.random() * 0.15})`;
                    ctx.beginPath();
                    ctx.arc(i, j, size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Enhanced grid lines with better gradients
        const drawGridLine = (x1, y1, x2, y2, alpha) => {
            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            const baseColor = isDarkMode ? '255,255,255' : '0,0,0';
            gradient.addColorStop(0, `rgba(${baseColor},0)`);
            gradient.addColorStop(0.5, `rgba(${baseColor},${alpha * 0.15})`);
            gradient.addColorStop(1, `rgba(${baseColor},0)`);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        };

        // Draw more detailed grid
        for (let i = 0; i < canvas.height; i += canvas.height / 36) {
            const alpha = Math.sin((i / canvas.height) * Math.PI);
            drawGridLine(0, i, canvas.width, i, alpha);
        }
        for (let i = 0; i < canvas.width; i += canvas.width / 72) {
            const alpha = Math.sin((i / canvas.width) * Math.PI);
            drawGridLine(i, 0, i, canvas.height, alpha);
        }

        // Draw enhanced continents with more natural shapes and better shading
        const continentColor = isDarkMode ? '#2C3B4E' : '#D1D5DB';
        const continentStroke = isDarkMode ? '#3B4B61' : '#9CA3AF';
        ctx.fillStyle = continentColor;
        ctx.strokeStyle = continentStroke;
        ctx.lineWidth = 1;

        // Enhanced continent shapes with more detail
        const continents = [
            // North America
            {
                path: [[800,200], [1000,100], [1200,150], [1300,400], [1200,600], [1000,700], [800,600], [700,400]],
                color: isDarkMode ? '#2a2a40' : '#d4d4e0'
            },
            // South America
            {
                path: [[900,600], [1000,700], [950,900], [850,1000], [800,900], [850,700]],
                color: isDarkMode ? '#2a3040' : '#d4dce0'
            },
            // Europe
            {
                path: [[1700,300], [1900,200], [2100,250], [2200,400], [2100,500], [1900,450], [1800,350]],
                color: isDarkMode ? '#302a40' : '#dcd4e0'
            },
            // Africa
            {
                path: [[1800,600], [2000,550], [2100,650], [2000,800], [1900,850], [1800,750]],
                color: isDarkMode ? '#403030' : '#e0d4d4'
            },
            // Asia
            {
                path: [[2100,300], [2400,200], [2700,300], [2800,400], [2700,600], [2400,700], [2200,600], [2100,500]],
                color: isDarkMode ? '#2a4040' : '#d4e0e0'
            },
            // Australia
            {
                path: [[2600,800], [2800,750], [2900,850], [2800,950], [2600,900]],
                color: isDarkMode ? '#403a2a' : '#e0dcd4'
            }
        ];

        // Function to draw continent with smooth edges
        const drawContinent = (points, color) => {
            ctx.fillStyle = color;
            ctx.strokeStyle = isDarkMode ? '#3a3a50' : '#c0c0d0';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(points[0][0], points[0][1]);
            
            // Create smooth curves between points
            for (let i = 1; i < points.length; i++) {
                const xc = (points[i][0] + points[i-1][0]) / 2;
                const yc = (points[i][1] + points[i-1][1]) / 2;
                ctx.quadraticCurveTo(points[i-1][0], points[i-1][1], xc, yc);
            }
            
            // Close the path smoothly
            const xc = (points[0][0] + points[points.length-1][0]) / 2;
            const yc = (points[0][1] + points[points.length-1][1]) / 2;
            ctx.quadraticCurveTo(
                points[points.length-1][0],
                points[points.length-1][1],
                xc, yc
            );
            
            // Add gradient fill
            const centroid = getCentroid(points);
            const gradientFill = ctx.createRadialGradient(
                centroid.x, centroid.y, 0,
                centroid.x, centroid.y, 300
            );
            gradientFill.addColorStop(0, color);
            gradientFill.addColorStop(1, isDarkMode ? '#1a1a2e' : '#e8f0ff');
            ctx.fillStyle = gradientFill;
            
            ctx.fill();
            ctx.stroke();

            // Add highlight effect
            ctx.strokeStyle = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
        };

        // Helper function to get centroid of a shape
        const getCentroid = (points) => {
            const x = points.reduce((sum, p) => sum + p[0], 0) / points.length;
            const y = points.reduce((sum, p) => sum + p[1], 0) / points.length;
            return { x, y };
        };

        // Draw all continents
        continents.forEach(continent => {
            drawContinent(continent.path, continent.color);
        });

        // Add subtle noise texture
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 10;
            data[i] = Math.min(255, Math.max(0, data[i] + noise));
            data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
            data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
        }
        ctx.putImageData(imageData, 0, 0);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }, [isDarkMode]);

    useEffect(() => {
        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(isDarkMode ? 0x000000 : 0xf5f5f5, 5, 15);
        sceneRef.current = scene;

        // Get container dimensions and calculate aspect ratio
        const container = mountRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const aspectRatio = containerWidth / containerHeight;

        // Adjusted camera setup with proper aspect ratio
        const camera = new THREE.PerspectiveCamera(60, aspectRatio, 0.1, 1000);
        camera.position.z = 3;
        camera.position.y = 0.5;
        camera.position.x = 0;

        // Set up renderer with container dimensions
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance",
            stencil: false
        });
        
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(containerWidth, containerHeight);
        renderer.setClearColor(isDarkMode ? 0x000000 : 0xf5f5f5, 0.1);
        container.appendChild(renderer.domElement);

        // Adjusted controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.rotateSpeed = 0.5;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        controls.enableZoom = true;
        controls.minDistance = 2;
        controls.maxDistance = 5;
        controls.minPolarAngle = Math.PI * 0.3;
        controls.maxPolarAngle = Math.PI * 0.7;

        // Create Earth sphere with enhanced materials
        const earthGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
        const earthMaterial = new THREE.MeshPhongMaterial({
            map: globeTexture,
            transparent: true,
            opacity: 0.95,
            bumpScale: 0.08,
            specular: new THREE.Color(isDarkMode ? 0x444444 : 0x222222),
            shininess: 10,
            emissive: isDarkMode ? 0x112244 : 0x223355,
            emissiveIntensity: isDarkMode ? 0.15 : 0.1
        });

        // Add normal map for better lighting
        const normalMap = new THREE.TextureLoader().load(
            'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg'
        );
        earthMaterial.normalMap = normalMap;
        earthMaterial.normalScale.set(0.85, 0.85);

        const earth = new THREE.Mesh(earthGeometry, earthMaterial);
        scene.add(earth);
        globeRef.current = earth;

        // Add enhanced atmosphere effect with dynamic glow
        const atmosphereGeometry = new THREE.SphereGeometry(GLOBE_RADIUS + 0.15, 64, 64);
        const atmosphereMaterial = new THREE.ShaderMaterial({
            transparent: true,
            side: THREE.BackSide,
            uniforms: {
                time: { value: 0 },
                intensity: { value: isDarkMode ? 0.8 : 0.5 },
                color: { value: new THREE.Color(isDarkMode ? 0x4444ff : 0x88aaff) }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float intensity;
                uniform vec3 color;
                uniform float time;
                varying vec3 vNormal;
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    float pulse = sin(time * 2.0 + vUv.y * 10.0) * 0.1 + 0.9;
                    float glow = pow(0.75 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
                    float pattern = sin(vUv.y * 50.0 + time) * 0.1 + 0.9;
                    
                    vec3 finalColor = color * (1.0 + 0.2 * pattern);
                    float finalGlow = glow * intensity * pulse * pattern;
                    
                    gl_FragColor = vec4(finalColor, finalGlow);
                }
            `,
            blending: THREE.AdditiveBlending,
        });
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        scene.add(atmosphere);

        // Initialize marker pool
        const markerGeometry = new THREE.SphereGeometry(0.01, 16, 16);
        const markerMaterial = new THREE.MeshBasicMaterial({
            color: isDarkMode ? 0x00ff88 : 0x00aa66,
            transparent: true,
            opacity: 1
        });
        
        for (let i = 0; i < 50; i++) {
            const marker = new THREE.Mesh(markerGeometry, markerMaterial.clone());
            marker.visible = false;
            scene.add(marker);
            markerPoolRef.current.push(marker);
        }

        // Enhanced lighting setup
        const ambientLight = new THREE.AmbientLight(isDarkMode ? 0x333333 : 0x666666, 0.5);
        scene.add(ambientLight);

        const lights = [
            { pos: [3, 2, 3], color: 0x0044ff, intensity: isDarkMode ? 0.7 : 0.5 },
            { pos: [-3, -2, -3], color: 0x4400ff, intensity: isDarkMode ? 0.5 : 0.3 },
            { pos: [0, 3, 0], color: 0x00ff44, intensity: isDarkMode ? 0.6 : 0.4 },
            { pos: [0, -3, 0], color: 0xff4400, intensity: isDarkMode ? 0.4 : 0.3 }
        ].map(({ pos, color, intensity }) => {
            const light = new THREE.PointLight(color, intensity);
            light.position.set(...pos);
            scene.add(light);
            return light;
        });

        // Optimized animation loop
        let animationFrameId;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            
            timeRef.current += 0.01;
            
            earth.rotation.y += 0.001;
            atmosphere.rotation.y += 0.001;
            atmosphere.material.uniforms.time.value = timeRef.current;
            
            arcsRef.current.forEach((arc, index) => {
                if (arc.material.opacity <= 0) {
                    scene.remove(arc);
                    arcsRef.current.splice(index, 1);
                    return;
                }
                
                arc.material.uniforms.time.value = timeRef.current;
                arc.material.uniforms.opacity.value *= 0.97;
            });

            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            const newWidth = container.clientWidth;
            const newHeight = container.clientHeight;
            const newAspectRatio = newWidth / newHeight;
            
            camera.aspect = newAspectRatio;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        };

        // Call handleResize immediately to ensure proper initial sizing
        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            mountRef.current?.removeChild(renderer.domElement);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isDarkMode, globeTexture]);

    // Enhanced message handling with fixed source locations
    useEffect(() => {
        if (!messages || !sceneRef.current || messages.length <= lastMessageCount) return;

        const createArc = () => {
            // Fixed source locations for our Kafka services
            const sourceLocations = {
                'sensor-1': { lat: 37.7749, lon: -122.4194 }, // San Francisco
                'sensor-2': { lat: 40.7128, lon: -74.0060 }, // New York
                'api-gateway': { lat: 51.5074, lon: -0.1278 }, // London
                'database': { lat: 35.6762, lon: 139.6503 }, // Tokyo
                'cache': { lat: -33.8688, lon: 151.2093 }, // Sydney
            };

            // Main Kafka broker location (center point)
            const kafkaLocation = { lat: 52.5200, lon: 13.4050 }; // Berlin (central hub)

            const message = messages[messages.length - 1];
            const source = typeof message === 'string' ? JSON.parse(message).source : message.source;
            
            // Always send to/from the Kafka broker location
            const startLoc = sourceLocations[source] || kafkaLocation;
            const endLoc = kafkaLocation;

            // Convert to 3D coordinates
            const toCartesian = (lat, lon) => {
                const phi = (90 - lat) * (Math.PI / 180);
                const theta = (lon + 180) * (Math.PI / 180);
                return new THREE.Vector3(
                    -GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta),
                    GLOBE_RADIUS * Math.cos(phi),
                    GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta)
                );
            };

            const startPoint = toCartesian(startLoc.lat, startLoc.lon);
            const endPoint = toCartesian(endLoc.lat, endLoc.lon);

            // Enhanced curve generation with better control points
            const midPoint = new THREE.Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5);
            const distance = startPoint.distanceTo(endPoint);
            const heightFactor = Math.min(1.5, Math.max(0.5, distance));
            midPoint.normalize().multiplyScalar(GLOBE_RADIUS + distance * heightFactor);

            // Add random offset to make curves more varied
            const randomOffset = new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3
            );
            midPoint.add(randomOffset);

            // Create additional control points for smoother curve
            const startControl = new THREE.Vector3().lerpVectors(startPoint, midPoint, 0.25)
                .normalize().multiplyScalar(GLOBE_RADIUS + distance * heightFactor * 0.5);
            const endControl = new THREE.Vector3().lerpVectors(endPoint, midPoint, 0.25)
                .normalize().multiplyScalar(GLOBE_RADIUS + distance * heightFactor * 0.5);

            // Create a more complex curve with multiple control points
            const curve = new THREE.CubicBezierCurve3(
                startPoint,
                startControl,
                endControl,
                endPoint
            );

            const points = curve.getPoints(CURVE_SEGMENTS);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);

            // Enhanced shader material for arcs with improved effects
            const getMessageTypeColor = (type) => {
                switch(type?.toLowerCase()) {
                    case 'error': return new THREE.Color(0xff4444);
                    case 'warning': return new THREE.Color(0xffbb33);
                    case 'info': return new THREE.Color(0x33b5e5);
                    default: return new THREE.Color(0x00C851);
                }
            };

            const messageType = typeof message === 'string' 
                ? JSON.parse(message).type 
                : message.type;

            // Enhanced curve animation shader with better glow and trail effects
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    color: { value: getMessageTypeColor(messageType) },
                    time: { value: timeRef.current },
                    opacity: { value: 1.0 },
                    progress: { value: 0.0 },
                    length: { value: CURVE_SEGMENTS }
                },
                vertexShader: `
                    attribute float lineDistance;
                    uniform float progress;
                    varying float vLineDistance;
                    varying vec3 vPosition;
                    
                    void main() {
                        vLineDistance = position.y;
                        vPosition = position;
                        vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
                        gl_Position = projectionMatrix * modelViewPosition;
                    }
                `,
                fragmentShader: `
                    uniform vec3 color;
                    uniform float time;
                    uniform float opacity;
                    uniform float progress;
                    uniform float length;
                    varying float vLineDistance;
                    varying vec3 vPosition;
                    
                    void main() {
                        // Enhanced pulse effect with dynamic frequency
                        float pulse = sin(vLineDistance * 15.0 - time * 8.0) * 0.5 + 0.5;
                        
                        // Improved progress-based fade with smoother transitions
                        float progressFade = smoothstep(progress - 0.6, progress - 0.1, vLineDistance / length);
                        float trailFade = smoothstep(progress - 0.4, progress - 0.1, vLineDistance / length);
                        
                        // Enhanced glow effect with color variation
                        float glow = pow(pulse * trailFade, 1.5) * 2.5;
                        
                        // Dynamic edge highlight with color shift
                        float edge = pow(1.0 - abs(vLineDistance - (progress * length)) / (length * 0.1), 3.0);
                        
                        // Color variation based on trail position
                        vec3 trailColor = mix(color, vec3(1.0), pulse * 0.3);
                        vec3 finalColor = mix(trailColor, vec3(1.0), edge * 0.7);
                        
                        float finalOpacity = (progressFade * opacity * (0.6 + glow * 0.4) + edge) * opacity;
                        
                        gl_FragColor = vec4(finalColor, finalOpacity);
                    }
                `,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });

            const line = new THREE.Line(geometry, material);
            sceneRef.current.add(line);
            arcsRef.current.push(line);

            // Animate the curve drawing
            const startTime = timeRef.current;
            const duration = CURVE_ANIMATION_DURATION;
            const animate = () => {
                const progress = (timeRef.current - startTime) / duration;
                line.material.uniforms.progress.value = Math.min(1.0, progress);
                
                if (progress < 1.0) {
                    requestAnimationFrame(animate);
                }
            };
            animate();

            // Enhanced impact marker
            const createImpactMarker = () => {
                const marker = markerPoolRef.current.find(m => !m.visible);
                if (marker) {
                    marker.position.copy(endPoint);
                    marker.visible = true;
                    marker.material.opacity = 1;
                    marker.scale.set(0.1, 0.1, 0.1);

                    // Create multiple ripple effects with different sizes and speeds
                    const createRipple = (size, speed, delay) => {
                        setTimeout(() => {
                            const ripple = new THREE.Mesh(
                                new THREE.RingGeometry(0.02, 0.03, 32),
                                new THREE.MeshBasicMaterial({
                                    color: getMessageTypeColor(messageType),
                                    transparent: true,
                                    opacity: 1,
                                    side: THREE.DoubleSide
                                })
                            );
                            ripple.position.copy(endPoint);
                            ripple.lookAt(new THREE.Vector3(0, 0, 0));
                            sceneRef.current.add(ripple);

                            // Enhanced ripple animation
                            const animateRipple = () => {
                                ripple.scale.multiplyScalar(1.03 + speed);
                                ripple.material.opacity *= 0.96;

                                if (ripple.material.opacity > 0.01) {
                                    requestAnimationFrame(animateRipple);
                                } else {
                                    sceneRef.current.remove(ripple);
                                }
                            };
                            animateRipple();
                        }, delay);
                    };

                    // Create multiple ripples with different properties
                    createRipple(1.0, 0.02, 0);
                    createRipple(1.2, 0.015, 200);
                    createRipple(0.8, 0.025, 400);
                }
            };
            
            // Create impact marker after curve is drawn
            setTimeout(createImpactMarker, duration * 1000);
        };

        // Create arcs for new messages with delays
        for (let i = lastMessageCount; i < messages.length; i++) {
            setTimeout(() => createArc(), (i - lastMessageCount) * 300);
        }
        
        setLastMessageCount(messages.length);
    }, [messages, isDarkMode, lastMessageCount]);

    return (
        <Box
            ref={mountRef}
            sx={{
                width: '100%',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 2,
                '& canvas': {
                    outline: 'none',
                    display: 'block', // Added to remove any extra space
                }
            }}
        />
    );
};

export default KafkaGlobe;