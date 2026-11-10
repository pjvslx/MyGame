import { _decorator, Component, director } from 'cc';
const { ccclass } = _decorator;

@ccclass('Module')
export default class Module extends Component {
    root : any = null;
    sceneName : string = '';
    public static currentModule:Module = null;

    public show(cb?:any){
        director.loadScene(this.sceneName, (error) => {
            if (error) {
                console.error(error);
                return;
            }
            this.onSceneLaunched();
            Module.currentModule = this;
            if(cb){
                cb();
            }
        });
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
