"""KAIRO-authored teaching clips for the exported teacher skeleton (no third-party motion data).

Poses are written as rotations about the armature's rest axes, applied in each bone's own rest frame:
  X = the character's left, Y = backwards (she faces -Y), Z = up.
  (X, +a) bends the spine/head forward and twists a T-pose arm inward; (Y, +a) lowers the left arm / curls left
  fingers toward the palm; (Z, -a) flexes the left elbow forward. Right-side values are mirrored automatically
  (Y and Z angles negate, X angles keep their sign).
Children inherit their parents, so a pose reads like FK animation. Keys use Blender's Bezier easing.
"""
import math

import bpy
from mathutils import Matrix, Quaternion

FPS = 30


def q(axis, degrees):
    return Quaternion({'X': (1, 0, 0), 'Y': (0, 1, 0), 'Z': (0, 0, 1)}[axis], math.radians(degrees))


def mirror(spec):
    return [(a, d if a in ('X', 'T') else -d) for a, d in spec]


def symmetric(left):
    """Expands a left-side pose dict (bone names ending _l) to both sides."""
    out = {}
    for bone, spec in left.items():
        out[bone] = spec
        if bone.endswith('_l'):
            out[bone[:-2] + '_r'] = mirror(spec)
    return out


def fingers(curl, spread=0.0, thumb=None):
    """Relaxed finger curl per joint (degrees), more toward the pinky."""
    pose = {}
    for i, name in enumerate(('index', 'middle', 'ring', 'pinky')):
        extra = i * 4
        pose[f'{name}_01_l'] = [('Y', curl + extra), ('Z', spread * (i - 1.5))]
        pose[f'{name}_02_l'] = [('Y', curl * 1.25 + extra)]
        pose[f'{name}_03_l'] = [('Y', curl * 0.9 + extra * 0.5)]
    pose['thumb_01_l'] = thumb or [('Z', -8), ('X', 6)]
    pose['thumb_02_l'] = [('Y', curl * 0.5)]
    pose['thumb_03_l'] = [('Y', curl * 0.6)]
    return pose


def merge(*poses):
    out = {}
    for pose in poses:
        for bone, spec in pose.items():
            out[bone] = out.get(bone, []) + list(spec)
    return out


# ------------------------------------------------------------------------------------------- key poses
REST_ARMS = {
    'clavicle_l': [('Y', 3)],
    'upperarm_l': [('X', 12), ('Y', 70), ('X', -9)],     # hands clear of the trouser hips
    'lowerarm_l': [('Z', -16)],
    'hand_l': [('Z', -6), ('Y', 6)],
}
REST = merge(
    {'spine_01': [('X', 1.5)], 'spine_02': [('X', 1.0)], 'spine_03': [('X', -1.5)], 'neck_01': [('X', -1.5)], 'head': [('X', 2.5)]},
    symmetric(merge(REST_ARMS, fingers(10, 2))),
)

# Attentive listening: a slight lean toward the learner, head tilt, hands relaxed a little forward (no hand contact,
# so fingers never interpenetrate).
LISTEN = merge(
    {'spine_01': [('X', 2.5)], 'spine_02': [('X', 2.5)], 'spine_03': [('X', 1.0)], 'neck_01': [('X', 2.0)],
     'head': [('X', 3.0), ('Y', 6.0)]},
    symmetric(merge({
        'clavicle_l': [('Y', 2)],
        'upperarm_l': [('X', 22), ('Y', 70), ('X', -24)],   # elbows forward so the hands float clear of the waist
        'lowerarm_l': [('Z', -52)],
        'hand_l': [('Y', 6), ('Z', -14)],
    }, fingers(18, 1))),
)

# Open-palm explaining. The elbow is a hinge (Z only): swinging the bent forearm outward is the upper arm turning in
# the shoulder ('T'), not a rotation at the elbow, which twisted the elbow skin by 31 degrees (147 on the beats).
EXPLAIN = merge(
    {'spine_01': [('X', 1.0)], 'spine_02': [('X', 1.5)], 'spine_03': [('X', -1.0)], 'neck_01': [('X', -1.0)], 'head': [('X', 1.0)]},
    symmetric(merge({
        'clavicle_l': [('Y', -1)],
        'upperarm_l': [('T', -38), ('X', -12), ('Y', 62), ('X', -20)],
        'lowerarm_l': [('Z', -72)],
        'hand_l': [('Y', -10), ('X', -12)],
    }, fingers(6, 6, [('Z', -18), ('X', -10)]))),
)

# Beat emphasis: replaces the arm specs above on alternate keys (a slightly higher, wider open-palm lift).
EXPLAIN_BEAT = symmetric({
    'upperarm_l': [('T', -44), ('X', -12), ('Y', 58), ('X', -24)],
    'lowerarm_l': [('Z', -80)],
    'hand_l': [('Y', -14), ('X', -16)],
})

POINT_HAND = {}
for bone, spec in fingers(0).items():
    POINT_HAND[bone] = spec
for name in ('middle', 'ring', 'pinky'):
    POINT_HAND[f'{name}_01_l'] = [('Y', 78)]
    POINT_HAND[f'{name}_02_l'] = [('Y', 92)]
    POINT_HAND[f'{name}_03_l'] = [('Y', 55)]
POINT_HAND['index_01_l'] = [('Y', 2)]
POINT_HAND['index_02_l'] = [('Y', 4)]
POINT_HAND['index_03_l'] = [('Y', 3)]
POINT_HAND['thumb_01_l'] = [('Z', -22), ('X', 22)]
POINT_HAND['thumb_02_l'] = [('Y', 30)]
POINT_HAND['thumb_03_l'] = [('Y', 35)]


