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

export var setting = (rtmp:Rtmp) => {
  var codecsInfo = rtmp._refCodecsInfo();
  class Setting extends React.Component<{}, {}> {
    state = {
      showDialog:true,
      audioCodec: 0,
      videoCodec: 0
    }
    constructor() {
      super();
      this._close = this._close.bind(this);
      this._confirm = this._confirm.bind(this);
      this._changeAudioCodec = this._changeAudioCodec.bind(this);
      this._changeVideoCodec = this._changeVideoCodec.bind(this);
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
      // 取れてる
      if(!getData("", this.refs.address)
      || !getData("", this.refs.streamName)) {
        alert("接続サーバーが不明です");
        return;
      }
      // videoCodecを取得してみる。
      var videoCodec = {};
      var targetCodec = codecsInfo.video[this.state.videoCodec];
      Object.keys(targetCodec).forEach((key) => {
        if(targetCodec[key]["type"] != undefined) {
          // これが処理すべきもの
          videoCodec[key] = getData(targetCodec[key]["type"], this.refs["video_" + key]);
        }
        else {
          videoCodec[key] = targetCodec[key];
        }
      });
      var audioCodec = {};
      targetCodec = codecsInfo.audio[this.state.audioCodec];
      Object.keys(targetCodec).forEach((key) => {
        if(targetCodec[key]["type"] != undefined) {
          audioCodec[key] = getData(targetCodec[key]["type"], this.refs["audio_" + key]);
        }
        else {
          audioCodec[key] = targetCodec[key];
        }
      });
      rtmp._setInfo({
        address: getData("", this.refs.address),
        streamName: getData("", this.refs.streamName),
        audio: audioCodec,
        video: videoCodec
      });
      this.setState({showDialog:false});
    }
    private _changeAudioCodec(item) {
      // このタイミングでもaudioCodecの内容を更新しなければならないか・・・
      this.setState({audioCodec: item.target.value});
    }
    private _changeVideoCodec(item) {
      // こっちもこのタイミングでvideoCodecの内容を更新しなければならないか・・・
      this.setState({videoCodec: item.target.value});
    }
    public render() {
      /*
      動作としては
      アドレス設定
      stream名設定
      h264 encoder設定
      aac encoder設定
      このあたりが必要になる。
      閉じたら動作開始みたいな感じで
            <FormControl type="text" placeholder="rtmp server"/>
      */
      return (
        <Modal show={this.state.showDialog} onHide={this._close}>
          <Modal.Header closeButton>
            <Modal.Title>RtmpSetting</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
            <FormGroup controlId="formControlsSelect">
              <FormControl type="text" placeholder="address (rtmp://someRtmpServer.com/live)" ref="address"/>
              <FormControl type="text" placeholder="stream name (stream)" ref="streamName"/>
            </FormGroup>
            <FormGroup controlId="formControlsSelect">
              <ControlLabel>Video Codec</ControlLabel>
              <FormControl componentClass="select" placeholder="select" onChange={this._changeVideoCodec}>
              {
                codecsInfo.video.map((val, i) => {
                  if(i == this.state.videoCodec) {
                    return <option value={i} key={i} selected>{val.name}</option>
                  }
                  else {
                    return <option value={i} key={i}>{val.name}</option>
                  }
                })
              }
              </FormControl>
              <Col smOffset={1}>
                {/* この部分はcodecの内容に従ってつくっておく。 */}
                {
                  (() => {
                    var codec:{[any:string]:any} = codecsInfo.video[this.state.videoCodec];
                    var components = [];
                    if(!codec) {
                      return <div/>;
                    }
                    Object.keys(codec).forEach((key) => {
                      if(codec[key]["type"] != undefined) {
                        components.push({key:key, value:codec[key]}); 
                      }
                    });
                    return (
                      <div>
                        {components.map((val, i) => {
                          switch(val.value.type) {
                          case "checkbox":
                            return (
                              <Checkbox defaultChecked={val.value.value} ref={"video_" + val.key}>{val.key}</Checkbox>
                            );
                          case "select":
                            return (
                              <div>
                                <ControlLabel>{val.key}</ControlLabel>
                                <FormControl componentClass="select" placeholder="select" ref={"video_" + val.key}>
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
                                <FormControl componentClass="textarea" placeholder={val.key} defaultValue={val.value.value} ref={"video_" + val.key}/>
                              </div>
                            );
                          default:
                            return (
                              <div>
                                <ControlLabel>{val.key}</ControlLabel>
                                <FormControl type={val.value.type} defaultValue={val.value.value} placeholder={val.key} ref={"video_" + val.key}/>
                              </div>
                            );
                          }
                        })}
                      </div>);
                  })()
                }
              </Col>
            </FormGroup>
            <FormGroup controlId="formControlsSelect">
              <ControlLabel>Audio Codec</ControlLabel>
              <FormControl componentClass="select" placeholder="select" onChange={this._changeAudioCodec}>
              {
                codecsInfo.audio.map((val, i) => {
                  if(i == this.state.audioCodec) {
                    return <option value={i} key={i} selected>{val.name}</option>
                  }
                  else {
                    return <option value={i} key={i}>{val.name}</option>
                  }
                })
              }
              </FormControl>
              <Col smOffset={1}>
                {
                  (() => {
                    var codec:{[any:string]:any} = codecsInfo.audio[this.state.audioCodec];
                    var components = [];
                    if(!codec) {
                      return <div/>;
                    }
                    Object.keys(codec).forEach((key) => {
                      if(codec[key]["type"] != undefined) {
                        components.push({key:key, value:codec[key]}); 
                      }
                    });
                    return (
                      <div>
                        {components.map((val, i) => {
                          switch(val.value.type) {
                          case "checkbox":
                            return (
                              <Checkbox defaultChecked={val.value.value} ref={"audio_" + val.key}>{val.key}</Checkbox>
                            );
                          case "select":
                            return (
                              <div>
                                <ControlLabel>{val.key}</ControlLabel>
                                <FormControl componentClass="select" placeholder="select" ref={"audio_" + val.key}>
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
                                <FormControl componentClass="textarea" placeholder={val.key} defaultValue={val.value.value} ref={"audio_" + val.key}/>
                              </div>
                            );
                          default:
                            return (
                              <div>
                                <ControlLabel>{val.key}</ControlLabel>
                                <FormControl type={val.value.type} defaultValue={val.value.value} placeholder={val.key} ref={"audio_" + val.key}/>
                              </div>
                            );
                          }
                        })}
                      </div>);
                  })()
                }
              </Col>
            </FormGroup>
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
