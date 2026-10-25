"""Face shape recipes for the Rain-derived teacher, shared by rain_export.py and render_teacher.py.

Each shape is a list of (control bone, channel, axis, value) posed together on Rain's own face controls.
Values come from the control limits measured by rain_face_probe.py (design/character/rig/face-probe.json).
Names follow Apple ARKit blendshape naming so audio/viseme tools can address them.
"""
from mathutils import Euler


def _lr(name_l, name_r, recipe):
    out = {}
    for name, side in ((name_l, 'L'), (name_r, 'R')):
        out[name] = [(bone.replace('{S}', side), ch, ax, val) for bone, ch, ax, val in recipe]
    return out


FACE_SHAPES = {}
FACE_SHAPES.update(_lr('eyeBlinkLeft', 'eyeBlinkRight', [('ACT-Eyelid_Upper.{S}', 'loc', 1, -0.040), ('ACT-Eyelid_Lower.{S}', 'loc', 1, 0.004)]))
FACE_SHAPES.update(_lr('eyeWideLeft', 'eyeWideRight', [('ACT-Eyelid_Upper.{S}', 'loc', 1, 0.016)]))
FACE_SHAPES.update(_lr('eyeSquintLeft', 'eyeSquintRight', [('ACT-Eyelid_Lower.{S}', 'loc', 1, 0.012), ('ACT-Eyering_Lower.{S}', 'loc', 1, 0.0055)]))
FACE_SHAPES.update(_lr('browDownLeft', 'browDownRight', [('MSTR-Eyebrow.{S}', 'loc', 1, -0.0085)]))
FACE_SHAPES.update(_lr('browOuterUpLeft', 'browOuterUpRight', [('MSTR-Eyebrow.{S}', 'loc', 1, 0.004), ('MSTR-Eyebrow.{S}', 'rot', 2, 0.22)]))
FACE_SHAPES.update(_lr('browInnerUpLeft', 'browInnerUpRight', [('MSTR-Eyebrow.{S}', 'loc', 1, 0.006), ('MSTR-Eyebrow.{S}', 'rot', 2, -0.22)]))
FACE_SHAPES.update(_lr('mouthSmileLeft', 'mouthSmileRight', [('ACT-Lips_Corner.{S}', 'loc', 1, 0.026), ('ACT-Lips_Corner.{S}', 'loc', 2, 0.012), ('ACT-Cheek_Outer.{S}', 'loc', 1, 0.022)]))
FACE_SHAPES.update(_lr('mouthFrownLeft', 'mouthFrownRight', [('ACT-Lips_Corner.{S}', 'loc', 1, -0.016)]))
FACE_SHAPES.update(_lr('mouthStretchLeft', 'mouthStretchRight', [('ACT-Lips_Corner.{S}', 'loc', 2, 0.04)]))
FACE_SHAPES.update(_lr('cheekSquintLeft', 'cheekSquintRight', [('ACT-Eyering_Lower.{S}', 'loc', 1, 0.0078), ('ACT-Cheek_Outer.{S}', 'loc', 1, 0.03)]))
FACE_SHAPES.update(_lr('noseSneerLeft', 'noseSneerRight', [('ACT-Sneer.{S}', 'loc', 1, 0.02), ('ACT-Cheek_Inner.{S}', 'loc', 1, 0.012)]))
FACE_SHAPES.update({
    'jawOpen': [('MSTR-Jaw', 'rot', 0, 0.40)],
    'mouthUpperUp': [('MSTR-UpperLip', 'loc', 1, 0.0085)],
    'mouthLowerDown': [('MSTR-LowerLip', 'loc', 1, -0.0085)],
    'mouthPucker': [('ACT-Lips_Corner.L', 'loc', 2, -0.015), ('ACT-Lips_Corner.R', 'loc', 2, -0.015), ('MSTR-Mouth', 'loc', 2, -0.006)],
    'mouthFunnel': [('ACT-Lips_Corner.L', 'loc', 2, -0.012), ('ACT-Lips_Corner.R', 'loc', 2, -0.012), ('MSTR-Jaw', 'rot', 0, 0.10),
                    ('ACT-Lip_Roll_Upper', 'rot', 0, -0.6), ('ACT-Lip_Roll_Lower', 'rot', 0, -0.6)],
    'mouthRollUpper': [('ACT-Lip_Roll_Upper', 'rot', 0, 1.0)],
    'mouthRollLower': [('ACT-Lip_Roll_Lower', 'rot', 0, 1.0)],
    'mouthPress': [('ACT-Lip_Roll_Upper', 'rot', 0, 0.35), ('ACT-Lip_Roll_Lower', 'rot', 0, 0.35), ('MSTR-Jaw', 'rot', 0, -0.05)],
    'cheekPuff': [('SK-Cheek_Puff.L', 'loc', 1, 0.02), ('SK-Cheek_Puff.R', 'loc', 1, 0.02)],
})

# Composite expressions used for review renders and as the runtime's expression presets (weights per shape).
EXPRESSIONS = {
    'neutral': {'mouthSmileLeft': 0.32, 'mouthSmileRight': 0.32, 'cheekSquintLeft': 0.12, 'cheekSquintRight': 0.12,
                'eyeBlinkLeft': 0.1, 'eyeBlinkRight': 0.1, 'browInnerUpLeft': 0.06, 'browInnerUpRight': 0.06},
    'encouraging': {'mouthSmileLeft': 0.85, 'mouthSmileRight': 0.85, 'mouthUpperUp': 0.45, 'mouthLowerDown': 0.25, 'jawOpen': 0.08,
                    'cheekSquintLeft': 0.35, 'cheekSquintRight': 0.35, 'browOuterUpLeft': 0.15, 'browOuterUpRight': 0.15},
    'curious': {'browInnerUpLeft': 0.35, 'browInnerUpRight': 0.2, 'browOuterUpLeft': 0.45, 'mouthSmileLeft': 0.25, 'mouthSmileRight': 0.15,
                'eyeWideLeft': 0.2, 'eyeWideRight': 0.15},
    'focused': {'browDownLeft': 0.3, 'browDownRight': 0.3, 'eyeSquintLeft': 0.25, 'eyeSquintRight': 0.25, 'mouthPress': 0.3},
}


def reset_pose(rig):
    for pb in rig.pose.bones:
        pb.location = (0, 0, 0)
        pb.scale = (1, 1, 1)
        if pb.rotation_mode == 'QUATERNION':
            pb.rotation_quaternion = (1, 0, 0, 0)
        elif pb.rotation_mode == 'AXIS_ANGLE':
            pb.rotation_axis_angle = (0, 0, 1, 0)
        else:
            pb.rotation_euler = (0, 0, 0)


def apply_recipe(rig, recipe, weight=1.0):
    for bone, channel, axis, value in recipe:
        pb = rig.pose.bones[bone]
        if channel == 'loc':
            loc = list(pb.location)
            loc[axis] += value * weight
            pb.location = loc
        else:
            e = Euler((0, 0, 0), 'XYZ')
            e[axis] = value * weight
            if pb.rotation_mode == 'QUATERNION':
                pb.rotation_quaternion = pb.rotation_quaternion @ e.to_quaternion()
            elif pb.rotation_mode == 'AXIS_ANGLE':
                q = e.to_quaternion()
                ax, ang = q.to_axis_angle()
                pb.rotation_axis_angle = (ang, *ax)
            else:
                r = pb.rotation_euler.copy()
                r[axis] += value * weight
                pb.rotation_euler = r


def apply_expression(rig, name):
    for shape, weight in EXPRESSIONS[name].items():
        apply_recipe(rig, FACE_SHAPES[shape], weight)
