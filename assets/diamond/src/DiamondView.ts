// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, menu, property} = cc._decorator;
import Game = require('../../common/src/Game');
import MapCreator = require('./MapCreator');
import Diamond = require('./Diamond');
@ccclass
@menu('diamond/DiamondView')
class DiamondView extends cc.Component {
    @property(cc.Prefab)
    diamondPrefab: cc.Prefab = null;

    @property(cc.Node)
    contentNode: cc.Node = null;

    onLoad(){
        // Game.getInstance().diamo
        console.log('DiamondView onLoad');
        let cellList = [1,2,3,4,5];
        let map = MapCreator.createMap(8,8,cellList);
        console.log(JSON.stringify(map));
        let contentSize = this.contentNode.getContentSize();
        for(let i = 0; i < map.length; i++){
            let diamond = cc.instantiate(this.diamondPrefab);
            diamond.parent = this.contentNode;
            let pos = MapCreator.get_row_and_col_by_index(i);
            let row = pos.x;
            let col = pos.y;
            diamond.x = col * Diamond.SIZE.width + Diamond.SIZE.width/2 - contentSize.width/2;
            diamond.y = row * Diamond.SIZE.height + Diamond.SIZE.height/2 - contentSize.height/2;
            diamond.getComponent(Diamond).setDiamondId(map[i]);
        }
    }
}
export = DiamondView;
