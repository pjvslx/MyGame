// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
class InstrumentView extends cc.Component {
    // LIFE-CYCLE CALLBACKS:
    @property(cc.Node)
    geWeiLabelList: cc.Node[] = [];

    @property(cc.Node)
    shiWeiLabelList: cc.Node[] = [];

    @property(cc.Node)
    baiweiLabelList: cc.Node[] = [];

    value: number = 0;
    oldValue: number = 0;

    originTopPos:cc.Vec2 = new cc.Vec2(0,92);
    originMidPos:cc.Vec2 = new cc.Vec2(0,0);
    originDownPos:cc.Vec2 = new cc.Vec2(0,-92);

    onLoad () {

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
        if(this.oldValue != v){
            this.updateView();
        }
    }

    playNumerical(oldValue,value,nodeList,cb?){
        let num = (value - oldValue);
        if(num < 0){
            num += 10;
        }
        let moveTime = 0.4;
        let actionList1 = [];
        let actionList2 = [];

        for(let i = 1; i <= num; i++){
            let originValue = oldValue + i - 1;
            if(originValue >= 10){
                originValue -= 10;
            }
            let targetValue = originValue + 1;
            if(targetValue >= 10){
                targetValue -= 10;
            }
            let cb1 = cc.callFunc(()=>{
                nodeList[0].getComponent(cc.Label).string = `${targetValue}`;
            });
            let move1 = cc.moveTo(moveTime,this.originMidPos);
            let cbFinished1 = cc.callFunc(()=>{
                nodeList[0].position = this.originTopPos;
            });
            let cb2 = cc.callFunc(()=>{
                nodeList[1].getComponent(cc.Label).string = `${originValue}`;
            });
            let move2 = cc.moveTo(moveTime,this.originDownPos);
            let cbFinished2 = cc.callFunc(()=>{
                nodeList[1].getComponent(cc.Label).string = `${targetValue}`;
                nodeList[1].position = this.originMidPos;
            });
            actionList1.push(cb1);
            actionList1.push(move1);
            actionList1.push(cbFinished1);

            actionList2.push(cb2);
            actionList2.push(move2);
            actionList2.push(cbFinished2);
        }

        while(actionList1.length <= 1){
            actionList1.push(cc.callFunc(()=>{}));
        }

        while(actionList2.length <= 1){
            actionList2.push(cc.callFunc(()=>{}))
        }

        if(cb != null){
            actionList1.push(cc.callFunc(cb));
        }

        nodeList[0].runAction(cc.sequence(actionList1));
        nodeList[1].runAction(cc.sequence(actionList2));
    } 

    updateView(){
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
export = InstrumentView;
