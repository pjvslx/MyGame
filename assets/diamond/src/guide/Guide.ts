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
import EventConfig = require('../../../common/src/EventConfig');
import Util = require('../../../common/src/Util');
@ccclass
class Guide extends cc.Component {
    static ZINDEX = {
        MASK : 1000,
        FOCUS : 1001,
        FINGER : 1002
    }
    @property(cc.Prefab)
    focusPrefab: cc.Prefab = null;
    @property(cc.Prefab)
    maskPrefab: cc.Prefab = null;
    @property(cc.Prefab)
    fingerPrefab: cc.Prefab = null;

    focusNode: cc.Node = null;
    maskNode: cc.Node = null;
    fingerNode: cc.Node = null;

    focusPool: cc.Node[] = [];

    start(){
        this.addEvent();
    }

    addEvent(){
        let Game = require('../../../common/src/Game');
        Game.getInstance().gNode.on(EventConfig.EVT_DIAMOND_FOCUS_DESTROY,(node:cc.Node)=>{
            let index = this.focusPool.indexOf(node);
            if(index != -1){
                this.focusPool.splice(index,1);
            }
        },this);
    }

    showFocus(pos:cc.Vec2,parentNode?:cc.Node){
        this.focusNode = cc.instantiate(this.focusPrefab);
        if(parentNode == null){
            this.focusNode.parent = cc.Canvas.instance.node;
        }else{
            this.focusNode.parent = parentNode;
        }
        this.focusNode.position = pos;
        this.focusNode.zIndex = Guide.ZINDEX.FOCUS;
    }

    showFinger(pos:cc.Vec2, parentNode?:cc.Node){
        this.fingerNode = cc.instantiate(this.fingerPrefab);
        if(parentNode == null){
            this.fingerNode.parent = cc.Canvas.instance.node;
        }else{
            this.fingerNode.parent = parentNode;
        }
        this.fingerNode.position = pos;
        this.fingerNode.zIndex = Guide.ZINDEX.FINGER;
    }

    showMask(pos:cc.Vec2, size:cc.Size = new cc.Size(0,0),parentNode?:cc.Node){
        this.maskNode = cc.instantiate(this.maskPrefab);
        if(parentNode == null){
            this.maskNode.parent = cc.Canvas.instance.node;
        }else{
            this.maskNode.parent = parentNode;
        }
        this.maskNode.position = pos;
        this.maskNode.getChildByName('mask').setContentSize(size);
        this.maskNode.zIndex = Guide.ZINDEX.MASK;
    }
}
export = Guide;