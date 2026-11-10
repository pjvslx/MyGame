import { _decorator, Component, screen, UITransform } from 'cc';

const { ccclass, menu } = _decorator;

/** Stretch the content to the canvas when the resolution policy is SHOW_ALL. */
@ccclass('ContentScaleAdapter')
@menu('resolution/ContentScaleAdapter')
export default class ContentScaleAdapter extends Component {
    onLoad() {
        const transform = this.getComponent(UITransform);
        const canvasSize = screen.windowSize;
        if (!transform?.width || !transform.height || !canvasSize.width || !canvasSize.height) {
            return;
        }

        const widthRatio = canvasSize.width / transform.width;
        const heightRatio = canvasSize.height / transform.height;
        const showAllScale = Math.min(widthRatio, heightRatio);
        this.node.setScale(widthRatio / showAllScale, heightRatio / showAllScale, this.node.scale.z);
    }
}
