import { _decorator, Component, screen, UITransform, view, Widget } from 'cc';

const { ccclass, menu } = _decorator;

/** Match the content bounds to the canvas when the resolution policy is SHOW_ALL. */
@ccclass('ContentAdapter')
@menu('resolution/ContentAdapter')
export default class ContentAdapter extends Component {
    private designWidth = 0;
    private designHeight = 0;

    onLoad() {
        const transform = this.getComponent(UITransform);
        this.designWidth = transform?.width ?? 0;
        this.designHeight = transform?.height ?? 0;
        this.resizeToWindow();
    }

    onEnable() {
        view.on('canvas-resize', this.resizeToWindow, this);
    }

    onDisable() {
        view.off('canvas-resize', this.resizeToWindow, this);
    }

    private resizeToWindow() {
        const transform = this.getComponent(UITransform);
        const canvasSize = screen.windowSize;
        if (!transform || !this.designWidth || !this.designHeight || !canvasSize.width || !canvasSize.height) {
            return;
        }

        const showAllScale = Math.min(canvasSize.width / this.designWidth, canvasSize.height / this.designHeight);
        transform.setContentSize(canvasSize.width / showAllScale, canvasSize.height / showAllScale);
        for (const widget of this.node.getComponentsInChildren(Widget)) {
            widget.updateAlignment();
        }
    }
}
