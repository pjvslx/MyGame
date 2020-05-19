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
    static SELECTED_MODEL = {
        BLOCK : 0
    }
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
    @property(cc.ToggleContainer)
    toggleContainer: cc.ToggleContainer = null;
    @property(cc.Node)
    blockTmp: cc.Node = null;       // 选择模板
    
    gridWidth: number = 100;
    gridHeight: number = 100;
    gridMap:Array<Array<cc.Node>> = [];
    radioIndex:number = 0;

    onLoad(){
        this.blockTmp.active = false;
        this.resetGridWidthHeight();
        this.addEvent();
    }

    resetGridWidthHeight(){
        this.gridWidth = this.gridHeight = parseInt(this.editBoxEdge.string);
        this.blockTmp.setContentSize(this.gridWidth,this.gridHeight);
    }

    addEvent(){
        this.btnCreate.on('click',()=>{
            this.handleCreateClicked();
        },this);

        this.mapNode.on(cc.Node.EventType.MOUSE_MOVE,( param )=>{
            // console.log('cc.Node.EventType.MOUSE_MOVE param = ' , param);
            this.handleMouseMove(param._x,param._y);
        },this);
    }

    handleMouseMove(worldX,worldY){
        if(this.radioIndex != PuzzleEditorView.SELECTED_MODEL.BLOCK){
            return;
        }
        // console.log('worldX = ' + worldX + ' worldY = ' + worldY);
        let nodeMapPos = this.mapNode.convertToNodeSpaceAR(cc.v2(worldX,worldY));
        // console.log('nodeMapPos.x = ' + nodeMapPos.x + ' nodeMapPos.y = ' + nodeMapPos.y);
        let exist = false;
        for(let row = 0; row < this.gridMap.length; row++){
            for(let col = 0; col < this.gridMap[row].length; col++){
                let grid = this.gridMap[row][col];
                let rect = cc.rect(grid.x - grid.width/2,grid.y - grid.height/2,grid.width,grid.height);
                if(rect.contains(nodeMapPos)){
                    this.blockTmp.active = true;
                    this.blockTmp.position = grid.position;
                    exist = true;
                    break;
                }
            }
        }
        if(!exist){
            this.blockTmp.active = false;
        }
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

    update(){

    }

    handleRadioClicked(toggle){
        // alert('toggle name = ' + this.toggleContainer.toggleItems.indexOf(toggle));
        this.radioIndex = this.toggleContainer.toggleItems.indexOf(toggle);
        this.blockTmp.active = (this.radioIndex == PuzzleEditorView.SELECTED_MODEL.BLOCK);
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
        this.resetGridWidthHeight();
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
                grid.width = this.gridWidth;
                grid.height = this.gridHeight;
                grid.x = leftTopPos.x + col * this.gridWidth;
                grid.y = leftTopPos.y - row * this.gridHeight;
                this.gridMap[row][col] = grid;
            }
        }
        // this.mapNode.scaleX = this.gridWidth / 100;
        // this.mapNode.scaleY = this.gridHeight / 100;
        this.mapNode.setContentSize(cols * this.gridWidth, rows * this.gridHeight);
    }

}
export = PuzzleEditorView;