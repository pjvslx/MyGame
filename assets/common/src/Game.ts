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

import Puzzle = require('../../unpuzzle/src/Puzzle');

@ccclass
class Game extends cc.Component {
    puzzle:Puzzle = null;
    private static _instance: Game = null;

    gNode:cc.Node = null;

    isPreloadScene: boolean = false;
    lastPreloadSceneName: string = '';
    addOnPreloadFunc: Function = null;

    isLoadScene: boolean = false;
    lastLoadSceneName: string = '';
    addOnLoadFunc: Function = null;

    static getInstance() {
        return this._instance;
    }

    onLoad(){
        this.gNode = this.node;
        cc.game.addPersistRootNode(this.node);
        Game._instance = this;
        this.puzzle = this.node.addComponent(Puzzle);
        this.puzzle.initMissionData();
        this.puzzle.show();
    }

    preloadScene(sceneName:string,onProgressCb:Function,onLaunchCb:Function){
        this.lastPreloadSceneName = sceneName;
        this.isPreloadScene = true;
        cc.director.preloadScene(sceneName, (completeCount: number,totalCount: number)=>{
            if(onProgressCb){
                onProgressCb(completeCount,totalCount);
            }
        }, () => {
            this.isPreloadScene = false;
            this.lastLoadSceneName = '';
            if(onLaunchCb){
                onLaunchCb();
            }
            if(this.addOnPreloadFunc){
                this.addOnPreloadFunc();
                this.addOnPreloadFunc = null;
            }
        });
    }

    loadScene(sceneName:string,onLaunchCb:Function){
        this.lastLoadSceneName = sceneName;
        this.isLoadScene = true;
        cc.director.loadScene(sceneName,()=>{
            if(onLaunchCb){
                onLaunchCb();
            }
            this.lastLoadSceneName = '';
            this.isLoadScene = false;
        });
    }
}

export = Game;