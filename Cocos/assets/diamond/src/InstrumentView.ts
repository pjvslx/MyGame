import { Component, Label, Node, Vec3, _decorator, tween } from 'cc';
const { ccclass, property } = _decorator;
@ccclass('InstrumentView')
class InstrumentView extends Component {
    // LIFE-CYCLE CALLBACKS:
    @property(Label)
    valueLabel: Label = null;

    @property([Node])
    geWeiLabelList: Node[] = [];

    @property([Node])
    shiWeiLabelList: Node[] = [];

    @property([Node])
    baiweiLabelList: Node[] = [];

    value: number = 0;
    oldValue: number = 0;

    originTopPos:Vec3 = new Vec3(0,92);
    originMidPos:Vec3 = new Vec3(0,0);
    originDownPos:Vec3 = new Vec3(0,-92);

    onLoad () {
        if (this.valueLabel) {
            this.updateView();
        }
    }

    start () {

    }

    addValue(v:number){
        let value = this.value + v;
        this.setValue(value);
    }

    setValue(v:number){
        this.oldValue = this.value;
        this.value = v;
        if(this.valueLabel || this.oldValue != v){
            this.updateView();
        }
    }

    playNumerical(oldValue: number, value: number, nodeList: Node[], cb?: () => void){
        let num = (value - oldValue);
        if(num < 0){
            num += 10;
        }
        let moveTime = 0.4;
        const top = tween(nodeList[0]);
        const current = tween(nodeList[1]);

        for(let i = 1; i <= num; i++){
            let originValue = oldValue + i - 1;
            if(originValue >= 10){
                originValue -= 10;
            }
            let targetValue = originValue + 1;
            if(targetValue >= 10){
                targetValue -= 10;
            }
            top.call(() => {
                nodeList[0].getComponent(Label).string = String(targetValue);
            }).to(moveTime, { position: this.originMidPos }).call(() => {
                nodeList[0].setPosition(this.originTopPos);
            });

            current.call(() => {
                nodeList[1].getComponent(Label).string = String(originValue);
            }).to(moveTime, { position: this.originDownPos }).call(() => {
                nodeList[1].getComponent(Label).string = String(targetValue);
                nodeList[1].setPosition(this.originMidPos);
            });
        }

        top.call(() => cb?.()).start();
        if (num > 0) {
            current.start();
        }
    }

    updateView(){
        if (this.valueLabel) {
            this.valueLabel.string = `${this.value} m`;
            return;
        }
        let oldValue = this.oldValue;
        let oldB = Math.floor(oldValue / 100);
        oldValue = oldValue % 100;
        let oldS = Math.floor(oldValue / 10);
        oldValue = oldValue % 10;
        let oldG = oldValue;

        let value = this.value;
        let B = Math.floor(value / 100);
        value = value % 100;
        let S = Math.floor(value / 10);
        value = value % 10;
        let G = value;
        this.playNumerical(oldG,G,this.geWeiLabelList,()=>{
            this.playNumerical(oldS,S,this.shiWeiLabelList,()=>{
                this.playNumerical(oldB,B,this.baiweiLabelList,()=>{
                    this.animFinished();
                })
            });
        });
    }

    animFinished(){

    }
}
export default InstrumentView;