def breathing(t, period=4.0, amount=1.0):
    s = math.sin(2 * math.pi * t / period)
    return {'spine_02': [('X', -0.7 * s * amount)], 'spine_03': [('X', -0.5 * s * amount)],
            'clavicle_l': [('Y', -0.6 * s * amount)], 'clavicle_r': [('Y', 0.6 * s * amount)], 'neck_01': [('X', 0.4 * s * amount)]}


# ------------------------------------------------------------------------------------------- clips
def clip_idle():
    keys = []
    for t in (0, 1, 2, 3, 4, 5, 6, 7, 8):
        sway = math.sin(2 * math.pi * t / 8)
        keys.append((t, merge(REST, breathing(t), {
            'spine_01': [('Y', 0.8 * sway)], 'spine_02': [('Y', -0.4 * sway), ('Z', 1.2 * sway)],
            'head': [('Z', -2.0 * sway), ('Y', 0.8 * sway)],
            'upperarm_l': [('Y', 0.8 * sway)], 'upperarm_r': [('Y', 0.8 * sway)],
        })))
    return 'Idle', keys, True


def clip_listen():
    keys = []
    for t in (0, 0.75, 1.5, 2.25, 3, 3.75, 4.5, 5.25, 6):
        nod = 3.5 if t in (1.5, 4.5) else 0.0
        keys.append((t, merge(LISTEN, breathing(t, 3.0, 0.8), {'head': [('X', nod)]})))
    return 'Listen', keys, True


def clip_explain():
    keys = []
    for i, t in enumerate((0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0)):
        pose = {**EXPLAIN, **EXPLAIN_BEAT} if i % 2 == 1 else EXPLAIN
        twist = math.sin(2 * math.pi * t / 4.0)
        keys.append((t, merge(pose, breathing(t, 4.0, 0.6), {
            'spine_02': [('Z', 2.5 * twist)], 'head': [('Z', -1.5 * twist), ('X', 1.5 if i % 2 else 0.0)],
        })))
    return 'Explain', keys, True


def clip_acknowledge():
    nod = lambda a: {'head': [('X', a)], 'neck_01': [('X', a * 0.35)]}
    open_hand = symmetric({'upperarm_l': [('X', -6), ('T', -20)], 'lowerarm_l': [('Z', -30)], 'hand_l': [('Y', -8)]})
    keys = [
        (0.0, REST),
        (0.35, merge(REST, nod(6), {'spine_02': [('X', 1.5)]})),
        (0.6, merge(REST, nod(10), open_hand)),
        (0.95, merge(REST, nod(-2), open_hand)),
        (1.3, merge(REST, nod(4))),
        (1.7, REST),
    ]
    return 'Acknowledge', keys, False


FINGER_BONES = {f'{n}_{j}_{s}' for n in ('index', 'middle', 'ring', 'pinky') for j in ('01', '02', '03') for s in ('l', 'r')} |     {f'thumb_{j}_{s}' for j in ('01', '02', '03') for s in ('l', 'r')}


def clip_hand_point():
    """Finger-only clip: the runtime layers it over the IK arm when pointing."""
    pose = symmetric(POINT_HAND)
    return 'HandPoint', [(0.0, pose), (0.5, pose)], False, FINGER_BONES


CLIPS = [clip_idle, clip_listen, clip_explain, clip_acknowledge, clip_hand_point]


# ------------------------------------------------------------------------------------------- authoring
def compose(spec):
    """Rotations about the rest axes, applied in order; ('T', deg) twists the limb about its own rest axis (X, the
    T-pose arm) before all of them, so it turns the whole limb below that joint instead of tilting it."""
    result = Quaternion()
    twist = 0.0
    for axis, degrees in spec:
        if axis == 'T':
            twist += degrees
        else:
            result = q(axis, degrees) @ result
    return result @ q('X', twist)


def apply_pose(arm, pose):
    for pb in arm.pose.bones:
        pb.rotation_mode = 'QUATERNION'
        rest = pb.bone.matrix_local.to_quaternion()
        delta = compose(pose.get(pb.name, []))
        pb.rotation_quaternion = rest.inverted() @ delta @ rest
        pb.location = (0, 0, 0)
        pb.scale = (1, 1, 1)


def author_clips(arm, only=None):
    """Creates one action per clip on the armature and stashes each on an NLA track for glTF export."""
    made = []
    arm.animation_data_create()
    for build in CLIPS:
        name, keys, loop, *rest = build()
        only_bones = rest[0] if rest else None
        if only and name not in only:
            continue
        action = bpy.data.actions.new(name)
        arm.animation_data.action = action
        last = 0
        for t, pose in keys:
            frame = round(t * FPS)
            apply_pose(arm, pose)
            for pb in arm.pose.bones:
                if only_bones and pb.name not in only_bones:
                    continue
                pb.keyframe_insert('rotation_quaternion', frame=frame, group=pb.name)
            last = frame
        action.use_frame_range = True
        action.frame_start, action.frame_end = 0, last
        action['kairo_loop'] = loop
        track = arm.animation_data.nla_tracks.new()
        track.name = name
        track.strips.new(name, 0, action)
        track.mute = True
        made.append({'name': name, 'seconds': last / FPS, 'loop': loop, 'keys': len(keys)})
    arm.animation_data.action = None
    apply_pose(arm, REST)
    return made
