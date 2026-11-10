import { _decorator, Canvas, Component, director, instantiate, isValid, Node, Prefab, Size, UITransform, Vec2 } from 'cc';
import EventConfig from '../../../common/src/EventConfig';

const { ccclass, property } = _decorator;

@ccclass('Guide')
export default class Guide extends Component {
    @property(Prefab)
    focusPrefab: Prefab | null = null;

    @property(Prefab)
    maskPrefab: Prefab | null = null;

    @property(Prefab)
    fingerPrefab: Prefab | null = null;

    focusNode: Node | null = null;
    maskNode: Node | null = null;
    fingerNode: Node | null = null;
    focusPool: Node[] = [];

    start() {
        this.addEvent();
    }

    onDestroy() {
        this.node.off(EventConfig.EVT_DIAMOND_FOCUS_DESTROY, this.removeFocus, this);
    }

    addEvent() {
        this.node.on(EventConfig.EVT_DIAMOND_FOCUS_DESTROY, this.removeFocus, this);
    }

    showFocus(pos: Vec2, parentNode?: Node) {
        this.focusNode = this.createOverlay(this.focusPrefab, pos, parentNode);
        this.updateOverlayOrder();
    }

    showFinger(pos: Vec2, parentNode?: Node) {
        this.fingerNode = this.createOverlay(this.fingerPrefab, pos, parentNode);
        this.updateOverlayOrder();
    }

    showMask(pos: Vec2, size = new Size(), parentNode?: Node) {
        this.maskNode = this.createOverlay(this.maskPrefab, pos, parentNode);
        this.maskNode?.getChildByName('mask')?.getComponent(UITransform)?.setContentSize(size);
        this.updateOverlayOrder();
    }

    private removeFocus(node: Node) {
        const index = this.focusPool.indexOf(node);
        if (index !== -1) {
            this.focusPool.splice(index, 1);
        }
    }

    private createOverlay(prefab: Prefab | null, pos: Vec2, parentNode?: Node): Node | null {
        const parent = parentNode ?? director.getScene()?.getComponentInChildren(Canvas)?.node;
        if (!prefab || !parent) {
            return null;
        }

        const overlay = instantiate(prefab);
        parent.addChild(overlay);
        overlay.setPosition(pos.x, pos.y);
        return overlay;
    }

    private updateOverlayOrder() {
        for (const overlay of [this.maskNode, this.focusNode, this.fingerNode]) {
            if (isValid(overlay) && overlay.parent) {
                overlay.setSiblingIndex(overlay.parent.children.length - 1);
            }
        }
    }
}
