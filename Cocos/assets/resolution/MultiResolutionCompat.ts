import { _decorator, Component, ResolutionPolicy, screen, Vec2, view } from 'cc';

const { ccclass, menu } = _decorator;

@ccclass('MultiResolutionCompat')
@menu('resolution/MultiResolutionCompat')
export default class MultiResolutionCompat extends Component {
    static DEFAULT_RESOLUTION_WIDTH = 720;
    static DEFAULT_RESOLUTION_HEIGHT = 1280;

    onLoad() {
        view.setDesignResolutionSize(
            MultiResolutionCompat.DEFAULT_RESOLUTION_WIDTH,
            MultiResolutionCompat.DEFAULT_RESOLUTION_HEIGHT,
            ResolutionPolicy.SHOW_ALL,
        );
    }

    static getShowAllModeScale(): number {
        const canvasSize = screen.windowSize;
        return Math.min(
            canvasSize.width / this.DEFAULT_RESOLUTION_WIDTH,
            canvasSize.height / this.DEFAULT_RESOLUTION_HEIGHT,
        );
    }

    static getShowAllModeRealHeight(): number {
        return this.DEFAULT_RESOLUTION_HEIGHT * this.getShowAllModeScale();
    }

    static getShowAllModeRealWidth(): number {
        return this.DEFAULT_RESOLUTION_WIDTH * this.getShowAllModeScale();
    }

    static getShowAllModeVerticalBorderHeight(): number {
        return screen.windowSize.height - this.getShowAllModeRealHeight();
    }

    static getShowAllModeHorizontalBorderWidth(): number {
        return screen.windowSize.width - this.getShowAllModeRealWidth();
    }

    static getShowAllModeNodePositionCloseToBottom(nodePosInDesign: Vec2): Vec2 {
        const scale = this.getShowAllModeScale();
        const bottomBorderHeight = this.getShowAllModeVerticalBorderHeight() / 2;
        return new Vec2(nodePosInDesign.x, nodePosInDesign.y - bottomBorderHeight / scale);
    }

    static convertNodePosInDesignToNodePosInCanvas(nodePosInDesign: Vec2): Vec2 {
        const scale = this.getShowAllModeScale();
        return new Vec2(nodePosInDesign.x - scale, nodePosInDesign.y - scale);
    }

    static convertNodePosInCanvasToNodePosInDesign(nodePosInCanvas: Vec2): Vec2 {
        const scale = this.getShowAllModeScale();
        return new Vec2(nodePosInCanvas.x / scale, nodePosInCanvas.y / scale);
    }

    static convertWidthInDesignToWidthInCanvas(widthInDesign: number): number {
        return widthInDesign * this.getShowAllModeScale();
    }

    static convertWidthInCanvasToWidthInDesign(widthInCanvas: number): number {
        return widthInCanvas / this.getShowAllModeScale();
    }

    static convertHeightInDesignToHeightInCanvas(heightInDesign: number): number {
        return heightInDesign * this.getShowAllModeScale();
    }

    static convertHeightInCanvasToHeightInDesign(heightInCanvas: number): number {
        return heightInCanvas / this.getShowAllModeScale();
    }
}
