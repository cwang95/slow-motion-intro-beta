// shaders.js

// Simulation Vertex Shader
export const simulationVertexShader = `
out vec2 vUv;

void main() {
    vUv = position.xy * 0.5 + 0.5; // position is injected by Three.js
    gl_Position = vec4(position, 1.0);
}
`;

// Simulation Fragment Shader
export const simulationFragmentShader = `
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D iChannel0; // previous simulation
uniform vec2 iResolution;
uniform vec3 iMouse;
uniform float delta;

void main() {
    ivec2 fragCoord = ivec2(vUv * iResolution);

    vec4 state = texelFetch(iChannel0, fragCoord, 0);
    float pressure = state.x;
    float pVel = state.y;

    float pRight = texelFetch(iChannel0, fragCoord + ivec2(1,0),0).x;
    float pLeft  = texelFetch(iChannel0, fragCoord + ivec2(-1,0),0).x;
    float pUp    = texelFetch(iChannel0, fragCoord + ivec2(0,1),0).x;
    float pDown  = texelFetch(iChannel0, fragCoord + ivec2(0,-1),0).x;

    if(fragCoord.x == 0)                    pLeft  = pRight;
    if(fragCoord.x == int(iResolution.x)-1) pRight = pLeft;
    if(fragCoord.y == 0)                    pDown  = pUp;
    if(fragCoord.y == int(iResolution.y)-1) pUp    = pDown;

    pVel += delta * (-2.0 * pressure + pRight + pLeft) * 0.25;
    pVel += delta * (-2.0 * pressure + pUp + pDown) * 0.25;

    pressure += delta * pVel;
    pVel -= 0.005 * delta * pressure;
    pVel *= 0.998;
    pressure *= 0.999;

    if(iMouse.z > 0.0){
        float dist = distance(vec2(fragCoord), iMouse.xy);
        if(dist < 20.0) pressure += 1.0 - dist / 20.0;
    }

    fragColor = vec4(pressure, pVel, (pRight - pLeft)*0.5, (pUp - pDown)*0.5);
}
`;

// Render Vertex Shader
export const renderVertexShader = `
out vec2 vUv;

void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position, 1.0);
}
`;

// Render Fragment Shader
export const renderFragmentShader = `
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D iChannel0; // simulation buffer
uniform sampler2D iChannel1; // image
uniform vec2 iResolution;

void main() {
    vec4 sim = texture(iChannel0, vUv);
    vec2 displacedUv = vUv + 0.2 * sim.zw;

    vec4 color = texture(iChannel1, displacedUv);

    vec3 normal = normalize(vec3(-sim.z, 0.2, -sim.w));
    vec3 lightDir = normalize(vec3(-3.0, 10.0, 3.0));
    float spec = pow(max(0.0, dot(normal, lightDir)), 60.0);

    fragColor = color + vec4(vec3(spec), 0.0);
}
`;
