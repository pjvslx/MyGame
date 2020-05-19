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
class PuzzleEditorView extends cc.Component {
    @property(cc.Node)
    btnCreate: cc.Node = null;
    @property(cc.EditBox)
    editBoxRow: cc.EditBox = null;
    @property(cc.EditBox)
    editBoxCol: cc.EditBox = null;
    @property(cc.EditBox)
    editBoxEdge: cc.EditBox = null;
    @property(cc.Prefab)
    gridPb: cc.Prefab = null;
    @property(cc.Node)
    mapNode: cc.Node = null;
    
    gridWidth: number = 100;
    gridHeight: number = 100;
    gridMap:Array<Array<cc.Node>> = [];

    onLoad(){
        this.gridWidth = this.gridHeight = parseInt(this.editBoxEdge.string);
        this.addEvent();
    }

    addEvent(){
        this.btnCreate.on('click',()=>{
            this.handleCreateClicked();
        },this);
    }

    checkCreate(){
        if(this.editBoxCol.string == ''){
            alert('输入列数');
            return false;
        }

        if(this.editBoxRow.string == ''){
            alert('输入行数');
            return false;
        }
        return true;
    }

    handleCreateClicked(){
        if(!this.checkCreate()){
            return;
        }
        for(let row = 0; row < this.gridMap.length; row++){
            for(let col = 0; col < this.gridMap[row].length; col++){
                this.gridMap[row][col].destroy();
            }
        }
        this.gridWidth = this.gridHeight = parseInt(this.editBoxEdge.string);
        this.gridMap = [];

        let rows = parseInt(this.editBoxRow.string);
        let cols = parseInt(this.editBoxCol.string);

        let leftTopPos = cc.v2();
        leftTopPos.y = (rows - 1) * this.gridHeight / 2;
        leftTopPos.x = -(cols - 1) * this.gridWidth / 2;

        for(let row = 0; row < rows; row++){
            this.gridMap[row] = [];
            for(let col = 0; col < cols; col++){
                let grid = cc.instantiate(this.gridPb);
                grid.parent = this.mapNode;
                grid.x = leftTopPos.x + col * this.gridWidth;
                grid.y = leftTopPos.y - row * this.gridHeight;
                this.gridMap[row][col] = grid;
            }
        }

        this.mapNode.setContentSize(cols * this.gridWidth, rows * this.gridHeight);
    }

}
export = PuzzleEditorView;