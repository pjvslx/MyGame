// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

import Puzzle = require("../../unpuzzle/src/Puzzle");
import PuzzleCell = require("../../unpuzzle/src/PuzzleCell");
import MapData = require("./MapData");

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
    @property(cc.Node)
    blockTmp: cc.Node = null;       // 选择模板
    @property(cc.Prefab)
    blockPb: cc.Prefab = null;
    @property(cc.Node)
    btnSubmit: cc.Node = null;
    @property(cc.EditBox)
    editBoxPath: cc.EditBox = null;
    @property(cc.EditBox)
    editValue: cc.EditBox = null;
    
    blockTmpRow:number = 0;
    blockTmpCol:number = 0;
    gridWidth: number = 100;
    gridHeight: number = 100;
    gridMap:Array<Array<cc.Node>> = [];
    gridValueMap:Array<Array<number>> = [];
    lstColor:Array<cc.Color> = [];

    lstBlock:Array<cc.Node> = [];
    startSlotBlockIndex: number = -1;
    endSlotBlockIndex: number = -1;
    rows:number = 0;
    cols:number = 0;

    onLoad(){
        this.blockTmp.active = false;
        this.resetGridWidthHeight();
        this.addEvent();
    }
    getRndInteger(min, max) {
        return Math.floor(Math.random() * (max - min) ) + min;
    }

    getColor(index:number){
        if(!this.lstColor[index]){
            this.lstColor[index] = new cc.Color(
                this.getRndInteger(0,255),
                this.getRndInteger(0,255),
                this.getRndInteger(0,255)
            );
        }
        return this.lstColor[index];
    }

    resetGridWidthHeight(){
        this.gridWidth = this.gridHeight = parseInt(this.editBoxEdge.string);
        this.blockTmp.setContentSize(this.gridWidth,this.gridHeight);
    }

    addEvent(){
        this.btnCreate.on('click',()=>{
            this.handleCreateClicked();
        },this);

        this.btnSubmit.on('click',()=>{
            this.handleSubmitClicked();
        },this);

        this.mapNode.on(cc.Node.EventType.MOUSE_MOVE,( param )=>{
            // console.log('cc.Node.EventType.MOUSE_MOVE param = ' , param);
            this.handleMouseMove(param._x,param._y);
        },this);

        this.mapNode.on(cc.Node.EventType.TOUCH_END,(event:cc.Touch)=>{
            this.handleMapTouchEnd(event);
        },this);
    }

    transformRowColToIndex(row:number,col:number){
        return row * this.cols + col;
    }

    tranformIndexToRowAndCol(index:number){
        let row = Math.ceil((index + 1) / this.cols) - 1;
        let col = index % this.cols;
        return cc.v2(row,col);
    }

    handleMapTouchEnd(event:cc.Touch){
        let strValue = this.editValue.string;
        if(strValue == ''){
            alert('invalid value');
            return;
        }
        let value = parseInt(strValue);
        let block = cc.instantiate(this.blockPb);
        block.parent = this.mapNode;
        block.setContentSize(this.blockTmp.width,this.blockTmp.height);
        block.position = this.blockTmp.position;
        this.lstBlock.push(block);
        // let index = this.transformRowColToIndex(this.blockTmpRow,this.blockTmpCol);
        this.gridValueMap[this.blockTmpRow][this.blockTmpCol] = value;
    }

    // handleBlockCreateClicked(){
    //     let block = cc.instantiate(this.blockPb);
    //     block.parent = this.mapNode;
    //     block.setContentSize(this.blockTmp.width,this.blockTmp.height);
    //     block.position = this.blockTmp.position;
    //     this.lstBlock.push(block);
    // }

    // isStartSlotValid():boolean{
    //     return this.startSlotBlockIndex != -1;
    // }

    // isEndSlotValid():boolean{
    //     return this.endSlotBlockIndex != -1;
    // }

    // handleSlotCreateClicked(event:cc.Touch){
    //     let worldPos = event.getLocation();
    //     let nodeMapPos = this.mapNode.convertToNodeSpaceAR(worldPos);
    //     let index = -1;
    //     for(let i = 0; i < this.lstBlock.length; i++){
    //         let block = this.lstBlock[i];
    //         let rect = cc.rect(block.x - block.width/2,block.y - block.height/2,block.width,block.height);
    //         if(rect.contains(nodeMapPos)){
    //             index = i;
    //             break;
    //         }
    //     }
    //     if(!this.isStartSlotValid() && index != -1){
    //         this.startSlotBlockIndex = index;
    //         let startBlock = this.lstBlock[this.startSlotBlockIndex];
    //         startBlock.color = cc.color(255,255,0);
    //         return;
    //     }

    //     if(!this.isEndSlotValid() && index != -1){
    //         this.endSlotBlockIndex = index;
    //         let startBlock = this.lstBlock[this.startSlotBlockIndex];
    //         let endBlock = this.lstBlock[this.endSlotBlockIndex];
    //         // let startRow = startBlock.getComponent(Puz)
    //     }
    // }

    handleMouseMove(worldX,worldY){
        // if(this.radioIndex != PuzzleEditorView.SELECTED_MODEL.BLOCK){
        //     return;
        // }
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
                    this.blockTmpRow = row;
                    this.blockTmpRow = col;
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

    getEdgePos(block:cc.Node,dir:number):cc.Vec2{
        let pos = block.position;
        switch (dir) {
            case PuzzleCell.DIR.UP:
                pos.y += block.getContentSize().height / 2;
                break;
            case PuzzleCell.DIR.DOWN:
                pos.y -= block.getContentSize().height / 2; 
                break;
            case PuzzleCell.DIR.LEFT:
                pos.x -= block.getContentSize().width / 2;
                break;
            case PuzzleCell.DIR.RIGHT:
                pos.x += block.getContentSize().width / 2;
                break;
            default:
                break;
        }
        return pos;
    }

    update(){

    }

    generateMap(){
        let data:MapData = {
        };
        data.row = this.rows;
        data.col = this.cols;
        for(let i = 0; i < this.rows; i++){
            for(let j = 0; j < this.cols; j++){
                data.units.push(this.gridValueMap[i][j]);
            }
        }
        let str = JSON.stringify(data);
        console.log(`str = ` + str);
    }

    handleSubmitClicked(){
        this.generateMap();
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
        for(let i = 0; i < this.lstBlock.length; i++){
            this.lstBlock[i].destroy();
        }
        this.lstBlock = [];
        this.resetGridWidthHeight();
        this.gridMap = [];
        this.gridValueMap = [];

        this.rows = parseInt(this.editBoxRow.string);
        this.cols = parseInt(this.editBoxCol.string);

        let leftTopPos = cc.v2();
        leftTopPos.y = (this.rows - 1) * this.gridHeight / 2;
        leftTopPos.x = -(this.cols - 1) * this.gridWidth / 2;

        for(let row = 0; row < this.rows; row++){
            this.gridMap[row] = [];
            this.gridValueMap[row] = [];
            for(let col = 0; col < this.cols; col++){
                let grid = cc.instantiate(this.gridPb);
                grid.parent = this.mapNode;
                grid.width = this.gridWidth;
                grid.height = this.gridHeight;
                grid.x = leftTopPos.x + col * this.gridWidth;
                grid.y = leftTopPos.y - row * this.gridHeight;
                this.gridMap[row][col] = grid;
                this.gridValueMap[row][col] = 0;
            }
        }
        this.mapNode.setContentSize(this.cols * this.gridWidth, this.rows * this.gridHeight);
    }

}
export = PuzzleEditorView;