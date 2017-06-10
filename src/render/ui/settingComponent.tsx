import * as React from "react";
import * as ReactBootstrap from "react-bootstrap";

import {Rtmp} from "..";
import {RtmpEventListener} from "..";

var Form = ReactBootstrap.Form;
var FormGroup = ReactBootstrap.FormGroup;
var Navbar = ReactBootstrap.Navbar;
var Button = ReactBootstrap.Button;
var FormControl = ReactBootstrap.FormControl;

import * as electron from "electron";
var dialog = electron.remote.dialog;

export var settingComponent = (rtmp:Rtmp):any => {
  return class SettingComponent extends React.Component<{}, {}> implements RtmpEventListener {
    state = {
      sending:false,
      setting:""
    }
    constructor() {
      super();
      this._toggleSave = this._toggleSave.bind(this);
      this._openSetting = this._openSetting.bind(this);
      rtmp._setEventTarget(this);
    }
    private _toggleSave() {
      // 本体に通信して、動作開始をトリガーしなければならない。
      if(!this.state.sending) {
        if(!rtmp._publish()) {
          return;
        }
      }
      else {
        rtmp._stop();
      }
      this.setState({sending:!this.state.sending});
    }
    private _openSetting() {
      rtmp._openSetting();
    }
    public onUpdate(info:{address:string, streamName:string, audio:any, video:any}) {
      this.setState({setting: info.address + " " + info.streamName});
    }
    public render() {
      return (
        <div>
          <Navbar.Text>
            <Button onClick={this._openSetting}><span className="glyphicon glyphicon-cog" aria-hidden="true"></span></Button>
            <Button active={this.state.sending == true} onClick={this._toggleSave}><span className="glyphicon glyphicon-send" aria-hidden="true"></span></Button>
          </Navbar.Text>
          <Navbar.Text>
            {/* 設定をこの部分に反映させるようにしておく */}
            {this.state.setting}
          </Navbar.Text>
        </div>
      );
    }
  }
}