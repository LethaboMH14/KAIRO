import * as THREE from 'three';
import type { Phase } from './fieldMath';

// Runtime materials, matched to the GLB by material name. The exported glTF
// values are only fallbacks for other viewers.

type Pattern = 'lamination' | 'hatch';
type Spec = { color: string; metalness: number; roughness: number; clearcoat?: number; clearcoatRoughness?: number; pattern?: Pattern };

const SPECS: Record<string, Spec> = {
  'paint-graphite': { color: '#33494f', metalness: 0.2, roughness: 0.46, clearcoat: 0.35, clearcoatRoughness: 0.35 },
  'steel-lamination': { color: '#848d90', metalness: 0.85, roughness: 0.36, pattern: 'lamination' },
  'copper-winding': { color: '#b7794f', metalness: 1, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2 },
  insulation: { color: '#e4dbc2', metalness: 0, roughness: 0.68 },
  'aluminium-cast': { color: '#c4c9cc', metalness: 1, roughness: 0.42 },
  'steel-shaft': { color: '#d3d7da', metalness: 1, roughness: 0.2 },
  'steel-dark': { color: '#8c9398', metalness: 1, roughness: 0.34 },
  'steel-bearing': { color: '#e2e5e7', metalness: 1, roughness: 0.12 },
  'polymer-fan': { color: '#2c3539', metalness: 0, roughness: 0.52 },
  'polymer-black': { color: '#202628', metalness: 0, roughness: 0.58 },
  brass: { color: '#c39c5c', metalness: 1, roughness: 0.3 },
  'section-cut': { color: '#e8e9e4', metalness: 0, roughness: 0.62, pattern: 'hatch' },
};

export const SELECTION_COLOUR = '#75baa6';
// Checked with the dataviz palette validator (all pairs, light surface): passes;
// the U/V tritan pair needs direct labels, which every view provides.
export const PHASE_COLOURS: Record<Phase, string> = { U: '#e0702f', V: '#1fa57a', W: '#2f7fd0' };

// Laminations: fine dark lines across the shaft axis, fading out before they alias.
const LAMINATION = /* glsl */ `
  {
    float lam = vKairoObject.x / 0.0012;
    float width = fwidth(lam);
    float edge = 0.5 - abs(fract(lam) - 0.5);
    float line = 1.0 - smoothstep(0.07, 0.07 + 1.5 * width, edge);
    line *= 1.0 - smoothstep(0.18, 0.45, width);
    diffuseColor.rgb *= 1.0 - 0.38 * line;
  }`;

// Section faces: 45 degree drafting hatch on the cut planes.
const HATCH = /* glsl */ `
  {
    float h = (vKairoObject.x + vKairoObject.y + vKairoObject.z) / 0.0045;
    float width = fwidth(h);
    float edge = 0.5 - abs(fract(h) - 0.5);
    float line = 1.0 - smoothstep(0.09, 0.09 + 1.5 * width, edge);
    line *= 1.0 - smoothstep(0.25, 0.55, width);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.13, 0.2, 0.23), 0.6 * line);
  }`;

function applyPattern(material: THREE.MeshPhysicalMaterial, pattern: Pattern) {
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vKairoObject;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvKairoObject = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vKairoObject;')
      .replace('#include <color_fragment>', `#include <color_fragment>\n${pattern === 'lamination' ? LAMINATION : HATCH}`);
  };
  material.customProgramCacheKey = () => `kairo-${pattern}`;
}

function build(name: string, highlighted: boolean): THREE.MeshPhysicalMaterial {
  const spec = SPECS[name] ?? SPECS['paint-graphite'];
  const material = new THREE.MeshPhysicalMaterial({
    name,
    color: spec.color,
    metalness: spec.metalness,
    roughness: spec.roughness,
    clearcoat: spec.clearcoat ?? 0,
    clearcoatRoughness: spec.clearcoatRoughness ?? 0,
    emissive: highlighted ? SELECTION_COLOUR : '#000000',
    emissiveIntensity: highlighted ? 0.2 : 0,
  });
  if (spec.pattern) applyPattern(material, spec.pattern);
  return material;
}

/**
 * Selection outline: an inverted hull pushed out by a fixed number of drawing-buffer
 * pixels. drei 10.7's Outlines swaps its screen-space and world-space branches, so the
 * studio keeps this explicit version instead of depending on that behaviour.
 */
export function createOutlineMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(SELECTION_COLOUR) },
      thickness: { value: 2.5 },
      size: { value: new THREE.Vector2(1, 1) },
    },
    vertexShader: /* glsl */ `
      uniform float thickness;
      uniform vec2 size;
      void main() {
        vec4 clipPosition = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vec2 clipNormal = (projectionMatrix * modelViewMatrix * vec4(normal, 0.0)).xy;
        float length2 = dot(clipNormal, clipNormal);
        vec2 direction = length2 > 1e-10 ? clipNormal * inversesqrt(length2) : vec2(0.0);
        clipPosition.xy += direction * thickness / size * clipPosition.w * 2.0;
        gl_Position = clipPosition;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 color;
      void main() {
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide,
    toneMapped: false,
  });
}

export type MotorMaterials = {
  get(name: string, highlighted: boolean, phase?: Phase): THREE.MeshPhysicalMaterial;
  /** Copper materials per phase, so the operating view can tint each phase by its current. */
  phase: Record<Phase, { base: THREE.MeshPhysicalMaterial; highlighted: THREE.MeshPhysicalMaterial }>;
  dispose(): void;
};

export function createMotorMaterials(): MotorMaterials {
  const cache = new Map<string, THREE.MeshPhysicalMaterial>();
  const phase = {} as MotorMaterials['phase'];
  for (const p of ['U', 'V', 'W'] as const) {
    phase[p] = { base: build('copper-winding', false), highlighted: build('copper-winding', true) };
  }
  return {
    get(name, highlighted, p) {
      if (p && name === 'copper-winding') return highlighted ? phase[p].highlighted : phase[p].base;
      const key = `${name}|${highlighted}`;
      let material = cache.get(key);
      if (!material) {
        material = build(name, highlighted);
        cache.set(key, material);
      }
      return material;
    },
    phase,
    dispose() {
      cache.forEach(material => material.dispose());
      for (const p of Object.values(phase)) {
        p.base.dispose();
        p.highlighted.dispose();
      }
    },
  };
}

/** Sets each phase's copper glow from its idealised current; zero restores plain copper. */
export function tintPhases(materials: MotorMaterials, currents: Record<Phase, number> | null) {
  for (const p of ['U', 'V', 'W'] as const) {
    const level = currents ? Math.abs(currents[p]) : 0;
    for (const [material, highlighted] of [[materials.phase[p].base, false], [materials.phase[p].highlighted, true]] as const) {
      if (currents) {
        material.emissive.set(PHASE_COLOURS[p]);
        material.emissiveIntensity = 0.55 * level;
      } else {
        material.emissive.set(highlighted ? SELECTION_COLOUR : '#000000');
        material.emissiveIntensity = highlighted ? 0.2 : 0;
      }
    }
  }
}
