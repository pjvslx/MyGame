import { _decorator, Component, UITransform } from 'cc';

const { ccclass, menu, property } = _decorator;

@ccclass('CloseToBorderComponent')
@menu('resolution/CloseToBorderComponent')
export default class CloseToBorderComponent extends Component {
    @property({ tooltip: '是否紧贴下方，不能和紧贴上方同时使用' })
    closeToBottom = false;

    @property({ tooltip: '距离下方的距离（px），开启紧贴下方时使用' })
    marginBottomInPx = 0;

    onLoad() {
        if (!this.closeToBottom) {
            return;
        }

        const transform = this.getComponent(UITransform);
        const parentTransform = this.node.parent?.getComponent(UITransform);
        if (!transform || !parentTransform) {
            return;
        }

        const { x, z } = this.node.position;
        const bottomY = -parentTransform.anchorY * parentTransform.height;
        this.node.setPosition(x, bottomY + transform.anchorY * transform.height + this.marginBottomInPx, z);
    }
}
