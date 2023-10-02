precision mediump float;

varying vec2 uv;

uniform vec4 hsva;
uniform int axis;
uniform float offset;

#define R 0
#define G 1
#define B 2
#define A 3
#define H 4
#define S 5
#define V 6

//http://gamedev.stackexchange.com/questions/59797/glsl-shader-change-hue-saturation-brightness
vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
	vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
	float t = uv.x + offset;

	vec4 outColor = vec4(hsv2rgb(hsva.xyz), 1.0);

	outColor.a = 1.0;

	if (axis == R) {
		outColor.r = t;
	} else if (axis == G) {
		outColor.g = t;
	} else if (axis == B) {
		outColor.b = t;
	} else if (axis == A) {
		outColor.a = t;
	} else {
		vec3 _hsv = hsva.xyz;
		if (axis == H) {
			_hsv = vec3(t, 1.0, 1.0);
		} else if (axis == S) {
			_hsv[1] = t;
		} else if (axis == V) {
			_hsv[2] = t;
		}
		outColor.rgb = hsv2rgb(_hsv);
	}

	gl_FragColor = outColor;
}