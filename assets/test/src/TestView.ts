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
class TestView extends cc.Component {
    @property(cc.Node)
    btnCreateNode: cc.Node = null;

    @property(cc.Node)
    btnCancelNode: cc.Node = null;

    bgjNodeList: cc.Node[] = [];

    onLoad(){
        this.btnCreateNode.on('click',()=>{
            cc.loader.loadRes('test/prefab/bgj',cc.Prefab,(error,resource)=>{
                console.log('error = ' + error);
                console.log(resource);
                let node = cc.instantiate(resource);
                console.log(node);
                node.parent = cc.Canvas.instance.node;
                this.bgjNodeList.push(node);
            });
        },this);

        this.btnCancelNode.on('click',()=>{
            for(let i = 0; i < this.bgjNodeList.length; i++){
                this.bgjNodeList[i].destroy();
            }
            cc.loader.releaseRes('test/prefab/bgj');
            cc.loader.releaseResDir('test/anim');

            // let res = cc.loader.getRes('test/prefab/bgj');
            // let deps = cc.loader.getDependsRecursively(res);
            // cc.loader.release(deps);
        },this);
    }
}
