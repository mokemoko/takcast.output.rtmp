// 設定ダイアログ
import * as React          from "react";
import * as ReactDOM       from "react-dom";
import * as ReactBootstrap from "react-bootstrap";

import {Rtmp} from "..";

var Modal = ReactBootstrap.Modal;
var Button = ReactBootstrap.Button;
var Form = ReactBootstrap.Form;
var FormGroup = ReactBootstrap.FormGroup;
var FormControl = ReactBootstrap.FormControl;
var ControlLabel = ReactBootstrap.ControlLabel;
var Panel = ReactBootstrap.Panel;
var Col = ReactBootstrap.Col;
var Checkbox = ReactBootstrap.Checkbox;

// これちょっと調整しないとね・・・ややこしい感じになってる。
export var setting = (rtmp:Rtmp) => {
  var codecsInfo = rtmp._refCodecsInfo();
  var targetInfo = rtmp._refTargetInfo();
  class CodecSetting extends React.Component<{title:string,codecList:any[],codec:any}, {}> {
    state = {codec: 0}
    private targetComponents:any[];
    constructor() {
      super();
      this._changeCodec = this._changeCodec.bind(this);
      this.targetComponents = [];
    }
    private _changeCodec(item) {
      this.setState({codec: item.target.value});
    }
    public getData() {
      var getData = (target, ref) => {
        switch(target) {
        case "checkbox":
          return ReactDOM.findDOMNode(ref).getElementsByTagName("input")[0].checked;
        case "select":
          var r = ReactDOM.findDOMNode(ref) as HTMLSelectElement;
          return r.children[r.value].innerText;
        default:
          return (ReactDOM.findDOMNode(ref) as any).value;
        }
      };
      var codec = {};
      var targetCodec = this.props.codecList[this.state.codec];
      Object.keys(targetCodec).forEach((key) => {
        if(targetCodec[key]["type"] != undefined) {
          // これが処理すべきもの
          codec[key] = getData(targetCodec[key]["type"], this.refs[key]);
        }
        else {
          codec[key] = targetCodec[key];
        }
      });
      console.log(codec);
      return codec;
    }
    public render() {
      return (
        <FormGroup>
          {(()=> {
            // 適当な場所であらかじめ表示に利用するデータの抽出を実施しておく。
            // 本当はカッコ悪いから、関数で実行したいけど
            // 初期化時のイベントの走らせ方がよくわからないので、とりあえず
            // タイトルのところに乗せておく
            var codec = this.props.codecList[this.state.codec];
            if(codec) {
              this.targetComponents = [];
              Object.keys(codec).forEach((key) => {
                if(codec[key]["type"] != undefined) {
                  this.targetComponents.push({key:key, value:codec[key]}); 
                }
              });
            }
            return <ControlLabel>{this.props.title}</ControlLabel>
          })()}
          <FormControl componentClass="select" onChange={this._changeCodec}>
            {
              this.props.codecList.map((val, i) => {
                if(i == this.state.codec) {
                  return <option value={i} key={i} selected>{val.name}</option>
                }
                else {
                  return <option value={i} key={i}>{val.name}</option>
                }
              })
            }
          </FormControl>
          <Col smOffset={1}>
          {/* あとは要素に従って表示していけばOKだが・・・ */}
            {
              this.targetComponents.map((val, i) => {
                switch(val.value.type) {
                case "checkbox":
                  return (
                    <Checkbox defaultChecked={val.value.value} ref={val.key}>{val.key}</Checkbox>
                  );
                case "select":
                  return (
                    <div>
                      <ControlLabel>{val.key}</ControlLabel>
                      <FormControl componentClass="select" placeholder="select" ref={val.key}>
                        {val.value.values.map((item, i) => {
                          if(item == val.value.value) {
                            return <option value={i} key={i} selected>{item}</option>
                          }
                          else {
                            return <option value={i} key={i}>{item}</option>
                          }
                        })}
                      </FormControl>
                    </div>
                  );
                case "textarea":
                  return (
                    <div>
                      <ControlLabel>{val.key}</ControlLabel>
                      <FormControl componentClass="textarea" placeholder={val.key} defaultValue={val.value.value} ref={val.key}/>
                    </div>
                  );
                default:
                  return (
                    <div>
                      <ControlLabel>{val.key}</ControlLabel>
                      <FormControl type={val.value.type} defaultValue={val.value.value} placeholder={val.key} ref={val.key}/>
                    </div>
                  );
                }
              })
            }
          </Col>
        </FormGroup>
      );
    }
  }
  // あとはこのtargetInfoからaudioCodecとvideoCodecの情報も復元可能にすれば、OK
  class Setting extends React.Component<{}, {}> {
    state = {showDialog:true}
    constructor() {
      super();
      this._close = this._close.bind(this);
      this._confirm = this._confirm.bind(this);
    }
    public _close() {
      this.setState({showDialog:false});
    }
    public _confirm() {
      var getData = (target, ref) => {
        switch(target) {
        case "checkbox":
          return ReactDOM.findDOMNode(ref).getElementsByTagName("input")[0].checked;
        case "select":
          var r = ReactDOM.findDOMNode(ref) as HTMLSelectElement;
          return r.children[r.value].innerText;
        default:
          return (ReactDOM.findDOMNode(ref) as any).value;
        }
      };
      var address = (ReactDOM.findDOMNode(this.refs.address) as HTMLInputElement).value;
      var streamName = (ReactDOM.findDOMNode(this.refs.streamName) as HTMLInputElement).value;
      if(!address || !streamName) {
        alert("接続サーバーが不明です");
        return;
      }
      rtmp._setInfo({
        address: address,
        streamName: streamName,
        audio: (this.refs.audioCodec as CodecSetting).getData(),
        video: (this.refs.videoCodec as CodecSetting).getData()
      });
      this.setState({showDialog:false});
    }
    public render() {
      return (
        <Modal show={this.state.showDialog} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>RtmpSetting</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
            <FormGroup>
              <FormControl type="text" placeholder="address (rtmp://someRtmpServer.com/live)" ref="address" defaultValue={targetInfo.address}/>
              <FormControl type="text" placeholder="stream name (stream)" ref="streamName" defaultValue={targetInfo.streamName}/>
            </FormGroup>
            <CodecSetting ref="videoCodec" title="Video Codec" codecList={codecsInfo.video} codec={targetInfo.video}/>
            <CodecSetting ref="audioCodec" title="Audio Codec" codecList={codecsInfo.audio} codec={targetInfo.audio}/>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            {/* 設定の保存ボタンとかつくるとややこしくなるので、勝手に保存しようと思う */}
            <Button onClick={this._confirm}><span className="glyphicon glyphicon-wrench" aria-hidden="true"></span></Button>
          </Modal.Footer>
        </Modal>
      )
    }
  }
  ReactDOM.render(
    <Setting />,
    document.getElementById("dialog")
  );
}
