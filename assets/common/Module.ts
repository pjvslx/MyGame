// Learn TypeScript:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;
@ccclass
class Module extends cc.Component {
    root : any = null;
    sceneName : string = '';
    public static currentModule:Module = null;

    public show(cb?:any){
        let game = require('./Game');
        game.getInstance().loadScene(this.sceneName,function(){
            this.onSceneLaunched();
            Module.currentModule = this;
            if(cb){
                cb();
            }
        }.bind(this));
    }

    public setRootView(value){
        this.root = value;
    }

    public getRootView(){
        return this.root;
    }

    public isCurrentModule():boolean{
        return Module.currentModule == this;
    }

    onSceneLaunched(){
        
    }
}

export = Module;