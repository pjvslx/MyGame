import { _decorator, Component, Node, Tween, tween, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('MineBackdrop')
export default class MineBackdrop extends Component {
    @property([Node])
    wallSegments: Node[] = [];

    @property(Node)
    futureSoilRoot: Node = null;

    @property
    wallSegmentHeight = 960;

    @property
    cellHeight = 90;

    @property
    wallScrollRatio = 0.35;

    private futureSoilOrigin = new Vec3();

    onLoad() {
        if (this.futureSoilRoot) {
            this.futureSoilOrigin.set(this.futureSoilRoot.position);
        }
    }

    advance(rows: number, duration: number): void {
        if (!Number.isFinite(rows) || rows <= 0) {
            return;
        }

        const soil = this.futureSoilRoot;
        const worldCellHeight = this.cellHeight * (soil?.worldScale.y ?? this.node.worldScale.y);
        for (const segment of this.wallSegments) {
            Tween.stopAllByTarget(segment);
            const parentScale = segment.parent?.worldScale.y ?? 1;
            const offset = rows * worldCellHeight * this.wallScrollRatio / parentScale;
            const position = segment.position;
            tween(segment)
                .to(duration, { position: new Vec3(position.x, position.y + offset, position.z) }, {
                    easing: 'quintOut',
                    onUpdate: () => this.wrapWall(segment),
                })
                .call(() => this.wrapWall(segment))
                .start();
        }

        if (soil) {
            Tween.stopAllByTarget(soil);
            soil.setPosition(this.futureSoilOrigin);
            const rowNodes = soil.children.slice();
            const topY = rowNodes.reduce((highest, row) => Math.max(highest, row.position.y), -Infinity);
            const rowSpan = rowNodes.length * this.cellHeight;
            const offset = rows * this.cellHeight;
            const target = this.futureSoilOrigin.clone();
            target.y += offset;
            tween(soil)
                .to(duration, { position: target }, { easing: 'quintOut' })
                .call(() => {
                    for (const row of rowNodes) {
                        const position = row.position;
                        let y = position.y + offset;
                        if (y > topY) {
                            y -= Math.ceil((y - topY) / rowSpan) * rowSpan;
                        }
                        row.setPosition(position.x, y, position.z);
                    }
                    soil.setPosition(this.futureSoilOrigin);
                })
                .start();
        }
    }

    onDisable() {
        for (const segment of this.wallSegments) {
            Tween.stopAllByTarget(segment);
        }
        if (this.futureSoilRoot) {
            Tween.stopAllByTarget(this.futureSoilRoot);
            this.futureSoilRoot.setPosition(this.futureSoilOrigin);
        }
    }

    private wrapWall(segment: Node): void {
        const height = this.wallSegmentHeight;
        const cycleHeight = height * this.wallSegments.length;
        const upperBoundary = cycleHeight / 2;
        if (cycleHeight > 0 && segment.position.y >= upperBoundary) {
            const position = segment.position;
            const y = (position.y + upperBoundary) % cycleHeight - upperBoundary;
            segment.setPosition(position.x, y, position.z);
        }
    }
}
