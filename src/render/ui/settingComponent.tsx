import * as React from "react";
import * as ReactBootstrap from "react-bootstrap";

import {Rtmp} from "..";

var Form = ReactBootstrap.Form;
var FormGroup = ReactBootstrap.FormGroup;
var Navbar = ReactBootstrap.Navbar;
var Button = ReactBootstrap.Button;
var FormControl = ReactBootstrap.FormControl;

import * as electron from "electron";
var dialog = electron.remote.dialog;

export var settingComponent = (rtmp:Rtmp):any => {
  return class SettingComponent extends React.Component<{}, {}> {
    state = {sending:false}
    constructor() {
      super();
      this._toggleSave = this._toggleSave.bind(this);
      this._openSetting = this._openSetting.bind(this);
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
    public render() {
      return (
        <div>
          <Navbar.Text>
            <Button onClick={this._openSetting}><span className="glyphicon glyphicon-cog" aria-hidden="true"></span></Button>
            <Button active={this.state.sending == true} onClick={this._toggleSave}><span className="glyphicon glyphicon-send" aria-hidden="true"></span></Button>
          </Navbar.Text>
          <Navbar.Text>
            {/* ここにアドレスをいれておくことにする、転送データ量とかはなくていいか・・・ */}
            rtmp://rtmptest.com/live test
          </Navbar.Text>
        </div>
      );
    }
  }
}