import { _decorator, Component, Node, director, sys } from 'cc';
import Util from './Util';
import type DiamondGame from '../../diamond/src/DiamondGame';
import type Player from '../../diamond/src/Player';
import type Share from './Share';
import type AdManager from './AdManager';
import NetworkManager from './NetworkManager';
import type Guide from '../../diamond/src/guide/Guide';
import type Pregame from '../../diamond/src/Pregame';
import DiamondConfig from '../../diamond/src/DiamondConfig';

const { ccclass } = _decorator;

// var num = 100

// var num2 = num.toString("2")  //  "1100100"

// var num8 = num.toString("8")  // "144"
// var num16 = num.toString("16")  // "64"

// console.log( parseInt(num2,2) )  2转10进制输出: 100

// console.log( parseInt(num8 , 8) )  8转10进制: 100
// console.log( parseInt(num16 , 16) )  16转10进制: 100

@ccclass('Game')
export default class Game extends Component {
    diamond: DiamondGame = null;
    player: Player = null;
    network: NetworkManager = null;
    guide: Guide = null;
    pregame: Pregame = null;
    private static _instance: Game = null;

    gNode:Node = null;

    isPreloadScene: boolean = false;
    lastPreloadSceneName: string = '';
    addOnPreloadFunc: Function = null;

    isLoadScene: boolean = false;
    lastLoadSceneName: string = '';
    addOnLoadFunc: Function = null;

    maxGold: number = 0;
    share: Share = null;
    adManager: AdManager = null;

    static getInstance() {
        return this._instance;
    }

    onLoad(){
        // debug.setDisplayStats(true);
        this.gNode = this.node;
        director.addPersistRootNode(this.node);
        Game._instance = this;
        // Resolve the serialized components without importing scripts that depend on Game.
        this.diamond = this.node.getComponent<DiamondGame>('DiamondGame');
        this.player = this.node.getComponent<Player>('Player');
        this.share = this.node.getComponent<Share>('Share');
        this.adManager = this.node.getComponent<AdManager>('AdManager');
        this.network = this.node.addComponent(NetworkManager);
        this.guide = this.node.getComponent<Guide>('Guide');
        this.pregame = this.node.getComponent<Pregame>('Pregame');
        this.initRemoteConfig();
        // this.diamond.show();
        director.loadScene('start');
        this.addException();
    }

    initRemoteConfig(){
        this.network.get(NetworkManager.HTTPS_URL + 'config/config.json',[],(res)=>{
            if(res == false){
                return;
            }
            for(let k in res){
                console.log(`k = ${k} v = ${res[k]}`);
                DiamondConfig.remoteConfig[k] = res[k];
            }
        });
    }

    addException(){
        if(sys.isBrowser) {
            window.onerror = function (errorMessage, file, line, message, error) {
                let exception = {};
                exception['errorMessage'] = errorMessage;
                exception['file'] = file;
                exception['line'] = line;
                exception['message'] = message;
                exception['error'] = error;
                if (window['exception'] != JSON.stringify(exception)) {
                    window['exception'] = JSON.stringify(exception);
                    Util.showToast('js error');
                }
            };
        }
    }

    preloadScene(sceneName:string,onProgressCb:Function,onLaunchCb:Function){
        this.lastPreloadSceneName = sceneName;
        this.isPreloadScene = true;
        director.preloadScene(sceneName, (completeCount: number,totalCount: number)=>{
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
        director.loadScene(sceneName,()=>{
            if(onLaunchCb){
                onLaunchCb();
            }
            this.lastLoadSceneName = '';
            this.isLoadScene = false;
        });
    }

    isShareHide(){
        return DiamondConfig.remoteConfig.isShareHide;
    }
}
