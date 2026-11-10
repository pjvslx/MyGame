import { _decorator, Component, screen, UITransform } from 'cc';

const { ccclass, menu } = _decorator;

/** Scale the background to fill the canvas while preserving its aspect ratio. */
@ccclass('BackgroundAdapter')
@menu('resolution/BackgroundAdapter')
export default class BackgroundAdapter extends Component {
    onLoad() {
        const transform = this.getComponent(UITransform);
        const canvasSize = screen.windowSize;
        if (!transform?.width || !transform.height || !canvasSize.width || !canvasSize.height) {
            return;
        }

        const widthRatio = canvasSize.width / transform.width;
        const heightRatio = canvasSize.height / transform.height;
        const scale = Math.max(widthRatio, heightRatio) / Math.min(widthRatio, heightRatio);
        this.node.setScale(scale, scale, this.node.scale.z);
    }
}
