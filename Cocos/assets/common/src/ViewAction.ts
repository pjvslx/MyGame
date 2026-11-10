import { _decorator, Component, Node, tween, UIOpacity, Vec3, view } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ViewAction')
export default class ViewAction extends Component {
    @property(Node)
    actNode: Node | null = null;

    static DIRECTION = {
        RIGHT: 1,
        LEFT: 2,
        UP: 3,
        DOWN: 4,
    };

    openLock = false;
    closeLock = false;
    private readonly originScales = new WeakMap<Node, Vec3>();

    open(cb?: () => void) {
        if (this.openLock) {
            return;
        }

        const node = this.actNode ?? this.node;
        this.node.active = true;
        this.openLock = true;

        const originScale = node.scale.clone();
        this.originScales.set(node, originScale);
        node.setScale(originScale.clone().multiplyScalar(0.8));
        tween(node)
            .to(0.25, { scale: originScale }, { easing: 'backOut' })
            .delay(0.1)
            .call(() => cb?.())
            .start();
    }

    hide() {
        const node = this.actNode ?? this.node;
        this.playScaleOut(node, () => { this.node.active = false; });
    }

    close(cb?: () => void) {
        if (this.closeLock) {
            return;
        }

        this.closeLock = true;
        const node = this.actNode ?? this.node;
        const opacity = node.getComponent(UIOpacity);
        if (opacity) {
            opacity.opacity = 255;
        }
        this.playScaleOut(node, () => {
            cb?.();
            this.node.destroy();
        });
    }

    openTo(time?: number, direction?: number, cb?: () => void) {
        if (this.openLock) {
            return;
        }

        this.openLock = true;
        const node = this.actNode ?? this.node;
        const originPos = node.position.clone();
        const offset = ViewAction.getOffset(direction || ViewAction.DIRECTION.UP);
        node.setPosition(originPos.clone().add(offset));
        tween(node)
            .to(time || 0.35, { position: originPos })
            .call(() => {
                this.openLock = false;
                cb?.();
            })
            .start();
    }

    onCloseTo() {
        this.closeTo(0.35, ViewAction.DIRECTION.UP);
    }

    closeTo(time?: number, direction?: number) {
        if (this.closeLock || this.openLock) {
            return;
        }

        this.closeLock = true;
        const node = this.actNode ?? this.node;
        const offset = ViewAction.getOffset(direction || ViewAction.DIRECTION.DOWN);
        tween(node)
            .to(time || 0.5, { position: node.position.clone().add(offset) })
            .call(() => { this.node.destroy(); })
            .start();
    }

    private playScaleOut(node: Node, onComplete: () => void) {
        const originScale = this.originScales.get(node) ?? node.scale.clone();
        this.originScales.set(node, originScale);
        node.setScale(originScale);
        tween(node)
            .to(0.25, { scale: originScale.clone().multiplyScalar(0.8) }, { easing: 'backIn' })
            .call(onComplete)
            .start();
    }

    private static getOffset(direction: number): Vec3 {
        const { width, height } = view.getVisibleSize();
        switch (direction) {
            case ViewAction.DIRECTION.RIGHT:
                return new Vec3(width, 0);
            case ViewAction.DIRECTION.LEFT:
                return new Vec3(-width, 0);
            case ViewAction.DIRECTION.UP:
                return new Vec3(0, height);
            case ViewAction.DIRECTION.DOWN:
                return new Vec3(0, -height);
            default:
                return new Vec3();
        }
    }
}
