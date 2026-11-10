import { _decorator, Component, screen, UITransform } from 'cc';

const { ccclass, menu } = _decorator;

/** Match the content bounds to the canvas when the resolution policy is SHOW_ALL. */
@ccclass('ContentAdapter')
@menu('resolution/ContentAdapter')
export default class ContentAdapter extends Component {
    onLoad() {
        const transform = this.getComponent(UITransform);
        const canvasSize = screen.windowSize;
        if (!transform?.width || !transform.height || !canvasSize.width || !canvasSize.height) {
            return;
        }

        const showAllScale = Math.min(canvasSize.width / transform.width, canvasSize.height / transform.height);
        transform.setContentSize(canvasSize.width / showAllScale, canvasSize.height / showAllScale);
    }
}
