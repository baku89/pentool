precision mediump float;

varying vec2 uv;

uniform vec4 hsva;
uniform ivec2 axes;

#define R 0
#define G 1
#define B 2
#define A 3
#define H 4
#define S 5
#define V 6

#define NONE -1.0

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
	vec3 _hsv = hsva.rgb;

	vec3 rgb = hsv2rgb(_hsv);
	vec4 outColor = vec4(rgb, 1.0);


	float hue = NONE;
	float sat = NONE;

	for (int i = 0; i < 2; i++) {
		int axis = axes[i];
		float t = uv[i];

		if (axis == R) {
			outColor.r = t;
		} else if (axis == G) {
			outColor.g = t;
		} else if (axis == B) {
			outColor.b = t;
		} else if (axis == A) {
			outColor.a = t;
		} else {
			vec3 _hsv = rgb2hsv(outColor.rgb);

			if (_hsv[1] == 0.0 || _hsv[2] == 0.0) {
				_hsv[0] = hue == NONE ? hsva[0] : hue;
				_hsv[1] = sat == NONE ? hsva[1] : sat;
			}

			if (axis == H) {
				_hsv[0] = t;
				hue = t;
			} else if (axis == S) {
				_hsv[1] = t;
				sat = t;
			} else if (axis == V) {
				_hsv[2] = t;
			}

			outColor.rgb = hsv2rgb(_hsv);
		}
	}


	

	gl_FragColor = outColor;
}