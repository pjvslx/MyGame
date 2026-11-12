"""Author the approved mining skin as native Creator 3.8.8 scene objects."""

from __future__ import annotations

import base64
import copy
import json
import subprocess
import uuid
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT / 'Cocos'
ASSETS = PROJECT / 'assets'
TEXTURES = ASSETS / 'diamond/res/texture/deep-mining'
BASE_COMMIT = '9255fd7'
NAMESPACE = uuid.UUID('36af5d18-6351-43bf-8c9c-136e0756dc76')
SCALE = 8 / 9
BOARD_Y = 20


def stable_id(name: str) -> str:
    return base64.b64encode(uuid.uuid5(NAMESPACE, name).bytes).decode().rstrip('=')


def baseline(relative: str) -> list[dict]:
    content = subprocess.check_output(
        ['git', 'show', f'{BASE_COMMIT}:Cocos/{relative}'], cwd=ROOT
    )
    return json.loads(content)


def write_json(path: Path, content) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(content, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def sprite_ref(name: str) -> dict:
    meta = json.loads((TEXTURES / f'{name}.png.meta').read_text(encoding='utf-8'))
    return {'__uuid__': meta['subMetas']['f9941']['uuid']}


def script_type(name: str, folder='diamond/src') -> str:
    meta = json.loads((ASSETS / f'{folder}/{name}.ts.meta').read_text(encoding='utf-8'))
    value = meta['uuid'].replace('-', '')
    alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    tail = ''.join(
        alphabet[int(value[i:i + 3], 16) >> 6]
        + alphabet[int(value[i:i + 3], 16) & 63]
        for i in range(5, 32, 3)
    )
    return value[:5] + tail


def ref(index: int) -> dict:
    return {'__id__': index}


def vec(x=0, y=0, z=0) -> dict:
    return {'__type__': 'cc.Vec3', 'x': x, 'y': y, 'z': z}


def color(r=255, g=255, b=255, a=255) -> dict:
    return {'__type__': 'cc.Color', 'r': r, 'g': g, 'b': b, 'a': a}


def remap(value, mapping):
    if isinstance(value, list):
        return [remap(item, mapping) for item in value]
    if isinstance(value, dict):
        if set(value) == {'__id__'}:
            return ref(mapping[value['__id__']])
        return {key: remap(item, mapping) for key, item in value.items()}
    return value


def compact(data: list[dict]) -> list[dict]:
    found = set()

    def visit(value):
        if isinstance(value, list):
            for item in value:
                visit(item)
        elif isinstance(value, dict):
            if set(value) == {'__id__'}:
                index = value['__id__']
                if index not in found:
                    found.add(index)
                    visit(data[index])
            else:
                for item in value.values():
                    visit(item)

    found.add(0)
    visit(data[0])
    order = sorted(found)
    mapping = {old: new for new, old in enumerate(order)}
    return [remap(data[index], mapping) for index in order]


class Document:
    def __init__(self, data: list[dict]):
        self.data = data
        self.node_template = copy.deepcopy(data[11])
        self.transform_template = copy.deepcopy(data[13])
        self.sprite_template = copy.deepcopy(data[8])
        self.label_template = copy.deepcopy(data[142])
        self.opacity_template = copy.deepcopy(data[227])
        self.mask_template = copy.deepcopy(data[59])

    def component(self, node: int, template: dict, suffix: str) -> int:
        item = copy.deepcopy(template)
        item['node'] = ref(node)
        item['_id'] = stable_id(self.data[node]['_name'] + '/' + suffix)
        item['__prefab'] = None
        index = len(self.data)
        self.data.append(item)
        self.data[node]['_components'].append(ref(index))
        return index

    def node(self, name: str, parent: int, x=0, y=0, width=0, height=0) -> int:
        item = copy.deepcopy(self.node_template)
        item.update(_name=name, _parent=ref(parent), _children=[], _components=[],
                    _prefab=None, _active=True, _lpos=vec(x, y), _lscale=vec(1, 1, 1),
                    _id=stable_id(name))
        index = len(self.data)
        self.data.append(item)
        self.data[parent]['_children'].append(ref(index))
        transform = copy.deepcopy(self.transform_template)
        transform['_contentSize'] = {'__type__': 'cc.Size', 'width': width, 'height': height}
        self.component(index, transform, 'Transform')
        return index

    def sprite(self, name, parent, texture, x=0, y=0, width=0, height=0, sliced=False):
        node = self.node(name, parent, x, y, width, height)
        template = copy.deepcopy(self.sprite_template)
        template.update(_spriteFrame=sprite_ref(texture), _customMaterial=None,
                        _type=1 if sliced else 0, _sizeMode=0)
        self.component(node, template, 'Sprite')
        return node

    def label(self, name, parent, text, x=0, y=0, width=100, height=40, size=26):
        node = self.node(name, parent, x, y, width, height)
        template = copy.deepcopy(self.label_template)
        template.update(_string=text, _customMaterial=None, _color=color(248, 235, 204),
                        _fontSize=size, _lineHeight=size + 4, _isBold=True,
                        _overflow=2, _enableWrapText=False)
        component = self.component(node, template, 'Label')
        return node, component

    def mask(self, name, parent, x, y, width, height):
        node = self.node(name, parent, x, y, width, height)
        self.component(node, self.mask_template, 'Mask')
        return node

    def opacity(self, node, value):
        template = copy.deepcopy(self.opacity_template)
        template['_opacity'] = value
        self.component(node, template, 'Opacity')

    def reparent(self, node, parent, x=0, y=0):
        previous = self.data[node].get('_parent')
        if previous:
            self.data[previous['__id__']]['_children'].remove(ref(node))
        self.data[parent]['_children'].append(ref(node))
        self.data[node]['_parent'] = ref(parent)
        self.data[node]['_lpos'] = vec(x, y)
        self.data[node]['_lscale'] = vec(1, 1, 1)

    def instance(self, prefab, parent, name, x, y):
        start = len(self.data)
        mapping = {i: start + i for i in range(len(prefab))}
        items = remap(copy.deepcopy(prefab), mapping)
        for i, item in enumerate(items):
            if '_prefab' in item:
                item['_prefab'] = None
            if '__prefab' in item:
                item['__prefab'] = None
            if '_id' in item:
                item['_id'] = stable_id(name + '/' + str(i))
        root = items[1]
        root.update(_name=name, _parent=ref(parent), _lpos=vec(x, y), _active=True)
        self.data.extend(items)
        self.data[parent]['_children'].append(ref(mapping[1]))
        return mapping


def reskin_prefabs():
    gem = baseline('assets/diamond/res/prefab/diamond.prefab')
    gem[11]['_spriteFrame'] = sprite_ref('gem-green')
    gem[21]['_spriteFrame'] = sprite_ref('gem-green')
    gem[11]['_sizeMode'] = 0
    gem[21]['_sizeMode'] = 0
    gem[20]['_active'] = False
    write_json(ASSETS / 'diamond/res/prefab/diamond.prefab', gem)

    soil = baseline('assets/diamond/res/prefab/stone.prefab')
    soil[3].update(_spriteFrame=sprite_ref('soil-base-01'), _customMaterial=None, _sizeMode=0)
    for i in [11, 19, 27]:
        soil[i]['_enabled'] = False
    soil[35]['_sizeMode'] = 0
    soil[43]['_sizeMode'] = 0
    soil[47]['_contentSize'].update(width=64, height=64)
    soil[50]['stoneSpriteFrameList'] = [sprite_ref(f'soil-hard-0{i}') for i in range(1, 5)]
    soil[50]['goldSpriteFrameList'] = [sprite_ref('ore-copper')] * 3 + [sprite_ref('ore-cyan')] * 5
    template_scene = baseline('assets/diamond/res/scene/diamond.scene')
    doc = Document(template_scene)
    # Use the current prefab as the document while retaining native component templates.
    doc.data = soil
    outline = doc.sprite('TargetOutline', 1, 'target-outline', width=90, height=90, sliced=True)
    soil[outline]['_active'] = False
    soil[50]['targetOutline'] = ref(outline)
    write_json(ASSETS / 'diamond/res/prefab/stone.prefab', soil)
    return gem, soil


def reskin_init():
    path = ASSETS / 'diamond/res/scene/init.scene'
    data = baseline('assets/diamond/res/scene/init.scene')
    component = next(item for item in data if 'diamondIconFrame' in item)
    names = ['green', 'red', 'blue', 'yellow', 'purple']
    component['diamondIconFrame'] = [sprite_ref('gem-' + name) for name in names]
    for i, name in enumerate(names, 1):
        component[f'diamondFrameList{i}'] = [sprite_ref('gem-' + name)]
    write_json(path, data)


def build():
    gem_prefab, soil_prefab = reskin_prefabs()
    reskin_init()
    data = baseline('assets/diamond/res/scene/diamond.scene')
    doc = Document(data)
    data[1]['_name'] = 'diamond'
    for node in [7, 14, 190]:
        data[node]['_active'] = False
    data[14]['_name'] = 'LegacyControls'
    layout = doc.node('DeepMiningLayout', 2, width=720, height=1280)
    doc.component(layout, {
        '__type__': script_type('ContentAdapter', 'resolution'), '_name': '', '_objFlags': 0,
        '_enabled': True,
    }, 'ViewportSize')
    backdrop = doc.node('MineBackdrop', layout, width=720, height=1920)
    doc.sprite('ShaftBackdrop', backdrop, 'shaft-backdrop', width=760, height=2400)
    segments = []
    for i, y in enumerate([-960, 0, 960]):
        segment = doc.node(f'WallSegment_{i}', backdrop, y=y, width=720, height=960)
        doc.sprite(f'WallLeft_{i}', segment, 'wall-left', x=-346, width=76, height=960)
        doc.sprite(f'WallRight_{i}', segment, 'wall-right', x=346, width=76, height=960)
        lamp_x = -329 if i % 2 else 329
        glow = doc.sprite(f'LampGlow_{i}', segment, 'lamp-glow', lamp_x, 420, 120, 120)
        doc.opacity(glow, 150)
        doc.sprite(f'Lamp_{i}', segment, 'lamp', lamp_x, 430, 54, 72)
        doc.sprite(f'Crystal_{i}', segment, 'crystal', -lamp_x, -210, 36, 48)
        segments.append(segment)

    board = doc.node('BoardSpace', layout, y=BOARD_Y, width=720, height=720)
    data[board]['_lscale'] = vec(SCALE, SCALE, 1)
    future_viewport = doc.mask('FutureSoilViewport', board, 0, -720, 720, 720)
    future_root = doc.node('FutureSoilRows', future_viewport, width=720, height=1080)
    for row in range(12):
        row_node = doc.node(f'FutureRow_{row:02d}', future_root, y=315 - row * 90, width=720, height=90)
        doc.opacity(row_node, 255)
        for col in range(8):
            tile = doc.sprite(f'FutureSoil_{row:02d}_{col:02d}', row_node,
                              f'soil-base-0{(row + col) % 3 + 1}', -315 + col * 90, 0, 90, 90)
            if (row, col) in [(1, 2), (4, 4), (7, 1), (10, 6)]:
                doc.sprite(f'FutureCopper_{row}_{col}', tile, 'ore-copper', width=56, height=56)
            elif (row, col) in [(2, 5), (6, 3), (9, 6)]:
                doc.sprite(f'FutureCrystal_{row}_{col}', tile, 'ore-cyan', width=56, height=56)
    # A fixed overlay shades depth without baking opacity into each moving tile.
    fade = doc.sprite('DepthShade', future_viewport, 'shaft-backdrop', width=720, height=720)
    doc.opacity(fade, 160)
    viewport = doc.mask('BoardViewport', board, 0, 0, 720, 720)
    bed = doc.sprite('BoardBed', viewport, 'shaft-backdrop', width=720, height=720)
    doc.reparent(11, viewport)
    data[11]['_name'] = 'Cells'
    doc.reparent(198, board)
    data[198]['_name'] = 'CollectEffects'
    data[199]['_lpos'] = vec(220 / SCALE, (550 - BOARD_Y) / SCALE)

    gems = []
    stones = []
    gem_names = ['green', 'red', 'blue', 'yellow', 'purple']
    guide = [
        [1, 2, 5, 3, 4, 1, 2, 5], [1, 4, 2, 3, 5, 5, 2, 4],
        [3, 1, 1, 2, 2, 1, 4, 3], [1, 2, 2, 1, 2, 2, 1, 2],
        [1, 0, 0, 0, 0, 0, 0, 1], [0] * 8, [0] * 8, [0] * 8,
    ]
    for screen_row, values in enumerate(guide):
        row = 7 - screen_row
        for col, value in enumerate(values):
            name = f'{"Gem" if value else "Soil"}_R{row:02d}_C{col:02d}'
            prefab = gem_prefab if value else soil_prefab
            mapping = doc.instance(prefab, 11, name, -315 + col * 90, -315 + row * 90)
            cell = mapping[1]
            if value:
                data[mapping[11]]['_spriteFrame'] = sprite_ref('gem-' + gem_names[value - 1])
                gems.append(cell)
            else:
                outline = data[mapping[50]]['targetOutline']['__id__']
                data[outline]['_active'] = row > 1
                if (row, col) in [(0, 2), (1, 5), (2, 4)]:
                    data[mapping[42]]['_active'] = True
                    data[mapping[43]]['_spriteFrame'] = sprite_ref('ore-copper' if col != 5 else 'ore-cyan')
                stones.append(cell)

    frame = doc.node('ThreeSideFrame', layout, width=720, height=1280)
    top = BOARD_Y + 360 * SCALE
    work_y = BOARD_Y - 180 * SCALE
    doc.sprite('FrameTop', frame, 'frame-top', y=top + 9, width=652, height=18, sliced=True)
    for side, direction in [('left', -1), ('right', 1)]:
        doc.sprite('Frame' + side.title(), frame, 'frame-' + side,
                   direction * 328, (top + work_y) / 2, 14, top - work_y)
        doc.sprite('Corner' + side.title(), frame, 'frame-corner-' + side,
                   direction * 326, top + 7, 56, 34)
        for i, y in enumerate([top - 80, top - 240, top - 400]):
            doc.sprite(f'Anchor{side.title()}_{i}', frame, 'frame-anchor-' + side,
                       direction * 333, y, 28, 22)
    doc.sprite('WorkLine', frame, 'work-line', y=work_y, width=640, height=16)

    hud = doc.node('HUD', layout, y=550, width=560, height=48)
    hud_widget = copy.deepcopy(data[226])
    hud_widget.update(_alignFlags=17, _target=ref(layout), _top=66,
                      _horizontalCenter=0, _originalWidth=560, _originalHeight=48)
    doc.component(hud, hud_widget, 'TopSafeArea')
    doc.sprite('HUDPanel', hud, 'hud-panel', width=560, height=48, sliced=True)
    doc.sprite('DepthIcon', hud, 'hud-depth', x=-249, width=24, height=28)
    doc.sprite('TimerIcon', hud, 'hud-time', x=-63, width=28, height=28)
    doc.sprite('OreIcon', hud, 'hud-ore', x=121, width=34, height=26)
    doc.reparent(49, hud, -181)
    data[49]['_name'] = 'DepthDisplay'
    data[90]['_enabled'] = False
    for child in data[49]['_children']:
        data[child['__id__']]['_active'] = False
    _, depth_label = doc.label('DepthValue', 49, '0 m', width=115, size=26)
    data[91].update(valueLabel=ref(depth_label), geWeiLabelList=[], shiWeiLabelList=[], baiweiLabelList=[])
    doc.reparent(148, hud, 7)
    data[148]['_name'] = 'CountdownDisplay'
    data[161]['_enabled'] = False
    for child in list(data[148]['_children']):
        data[child['__id__']]['_active'] = False
    doc.reparent(154, 148)
    data[154]['_active'] = True
    data[154]['_name'] = 'TimeValue'
    data[155].update(_customMaterial=None, _string='01:30', _fontSize=26, _lineHeight=30,
                     _isBold=True, _overflow=2, _enableWrapText=False, _color=color(248, 235, 204))
    data[157]['_contentSize'].update(width=115, height=40)
    data[162].update(countdownValue=ref(154), progress=None, markBg=None)
    doc.reparent(141, hud, 201)
    data[141]['_name'] = 'ScoreValue'
    data[142].update(_customMaterial=None, _fontSize=26, _lineHeight=30, _isBold=True,
                     _overflow=2, _enableWrapText=False, _color=color(248, 235, 204))
    data[144]['_contentSize'].update(width=115, height=40)
    doc.node('ReservedTopSpace', layout, y=445, width=640, height=140)

    overlay = doc.node('Overlay', layout, width=720, height=1280)
    for node in [172, 180, 184, 218]:
        doc.reparent(node, overlay)
    data[172]['_active'] = False
    data[180]['_active'] = False
    data[184]['_active'] = False
    data[218]['_active'] = False

    presentation = doc.component(backdrop, {
        '__type__': script_type('MineBackdrop'), '_name': '', '_objFlags': 0,
        '_enabled': True, 'wallSegments': [ref(i) for i in segments],
        'futureSoilRoot': ref(future_root), 'wallSegmentHeight': 960,
        'cellHeight': 90, 'wallScrollRatio': 0.35,
    }, 'MineBackdrop')
    data[225].update(authoredGemNodes=[ref(i) for i in gems],
                     authoredStoneNodes=[ref(i) for i in stones], mineBackdrop=ref(presentation),
                     chilunList=[])
    output = compact(data)
    write_json(ASSETS / 'diamond/res/scene/diamond.scene', output)
    manifest_path = ROOT / 'design/deep-mining-assets.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    manifest['sceneAuthoring'] = {
        'generator': 'tools/build_deep_mining_scene.py',
        'baselineCommit': BASE_COMMIT,
        'scene': 'Cocos/assets/diamond/res/scene/diamond.scene',
        'sceneUuid': 'c83f8d0d-adcb-4c20-90e1-d526d1e63658',
        'designResolution': [720, 1280],
        'boardLogicalSize': [720, 720],
        'boardScale': SCALE,
        'boardDisplayWidth': 640,
        'workLineWorldY': work_y,
        'rowsBelowWorkLine': 2,
        'authoredGemNodes': len(gems),
        'authoredSoilNodes': len(stones),
        'futureRows': 12,
        'backgroundSegments': 3,
        'texturePackaging': 'Reusable SpriteFrames backed by the extracted PNG files',
    }
    write_json(manifest_path, manifest)
    print(json.dumps({'sceneObjects': len(output), 'authoredGems': len(gems),
                      'authoredSoil': len(stones), 'futureRows': 12,
                      'boardPixels': 720 * SCALE, 'workLineY': work_y}, ensure_ascii=False))


if __name__ == '__main__':
    build()
