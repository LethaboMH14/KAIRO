"""Checks the authored clips in the raw GLB: hinge joints stay hinges, and no joint flails.

  python design/character/blender/clip_check.py <kairo-teacher.raw.glb> <report.json>

For each clip and arm or leg joint it reports the largest twist about the bone's own axis (relative to rest), the
largest rotation between consecutive samples, and the total rotation travelled against the net change. Exits 1 if
an elbow or knee twists more than 10 degrees about its own axis in any clip: an elbow cannot do that, and the skin
then visibly turns the wrong way.
"""
import json
import math
import struct
import sys

HINGES = {'lowerarm_l': 'hand_l', 'lowerarm_r': 'hand_r', 'calf_l': 'foot_l', 'calf_r': 'foot_r'}
WATCH = ('clavicle', 'upperarm', 'lowerarm', 'hand', 'thigh', 'calf', 'foot')
MAX_HINGE_TWIST = 10.0


def load(path):
    data = open(path, 'rb').read()
    length = struct.unpack_from('<I', data, 12)[0]
    gltf = json.loads(data[20:20 + length])
    base = 20 + length + 8

    def accessor(i):
        a = gltf['accessors'][i]
        view = gltf['bufferViews'][a['bufferView']]
        n = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4}[a['type']]
        start = base + view.get('byteOffset', 0) + a.get('byteOffset', 0)
        stride = view.get('byteStride', 0) or 4 * n
        return [struct.unpack_from('<' + 'f' * n, data, start + k * stride) for k in range(a['count'])]
    return gltf, accessor


def mul(a, b):
    ax, ay, az, aw = a
    bx, by, bz, bw = b
    return (aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx,
            aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz)


def inverse(q):
    return (-q[0], -q[1], -q[2], q[3])


def angle(q):
    return math.degrees(2 * math.acos(min(1.0, abs(q[3]))))


def twist_about(q, axis):
    d = q[0] * axis[0] + q[1] * axis[1] + q[2] * axis[2]
    t = (axis[0] * d, axis[1] * d, axis[2] * d, q[3])
    n = math.sqrt(sum(c * c for c in t))
    return 180.0 if n < 1e-9 else angle(tuple(c / n for c in t))


def main():
    gltf, accessor = load(sys.argv[1])
    nodes = gltf['nodes']
    index = {n.get('name'): i for i, n in enumerate(nodes)}
    rest = {i: tuple(n.get('rotation', (0, 0, 0, 1))) for i, n in enumerate(nodes)}
    axes = {}
    for hinge, child in HINGES.items():
        t = nodes[index[child]].get('translation', (0, 1, 0))
        n = math.sqrt(sum(c * c for c in t))
        axes[index[hinge]] = tuple(c / n for c in t)
    report, failures = {}, []
    for anim in gltf['animations']:
        clip = {}
        for ch in anim['channels']:
            node = ch['target']['node']
            name = nodes[node].get('name', '')
            if ch['target']['path'] != 'rotation' or not name.startswith(WATCH):
                continue
            values = accessor(anim['samplers'][ch['sampler']]['output'])
            steps = [angle(mul(inverse(a), b)) for a, b in zip(values, values[1:])]
            entry = {'maxStepDeg': round(max(steps, default=0.0), 2), 'pathDeg': round(sum(steps), 1),
                     'netDeg': round(max(angle(mul(inverse(values[0]), v)) for v in values), 1)}
            if node in axes:
                twist = max(twist_about(mul(inverse(rest[node]), v), axes[node]) for v in values)
                entry['hingeTwistDeg'] = round(twist, 1)
                if twist > MAX_HINGE_TWIST:
                    failures.append(f"{anim['name']} {name} twists {twist:.1f} deg about its own axis")
            clip[name] = entry
        report[anim['name']] = clip
    with open(sys.argv[2], 'w', encoding='utf8') as f:
        json.dump({'maxHingeTwistDeg': MAX_HINGE_TWIST, 'clips': report, 'failures': failures, 'pass': not failures}, f, indent=1)
    for name, clip in report.items():
        hinges = {b: e['hingeTwistDeg'] for b, e in clip.items() if 'hingeTwistDeg' in e}
        worst = max(clip.items(), key=lambda kv: kv[1]['pathDeg'], default=(None, None))
        print(f"{name}: hinge twist {hinges}; most travel {worst[0]} {worst[1]['pathDeg'] if worst[1] else 0} deg for {worst[1]['netDeg'] if worst[1] else 0} net")
    for line in failures:
        print('FAIL', line)
    print('CLIP_CHECK', 'FAIL' if failures else 'PASS')
    sys.exit(1 if failures else 0)


main()
